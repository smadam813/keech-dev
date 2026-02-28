# Phase 7: Filtered Listing Integration - Research

**Researched:** 2026-02-27
**Domain:** Client-side filtering with URL search param persistence on statically-generated Next.js 16 listing pages
**Confidence:** HIGH

## Summary

Phase 7 wires the Phase 6 FilterBar component into the blog and projects listing pages, adding client-side filtering with URL search param persistence. The core technical challenge is using `useSearchParams` to read/write filter state to the URL while preserving static generation of the page shell. This requires a Suspense boundary around the client component that calls `useSearchParams`, and careful component tree design to keep the page heading and metadata as server-rendered static HTML.

The architecture is a "client island" pattern: the server component page extracts all content and unique tags/stack from Velite data, renders the page heading statically, then delegates filtering to a `'use client'` wrapper component that owns filter state via `useSearchParams`. URL updates use `window.history.replaceState` (the native History API) rather than `router.push`/`router.replace`, because Next.js 16 integrates `pushState`/`replaceState` with the router and `useSearchParams` re-renders automatically. This avoids triggering a full client-side navigation for each filter toggle while still updating the URL.

The filtered list components handle AND logic (posts must have ALL selected tags), empty state with a "clear filters" action, and integration with the existing `ListingViewCounts` context for blog posts. ScrollReveal animations are bypassed when filters are active to avoid re-triggering entrance animations on filter changes.

**Primary recommendation:** Create `FilteredPostList` and `FilteredProjectList` client components that read filter state from `useSearchParams`, compute the filtered subset, and render FilterBar + card grid. Wrap them in `<Suspense>` at the page level to preserve static generation of the page shell.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
No locked decisions from the user. All implementation decisions are at Claude's discretion.

### Claude's Discretion
The user deferred all implementation decisions to Claude's judgment. The following areas should be resolved during research and planning based on the site's existing patterns and conventions:

**Empty state design:**
- Visual treatment (text-only, icon + text, or rune-themed)
- Whether messaging is page-specific ("No posts...") or generic ("No results...")
- Placement relative to the grid (replace grid vs inline)
- Clear filters action style (text link vs styled button)

**Filter chip ordering:**
- Sort order of tags/stack items in the filter bar (alphabetical vs frequency)
- Whether selected chips stay in place or move to front
- Overflow behavior when many chips exist (wrap vs horizontal scroll)
- Whether zero-result chips are dimmed when AND selections narrow results

**Page layout flow:**
- Filter bar placement relative to heading and grid
- Whether a visible label ("Filter by tags:") precedes the chips
- Grid column behavior when filtered results are fewer than columns
- Server/client component architecture (client island vs full client page)

**Filtering feel:**
- Visual transition when items are filtered (instant vs basic CSS transition)
- Initial load behavior with URL params (pre-filtered vs brief reveal)
- Whether tags on post detail pages link to filtered listing
- URL history behavior (push vs replace on each toggle)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOG-01 | User can see a filter bar with all unique tags displayed as chips above the blog post grid | Server component extracts unique tags from Velite `posts` data via `[...new Set(posts.flatMap(p => p.tags))].sort()` and passes to `FilteredPostList`. FilterBar (Phase 6) renders chips using TagChip's toggle mode. |
| BLOG-02 | User can toggle multiple tag chips to filter posts (AND logic -- only posts with all selected tags appear) | `FilteredPostList` reads active tags from `useSearchParams`, computes filtered set via `posts.filter(post => [...activeTags].every(tag => post.tags.includes(tag)))`. Toggle updates URL via `window.history.replaceState`. |
| PROJ-01 | User can see a filter bar with all unique stack items displayed as chips above the project grid | Server component extracts unique stack items from Velite `projects` data and passes to `FilteredProjectList`. FilterBar renders chips using TechBadge's toggle mode. |
| PROJ-02 | User can toggle multiple stack chips to filter projects (AND logic -- only projects with all selected stack items appear) | Same pattern as BLOG-02 but with `stack` field. `FilteredProjectList` reads from `useSearchParams` and filters with AND logic. |
| UX-02 | User can click "Clear filters" to reset all selected filters (button only visible when filters active) | FilterBar (Phase 6) already renders "Clear all" button when `activeItems.size > 0`. Clear handler removes the search param from the URL entirely via `window.history.replaceState`. Empty state also includes a "clear filters" link. |
| UX-03 | User sees an empty state message with a "clear filters" action when no items match selected filters | Filtered list components render an empty state div when `filteredItems.length === 0` and filters are active. Includes page-specific message ("No posts match the selected tags") and a "Clear filters" button that resets all selections. |
| UX-06 | User's selected filters persist in the URL as search params (e.g., `?tags=ai,agile`) for sharing and bookmarking | `useSearchParams` reads tags from URL on mount. Toggle updates write comma-separated values to URL via `window.history.replaceState`. Suspense boundary preserves static generation. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.4 | `useSearchParams`, `Suspense`, `useCallback` | Already in project. `useSearchParams` is the official Next.js hook for reading URL query strings in client components. |
| Next.js 16 | 16.1.6 | `next/navigation` hooks (`useSearchParams`, `usePathname`), Suspense integration, static generation | Already in project. The App Router's `useSearchParams` + Suspense boundary pattern is the standard for URL state in static pages. |
| Tailwind CSS v4 | 4.1.18 | Empty state styling, layout adjustments | Already in project. No new tokens needed. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | -- | -- | This phase uses only existing dependencies. Zero new packages. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useSearchParams` + `window.history.replaceState` | `useRouter().replace()` | `router.replace()` triggers a full client-side navigation (re-renders server components, re-fetches). `window.history.replaceState` is a lightweight URL update that Next.js intercepts and syncs with `useSearchParams`. For filter toggles (same-page, no data change), `replaceState` is faster and avoids unnecessary work. |
| `useSearchParams` + `window.history.replaceState` | `useState` (no URL persistence) | `useState` is simpler (no Suspense boundary, no URL serialization) but violates UX-06 which explicitly requires URL persistence for sharing/bookmarking. |
| `window.history.replaceState` (replace) | `window.history.pushState` (push) | `pushState` adds a history entry per filter toggle, making the back button traverse every filter change. `replaceState` replaces the current entry, so back button goes to the previous page, not the previous filter state. For filter interactions, replace is the correct behavior -- users do not expect back button to undo filter toggles one by one. |
| Comma-separated `?tags=ai,agile` | Repeated params `?tags=ai&tags=agile` | Comma-separated is more readable in the URL, matches the success criteria format, and is simpler to serialize/deserialize. Repeated params are technically more "correct" per HTTP spec but produce longer URLs and require `getAll()` to parse. |
| Separate `FilteredPostList` / `FilteredProjectList` | Generic `FilterableList<T>` component | Blog and projects have different data shapes (posts have `readingTime`, view counts; projects have `image`, `github`), different grid layouts (`lg:grid-cols-3` vs `md:grid-cols-2`), and different child components. A generic component would be over-abstracted. Two focused components are clearer. |
| nuqs library | -- | Type-safe URL state library for Next.js. Excellent for complex URL state. Overkill for a single filter param -- adds a dependency for something achievable in ~20 lines of code. |

**Installation:**
```bash
# No installation needed. Zero new dependencies.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    blog/
      page.tsx                    # MODIFIED -- extract tags, render FilteredPostList in Suspense
    projects/
      page.tsx                    # MODIFIED -- extract stack, render FilteredProjectList in Suspense
  components/
    blog/
      filtered-post-list.tsx      # NEW -- 'use client', useSearchParams, filtering + cards
    projects/
      filtered-project-list.tsx   # NEW -- 'use client', useSearchParams, filtering + cards
    ui/
      filter-bar.tsx              # UNCHANGED (Phase 6)
```

### Pattern 1: Client Island with Suspense Boundary for Static Generation

**What:** The listing page remains a server component that renders the `<h1>` heading and exports `metadata` statically. The filterable content is a client component wrapped in `<Suspense>`. The Suspense boundary isolates the `useSearchParams` call so it only client-side renders the filter + grid area, while the page heading and metadata remain part of the static HTML shell.

**When to use:** When a statically-generated page needs to read URL search params for client-side interactivity without opting the entire page into client-side rendering.

**Source:** [Next.js Official Docs: useSearchParams Static Rendering](https://nextjs.org/docs/app/api-reference/functions/use-search-params#static-rendering), [Missing Suspense Boundary](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)

**Example:**
```typescript
// app/blog/page.tsx -- Server component (remains static)
import { Suspense } from 'react'
import { posts } from '@/.velite'
import { FilteredPostList } from '@/components/blog/filtered-post-list'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: '...',
}

export default function BlogPage() {
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const allTags = [...new Set(publishedPosts.flatMap(p => p.tags))].sort()

  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>
      <Suspense fallback={/* FilterBar skeleton + card grid */}>
        <FilteredPostList posts={publishedPosts} allTags={allTags} />
      </Suspense>
    </section>
  )
}
```

**Key points:**
- `metadata` export works because the page is still a server component
- The `<h1>` is part of the static HTML -- no CLS from heading
- `<Suspense>` boundary prevents the entire page from deopting to CSR
- The fallback should approximate the FilterBar + grid height to minimize CLS

### Pattern 2: URL State via useSearchParams + window.history.replaceState

**What:** Read filter state from the URL using `useSearchParams`. Write filter state to the URL using `window.history.replaceState` (native History API). Next.js intercepts `replaceState` calls and syncs them with `useSearchParams`, triggering a re-render with the updated params.

**When to use:** For same-page URL state updates that should not create browser history entries and should not trigger a full client-side navigation.

**Source:** [Next.js Official Docs: Native History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api)

**Example:**
```typescript
'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

function useFilterState(paramName: string) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Parse comma-separated values from URL
  const activeItems = new Set(
    searchParams.get(paramName)?.split(',').filter(Boolean) ?? []
  )

  const toggle = useCallback((item: string) => {
    const next = new Set(activeItems)
    if (next.has(item)) next.delete(item)
    else next.add(item)

    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) {
      params.delete(paramName)
    } else {
      params.set(paramName, [...next].sort().join(','))
    }

    const query = params.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [searchParams, pathname, paramName])

  const clear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramName)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [searchParams, pathname, paramName])

  return { activeItems, toggle, clear }
}
```

**Key points:**
- `window.history.replaceState` integrates with Next.js Router -- `useSearchParams` re-renders automatically
- `replaceState` does not add history entries (back button goes to previous page, not previous filter state)
- Sorting the comma-separated values ensures consistent URL representation (`?tags=agile,ai` not `?tags=ai,agile` then `?tags=agile,ai`)
- When all filters are cleared, the param is deleted entirely (clean URL with no `?tags=`)
- `usePathname` provides the base path for the URL update

### Pattern 3: AND Logic Filtering with Set Operations

**What:** When multiple filters are selected, items must match ALL selected filters (intersection/AND). This is the natural narrowing behavior for tag filtering.

**When to use:** For tag/category filtering where each additional selection narrows the result set.

**Example:**
```typescript
const filteredPosts = activeTags.size === 0
  ? posts
  : posts.filter(post =>
      [...activeTags].every(tag => post.tags.includes(tag))
    )
```

**Key points:**
- When no filters are active (`size === 0`), show all items -- skip the filter entirely for performance
- `[...activeTags].every(tag => post.tags.includes(tag))` is O(n*m) where n = active tags and m = post tags -- negligible at this scale (7 tags, 3 posts)
- AND logic means adding more filters always narrows results, which can quickly reach zero with sparse tag coverage

### Pattern 4: View Count Integration (Blog Only)

**What:** Wrap `ListingViewCounts` around both the FilterBar and card grid, passing ALL slugs (not just filtered). This fetches view counts once on mount; filtering does not trigger refetches.

**When to use:** Specifically for the blog listing where view counts are displayed on post cards.

**Example:**
```typescript
export function FilteredPostList({ posts, allTags }: Props) {
  const allSlugs = useMemo(() => posts.map(p => p.slug), [posts])
  // ... filtering logic ...

  return (
    <ListingViewCounts slugs={allSlugs}>
      <FilterBar ... />
      {filteredPosts.length > 0 ? (
        <div className="grid ...">
          {filteredPosts.map(post => <PostCard ... />)}
        </div>
      ) : (
        <EmptyState onClear={clear} />
      )}
    </ListingViewCounts>
  )
}
```

**Key points:**
- `allSlugs` is stable (memoized) -- does not change when filters change
- `ListingViewCounts` fetches batch counts once, provides via context
- `PostCardViewCount` inside each `PostCard` reads from context -- works regardless of filtering
- The projects page does NOT have view counts, so `FilteredProjectList` does not need this wrapper

### Pattern 5: ScrollReveal Bypass When Filtering

**What:** When any filter is active, render cards without `ScrollReveal` wrappers so they appear instantly. When no filters are active (initial page load), use `ScrollReveal` for the entrance animation.

**When to use:** Whenever dynamic content changes (filtering) would cause re-triggering of entrance animations.

**Example:**
```typescript
const isFiltering = activeTags.size > 0

{filteredPosts.map(post => (
  isFiltering ? (
    <PostCard key={post.slug} post={post} />
  ) : (
    <ScrollReveal key={post.slug}>
      <PostCard post={post} />
    </ScrollReveal>
  )
))}
```

**Key points:**
- Cards that were already revealed via ScrollReveal would re-mount and re-animate when filtering changes the list -- this is jarring
- Bypassing ScrollReveal when filtering is active eliminates the re-animation problem
- When the user clears all filters, ScrollReveal re-applies for the full unfiltered list
- This is a simple conditional that avoids complex animation state tracking

### Anti-Patterns to Avoid

- **Accessing `searchParams` page prop for filtering:** The `searchParams` prop on page.tsx is a Promise in Next.js 16 and accessing it opts the entire route into dynamic rendering. Use `useSearchParams` in a client component instead.
- **Using `router.replace()` for filter toggles:** Triggers a full client-side navigation with server component re-render. Use `window.history.replaceState` for lightweight same-page URL updates.
- **Placing the Suspense boundary inside the client component:** The Suspense boundary must be in the server component page, wrapping the client component that calls `useSearchParams`. Placing Suspense inside the client component does not prevent CSR bailout.
- **Importing Velite data (`@/.velite`) in client components:** Velite generates server-side data. Import in the server component page and pass as serializable props to client components.
- **Wrapping the entire page in `'use client'`:** Destroys static generation of the heading and metadata. Keep the page as a server component; only the filtered content section is a client island.
- **Computing unique tags inside the client component:** Extract unique tags in the server component (where all Velite data is available) and pass them as props. This avoids importing `posts` in the client bundle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL search param state management | Custom URL parse/serialize library | `useSearchParams` + `URLSearchParams` API + `window.history.replaceState` | Native browser API is reliable, well-tested, and integrated with Next.js Router. The `URLSearchParams` constructor handles encoding/decoding automatically. |
| Suspense fallback for filter area | Nothing (empty Suspense fallback) | A lightweight placeholder matching FilterBar + grid height | Empty Suspense fallback causes CLS when the client component mounts. A sized placeholder (even just a `min-height` div) prevents layout shift. |
| AND logic for multi-select filtering | Custom set intersection library | `Array.every()` + `Array.includes()` | Native JavaScript array methods handle this in one line. At this data scale (3 posts, 1 project), any optimization is unnecessary. |
| Filter state toggle logic | State management library (Zustand, Jotai) | `useSearchParams` as the source of truth | The URL IS the state. Reading from `useSearchParams` and writing via `replaceState` means the URL is always in sync. No separate state store needed. |

**Key insight:** The URL is the state store. `useSearchParams` reads it, `window.history.replaceState` writes it, and Next.js keeps them in sync. No useState, no context, no external state management library. The only client-side state is what the URL already contains.

## Common Pitfalls

### Pitfall 1: Missing Suspense Boundary Breaks Static Generation

**What goes wrong:** Production build fails with "Missing Suspense boundary with useSearchParams" or the entire page silently deopts to client-side rendering, producing a blank HTML shell.

**Why it happens:** `useSearchParams()` causes the client component tree up to the nearest Suspense boundary to be client-side rendered. Without an explicit boundary, this bubbles up to the page level. In dev mode (which is always dynamic), this is invisible -- it only manifests in production builds.

**How to avoid:** Wrap `FilteredPostList` and `FilteredProjectList` in `<Suspense fallback={...}>` in the server component page. The Suspense boundary MUST be in the server component, not inside the client component.

**Warning signs:** `next build` output shows `/blog` or `/projects` as lambda (dynamic) instead of circle (static). Build error mentioning "Missing Suspense boundary."

### Pitfall 2: Flash of Unfiltered Content (FOUC) on URL with Params

**What goes wrong:** User visits `/blog?tags=ai` (shared link). The static HTML shows ALL posts (because static generation has no knowledge of search params). After hydration, the client reads the URL and filters down. For 100-500ms, the user sees all posts then the list shrinks.

**Why it happens:** Static HTML is generated at build time with no search params. The Suspense fallback is shown first, then the client component mounts and applies filters.

**How to avoid:** Use the Suspense fallback strategically. Since the Suspense boundary shows the fallback until the client component mounts, the fallback is what users see during the FOUC window -- not the unfiltered content. Design the fallback as a neutral placeholder (empty filter bar + grid skeleton or just a spacer) rather than the full unfiltered list. When the client mounts, it immediately applies the correct filters from the URL. The "flash" becomes fallback->filtered rather than all-content->filtered.

**Warning signs:** Navigate to `/blog?tags=ai` on a throttled connection and see all posts for a split second before filtering.

### Pitfall 3: ListingViewCounts Context Breaking After Restructuring

**What goes wrong:** View counts silently disappear from blog post cards after adding the filtered list wrapper. No error in console.

**Why it happens:** `PostCardViewCount` reads from `ViewCountsContext` via `useViewCount(slug)`. If `ListingViewCounts` (the context provider) is not an ancestor of the card components in the new tree structure, the context returns the default empty object and all counts are `null`.

**How to avoid:** `FilteredPostList` must render `ListingViewCounts` wrapping both the filter bar and the card grid. Pass `allSlugs` (all published post slugs, not just filtered ones) so counts are fetched once and available for any card that appears after filtering.

**Warning signs:** View counts disappear. `useViewCount(slug)` returns `null` for all slugs.

### Pitfall 4: ScrollReveal Re-animation on Filter Change

**What goes wrong:** Every time a filter is toggled, cards fade in again with the entrance animation. This is distracting and makes filtering feel sluggish.

**Why it happens:** When the filtered array changes, React unmounts and remounts card components. New `ScrollReveal` wrappers start in `opacity: 0` state and trigger their IntersectionObserver animation.

**How to avoid:** Conditionally bypass ScrollReveal when any filter is active. Use ScrollReveal only when `activeTags.size === 0` (initial unfiltered page load). When filtering, render cards directly without the animation wrapper.

**Warning signs:** Cards flicker or fade in every time a filter tag is toggled.

### Pitfall 5: Stale Closure in Toggle Callback

**What goes wrong:** Toggling a filter uses the wrong set of active items because the callback captures a stale reference to `searchParams`.

**Why it happens:** JavaScript closures capture the value of `searchParams` at the time the callback is created. If the callback is not properly memoized with `searchParams` in the dependency array, it reads stale URL state.

**How to avoid:** Use `useCallback` with `[searchParams, pathname, paramName]` in the dependency array. Or read `searchParams` fresh inside the callback. The `useSearchParams` hook always returns the latest value.

**Warning signs:** Rapidly toggling filters produces incorrect URL state. Two tags appear selected in the URL but only one chip appears active.

### Pitfall 6: CLS from Suspense Fallback Height Mismatch

**What goes wrong:** When the Suspense fallback has a different height than the rendered content, the page layout shifts when the client component hydrates. The heading is static and stays in place, but everything below the Suspense boundary jumps.

**Why it happens:** The fallback renders before the client component. If the fallback is empty or too short, the card grid jumps down when the actual content replaces it.

**How to avoid:** Design the Suspense fallback to approximate the height of the filter bar + first row of cards. A simple approach: render a `<div>` with `min-height` matching the expected content height. Alternatively, render the FilterBar chips as inert (non-interactive) in the fallback so the visual structure is present before hydration.

**Warning signs:** Content below the filter area visibly jumps on page load. Lighthouse CLS score degrades.

## Code Examples

### FilteredPostList Component (Blog)

```typescript
// src/components/blog/filtered-post-list.tsx
'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { FilterBar } from '@/components/ui/filter-bar'
import { TagChip } from '@/components/blog/tag-chip'
import { PostCard } from './post-card'
import { ListingViewCounts } from './listing-view-counts'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

interface FilteredPostListProps {
  posts: Array<{
    title: string
    slug: string
    date: string
    description?: string
    excerpt: string
    tags: string[]
    readingTime: number
  }>
  allTags: string[]
}

export function FilteredPostList({ posts, allTags }: FilteredPostListProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Read active tags from URL
  const activeTags = useMemo(() => new Set(
    searchParams.get('tags')?.split(',').filter(Boolean) ?? []
  ), [searchParams])

  // Stable slugs for view count fetching (does not change when filters change)
  const allSlugs = useMemo(() => posts.map(p => p.slug), [posts])

  // AND logic: post must have ALL selected tags
  const filteredPosts = activeTags.size === 0
    ? posts
    : posts.filter(post =>
        [...activeTags].every(tag => post.tags.includes(tag))
      )

  const isFiltering = activeTags.size > 0

  const updateURL = useCallback((next: Set<string>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) {
      params.delete('tags')
    } else {
      params.set('tags', [...next].sort().join(','))
    }
    const query = params.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [searchParams, pathname])

  const handleToggle = useCallback((tag: string) => {
    const next = new Set(activeTags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    updateURL(next)
  }, [activeTags, updateURL])

  const handleClear = useCallback(() => {
    updateURL(new Set())
  }, [updateURL])

  return (
    <ListingViewCounts slugs={allSlugs}>
      <FilterBar
        items={allTags}
        activeItems={activeTags}
        onToggle={handleToggle}
        onClear={handleClear}
        renderChip={({ item, active, onToggle }) => (
          <TagChip key={item} tag={item} active={active} onToggle={onToggle} />
        )}
        label="Filter by tag"
      />

      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => (
            isFiltering ? (
              <PostCard key={post.slug} post={post} />
            ) : (
              <ScrollReveal key={post.slug}>
                <PostCard post={post} />
              </ScrollReveal>
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-lg mb-4">
            No posts match the selected tags.
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="text-accent hover:text-accent-hover font-mono font-bold underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </ListingViewCounts>
  )
}
```

### FilteredProjectList Component (Projects)

```typescript
// src/components/projects/filtered-project-list.tsx
'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { FilterBar } from '@/components/ui/filter-bar'
import { TechBadge } from '@/components/projects/tech-badge'
import { ProjectCard } from './project-card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

interface FilteredProjectListProps {
  projects: Array<{
    title: string
    slug: string
    description: string
    date: string
    featured?: boolean
    stack: string[]
    github?: string
    demo?: string
    image?: { src: string }
  }>
  allStack: string[]
}

export function FilteredProjectList({ projects, allStack }: FilteredProjectListProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const activeStack = useMemo(() => new Set(
    searchParams.get('stack')?.split(',').filter(Boolean) ?? []
  ), [searchParams])

  const filteredProjects = activeStack.size === 0
    ? projects
    : projects.filter(project =>
        [...activeStack].every(tech => project.stack.includes(tech))
      )

  const isFiltering = activeStack.size > 0

  const updateURL = useCallback((next: Set<string>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) {
      params.delete('stack')
    } else {
      params.set('stack', [...next].sort().join(','))
    }
    const query = params.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
  }, [searchParams, pathname])

  const handleToggle = useCallback((tech: string) => {
    const next = new Set(activeStack)
    if (next.has(tech)) next.delete(tech)
    else next.add(tech)
    updateURL(next)
  }, [activeStack, updateURL])

  const handleClear = useCallback(() => {
    updateURL(new Set())
  }, [updateURL])

  return (
    <>
      <FilterBar
        items={allStack}
        activeItems={activeStack}
        onToggle={handleToggle}
        onClear={handleClear}
        renderChip={({ item, active, onToggle }) => (
          <TechBadge key={item} tech={item} active={active} onToggle={onToggle} />
        )}
        label="Filter by technology"
      />

      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map(project => (
            isFiltering ? (
              <ProjectCard key={project.slug} project={project} />
            ) : (
              <ScrollReveal key={project.slug}>
                <ProjectCard project={project} />
              </ScrollReveal>
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-lg mb-4">
            No projects match the selected technologies.
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="text-accent hover:text-accent-hover font-mono font-bold underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
```

### Blog Page with Suspense Boundary

```typescript
// app/blog/page.tsx
import { Suspense } from 'react'
import { posts } from '@/.velite'
import { FilteredPostList } from '@/components/blog/filtered-post-list'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical articles, tutorials, and thoughts on software development.',
}

export default function BlogPage() {
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const allTags = [...new Set(publishedPosts.flatMap(p => p.tags))].sort()

  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>
      <Suspense>
        <FilteredPostList posts={publishedPosts} allTags={allTags} />
      </Suspense>
    </section>
  )
}
```

## Discretion Recommendations

Based on the codebase's existing patterns and the neobrutalist design language, here are recommended decisions for the areas left to Claude's discretion:

### Empty State Design
- **Visual treatment:** Text-only with accent-colored "Clear filters" link. No icon or rune -- the empty state should be lightweight and not draw excessive attention. Matches the existing "No posts yet. Check back soon!" pattern.
- **Messaging:** Page-specific: "No posts match the selected tags." / "No projects match the selected technologies." Specific is better than generic "No results" because it tells the user WHY there are no results.
- **Placement:** Replace the grid entirely. When zero items match, show the empty state centered in the grid area.
- **Clear filters action:** Underlined text link styled like the FilterBar's "Clear all" button (text-accent, font-mono, font-bold, underline). Consistent with existing clear action.

### Filter Chip Ordering
- **Sort order:** Alphabetical. Predictable, no confusion when content changes. Frequency-based ordering would change between page loads as content is added.
- **Selected chips:** Stay in place. Moving selected chips to the front causes layout shift and breaks spatial memory.
- **Overflow:** Flex-wrap (wrapping rows). With 7 blog tags and 8 project stack items, chips fit on 1-2 rows. No horizontal scroll needed.
- **Zero-result chips:** Not dimmed in Phase 7. Dimming requires computing match counts per chip, which is Phase 8 scope (BLOG-03, PROJ-03). Phase 7 shows all chips as equally available.

### Page Layout Flow
- **Filter bar placement:** Directly below the `<h1>` heading, above the card grid. No visible label ("Filter by tags:") -- the chips are self-explanatory in context. The `aria-label` on the filter bar provides accessibility.
- **Grid behavior:** Natural CSS grid flow. When fewer items than columns, grid cells simply fill from left. No min-height or placeholder cells.
- **Component architecture:** Client island. Page is a server component; `FilteredPostList`/`FilteredProjectList` are client components wrapped in Suspense.

### Filtering Feel
- **Visual transition:** Instant. No CSS transition on card appearance/disappearance. Filtering is a data operation -- instant feedback is correct. CSS transitions on filter changes feel laggy, not smooth. (Phase 8's BLOG-04 adds fade animations as a separate concern.)
- **Initial load with URL params:** Suspense fallback -> filtered content. No flash of unfiltered content because the Suspense boundary shows the fallback until the client mounts and applies filters.
- **Tags on post detail pages:** Remain display-only `<span>` elements (no link to filtered listing). FILT-03 is explicitly deferred to future requirements.
- **URL history behavior:** Replace (`window.history.replaceState`). Filter toggles do not create history entries. Back button navigates to the previous page.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `router.push`/`router.replace` for URL param updates | `window.history.replaceState` + Next.js Router integration | Next.js 14.0.3+ (2023), stable in v16 | Lightweight URL updates without triggering server component re-renders. `useSearchParams` syncs automatically. |
| `export const dynamic = 'force-dynamic'` to handle searchParams | `useSearchParams` in client component + Suspense boundary | Next.js 15+ | Page stays statically generated; only the Suspense-wrapped client island reads dynamic URL state. |
| `useSearchParams` without Suspense (silent CSR deopt) | Mandatory Suspense boundary (build error in Next.js 15+) | Next.js 15 | Build now fails if `useSearchParams` is used without Suspense, preventing accidental CSR bailout. |
| `searchParams` page prop as `Record<string, string>` | `searchParams` page prop as `Promise<...>` (Next.js 16) | Next.js 15 -> 16 | Do NOT use the page prop for filtering -- it opts the route into dynamic rendering. Use `useSearchParams` hook in a client component instead. |

**Deprecated/outdated:**
- `export const dynamic = 'force-dynamic'` -- replaced by `connection()` from `next/server` for intentionally dynamic routes. Not needed here since we want static generation.
- `missingSuspenseWithCSRBailout: false` config option -- was available in Next.js 14.x to disable the Suspense requirement. Removed in later versions. Always use Suspense.

## Open Questions

1. **Suspense fallback content**
   - What we know: A Suspense fallback is required to prevent CSR bailout. The fallback shows while the client component hydrates.
   - What's unclear: Whether to use an empty fallback (`<Suspense>` with no `fallback` prop, which renders nothing), a sized placeholder div, or a skeleton that approximates the filter bar + grid.
   - Recommendation: Start with an empty Suspense fallback (no `fallback` prop). With the current small content set (3 posts, 1 project), hydration is near-instant and the fallback is barely visible. If CLS becomes measurable, add a min-height placeholder. Skeleton components are over-engineering for this scale.

2. **URL encoding of stack items with special characters**
   - What we know: Project stack items include "Next.js 16", "React 19", "Tailwind CSS v4" -- these contain spaces and dots.
   - What's unclear: Whether `URLSearchParams` encoding/decoding handles these correctly for readability and sharing.
   - Recommendation: `URLSearchParams.set()` automatically encodes special characters. The URL will show `?stack=Next.js+16,React+19` which is valid and correctly decoded by `URLSearchParams.get()`. Test this during implementation to confirm round-trip fidelity. If URL readability is a concern, the current stack items are simple enough that encoding is transparent.

3. **Comma-separated values containing commas**
   - What we know: Current tags (`ai`, `fintech`, `agile`, etc.) and stack items (`Next.js 16`, `React 19`, etc.) do not contain commas.
   - What's unclear: If a future tag or stack item contains a comma, the comma-separated URL format would break.
   - Recommendation: Accept this limitation for now. The content author controls the tags/stack values. Document that commas are reserved as the separator character. If this becomes an issue, switch to repeated params (`?tags=ai&tags=agile`) or pipe separation.

## Sources

### Primary (HIGH confidence)
- [Next.js useSearchParams API Reference (v16.1.6)](https://nextjs.org/docs/app/api-reference/functions/use-search-params) -- static rendering behavior, Suspense requirement, read-only URLSearchParams interface, complete API
- [Next.js Missing Suspense Boundary](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) -- build failure behavior, fix patterns, Suspense wrapping examples
- [Next.js Entire Page Deopted into CSR](https://nextjs.org/docs/messages/deopted-into-client-rendering) -- how useSearchParams without Suspense breaks static generation
- [Next.js useRouter API Reference (v16.1.6)](https://nextjs.org/docs/app/api-reference/functions/use-router) -- push vs replace behavior, scroll options
- [Next.js Linking and Navigating: Native History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api) -- `window.history.pushState` / `replaceState` integration with `useSearchParams`, official code examples
- Codebase inspection: `src/components/ui/filter-bar.tsx`, `src/components/blog/tag-chip.tsx`, `src/components/projects/tech-badge.tsx`, `src/app/blog/page.tsx`, `src/app/projects/page.tsx`, `src/components/blog/listing-view-counts.tsx`, `src/components/blog/post-card.tsx`, `src/components/projects/project-card.tsx`, `velite.config.ts`, content frontmatter, `src/app/globals.css`
- Existing project research: `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`

### Secondary (MEDIUM confidence)
- [Aurora Scharff: Managing Advanced Search Param Filtering in Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) -- practitioner patterns for URL state filtering
- [Next.js Discussion #48110: Shallow Routing](https://github.com/vercel/next.js/discussions/48110) -- community patterns for `window.history.pushState` / `replaceState` as shallow routing replacement

### Tertiary (LOW confidence)
- None. All findings verified against official documentation or direct codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all patterns verified against official Next.js 16 docs
- Architecture: HIGH -- client island with Suspense boundary is the officially documented pattern for `useSearchParams` with static generation
- Pitfalls: HIGH -- all pitfalls identified through codebase analysis and official docs; the Suspense/static generation interaction is well-documented
- Discretion recommendations: HIGH -- all recommendations derived from existing codebase patterns and conventions

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable -- based on Next.js 16 official docs and existing codebase patterns)
