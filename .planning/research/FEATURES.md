# Feature Research

**Domain:** Blog stats -- view counts and reading time for keech.dev
**Researched:** 2026-02-21
**Confidence:** HIGH -- well-established patterns with extensive community precedent; reading time already implemented in codebase

## Feature Landscape

### Table Stakes (Users Expect These)

Features that blog readers and developer portfolio visitors assume exist when they see "X views" and "Y min read" metadata. Missing any of these creates a broken or amateurish impression.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Reading time on post cards (blog listing) | ALREADY IMPLEMENTED. `PostCard` component shows `{post.readingTime} min read` on every card. Velite computes this at build time via `s.metadata()`. Zero work needed. | DONE | `velite.config.ts` line 26: `readingTime: data.metadata.readingTime`. PostCard line 41: `{post.readingTime} min read`. |
| Reading time on individual post page | ALREADY IMPLEMENTED. Post page header shows `{post.readingTime} min read` inline with date and updated time. | DONE | `src/app/blog/[slug]/page.tsx` line 88: `{post.readingTime} min read`. |
| View count displayed on individual post page | When a blog advertises view counts, users expect to see the count on the post they're reading. Standard position: inline with date and reading time metadata, separated by a dot/bullet. Format: "1,234 views". | LOW | Server component fetches count from Redis. Display as `<span>{views.toLocaleString()} views</span>` in the existing metadata row alongside date, reading time, and updated date. |
| View count displayed on blog listing cards | If post pages show views, the listing page should too. Social proof drives click-through -- users gravitate toward posts with higher counts. | LOW | Pass view counts to `PostCard`. The tricky part: the blog listing page is currently fully static. Adding view counts requires either making it dynamic or using a client component for just the count. |
| View count increments on page visit | The counter must actually count. One visit = one increment. Users don't see this directly, but stale or stuck counts undermine trust. | MEDIUM | API route (POST `/api/views/[slug]`) increments Redis counter via `redis.incr()`. Called from a client component's `useEffect` on mount. This is the site's first API route and first client-side fetch -- a meaningful architectural shift from "zero runtime data fetching." |
| View count persistence across deploys | Counts must survive redeployments. A counter that resets to zero on every deploy is worse than no counter. | LOW | Upstash Redis is external to Vercel's build/deploy lifecycle. Data persists independently. No migration or backup concerns at this scale. |
| Reasonable accuracy (not obviously wrong) | If a post shows "2 views" after being linked on Twitter, users notice. Counts don't need to be perfect, but they can't be laughably wrong. | MEDIUM | IP-based deduplication with a 24h TTL prevents the same visitor from inflating counts within a session. Hash the IP (never store raw IPs) + slug as a Redis key with `NX` + `EX 86400`. Only increment if the dedup key was successfully set. |

### Differentiators (Competitive Advantage)

Features that elevate beyond basic "number next to title." These signal engineering craft and attention to detail.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Streaming view count with Suspense fallback | The post page remains fully static (fast TTFB) while the view count streams in via React Suspense. Users see the post content instantly; the view count appears a beat later. No loading spinner, no layout shift -- the count slot is reserved in the metadata line. This is a textbook PPR (Partial Pre-Rendering) use case in Next.js 16. | MEDIUM | Wrap the `ViewCount` server component in `<Suspense fallback={<span>-- views</span>}>`. The static shell (title, content, reading time) serves immediately from CDN. The view count resolves server-side and streams into the page. No client JS needed for display. |
| Neobrutalist view counter styling | The view count and reading time aren't plain text -- they match the site's bold visual identity. A small eye icon or tally mark prefix, consistent with the 3px borders and hard shadows elsewhere. | LOW | Use an existing Lucide icon (`Eye` or `Clock`) at 14-16px inline with the text. Keep it monochrome to match the `text-muted` treatment of the existing date display. No new design system -- extend the existing metadata row styling. |
| Number formatting with locale awareness | "1234 views" vs "1,234 views". At scale, "12.3K views" reads better than "12,345 views". | LOW | `toLocaleString()` for comma formatting. Consider a `formatViews(n)` utility: under 1,000 show exact, over 1,000 show "1.2K", over 1M show "1.2M". Simple but polished. |
| Sorted by popularity option | "Sort by views" alongside the default date sort on the blog listing. Lets readers find the most-read content. | MEDIUM | Requires fetching all view counts on the listing page. Could be a client-side toggle that re-sorts the already-fetched data. Deferred -- only valuable once there are enough posts (10+) to make sorting meaningful. Currently only 3 posts. |
| View count in Open Graph / SEO metadata | "This post has been read 5,000 times" in the OG description adds social proof when shared on Twitter/LinkedIn. | LOW | Append view count to the dynamically generated `description` in `generateMetadata()`. Requires the page to be dynamically rendered (which it will be once view counts are added). |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for a personal developer blog at this scale.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time live updating view count | "Watch the number go up in real-time!" Feels dynamic and engaging. | Requires WebSocket or polling, adds significant client-side complexity, and is entirely pointless for a personal blog with single-digit concurrent readers. The count updating live in front of you has zero value when it changes once every few hours. Creates unnecessary Redis connections. | Fetch count once on page load (server-side). If a user visits twice in the same day, they'll see the count changed. That's sufficient. |
| "Like" or "clap" button alongside view count | Medium-style engagement. Lets readers express appreciation beyond just visiting. | Introduces identity/session management complexity (how many likes per user?), creates a moderation surface (bot likes), and dilutes the clean metadata line. Josh Comeau does this well, but it's a feature unto itself -- not a v1.4 scope item. | Defer entirely. If engagement features are desired later, build as a separate milestone with proper session management. |
| Full analytics dashboard | "Show me traffic over time, referrers, geographic distribution." A private admin panel with charts. | This is reinventing Vercel Analytics or Plausible. The view counter's purpose is social proof for readers, not analytics for the author. Building a dashboard is a multi-sprint effort that duplicates existing free tools. | Use Vercel Analytics (free tier) for author-facing metrics. The public view counter serves a different purpose: reader-facing social proof. |
| Google Analytics or third-party tracking pixel | "Just add GA4, it does everything." Comprehensive analytics with zero custom code. | Privacy concerns, GDPR compliance burden, cookie banners, performance impact (GA4 script is ~28KB), and it doesn't solve the public display problem -- GA4 data isn't exposed to readers. Fundamentally different goal than a public view counter. | Upstash Redis counter for public display. If author wants private analytics, Vercel Analytics (first-party, no cookie banner needed) or Plausible (privacy-focused). |
| Unique visitor counting (fingerprinting) | "Show unique visitors, not just page views." More accurate representation of audience size. | Browser fingerprinting is ethically questionable and technically unreliable. Canvas fingerprinting, WebGL hashing, and similar techniques are being actively blocked by browsers. IP hashing with TTL provides "good enough" deduplication without crossing ethical lines. | IP-hash deduplication with 24h TTL. Not unique visitors, but "deduplicated views per 24h period." Close enough for social proof purposes without fingerprinting. |
| View count for draft/unpublished posts | "Track views even during preview." | Draft posts should not be publicly accessible. If they are accessed via direct URL during development, those views are noise -- not real reader engagement. Incrementing counts during development pollutes the data. | Only increment for published (non-draft) posts. The API route should validate the slug exists in the published post list before incrementing. Or simply: only call the increment endpoint from the production post page component. |
| Client-side only view counter (localStorage/cookies) | "No backend needed! Just count in the browser." | Data is per-device, not aggregated. Different visitors can't see each other's contributions. Clearing cookies resets the count. This isn't a view counter -- it's a visit tracker for a single user. Completely fails the social proof goal. | Server-side counter with Redis. The entire point is aggregated, shared, persistent data. |

## Feature Dependencies

```
[Upstash Redis setup + API route]
    +-- required by --> [View count increment on visit]
    +-- required by --> [View count display on post page]
                            +-- enhances --> [View count display on blog listing]
                            +-- enhances --> [Suspense streaming fallback]

[View count display on post page]
    +-- enhances --> [View count in OG metadata]

[Reading time on post cards]  <-- ALREADY DONE
[Reading time on post page]   <-- ALREADY DONE

[Number formatting utility]
    +-- enhances --> [View count display on post page]
    +-- enhances --> [View count display on blog listing]

[IP deduplication]
    +-- enhances --> [View count increment on visit]
```

### Dependency Notes

- **Reading time is fully complete:** Both the blog listing PostCard and individual post page already show `{post.readingTime} min read`. Velite's `s.metadata()` computes word count and reading time at build time. This feature requires ZERO new work.
- **Upstash Redis is the foundation:** The API route, view count display, and deduplication all depend on a working Redis connection. This is the first thing to set up and verify.
- **API route must exist before display:** You can't show what you can't fetch. The POST route for incrementing and the GET route (or direct server-side fetch) for reading must both work before any UI displays counts.
- **Blog listing display depends on post page display:** Get it working on one page first, then extend to the listing. The listing page has additional complexity (fetching counts for multiple posts vs. one).
- **Suspense streaming enhances but doesn't block:** The view count can initially render synchronously (making the page dynamic). Suspense streaming is an optimization that preserves static shell performance -- worth doing but not blocking for launch.
- **IP deduplication enhances accuracy but doesn't block functionality:** The counter works without deduplication. Add it in the same API route implementation, but if it proves complex, ship without it first and add it immediately after.

## MVP Definition

### Launch With (v1.4.0)

Minimum viable blog stats -- public view counts appear on blog posts.

- [ ] **Upstash Redis connection** -- Create Upstash database via Vercel Marketplace, configure environment variables, verify connection from a route handler.
- [ ] **API route for view count increment** -- `POST /api/views/[slug]` calls `redis.incr(`views:${slug}`)`. Returns the new count. Basic IP-hash deduplication with 24h TTL.
- [ ] **View count display on post page** -- Inline with existing metadata (date, reading time, updated date). Server component fetches count directly from Redis. Wrapped in Suspense with a `-- views` fallback to preserve static shell performance.
- [ ] **Client-side increment trigger** -- Small `'use client'` component that calls `POST /api/views/[slug]` via `useEffect` on mount. Fire-and-forget (don't block rendering on the response).
- [ ] **View count display on blog listing** -- Each `PostCard` shows the view count alongside reading time. Fetch all counts in the listing page server component with `redis.mget()` or a pipeline.

### Add After Validation (v1.4.x)

Features to add once the core view counting pipeline is proven.

- [ ] **Number formatting utility** -- Add `formatViews(n)` once any post exceeds 1,000 views. Low priority until then.
- [ ] **View count in OG metadata** -- Append to `generateMetadata()` description once counts are meaningful enough to serve as social proof in link previews.
- [ ] **Sort by popularity toggle** -- Add once there are 10+ published posts. Currently 3 posts makes sorting pointless.

### Future Consideration (v2+)

Features to defer until the blog has scale.

- [ ] **Engagement features (likes/reactions)** -- Requires session/identity management. Different milestone entirely.
- [ ] **Admin view of analytics** -- Use Vercel Analytics. Don't rebuild what exists.
- [ ] **Historical view trends** -- Redis `INCR` loses temporal data. Would need a time-series approach (daily buckets) if ever needed. Almost certainly unnecessary for a personal blog.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Reading time (post card) | HIGH | ZERO (done) | DONE |
| Reading time (post page) | HIGH | ZERO (done) | DONE |
| Upstash Redis setup | HIGH (blocker) | LOW | P1 |
| API route for increment | HIGH (blocker) | LOW | P1 |
| View count on post page | HIGH | LOW | P1 |
| Client increment trigger | HIGH | LOW | P1 |
| IP deduplication | MEDIUM | LOW | P1 |
| View count on blog listing | MEDIUM | MEDIUM | P1 |
| Suspense streaming fallback | MEDIUM | LOW | P1 |
| Number formatting | LOW | LOW | P2 |
| OG metadata integration | LOW | LOW | P2 |
| Sort by popularity | LOW | MEDIUM | P3 |

**Priority key:**
- DONE: Already implemented -- no work needed
- P1: Must have for v1.4 launch -- the core view counting feature
- P2: Should have -- polish once core is working
- P3: Nice to have -- defer until blog has enough content/traffic

## Competitor Feature Analysis

| Feature | Lee Robinson (leerob.com) | Josh Comeau (joshwcomeau.com) | Dan Abramov (overreacted.io) | keech.dev approach |
|---------|--------------------------|-------------------------------|------------------------------|-------------------|
| View counter | Yes, Firebase-backed, displayed on post pages and listing. One of the original Next.js blog view counter implementations. | Yes, MongoDB-backed, 90s-style hit counter aesthetic. Also has a "like" heart button. | No view counter. Minimalist blog, no engagement metrics. | Upstash Redis. Displayed inline with date/reading time in existing metadata row. Neobrutalist styling -- bold but not retro. |
| Reading time | Yes | Yes | No | Already done. Velite computes at build time via `s.metadata()`. |
| Deduplication | Unknown (Firebase may handle) | Unknown | N/A | IP-hash with 24h TTL in Redis. Prevents same-visitor inflation without fingerprinting. |
| Loading state | SSR with revalidation | Client-side fetch with loading state | N/A | Suspense streaming. Static shell serves instantly, view count streams in. Best of both worlds. |
| Counter display format | "X views" plain text | Stylized retro counter (flip-clock aesthetic) | N/A | "{count} views" in `text-muted` matching existing metadata style. Locale-formatted numbers. |
| Counter on listing | Yes, shown on each post card | Yes, shown alongside post metadata | N/A | Yes, fetched via Redis pipeline for all posts. Shown in PostCard metadata line. |

## Key Finding: Reading Time Is Already Complete

The PROJECT.md lists "Reading time estimates calculated at build time" as a target feature, but **this is already fully implemented:**

1. `velite.config.ts` uses `s.metadata()` which computes `readingTime` from word count
2. The schema transform maps it: `readingTime: data.metadata.readingTime`
3. `PostCard` displays it: `{post.readingTime} min read`
4. Post page displays it: `{post.readingTime} min read`

The v1.4 milestone's actual new work is entirely about **view counts** -- the first backend integration, the first API route, and the first runtime data fetching in what has been a fully static site.

## Sources

- [Upstash: Adding a View Counter to your Next.js Blog](https://upstash.com/blog/nextjs13-approuter-view-counter) -- HIGH confidence, official Upstash tutorial with full implementation
- [Vercel: Next.js Portfolio Pageview Counter Template](https://vercel.com/templates/next.js/nextjs-portfolio-pageview-counter) -- HIGH confidence, official Vercel template
- [Scastiel: View counter with React Server Components](https://scastiel.dev/view-counter-react-server-components) -- MEDIUM confidence, demonstrates async server component pattern for view display
- [Upstash: App Router Quickstart](https://upstash.com/docs/redis/quickstarts/nextjs-app-router) -- HIGH confidence, official SDK documentation
- [Vercel Changelog: Upstash joins the Vercel Marketplace](https://vercel.com/changelog/upstash-joins-the-vercel-marketplace) -- HIGH confidence, confirms Vercel KV sunset and Upstash as replacement
- [Vercel Community: Switching from Vercel KV to Upstash KV](https://community.vercel.com/t/switching-from-vercel-kv-to-upstash-kv-questions/2660) -- MEDIUM confidence, community confirmation of migration path
- [Josh Comeau: How I Built My Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog/) -- MEDIUM confidence, describes hit counter and like button implementation with MongoDB
- [Lee Robinson: Real-Time Blog Post Views](https://leerob.com/blog/real-time-post-views) -- MEDIUM confidence, original Next.js view counter pattern (now redirects to GitHub repo)
- Codebase analysis: `velite.config.ts`, `src/app/blog/[slug]/page.tsx`, `src/app/blog/page.tsx`, `src/components/blog/post-card.tsx` -- HIGH confidence, direct source code inspection

---
*Feature research for: Blog stats -- view counts and reading time (keech.dev v1.4)*
*Researched: 2026-02-21*
