# Project Research Summary

**Project:** Blog Stats — View Count Tracking and Reading Time Display
**Domain:** Next.js serverless blog with Redis-backed view counters
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

This milestone adds blog statistics to keech.dev: public view counts backed by Upstash Redis, and reading time display. The key finding that changes the scope: **reading time is already fully implemented.** Velite's `s.metadata()` computes reading time at build time, and both `post-card.tsx` and `[slug]/page.tsx` already display it. The actual work in v1.4 is entirely about view counts — the first backend integration, the first API route, and the first runtime data fetching in what has been a 100% static site.

The recommended approach is a thin dynamic layer on top of the static foundation. Pages remain statically generated via `generateStaticParams()`. A small `'use client'` component (`ViewCounter`) mounts after hydration and fires a POST to `/api/views/[slug]`, which increments a Redis counter via `redis.incr()` and returns the new count. Reading the count and incrementing happen in a single round trip. On the blog listing page, view counts are fetched via GET (no increment). The only new dependency is `@upstash/redis` — HTTP/REST-based, serverless-compatible, and the Vercel-recommended replacement for the now-sunset `@vercel/kv`.

The primary risk is accidentally converting static pages to dynamic by fetching view counts inside server components. This degrades TTFB from ~50ms (CDN) to ~200ms+ (server render) and defeats the purpose of static generation. The mitigation is clear: the view count increment must live in a client component that fires after hydration — never in the page server component. Link prefetch inflation (Next.js prefetching triggering view increments) is avoided by the same pattern, since `useEffect` hooks do not run during prefetch. IP-based deduplication with a 24h TTL using `SET NX EX 86400` prevents refresh spam from inflating counts.

## Key Findings

### Recommended Stack

One new dependency: `@upstash/redis@^1.36.2`. This is an HTTP/REST Redis client that uses `fetch()` under the hood — no TCP connections, no connection pooling, compatible with Vercel serverless and Edge Runtime. `@vercel/kv` is deprecated for new projects as of December 2024 and must not be used. The Vercel Marketplace Upstash integration auto-provisions the required environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). `Redis.fromEnv()` reads both automatically.

Redis key pattern: `pageviews:posts:{slug}` for view counts, `deduplicate:{hash(ip)}:{slug}` for deduplication. The free tier (500K commands/month, 256MB) is more than sufficient for a personal blog.

**Core technologies:**
- `@upstash/redis@^1.36.2`: Persistent view count storage — the only serverless-compatible Redis client; uses HTTP not TCP, no connection management
- Next.js Route Handlers (built-in): `app/api/views/[slug]/route.ts` for GET (fetch count) and POST (increment + return count) — no new package required
- React 19 `useEffect` (built-in): Fire-and-forget view tracking from client component after hydration
- Velite `s.metadata()` (existing, already configured): Reading time computation — already complete, zero new work required

### Expected Features

**Must have (table stakes):**
- View count displayed on individual post page — inline with existing date/reading time metadata
- View count increments on page visit — POST from client component on mount, returns new count
- IP-based deduplication (24h TTL) — prevents refresh spam; 2 Redis commands instead of 1, hash IPs with SHA-256, never store raw IPs
- View count persistence across deploys — Upstash Redis is external to Vercel build lifecycle
- Reading time on post cards and post page — already done, zero new work required

**Should have (competitive advantage):**
- Suspense streaming with static shell — post content serves from CDN instantly, view count streams in; avoids making the page fully dynamic
- Neobrutalist view counter styling — `Eye` icon from Lucide (already in use), `text-muted` treatment matching existing metadata row
- Number formatting with locale awareness — `toLocaleString()` for commas; optional `formatViews()` for K/M suffixes at scale
- View count on blog listing cards — batch fetch via GET (no increment) to avoid N+1 requests

**Defer (v2+):**
- Sort by popularity toggle — only meaningful with 10+ posts (currently 3)
- View count in Open Graph metadata — polish after counts are meaningful
- Engagement features (likes/reactions) — separate milestone requiring session management
- Admin analytics dashboard — use Vercel Analytics instead; don't rebuild it

### Architecture Approach

The architecture preserves the static foundation by treating view counts as a "dynamic island." Pages keep `generateStaticParams()` for full static generation. A `'use client'` `ViewCounter` component (the 7th in the project) mounts after hydration and communicates with a Route Handler, which is the only component that touches Redis directly. The Route Handler must export `dynamic = 'force-dynamic'` on the GET method to prevent Next.js from caching it at build time — a common App Router pitfall where GET handlers get prerendered with counts frozen at 0.

**Major components:**
1. `src/lib/redis.ts` — Upstash Redis client singleton (`Redis.fromEnv()`), imported only by server-side code
2. `src/app/api/views/[slug]/route.ts` — Route Handler; POST increments and returns count, GET returns count without incrementing
3. `src/components/blog/view-counter.tsx` — `'use client'` component; POSTs on mount with `track` prop, GET-only for listing page display; graceful degradation if API fails
4. `src/app/blog/[slug]/page.tsx` — Modified to render `<ViewCounter slug={post.slug} track />` in the metadata row (page stays static)
5. `src/app/blog/page.tsx` — Modified to show view counts on post cards; uses GET to read counts without inflating them

### Critical Pitfalls

1. **Static-to-dynamic page regression** — Adding a server-side Redis call inside the page component silently converts the page from static (CDN, ~50ms) to dynamic (server render, ~200ms+). Avoid by keeping all Redis access in the Route Handler, reached only via the client component's `fetch()`.

2. **GET Route Handler cached at build time** — In Next.js App Router, GET handlers without dynamic function calls get prerendered at build time. View counts freeze at their build-time values (0 for new posts). Fix: `export const dynamic = 'force-dynamic'` on the route handler from day one.

3. **Link prefetch inflating view counts** — Next.js prefetches linked routes in the viewport. If increment logic runs server-side, visiting `/blog` inflates counts for every visible post. The client component pattern (`useEffect` on mount) is the correct mitigation: prefetch loads the static shell but never executes `useEffect`.

4. **Redis credentials exposed to client** — Never prefix Upstash env vars with `NEXT_PUBLIC_`. Client components must call `/api/views/[slug]`, not Upstash directly. Redis import belongs only in `lib/redis.ts`, which is server-only.

5. **No deduplication — refresh spam inflates counts** — Raw `INCR` on every POST call means refreshing 50 times adds 50 views. Use `SET deduplicate:{hash(ip)}:{slug} 1 NX EX 86400` before `INCR`; only increment if the SET succeeds. Hash IPs with SHA-256 — never store raw IPs.

6. **Layout shift (CLS) when view count loads** — A conditional `{views && <span>}` that adds/removes a DOM node shifts surrounding content. Always render the count container in static HTML with a fixed-width placeholder (e.g., `--`) that reserves space.

## Implications for Roadmap

Based on combined research, the work decomposes into a clear dependency chain. The suggested phase structure follows the build order identified in ARCHITECTURE.md, extended with the polish and listing considerations from FEATURES.md and PITFALLS.md.

### Phase 1: Infrastructure and API
**Rationale:** The Route Handler and Redis client are blockers for all other work. No UI can be built until these work and are verified with `curl`. This phase has zero risk to existing pages since it only adds new files.
**Delivers:** A working `/api/views/[slug]` endpoint (GET + POST with deduplication) and a Redis client singleton. Locally testable before any UI is touched.
**Addresses:** Redis setup, API route, IP deduplication, key schema, credential security
**Avoids:** GET handler caching (force-dynamic from day one), credential exposure (server-only from day one)

### Phase 2: Post Page Integration
**Rationale:** The individual post page is simpler than the listing page (one slug, one counter) and is the primary use case. Prove the full stack works here before extending to the listing.
**Delivers:** View count displayed inline with reading time and date on `/blog/[slug]`. Counter increments on visit. Page remains statically generated.
**Addresses:** View count display on post page, client-side increment trigger, static shell preservation, Suspense fallback for no-flash loading
**Avoids:** Static-to-dynamic regression (client component pattern), prefetch inflation, layout shift (placeholder element always present)

### Phase 3: Blog Listing Integration
**Rationale:** Listing page has extra complexity — N posts need counts fetched without incrementing any of them, and N concurrent API calls should be avoided. Address after the post page pattern is proven.
**Delivers:** View counts on all post cards in `/blog`. Uses GET (not POST) to fetch counts without inflating them. Batch fetching via `redis.mget()` to avoid N+1 requests at scale.
**Addresses:** View count on listing page, GET vs POST distinction, batch fetch strategy
**Avoids:** Listing page inflating counts (GET-only mode), N+1 API calls as post count grows

### Phase 4: Polish and Hardening
**Rationale:** Apply finish after the data pipeline is working end-to-end. These items improve UX and resilience but do not block functionality.
**Delivers:** Number formatting (locale-aware commas), graceful ad blocker degradation, CLS verification with Lighthouse, error handling when Redis is unreachable, reading time clamping (`Math.max(1, readingTime)`) if needed.
**Addresses:** Number formatting utility, error handling, placeholder UX, edge cases
**Avoids:** Jarring number flash, broken page on Redis downtime, CLS regression

### Phase Ordering Rationale

- **Infrastructure first:** All phases depend on Phase 1. Nothing is testable without the Redis connection and Route Handler.
- **Post page before listing:** The listing adds the GET vs POST distinction and N+1 complexity. Phase 2 isolates the core pattern before adding that complexity.
- **Polish last:** UX refinements (formatting, CLS, error handling) require the full pipeline to be functional for meaningful testing.
- **Dependency chain:** Upstash Redis setup -> Route Handler -> Client Component -> Post Page Integration -> Listing Integration -> Polish. Each step depends on the previous.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1:** Well-documented. Upstash official docs, Next.js Route Handler docs, and the official Upstash tutorial all agree on the implementation. `Redis.fromEnv()`, `redis.incr()`, `SET NX EX`, `force-dynamic` are all verified patterns with HIGH confidence sources.
- **Phase 2:** Standard client component / static island pattern. The Upstash blog tutorial demonstrates the exact approach. No novel decisions.
- **Phase 3:** GET vs POST distinction and `redis.mget()` for batch fetching are standard Redis patterns with no ambiguity.
- **Phase 4:** Pure polish — no research needed.

No phases require deeper research. All patterns are well-documented with official sources at HIGH confidence.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions verified against official Upstash docs, Vercel storage docs, npm registry. `@vercel/kv` deprecation confirmed by multiple sources including GitHub issues and Vercel community discussions. |
| Features | HIGH | Reading time confirmed by direct codebase inspection (lines cited in velite.config.ts, post-card.tsx, page.tsx). View count patterns verified against official Upstash tutorial and Vercel's portfolio template. |
| Architecture | HIGH | Route Handler caching behavior verified against Next.js 15 changelog and official docs. Static island pattern confirmed by Vercel's own App Router guide and "Common App Router Mistakes" post. |
| Pitfalls | HIGH | All 6 critical pitfalls verified against official sources: Vercel's App Router mistakes post, Next.js caching docs, Upstash dedup tutorial, Next.js data security guide. |

**Overall confidence:** HIGH

### Gaps to Address

- **Deduplication with `x-forwarded-for` reliability:** Vercel sets this header reliably, but the research notes a caveat about trusting it in non-Vercel environments. Since this site is Vercel-only, no gap exists. Document in code comments.
- **View counts on listing — scope call:** Research presents two valid positions — listing views add social proof but introduce GET fetch complexity. With only 3 posts currently, individual GETs are acceptable. The key schema (`pageviews:posts:{slug}`) supports `MGET` without refactoring if needed later. Roadmapper may choose to defer Phase 3 to a follow-on if scope needs trimming.
- **Whether to show counts on listing at all:** A defensible v1.4 scope is view counts on the post page only (Phases 1-2 + 4), deferring the listing to v1.4.1. Flag this as an explicit decision point in the roadmap.

## Sources

### Primary (HIGH confidence)
- [Upstash Redis TypeScript SDK](https://upstash.com/docs/redis/sdks/ts/getstarted) — `Redis.fromEnv()`, env var names, installation
- [Upstash Vercel Integration docs](https://upstash.com/docs/redis/howto/vercelintegration) — auto-provisioned env vars, Vercel Marketplace setup
- [Upstash Blog: Adding a View Counter to Next.js](https://upstash.com/blog/nextjs13-approuter-view-counter) — IP dedup pattern, INCR, client component reporter pattern
- [Vercel Storage docs — Redis on Vercel](https://vercel.com/docs/redis) — Vercel KV sunset confirmed, Upstash Marketplace as replacement
- [Next.js Route Handlers docs](https://nextjs.org/docs/app/getting-started/route-handlers) — caching behavior, force-dynamic, Web standard Request/Response
- [Vercel: Common App Router Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) — static-to-dynamic pitfall, GET handler caching trap
- [Next.js Data Security guide](https://nextjs.org/docs/app/guides/data-security) — environment variable exposure warnings, NEXT_PUBLIC_ risks
- [Upstash Pricing](https://upstash.com/docs/redis/overall/pricing) — free tier: 500K commands/month, 256MB
- Codebase analysis: `velite.config.ts`, `src/app/blog/[slug]/page.tsx`, `src/app/blog/page.tsx`, `src/components/blog/post-card.tsx` — reading time already implemented (verified line numbers)

### Secondary (MEDIUM confidence)
- [Scastiel: View counter with React Server Components](https://scastiel.dev/view-counter-react-server-components) — async server component display pattern
- [Josh Comeau: How I Built My Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog/) — hit counter and like button design reference
- [Lee Robinson: Real-Time Blog Post Views](https://leerob.com/blog/real-time-post-views) — original Next.js view counter pattern (now redirects to GitHub)
- [Vercel Community: Switching from Vercel KV to Upstash](https://community.vercel.com/t/switching-from-vercel-kv-to-upstash-kv-questions/2660) — migration path confirmation
- [Vercel: Next.js Portfolio Pageview Counter Template](https://vercel.com/templates/next.js/nextjs-portfolio-pageview-counter) — official template demonstrating pattern

### Tertiary (supporting)
- [Vercel Storage GitHub Issue #829](https://github.com/vercel/storage/issues/829) — Vercel KV documentation removal and deprecation timeline
- [npm: @upstash/redis](https://www.npmjs.com/package/@upstash/redis) — version 1.36.2, published Feb 2026

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
