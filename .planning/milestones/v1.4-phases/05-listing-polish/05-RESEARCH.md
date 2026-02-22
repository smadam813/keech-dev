# Phase 5: Listing & Polish - Research

**Researched:** 2026-02-21
**Domain:** Client-side view count display on blog listing page, locale-aware formatting, graceful degradation
**Confidence:** HIGH

## Summary

This phase adds GET-only view counts to each post card on the `/blog` listing page and polishes the entire view count feature with locale-aware number formatting and graceful degradation when the API is unreachable. The listing page (`src/app/blog/page.tsx`) is currently a static Server Component that renders `PostCard` components. Each card needs to display the current view count without incrementing it -- meaning GET requests only, not POSTs.

The main architectural decision is the fetching strategy for the listing page. Two approaches exist: (A) a per-card client component that individually GETs `/api/views/{slug}` for each post, or (B) a single batch API endpoint using Redis `MGET` to fetch all counts in one round-trip. With 3 current posts, either approach works. However, a batch endpoint (`GET /api/views?slugs=a,b,c`) is the cleaner architecture: it reduces N HTTP requests to 1, avoids waterfall fetching, and provides a single data source for a parent client component on the listing page. The `PostCard` component itself stays a pure presentational server component -- it just receives an optional `views` prop.

Graceful degradation (UX-03) requires that when Redis is down or the network fails, blog pages render fully without errors and the view count simply does not appear. The current `ViewCounter` on the post page already catches errors silently and leaves the cached value (or empty placeholder) visible. The listing page needs the same resilience: if the batch fetch fails, cards render without view counts -- no error boundaries, no broken layouts, no console errors in production.

**Primary recommendation:** Create a batch API endpoint at `GET /api/views` that accepts `?slugs=slug1,slug2,...` and uses `redis.mget()` for a single Redis round-trip. Create a `ListingViewCounts` client component that fetches all counts once and distributes them to `PostCard` via props. Extend `PostCard` with an optional `views?: number | null` prop. Extract a shared `formatViewCount()` utility used by both `ViewCounter` (post page) and `ListingViewCounts` (listing page). Graceful degradation is the default behavior -- `views` prop is `null` when unavailable, and the count section simply doesn't render.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Count placement: same metadata row as date and reading time, using the Jera rune separator: `date ᛃ 5 min read ᛃ 42 views`
- Matches the post page pattern for visual consistency across the site
- Loading & transition: match the current Phase 4 pattern (localStorage cache for instant display on return visits, fixed-width placeholder on first visits to prevent CLS)
- Degradation: when API is unreachable, pages render fully without errors -- view count simply does not appear
- Build process must not depend on Redis availability (view counts are client-side only)

### Claude's Discretion
- View count label format on cards (e.g., "42 views" vs "42" vs abbreviated)
- Number formatting approach (plain locale "1,234" vs compact "1.2K") -- pick what fits a personal blog's scale
- Whether to extract a shared formatting utility for both post page and listing cards
- Fetching strategy for listing page (bulk request vs individual per card)
- Loading transition style (instant vs subtle fade)
- Console logging on API failure (silent vs console.warn)
- Whether listing cards use localStorage caching or a simpler approach
- Adapt Phase 4 localStorage caching pattern appropriately for listing context -- Claude decides whether caching makes sense for listing cards or if a simpler approach is better

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIEW-03 | View count displayed on blog listing post cards (GET-only, no increment) | Batch API endpoint (`GET /api/views?slugs=...`) fetches all counts via `redis.mget()`. `ListingViewCounts` client component distributes counts to `PostCard` via `views` prop. Cards use GET-only -- no POST, no increment. |
| UX-01 | View count formatted with locale-aware number separators | `Number.toLocaleString()` already used in `ViewCounter`. Extract to shared `formatViewCount()` utility in `src/lib/views.ts`. Standard `toLocaleString()` produces "1,234" in English locales. |
| UX-03 | Graceful degradation when API is unreachable (page renders without count, no error) | Fetch wrapped in try/catch. On failure, `views` stays `null`, count section omits from render. No error boundaries needed. No console.error in production (use console.warn in development only). Build process never calls Redis. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.2.4 | `useState`, `useEffect`, `useLayoutEffect` for client-side fetch + cache | Already installed; standard hooks |
| Next.js 16 | ^16.1.6 | App Router, static page generation, route handlers | Already installed |
| @upstash/redis | ^1.36.2 | `redis.mget()` for batch view count retrieval | Already installed; used by existing API routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cn()` from `@/lib/utils` | N/A | Merge Tailwind classes | Conditionally applying classes on PostCard |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Batch API endpoint | Individual GET per card | Works at 3 posts but creates N HTTP requests. Batch is 1 request regardless of post count. Batch is the correct architecture. |
| `Number.toLocaleString()` | `Intl.NumberFormat` | Both produce identical output for simple integer formatting. `toLocaleString()` is simpler for a single call. `Intl.NumberFormat` is better when reusing a formatter instance, but the difference is negligible. |
| Plain locale "1,234" | Compact "1.2K" | Compact notation loses precision and feels impersonal for a personal blog. "1,234 views" is more honest and readable than "1.2K views" at blog scale. |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/views/
│   │   ├── [slug]/route.ts     # EXISTING: individual GET/POST per slug
│   │   └── route.ts            # NEW: batch GET with ?slugs= query param
│   └── blog/
│       └── page.tsx            # MODIFY: wrap PostCards with ListingViewCounts
├── components/blog/
│   ├── listing-view-counts.tsx # NEW: 'use client' wrapper that fetches batch counts
│   ├── post-card.tsx           # MODIFY: add optional views prop + rune separator
│   └── view-counter.tsx        # MODIFY: use shared formatViewCount()
└── lib/
    └── views.ts                # NEW: shared formatViewCount() utility
```

### Pattern 1: Batch API Endpoint with Redis MGET
**What:** A new route handler at `src/app/api/views/route.ts` that accepts a `slugs` query parameter and returns all view counts in a single response using `redis.mget()`.
**When to use:** The listing page needs counts for all visible posts.
**Why this over individual GETs:** `redis.mget()` is a single Redis command (one HTTP round-trip to Upstash) regardless of how many slugs are requested. This avoids N+1 API calls from the client.

**Example:**
```typescript
// src/app/api/views/route.ts
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slugs = searchParams.get('slugs')?.split(',').filter(Boolean) ?? []

  if (slugs.length === 0) {
    return Response.json({ counts: {} })
  }

  try {
    const keys = slugs.map(slug => `views:${slug}`)
    const values = await redis.mget<(number | null)[]>(...keys)

    const counts: Record<string, number> = {}
    slugs.forEach((slug, i) => {
      counts[slug] = values[i] ?? 0
    })

    return Response.json({ counts })
  } catch (error) {
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to fetch view counts' },
      { status: 500 }
    )
  }
}
```

**Request:** `GET /api/views?slugs=post-1,post-2,post-3`
**Response:** `{ "counts": { "post-1": 42, "post-2": 7, "post-3": 0 } }`

**Source:** [Upstash Redis MGET docs](https://upstash.com/docs/redis/sdks/ts/commands/string/mget) -- `redis.mget<T>(...keys)` returns `T[]` with `null` for non-existent keys. Counts as a single command for billing.

### Pattern 2: ListingViewCounts Client Wrapper
**What:** A `'use client'` component that wraps the post grid on the listing page. It fetches all view counts once on mount via the batch endpoint, then renders its children (PostCards) with view counts injected.
**When to use:** On the `/blog` listing page to provide view counts to all post cards.

**Two sub-approaches:**

**Approach A: Wrapper component with render prop / children function**
```typescript
// src/components/blog/listing-view-counts.tsx
'use client'

import { useEffect, useLayoutEffect, useState } from 'react'

interface ListingViewCountsProps {
  slugs: string[]
  children: (counts: Record<string, number | null>) => React.ReactNode
}

export function ListingViewCounts({ slugs, children }: ListingViewCountsProps) {
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  // Read cached counts before paint
  useLayoutEffect(() => {
    const cached: Record<string, number | null> = {}
    let hasCached = false
    for (const slug of slugs) {
      try {
        const raw = localStorage.getItem(`views:${slug}`)
        if (raw !== null) {
          cached[slug] = Number(raw)
          hasCached = true
        }
      } catch { /* localStorage unavailable */ }
    }
    if (hasCached) setCounts(cached)
  }, [slugs])

  useEffect(() => {
    if (slugs.length === 0) return

    fetch(`/api/views?slugs=${slugs.join(',')}`)
      .then(res => {
        if (!res.ok) throw new Error(`Batch view count failed: ${res.status}`)
        return res.json()
      })
      .then(data => {
        setCounts(data.counts)
        // Cache each count for future visits
        for (const [slug, count] of Object.entries(data.counts)) {
          try {
            localStorage.setItem(`views:${slug}`, String(count))
          } catch { /* non-critical */ }
        }
      })
      .catch(() => {
        // Graceful degradation: cached values remain, or counts stay empty
      })
  }, [slugs])

  return <>{children(counts)}</>
}
```

**Approach B: Simple per-card component reusing existing ViewCounter pattern**
Less clean architecturally (N individual fetches) but reuses existing code. NOT recommended -- creates N HTTP requests.

**Recommendation:** Use Approach A (wrapper with batch fetch). It is the cleaner architecture and scales without code changes.

### Pattern 3: PostCard with Optional Views Prop
**What:** Extend `PostCard` to accept an optional `views` prop. When present, render the view count in the metadata row with a Jera rune separator. When `null` or `undefined`, omit the view count section entirely.
**When to use:** Always -- the PostCard should be a pure presentational component that renders what it receives.

**Example:**
```typescript
interface PostCardProps {
  post: {
    title: string
    slug: string
    date: string
    description?: string
    excerpt: string
    tags: string[]
    readingTime: number
  }
  views?: number | null
}

export function PostCard({ post, views }: PostCardProps) {
  // ... existing code ...
  return (
    // ... existing markup ...
    <div className="text-sm text-muted mt-2 flex items-center gap-2">
      <time dateTime={post.date}>{formattedDate}</time>
      <span aria-hidden="true" className="text-accent font-display font-bold">
        {POST_RUNES.separator.char}
      </span>
      <span>{post.readingTime} min read</span>
      {views != null && (
        <>
          <span aria-hidden="true" className="text-accent font-display font-bold">
            {POST_RUNES.separator.char}
          </span>
          <span>{formatViewCount(views)}</span>
        </>
      )}
    </div>
    // ...
  )
}
```

**Key design choice:** `views != null` (loose equality) catches both `null` and `undefined`, meaning:
- If batch fetch fails: `views` is `null` or absent -> count omitted -> graceful degradation (UX-03)
- If batch fetch succeeds with 0: `views` is `0` -> "0 views" displayed -> honest representation per project decision

### Pattern 4: Shared View Count Formatting Utility
**What:** A shared function for formatting view counts, used by both `ViewCounter` (post page) and `PostCard` (listing page).
**When to use:** Anywhere a view count is displayed.

**Example:**
```typescript
// src/lib/views.ts

/**
 * Format a view count for display.
 * Uses locale-aware formatting (e.g., "1,234 views").
 */
export function formatViewCount(count: number): string {
  const formatted = count.toLocaleString()
  const label = count === 1 ? 'view' : 'views'
  return `${formatted} ${label}`
}
```

This extracts the logic currently inline in `ViewCounter` (line 57: `` `${views.toLocaleString()} ${views === 1 ? 'view' : 'views'}` ``). Both the post page and listing page use the same formatting, ensuring consistency (UX-01).

### Pattern 5: Graceful Degradation
**What:** When the API is unreachable (network error, Redis down, timeout), pages render fully without errors. View counts simply do not appear.
**When to use:** Always -- this is the default behavior, not an exception handler.

**Degradation layers:**
1. **Build time:** `npm run build` never calls Redis. View counts are client-side only. Build always succeeds regardless of Redis availability.
2. **Client fetch failure (listing):** `ListingViewCounts` catches fetch errors. `counts` stays as cached values or empty object. `PostCard` receives `null`/absent `views` prop -> count section omitted.
3. **Client fetch failure (post page):** `ViewCounter` catches fetch errors. Cached localStorage value displayed if available. If no cache, the placeholder span stays empty (fixed-width for CLS prevention on first visits, empty on error).
4. **No console.error in the user's browser:** Use `catch(() => {})` for silent failure on fetch. The error is non-actionable by the user. For developer debugging, the API route itself logs `console.error('[views] Redis error:', error)` server-side.

### Anti-Patterns to Avoid
- **Server-side Redis fetch on the listing page:** Would make `/blog` dynamic instead of static. View counts must be client-side only per user decision.
- **Individual GET per card on listing page:** Creates N HTTP requests. Use batch `MGET` instead.
- **POST on the listing page:** POSTing from listing cards would inflate view counts. Listing uses GET only.
- **Error boundaries for view count failures:** Overkill. The component handles its own error state by omitting the count. Error boundaries are for render errors, not fetch failures.
- **Showing "Error" or "N/A" text:** User decision says count "simply does not appear." No visible error state.
- **Making PostCard a client component:** PostCard should stay a server component (pure presentational). The client boundary is at `ListingViewCounts`, which passes data down as props.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Batch Redis fetch | Multiple sequential `redis.get()` calls | `redis.mget(...keys)` | Single command, single HTTP round-trip, returns array aligned with input keys |
| Number formatting | Manual comma insertion regex | `Number.toLocaleString()` | Handles locale, edge cases (NaN), browser-native |
| Plural label | Complex i18n pluralization | Inline ternary `count === 1 ? 'view' : 'views'` | English-only site, two cases. `Intl.PluralRules` is overkill. |
| CLS prevention | Complex dimension calculations | Fixed-width `inline-block` placeholder (existing pattern) | Already proven in Phase 4. Same `w-12` approach. |

**Key insight:** This phase introduces one new route handler and one new client component. Everything else is extending existing patterns. Zero new dependencies.

## Common Pitfalls

### Pitfall 1: N+1 Request Waterfall on Listing Page
**What goes wrong:** Each post card independently fetches its own view count, creating N parallel HTTP requests that hit N independent Redis GET commands.
**Why it happens:** Developers reuse the existing per-post `ViewCounter` component on listing cards without considering the multiplied network cost.
**How to avoid:** Use a single batch API endpoint with `redis.mget()`. One HTTP request from client, one Redis command on server, regardless of post count.
**Warning signs:** N `/api/views/[slug]` requests visible in the Network tab on the listing page.

### Pitfall 2: Static-to-Dynamic Regression on /blog Page
**What goes wrong:** Adding server-side Redis calls to `src/app/blog/page.tsx` makes it dynamic, breaking static generation.
**Why it happens:** It seems simpler to fetch counts server-side and pass them as props. But this requires `force-dynamic` or `revalidate`, converting the page from static to dynamic.
**How to avoid:** Keep `/blog/page.tsx` as a static Server Component. All view count fetching happens client-side in the `ListingViewCounts` wrapper component.
**Warning signs:** `/blog` shows `ƒ` (dynamic) instead of `○` (static) in `npm run build` output.

### Pitfall 3: Build Failure When Redis is Unavailable
**What goes wrong:** Build-time code imports Redis or calls the API, causing `npm run build` to fail when Redis env vars are missing or Redis is down.
**Why it happens:** Server-side data fetching during build. The API route files are compiled but not called during build. However, if the listing page or post page imports Redis directly, the build may attempt to connect.
**How to avoid:** Never import `@/lib/redis` in page components. View counts are exclusively fetched via client-side `fetch()` calls to API routes. The API routes use `force-dynamic`, so they are never called during build.
**Warning signs:** Build errors mentioning Redis connection failure or missing env vars.

### Pitfall 4: Stale localStorage Cache Showing Wrong Counts on Listing
**What goes wrong:** localStorage caches from individual post page visits show stale counts on the listing page, and they never update if the batch fetch fails.
**Why it happens:** The localStorage key format is `views:{slug}`, shared between post page and listing page. If a user visits a post (caches count 42), then visits the listing page where the batch fetch fails, the listing would show the stale cached value 42 even though the current count might be 50.
**How to avoid:** This is actually acceptable behavior. A stale cached count is better than no count. The batch fetch will overwrite stale cache on success. On failure, stale data is preferable to no data (graceful degradation).
**Warning signs:** Not a real problem -- just worth understanding the cache behavior.

### Pitfall 5: Query String Length Limit for Batch Endpoint
**What goes wrong:** If the blog grows to hundreds of posts, the `?slugs=` query string could exceed URL length limits.
**Why it happens:** Browser URL length limits vary (2,083 characters in IE, effectively unlimited in modern browsers), but very long query strings can be truncated by proxies or CDNs.
**How to avoid:** At current scale (3 posts), this is a non-issue. Average slug is ~40 characters. Even 50 posts would only produce a ~2,000 character query string. If scaling beyond 100+ posts, switch to a POST body for the batch request. Not needed now.
**Warning signs:** 414 URI Too Long responses from the API.

## Code Examples

Verified patterns from official sources and existing codebase:

### Batch API Route Handler
```typescript
// src/app/api/views/route.ts
// Source: Upstash Redis MGET docs + existing route.ts pattern
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slugs = searchParams.get('slugs')?.split(',').filter(Boolean) ?? []

  if (slugs.length === 0) {
    return Response.json({ counts: {} })
  }

  try {
    const keys = slugs.map(slug => `views:${slug}`)
    const values = await redis.mget<(number | null)[]>(...keys)

    const counts: Record<string, number> = {}
    slugs.forEach((slug, i) => {
      counts[slug] = values[i] ?? 0
    })

    return Response.json({ counts })
  } catch (error) {
    console.error('[views] Redis error:', error)
    return Response.json(
      { error: 'Failed to fetch view counts' },
      { status: 500 }
    )
  }
}
```

### Shared Formatting Utility
```typescript
// src/lib/views.ts
// Source: existing inline logic in view-counter.tsx line 57

export function formatViewCount(count: number): string {
  const formatted = count.toLocaleString()
  const label = count === 1 ? 'view' : 'views'
  return `${formatted} ${label}`
}
```

### Updated ViewCounter Using Shared Utility
```typescript
// src/components/blog/view-counter.tsx (modified)
import { formatViewCount } from '@/lib/views'

// ... existing hooks and state ...

return (
  <span className={views === null ? 'inline-block w-12' : undefined}>
    {views !== null && formatViewCount(views)}
  </span>
)
```

### ListingViewCounts Client Wrapper
```typescript
// src/components/blog/listing-view-counts.tsx
'use client'

import { useEffect, useLayoutEffect, useState } from 'react'

interface ListingViewCountsProps {
  slugs: string[]
  children: (counts: Record<string, number | null>) => React.ReactNode
}

function getCachedCounts(slugs: string[]): Record<string, number> {
  const cached: Record<string, number> = {}
  for (const slug of slugs) {
    try {
      const raw = localStorage.getItem(`views:${slug}`)
      if (raw !== null) cached[slug] = Number(raw)
    } catch { /* localStorage unavailable */ }
  }
  return cached
}

function setCachedCounts(counts: Record<string, number>) {
  for (const [slug, count] of Object.entries(counts)) {
    try {
      localStorage.setItem(`views:${slug}`, String(count))
    } catch { /* non-critical */ }
  }
}

export function ListingViewCounts({ slugs, children }: ListingViewCountsProps) {
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  useLayoutEffect(() => {
    const cached = getCachedCounts(slugs)
    if (Object.keys(cached).length > 0) setCounts(cached)
  }, [slugs])

  useEffect(() => {
    if (slugs.length === 0) return

    fetch(`/api/views?slugs=${slugs.join(',')}`)
      .then(res => {
        if (!res.ok) throw new Error(`Batch fetch failed: ${res.status}`)
        return res.json()
      })
      .then(data => {
        setCounts(data.counts)
        setCachedCounts(data.counts)
      })
      .catch(() => {
        // Graceful degradation: cached values remain, or counts stay empty
      })
  }, [slugs])

  return <>{children(counts)}</>
}
```

### Updated Blog Listing Page
```typescript
// src/app/blog/page.tsx (modified)
import { posts } from '@/.velite'
import { PostCard } from '@/components/blog/post-card'
import { ListingViewCounts } from '@/components/blog/listing-view-counts'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

export default function BlogPage() {
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const slugs = publishedPosts.map(p => p.slug)

  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>

      {publishedPosts.length > 0 ? (
        <ListingViewCounts slugs={slugs}>
          {(counts) => (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publishedPosts.map(post => (
                <ScrollReveal key={post.slug}>
                  <PostCard post={post} views={counts[post.slug] ?? null} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </ListingViewCounts>
      ) : (
        <p className="text-muted">No posts yet. Check back soon!</p>
      )}
    </section>
  )
}
```

### PostCard with Views Prop and CLS-Safe Placeholder
```typescript
// src/components/blog/post-card.tsx (modified)
import { formatViewCount } from '@/lib/views'

interface PostCardProps {
  post: { /* ... existing ... */ }
  views?: number | null
}

// In the metadata row:
<div className="text-sm text-muted mt-2 flex items-center gap-2">
  <time dateTime={post.date}>{formattedDate}</time>
  <span aria-hidden="true" className="text-accent font-display font-bold">
    {POST_RUNES.separator.char}
  </span>
  <span>{post.readingTime} min read</span>
  {views != null && (
    <>
      <span aria-hidden="true" className="text-accent font-display font-bold">
        {POST_RUNES.separator.char}
      </span>
      <span>{formatViewCount(views)}</span>
    </>
  )}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual GET per card | Batch endpoint with `redis.mget()` | Redis best practice | 1 HTTP request + 1 Redis command vs N of each |
| `toLocaleString()` inline | Shared utility function | DRY principle | Consistent formatting across post page and listing |
| Error boundary for degradation | Catch in fetch chain, omit rendering | React pattern for non-critical UI | Simpler, no extra component tree wrapping |
| Shimmer placeholder on listing | Clean omission (no placeholder) | UX decision for listing context | Listing cards don't need loading indicators -- counts appear when ready, absent when unavailable |

**Deprecated/outdated:**
- `@vercel/kv`: Deprecated Dec 2024 -- already using `@upstash/redis` directly
- Server-side fetching for view counts: Would break static generation

## Discretionary Recommendations

These items are marked as "Claude's Discretion" in CONTEXT.md. Research findings and rationale below:

### View count label format: "42 views"
Use the same `X views` format as the post page for consistency. "42" alone is ambiguous. Abbreviated formats ("42v") are unusual and potentially confusing.

### Number formatting: plain locale (toLocaleString)
Use `Number.toLocaleString()` which produces "1,234" in English. Compact notation ("1.2K") loses precision and feels impersonal for a personal blog where exact counts are more authentic. The current ViewCounter already uses `toLocaleString()`.

### Shared formatting utility: yes, extract to `src/lib/views.ts`
The formatting logic (locale string + singular/plural) is duplicated between ViewCounter and PostCard. Extract to a single utility. Small function, clear win for consistency.

### Fetching strategy: batch endpoint with MGET
One HTTP request from client, one Redis command on server. Scales without code changes. Individual per-card fetches would work at 3 posts but is the wrong architecture.

### Loading transition: no placeholder on listing cards
The post page uses a fixed-width placeholder because the view count is always expected to appear (it fires a POST that returns the count). On the listing page, the behavior is different: if counts aren't available, they simply don't show. Adding placeholders to every card creates visual noise for a non-critical UI element. Instead, when counts arrive, the metadata row extends naturally. The localStorage cache from previous visits means repeat visitors see counts instantly (no flash).

### Console logging on API failure: silent
`catch(() => {})` on the client side. The API route logs server-side errors via `console.error('[views] Redis error:', error)`. The user's browser console should not show errors for non-critical UI failures.

### localStorage caching on listing: yes, reuse existing keys
The listing page reads the same `views:{slug}` localStorage keys written by individual post page visits. The batch fetch writes them too. This means:
- First visit to listing: no cached counts, counts appear after batch fetch completes
- Return visit: cached counts appear instantly via `useLayoutEffect`, then batch fetch updates them

This matches the Phase 4 pattern (localStorage cache for instant display) adapted for the listing context where multiple slugs are handled at once.

## Open Questions

1. **MGET type parameter specifics**
   - What we know: `redis.mget<T>(...keys)` returns `T[]`. Upstash docs show `null` for non-existent keys.
   - What's unclear: The exact TypeScript generic parameter for numeric values. The docs example uses a custom type. For view counts (stored via `INCR`), the values are numbers but `mget` may return them as strings or numbers depending on Upstash's deserialization.
   - Recommendation: Type as `redis.mget<(number | null)[]>(...keys)` and handle `null` for missing keys (new posts with zero views that have never been incremented). Test during implementation -- if values come back as strings, add `Number()` conversion.

2. **Render prop vs. hook approach for ListingViewCounts**
   - What we know: The render prop pattern (`children(counts)`) lets PostCard stay a server component receiving plain data. A hook approach would require PostCard to be a client component.
   - What's unclear: Whether the render prop creates an awkward API in practice.
   - Recommendation: Use the render prop. It keeps PostCard as a presentational component, which is consistent with the existing architecture.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/blog/view-counter.tsx` -- current ViewCounter implementation with localStorage caching, `useLayoutEffect`, and `toLocaleString()` formatting
- Codebase analysis: `src/components/blog/post-card.tsx` -- current PostCard structure, metadata row with Jera rune separators
- Codebase analysis: `src/app/blog/page.tsx` -- current blog listing page, static Server Component
- Codebase analysis: `src/app/api/views/[slug]/route.ts` -- existing API route pattern, `force-dynamic`, Redis error handling
- Codebase analysis: `src/lib/redis.ts` -- Redis client singleton via `Redis.fromEnv()`
- [Upstash Redis MGET docs](https://upstash.com/docs/redis/sdks/ts/commands/string/mget) -- `redis.mget<T>(...keys)` returns `T[]`, `null` for missing keys, counts as single command
- [React useLayoutEffect](https://react.dev/reference/react/useLayoutEffect) -- runs before paint, effects don't run on server

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` -- original research recommending batch `MGET` for listing page (lines 309-314)
- `.planning/research/STACK.md` -- original research documenting `redis.mget()` pattern for listing page (lines 199-201)

### Tertiary (LOW confidence)
- None -- all findings verified through codebase analysis and official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; all patterns already used in codebase
- Architecture: HIGH -- batch endpoint + client wrapper follows established project patterns (client leaf components, server component parents)
- Pitfalls: HIGH -- N+1 prevention, static generation preservation, graceful degradation all verified by codebase analysis
- Formatting: HIGH -- `toLocaleString()` behavior verified via Node.js runtime testing, already used in codebase

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable domain -- React 19, Next.js 16, @upstash/redis 1.36)
