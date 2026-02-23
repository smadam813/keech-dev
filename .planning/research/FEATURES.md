# Feature Research

**Domain:** Multi-select tag/stack filtering for blog and project listing pages
**Researched:** 2026-02-22
**Confidence:** HIGH -- well-established UI patterns with extensive community precedent; Next.js App Router URL state patterns are mature and well-documented

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist when they see a filter bar on a blog or project listing. Missing any of these creates a broken or confusing impression.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Clickable tag/stack chips as filter toggles | When tags are displayed on a listing page, users expect to click them to filter. A visible tag that does nothing feels broken. The existing `TagChip` and `TechBadge` components already render tags -- they just need to become interactive. | LOW | Existing `TagChip` (blog) and `TechBadge` (projects) components. Requires `'use client'` boundary for click handlers. |
| Multi-select (toggle multiple tags simultaneously) | Single-select filters feel artificially limiting. Users expect to combine tags (e.g., "ai" + "agile") to narrow results. The PROJECT.md specifies AND logic: selected tags = intersection, not union. | LOW | Filter state management (useState or URL params). AND filtering is a simple `Array.every()` check against selected tags. |
| Visual distinction between active and inactive chips | Users must instantly see which tags are selected. Without clear active/inactive states, the filter is unusable. Standard pattern: filled/highlighted background for active, outlined/muted for inactive. The neobrutalist design language makes this easy -- accent fill vs. transparent. | LOW | CSS only. Extend existing `TagChip`/`TechBadge` classes with an `active` variant. Use `bg-accent text-white` for active, keep current `bg-accent/10` for inactive. |
| In-place filtering without page navigation | Clicking a tag must filter the grid immediately on the same page, not navigate to `/blog/tags/ai`. In-place filtering is the modern expectation and the PROJECT.md explicitly requires this: "In-place filtering without page navigation." | LOW | Client-side filtering of the already-loaded posts/projects array. No API calls needed -- Velite data is available at build time. |
| Clear all / reset filters | Once users have selected multiple tags, they need a single action to clear everything. Without this, they must deselect tags one by one. Standard placement: at the end of the filter bar or as a distinct button next to selected chips. | LOW | Resets filter state to empty array. A simple "Clear filters" text button with the neobrutalist button style. Only visible when at least one tag is selected. |
| Empty state when no items match | When the AND filter combination matches zero posts, the page must not show a blank grid. Users need a message explaining why there are no results and a clear path back (e.g., "No posts match all selected tags. [Clear filters]"). | LOW | Conditional rendering when filtered array length is 0. Display a message with a clickable "clear filters" action. |
| Filter bar above the grid | The filter controls must appear between the page heading and the content grid. This is the universal placement -- users scan top-to-bottom and expect to find controls before results. | LOW | Layout only. Add a `<div>` between the `<h1>` and the grid `<div>` in both `blog/page.tsx` and `projects/page.tsx`. |
| URL persistence of filter state | Selected filters must be reflected in the URL so the page is bookmarkable and shareable. If a user selects "ai" + "agile" on the blog, the URL should update to `?tags=ai,agile` (or `?tags=ai&tags=agile`). Refreshing the page should restore the exact filter state. Without this, filters are ephemeral and feel broken to power users. | MEDIUM | URL search params management. Two approaches: native `useSearchParams` + `useRouter().replace()`, or the `nuqs` library. See Stack research for recommendation. |

### Differentiators (Competitive Advantage)

Features that elevate beyond basic checkbox filtering. These signal craft and attention to detail in the neobrutalist design language.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Count badges on filter chips | Show how many items match each tag before the user selects it: "ai (3)" or "agile (2)". This prevents dead-end filters (selecting a tag with zero results) and helps users discover content distribution. Counts update dynamically as filters are combined -- when "ai" is active, the count on "agile" shows how many posts have BOTH tags. | MEDIUM | Requires recalculating per-tag counts on every filter change. For the current 3 posts / 7 unique tags, this is trivial. At 100+ posts it remains fast (O(posts * tags) per render, both small). |
| Smooth grid transition on filter change | When items are filtered out, they fade/collapse smoothly rather than popping in and out. The site already uses `ScrollReveal` with `fadeInUp` animation -- filtered items should exit with a quick fade-out and entering items should use the same fade-in. | MEDIUM | CSS transitions on opacity. Challenge: CSS Grid does not animate items shifting position natively. Simplest approach is a quick opacity fade (150ms out, 300ms in) without trying to animate reflow. Respect `prefers-reduced-motion` as the site already does for all animations. |
| Neobrutalist chip toggle animation | The tag chip presses down on click (translate + shadow reduction) mimicking a physical button press, consistent with the existing card hover effect (`hover:translate-x-[2px] hover:translate-y-[2px]` + `shadow-brutal-hover`). Active chips maintain the pressed state. | LOW | CSS only. Reuse the existing shadow-brutal / shadow-brutal-hover pattern. Active state: `translate-x-[2px] translate-y-[2px] shadow-brutal-hover bg-accent`. |
| Tags displayed as a horizontal scrollable row on mobile | On small screens, many tags can overflow. Instead of wrapping to multiple rows (taking vertical space above the fold), a horizontally scrollable row with subtle scroll indicators keeps the layout compact. | LOW | `overflow-x-auto` + `flex-nowrap` on mobile, `flex-wrap` on desktop via Tailwind responsive classes. Optional: CSS gradient fade on edges to indicate scrollability. |
| Result count display | "Showing 2 of 3 posts" or "3 projects" below the filter bar. Gives users immediate quantitative feedback about their filter combination. | LOW | Computed from `filteredItems.length` and `allItems.length`. Only show the "X of Y" format when filters are active; show just "Y posts/projects" when no filters are active. |
| Tag click on cards to activate filter | Clicking a tag directly on a PostCard or ProjectCard adds that tag to the filter without navigating to the post detail page. This creates a discoverability loop: "I see this post has tag X, let me see what else has tag X." | MEDIUM | Currently `PostCard` is wrapped entirely in a `<Link>` to the post detail. The `TagChip` inside the card would need to stopPropagation and interact with the filter state instead. Requires restructuring the card's click target. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for a personal blog/portfolio at this scale (3 posts, 1 project).

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full-text search bar | "Let users search for any keyword across all posts." | Over-engineered for 3 posts. Search requires either client-side indexing (FlexSearch, Lunr -- adds ~10-30KB JS) or a search API. The cognitive overhead of a search bar for a handful of items is negative -- users can visually scan 3-10 cards faster than they can type a query. Introduces maintainability burden (index rebuild, relevance tuning) with zero user value at this scale. | Tag filtering covers the primary use case (topical discovery). Revisit full-text search when post count exceeds 30-50. |
| OR logic (union) filtering | "Show posts matching ANY selected tag, not ALL." OR logic is intuitive for some users. | AND logic is specified in PROJECT.md and is the correct default for narrowing results on a small blog. OR logic expands results and is only useful when the catalog is large enough that individual tags return many items. With 3 posts and 7 tags, OR filtering is indistinguishable from "show everything." It also introduces UI confusion -- users expect multi-select to narrow, not widen. | Stick with AND logic. All selected tags must be present on a post for it to appear. This is the standard behavior for tag filters on developer blogs. |
| Sidebar filter panel | "Put filters in a collapsible sidebar like e-commerce sites." | Sidebars are for complex, multi-faceted filtering (price range, size, color, brand). A blog with a single dimension (tags) does not need a sidebar. It wastes horizontal space on desktop and creates an awkward drawer pattern on mobile. | Horizontal filter bar inline with content. Tags in a single row (scrollable on mobile, wrapping on desktop). Simple, compact, immediately visible. |
| Server-side filtering via route segments | "Use `/blog/tags/ai+agile` for SEO benefits." Route-based filtering creates new pages for every tag combination, exploding the static generation matrix. With 7 tags, that is 127 possible combinations (2^7 - 1). Each would need `generateStaticParams()` entries. The SEO benefit is marginal for a personal blog -- Google does not reward tag index pages. | Client-side filtering with URL search params (`?tags=ai,agile`). Search params are not indexed by Google by default (which is correct -- filtered views should not compete with the canonical listing page). |
| Framer Motion or GSAP for filter animations | "Smooth layout animations when cards filter in/out." | The codebase has a zero-animation-library precedent (PROJECT.md explicitly lists "Framer Motion or GSAP" as out of scope). Adding a 30-60KB animation library for card transitions is disproportionate. CSS transitions handle opacity/transform adequately. Grid reflow animation (items sliding to fill gaps) is visually pleasant but technically complex and not worth the dependency. | CSS `opacity` + `transition` for fade in/out. Accept instant grid reflow (items jump to fill gaps). This is how most filter UIs work and users do not notice the lack of position animation. |
| Persistent filter state in localStorage | "Remember which tags the user had selected when they return." | For a personal blog, filter persistence across sessions is unnecessary complexity. Users visit the blog listing, apply a filter, read posts, and leave. They are not "shopping" across multiple sessions. localStorage state that restores unexpected filters on next visit creates confusion ("why am I only seeing 1 post?"). | URL search params are the persistence mechanism. The URL captures the filter state for sharing and bookmarking. When a user returns without a URL, they see everything -- which is the correct default. |
| Dynamic tag count badges that disable zero-result tags | "Grey out tags that would produce zero results to prevent empty states." | With AND logic and a small tag set, disabling zero-result tags can be confusing ("why is agile greyed out?"). It also adds render complexity -- every tag's disabled state depends on the current filter combination. The cognitive overhead of disappearing/disabled options can be worse than simply showing an empty state with a clear "no matches" message. | Show count badges as `(0)` but keep tags clickable. The empty state message handles the zero-result case. Users can always click and see "No posts match" rather than being silently prevented from exploring. |

## Feature Dependencies

```
[Filter state management (URL params)]
    +-- required by --> [Multi-select tag toggle]
    +-- required by --> [Clear all / reset]
    +-- required by --> [URL persistence]
    +-- required by --> [Empty state handling]

[Multi-select tag toggle]
    +-- required by --> [Count badges on chips]
    +-- required by --> [Grid transition animation]
    +-- required by --> [Result count display]

[Existing TagChip component]
    +-- must evolve into --> [Interactive filter chip (blog)]

[Existing TechBadge component]
    +-- must evolve into --> [Interactive filter chip (projects)]

[Filter bar layout]
    +-- contains --> [Interactive filter chips]
    +-- contains --> [Clear all button]
    +-- contains --> [Result count display]

[Tag click on cards]
    +-- conflicts with --> [Card-level Link wrapper]
    (PostCard/ProjectCard wrap entire card in <Link>, making inner
     tag clicks navigate away. Requires restructuring click targets.)
```

### Dependency Notes

- **Filter state management is the foundation:** Every other feature reads from and writes to the filter state. Implement this first. The choice between native `useSearchParams` and `nuqs` is a one-time decision that affects all downstream work.
- **TagChip/TechBadge evolution is safe:** Both components already accept `className` and conditionally render as `<Link>` or `<span>`. Adding an `onClick` prop and `active` styling is backward-compatible. Existing usage in blog post detail pages (non-interactive) is unaffected.
- **Count badges depend on multi-select:** You need a working filter to calculate "how many items match if I also toggle this tag." Build basic filtering first, add count badges as enhancement.
- **Tag click on cards conflicts with card Link:** The current `PostCard` wraps its entire `<article>` in a `<Link>`. Clicking a `TagChip` inside navigates to the post. To make card-level tag clicks activate filters instead, the card structure needs to change: either the `<Link>` wraps only the title/image, or the `TagChip` uses `event.stopPropagation()` and `event.preventDefault()` to intercept the click. This is a moderate refactor with accessibility implications (nested interactive elements). Defer to after basic filter bar works.
- **Grid animation depends on filter working:** Cannot animate transitions without a working filter to trigger them. Build the filter, verify correctness, then layer on animation.

## MVP Definition

### Launch With (v1.5.0)

Minimum viable tag filtering -- users can filter blog posts by tags and projects by stack.

- [ ] **Filter state in URL search params** -- Selected tags stored as `?tags=ai,agile` (comma-separated). Read on mount, write on toggle. Page refresh restores state. Use native `useSearchParams` + `useRouter().replace()` (no new dependency) OR `nuqs` (5.5KB, type-safe, handles edge cases). Recommendation: native approach first; this is simple enough to not need a library.
- [ ] **Blog filter bar with interactive tag chips** -- Horizontal row of all unique tags extracted from published posts, between the `<h1>` and the grid. Each chip is a toggle button. Active chips show `bg-accent text-white` with the neobrutalist pressed state. Inactive chips keep the existing `bg-accent/10` style.
- [ ] **Blog grid filtered by selected tags (AND logic)** -- `publishedPosts.filter(post => selectedTags.every(tag => post.tags.includes(tag)))`. Inline client-side computation, no API calls. The listing page becomes a client component (or wraps the filter + grid in a client boundary).
- [ ] **Projects filter bar with interactive stack chips** -- Same pattern as blog but using `project.stack` values. Horizontal row of all unique stack entries.
- [ ] **Projects grid filtered by selected stack (AND logic)** -- Same logic as blog: `sortedProjects.filter(p => selectedStack.every(s => p.stack.includes(s)))`.
- [ ] **Clear all button** -- "Clear filters" text button, visible only when filters are active. Resets URL params and filter state. Styled as a neobrutalist text link with accent color.
- [ ] **Empty state for zero matches** -- "No posts match all selected tags." with a "Clear filters" action link. Styled consistently with the existing "No posts yet. Check back soon!" empty state.
- [ ] **prefers-reduced-motion compliance** -- Any transition or animation added for filtering must respect the existing `prefers-reduced-motion` media query pattern in `globals.css`.

### Add After Validation (v1.5.x)

Features to add once the core filtering pipeline is proven.

- [ ] **Count badges on chips** -- Show `(N)` count per tag, dynamically recalculated as filters change. Add once filtering feels solid and the tag set is large enough to benefit (currently 7 unique blog tags).
- [ ] **Result count display** -- "Showing X of Y posts" between the filter bar and the grid. Simple text, only appears when filters are active.
- [ ] **Fade transition on filter change** -- Items fade out (150ms) when filtered away, fade in (300ms) when revealed. CSS `opacity` + `transition` only, no animation library. Respect `prefers-reduced-motion`.
- [ ] **Tag click on PostCard/ProjectCard activates filter** -- Clicking a tag on a card adds it to the active filters instead of navigating. Requires refactoring the card's `<Link>` wrapper to not engulf the tag area.
- [ ] **Mobile horizontal scroll** -- Filter bar uses `overflow-x-auto` + `flex-nowrap` below `md` breakpoint, with CSS gradient fade indicators on scroll edges.

### Future Consideration (v2+)

Features to defer until the blog has scale.

- [ ] **Full-text search** -- Only worth building when post count exceeds 30-50. Use FlexSearch or Pagefind when the time comes.
- [ ] **OR logic toggle** -- Let users switch between AND/OR combining. Only useful when individual tags return 10+ results.
- [ ] **Category facets for projects** -- Filter by `category` (side-project, professional, open-source) in addition to stack. Only useful when project count exceeds 5-6.
- [ ] **Sort by tag popularity** -- Reorder filter chips so the most-used tags appear first. Currently tags appear in arbitrary order; with more content, alphabetical or frequency-based ordering becomes useful.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Filter state in URL params | HIGH (foundation) | MEDIUM | P1 |
| Blog filter bar + tag chips | HIGH | LOW | P1 |
| Blog grid AND filtering | HIGH | LOW | P1 |
| Projects filter bar + stack chips | HIGH | LOW | P1 |
| Projects grid AND filtering | HIGH | LOW | P1 |
| Clear all / reset | HIGH | LOW | P1 |
| Empty state for zero matches | HIGH | LOW | P1 |
| Reduced-motion compliance | HIGH (accessibility) | LOW | P1 |
| Count badges on chips | MEDIUM | MEDIUM | P2 |
| Result count display | MEDIUM | LOW | P2 |
| Fade transition on filter change | LOW | MEDIUM | P2 |
| Tag click on cards activates filter | MEDIUM | MEDIUM | P2 |
| Mobile horizontal scroll | LOW | LOW | P2 |
| Full-text search | LOW (at current scale) | HIGH | P3 |
| OR logic toggle | LOW (at current scale) | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v1.5 launch -- the core filtering feature
- P2: Should have -- polish and discoverability once core works
- P3: Nice to have -- defer until blog has enough content

## Competitor Feature Analysis

| Feature | Lee Robinson (leerob.com) | Josh Comeau (joshwcomeau.com) | Dan Abramov (overreacted.io) | Tania Rascia (taniarascia.com) | keech.dev approach |
|---------|--------------------------|-------------------------------|------------------------------|-------------------------------|-------------------|
| Tag filtering | No tag filter. Blog is a flat list sorted by date. | No tag filter. Posts sorted by date with category headers (CSS, React, etc.) but no interactive filter UI. | No tags at all. Minimalist blog with no metadata beyond title and date. | Yes -- full tag filter with multi-select, AND logic, URL persistence, count badges. One of the best dev blog filter implementations. | Horizontal filter bar with neobrutalist chip toggles. Multi-select AND logic. URL search param persistence. Matches Tania's approach but with keech.dev's visual identity. |
| Stack/tech filter on projects | N/A (no projects page) | N/A | N/A | Yes -- filterable project listing by tech stack. | Same pattern as blog but with stack values. Unified UX across both listing types. |
| Filter bar layout | N/A | N/A | N/A | Horizontal chip row above grid. Clean, compact. | Same horizontal row. Neobrutalist styling with hard borders, accent fills, brutal shadows. |
| Clear all | N/A | N/A | N/A | "Clear" button appears when filters active. | Same pattern. "Clear filters" text button with accent color. |
| Empty state | N/A | N/A | N/A | "No results" message with suggestion to clear filters. | Same pattern with neobrutalist styling. Includes inline "clear filters" action. |
| URL persistence | N/A | N/A | N/A | Yes -- `?q=react&tag=tutorial` format. | `?tags=ai,agile` format. Comma-separated for readability. |
| Animation | N/A | N/A | N/A | Instant filter, no animation. | Minimal: CSS opacity fade on filter change (P2). No position animation. |
| Count badges | N/A | N/A | N/A | Yes -- shows post count per tag. | P2 enhancement. Dynamic counts that update as filters change. |

## Key Architectural Observation

The blog listing page is currently a **server component** that imports `posts` from Velite and renders a static grid. Adding client-side filtering requires introducing a client boundary. Two approaches:

1. **Convert the entire page to a client component** -- Simple but loses the server component benefits (metadata export, static generation of the shell). The page currently exports `metadata` which requires a server component (or `generateMetadata()`).

2. **Extract a `FilteredPostGrid` client component** -- The page stays as a server component, exports `metadata`, computes `publishedPosts`, and passes them to a `'use client'` component that owns the filter state, filter bar, and grid rendering. This preserves the server/client split pattern established in v1.4 with `ListingViewCounts`.

**Recommendation: Option 2.** Extract `FilteredPostGrid` (blog) and `FilteredProjectGrid` (projects) as client components. The page server components pass the full data arrays. The client components own filter state, URL sync, and rendering. This is consistent with the existing `ListingViewCounts` pattern and avoids breaking the current architecture.

## Content Scale Context

Current content inventory (as of 2026-02-22):
- **Blog:** 3 published posts with 7 unique tags (`ai`, `software-engineering`, `development-process`, `agile`, `fintech`, `change-management`, `spec-driven-development`). Every post has the `ai` tag. `development-process` appears on all 3. `agile` on 2. The other 4 tags are unique to one post each.
- **Projects:** 1 project with 8 stack entries (`Next.js 16`, `React 19`, `Tailwind CSS v4`, `Velite`, `MDX`, `Upstash Redis`, `TypeScript`, `Vercel`).

At this scale, tag filtering is more about establishing the UX pattern for when content grows than providing immediate utility. The filter bar with 7 tags is meaningful for blog. The projects page with 1 project and 8 stack entries is technically functional but somewhat academic -- it will become genuinely useful at 3-4 projects.

## Sources

- [Aurora Scharff: Managing Advanced Search Param Filtering in Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) -- HIGH confidence, comprehensive tutorial on multi-select URL filtering with `useOptimistic`, `nuqs`, and race condition handling
- [Next.js Docs: useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) -- HIGH confidence, official API reference for reading URL search params in client components
- [nuqs: Type-safe search params state management](https://nuqs.dev/) -- HIGH confidence, official library documentation. 5.5KB gzipped, used by Sentry, Supabase, Vercel, Clerk
- [Robin Wieruch: Search Params in Next.js for URL State](https://www.robinwieruch.de/next-search-params/) -- MEDIUM confidence, practical tutorial on native `useSearchParams` + `router.replace()` pattern
- [Insaim: Filter UI Design Best UX Practices](https://www.insaim.design/blog/filter-ui-design-best-ux-practices-and-examples) -- MEDIUM confidence, UX design guidance for chip filters, count badges, clear-all patterns, and empty states
- [Mobbin: Chip UI Design Best Practices](https://mobbin.com/glossary/chip) -- MEDIUM confidence, chip interaction patterns and sizing recommendations
- [NN/g: Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/) -- HIGH confidence, authoritative UX research on empty state design
- [InfoQ: React Advanced 2025 -- nuqs Takes Center Stage](https://www.infoq.com/news/2025/12/nuqs-react-advanced/) -- MEDIUM confidence, conference coverage of nuqs adoption and advanced features
- Codebase analysis: `TagChip`, `TechBadge`, `PostCard`, `ProjectCard`, `blog/page.tsx`, `projects/page.tsx`, `listing-view-counts.tsx`, `scroll-reveal.tsx`, `globals.css`, `velite.config.ts` -- HIGH confidence, direct source code inspection

---
*Feature research for: Multi-select tag/stack filtering (keech.dev v1.5)*
*Researched: 2026-02-22*
