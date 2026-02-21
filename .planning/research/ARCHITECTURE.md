# Architecture Research

**Domain:** Blog view counts (Upstash Redis) and reading time display in a statically-generated Next.js 16 site
**Researched:** 2026-02-21
**Confidence:** HIGH

## System Overview

The site is currently 100% static -- no API routes, no database, no server-side data fetching. Adding view counts introduces the site's first dynamic data path. The architecture must keep the static foundation intact while layering a thin dynamic path on top.

```
CURRENT (v1.3) — Fully Static
===============================

  Build Time                              Request Time
  +-----------------+                     +-------------------+
  | Velite compiles |  .velite/*.json     | CDN serves static |
  | MDX content     | ----------------->  | HTML/JS/CSS       |
  +-----------------+                     +-------------------+
        |
        v
  +------------------+
  | Next.js builds   |
  | static pages via |
  | generateStatic   |
  | Params()         |
  +------------------+


v1.4 — Static Pages + Dynamic View Counts
===========================================

  Build Time                              Request Time
  +-----------------+                     +-------------------+
  | Velite compiles |  readingTime is     | CDN serves static |
  | MDX + metadata  |  computed here      | HTML (with        |
  | (readingTime    | ----------------->  | readingTime       |
  |  already works) |                     | baked in)         |
  +-----------------+                     +--------+----------+
                                                   |
                                          Client hydrates,
                                          fires view tracking
                                                   |
                                          +--------v----------+
                                          | <ViewCounter>     |
                                          | 'use client'      |
                                          | POST /api/views   |
                                          | then GET count    |
                                          +--------+----------+
                                                   |
                                          +--------v----------+
                                          | Route Handler     |
                                          | app/api/views/    |
                                          |   [slug]/route.ts |
                                          | (dynamic, never   |
                                          |  cached)          |
                                          +--------+----------+
                                                   |
                                          +--------v----------+
                                          | Upstash Redis     |
                                          | @upstash/redis    |
                                          | INCR / GET        |
                                          | (serverless REST) |
                                          +-------------------+
```

### Component Responsibilities

| Component | Responsibility | New/Modified | Render Mode |
|-----------|----------------|--------------|-------------|
| `velite.config.ts` | Compiles MDX, computes `readingTime` via `s.metadata()` | **Existing (no changes)** | Build time |
| `app/blog/[slug]/page.tsx` | Renders post page with reading time + view counter slot | **Modified** — add `<ViewCounter>` | Server (static) |
| `app/blog/page.tsx` | Blog listing with reading time + view counts per card | **Modified** — add view counts to cards | Server (static) |
| `components/blog/post-card.tsx` | Individual post card in listing | **Modified** — add view count display | Server (renders client child) |
| `components/blog/view-counter.tsx` | Tracks and displays view count | **New** — `'use client'` | Client |
| `app/api/views/[slug]/route.ts` | Increment + return view count | **New** — Route Handler | Server (dynamic) |
| `lib/redis.ts` | Upstash Redis client singleton | **New** | Server only |

## Recommended Project Structure

```
src/
  app/
    api/
      views/
        [slug]/
          route.ts          # NEW — Route Handler for view count CRUD
    blog/
      page.tsx              # MODIFIED — pass view counts to post cards
      [slug]/
        page.tsx            # MODIFIED — render <ViewCounter>
  components/
    blog/
      view-counter.tsx      # NEW — 'use client' component
      post-card.tsx         # MODIFIED — accept optional viewCount prop
      mdx-content.tsx       # UNCHANGED
      code-block.tsx        # UNCHANGED
      toc.tsx               # UNCHANGED
      copy-button.tsx       # UNCHANGED
      tag-chip.tsx          # UNCHANGED
  lib/
    redis.ts                # NEW — Upstash Redis client
    utils.ts                # UNCHANGED
    fonts.ts                # UNCHANGED
```

### Structure Rationale

- **`app/api/views/[slug]/route.ts`:** The dynamic `[slug]` segment matches the blog post slug convention already used in `app/blog/[slug]/page.tsx`. Placing it under `api/views/` is conventional and self-documenting. A single route handler handles both GET (fetch count) and POST (increment + return count), keeping the API surface minimal.
- **`lib/redis.ts`:** Isolates the Upstash client construction so both the route handler and any future server-side usage share one configuration. Keeps `@upstash/redis` out of component files.
- **`components/blog/view-counter.tsx`:** This is the 7th `'use client'` component in the project. It needs client-side rendering because: (1) the POST to increment must fire after hydration (not during SSG build), and (2) view count is dynamic data that must be fetched after page load, not baked into static HTML.

## Architectural Patterns

### Pattern 1: Static Shell with Client-Side Dynamic Islands

**What:** Pages remain statically generated via `generateStaticParams()`. Dynamic data (view counts) is fetched and rendered by a small client component that mounts into a slot in the static HTML. The static page loads instantly; the view count appears a moment later.

**When to use:** When 95% of page content is static but one piece of data must be live.

**Trade-offs:**
- Pro: No change to build pipeline, no ISR complexity, no revalidation config
- Pro: Static pages remain fully cacheable on CDN
- Pro: View count is always current (fetched on every page load)
- Con: Brief flash where view count is not yet loaded (use skeleton or hidden until ready)
- Con: Every page view makes an API call (mitigated by Vercel's edge network + Upstash edge latency)

**Example:**
```typescript
// app/blog/[slug]/page.tsx — Server component (static)
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)
  if (!post) notFound()

  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <div className="flex items-center gap-3 text-muted">
          <time>{formattedDate}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingTime} min read</span>
          <span aria-hidden="true">·</span>
          {/* Client island — fetches + increments view count */}
          <ViewCounter slug={post.slug} />
        </div>
      </header>
      {/* ... rest of static content */}
    </article>
  )
}
```

### Pattern 2: Single Route Handler for GET + POST

**What:** One route file handles both reading and incrementing the view count. POST increments the count and returns the new value. GET returns the current value without incrementing. This enables the blog listing page to batch-fetch counts without inflating them.

**When to use:** When a resource has both read and write operations but the API surface is simple enough that a single endpoint suffices.

**Trade-offs:**
- Pro: One file, one URL, simple mental model
- Pro: POST returns the new count, so the client component gets the value in a single round trip (no POST then GET)
- Con: Cannot use `force-static` caching on the GET (dynamic by default in Next.js 15+, which is what we want)

**Example:**
```typescript
// app/api/views/[slug]/route.ts
import { redis } from '@/lib/redis'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const views = await redis.incr(`views:${slug}`)
  return Response.json({ views })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const views = (await redis.get<number>(`views:${slug}`)) ?? 0
  return Response.json({ views })
}
```

### Pattern 3: Fire-and-Forget View Tracking

**What:** The client component fires a POST request on mount (via `useEffect`) without awaiting the result for the increment, then separately fetches the count. Alternatively, the POST returns the new count so both happen in one round trip.

**When to use:** When tracking should never block rendering and a failed increment is acceptable (the page still works without view counts).

**Trade-offs:**
- Pro: View tracking never degrades page performance
- Pro: If Upstash is down, the page renders normally with no count
- Con: Slight possibility of showing stale count if POST takes longer than expected

**Recommended approach:** POST returns the new count (single round trip).

```typescript
// components/blog/view-counter.tsx
'use client'

import { useEffect, useState } from 'react'

export function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    // POST increments and returns new count in one trip
    fetch(`/api/views/${slug}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setViews(data.views))
      .catch(() => {}) // Graceful degradation — no count shown
  }, [slug])

  if (views === null) return null // Or a skeleton/placeholder

  return <span>{views.toLocaleString()} views</span>
}
```

### Pattern 4: Reading Time as Build-Time Static Data (Already Implemented)

**What:** Velite's `s.metadata()` schema computes `readingTime` (minutes) and `wordCount` from MDX content at build time. The `velite.config.ts` transform hoists `readingTime` to the top-level post object.

**When to use:** Always for reading time. It is derived from content, so it belongs at build time.

**Current implementation (no changes needed):**
```typescript
// velite.config.ts — already implemented
.transform(data => ({
  ...data,
  permalink: `/blog/${data.slug}`,
  readingTime: data.metadata.readingTime  // Already exposed
}))
```

Reading time is already displayed in both `post-card.tsx` (line 41: `{post.readingTime} min read`) and `app/blog/[slug]/page.tsx` (line 88: `{post.readingTime} min read`). No changes are needed for reading time display -- it is fully implemented.

## Data Flow

### View Count Tracking (Post Page)

```
[User visits /blog/some-post]
    |
    v
[CDN serves static HTML]  ← readingTime is baked in, view count slot is empty
    |
    v
[React hydrates on client]
    |
    v
[<ViewCounter slug="some-post" /> mounts]
    |
    v
[useEffect fires POST /api/views/some-post]
    |
    v
[Route Handler: redis.incr('views:some-post')]
    |                                           |
    v                                           v
[Returns { views: 42 }]              [Upstash Redis stores
    |                                  views:some-post = 42]
    v
[setViews(42) → renders "42 views"]
```

### View Count Display (Blog Listing)

```
[User visits /blog]
    |
    v
[CDN serves static HTML]  ← post cards render without view counts
    |
    v
[React hydrates on client]
    |
    v
[Each <PostCard> contains <ViewCounter slug={post.slug} />]
    |
    v
[Multiple GET /api/views/[slug] requests fire]
    |  (or single batch endpoint — see Scaling section)
    v
[Each card populates its view count]
```

**Important distinction:** On the listing page, view counters should use GET (read-only), not POST (which increments). Only the individual post page should increment. This prevents the listing page from inflating view counts.

### Key Data Flows

1. **Reading time (build-time, static):** Velite compiles MDX -> `s.metadata()` computes word count and reading time -> `transform` hoists to post object -> consumed in `PostCard` and `PostPage` at build time. No runtime data fetching. Already fully implemented.

2. **View count (runtime, dynamic):** Client component mounts -> `fetch()` to Route Handler -> Upstash Redis INCR/GET -> JSON response -> React state update -> DOM render. Entirely client-initiated after hydration.

3. **Redis key schema:** `views:{slug}` where slug matches the Velite-generated slug (e.g., `views:bmad-method-rewriting-epic-story-breakdown`). Simple string keys with INCR for atomic increments.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-50 posts (current) | Individual GET per card on listing page is fine. ~2-5 parallel fetches. Upstash free tier handles this easily. |
| 50-200 posts | Consider a batch endpoint (`GET /api/views` with `?slugs=a,b,c`) using Redis MGET to fetch all counts in one round trip. Reduces listing page from N requests to 1. |
| Bot/refresh abuse | Add IP-based deduplication: `SET dedupe:{hash(ip)}:{slug} 1 NX EX 86400` (24h window). Only INCR if SET succeeds. |

### Scaling Priorities

1. **First bottleneck:** N+1 API calls on the blog listing page. Fix with a batch endpoint or by fetching all counts in a single API call using Redis `MGET`. Not needed at current scale (2 posts) but worth designing the key schema to support it.
2. **Second bottleneck:** View count inflation from bots and refresh-spamming. Fix with IP-based deduplication in the route handler. Not needed for MVP but the route handler should be structured to add this later without refactoring.

## Anti-Patterns

### Anti-Pattern 1: Server-Side View Count Fetching in Static Pages

**What people do:** Fetch view counts in the page server component using `fetch()` or direct Redis calls, making the page dynamic (no longer statically generated).

**Why it's wrong:** This forces the page from static to dynamic rendering. Every page request now hits the server instead of CDN. The entire point of `generateStaticParams()` is lost. Page load times increase from ~50ms (CDN) to 200-500ms (server render).

**Do this instead:** Keep the page static. Render view counts via a client component that fetches after hydration. The 95% of the page that is static content loads instantly; the view count appears a moment later.

### Anti-Pattern 2: Using `revalidate` / ISR for View Counts

**What people do:** Add `export const revalidate = 60` to the post page, making Next.js re-render the page every 60 seconds with fresh view counts baked into the HTML.

**Why it's wrong:** ISR adds significant complexity (stale-while-revalidate behavior, cache invalidation edge cases, CDN purging). It also means view counts are up to 60 seconds stale, which is worse than the client-fetch approach where counts are always current. For a personal blog with low traffic, the engineering cost of ISR is not justified by the benefit.

**Do this instead:** Client-side fetch. Always current, no ISR complexity, no impact on static page generation.

### Anti-Pattern 3: Using `@vercel/kv` Instead of `@upstash/redis`

**What people do:** Install `@vercel/kv` because older tutorials and Vercel's own blog posts reference it.

**Why it's wrong:** Vercel KV is deprecated for new projects as of December 2024. Vercel now directs users to install Upstash Redis directly through the Vercel Marketplace. `@vercel/kv` was always a thin wrapper around `@upstash/redis` anyway.

**Do this instead:** Install `@upstash/redis` directly. Use `Redis.fromEnv()` or `new Redis({ url, token })` with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables. The Vercel Marketplace Upstash integration sets these automatically.

### Anti-Pattern 4: Incrementing Views on the Blog Listing Page

**What people do:** Use the same POST-on-mount `<ViewCounter>` component in the listing page, accidentally incrementing every post's view count when a user browses the blog index.

**Why it's wrong:** Inflates view counts massively. A single visit to `/blog` would increment counts for all displayed posts.

**Do this instead:** Create two modes for the view counter component: `track` mode (POST, used on individual post pages) and `display` mode (GET, used on listing page). Or use two separate components -- one that tracks and one that only displays.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Upstash Redis | `@upstash/redis` SDK via REST API | Serverless-friendly, no persistent connections. Free tier: 10,000 commands/day. Environment variables auto-set by Vercel Marketplace integration. |
| Vercel (deployment) | Git push triggers build + deploy | No changes to deploy pipeline. New env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) must be added to Vercel project settings. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `page.tsx` (server) -> `ViewCounter` (client) | Props: `slug` string, `track` boolean | Server component passes static data down to client island. No state lifting. |
| `ViewCounter` (client) -> Route Handler | HTTP `fetch()` to `/api/views/[slug]` | Standard browser fetch. No shared types needed (response is `{ views: number }`). |
| Route Handler -> `lib/redis.ts` | Direct import of redis client | Redis client constructed once, reused across invocations (Vercel serverless warm starts). |
| `lib/redis.ts` -> Upstash | HTTPS REST API (not TCP Redis protocol) | Serverless-compatible. No connection pooling needed. Works in both Node.js and Edge runtimes. |

### What Does NOT Change

| Component | Why Unchanged |
|-----------|---------------|
| `velite.config.ts` | Reading time is already computed and exposed. No modifications needed. |
| `MDXContent` | Content rendering is unrelated to view counts. |
| `CodeBlock`, `CopyButton` | Code block functionality is orthogonal. |
| `TableOfContents` | TOC generation is a build-time Velite feature. |
| `TagChip` | Tag display is purely static. |
| `globals.css` | No new animations or design tokens needed for view counts (uses existing `text-muted` color). |
| `next.config.ts` | No config changes needed. Route handlers work out of the box. |
| Build pipeline | `velite && next build` remains the same. Route handlers are compiled by Next.js automatically. |

## Build Order (Dependencies)

```
Phase 1: Infrastructure (no visible changes)
  |  1a. Add @upstash/redis to package.json
  |  1b. Create lib/redis.ts (client singleton)
  |  1c. Set up Upstash Redis via Vercel Marketplace
  |  1d. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  |      to .env.local for development
  |  --> Testable: import redis client, run redis.ping() in a scratch route
  |
Phase 2: API Route (backend, no frontend changes)
  |  2a. Create app/api/views/[slug]/route.ts
  |  2b. Implement POST (increment + return count)
  |  2c. Implement GET (return count without incrementing)
  |  --> Testable: curl POST and GET against localhost
  |
Phase 3: View Counter Component (new client component)
  |  3a. Create components/blog/view-counter.tsx
  |  3b. Two modes: track (POST on mount) and display (GET on mount)
  |  3c. Graceful degradation when API unavailable
  |  --> Testable: render component in isolation, verify network calls
  |
Phase 4: Integration (wire into existing pages)
  |  4a. Add <ViewCounter slug={post.slug} track /> to post page header
  |  4b. Add <ViewCounter slug={post.slug} /> to post cards on listing page
  |  4c. Verify readingTime display still works (should be untouched)
  |  --> Testable: full page loads, verify counts appear and increment
  |
Phase 5: Polish
     5a. Loading state / skeleton for view count
     5b. Number formatting (toLocaleString for commas)
     5c. Verify no layout shift from count appearing
     5d. Confirm static generation is preserved (check build output)
```

**Why this order:**
- Phase 1 is pure infrastructure with no risk to existing functionality
- Phase 2 depends on Phase 1 (needs redis client) but has no frontend impact
- Phase 3 depends on Phase 2 (needs API endpoint to call) but is isolated
- Phase 4 is the only phase that modifies existing files, and by this point the new pieces are individually tested
- Phase 5 is polish that requires the full pipeline to be functional

## Sources

- [Next.js Route Handlers documentation (v16.1.6)](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) -- file conventions, HTTP methods, caching behavior, dynamic segments with `params: Promise` (HIGH confidence, official docs dated 2026-02-20)
- [Upstash Redis Vercel Integration](https://upstash.com/docs/redis/howto/vercelintegration) -- setup steps, environment variables, `Redis.fromEnv()` pattern (HIGH confidence, official docs)
- [Upstash blog: Next.js App Router View Counter](https://upstash.com/blog/nextjs13-approuter-view-counter) -- IP deduplication pattern, INCR/SET NX pattern, client component tracking (MEDIUM confidence, official blog but written for Next.js 13 era)
- [Next.js 15 caching changes](https://nextjs.org/blog/next-15) -- GET route handlers no longer cached by default (HIGH confidence, official blog)
- [Vercel KV deprecation](https://vercel.com/docs/storage/vercel-kv/kv-reference) -- `@vercel/kv` sunset, migration to Upstash (HIGH confidence, confirmed by Vercel Marketplace redirect)
- Existing codebase analysis: `velite.config.ts`, `app/blog/[slug]/page.tsx`, `app/blog/page.tsx`, `components/blog/post-card.tsx`, `package.json` (HIGH confidence, direct inspection)

---
*Architecture research for: Blog view counts and reading time integration with static Next.js 16 site*
*Researched: 2026-02-21*
