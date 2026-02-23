# Project Research Summary

**Project:** keech.dev v1.5 — Multi-select tag/stack filtering
**Domain:** Client-side filtering UI for a statically-generated personal portfolio/blog
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

This milestone adds multi-select tag filtering to the blog listing page and stack filtering to the projects listing page on keech.dev. Research across all four domains (stack, features, architecture, pitfalls) converges on a single clear recommendation: implement entirely client-side filtering using React `useState`, zero new dependencies, and a client wrapper component pattern that preserves static generation. The filtering logic is approximately 50 lines of standard React. This is a well-understood UI pattern with abundant prior art, and the codebase already has all the primitives needed — Velite tag data, TagChip/TechBadge components, and the ListingViewCounts client wrapper pattern established in v1.4.

The most important architectural decision is whether filter state lives in URL search params or ephemeral `useState`. The architecture and pitfalls research both arrive at the same conclusion independently: `useState` is correct for this site. URL state requires a Suspense boundary (to prevent static generation deopt), URL serialization logic, and FOUC mitigation — roughly 30-50 extra lines of code for zero user-facing value on a site with 3 blog posts where nobody bookmarks filtered views. The migration path from `useState` to URL state is straightforward if the site grows and demand materializes.

The key risks are all avoidable when designed upfront: the ListingViewCounts React Context must wrap both the filter bar and card grid; TagChip/TechBadge components must become `<button>` elements with `aria-pressed` when used as filter toggles; and ScrollReveal animations must be bypassed when filters are active to prevent cards re-animating on every toggle. None of these require architectural changes — they are implementation decisions that cost more to retrofit than to get right the first time.

## Key Findings

### Recommended Stack

No new dependencies. The filtering feature uses only existing codebase primitives: React 19 `useState` for filter state, Tailwind CSS v4 for active/inactive chip styling, the existing `cn()` utility for conditional class composition, and Velite's already-compiled `tags: string[]` and `stack: string[]` arrays on post and project objects. The zero-animation-library constraint from PROJECT.md holds — CSS `opacity` + `transition` handles filter fade effects adequately for a 3-6 item grid.

**Core technologies:**
- React 19 `useState` — ephemeral filter state — correct primitive for client-only toggle state with no URL sharing requirement
- Tailwind CSS v4 — active/inactive chip styling — `bg-accent text-white` for active, `bg-accent/10` for inactive, reusing existing design tokens
- Velite 0.3.1 — tag and stack data — `s.array(s.string()).default([])` already defined in `velite.config.ts`; no schema changes needed
- `cn()` (clsx + tailwind-merge) — conditional class merging — already used throughout all components

**Explicitly rejected:**
- `nuqs` — 6 kB for 15 lines of URL logic; has a known adapter detection issue with Next.js 16 (issue #1263)
- Framer Motion / GSAP — explicitly out of scope per PROJECT.md; CSS transitions are sufficient at this scale
- `useSearchParams` + URL state — correct pattern in general but wrong for this specific site at this scale; defers the Suspense boundary complexity with no practical benefit

### Expected Features

**Must have (table stakes) — v1.5.0:**
- Clickable tag/stack chips as filter toggles — existing chips that look interactive must be interactive
- Multi-select AND logic — all selected tags must be present on a post for it to appear; `Array.every()` check
- Visual distinction: active vs. inactive chip states — filled accent background for active, outlined for inactive
- In-place filtering without page navigation — client-side array narrowing, no routing, no API calls
- Clear all / reset button — appears only when filters are active; one-click reset to unfiltered view
- Empty state for zero matches — "No posts match all selected tags" with an inline "Clear filters" action
- Filter bar above the grid — positioned between page `<h1>` and the card grid on both listing pages
- Reduced-motion compliance — existing `@media (prefers-reduced-motion: reduce)` pattern in `globals.css` covers new transition classes

**Should have (polish) — v1.5.x:**
- Count badges on chips — `(N)` per tag, dynamically recalculated as filters change; valuable even at 7 tags to prevent dead-end selections
- Result count display — "Showing X of Y posts" between filter bar and grid when filters are active
- Fade transition on filter change — CSS `opacity` only (150ms out, 300ms in); no animation library needed
- Tag click on PostCard/ProjectCard activates filter — requires restructuring the card `<Link>` wrapper; moderate refactor, defer until core filtering is proven
- Mobile horizontal scroll — `overflow-x-auto` + `flex-nowrap` below `md` breakpoint with gradient edge fade indicators

**Defer (v2+):**
- Full-text search — only justified at 30+ posts; adds 10-30 kB client bundle for zero value at current scale
- OR logic toggle — only useful when individual tags return 10+ results; AND logic is correct for a small catalog
- Category facets for projects — only useful at 5+ projects

### Architecture Approach

The listing pages remain statically generated server components. New client wrapper components (`FilteredPostList` for blog, `FilteredProjectList` for projects) own `useState<Set<string>>` for filter state, receive the full data array as props serialized from the server component parent, filter in memory using AND logic, and render the card grid. This is the same "client wrapper receives serialized server data" pattern already established by `ListingViewCounts` in v1.4. The critical constraint: `FilteredPostList` must be the outermost client boundary, wrapping both the filter bar and `ListingViewCounts`, so the view count context is accessible to all card children. View counts should be fetched for all slugs once on mount (not just filtered slugs) to avoid refetches on every filter toggle.

**Major components:**
1. `app/blog/page.tsx` (server, modified) — extracts `allTags` from published posts; passes `posts` and `allTags` to `FilteredPostList`
2. `app/projects/page.tsx` (server, modified) — extracts `allStack` from projects; passes `projects` and `allStack` to `FilteredProjectList`
3. `components/blog/filter-bar.tsx` (new, client) — renders `TagChip` buttons from `allTags`; calls `onToggle`; shows "Clear all" button when active
4. `components/blog/filtered-post-list.tsx` (new, client) — owns `useState<Set<string>>`; AND-filters posts; wraps `ListingViewCounts` and card grid; handles empty state
5. `components/projects/filter-bar.tsx` (new, client) — same pattern with `TechBadge` components
6. `components/projects/filtered-project-list.tsx` (new, client) — same pattern without view count integration
7. `components/blog/tag-chip.tsx` (modified) — adds `active?: boolean` and `onClick?: () => void`; renders `<button type="button" aria-pressed>` when interactive, `<span>` or `<Link>` otherwise
8. `components/projects/tech-badge.tsx` (modified) — same modification pattern as `TagChip`

**Unchanged:** `PostCard`, `ProjectCard`, `ListingViewCounts`, `velite.config.ts`, all API routes, `next.config.ts`, build pipeline.

### Critical Pitfalls

1. **`useSearchParams` without Suspense deopts the page to CSR** — avoided entirely by using `useState` instead. If URL state is ever introduced later, the consumer must be wrapped in `<Suspense>` or `next build` will fail or silently deopt `/blog` and `/projects` to client-side rendering. Warning sign: listing pages show as `lambda` instead of `static` in `next build` output.

2. **ListingViewCounts context breakage** — `FilteredPostList` must wrap `ListingViewCounts`, not the other way around. If nesting is wrong, `PostCardViewCount` returns null silently — no console error. Pass all slugs (not just filtered slugs) to `ListingViewCounts` so filter changes do not trigger refetches of view counts.

3. **ScrollReveal re-animating on every filter toggle** — the existing `ScrollReveal` uses a single-fire IntersectionObserver. When filter changes cause React to remount card components, new ScrollReveal instances start at `opacity: 0` and animate in — distracting on every toggle. Fix: bypass `ScrollReveal` when any filter is active; restore it only at initial page load.

4. **Filter chips using `<span>` instead of `<button>`** — the existing `TagChip` renders as `<span>` in non-link mode. Interactive filter chips must be `<button type="button">` with `aria-pressed="true|false"`. Add `role="group"` + `aria-label="Filter by tag"` to the filter bar container. Add an `aria-live="polite"` region to announce result count changes to screen readers.

5. **Tag normalization inconsistency** — blog tags are all lowercase kebab-case (consistent), but `project.stack` values are proper nouns ("Next.js 16", "React 19"). Apply case-insensitive comparison for filtering while preserving display casing. Consider a Velite `.transform()` on the blog tags field to enforce lowercase at the data layer before content grows.

## Implications for Roadmap

Based on combined research, the build order has four natural phases. Each phase is independently testable before the next begins and carries zero risk to existing pages until Phase 3.

### Phase 1: Interactive Component Variants

**Rationale:** Both `TagChip` and `TechBadge` need interactive variants before any filter bar can be built. These changes are backward-compatible — new optional props leave existing usage (post detail pages, project pages) completely unchanged. This is the lowest-risk starting point and establishes correct accessibility semantics from the start.

**Delivers:** `TagChip` and `TechBadge` components that render as `<button type="button" aria-pressed>` with filled active-state styling when `onClick` is provided; render unchanged as `<span>` or `<Link>` otherwise. Tag normalization strategy decided and implemented here.

**Addresses features:** Visual distinction between active/inactive chips; keyboard accessibility; `aria-pressed` state communication.

**Avoids pitfalls:** Accessibility pitfall (Pitfall 7) — building correct button semantics from the start. Tag normalization pitfall (Pitfall 6) — decide the normalization rule before the filter bar surfaces all tags side-by-side.

### Phase 2: Filter Bar Components

**Rationale:** With interactive chips available, the filter bar UI can be built and tested in isolation using mock data before being wired to any listing page. No page files are modified in this phase.

**Delivers:** `components/blog/filter-bar.tsx` and `components/projects/filter-bar.tsx` — each accepts `items`, `activeItems`, `onToggle` props and renders interactive chips with a "Clear all" button. Includes mobile scroll behavior and responsive layout.

**Addresses features:** Filter bar above the grid; clear all / reset; mobile horizontal scroll (P2, easy to include here).

**Avoids pitfalls:** CLS from filter bar insertion (Pitfall 4) — the filter bar is rendered in static HTML from the start, not inserted post-hydration, eliminating layout shift.

### Phase 3: Filtered List Wrappers and Page Integration

**Rationale:** This is the core phase — it wires filter state to the card grid and integrates everything into the actual listing pages. Both blog and projects pages should be updated together to ensure pattern consistency. This is the only phase that modifies existing page files.

**Delivers:** `FilteredPostList` and `FilteredProjectList` client components; modified `blog/page.tsx` and `projects/page.tsx`; AND filtering logic with `Array.every()`; empty state for zero matches; `ListingViewCounts` correctly wrapped by `FilteredPostList`; `ScrollReveal` bypassed when filters are active.

**Addresses features:** Multi-select AND logic; in-place filtering without page navigation; empty state; reduced-motion compliance.

**Avoids pitfalls:** ListingViewCounts context breakage (Pitfall 5) — `FilteredPostList` is the outermost client boundary; ScrollReveal re-animation (Pitfall 3) — disabled when filters are active.

**Key verification:** `next build` output must still show `/blog` and `/projects` as static (circle icon, not lambda). View counts must display on the blog listing after filters are added.

### Phase 4: Polish and Edge Cases

**Rationale:** These enhancements require the full filtering pipeline to be functional and correct before they can be meaningfully tested and validated.

**Delivers:** Count badges on chips (dynamic N counts per tag, recalculated as filters change); result count display ("Showing X of Y posts"); CSS opacity fade transitions on filter change; full accessibility audit (keyboard nav, `aria-live` region, screen reader testing); "Looks done but isn't" checklist verification.

**Addresses features:** Count badges (P2); result count display (P2); fade transition on filter change (P2).

**Avoids pitfalls:** AND logic empty state UX (count badges help users see which combinations are viable before selecting them); mobile layout pitfall (filter bar not pushing grid below fold on 375px screens).

### Phase Ordering Rationale

- Phase 1 first because filter bars depend on interactive chip components, and this phase carries zero risk to any existing page
- Phase 2 before page integration because filter bars can be validated with mock data before touching live pages
- Phase 3 is the only phase modifying page files; all building blocks are proven by this point, reducing the surface area for regression
- Phase 4 requires the full pipeline to be functional — polishing features that might still change is waste
- The `useState` decision eliminates an entire class of Suspense/URL complexity that would otherwise cut across all phases and introduce edge cases in Phases 1 through 3

### Research Flags

All phases have well-documented patterns. No phases require `/gsd:research-phase`:

- **Phase 1:** TagChip/TechBadge prop extension is a standard React pattern; `aria-pressed` toggle button semantics are specified in WAI-ARIA APG with examples
- **Phase 2:** Horizontal chip filter bar is a widely-implemented UI pattern; "Clear all" and count badge patterns are documented in multiple references
- **Phase 3:** The client wrapper pattern directly mirrors the existing `ListingViewCounts` implementation; AND array filtering is `Array.every()` — trivial
- **Phase 4:** CSS opacity transitions are universal; `aria-live` regions are well-specified in W3C ARIA22 technique

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies means zero version compatibility risk; all APIs (React 19 hooks, Tailwind v4) verified against official docs; codebase directly inspected and data structures confirmed |
| Features | HIGH | Tania Rascia's blog provides a direct reference implementation for AND-logic tag filtering with URL persistence; current content inventory (3 posts, 7 tags, 1 project) verified; feature prioritization grounded in actual content scale |
| Architecture | HIGH | `useState` approach eliminates the main complexity vector (Suspense + URL state); pattern directly mirrors existing `ListingViewCounts` client wrapper; build order is logically sequenced with no ambiguous dependencies |
| Pitfalls | HIGH | All pitfalls verified against official Next.js docs, WAI-ARIA APG specs, and direct codebase analysis; all recovery costs rated LOW to MEDIUM with clear remediation steps |

**Overall confidence:** HIGH

### Gaps to Address

- **Count badge priority:** With 3 posts and 7 tags, several 2-tag AND combinations yield zero results (e.g., "fintech" + "agile" — no post has both). Count badges are assigned P2, but they provide the clearest way to prevent dead-end filter selections. Consider promoting count badges to Phase 3 rather than Phase 4 if the empty state UX feels poor during implementation validation.

- **`project.stack` version number normalization:** Stack entries like "Next.js 16" and "React 19" embed version numbers. As projects accumulate, "Next.js 16" and "Next.js 17" would appear as separate filter chips. Decide before Phase 2 whether to strip versions in display (showing "Next.js") while keeping exact values for filtering, or to keep exact values throughout. This is a content strategy decision that affects the filter bar design.

- **ScrollReveal bypass implementation variant:** The pitfalls research identifies two valid approaches for bypassing ScrollReveal when filtering: (a) CSS `display: none` to preserve component instances and their already-observed state, or (b) conditional rendering without the `ScrollReveal` wrapper when filters are active. Both work; (a) is simpler but keeps hidden card DOM nodes; (b) is cleaner but requires a "is filtering active" prop drilled into the card rendering. Decide during Phase 3 implementation.

## Sources

### Primary (HIGH confidence)
- [Next.js `useSearchParams` docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) — Suspense boundary requirement, static generation compatibility, `ReadonlyURLSearchParams` API
- [Next.js "Missing Suspense boundary" error docs](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) — CSR deopt behavior without Suspense
- [Next.js page.js conventions](https://nextjs.org/docs/app/api-reference/file-conventions/page) — `searchParams` prop forces dynamic rendering in Next.js 15+/16
- [React 19 `useTransition` docs](https://react.dev/reference/react/useTransition) — non-blocking state update pattern with `isPending`
- [WAI-ARIA APG: Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) — toggle button semantics with `aria-pressed`; why checkboxes are wrong for this use case
- [W3C ARIA22: Using role=status for status messages](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22.html) — `aria-live` region for announcing filtered result counts
- [NN/g: Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/) — empty state UX guidance; "always provide a path back"
- Direct codebase inspection: `velite.config.ts`, `blog/page.tsx`, `projects/page.tsx`, `tag-chip.tsx`, `tech-badge.tsx`, `listing-view-counts.tsx`, `scroll-reveal.tsx`, `globals.css`, all content frontmatter

### Secondary (MEDIUM confidence)
- [Aurora Scharff: Managing Advanced Search Param Filtering in Next.js](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) — comprehensive URL state filtering tutorial; validates complexity of URL state approach
- [Robin Wieruch: Search Params in Next.js for URL State](https://www.robinwieruch.de/next-search-params/) — native `useSearchParams` + `router.replace()` pattern; reference for if URL state is added later
- [Insaim: Filter UI Design Best UX Practices](https://www.insaim.design/blog/filter-ui-design-best-ux-practices-and-examples) — chip filter patterns, count badge UX, clear-all placement
- [nuqs GitHub issue #1263](https://github.com/47ng/nuqs/issues/1263) — adapter detection issue with Next.js 16 confirming the decision not to use the library
- [searchParams breaks static generation discussion](https://github.com/vercel/next.js/discussions/58884) — community confirmation of SSG deopt from `searchParams` page prop

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
