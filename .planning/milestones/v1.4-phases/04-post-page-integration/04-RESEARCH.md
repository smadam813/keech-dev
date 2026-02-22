# Phase 4: Post Page Integration - Research

**Researched:** 2026-02-21
**Domain:** Client-side view count display on statically generated blog post pages
**Confidence:** HIGH

## Summary

This phase adds a live view count to each blog post page by introducing a client component that fires a POST request after hydration and displays the returned count. The blog post page (`src/app/blog/[slug]/page.tsx`) remains a Server Component with `generateStaticParams()` for full static generation. A small `'use client'` leaf component handles the fetch + display, following the existing project pattern where client components are only used for specific browser API needs.

The technical approach is straightforward: a `ViewCounter` client component receives the `slug` as a prop, fires `fetch('/api/views/${slug}', { method: 'POST' })` in a `useEffect`, and renders the returned count. A shimmer placeholder occupies the exact space of the eventual count text, preventing CLS. The existing `·` (middle dot) separators in the metadata row are replaced with the Jera rune `ᛃ` across both the post page and post cards.

**Primary recommendation:** Create a single `ViewCounter` client component at `src/components/blog/view-counter.tsx` that handles POST, state, shimmer placeholder, and count display. Add `POST_RUNES` mapping (with Jera for metadata separator) to `rune-config.ts`. Replace `·` separators in `[slug]/page.tsx` and `post-card.tsx` with the Jera rune character. Define a shimmer keyframe in `globals.css` using Tailwind v4 CSS-first `@theme` syntax.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- View count appears at the end of the metadata row, after reading time: `date ᛃ X min read ᛃ X views`
- Label format: "X views" (text, matching conversational style of "5 min read")
- Replace all `·` (middle dot) metadata separators with the Jera rune ᛃ (Harvest, second aett/teal)
- Applies to both the individual post page (`[slug]/page.tsx`) and blog listing cards (`post-card.tsx`)
- Add Jera to a `POST_RUNES` or similar mapping in `rune-config.ts` for the metadata separator role
- Thematic fit: "harvest" of readership, the cycle of writing and being read
- Skeleton shimmer animation where the view count will appear
- Shimmer is the standard loading pattern for all view counts across the site (including future Phase 5 cards)
- Show "0 views" honestly -- no hiding, no minimum threshold
- Every post starts at zero; transparency over vanity

### Claude's Discretion
- Shimmer visual style (neobrutalist hard-edge vs soft -- pick what fits the design system)
- Transition from shimmer to number (instant vs fade)
- Singular/plural handling ("1 view" vs "1 views")
- Number formatting approach (locale-aware commas vs compact notation)
- Whether POST response updates displayed count live or defers to next visit

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIEW-01 | View count displayed on individual blog post page alongside date and reading time | ViewCounter client component renders in metadata row after reading time, separated by Jera rune. Architecture pattern 1 shows exact placement. |
| VIEW-02 | View count increments on post page visit via client component (fires after hydration) | ViewCounter uses `useEffect` to POST to `/api/views/[slug]` on mount. Response includes `{ slug, views, deduplicated }`. Pattern follows existing project conventions for client components. |
| VIEW-04 | Blog post pages remain statically generated (no static-to-dynamic regression) | Parent page stays a Server Component with `generateStaticParams()`. ViewCounter is a leaf client component -- client components do NOT make parent pages dynamic. Verified by `npm run build` output showing `○` for `/blog/[slug]`. |
| UX-02 | Placeholder element always rendered to prevent CLS when count loads | Shimmer skeleton with fixed `min-width` renders immediately in SSR HTML. Same dimensions as final "X views" text. Shimmer keyframe defined in globals.css. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.2.4 | `useState`, `useEffect` for client-side fetch | Already installed; standard hooks for client-side data fetching |
| Next.js 16 | ^16.1.6 | App Router, `generateStaticParams`, Server/Client component model | Already installed; the framework |
| Tailwind CSS v4 | ^4.1.18 | Shimmer animation via `@theme` custom keyframes, utility classes | Already installed; CSS-first config in `globals.css` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cn()` from `@/lib/utils` | N/A | Merge Tailwind classes without conflicts | Every component that conditionally applies classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw `useEffect` + `fetch` | SWR or React Query | Overkill for a single fire-and-forget POST on mount. No caching, revalidation, or retry needed. The project has zero existing fetch calls; adding a data-fetching library for one component adds unnecessary dependency. |
| Custom shimmer CSS | `react-loading-skeleton` | Adds a dependency for one element. A single CSS keyframe in `globals.css` is simpler and consistent with the project's existing animation approach. |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/blog/
│   ├── view-counter.tsx    # NEW: 'use client' leaf component
│   ├── post-card.tsx       # MODIFY: replace · with ᛃ separator
│   ├── mdx-content.tsx     # unchanged
│   └── ...
├── components/runes/
│   └── rune-config.ts      # MODIFY: add POST_RUNES mapping
├── app/blog/
│   └── [slug]/page.tsx     # MODIFY: replace · with ᛃ, add ViewCounter
└── app/globals.css          # MODIFY: add shimmer keyframe
```

### Pattern 1: Server Component Parent + Client Leaf for View Count
**What:** The blog post page stays a Server Component. A small `ViewCounter` client component is placed in the metadata row as a leaf node. The parent passes `slug` as a prop.
**When to use:** Any time you need client-side behavior (fetch, state) inside a statically generated page.
**Why it works:** `generateStaticParams()` in the parent generates static HTML at build time. Client components are pre-rendered to HTML during build, then hydrate on the client. The `useEffect` only fires after hydration in the browser -- it does not execute during build or SSR.

**Example:**
```typescript
// src/app/blog/[slug]/page.tsx (Server Component -- NO 'use client')
import { ViewCounter } from '@/components/blog/view-counter'

export async function generateStaticParams() {
  return posts.map(post => ({ slug: post.slug }))
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)
  // ...
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted mb-4">
      <time dateTime={post.date}>{formattedDate}</time>
      <span aria-hidden="true" className="text-accent font-display font-bold">ᛃ</span>
      <span>{post.readingTime} min read</span>
      <span aria-hidden="true" className="text-accent font-display font-bold">ᛃ</span>
      <ViewCounter slug={slug} />
    </div>
  )
}
```

### Pattern 2: ViewCounter Client Component with POST-on-Mount
**What:** A `'use client'` component that POSTs to the views API in `useEffect`, stores the result in state, and renders a shimmer placeholder until the count arrives.
**When to use:** On the individual post page (this phase) and potentially adapted for GET-only on listing cards (Phase 5).

**Example:**
```typescript
// src/components/blog/view-counter.tsx
'use client'

import { useEffect, useState } from 'react'

interface ViewCounterProps {
  slug: string
}

export function ViewCounter({ slug }: ViewCounterProps) {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    // POST increments the count and returns the new total
    fetch(`/api/views/${slug}`, { method: 'POST' })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setViews(data.views))
      .catch(() => {
        // Graceful degradation: hide the count on error
        // (Full graceful degradation is Phase 5 UX-03 scope,
        //  but we set up the pattern here)
      })
  }, [slug])

  if (views === null) {
    // Shimmer placeholder -- same height/width as final text
    return (
      <span className="inline-block w-16 h-5 rounded animate-shimmer bg-muted/20" />
    )
  }

  const label = views === 1 ? 'view' : 'views'
  return <span>{views.toLocaleString()} {label}</span>
}
```

### Pattern 3: Shimmer Skeleton via Tailwind v4 CSS-First Custom Animation
**What:** Define a shimmer keyframe animation in `globals.css` using the `@theme` directive, which generates an `animate-shimmer` utility class.
**When to use:** For any loading placeholder across the site (view counts, future features).

**Example:**
```css
/* In globals.css @theme block */
@theme {
  /* ... existing tokens ... */
  --animate-shimmer: shimmer 1.5s ease-in-out infinite;
}

/* Outside @theme -- keyframes are always available */
@keyframes shimmer {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 0.4;
  }
}
```

This generates the class `animate-shimmer` that can be used like `animate-pulse`.

**Neobrutalist fit:** The shimmer uses opacity pulsing rather than a gradient sweep, keeping the hard-edge aesthetic. The placeholder has a `bg-muted/20` background with a subtle opacity cycle -- no soft gradients or rounded morphing that would clash with the design system.

### Pattern 4: Jera Rune as Metadata Separator
**What:** Replace all `·` (middle dot) separators in post metadata with the Jera rune character, styled with the teal accent color.
**When to use:** Post page metadata row and post card metadata row.

**Example:**
```typescript
// Rune separator element (used in both [slug]/page.tsx and post-card.tsx)
<span aria-hidden="true" className="text-accent font-display font-bold">ᛃ</span>
```

The rune config gets a new mapping:
```typescript
// In rune-config.ts
export const POST_RUNES = {
  separator: ELDER_FUTHARK.jera,  // Harvest -- cycle of writing and being read
} as const
```

### Anti-Patterns to Avoid
- **Fetching view count in the Server Component:** Would make the page dynamic (force-dynamic or uncached fetch), breaking static generation. The whole point is the fetch happens client-side after hydration.
- **Using `cookies()`, `headers()`, or `searchParams` in the page component:** Any of these Next.js dynamic functions would opt the page out of static generation.
- **Adding `export const dynamic = 'force-dynamic'` to the page:** This is only for the API route, not the page. Adding it to the page would break static generation.
- **Creating a separate API call for GET then POST:** One POST call is sufficient -- the API already returns the current count in its response.
- **Using `useParams()` to get the slug:** This works but is unnecessary when the parent Server Component can pass `slug` as a prop directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shimmer animation | Custom JS animation loop | CSS `@keyframes` + Tailwind utility | CSS animations are GPU-accelerated, don't block the main thread, and respect `prefers-reduced-motion` |
| Class merging | Manual string concatenation | `cn()` from `@/lib/utils` | Handles Tailwind conflicts; used throughout the entire codebase |
| Number formatting | Manual comma insertion | `Number.toLocaleString()` | Handles locale-specific formatting, edge cases (NaN, Infinity) |
| Singular/plural | Ternary in JSX | Inline ternary `views === 1 ? 'view' : 'views'` | Simple enough for ternary; Intl.PluralRules is overkill for English-only |

**Key insight:** This phase introduces zero new dependencies. Everything needed -- `useEffect`, `useState`, `fetch`, CSS keyframes, `toLocaleString()` -- is built into the platform or already in the project.

## Common Pitfalls

### Pitfall 1: Static-to-Dynamic Regression
**What goes wrong:** Adding server-side data fetching, `cookies()`, `headers()`, or `export const dynamic = 'force-dynamic'` to the page component causes Next.js to server-render the page on every request instead of serving static HTML.
**Why it happens:** Developers often want to fetch the view count server-side for SEO or to avoid the loading state, not realizing this converts the page to dynamic rendering.
**How to avoid:** Keep all view count logic in the `ViewCounter` client component. The page component (`[slug]/page.tsx`) must remain a pure Server Component with no dynamic APIs. Verify with `npm run build` -- blog pages should show `○` (static) not `ƒ` (dynamic).
**Warning signs:** `ƒ` symbols next to `/blog/[slug]` in build output; pages not appearing in `.next/server/app/blog/` as pre-rendered HTML.

### Pitfall 2: Layout Shift (CLS) from Missing Placeholder
**What goes wrong:** The view count text pops in after the API responds, shifting the metadata row width and potentially reflowing content.
**Why it happens:** No placeholder element reserves space in the initial HTML. The `useEffect` fires after hydration, and there's a network delay before the count renders.
**How to avoid:** Always render a shimmer placeholder with `min-width` matching the expected final text width. The placeholder should be inline with the metadata row, occupying the same vertical space.
**Warning signs:** Visible "jump" in the metadata row on page load; CLS score regression in Lighthouse.

### Pitfall 3: Double POST from React Strict Mode
**What goes wrong:** In development (`npm run dev`), React Strict Mode mounts components twice, causing two POST requests and potentially double-counting views.
**Why it happens:** React 18+ Strict Mode intentionally double-invokes effects in development to surface bugs.
**How to avoid:** Use a `useRef` flag to ensure the POST only fires once. This is the standard React pattern for one-time effects.
**Warning signs:** Seeing two POST requests in the Network tab during development; view count incrementing by 2 on dev page loads.

### Pitfall 4: Fetch Failure Silently Breaking Layout
**What goes wrong:** If the API is unreachable (Redis down, network error), the component stays in loading state forever or shows an error.
**Why it happens:** No error handling in the fetch chain; no timeout; no fallback state.
**How to avoid:** Catch fetch errors and either hide the view count gracefully or show a fallback. For this phase, catching and leaving the shimmer or hiding the element is acceptable. Full graceful degradation (UX-03) is Phase 5 scope, but the error handling scaffolding should be present.
**Warning signs:** Infinite shimmer on the page; uncaught promise rejection errors in console.

### Pitfall 5: Rune Font Not Rendering on All Platforms
**What goes wrong:** The Jera rune character `ᛃ` (U+16C3) might render as a box or unknown glyph on systems without runic Unicode support.
**Why it happens:** The `font-display` CSS variable maps to the Norse WOFF2 custom font, which should contain the Runic block. But if the font fails to load, the fallback (Space Grotesk) may not have runic characters.
**How to avoid:** The project already uses `font-display` for runic characters throughout (navigation, bullet points, rune divider). The rune separator uses the same `font-display font-bold` classes, so it inherits the same font stack. As long as the existing rune rendering works (it does -- tested in prior phases), the separator will too.
**Warning signs:** Rune displays as `□` or `?` in production.

## Code Examples

Verified patterns from official sources and existing codebase:

### Client Component with One-Time POST Effect
```typescript
// Pattern: Fire-once useEffect with StrictMode guard
'use client'

import { useEffect, useRef, useState } from 'react'

export function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null)
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    fetch(`/api/views/${slug}`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setViews(data.views))
      .catch(() => {
        // Fail silently -- view count is non-critical UI
        // Full degradation behavior defined in Phase 5 (UX-03)
      })
  }, [slug])

  if (views === null) {
    return (
      <span
        className="inline-block w-16 h-5 rounded-sm bg-muted/20 animate-shimmer"
        aria-hidden="true"
      />
    )
  }

  const label = views === 1 ? 'view' : 'views'
  return <span>{views.toLocaleString()} {label}</span>
}
```

### Shimmer Keyframe in Tailwind v4 CSS-First Config
```css
/* Source: Tailwind CSS v4 docs - animation utilities via @theme */
@theme {
  --animate-shimmer: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
```

### Rune Config Addition
```typescript
// Source: existing rune-config.ts pattern
/** Post metadata runes -- harvest/readership theme */
export const POST_RUNES = {
  separator: ELDER_FUTHARK.jera,  // Harvest -- the cycle of writing and being read
} as const
```

### Metadata Row with Rune Separators
```typescript
// Source: existing [slug]/page.tsx metadata row (lines 85-94)
<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted mb-4">
  <time dateTime={post.date}>{formattedDate}</time>
  <span aria-hidden="true" className="text-accent font-display font-bold">
    {POST_RUNES.separator.char}
  </span>
  <span>{post.readingTime} min read</span>
  <span aria-hidden="true" className="text-accent font-display font-bold">
    {POST_RUNES.separator.char}
  </span>
  <ViewCounter slug={slug} />
  {formattedUpdated && (
    <>
      <span aria-hidden="true" className="text-accent font-display font-bold">
        {POST_RUNES.separator.char}
      </span>
      <span>Updated {formattedUpdated}</span>
    </>
  )}
</div>
```

### Reduced Motion Handling for Shimmer
```css
/* Source: existing globals.css reduced-motion block */
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer {
    animation: none !important;
    opacity: 0.4 !important;  /* Show static muted placeholder */
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SWR/React Query for all client fetches | Raw `useEffect` + `fetch` for simple one-shot calls | React 19 era | Libraries add value for caching/revalidation; overkill for fire-and-forget |
| `tailwind.config.js` animation extend | `@theme { --animate-* }` + `@keyframes` in CSS | Tailwind v4 (2025) | Animations defined alongside other design tokens in CSS |
| `animate-pulse` for all skeleton loaders | Custom shimmer matching design system | Ongoing | `animate-pulse` uses opacity 1->0.5 cycle; custom shimmer can match brand aesthetic |
| Gradient sweep shimmer effect | Opacity pulse shimmer | Design system dependent | Gradient sweep doesn't fit neobrutalist hard-edge aesthetic; opacity pulse is cleaner |

**Deprecated/outdated:**
- `@vercel/kv`: Deprecated Dec 2024 for new projects -- already using `@upstash/redis` directly (settled in Phase 3)
- Pages Router data fetching (`getStaticProps`, `getServerSideProps`): Replaced by App Router Server Components and `generateStaticParams()`

## Open Questions

1. **Shimmer width precision**
   - What we know: The shimmer placeholder needs a fixed width to prevent CLS. Final text ranges from "0 views" (~55px) to "1,234 views" (~90px).
   - What's unclear: Exact pixel width depends on the Inter font rendering at the `text-muted` size.
   - Recommendation: Use `w-16` (64px) as a reasonable middle ground. A slight width change from shimmer to text is acceptable since it's at the end of a flex-wrap row and won't shift preceding elements.

2. **POST response live update vs deferred**
   - What we know: The POST returns `{ slug, views, deduplicated }`. The `views` field is the current total (post-increment or current if deduplicated).
   - What's unclear: Whether to immediately display the returned count or show nothing until the next visit.
   - Recommendation: Display the returned count immediately. It provides instant feedback, and the count is already accurate (the API handles dedup). This is the simpler implementation -- no reason to defer.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/app/blog/[slug]/page.tsx` -- current blog post page structure, metadata row layout, `generateStaticParams()` usage
- Codebase analysis: `src/app/api/views/[slug]/route.ts` -- API response shape `{ slug, views, deduplicated }`, dedup logic
- Codebase analysis: `src/components/runes/rune-config.ts` -- existing rune mapping patterns (`NAV_RUNES`, `BLOG_RUNES`, `PROJECT_RUNES`)
- Codebase analysis: `src/components/blog/post-card.tsx` -- metadata row with `·` separators to replace
- Codebase analysis: `src/app/globals.css` -- existing animation keyframes, `@theme` block, `prefers-reduced-motion` handling
- Codebase analysis: `src/components/hero.tsx`, `src/components/ui/scroll-reveal.tsx` -- existing `'use client'` + `useEffect` patterns
- [Tailwind CSS v4 Animation docs](https://tailwindcss.com/docs/animation) -- `@theme { --animate-* }` syntax, custom keyframes, built-in utilities
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) -- client components pre-rendered during build, `useEffect` only fires in browser
- [Next.js `generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) -- server-only function, generates static HTML at build

### Secondary (MEDIUM confidence)
- [Next.js App Router Data Fetching](https://nextjs.org/docs/pages/building-your-application/data-fetching/client-side) -- `useEffect` + `fetch` pattern for client-side data
- [Next.js CLS prevention](https://nextjs.org/learn-pages-router/seo/web-performance/cls) -- skeleton placeholders matching final content dimensions

### Tertiary (LOW confidence)
- None -- all findings verified through codebase analysis and official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; all patterns already used in the codebase
- Architecture: HIGH -- Server Component + client leaf is the canonical Next.js App Router pattern; verified by official docs and existing project structure
- Pitfalls: HIGH -- StrictMode double-fire, CLS prevention, and static/dynamic regression are well-documented patterns; verified by codebase analysis and official docs
- Shimmer styling: MEDIUM -- shimmer visual approach is discretionary; opacity pulse recommended to match neobrutalist aesthetic but exact parameters may need visual tuning

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable domain -- React 19, Next.js 16, Tailwind v4 are all current releases)
