# Architecture Research

**Domain:** Multi-select tag/stack filtering on listing pages in a statically-generated Next.js 16 site
**Researched:** 2026-02-22
**Confidence:** HIGH

## System Overview

The site currently has fully static listing pages (`/blog`, `/projects`) with a thin client-side layer for view counts. Adding multi-select filtering introduces a second client-side concern: filtering state. The core architectural question is where filtering state lives and how to keep the listing pages statically generated while adding client interactivity.

The answer is pure client-side filtering with no URL state synchronization. All content is already available at build time (Velite compiles everything into static JSON). The data set is small (currently 3 posts, 1 project) and will remain small for years (this is a personal blog). There is no server-side filtering to do -- every item is already on the page. Filtering is a DOM visibility concern, not a data-fetching concern.

```
v1.5 -- Static Pages + Client-Side Filtering
===============================================

  Build Time                              Request Time
  +-----------------+                     +-------------------+
  | Velite compiles |  all posts/         | CDN serves static |
  | MDX content     |  projects with      | HTML with ALL     |
  | with tags/stack |  full tag/stack     | cards rendered     |
  +-----------------+  arrays             +--------+----------+
                                                   |
                                          React hydrates
                                                   |
                                          +--------v-----------+
                                          | <FilterBar>        |
                                          | 'use client'       |
                                          | reads tags/stack   |
                                          | from props (static)|
                                          | manages selected   |
                                          | set via useState   |
                                          +--------+-----------+
                                                   |
                                          +--------v-----------+
                                          | <FilteredListing>  |
                                          | 'use client'       |
                                          | receives items[]   |
                                          | + activeTags[]     |
                                          | filters in-memory  |
                                          | renders cards      |
                                          +--------------------+
```

### Component Responsibilities

| Component | Responsibility | New/Modified | Render Mode |
|-----------|----------------|--------------|-------------|
| `app/blog/page.tsx` | Blog listing -- extracts tags, passes data to filterable wrapper | **Modified** | Server (static) |
| `app/projects/page.tsx` | Projects listing -- extracts stack items, passes data to filterable wrapper | **Modified** | Server (static) |
| `components/blog/filter-bar.tsx` | Multi-select tag filter UI for blog | **New** -- `'use client'` | Client |
| `components/projects/filter-bar.tsx` | Multi-select stack filter UI for projects | **New** -- `'use client'` | Client |
| `components/blog/filtered-post-list.tsx` | Wraps PostCards with filtering + view counts | **New** -- `'use client'` | Client |
| `components/projects/filtered-project-list.tsx` | Wraps ProjectCards with filtering | **New** -- `'use client'` | Client |
| `components/blog/post-card.tsx` | Individual post card | **Unchanged** | Server |
| `components/projects/project-card.tsx` | Individual project card | **Unchanged** | Server |
| `components/blog/tag-chip.tsx` | Tag display chip -- add interactive variant | **Modified** | Server (+ clickable client variant) |
| `components/projects/tech-badge.tsx` | Stack badge -- add interactive variant | **Modified** | Server (+ clickable client variant) |
| `components/blog/listing-view-counts.tsx` | Batch view count context | **Unchanged** | Client |

## Recommended Project Structure

```
src/
  app/
    blog/
      page.tsx              # MODIFIED -- extract tags, render FilteredPostList
      [slug]/
        page.tsx            # UNCHANGED
    projects/
      page.tsx              # MODIFIED -- extract stack, render FilteredProjectList
      [slug]/
        page.tsx            # UNCHANGED
  components/
    blog/
      filter-bar.tsx        # NEW -- 'use client', multi-select tag pills
      filtered-post-list.tsx # NEW -- 'use client', filtering + card rendering
      post-card.tsx         # UNCHANGED
      tag-chip.tsx          # MODIFIED -- add interactive/toggle variant
      listing-view-counts.tsx # UNCHANGED
    projects/
      filter-bar.tsx        # NEW -- 'use client', multi-select stack pills
      filtered-project-list.tsx # NEW -- 'use client', filtering + card rendering
      project-card.tsx      # UNCHANGED
      tech-badge.tsx        # MODIFIED -- add interactive/toggle variant
    ui/
      scroll-reveal.tsx     # UNCHANGED
```

### Structure Rationale

- **Separate filter bars per domain:** Blog filters by `tags` (strings), projects filter by `stack` (strings). The data shape is identical but the visual context differs (tag-chip vs tech-badge styling). Keeping them separate avoids premature abstraction while allowing each to evolve independently.
- **Filtered list wrappers:** These are the new client boundary. They receive all items as props (serialized by Next.js from the server component parent), own the filter state, and render the filtered subset. This is the same "render-prop/wrapper" pattern already used by `ListingViewCounts`.
- **Cards remain server components:** `PostCard` and `ProjectCard` do not need `'use client'`. They receive data via props and render static HTML. The client boundary is their parent (`FilteredPostList` / `FilteredProjectList`), which is fine -- server components can be rendered as children of client components when passed as props or children.

## Architectural Patterns

### Pattern 1: Client Wrapper with Server Component Children

**What:** The listing page (server component) renders all items and passes them as props to a client wrapper. The client wrapper manages filter state and conditionally renders the items. The card components themselves remain server components passed as `children` or rendered from serialized data.

**When to use:** When filtering is purely client-side (no data fetching needed) and the full data set is small enough to ship to the client.

**Trade-offs:**
- Pro: Static generation is fully preserved -- the page HTML includes all cards
- Pro: No API calls for filtering, instant response
- Pro: SEO gets all content in the initial HTML (all cards are in the static page)
- Con: All items are shipped to the client even if filtered out (irrelevant at this scale)
- Con: Cards rendered inside a client component lose their server-component-only optimizations (but they have none -- no async, no server-only imports)

**Why not keep PostCard as a true server component:** When a server component is a child of a client component, it is rendered on the server and its output is serialized to the client. However, for dynamic filtering where the client component decides which cards to show/hide, the cards must be renderable by the client. The simplest approach is to pass the data array to the client wrapper and let it render the cards. Since `PostCard` and `ProjectCard` have no server-only logic (no `async`, no direct database calls, no `'use server'` imports), they work identically whether rendered in a server or client context. They do not need `'use client'` directives themselves.

**Example:**
```typescript
// app/blog/page.tsx -- Server component (static)
import { posts } from '@/.velite'
import { FilteredPostList } from '@/components/blog/filtered-post-list'

export default function BlogPage() {
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Extract all unique tags across published posts
  const allTags = [...new Set(publishedPosts.flatMap(p => p.tags))].sort()

  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>
      <FilteredPostList posts={publishedPosts} allTags={allTags} />
    </section>
  )
}
```

### Pattern 2: useState for Filter State (No URL Sync)

**What:** Filter selections live in React `useState`. Toggling a tag updates state, which triggers a re-render that filters the items list. No URL parameters, no `useSearchParams`, no `useRouter`.

**When to use:** When filters are ephemeral (user does not need to bookmark or share a filtered view), the data set is small, and simplicity is paramount.

**Trade-offs:**
- Pro: Zero complexity -- no URL serialization, no Suspense boundaries, no shallow routing edge cases
- Pro: Static generation is guaranteed preserved (no `useSearchParams` that could bust it)
- Pro: No flash of unfiltered content on page load (filters start empty, all items shown)
- Pro: Instant toggle response (no router navigation, no re-render from URL change)
- Con: Filter state is lost on page refresh or back-button navigation
- Con: Users cannot share a filtered view via URL

**Why this is the right call for keech.dev:** This is a personal portfolio with 3 blog posts and 1 project. Nobody is bookmarking `/blog?tags=ai,agile` or sharing filtered views. URL state adds `useSearchParams` (requires Suspense boundary, can affect static generation), `useRouter.replace` (with `scroll: false`), URL serialization/deserialization logic, and edge cases around browser history. That is significant complexity for zero practical value at this scale. If URL state becomes needed later, it is a straightforward refactor to lift state from `useState` to `useSearchParams`.

**Example:**
```typescript
// components/blog/filtered-post-list.tsx
'use client'

import { useState } from 'react'
import { PostCard } from './post-card'
import { FilterBar } from './filter-bar'
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
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  const filteredPosts = activeTags.size === 0
    ? posts
    : posts.filter(post => {
        // AND logic: post must have ALL selected tags
        for (const tag of activeTags) {
          if (!post.tags.includes(tag)) return false
        }
        return true
      })

  const slugs = filteredPosts.map(p => p.slug)

  const handleToggle = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  return (
    <>
      <FilterBar
        tags={allTags}
        activeTags={activeTags}
        onToggle={handleToggle}
      />
      {filteredPosts.length > 0 ? (
        <ListingViewCounts slugs={slugs}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map(post => (
              <ScrollReveal key={post.slug}>
                <PostCard post={post} />
              </ScrollReveal>
            ))}
          </div>
        </ListingViewCounts>
      ) : (
        <p className="text-muted">No posts match the selected tags.</p>
      )}
    </>
  )
}
```

### Pattern 3: AND Logic for Multi-Select Filtering

**What:** When multiple tags are selected, a post must have ALL selected tags to appear (intersection/AND). This is the natural behavior for narrowing results.

**When to use:** For tag filtering where users are drilling down to a specific topic intersection (e.g., "show me posts about both AI and agile").

**Trade-offs:**
- Pro: Intuitive "narrow down" behavior -- each additional tag reduces results
- Pro: Simple to implement -- check that every active tag exists in the item's tags
- Con: With many tags selected, results can quickly reach zero
- Con: OR logic ("show me posts about AI or agile") is sometimes expected in other domains

**Why AND over OR:** The PROJECT.md explicitly specifies AND logic. It also matches the UX expectation for a small content site where users are narrowing, not broadening.

### Pattern 4: Filter-Aware View Count Integration

**What:** The existing `ListingViewCounts` component takes a `slugs` array and provides view counts via context. When filtering changes, the slugs array changes, and `ListingViewCounts` should refetch counts for the new visible set.

**When to use:** Already implemented for v1.4. The key for v1.5 is that `ListingViewCounts` must wrap the filtered output, not the unfiltered output.

**Trade-offs:**
- Pro: Only fetches view counts for visible posts (efficient)
- Con: Filtering causes a new batch fetch (but this is fast and non-blocking)
- Alternative: Fetch all counts once and let the context provide them regardless of filtering. This avoids refetching but means fetching counts for posts that may never be shown. At current scale (3 posts), the difference is negligible.

**Recommended approach:** Pass all slugs to `ListingViewCounts` once (not just filtered slugs), so that toggling filters does not trigger refetches. The context provides counts for all posts; the filtered cards simply access the counts they need.

```typescript
// Better: fetch all counts once, filter does not re-trigger fetch
export function FilteredPostList({ posts, allTags }: FilteredPostListProps) {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const allSlugs = posts.map(p => p.slug) // stable reference

  const filteredPosts = activeTags.size === 0
    ? posts
    : posts.filter(post => [...activeTags].every(tag => post.tags.includes(tag)))

  return (
    <ListingViewCounts slugs={allSlugs}>
      <FilterBar tags={allTags} activeTags={activeTags} onToggle={handleToggle} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map(post => (
          <ScrollReveal key={post.slug}>
            <PostCard post={post} />
          </ScrollReveal>
        ))}
      </div>
    </ListingViewCounts>
  )
}
```

## Data Flow

### Filter Interaction Flow

```
[User clicks tag "ai" in FilterBar]
    |
    v
[handleToggle("ai") fires]
    |
    v
[setActiveTags: Set{} -> Set{"ai"}]
    |
    v
[React re-renders FilteredPostList]
    |
    v
[filteredPosts = posts.filter(post => post.tags includes all of {"ai"})]
    |
    v
[Grid re-renders with filtered subset]
    |
    v
[User clicks tag "agile"]
    |
    v
[setActiveTags: Set{"ai"} -> Set{"ai", "agile"}]
    |
    v
[filteredPosts = posts with BOTH "ai" AND "agile" tags]
    |
    v
[Grid shows narrower results (or empty state)]
```

### Tag Extraction Flow (Build-Time)

```
[Velite compiles MDX frontmatter]
    |
    v
[posts array contains tags: string[] per post]
    |
    v
[BlogPage (server) computes allTags = unique sorted tags across all posts]
    |
    v
[allTags passed as prop to FilteredPostList (client)]
    |
    v
[FilterBar renders one pill per tag]
```

### Integration with Existing View Counts

```
[FilteredPostList renders]
    |
    v
[ListingViewCounts wraps entire grid with slugs=ALL posts]
    |
    v
[View counts fetched once for all slugs]
    |
    v
[PostCard renders PostCardViewCount which reads from context]
    |
    v
[When filter changes: cards appear/disappear but NO refetch needed]
[PostCardViewCount already has the count in context]
```

### Key Data Flows

1. **Tag/stack data (build-time, static):** Velite compiles MDX frontmatter -> `tags: string[]` and `stack: string[]` arrays are available on post/project objects -> listing page extracts unique values and passes to client wrapper -> FilterBar renders interactive pills.

2. **Filter state (runtime, client-only):** User clicks tag pill -> `useState<Set<string>>` toggles the tag -> array filter produces subset -> React re-renders grid with subset. No network calls. No URL changes. Purely in-memory.

3. **View counts (runtime, unchanged from v1.4):** `ListingViewCounts` fetches batch counts from `/api/views?slugs=...` on mount. Counts are available via context. Filtering does not affect this -- counts are fetched once for all posts.

## Anti-Patterns

### Anti-Pattern 1: Using searchParams to Make the Page Dynamic

**What people do:** Accept `searchParams` in the page component and use it to filter on the server, turning the listing page from static to dynamic.

**Why it is wrong:** The moment a page component accesses `searchParams`, Next.js marks the route as dynamic. Every request hits the server instead of CDN. For a personal blog where all content is available at build time, this destroys the primary performance advantage (50ms CDN vs 200-500ms server render) for zero benefit.

**Do this instead:** Keep the page component a static server component. Pass all data to a client wrapper that handles filtering via `useState`.

### Anti-Pattern 2: Using useSearchParams Without a Suspense Boundary

**What people do:** Call `useSearchParams()` in a client component without wrapping it in `<Suspense>`. The production build fails with "Missing Suspense boundary with useSearchParams" or, worse, the entire route is silently opted out of static rendering.

**Why it is wrong:** `useSearchParams` causes the client component tree up to the nearest `Suspense` boundary to be client-side rendered. Without an explicit boundary, this can bubble up and affect the entire page.

**Do this instead:** For this project, avoid `useSearchParams` entirely. Use `useState` for filter state. If URL sync is ever needed, wrap the `useSearchParams` consumer in `<Suspense fallback={<FilterBarSkeleton />}>`.

### Anti-Pattern 3: Lifting Card Components to 'use client'

**What people do:** Add `'use client'` to `PostCard` and `ProjectCard` so they can "participate" in the filtering logic.

**Why it is wrong:** Cards do not need client-side interactivity. They receive data via props and render static HTML. Adding `'use client'` to them would increase the client bundle and is conceptually incorrect -- the card does not own or react to filter state.

**Do this instead:** Keep cards as regular components (no `'use client'` directive). Render them inside the client wrapper that owns filter state. Components without `'use client'` can be rendered by client components -- they just run as regular functions in the client bundle.

### Anti-Pattern 4: Creating a Shared Generic FilterableList Component

**What people do:** Abstract blog and project filtering into a single generic `<FilterableList>` component parameterized by item type, filter key, and card component.

**Why it is wrong:** Premature abstraction. Blog and projects have different card components, different filter labels ("Tags" vs "Stack"), different data shapes (posts have `readingTime` and view counts, projects have `image` and `github`), and different grid layouts (`lg:grid-cols-3` vs `md:grid-cols-2`). A generic component would need so many parameters and slots that it would be harder to understand than two simple, explicit components.

**Do this instead:** Write `FilteredPostList` and `FilteredProjectList` as separate, focused components. If a shared pattern emerges after both are implemented, extract it then -- not before.

### Anti-Pattern 5: Filtering by Hiding with CSS Instead of Filtering the Array

**What people do:** Render all cards and toggle `display: none` / `hidden` based on filter state.

**Why it is wrong:** All cards remain in the DOM, which means screen readers read hidden cards, `ScrollReveal` IntersectionObservers fire for invisible elements, and the "no results" empty state is harder to implement. The DOM is also larger than necessary (minor at this scale, but wrong in principle).

**Do this instead:** Filter the data array and render only matching items. Use a `key` prop on each card so React efficiently reuses DOM nodes.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `page.tsx` (server) -> `FilteredPostList` (client) | Props: `posts` array, `allTags` string array | Server serializes Velite data to client. Props must be JSON-serializable (they already are -- no functions, no dates as Date objects). |
| `FilteredPostList` (client) -> `FilterBar` (client) | Props: `tags`, `activeTags` (Set), `onToggle` callback | Both are client components, so functions can be passed as props. |
| `FilteredPostList` (client) -> `ListingViewCounts` (client) | Props: `slugs` array, `children` | Already established pattern from v1.4. `FilteredPostList` becomes the new parent that wraps `ListingViewCounts`. |
| `FilteredPostList` (client) -> `PostCard` (no directive) | Props: post data object | PostCard renders as a regular function inside the client boundary. No change to PostCard needed. |
| `FilterBar` (client) -> `TagChip` / `TechBadge` (modified) | Props: `tag`/`tech`, `active` boolean, `onClick` callback | Existing display-only components gain an interactive variant. Use `button` element instead of `span` when interactive. |

### What Does NOT Change

| Component | Why Unchanged |
|-----------|---------------|
| `velite.config.ts` | Tags and stack arrays are already in the schema. No new fields needed. |
| `app/api/views/` | View count API is orthogonal to filtering. |
| `lib/redis.ts` | No new data layer needed. Filtering is client-side only. |
| `components/blog/view-counter.tsx` | Single-post view counter is unrelated. |
| `components/blog/listing-view-counts.tsx` | Works as-is. The slugs prop changes if filtering triggers a re-render, but the recommended approach passes all slugs once. |
| `components/blog/mdx-content.tsx` | Content rendering is unrelated. |
| `globals.css` | May add active/toggle state styles, but these can use existing Tailwind utilities. |
| `next.config.ts` | No configuration changes needed. |
| Build pipeline | `velite && next build` remains the same. No new build steps. |

## Build Order (Dependencies)

```
Phase 1: Interactive Tag/Badge Components (no page changes)
  |  1a. Modify TagChip to support interactive variant
  |      - Add optional `active` boolean and `onClick` callback props
  |      - Render as <button> when onClick is provided, <span> otherwise
  |      - Active state styling (filled background, visual toggle)
  |  1b. Modify TechBadge with same interactive variant
  |  --> Testable: render both variants in isolation, verify click handlers fire
  |
Phase 2: FilterBar Components (new, isolated)
  |  2a. Create components/blog/filter-bar.tsx ('use client')
  |      - Renders row of TagChip buttons from allTags prop
  |      - Calls onToggle(tag) when clicked
  |      - Shows active state for selected tags
  |      - Optional "Clear all" button when any tags active
  |  2b. Create components/projects/filter-bar.tsx ('use client')
  |      - Same pattern but with TechBadge
  |  --> Testable: render with mock data, verify toggle behavior
  |
Phase 3: Filtered List Wrappers (new, depends on Phase 1-2)
  |  3a. Create components/blog/filtered-post-list.tsx ('use client')
  |      - useState<Set<string>> for active tags
  |      - AND-logic filter on posts array
  |      - Renders FilterBar + ListingViewCounts + PostCard grid
  |      - Empty state when no posts match
  |  3b. Create components/projects/filtered-project-list.tsx ('use client')
  |      - Same pattern with stack filtering
  |      - No view counts wrapper (projects do not track views)
  |  --> Testable: render with real Velite data, verify filtering works
  |
Phase 4: Page Integration (modifies existing pages)
  |  4a. Modify app/blog/page.tsx
  |      - Extract allTags from published posts
  |      - Replace current grid with <FilteredPostList>
  |      - Remove direct PostCard/ListingViewCounts/ScrollReveal imports
  |  4b. Modify app/projects/page.tsx
  |      - Extract allStack from projects
  |      - Replace current grid with <FilteredProjectList>
  |      - Remove direct ProjectCard/ScrollReveal imports
  |  --> Testable: full page loads, filtering works end-to-end
  |
Phase 5: Polish and Edge Cases
     5a. Verify static generation preserved (check `next build` output)
     5b. Confirm view counts still work with filtering
     5c. Empty state messaging and styling
     5d. Keyboard accessibility (tag buttons are focusable, Enter/Space toggle)
     5e. Reduced motion: ScrollReveal still respects prefers-reduced-motion
     5f. Screen reader: announce filter results count with aria-live region
```

**Why this order:**
- Phase 1 modifies existing components in a backward-compatible way (new optional props)
- Phase 2 creates new components that depend on Phase 1 but have no page impact
- Phase 3 creates wrappers that compose Phase 1 + 2 components but are not yet wired in
- Phase 4 is the only phase that modifies page files, and by this point all pieces are tested
- Phase 5 is polish that requires the full pipeline to be functional

**Key dependency:** `FilteredPostList` must wrap `ListingViewCounts` (not the other way around) because the filtered list decides which slugs to show. This means `FilteredPostList` is the outermost client boundary on the blog listing page.

## Decision: Why Not URL State

This decision deserves explicit documentation because URL state is the "obvious" choice in most Next.js filtering tutorials. Here is the analysis:

**Arguments for URL state (searchParams):**
- Shareable/bookmarkable filtered views
- Browser back/forward preserves filter state
- Standard web pattern

**Arguments against URL state (for this project):**
- Requires `useSearchParams` hook, which mandates a `<Suspense>` boundary in production or risks busting static generation
- Requires `useRouter.replace()` with `{ scroll: false }` for every filter toggle
- URL serialization/deserialization of multi-select arrays (encoding `?tags=ai,agile` or `?tags=ai&tags=agile`)
- Edge cases: stale searchParams in layouts, initial render flash, hydration mismatch
- Nobody is bookmarking or sharing filtered views on a personal blog with 3 posts
- Adds ~30-50 lines of URL management code for zero user-facing value

**Decision:** Use `useState`. Revisit if the site grows to 20+ posts and users request shareable filters.

**Migration path if needed later:** Replace `useState<Set<string>>` with `useSearchParams` + a `parseTagsFromURL` / `serializeTagsToURL` helper pair. The rest of the component structure (FilterBar, FilteredPostList, PostCard) remains identical.

## Sources

- [Next.js useSearchParams documentation (v16.1.6)](https://nextjs.org/docs/app/api-reference/functions/use-search-params) -- Suspense boundary requirements, static rendering behavior, `scroll: false` option (HIGH confidence, official docs dated 2026-02-20)
- [Next.js useRouter documentation (v16.1.6)](https://nextjs.org/docs/app/api-reference/functions/use-router) -- `router.replace(href, { scroll: false })` API (HIGH confidence, official docs dated 2026-02-20)
- [Next.js page.js conventions](https://nextjs.org/docs/app/api-reference/file-conventions/page) -- `searchParams` prop is a Promise in Next.js 15+/16, accessing it opts route out of static generation (HIGH confidence, official docs)
- [Missing Suspense boundary with useSearchParams](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) -- build failure behavior without Suspense (HIGH confidence, official docs)
- [searchParams breaks static generation discussion](https://github.com/vercel/next.js/discussions/58884) -- community confirmation that searchParams opts out of SSG (MEDIUM confidence, GitHub discussion)
- [Aurora Scharff: Managing Advanced Search Param Filtering](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) -- patterns for URL state filtering with nuqs and native hooks (MEDIUM confidence, practitioner blog)
- Existing codebase analysis: `app/blog/page.tsx`, `app/projects/page.tsx`, `components/blog/post-card.tsx`, `components/projects/project-card.tsx`, `components/blog/listing-view-counts.tsx`, `components/blog/tag-chip.tsx`, `components/projects/tech-badge.tsx`, `velite.config.ts`, content frontmatter (HIGH confidence, direct inspection)

---
*Architecture research for: Multi-select tag/stack filtering on listing pages*
*Researched: 2026-02-22*
