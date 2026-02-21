# Pitfalls Research

**Domain:** Blog view counts (Upstash Redis) and reading time for a statically-generated Next.js 16 blog
**Researched:** 2026-02-21
**Confidence:** HIGH (verified against Next.js official docs, Upstash official docs, Vercel blog, and community implementations)

## Critical Pitfalls

### Pitfall 1: Accidentally Opting the Entire Blog Post Page Out of Static Generation

**What goes wrong:**
The blog post page (`/blog/[slug]/page.tsx`) is currently fully static via `generateStaticParams()`. Adding a server-side `fetch()` or direct Redis call to retrieve view counts inside the page component causes Next.js to detect dynamic data access and either error ("cannot use dynamic API in a statically generated page") or silently switch the entire page to dynamic rendering. Build times increase, TTFB degrades, and you lose the performance characteristics that make the site fast.

**Why it happens:**
Developers naturally think "I need view counts on this page, so I'll fetch them in the page component." In the App Router, any uncached async data access inside a page or layout marks the route as dynamic. This is especially confusing because `generateStaticParams()` is still present -- it looks like the page should be static, but the runtime fetch overrides it. The Vercel blog explicitly calls this out as a [common mistake](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them).

**How to avoid:**
Keep the page component fully static. Fetch view counts from a **client component** that calls the API route after mount. The page renders instantly from the static shell, and the view count fills in asynchronously. This is the pattern used by the [Upstash official view counter tutorial](https://upstash.com/blog/nextjs13-approuter-view-counter): a `ReportView` client component that fires a POST on mount, and the view count is displayed from a separate client-side fetch.

**Warning signs:**
- `next build` output shows the blog post route as `lambda` or `server` instead of `static`
- Build logs mention "Dynamic server usage" for blog routes
- TTFB on blog posts increases from ~50ms to ~200ms+

**Phase to address:**
Phase 1 (API route + client component architecture). Get the boundary between static page and dynamic view count right from the start.

---

### Pitfall 2: GET Route Handler Caching Returns Stale View Counts

**What goes wrong:**
A `GET` Route Handler in the App Router is **cached by default** and prerendered at build time. If you create `GET /api/views/[slug]` to return view counts, it gets cached during `next build` with a count of 0 and never updates. Every visitor sees "0 views" (or whatever count existed at build time) until the next deploy.

**Why it happens:**
This is a Next.js App Router behavior that surprises developers coming from Pages Router API routes (which were always dynamic). The [official docs](https://nextjs.org/docs/app/getting-started/route-handlers) state: "Route Handlers are not cached by default. You can, however, opt into caching for GET methods." But the nuance is that GET handlers **without** dynamic functions like `cookies()`, `headers()`, or a `dynamic` export are treated as static during build. Developers create a GET handler, test it in dev (where it works because dev mode is always dynamic), then deploy and find it frozen.

**How to avoid:**
Two options, depending on architecture:

1. **Use `export const dynamic = 'force-dynamic'`** on the GET route handler so it always runs at request time
2. **Skip the GET handler entirely** -- have the POST handler (which increments the view) also return the current count, and fetch the initial count client-side from the same POST endpoint with a `read-only` flag, or use a single POST that both increments and returns

Option 1 is simpler and more conventional. The route is lightweight (single Redis GET), so dynamic rendering adds negligible latency.

**Warning signs:**
- View counts never change after deploy
- View counts work in `npm run dev` but not in production
- Build output shows the API route as "static" (circle icon)

**Phase to address:**
Phase 1 (API route creation). Must be configured correctly on day one.

---

### Pitfall 3: Link Prefetching Inflates View Counts

**What goes wrong:**
Next.js `<Link>` prefetches routes when they enter the viewport. The blog listing page (`/blog`) shows multiple post cards, each with a `<Link>` to the post. If the view count increment happens server-side (via the page component or middleware), prefetching silently triggers the increment for every visible post card -- even posts the user never clicks. A single visit to `/blog` inflates counts for 3-10 posts simultaneously.

**Why it happens:**
Prefetching is enabled by default on `<Link>`. In production, Next.js prefetches the page data for linked routes. If the view increment logic runs as part of the server-rendered page (or in middleware that matches the route), the prefetch request triggers it. The [Upstash blog](https://upstash.com/blog/nextjs13-approuter-view-counter) does not warn about this because their implementation uses a client-side `ReportView` component that only fires when the page actually mounts -- but if you deviate from that pattern, prefetch inflation is a trap.

**How to avoid:**
**Never increment view counts server-side in the page component or in middleware.** Use a dedicated client component (`ViewCounter`) that calls the API route via `useEffect` after mount. Prefetch loads the static HTML shell but does not execute client-side `useEffect` hooks, so the counter only fires when a user actually navigates to the page.

**Warning signs:**
- View counts are suspiciously high relative to actual traffic
- Posts on the first screen of `/blog` have disproportionately higher counts
- View count for a post increases when you only visit `/blog` without clicking the post

**Phase to address:**
Phase 1 (architecture). The increment trigger location is a foundational decision.

---

### Pitfall 4: Exposing Redis Credentials to the Client

**What goes wrong:**
Developers prefix Upstash Redis environment variables with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN`) so they can use them in client components, inadvertently exposing the Redis token in the browser. Anyone can view source, extract the token, and read/write/delete arbitrary keys in your Redis database.

**Why it happens:**
The view counter client component needs to talk to Redis. The instinct is "I need the Redis URL in my client component." But the whole point of the API route is to be the intermediary. Client components should call `/api/views`, which calls Redis server-side. The [Next.js docs on data security](https://nextjs.org/docs/app/guides/data-security) explicitly warn about this pattern.

**How to avoid:**
- Redis credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) must **never** have the `NEXT_PUBLIC_` prefix
- Initialize Redis only in server-side code (`lib/redis.ts` imported only by route handlers)
- Client components call the API route (`/api/views/[slug]`), never Redis directly
- Add a `.env.example` file documenting correct variable names without the `NEXT_PUBLIC_` prefix

**Warning signs:**
- `NEXT_PUBLIC_UPSTASH` appearing in any `.env` file
- Redis import appearing in any file with `'use client'`
- Browser network tab showing direct requests to `*.upstash.io`

**Phase to address:**
Phase 1 (environment setup). Verify in code review before first deploy.

---

### Pitfall 5: No View Deduplication -- Refresh Spam Inflates Counts

**What goes wrong:**
A naive `INCR pageviews:slug` on every API call means refreshing the page 50 times adds 50 views. A single curious user (or a bot) can make a post appear viral. Counts become meaningless as a signal.

**Why it happens:**
`INCR` is the simplest Redis pattern and appears in many tutorials. It is atomic and fast, which makes it feel correct. But it counts *page loads*, not *unique visitors*. The distinction matters for any metric displayed publicly.

**How to avoid:**
Use the Upstash-recommended deduplication pattern:

1. Hash the visitor's IP with SHA-256 for privacy
2. Use `SET dedupe:{hash}:{slug} 1 NX EX 86400` (set only if not exists, expire after 24 hours)
3. Only call `INCR pageviews:{slug}` if the SET succeeded (meaning this is a new visitor for this slug in the last 24h)

This uses 2 Redis commands per view instead of 1, but provides meaningful counts. The 24-hour window is a reasonable balance -- the same person reading a post twice in a day counts once, but a return visit the next day counts again.

**Warning signs:**
- View counts spike when you test by refreshing
- Single IP addresses generating dozens of views per post
- View counts seem disproportionately high vs. site analytics

**Phase to address:**
Phase 1 (API route implementation). Deduplication must be in the first implementation, not bolted on later.

---

### Pitfall 6: Layout Shift (CLS) When View Count Loads Asynchronously

**What goes wrong:**
The view count loads after the page renders (client-side fetch). If the count element has no reserved space, the number appearing pushes surrounding content down, causing a visible layout shift. On the blog listing page, multiple counts loading at different times creates a "popcorn" effect where cards jump around.

**Why it happens:**
The statically-rendered page ships with the reading time, date, and tags. The view count is the one piece of dynamic data that appears later. Developers add a `{views && <span>{views} views</span>}` conditional that creates/removes a DOM element, shifting layout. This is especially visible on this site because the post metadata line uses flexbox with `gap` -- adding an element changes the row's width and potentially wraps.

**How to avoid:**
- Always render the view count container in the static HTML, even before data loads
- Use a fixed-width placeholder or skeleton (e.g., `---` or a small pulsing bar) that matches the final element size
- On the blog listing page, consider **not** showing view counts at all (only on the detail page) to avoid N concurrent fetches on load
- If showing counts on the listing, use a single batch API call (`/api/views` returning all slugs) instead of N individual calls

**Warning signs:**
- CLS score increases after adding view counts (check with Lighthouse)
- Text shifting visible on page load, especially on slower connections
- Conditional rendering (`{views && ...}`) instead of always-present containers

**Phase to address:**
Phase 2 (UI integration). After the API route works, the display strategy needs careful layout treatment.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip deduplication, use raw INCR | Simpler API route (1 Redis command) | Meaningless counts, easy to game | Never for public-facing counts |
| Fetch views inside server component | No client component needed | Entire page becomes dynamic, TTFB degrades, loses SSG | Never for this site's architecture |
| Individual fetch per post on listing page | Simple per-card component | N API calls on `/blog` load, slow, hits Redis quota | Acceptable with <5 posts, problematic at 10+ |
| Hardcode reading time WPM | No configuration needed | Can't tune for different content types (code-heavy vs. prose) | Acceptable if Velite's default (200 WPM) is sufficient |
| Skip IP hashing, store raw IPs | Simpler dedup logic | Privacy concern, potential GDPR issue, unnecessary PII storage | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Upstash Redis | Using `@vercel/kv` (deprecated for new projects) | Use `@upstash/redis` directly -- Vercel KV is no longer available for new projects, Upstash is the recommended path |
| Upstash Redis | Calling Redis from client components | Only call Redis from route handlers or server actions; client components call the API route |
| Upstash Redis | Not using `Redis.fromEnv()` | Use `Redis.fromEnv()` which auto-reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` |
| Vercel deployment | Forgetting to add env vars to Vercel project settings | Redis works in dev with `.env.local` but fails in production without Vercel env var configuration |
| Velite readingTime | Re-implementing reading time instead of using built-in | Velite's `s.metadata()` already computes `readingTime` -- the codebase already uses it in the transform step and displays it |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 API calls on blog listing | Slow listing page, N concurrent requests to `/api/views/[slug]` | Batch endpoint: `GET /api/views` returns `{ [slug]: count }` for all posts | At 10+ posts, noticeable at 20+ |
| No Redis connection reuse | Cold start latency on every API call | `@upstash/redis` uses HTTP (REST), not TCP -- no connection pool needed, but avoid creating new `Redis()` instances per request; use a module-level singleton | Not a bottleneck with REST-based Upstash, but bad habit |
| Fetching views on every page navigation | Excessive API calls, quota consumption | Cache view counts client-side with SWR or simple state; don't re-fetch on back navigation | At scale with many users navigating between posts |
| Upstash free tier quota exhaustion | API returns errors, view counts stop updating | Free tier: 500K commands/month (~16K/day). At 2 commands per view (dedup + incr), supports ~8K views/day. For a personal blog, this is more than sufficient. Monitor via Upstash dashboard | At ~250K monthly page views |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `NEXT_PUBLIC_` prefix on Redis credentials | Full Redis access from any browser, data deletion, injection | Never prefix Redis vars with `NEXT_PUBLIC_`; only access in server code |
| No rate limiting on the POST endpoint | Bot can spam millions of increments, exhaust Redis quota | Add basic rate limiting: IP-based cooldown (the dedup pattern partially handles this) |
| Trusting `x-forwarded-for` header without validation | IP spoofing to bypass deduplication | On Vercel, use the request's IP from `request.headers.get('x-forwarded-for')` which Vercel sets reliably; don't accept arbitrary header values in other environments |
| Storing raw IP addresses | GDPR/privacy violation, unnecessary PII | Hash IPs with SHA-256 before storing as dedup keys; the hash is sufficient for deduplication |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "0 views" while loading | Feels broken, misleading count | Show a subtle placeholder (e.g., `--` or a small skeleton pulse) until the real count loads |
| Showing exact low numbers ("2 views") | Draws attention to low engagement, looks sad on new posts | Consider a minimum threshold (e.g., only show counts above 10) or show all counts honestly -- for a personal blog, authenticity is fine |
| View count flashing from 0 to N | Jarring visual update, draws unnecessary attention | Fade in the count or use a number transition; or simply render the count element as invisible until data arrives, then fade to visible |
| Reading time showing "0 min read" | Broken for very short posts or posts with only code | Velite's `s.metadata()` returns `readingTime` in minutes; clamp to minimum 1 with `Math.max(1, readingTime)` |
| Inconsistent metadata between listing and detail | Listing shows views but detail doesn't (or vice versa) | Decide: views on both pages or detail-only. Recommendation: views on detail page only (avoids batch fetch complexity) |

## "Looks Done But Isn't" Checklist

- [ ] **View counter:** Works after deploy, not just in dev -- verify `next build && next start` locally before deploying
- [ ] **View counter:** Handles missing/undefined slug gracefully -- API route returns 400, not a Redis error
- [ ] **View counter:** Deduplication actually works -- test by refreshing; count should increment only once per 24h window
- [ ] **View counter:** Bot/crawler traffic filtered -- check that Googlebot visits don't inflate counts
- [ ] **View counter:** Works with ad blockers -- some ad blockers block requests to `/api/` paths; ensure the page renders correctly even if the view count fetch fails
- [ ] **Reading time:** Already works -- Velite `s.metadata().readingTime` is already computed and displayed in `post-card.tsx` and `[slug]/page.tsx`. The existing `readingTime: data.metadata.readingTime` transform in `velite.config.ts` handles this. No new work needed unless changing the display format.
- [ ] **Environment variables:** Configured in Vercel project settings, not just in `.env.local`
- [ ] **Error handling:** API route returns graceful error (not 500) if Redis is unreachable; page renders without view count rather than crashing
- [ ] **Layout stability:** View count placeholder reserves space; no CLS when count loads

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Static page became dynamic | LOW | Move Redis call out of page component into client component; no data migration needed |
| Redis credentials exposed | MEDIUM | Rotate tokens immediately in Upstash console, update Vercel env vars, redeploy. Check Redis for unauthorized writes. |
| Inflated view counts (no dedup) | LOW | Add dedup logic, optionally reset counters. For a personal blog, slightly inflated historical counts are harmless. |
| GET handler cached at build time | LOW | Add `export const dynamic = 'force-dynamic'` to the route handler, redeploy |
| CLS from view count loading | LOW | Add fixed-width placeholder element, CSS-only fix, no architecture change |
| Free tier quota exhausted | LOW | Upstash pauses writes but data persists. Upgrade to pay-as-you-go ($0.20/100K requests) or optimize command usage. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Static-to-dynamic page regression | Phase 1: API + Architecture | `next build` output shows blog routes as static (circle icon) |
| GET handler caching stale counts | Phase 1: API route creation | Test in production: increment count, verify GET returns updated value |
| Link prefetch inflating counts | Phase 1: Client component design | Visit `/blog` listing, verify no POST calls fire for visible post links |
| Redis credential exposure | Phase 1: Environment setup | Search codebase for `NEXT_PUBLIC_UPSTASH`; inspect browser network tab |
| No deduplication | Phase 1: API implementation | Refresh a post 10 times; verify count increments only once |
| Layout shift on count load | Phase 2: UI integration | Run Lighthouse on blog post page; CLS should remain < 0.1 |
| Reading time edge cases | Phase 1: Velite integration check | Verify `readingTime` already works (it does); only add `Math.max(1, ...)` clamping if needed |
| Batch fetch for listing page | Phase 2: Blog listing integration | If showing counts on listing, verify single API call fetches all counts |
| Ad blocker resilience | Phase 2: Error handling | Test with uBlock Origin enabled; page should render normally without view count |
| Bot traffic inflation | Phase 2: Hardening | Check user-agent filtering in API route; verify Googlebot doesn't increment |

## Sources

- [Upstash: Adding a View Counter to your Next.js Blog](https://upstash.com/blog/nextjs13-approuter-view-counter) -- official implementation guide with dedup pattern
- [Vercel: Common Mistakes with the Next.js App Router](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) -- GET handler caching, unnecessary route handlers, revalidation
- [Next.js: Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) -- caching behavior, dynamic config
- [Next.js: Data Security](https://nextjs.org/docs/app/guides/data-security) -- environment variable exposure warnings
- [Next.js: Prefetching](https://nextjs.org/docs/app/guides/prefetching) -- Link prefetch behavior
- [Upstash: Pricing & Limits](https://upstash.com/docs/redis/overall/pricing) -- free tier: 500K commands/month, 256MB storage
- [Vercel Community: KV Daily Request Limit](https://community.vercel.com/t/kv-daily-request-limit/1512) -- quota exhaustion patterns
- [Vercel Community: Switching from Vercel KV to Upstash](https://community.vercel.com/t/switching-from-vercel-kv-to-upstash-kv-questions/2660) -- @vercel/kv deprecated for new projects
- [Next.js: Resolving Static to Dynamic Error](https://nextjs.org/docs/messages/app-static-to-dynamic-error) -- why uncached fetches break SSG

---
*Pitfalls research for: Blog view counts + reading time (keech.dev v1.4)*
*Researched: 2026-02-21*
