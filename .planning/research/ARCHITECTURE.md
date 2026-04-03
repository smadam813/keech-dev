# Architecture Research

**Domain:** Next.js 16 App Router hardening -- security, resilience, testing, SEO, and code quality integration
**Researched:** 2026-04-02
**Confidence:** HIGH

## System Overview: Current vs. Target

```
CURRENT ARCHITECTURE
====================================================================
src/app/
  layout.tsx .......................... Root layout (no error boundary)
  page.tsx ............................ Home (static)
  blog/
    page.tsx .......................... Blog listing (static + Suspense)
    [slug]/page.tsx ................... Blog post (static, MDX via new Function)
  projects/
    page.tsx .......................... Project listing (static + Suspense)
    [slug]/page.tsx ................... Project detail (static)
  api/views/
    route.ts .......................... Batch GET (no validation, no rate limit)
    [slug]/route.ts ................... GET/POST (IP dedup, no validation, no rate limit)
  sitemap.ts .......................... Static (broken lastModified)
  robots.ts ........................... Static

next.config.ts ....................... Minimal (images.qualities only)
(no middleware.ts) ................... Nothing intercepts requests

src/lib/
  views.ts ........................... formatViewCount() only
  redis.ts ........................... Redis.fromEnv()
  utils.ts ........................... cn()
  fonts.ts ........................... Norse + Inter
  rune-glows.ts ...................... Glow position data

NEW FILES / MODIFICATIONS FOR v1.6
====================================================================
+ next.config.ts ..................... ADD headers() for security headers
+ src/middleware.ts .................. NEW: rate limiting via @upstash/ratelimit
+ src/app/error.tsx .................. NEW: global error boundary
+ src/app/global-error.tsx ........... NEW: layout-level error boundary
+ src/app/blog/[slug]/error.tsx ...... NEW: MDX-specific error boundary
+ src/app/blog/[slug]/loading.tsx .... NEW: blog post skeleton
+ src/app/blog/[slug]/opengraph-image.tsx  NEW: dynamic OG per post
+ src/app/opengraph-image.tsx ........ NEW: default site OG image
+ src/app/feed.xml/route.ts ......... NEW: RSS feed route handler
+ src/app/icon.svg ................... NEW: favicon (or icon.tsx)
+ src/app/apple-icon.png ............. NEW: apple touch icon
~ src/components/blog/mdx-content.tsx  MODIFY: try-catch around new Function()
~ src/app/api/views/[slug]/route.ts .. MODIFY: slug validation
~ src/app/api/views/route.ts ......... MODIFY: slug validation + batch limit
~ src/app/sitemap.ts ................. MODIFY: fix lastModified dates
~ src/lib/views.ts ................... MODIFY: add localStorage helpers + formatDate()
+ src/hooks/use-filtered-list.ts ..... NEW: extracted filter hook
~ src/components/blog/filtered-post-list.tsx  MODIFY: use hook
~ src/components/projects/filtered-project-list.tsx  MODIFY: use hook
```

### Component Responsibilities

| Component | Current Responsibility | v1.6 Change |
|-----------|----------------------|-------------|
| `next.config.ts` | Image quality config | Add `headers()` returning security headers on all routes |
| `middleware.ts` | Does not exist | Rate limiting on `/api/views/*` via @upstash/ratelimit |
| `mdx-content.tsx` | Executes MDX via `new Function()` | Wrap in try-catch with error fallback UI |
| `error.tsx` (global) | Does not exist | Catch unhandled errors below root layout |
| `global-error.tsx` | Does not exist | Catch errors in root layout itself |
| `blog/[slug]/error.tsx` | Does not exist | MDX-specific error boundary with "content failed to load" messaging |
| `blog/[slug]/loading.tsx` | Does not exist | Skeleton matching blog post layout |
| `opengraph-image.tsx` | Does not exist | Generate 1200x630 PNG via `ImageResponse` from `next/og` |
| `feed.xml/route.ts` | Does not exist | RSS 2.0 XML from `posts` collection |
| `views.ts` | `formatViewCount()` only | Add `getCachedViews()`, `setCachedViews()`, `formatDate()` |
| `use-filtered-list.ts` | Logic duplicated in 2 components | Shared hook: URL state, transitions, toggle, clear |

## Recommended Project Structure (v1.6 additions)

```
src/
  app/
    error.tsx                    # Global error boundary (client component)
    global-error.tsx             # Layout error boundary (client component)
    icon.svg                     # Favicon via metadata file convention
    apple-icon.png               # Apple touch icon
    opengraph-image.tsx          # Default site-wide OG image
    feed.xml/
      route.ts                   # RSS feed route handler
    blog/
      [slug]/
        error.tsx                # MDX-specific error boundary
        loading.tsx              # Blog post loading skeleton
        opengraph-image.tsx      # Dynamic per-post OG image
    api/
      views/
        route.ts                 # (modified: validation + batch limit)
        [slug]/
          route.ts               # (modified: slug validation)
  hooks/
    use-filtered-list.ts         # Extracted filter state hook
  lib/
    views.ts                     # (modified: + cache helpers + formatDate)
    rate-limit.ts                # Ratelimit instance config (shared by middleware)
  middleware.ts                  # Rate limiting middleware
```

### Structure Rationale

- **`src/hooks/`:** New directory for extracted custom hooks. Keeps hooks discoverable and separate from component files. Only `use-filtered-list.ts` for now, but establishes the convention.
- **`src/lib/rate-limit.ts`:** Isolates the `Ratelimit` instance creation from middleware so it can be imported by route handlers if needed later.
- **`feed.xml/route.ts`:** Next.js file convention -- the folder name becomes the URL path (`/feed.xml`), the `route.ts` is the handler.
- **Error boundaries at two levels:** Global catches everything; `blog/[slug]/error.tsx` provides MDX-specific messaging without crashing the layout.
- **OG images at two levels:** Root `opengraph-image.tsx` for non-content pages; `blog/[slug]/opengraph-image.tsx` for per-post images with title/date/tags.

## Architectural Patterns

### Pattern 1: Security Headers via `next.config.ts` `headers()`

**What:** Static security headers applied to all routes via the `headers()` async function in `next.config.ts`. This is the correct approach for a statically generated site -- no middleware overhead needed for headers that do not vary per request.

**When to use:** When headers are the same for all routes and do not require per-request logic (no nonces, no dynamic values).

**Trade-offs:** Cannot generate nonces (that requires middleware + dynamic rendering). But this site is statically generated, so nonce-based CSP is incompatible anyway. The `unsafe-eval` directive is required because `new Function()` is used for MDX execution.

**Implementation:**

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://va.vercel-scripts.com https://*.upstash.io",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: { qualities: [75, 80] },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

**CSP note:** `unsafe-eval` is unavoidable with the current `new Function()` MDX pattern. This is an acceptable trade-off because: (a) all MDX content is author-controlled and compiled at build time, (b) the `.velite/` output is gitignored but deterministic, (c) removing `unsafe-eval` would require migrating to `next-mdx-remote` or a similar library, which is out of scope for a hardening milestone. Vercel Analytics requires `https://va.vercel-scripts.com` in both `script-src` and `connect-src`.

### Pattern 2: Rate Limiting via Middleware + @upstash/ratelimit

**What:** Next.js middleware intercepts requests matching `/api/views/:path*` and applies a sliding window rate limit before the route handler executes. Uses the same Upstash Redis instance already in use for view counts.

**When to use:** When you need request-level gating before route handlers run, without modifying each individual handler.

**Trade-offs:** Middleware runs on every matched request (adds ~1-5ms latency for Redis round-trip). The sliding window algorithm is more precise than fixed window but uses slightly more Redis commands. Acceptable for a personal blog's traffic volume.

**Implementation:**

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const viewsRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '60 s'), // 30 requests per 60s per IP
  prefix: 'ratelimit:views',
})

// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { viewsRateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { success } = await viewsRateLimit.limit(ip)

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/views/:path*',
}
```

**Key detail:** The `matcher` config restricts middleware to API view routes only. This means the middleware never runs on static page requests, preserving zero-overhead static serving.

### Pattern 3: Error Boundaries at Route Segment Level

**What:** `error.tsx` files placed at strategic route segments create React error boundaries that catch rendering errors and display fallback UI. Must be client components (`'use client'`).

**When to use:** At every route segment where a distinct error experience is needed. For this site, two levels: global (catches everything below root layout) and MDX-specific (catches `new Function()` failures).

**Trade-offs:** Error boundaries cannot catch errors in the layout of their own segment -- only in children. This is why `global-error.tsx` exists as a separate file convention for catching root layout errors. `global-error.tsx` replaces the entire HTML shell, so it must include its own `<html>` and `<body>` tags.

**Critical architectural constraint:** `error.tsx` files are always client components. They receive `error` and `reset` props. The `reset()` function attempts to re-render the segment. For MDX errors, reset is unlikely to fix the problem (the compiled MDX is deterministically broken), so the MDX error boundary should offer navigation away rather than retry.

**Implementation:**

```typescript
// src/app/blog/[slug]/error.tsx
'use client'

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-prose mx-auto px-6 py-20 text-center">
      <h2 className="font-display text-2xl mb-4">Failed to load post</h2>
      <p className="text-muted mb-6">
        This post could not be rendered. The content may be temporarily unavailable.
      </p>
      <button onClick={reset} className="...brutal-button-classes...">
        Try again
      </button>
    </div>
  )
}
```

### Pattern 4: Dynamic OG Images via File Convention

**What:** `opengraph-image.tsx` files in route segments automatically generate OG images using the `ImageResponse` API from `next/og`. Next.js discovers these files and adds the appropriate `<meta>` tags to the page's `<head>`.

**When to use:** When you want per-page OG images without a separate image generation service. The file convention approach is cleaner than manually adding image URLs to metadata objects.

**Trade-offs:** ImageResponse uses Satori under the hood, which only supports flexbox and a subset of CSS. Custom fonts must be loaded as ArrayBuffer at build/request time. For static routes with `generateStaticParams()`, OG images are generated at build time (one PNG per post). This adds build time but zero runtime cost.

**Implementation:**

```typescript
// src/app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { posts } from '@/.velite'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Blog post preview'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)

  // Load Norse font for brand consistency
  const norseFontData = await fetch(
    new URL('../../../lib/fonts/Norse.woff2', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', /* ... */ }}>
        <h1 style={{ fontFamily: 'Norse' }}>{post?.title ?? 'keech.dev'}</h1>
        {/* Neobrutalist styling with dusty rose bg, black borders */}
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Norse', data: norseFontData, style: 'normal' }],
    }
  )
}

export async function generateStaticParams() {
  return posts.filter((p) => !p.draft).map((p) => ({ slug: p.slug }))
}
```

**Key detail:** Since blog posts use `generateStaticParams()`, the OG images are generated at build time. The `opengraph-image.tsx` file must also export `generateStaticParams()` to match. This means OG images are static PNGs served from Vercel's CDN with zero runtime generation cost.

### Pattern 5: Shared Hook Extraction for Filtered Lists

**What:** Extract the identical filter state management from `FilteredPostList` and `FilteredProjectList` into a `useFilteredList` hook that handles URL state, transitions, toggle, and clear logic.

**When to use:** When two or more components share 90%+ structural logic differing only in data types, param names, and rendering.

**Trade-offs:** Slightly more indirection (must read the hook to understand filter behavior), but eliminates the dual-maintenance problem. The hook is generic over item type and filter param name.

**Implementation:**

```typescript
// src/hooks/use-filtered-list.ts
'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseFilteredListOptions<T> {
  items: T[]
  allFilterValues: string[]
  paramName: string                          // 'tags' or 'stack'
  getItemValues: (item: T) => string[]       // post => post.tags
}

interface UseFilteredListResult<T> {
  filteredItems: T[]
  activeFilters: Set<string>
  isFiltering: boolean
  isTransitioning: boolean
  filterCounts: Record<string, number>
  handleToggle: (value: string) => void
  handleClear: () => void
}

export function useFilteredList<T>({
  items, allFilterValues, paramName, getItemValues
}: UseFilteredListOptions<T>): UseFilteredListResult<T> {
  // ... URL state, AND-logic filtering, transition animation, toggle/clear
}
```

The consuming components shrink from ~150 lines each to ~40 lines of rendering logic.

## Data Flow

### Security Header Flow

```
Browser Request
    |
    v
Vercel Edge Network
    |
    v
next.config.ts headers() -----> Attaches CSP, X-Frame-Options, etc.
    |
    v
Static Page / Route Handler -----> Response with security headers
```

Headers are applied by Vercel at the CDN level based on `next.config.ts`. No application code runs for static pages.

### Rate Limiting Flow (API routes only)

```
POST /api/views/[slug]
    |
    v
middleware.ts
    |---> @upstash/ratelimit.limit(ip)
    |       |
    |       |---> Redis: EVALSHA (sliding window check)
    |       |
    |       +---> 429 Too Many Requests (if over limit)
    |
    v (if allowed)
route.ts handler
    |---> Slug validation (regex: /^[a-z0-9-]+$/)
    |---> IP dedup + INCR (existing logic)
    |
    v
Response JSON
```

### OG Image Generation Flow (build time)

```
npm run build
    |
    v
velite -----> .velite/posts.json (compiled MDX + frontmatter)
    |
    v
next build
    |---> generateStaticParams() per route
    |---> For each [slug]:
    |       |---> page.tsx -----> static HTML
    |       +---> opengraph-image.tsx -----> static 1200x630 PNG
    |
    v
Deploy: static HTML + static OG PNGs (zero runtime cost)
```

### RSS Feed Flow

```
GET /feed.xml
    |
    v
route.ts
    |---> import { posts } from '@/.velite'
    |---> Filter drafts, sort by date
    |---> Generate XML string (RSS 2.0)
    |---> Return Response with Content-Type: application/rss+xml
```

Since `posts` is imported from the Velite build output, the RSS route can be statically generated. Add `export const dynamic = 'force-static'` to ensure it is pre-rendered at build time.

### Code Deduplication Flow

```
BEFORE (v1.5):
view-counter.tsx -----> getCachedViews() (local copy)
listing-view-counts.tsx -----> getCachedViews() (local copy)
blog/[slug]/page.tsx -----> new Intl.DateTimeFormat() (inline)
post-card.tsx -----> new Intl.DateTimeFormat() (inline)
filtered-post-list.tsx -----> URL state + transition + toggle (150 lines)
filtered-project-list.tsx -----> URL state + transition + toggle (150 lines)

AFTER (v1.6):
src/lib/views.ts -----> formatViewCount() + getCachedViews() + setCachedViews()
src/lib/format.ts -----> formatDate()
src/hooks/use-filtered-list.ts -----> useFilteredList<T>()
    |
    +---> view-counter.tsx (imports from lib/views)
    +---> listing-view-counts.tsx (imports from lib/views)
    +---> blog/[slug]/page.tsx (imports formatDate)
    +---> post-card.tsx (imports formatDate)
    +---> filtered-post-list.tsx (~40 lines, uses hook)
    +---> filtered-project-list.tsx (~40 lines, uses hook)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (5 posts, 2 projects) | All changes are appropriate. OG image build time negligible. Rate limit overhead minimal. |
| 50-100 posts | OG image generation adds ~30-60s to build. Still acceptable for Vercel builds. RSS feed XML grows but remains manageable. |
| 500+ posts | Consider paginated RSS (or limit to latest 50). OG image generation may need caching strategy. Rate limit Redis usage still minimal. |

### Scaling Priorities

1. **First bottleneck:** OG image build time. Each post generates a 1200x630 PNG at build time. At scale, consider on-demand ISR for OG images instead of full static generation.
2. **Second bottleneck:** RSS feed size. At 500+ posts, the full XML feed becomes unwieldy. Add `<rss:limit>` or paginate with `?page=N`.

## Anti-Patterns

### Anti-Pattern 1: CSP via Middleware for Static Sites

**What people do:** Create `middleware.ts` that injects CSP headers with nonces into every response, following the Next.js docs for nonce-based CSP.
**Why it is wrong for this project:** Nonce-based CSP requires dynamic rendering (each request gets a unique nonce). This site is statically generated. Enabling dynamic rendering for CSP would break static optimization, increase TTFB, and consume serverless function invocations.
**Do this instead:** Use `next.config.ts` `headers()` for static CSP without nonces. Accept `unsafe-eval` as a necessary trade-off for the `new Function()` MDX pattern. Accept `unsafe-inline` for styles (Tailwind generates inline styles).

### Anti-Pattern 2: Rate Limiting Inside Route Handlers

**What people do:** Add rate limiting logic directly inside each API route handler.
**Why it is wrong:** Duplicates rate limiting code across handlers. The request has already been routed and parsed before the check runs. If you add more API routes later, you must remember to add rate limiting to each one.
**Do this instead:** Use middleware with a `matcher` config. The rate limit check runs before the handler, and the `matcher` ensures it only applies to API routes that need it.

### Anti-Pattern 3: Single Global Error Boundary Only

**What people do:** Add only `src/app/error.tsx` and call it done.
**Why it is wrong:** The global error boundary cannot catch errors in the root layout. And it provides the same generic error message for all failures -- an MDX rendering error gets the same treatment as a 404 or an API failure.
**Do this instead:** Add `global-error.tsx` (for layout errors) plus segment-specific `error.tsx` files where distinct error messaging matters (particularly `blog/[slug]/error.tsx` for MDX failures).

### Anti-Pattern 4: Generating OG Images at Runtime

**What people do:** Use `opengraph-image.tsx` without `generateStaticParams()`, causing OG images to be generated on-demand per request.
**Why it is wrong for this project:** OG images for blog posts are requested by social media crawlers (Twitter, Facebook, LinkedIn). On-demand generation means the first crawler request is slow (500ms-2s), and if it times out, no preview image appears. Since all blog content is known at build time, there is no reason to generate at runtime.
**Do this instead:** Export `generateStaticParams()` from the OG image file to match the page's static params. Images are pre-generated at build time and served as static assets.

### Anti-Pattern 5: Testing MDX Content Rendering in Unit Tests

**What people do:** Try to unit test the full MDX rendering pipeline including `new Function()`, rehype plugins, and component overrides.
**Why it is wrong:** The MDX pipeline crosses multiple boundaries (Velite compilation, runtime execution, React rendering). Unit testing individual steps is fragile and couples tests to implementation details. The `new Function()` call especially is hard to unit test meaningfully.
**Do this instead:** Unit test pure functions (`formatViewCount`, `formatDate`, `computeGlowPositions`, slug validation). Use E2E tests (Playwright) for the MDX rendering pipeline -- load a real blog post and assert the rendered output.

## Integration Points

### External Services

| Service | Integration Pattern | v1.6 Changes |
|---------|---------------------|--------------|
| Upstash Redis | `@upstash/redis` via `Redis.fromEnv()` | Add `@upstash/ratelimit` using same Redis instance. Same env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). |
| Vercel Analytics | `@vercel/analytics/next` in root layout | CSP must allow `https://va.vercel-scripts.com` in `script-src` and `connect-src`. No other changes. |
| Vercel Edge | Serves static pages + runs middleware | Middleware now runs on `/api/views/*` routes. Static pages unaffected. |

### Internal Boundaries

| Boundary | Communication | v1.6 Notes |
|----------|---------------|------------|
| Velite build --> Next.js | `.velite/` directory, imported as `@/.velite` | No change. OG image files import from `@/.velite` the same way pages do. |
| Middleware --> Route handlers | Request passes through if rate limit allows | New boundary. Middleware returns 429 or passes `NextResponse.next()`. |
| Error boundaries --> Child routes | React error boundary pattern | New boundary. `error.tsx` wraps the route segment's children. |
| `useFilteredList` hook --> Filtered list components | Hook return values | New boundary. Hook owns URL state; components own rendering. |
| `src/lib/views.ts` --> View components | Shared functions | Expanded boundary. Adds `getCachedViews`/`setCachedViews` to existing `formatViewCount`. |
| `src/lib/format.ts` --> Date display components | `formatDate()` pure function | New file. Three call sites converge. |

## Build Order Recommendation

Based on dependency analysis, the recommended implementation order:

1. **Security headers** (next.config.ts) -- zero dependencies, immediate security improvement, no new files beyond modifying existing config
2. **Code deduplication** (views.ts, format.ts, use-filtered-list hook) -- pure refactoring with no new features, reduces surface area for subsequent work
3. **Error boundaries** (error.tsx, global-error.tsx, loading.tsx) -- depends on nothing, but MDX try-catch in mdx-content.tsx should pair with the blog error boundary
4. **Input validation on API routes** -- small changes to existing route handlers, no new dependencies
5. **Rate limiting** (middleware.ts, @upstash/ratelimit) -- depends on Upstash Redis (already present), adds new dependency
6. **OG images** (opengraph-image.tsx) -- depends on Velite content imports and font loading, builds on static generation understanding
7. **RSS feed** (feed.xml/route.ts) -- depends on Velite content imports, standalone feature
8. **Favicon/icons** -- standalone, no dependencies
9. **Sitemap fix** -- trivial, standalone
10. **Testing setup** (Vitest) -- should come after code deduplication so tests cover the deduplicated code, not the about-to-change duplicated code
11. **Accessibility fixes** -- small, targeted changes that can be done in any order
12. **Performance fixes** (image sizes, Hero refactor) -- lowest risk, can be done last

**Rationale for this ordering:**
- Security first (headers are the highest-impact, lowest-risk change)
- Deduplication before testing (test the final code shape, not the pre-refactor shape)
- Error boundaries before OG images (if OG image generation fails during build, error boundaries help in development)
- Rate limiting before testing (rate limiting is a new dependency that should be stable before writing tests around it)

## Sources

- [Next.js Content Security Policy guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js headers() config reference](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers)
- [Next.js error handling docs](https://nextjs.org/docs/app/getting-started/error-handling)
- [Next.js error.tsx file convention](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Next.js opengraph-image file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [Next.js Vitest testing guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Upstash Ratelimit documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Upstash ratelimit-js Next.js middleware example](https://github.com/upstash/ratelimit-js/tree/main/examples/nextjs-middleware)

---
*Architecture research for: keech.dev v1.6 hardening milestone*
*Researched: 2026-04-02*
