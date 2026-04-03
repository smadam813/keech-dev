# Phase 10: Resilience & Code Quality - Research

**Researched:** 2026-04-02
**Domain:** Next.js error boundaries, loading states, React hook extraction, code deduplication
**Confidence:** HIGH

## Summary

This phase has two orthogonal workstreams: (1) error resilience via Next.js App Router error/loading conventions, and (2) code quality via hook extraction and component unification. Both are well-understood patterns with no external dependencies or novel technical challenges.

The error boundary work is straightforward Next.js App Router convention: `error.tsx`, `global-error.tsx`, and `loading.tsx` files at appropriate route segments. The codebase already has a branded `MDXFallback` and `not-found.tsx` that establish the visual language. The code quality work is pure refactoring with clear before/after states -- duplicated code is already identified in CONTEXT.md with exact file references.

**Primary recommendation:** Structure work as two waves -- error resilience first (new files, no breaking changes), then code quality refactoring (extract-then-replace pattern to avoid regressions).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Error boundaries use neobrutalist branded styling consistent with Phase 9's MDX fallback
- D-02: Global error boundary shows branded message with nav to home; blog error boundary shows MDX-specific message with link to /blog
- D-03: `global-error.tsx` provides full HTML shell (html + body tags) since it catches root layout errors
- D-04: Error logging uses `console.error('[route-segment]', error)` prefix pattern
- D-05: Loading skeletons target key content areas only (post grid, project grid, blog post content) -- not full-page skeletons
- D-06: Skeleton styling uses neobrutalist design tokens -- no third-party skeleton library
- D-07: `useFilteredList` hook extracted as typed generic hook
- D-08: `formatDate()` extracted to `src/lib/format.ts`
- D-09: localStorage view cache helpers consolidated in `src/lib/views.ts`
- D-10: TagChip and TechBadge unified into single `FilterChip` component with variant prop
- D-11: Animation orchestration extracted to `useHeroAnimation` hook
- D-12: Glow positioning logic extracted to `useGlowPositions` hook
- D-13: Hero component remains single file, delegates to hooks
- D-14: Code block copy button gets `focus-visible:opacity-100`
- D-15: MDX list elements get `role="list"` for Safari VoiceOver

### Claude's Discretion
- Exact skeleton dimensions and animation timing
- `useFilteredList` generic type constraints
- Hook internal API design
- `FilterChip` variant naming

### Deferred Ideas (OUT OF SCOPE)
- ESLint migration (belongs in Phase 12 or cleanup task)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ERR-01 | Global error boundary (`error.tsx`) catches runtime errors with branded error page | Next.js App Router `error.tsx` convention; existing `MDXFallback` + `not-found.tsx` styling patterns |
| ERR-02 | Global error boundary (`global-error.tsx`) catches root layout errors with full HTML shell | Next.js requires `global-error.tsx` to render own `<html>` and `<body>` since root layout is replaced |
| ERR-03 | Blog post error boundary (`blog/[slug]/error.tsx`) shows MDX-specific error message | Route-segment-level error boundaries; follow `MDXFallback` pattern from Phase 9 |
| ERR-04 | Loading states (`loading.tsx`) provide skeleton UI during route transitions | Next.js `loading.tsx` convention wraps page in `<Suspense>`; skeleton components use existing design tokens |
| QUAL-01 | localStorage cache helpers extracted to single location in `src/lib/views.ts` | Identical `getCachedViews`/`setCachedViews` functions in `listing-view-counts.tsx` and `view-counter.tsx` |
| QUAL-02 | Date formatting extracted to shared `formatDate()` utility | Three identical `Intl.DateTimeFormat` calls in `post-card.tsx` and `blog/[slug]/page.tsx` |
| QUAL-03 | Filtered list logic extracted to shared `useFilteredList` hook | `FilteredPostList` and `FilteredProjectList` share identical filtering, URL sync, and transition logic |
| QUAL-04 | TagChip and TechBadge unified into shared component | Near-identical toggle button implementations; TagChip has extra link mode |
| QUAL-05 | Hero component refactored with animation/glow hooks | 177-line component with three separable concerns: render, animation orchestration, glow positioning |
| A11Y-01 | Code block copy button visible on keyboard focus | `CopyButton` uses `opacity-0 group-hover:opacity-100` -- needs `focus-visible:opacity-100` |
| A11Y-02 | MDX list elements include `role="list"` for Safari VoiceOver | `list-style: none` in `.prose ul` causes VoiceOver to strip list semantics |
</phase_requirements>

## Architecture Patterns

### Next.js Error Boundary Convention (App Router)

**error.tsx** -- catches errors in a route segment's subtree. Must be a Client Component (`'use client'`). Receives `error` (Error object) and `reset` (function to retry). Does NOT replace the root layout -- Header/Footer remain visible.

```typescript
// src/app/error.tsx
'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  // error.message, error.digest available
  // reset() re-renders the segment
}
```

**global-error.tsx** -- catches errors in the root layout itself. Must render its own `<html>` and `<body>` tags because the root layout is replaced entirely. Only triggers in production (dev shows error overlay).

```typescript
// src/app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        {/* Self-contained branded error UI */}
      </body>
    </html>
  )
}
```

**loading.tsx** -- automatically wraps the segment's `page.tsx` in `<Suspense>` with this component as fallback. Renders during route transitions. The blog and project listing pages already wrap `FilteredPostList`/`FilteredProjectList` in `<Suspense>` -- `loading.tsx` adds the outer page-level boundary.

### Existing Styling References

The codebase already has two branded error-state components to use as visual references:

1. **`MDXFallback`** in `mdx-content.tsx`: `border-[3px] border-foreground bg-surface p-8 shadow-brutal` with heading, message, and "Back to Blog" link
2. **`not-found.tsx`**: Centered layout with display font heading, muted message, and `bg-accent text-white` CTA button with brutal shadow

Error boundaries should follow this same visual language: neobrutalist card, display font heading, muted explanation text, prominent escape link.

### Hook Extraction Pattern

New hooks directory at `src/hooks/`. Each hook:
- Exported as named export from its own file
- Accepts configuration via typed options object
- Returns structured state object (not loose values)
- Uses the existing `cn()` pattern for any class composition

### Recommended Project Structure (new files only)

```
src/
  app/
    error.tsx           # Global error boundary (NEW)
    global-error.tsx    # Root layout error boundary (NEW)
    loading.tsx         # Global loading skeleton (NEW)
    blog/
      loading.tsx       # Blog listing skeleton (NEW)
      [slug]/
        error.tsx       # Blog post error boundary (NEW)
        loading.tsx     # Blog post skeleton (NEW)
    projects/
      loading.tsx       # Projects listing skeleton (NEW)
  hooks/
    use-filtered-list.ts    # Shared filtering hook (NEW)
    use-hero-animation.ts   # Hero animation orchestration (NEW)
    use-glow-positions.ts   # Rune glow positioning (NEW)
  lib/
    format.ts           # Date formatting utility (NEW)
    views.ts            # Extended with localStorage helpers (MODIFIED)
  components/
    ui/
      filter-chip.tsx   # Unified TagChip/TechBadge (NEW)
```

### Anti-Patterns to Avoid
- **Over-abstracting FilterChip:** TagChip has a link mode that TechBadge lacks. The unified component needs to preserve this -- use a union type or optional `href` prop, not separate variant components.
- **Breaking the render tree for error boundaries:** `error.tsx` sits alongside `layout.tsx` and `page.tsx` in the same segment. It catches errors from `page.tsx` but NOT from `layout.tsx` at the same level. The blog post error boundary at `blog/[slug]/error.tsx` catches MDX render errors correctly because `MDXContent` is in the page, not the layout.
- **Skeleton layout mismatch:** Skeletons must mirror the actual page structure (same grid columns, same max-width, same padding) to prevent layout shift when real content loads.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton animation | Custom keyframe animation | Tailwind `animate-pulse` on `bg-surface` blocks | Consistent with Tailwind patterns, zero config |
| Error boundary React class component | Manual `componentDidCatch` | Next.js `error.tsx` file convention | App Router handles the React Error Boundary wrapper automatically |
| URL search param sync | Manual `URLSearchParams` + `history.replaceState` | Keep existing pattern (already works) | Already implemented correctly in both list components -- extract, don't rewrite |

## Common Pitfalls

### Pitfall 1: global-error.tsx Missing Font/Style Imports
**What goes wrong:** `global-error.tsx` replaces the root layout, so CSS variables from `globals.css`, font classes, and Tailwind utilities are NOT automatically available unless imported.
**Why it happens:** Other error boundaries inherit styles from the root layout. `global-error.tsx` does not.
**How to avoid:** Import `globals.css` and font configuration directly in `global-error.tsx`, or use inline styles for the critical branded elements.
**Warning signs:** Error page renders with system fonts and no styling in production.

### Pitfall 2: useFilteredList Generic Type Constraints Too Loose
**What goes wrong:** The hook works but provides no type safety for the tag/stack field accessor.
**Why it happens:** Making the hook generic requires specifying which field contains the filterable array.
**How to avoid:** Use a generic with a key constraint: `<T extends Record<K, string[]>, K extends keyof T>` where `K` is the field name (e.g., `'tags'` or `'stack'`). The hook accepts `items: T[]`, `filterKey: K`, and `allFilterValues: string[]`.
**Warning signs:** TypeScript `any` casts needed at call sites.

### Pitfall 3: FilterChip Link Mode Regression
**What goes wrong:** Unifying TagChip and TechBadge drops the `href`/link mode that TagChip supports (used on blog post detail pages for tag links).
**Why it happens:** TechBadge has no link mode, so it's easy to forget during unification.
**How to avoid:** Audit all TagChip usage sites before unifying. The component needs three modes: display-only, toggle button, and link.
**Warning signs:** Blog post tag chips no longer navigate to filtered blog listing.

### Pitfall 4: Loading Skeleton on Static Pages
**What goes wrong:** `loading.tsx` flashes briefly on statically generated pages during client-side navigation.
**Why it happens:** Even static pages show the loading boundary during route transitions in the App Router.
**How to avoid:** Keep skeletons minimal and matching the page layout. Brief flash is acceptable and expected -- the skeleton should feel like a natural part of the page loading, not a jarring replacement.
**Warning signs:** Users see a completely different layout flash before the real page.

### Pitfall 5: Hero Hook Extraction Breaking Ref Timing
**What goes wrong:** Extracting `useEffect` chains to hooks loses the ref connection to DOM elements.
**Why it happens:** Refs from the component must be passed to hooks, but the hook may run before the ref is attached.
**How to avoid:** Pass refs as parameters to hooks. The hooks should accept `RefObject<HTMLElement>` and guard against `null` internally.
**Warning signs:** Glow positions not calculated, animations not triggering.

## Code Examples

### Date Formatting Extraction

Current duplicated pattern (3 occurrences):
```typescript
// In post-card.tsx and blog/[slug]/page.tsx (twice)
const formattedDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC'
}).format(new Date(post.date))
```

Extracted utility:
```typescript
// src/lib/format.ts
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(dateString: string): string {
  return dateFormatter.format(new Date(dateString))
}
```

Note: The `Intl.DateTimeFormat` instance is created once at module scope (singleton) rather than on every call. This is safe because the formatter is stateless and reusable.

### localStorage Cache Helpers Consolidation

Currently duplicated identically in `listing-view-counts.tsx` (lines 19-34) and `view-counter.tsx` (lines 10-23):

```typescript
// Extract to src/lib/views.ts (alongside existing formatViewCount)
export function getCachedViews(slug: string): number | null {
  try {
    const raw = localStorage.getItem(`views:${slug}`)
    return raw !== null ? Number(raw) : null
  } catch {
    return null
  }
}

export function setCachedViews(slug: string, count: number): void {
  try {
    localStorage.setItem(`views:${slug}`, String(count))
  } catch {
    // Storage full or unavailable -- non-critical
  }
}
```

### useFilteredList Hook Shape

```typescript
// src/hooks/use-filtered-list.ts
interface UseFilteredListOptions<T> {
  items: T[]
  allFilterValues: string[]
  getItemValues: (item: T) => string[]  // e.g., post => post.tags
  paramName: string                       // 'tags' or 'stack'
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
```

The hook encapsulates: URL param reading/writing, AND-filter logic, transition animation state, and static counts computation.

### FilterChip Unification

TagChip and TechBadge are nearly identical. Differences:
- TagChip has a `tag` prop; TechBadge has a `tech` prop (both are `string` labels)
- TagChip has an `href` link mode; TechBadge does not
- Toggle mode styling is identical (same classes, same `aria-pressed`)
- Display-only mode styling is identical

Unified shape:
```typescript
interface FilterChipProps {
  label: string
  variant?: 'tag' | 'tech'   // Controls color in future if needed
  href?: string               // Link mode (tag detail pages)
  active?: boolean
  onToggle?: () => void
  count?: number
  className?: string
}
```

Currently both variants use identical colors (`bg-accent/10`, `bg-accent text-white` when active), so `variant` may not affect styling today but provides the extension point.

### Error Boundary Styling Pattern

Following the established `MDXFallback` and `not-found.tsx` patterns:

```typescript
// Branded error card pattern
<div className="border-[3px] border-foreground bg-surface p-8 shadow-brutal text-center">
  <h2 className="font-display text-2xl mb-4">{title}</h2>
  <p className="text-muted mb-6">{message}</p>
  <a
    href={escapeHref}
    className="inline-block border-[3px] border-foreground bg-accent text-white px-6 py-2 font-semibold shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
  >
    {escapeLabel}
  </a>
</div>
```

Use `<a href>` (not Next.js `<Link>`) for error boundary escape links -- if the router is in a broken state, client-side navigation may fail. This follows the pattern established in Phase 9's `MDXFallback`.

### Copy Button Accessibility Fix

Current:
```typescript
'opacity-0 group-hover:opacity-100 transition-opacity'
```

Fixed:
```typescript
'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'
```

Single class addition. The button already has `aria-label` for screen readers.

### MDX List Role Fix

Add `ul` and `ol` to the MDX component overrides in `mdx-content.tsx`:

```typescript
const defaultComponents: MDXComponents = {
  pre: CodeBlock,
  ul: (props) => <ul role="list" {...props} />,
  ol: (props) => <ol role="list" {...props} />,
}
```

This restores list semantics in Safari VoiceOver when `list-style: none` is applied via CSS.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (TEST-01 is Phase 12) |
| Config file | None |
| Quick run command | `npm run build` (catches type errors and build failures) |
| Full suite command | `npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ERR-01 | Global error boundary renders branded UI | manual | Visual inspection in browser (trigger error) | N/A |
| ERR-02 | Global error boundary renders full HTML shell | manual | Visual inspection (root layout error) | N/A |
| ERR-03 | Blog error boundary renders MDX-specific message | manual | Visual inspection (break MDX content) | N/A |
| ERR-04 | Loading skeletons display during transitions | manual | Visual inspection (throttle network, navigate) | N/A |
| QUAL-01 | localStorage helpers in single location | build | `npm run build` (type-checks imports) | N/A |
| QUAL-02 | formatDate extracted to shared utility | build | `npm run build` (type-checks imports) | N/A |
| QUAL-03 | useFilteredList hook works for both pages | build + manual | `npm run build` + visual filter test | N/A |
| QUAL-04 | FilterChip replaces TagChip and TechBadge | build + manual | `npm run build` + visual check both pages | N/A |
| QUAL-05 | Hero hooks extracted, hero still works | manual | Visual inspection (hero animation sequence) | N/A |
| A11Y-01 | Copy button visible on keyboard focus | manual | Tab to copy button in code block | N/A |
| A11Y-02 | List role on MDX ul/ol elements | manual | VoiceOver + Safari inspection | N/A |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build` + manual visual verification of affected pages
- **Phase gate:** Full build green + manual walkthrough of error boundaries, skeletons, filtering, hero animation, copy button keyboard focus, and VoiceOver list semantics

### Wave 0 Gaps
None -- no test framework configured (Phase 12 scope). Validation is build success + manual verification.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: Direct reading of all affected source files
- Next.js App Router conventions: `error.tsx`, `global-error.tsx`, `loading.tsx` are stable, well-documented conventions since Next.js 13 App Router GA

### Secondary (MEDIUM confidence)
- Safari VoiceOver `list-style: none` behavior: Known browser behavior documented by Scott O'Hara and widely cited in accessibility resources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all Next.js built-in conventions
- Architecture: HIGH -- patterns are directly derived from existing codebase code
- Pitfalls: HIGH -- pitfalls identified from direct code analysis of exact files being modified

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable patterns, no fast-moving dependencies)
