# Stack Research

**Domain:** Multi-select tag/stack filtering on listing pages for a statically generated Next.js portfolio
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

This milestone requires **zero new dependencies**. The filtering feature is entirely achievable with React 19 built-in hooks (`useState`, `useTransition`), Next.js `useSearchParams`, and CSS transitions already available in the codebase.

The key architectural decision is **URL-based filtering with `useSearchParams`** rather than ephemeral `useState`. This preserves shareability, browser back/forward navigation, and is the established Next.js pattern for filter state. The listing pages remain statically generated at build time -- all filtering happens client-side by narrowing the full content array that is already embedded in the page HTML. No server round-trips, no dynamic rendering.

**Why no new libraries:** The codebase has a deliberate zero-animation-library constraint (Framer Motion and GSAP are explicitly out of scope). nuqs (the popular URL state management library) was evaluated and rejected -- it adds 6 kB for what amounts to 15 lines of `useSearchParams` + `URLSearchParams` logic in this use case. The site has 3 blog posts and 1 project; the filtering surface is trivially small.

## Recommended Stack

### New Dependencies

None.

### Existing Stack (No Changes Needed)

| Technology | Current Version | Role in This Milestone | Notes |
|------------|----------------|----------------------|-------|
| React 19 | 19.2.4 | `useState` for selected tags, `useTransition` for non-blocking filter updates | Built-in hooks. No state management library needed for a tag selection array. |
| Next.js 16 `useSearchParams` | 16.1.6 | Read filter state from URL query string | Requires `Suspense` boundary to preserve static generation. The blog page stays SSG; the filter bar is client-rendered within the boundary. |
| Next.js 16 `useRouter` | 16.1.6 | Push updated `?tags=a,b` params to URL without page reload | `router.replace()` with `{ scroll: false }` keeps position. Shallow navigation -- no server fetch. |
| Tailwind CSS v4 | 4.1.18 | Filter bar styling, active/inactive tag chip states, grid item show/hide transitions | CSS-first config in `globals.css`. Transitions via `transition-all`, `opacity-0`, `scale-95`. |
| Velite | 0.3.1 | Provides `posts[].tags` and `projects[].stack` arrays at build time | Already defined in `velite.config.ts` with `s.array(s.string()).default([])`. No schema changes needed. |
| `clsx` + `tailwind-merge` (via `cn()`) | clsx 2.1.1, tailwind-merge 3.4.0 | Conditional class composition for active/inactive chip states | Already used throughout all components. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | -- | -- | This milestone uses only existing dependencies. The filtering logic is ~50 lines of React + URL params. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| None new | -- | Existing `npm run dev` (Velite --watch + Next.js Turbopack) is sufficient. |

## Key Technical Decisions

### 1. URL-Based Filtering via `useSearchParams` (not ephemeral `useState`)

**Use `useSearchParams` to store selected tags in the URL query string.**

Pattern: `/blog?tags=ai,fintech` and `/projects?stack=Next.js+16,React+19`

Rationale:
- **Shareability**: Filter states become bookmarkable and shareable links
- **Browser navigation**: Back/forward buttons navigate filter history naturally
- **Established pattern**: Next.js official docs recommend URL state for filters
- **Zero dependencies**: Built into React 19 and Next.js 16. No library needed
- **SSG-compatible**: Using `useSearchParams` inside a client component wrapped in `<Suspense>` keeps the rest of the page statically generated

The filter bar component reads from `useSearchParams()` and writes via `router.replace(url, { scroll: false })`.

**Confidence: HIGH** -- verified via Next.js official docs on `useSearchParams`, static generation compatibility, and Suspense boundary requirements.

### 2. Suspense Boundary to Preserve Static Generation

**Critical constraint**: Calling `useSearchParams()` without a `<Suspense>` boundary causes the entire page to deopt into client-side rendering. The page must wrap the filter bar client component in `<Suspense>`.

Pattern:
```typescript
// blog/page.tsx (server component)
export default function BlogPage() {
  const publishedPosts = posts.filter(p => !p.draft).sort(...)
  return (
    <section>
      <h1>Blog</h1>
      <Suspense fallback={null}>
        <FilteredBlogList posts={publishedPosts} />
      </Suspense>
    </section>
  )
}
```

The `FilteredBlogList` is a `'use client'` component that:
1. Reads `useSearchParams()` to get active tags
2. Filters the `posts` array client-side
3. Renders PostCard components for matching posts
4. Contains the filter bar UI

This keeps the `<h1>`, page metadata, and SEO content server-rendered while the dynamic filter UI is client-rendered within the Suspense boundary.

**Confidence: HIGH** -- verified via Next.js docs "Missing Suspense boundary with useSearchParams" and "Entire page deopted into client-side rendering" error documentation.

### 3. Client-Side Array Filtering (not Server-Side)

**Filter entirely client-side by narrowing the full content array.**

The listing pages already embed all content at build time via `import { posts } from '@/.velite'`. With 3 posts and 1 project, sending the full array to the client and filtering with `Array.filter()` is the correct approach. There is no backend query, no API route, and no dynamic rendering.

```typescript
const filtered = posts.filter(post =>
  activeTags.every(tag => post.tags.includes(tag))
)
```

This is AND logic: selecting tags `[ai, fintech]` shows only posts that have BOTH tags.

**Confidence: HIGH** -- standard pattern for small content sets. No performance concern until hundreds of items.

### 4. CSS Transitions for Filter Animation (not Framer Motion, not GSAP)

**Use CSS `transition` and `opacity`/`scale` for show/hide effects on filter results.**

The codebase already has a `transition-all duration-150` pattern on card hover states and a `fadeInUp` animation. Filter transitions should use the same vocabulary:

- Items leaving: `opacity-0 scale-95` with `transition-all duration-200`
- Items entering: `opacity-100 scale-100` with `transition-all duration-200`
- No grid position animation (items don't slide to fill gaps -- they just appear/disappear in place)

For grid reflow (items shifting position when others hide), CSS Grid cannot natively animate position changes. The View Transitions API could handle this, but it is unnecessary for this scale. Hidden items simply collapse out of the grid flow (via conditional rendering or `hidden` attribute), and remaining items reflow instantly.

**Why not animate grid reflow:**
- The View Transitions API is Baseline Newly Available (Safari 18+, Firefox 133+) but adds complexity for minimal visual benefit on a 3-6 item grid
- Framer Motion / GSAP are explicitly out of scope per PROJECT.md constraints
- The `animate-css-grid` library is unmaintained (last commit 2020)
- Instant reflow on a small grid looks fine. Users won't notice the lack of position animation with only 3-6 cards.

**Confidence: HIGH** -- this matches the existing animation vocabulary and zero-library constraint.

### 5. `useTransition` for Non-Blocking URL Updates (not `startTransition` from router)

**Wrap `router.replace()` calls in `useTransition` to keep the filter bar responsive during URL updates.**

```typescript
const [isPending, startTransition] = useTransition()

function toggleTag(tag: string) {
  startTransition(() => {
    const params = new URLSearchParams(searchParams.toString())
    // ... update tags param
    router.replace(`?${params.toString()}`, { scroll: false })
  })
}
```

`isPending` can optionally dim the results list during transition, though with client-side filtering the update is effectively instant. This is a forward-compatible pattern if the content set grows.

**Confidence: HIGH** -- React 19 `useTransition` is the official pattern for non-urgent state updates.

### 6. TagChip and TechBadge Reuse with Interactive States

**Extend existing `TagChip` and `TechBadge` components with `active`/`onClick` props rather than creating new filter chip components.**

Current `TagChip` already supports an optional `href` prop for link behavior. Adding `onClick` + `active` props for filter behavior keeps the design language unified:

```typescript
interface TagChipProps {
  tag: string
  href?: string
  active?: boolean
  onClick?: () => void
  className?: string
}
```

Active state styling: filled background (`bg-accent text-white`) vs. the current subtle (`bg-accent/10`). This uses the existing neobrutalist design tokens.

**Confidence: HIGH** -- component extension, not replacement.

### 7. Integration with ListingViewCounts (Blog Page Only)

The blog listing page currently wraps the card grid in `<ListingViewCounts>` which provides view count context. The filtered blog list component must remain inside this provider, or the provider must move to wrap both the filter bar and the filtered results.

Pattern:
```typescript
<Suspense fallback={null}>
  <FilteredBlogList posts={publishedPosts} slugs={slugs} />
</Suspense>

// Inside FilteredBlogList (client component):
// - Reads useSearchParams for active tags
// - Filters posts
// - Wraps filtered grid in ListingViewCounts with filtered slugs
```

Filtering changes which slugs need view counts fetched. The `ListingViewCounts` component should receive the filtered slug list so it only fetches counts for visible posts.

**Confidence: HIGH** -- existing pattern understood from codebase review.

## Installation

```bash
# No installation needed. Zero new dependencies.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `useSearchParams` (built-in) | `nuqs` (6 kB) | When you have complex multi-key URL state with type parsing, throttling, debouncing, or server component cache integration. For a single `tags` query param with comma-separated strings, `useSearchParams` + `URLSearchParams` is 15 lines of code. nuqs also has a reported adapter detection issue with Next.js 16 (GitHub issue #1263). |
| `useSearchParams` (URL state) | `useState` (ephemeral) | When filter state is purely ephemeral and you explicitly do NOT want it in the URL. For a portfolio site, shareable filter URLs are a free usability win. |
| CSS transitions | Framer Motion | When you need physics-based spring animations, layout animations (AnimatePresence), or complex orchestrated sequences. Explicitly out of scope per PROJECT.md. Adds 32+ kB. |
| CSS transitions | GSAP | When you need timeline-based animation sequences, ScrollTrigger, or complex motion paths. Explicitly out of scope per PROJECT.md. |
| CSS transitions | View Transitions API | When grid items need animated position changes during reflow. Baseline Newly Available as of late 2025 (Safari 18+, Firefox 133+). Consider for a future enhancement if the content set grows beyond ~10 items and the visual polish warrants the additional code. |
| Client-side filtering | Server-side filtering via searchParams page prop | When content is fetched from a database/CMS at request time. Here, all content is compiled into the bundle at build time by Velite. Server-side filtering would force the page into dynamic rendering for no benefit. |
| `router.replace()` | `router.push()` | When each filter change should be a separate history entry. For rapid tag toggling, `replace` avoids polluting browser history. Consider `push` if users report wanting back-button per filter change. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `nuqs` | Adds 6 kB dependency for trivial URL state. Known adapter detection issue with Next.js 16 (issue #1263). This site has one URL param (`tags` or `stack`) per listing page. | `useSearchParams` + `URLSearchParams` (built-in, ~15 lines) |
| Framer Motion | Explicitly out of scope per PROJECT.md. 32+ kB bundle addition. Zero-animation-library codebase precedent. | CSS `transition-all` + `opacity` + `scale` |
| GSAP | Explicitly out of scope per PROJECT.md. Heavy runtime. | CSS transitions |
| `animate-css-grid` | Unmaintained (last commit 2020). Adds JS dependency for grid position animation that is not needed at this content scale. | No grid position animation; instant reflow is acceptable for 3-6 items |
| Zustand / Jotai / Redux | Global state management is wildly over-engineered for a tag selection array. URL state via `useSearchParams` is the correct primitive. | `useSearchParams` for persistence, `useState` within component for immediate UI |
| Server Actions for filtering | Server Actions are for mutations. Filtering is a read operation. Using Server Actions would force server round-trips for what should be instant client-side array narrowing. | Client-side `Array.filter()` on build-time Velite data |
| Dynamic rendering (`export const dynamic = 'force-dynamic'`) | Listing pages are currently fully static. Adding `searchParams` as a page prop would force dynamic rendering. Keep pages static; handle filtering entirely client-side. | `useSearchParams` in a client component within `<Suspense>` boundary |

## Stack Patterns by Variant

**For the blog listing page (`/blog`):**
- Server component renders `<h1>`, metadata, passes `posts` array down
- `<Suspense>` boundary wraps `FilteredBlogList` client component
- Client component reads `?tags=ai,fintech` from URL, filters posts, renders grid
- `ListingViewCounts` wraps the filtered grid with filtered slugs
- Tags extracted from all posts for the filter bar: `[...new Set(posts.flatMap(p => p.tags))]`

**For the projects listing page (`/projects`):**
- Same pattern, but uses `?stack=Next.js+16,React+19` query param
- No view count integration (projects don't have view counts)
- Stack items extracted from all projects: `[...new Set(projects.flatMap(p => p.stack))]`

**For the filter bar component (shared):**
- Generic `FilterBar` component that accepts `items: string[]`, `activeItems: string[]`, `onToggle: (item: string) => void`
- Renders `TagChip` or `TechBadge` with `active` prop styling
- "Clear all" button when any filters are active
- Accessible: chips are `<button>` elements with `aria-pressed` state

**For reduced motion:**
- When `prefers-reduced-motion: reduce`, filter transitions happen instantly (no opacity/scale animation)
- The existing CSS `@media (prefers-reduced-motion: reduce)` block in `globals.css` should cover new transition classes

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| React 19.2.4 `useTransition` | Next.js 16.1.6 | Stable API. Works with `router.replace()` for non-blocking URL updates. |
| Next.js 16.1.6 `useSearchParams` | React 19.2.4 | Requires `<Suspense>` boundary for static generation. Returns `ReadonlyURLSearchParams`. |
| Next.js 16.1.6 `useRouter` | React 19.2.4 | `router.replace(url, { scroll: false })` for shallow URL updates without scroll reset. |
| Tailwind CSS v4 `transition-*` | All browsers | CSS transitions on `opacity`, `transform`, `scale` are universally supported. |
| `cn()` (clsx + tailwind-merge) | Tailwind CSS v4 | Already used throughout. Handles conditional active/inactive class merging. |

## Integration Points

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/filter-bar.tsx` | `'use client'` component. Generic multi-select filter bar with tag chips. Reads/writes URL search params. |
| `src/components/blog/filtered-blog-list.tsx` | `'use client'` component. Wraps filter bar + filtered PostCard grid + ListingViewCounts for blog page. |
| `src/components/projects/filtered-project-list.tsx` | `'use client'` component. Wraps filter bar + filtered ProjectCard grid for projects page. |

### Existing Files to Modify

| File | Change |
|------|--------|
| `src/app/blog/page.tsx` | Move card grid into `FilteredBlogList` client component wrapped in `<Suspense>`. Pass `posts` array as prop. |
| `src/app/projects/page.tsx` | Move card grid into `FilteredProjectList` client component wrapped in `<Suspense>`. Pass `projects` array as prop. |
| `src/components/blog/tag-chip.tsx` | Add `active?: boolean` and `onClick?: () => void` props. Add active state styling (`bg-accent text-white border-accent`). Render as `<button>` when `onClick` is provided. |
| `src/components/projects/tech-badge.tsx` | Add `active?: boolean` and `onClick?: () => void` props. Same pattern as TagChip. |
| `src/app/globals.css` | Possibly add filter transition utility classes if not covered by Tailwind defaults. |

### No Changes Needed

| File | Why |
|------|-----|
| `velite.config.ts` | `tags` and `stack` arrays already defined with `s.array(s.string()).default([])` |
| `next.config.ts` | No config changes needed |
| `package.json` | No new dependencies |
| `src/lib/redis.ts` | View counting is unrelated to filtering |
| `src/app/api/**` | No API routes needed for client-side filtering |

## Sources

- [Next.js `useSearchParams` docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) -- verified Suspense boundary requirement, static generation compatibility, `ReadonlyURLSearchParams` return type. **HIGH confidence.**
- [Next.js "Missing Suspense boundary" error docs](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) -- verified that `useSearchParams` without Suspense causes full page client-side rendering deopt. **HIGH confidence.**
- [Next.js "Entire page deopted into client-side rendering" docs](https://nextjs.org/docs/messages/deopted-into-client-rendering) -- verified the Suspense boundary pattern for preserving static generation. **HIGH confidence.**
- [React 19 `useTransition` docs](https://react.dev/reference/react/useTransition) -- verified non-blocking state update pattern with `isPending` for responsive filter UI. **HIGH confidence.**
- [nuqs GitHub issue #1263](https://github.com/47ng/nuqs/issues/1263) -- confirmed adapter detection issue with Next.js 16. Not a blocker (workarounds exist), but reinforces the decision to avoid the dependency. **MEDIUM confidence** (issue may be resolved in nuqs 2.8.8).
- [View Transitions API browser support (caniuse.com)](https://caniuse.com/view-transitions) -- verified Baseline Newly Available status: Chrome 111+, Safari 18+, Firefox 133+. **HIGH confidence.**
- [Next.js App Router search/filter tutorial](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) -- verified `useSearchParams` + `router.replace()` as official recommended pattern. **HIGH confidence.**
- Codebase review of `velite.config.ts`, `blog/page.tsx`, `projects/page.tsx`, `tag-chip.tsx`, `tech-badge.tsx`, `listing-view-counts.tsx`, `scroll-reveal.tsx`, `globals.css` -- verified existing data structures, component patterns, and animation vocabulary. **HIGH confidence.**

---
*Stack research for: Multi-select tag/stack filtering on keech.dev listing pages*
*Researched: 2026-02-22*
