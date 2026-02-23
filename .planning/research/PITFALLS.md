# Pitfalls Research

**Domain:** Multi-select tag/stack filtering on listing pages (Next.js 16 App Router, statically-generated site)
**Researched:** 2026-02-22
**Confidence:** HIGH (verified against Next.js official docs, WAI-ARIA APG patterns, and codebase-specific analysis)

## Critical Pitfalls

### Pitfall 1: useSearchParams Without Suspense Deopts the Entire Page Into Client-Side Rendering

**What goes wrong:**
If filter state is synced to URL search params via `useSearchParams()` and the component using it is not wrapped in a `<Suspense>` boundary, Next.js deopts everything up to the closest Suspense boundary (or the entire page) into client-side rendering. The blog and projects pages, currently fully static server components, would ship blank HTML shells that render entirely on the client. This destroys the performance advantage of static generation and causes a visible flash of empty content on every page load.

**Why it happens:**
During static rendering, search params are unknown (they only exist at request time). When `useSearchParams()` is called without a Suspense boundary, Next.js has no way to partially static-render the page, so it bails out entirely. The build either fails with the error "Missing Suspense boundary with useSearchParams" (Next.js 15+) or silently deopts the whole page to CSR. Developers test in dev mode (which is always dynamic) and never see the problem until production build.

**How to avoid:**
1. Keep the listing pages (`/blog/page.tsx`, `/projects/page.tsx`) as server components that render the full post/project grid statically
2. Extract the filter bar into a dedicated client component (e.g., `FilterBar`)
3. Wrap `FilterBar` in `<Suspense fallback={<FilterBarSkeleton />}>` at the page level
4. The `useSearchParams()` call lives only inside the Suspense-wrapped client component
5. The grid of cards is rendered by the server and passed down; filtering is done client-side within the client boundary

The key insight: the Suspense boundary must be as small as possible. Only the filter bar and the filtered list need to be in the client boundary -- the page heading, metadata export, and SEO content stay server-side.

**Warning signs:**
- `next build` output shows `/blog` or `/projects` as `lambda` (server-rendered) instead of `static` (circle icon)
- Build error: "Missing Suspense boundary with useSearchParams"
- Build error: "Entire page deopted into client-side rendering"
- Blank page flash on production load before JavaScript executes

**Phase to address:**
Phase 1 (component architecture). The boundary between server and client components must be designed before any code is written.

---

### Pitfall 2: Flash of Unfiltered Content (FOUC) on Page Load With URL Params

**What goes wrong:**
A user bookmarks or shares a URL like `/blog?tags=ai,fintech`. The server renders the static HTML with ALL posts visible (because static generation does not know about search params). When the client hydrates, the filter component reads the URL params and hides non-matching posts. For 200-500ms on a fast connection (longer on slow), the user sees all posts, then the list abruptly shrinks. This is the filtering equivalent of a dark-mode flash.

**Why it happens:**
Static generation produces HTML at build time with no knowledge of runtime URL parameters. The server-rendered HTML always shows the unfiltered state. Client components only activate after JavaScript loads and hydrates. The gap between initial HTML paint and client-side filtering is the FOUC window. This is inherent to the static generation + client-side filtering architecture, not a bug.

**How to avoid:**
Two viable strategies for this specific codebase:

**Strategy A (Recommended): Accept the FOUC and make it invisible.** Use CSS to start the card grid as `opacity: 0` and transition to `opacity: 1` after the client component mounts and applies filters. This is a ~50ms delay on fast connections and completely eliminates the visual flash. The `ScrollReveal` wrapper already does something similar (cards start at `opacity: 0`), so this piggybacks on an existing pattern.

**Strategy B: Do not use URL params at all.** Use `useState` for filter state. No URL sync means no shared/bookmarkable filter state, but also zero FOUC. The filtered view resets on page refresh. For a personal blog with <50 posts, this is a perfectly valid tradeoff.

If URL params are used, do NOT use Strategy C ("show a loading skeleton until filters apply") because the unfiltered content is already server-rendered and correct -- replacing real content with a skeleton is a worse UX than a brief filter application.

**Warning signs:**
- Navigate to `/blog?tags=ai` and see all posts for a split second before filtering
- More visible on throttled connections (Slow 3G in DevTools)
- Particularly noticeable when the number of filtered results is much smaller than total posts

**Phase to address:**
Phase 1 (architecture decision on URL sync vs. state-only). Phase 2 (implementation of chosen FOUC mitigation).

---

### Pitfall 3: ScrollReveal Animations Re-triggering or Breaking When Cards Are Filtered

**What goes wrong:**
The current listing pages wrap each card in `<ScrollReveal>`, which uses IntersectionObserver with `triggerOnce` semantics (once visible, stop observing). When filtering hides and then re-shows cards, one of two things happens:
1. Cards that were already revealed and are then re-shown after filtering appear instantly (no animation) because the observer already fired and disconnected -- this is actually fine.
2. If the filter implementation unmounts and remounts card components (instead of hiding them), React creates new component instances. New ScrollReveal wrappers start in `opacity: 0` state and wait for intersection -- but if they are already in the viewport, the observer fires immediately and triggers the animation. This creates a distracting "fade in" effect every time the user changes filters.

**Why it happens:**
The existing `ScrollReveal` component (`src/components/ui/scroll-reveal.tsx`) uses a single-fire IntersectionObserver pattern. It was designed for initial page load, not for dynamic content that appears and disappears. When React's reconciler unmounts and remounts components due to list changes, the observer state resets.

**How to avoid:**
- Use a CSS `display: none` or `hidden` approach to hide filtered-out cards rather than removing them from the React tree. This preserves component instances and their already-revealed state.
- Alternatively, if unmount/remount is preferred (simpler code), skip the ScrollReveal wrapper entirely on the filtered listing and show all filtered cards immediately. The scroll-reveal animation is a nice touch for the initial page load but becomes annoying when applied on every filter change.
- A third option: use React `key` props based on the post slug (already done) and accept that re-mounted cards will animate. But add a "is filtering active" flag that disables the animation when the user is actively filtering.

The recommended approach: when any filter is active, bypass ScrollReveal and show filtered cards immediately. When no filters are active (initial page load), use ScrollReveal normally.

**Warning signs:**
- Cards flicker or fade in every time a filter tag is toggled
- Already-visible cards animate again when a filter is removed
- Cards that should be visible start as invisible (`opacity: 0`) after a filter change

**Phase to address:**
Phase 2 (UI implementation). Must be considered when building the filtered card list.

---

### Pitfall 4: Layout Shift (CLS) When Filter Bar Appears or Card Count Changes

**What goes wrong:**
Two distinct CLS problems occur:

**CLS Problem A: Filter bar insertion.** If the filter bar is rendered conditionally or loads after hydration (inside a Suspense boundary with a fallback), the content below it shifts down when the filter bar appears. On the current blog page, the `<h1>Blog</h1>` is immediately followed by the card grid. Inserting a filter bar between them post-hydration pushes the grid down.

**CLS Problem B: Grid reflow on filtering.** The blog listing uses a 3-column grid (`md:grid-cols-2 lg:grid-cols-3`). If 9 cards become 2 after filtering, the grid collapses dramatically. The vertical height change is jarring and the user loses spatial orientation.

**Why it happens:**
Problem A: The Suspense fallback for the filter bar has a different height than the actual filter bar, or no fallback is provided (defaults to nothing). Problem B: CSS Grid naturally reflows when items are removed. There is no mechanism to maintain grid height during transitions.

**How to avoid:**
**For CLS Problem A:**
- Render the filter bar in the static HTML with a fixed-height placeholder. The server can compute the available tags from the content collection (since Velite data is available at build time) and render the tag list statically. Only the active/inactive state needs to be client-side.
- Make the filter bar a server component that renders the tag chips, wrapped in a client component that handles click state. The chips are always present in the HTML; the client just toggles their `aria-pressed` state and visual styling.

**For CLS Problem B:**
- Use `min-height` on the grid container based on the initial card count to prevent collapse
- Animate the transition: when cards are filtered out, fade them to `opacity: 0` and then set `display: none` after the transition, rather than immediately removing them from the flow
- Accept the reflow as natural -- for a blog with <20 posts, the grid change is small and users expect it when they click a filter

**Warning signs:**
- Lighthouse CLS score increases above 0.1 on listing pages
- Visible jump when filter bar hydrates
- Grid "snapping" to smaller size on filter toggle

**Phase to address:**
Phase 1 (determine if filter bar can be rendered statically). Phase 2 (CSS transition strategy for filtered cards).

---

### Pitfall 5: Breaking the ListingViewCounts Context When Restructuring the Blog Page

**What goes wrong:**
The current blog page wraps the entire card grid in `<ListingViewCounts slugs={slugs}>`, which provides a React Context for batch-fetched view counts. If the filter implementation changes the component tree (e.g., moves the grid inside a new client component), the `PostCardViewCount` components inside `PostCard` lose access to the context. View counts silently stop displaying -- no error, just missing data.

**Why it happens:**
React Context requires consumers to be descendants of the provider in the component tree. The current architecture has `ListingViewCounts` (client component) wrapping the grid, with `PostCard` (server component) containing `PostCardViewCount` (client component) that reads the context. If a new `FilteredPostList` client component is inserted that re-renders the cards, the context provider must wrap (or be inside) the new component. Getting the nesting wrong is easy and produces no runtime errors.

**How to avoid:**
- Keep `ListingViewCounts` as the outermost client boundary that wraps both the filter bar and the card grid
- The filter state and view count state can coexist in the same client boundary
- Pass `publishedPosts` from the server component page into the client boundary; let the client component handle both filtering and view count context
- Verify by checking: does `PostCardViewCount` still display counts after adding filters?

**Warning signs:**
- View counts disappear after adding the filter bar
- `useViewCount(slug)` returns `null` for all slugs
- No error in console (context returns the default empty object silently)

**Phase to address:**
Phase 1 (component architecture). The client boundary must be designed to encompass both filter state and view count context.

---

### Pitfall 6: Tag Normalization -- "AI" vs "ai" vs "Ai" Creates Ghost Filters

**What goes wrong:**
Blog posts use freeform string tags in frontmatter (e.g., `tags: [ai, fintech, change-management]`). Projects use freeform stack strings (e.g., `stack: [Next.js 16, React 19, Tailwind CSS v4]`). If the filter bar displays unique tags collected from all posts, inconsistent casing or naming across posts creates duplicate filter options: "AI", "ai", "Ai" appear as three separate tags. Selecting one does not match posts using the other spellings.

**Why it happens:**
MDX frontmatter tags are plain strings with no schema validation beyond "array of strings." Authors (especially a single author) may use different capitalizations across posts written months apart. The Velite schema (`s.array(s.string()).default([])`) does not enforce normalization. The problem is invisible until a filter UI makes all tags visible side by side.

**How to avoid:**
- Normalize tags at display time: `tag.toLowerCase()` for comparison, display the most common casing
- Better: normalize at the Velite config level using a `.transform()` on the tags array, so the data is clean before it reaches any component
- For project stacks, maintain exact casing (e.g., "Next.js" not "next.js") because these are proper nouns, but still use case-insensitive comparison for filtering
- Create a canonical tag list in a shared config file if the tag set should be curated
- Currently there are only 3 posts with tags `[ai, fintech, change-management, development-process, agile, spec-driven-development, software-engineering]` -- no conflicts yet, but this will happen as content grows

**Warning signs:**
- Filter bar shows near-duplicate tags (e.g., "React" and "react")
- Clicking a tag filter returns 0 results when posts with that tag exist
- Tag count in the filter bar does not match expected post count

**Phase to address:**
Phase 1 (data normalization layer). Establish the normalization rule before building the filter UI.

---

### Pitfall 7: Accessibility -- Filter Toggles Missing ARIA State and Keyboard Support

**What goes wrong:**
Tag filter chips are built as `<span>` or `<div>` elements with click handlers but no ARIA role, no `aria-pressed` state, no keyboard support, and no focus styling. Screen reader users cannot discover or operate the filters. Keyboard users cannot tab to or activate filter chips. The filter bar becomes a visual-only feature that excludes a significant portion of users.

**Why it happens:**
The existing `TagChip` component (`src/components/blog/tag-chip.tsx`) renders as either a `<Link>` or a `<span>`. When repurposed as a toggle filter, developers style it to look pressable but forget that a `<span>` has no interactive semantics. The neobrutalist design with its bold borders and shadows makes chips look like buttons, but the DOM does not agree.

**How to avoid:**
Use `<button>` elements for filter chips with:
- `aria-pressed="true|false"` to communicate toggle state
- `type="button"` to prevent form submission
- Visible focus ring (the site already has neobrutalist borders that can double as focus indicators)
- Group the filter buttons in a container with `role="group"` and `aria-label="Filter by tag"` (or `aria-label="Filter by technology"` for projects)
- Announce the result count change with an `aria-live="polite"` region: "Showing 3 of 9 posts" after filter change
- The WAI-ARIA APG "Button" pattern specifies: toggle buttons use `aria-pressed`, not `aria-checked` (checkboxes) or `aria-selected`

Do NOT use a `<fieldset>` with checkboxes unless you want the visual appearance of a form. For a tag filter bar, toggle buttons with `aria-pressed` is the correct pattern per WAI-ARIA APG.

**Warning signs:**
- Filter chips are not focusable via Tab key
- Screen reader does not announce "pressed" or "not pressed" state
- No focus ring visible when keyboard-navigating through filters
- Screen reader does not announce how many results are showing

**Phase to address:**
Phase 2 (UI implementation). Accessibility must be built into the filter chip component from the start, not bolted on.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| useState for filter state (no URL sync) | No Suspense complexity, no FOUC, simpler code | Filters reset on refresh, cannot share filtered views via URL, no deep linking | Acceptable for a personal blog with <50 posts -- recommended starting point |
| Hiding cards with CSS display:none instead of removing from DOM | Preserves ScrollReveal state, no remount cost | All card HTML is always in the page even when hidden, slightly larger document size | Acceptable with <100 cards; negligible size impact for <50 posts |
| Computing unique tags at render time instead of build-time constants | No extra build step or config file | Recalculated on every page render (though cheap) | Always acceptable for <100 posts; the Velite collection is already in memory |
| No debounce on rapid filter toggling | Simpler event handling | Rapid toggles cause many re-renders; on mobile, this could feel sluggish | Acceptable because the filtering is client-side array filtering, not API calls; <50 items filter in <1ms |
| Single filter logic for both blog and projects | One component, one pattern | Blog uses "tags" (lower-case, conceptual) and projects use "stack" (proper nouns, tech names) -- same UI but different normalization needs | Acceptable if abstracted with a prop for the data key and normalization function |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| ListingViewCounts + FilterBar | Placing FilterBar outside the ViewCounts context boundary, breaking context access for filtered cards | Ensure the client boundary wraps both the filter bar and the card grid; or restructure to have a single parent client component that owns both filter state and view count context |
| ScrollReveal + filtering | Leaving ScrollReveal wrappers on filtered cards, causing re-animation on every filter toggle | Disable or bypass ScrollReveal when filters are active; re-enable only on initial page load |
| Velite data + client components | Trying to import `posts` from `@/.velite` inside a client component (fails: Velite generates server-side data) | Import Velite data in the server component page, serialize and pass it as props to the client component |
| URL search params + static export | Using `searchParams` page prop instead of `useSearchParams` client hook, which forces the route to dynamic rendering | Use `useSearchParams()` in a client component wrapped in Suspense; never access `searchParams` prop in the page server component for filtering |
| TagChip reuse | Using the existing `TagChip` component (which is a `<span>` or `<Link>`) as-is for filter toggles, losing all button semantics | Create a new `FilterChip` component using `<button>` with `aria-pressed`; keep `TagChip` for display-only use in post cards |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire card grid on every filter toggle | Visible jank when toggling filters, especially on mobile | Use `React.memo` on card components, or filter with CSS visibility instead of conditional rendering | At 50+ cards with complex card components |
| Recomputing derived data (unique tags, filtered posts) on every render | Unnecessary CPU work, stale closure bugs | Use `useMemo` for the filtered post list and the unique tag set, keyed on filter state + post array | Not a real bottleneck at <100 posts, but good practice |
| Animating card removal/addition with CSS transitions on many items | Janky transitions on low-end mobile devices | Keep transitions simple (opacity only, no transform). Or skip animation entirely for filtering -- instant show/hide is fine for a filter interaction | At 30+ cards with complex transitions |
| useSearchParams triggering re-renders on unrelated URL changes | Filter component re-renders when other URL state changes | Use nuqs library or manual comparison of only the relevant param keys | Only relevant if other features also use URL params |

## Security Mistakes

Not applicable for this milestone. Tag filtering is entirely client-side using build-time data. No user input is sent to a server, no API calls are made for filtering, and no data is persisted. The existing view count API routes from v1.4 are unaffected.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Filter bar taking full width on mobile with wrapping tags | Filter chips overflow and push card grid far below the fold; on small screens with 8+ tags, the filter bar becomes the majority of visible content | Cap visible tags on mobile (show first 5-6 with a "+N more" toggle), or use a horizontally scrollable container for the tag row |
| No "clear all" button | User selects 3 tags, gets 0 results, cannot easily reset without clicking each tag individually | Add a "Clear" or "All" button that appears when any filter is active |
| AND logic with no results feedback | User selects "ai" + "fintech" and gets results, then adds "agile" and gets 0 results with no explanation | Show "No posts match all selected tags" with a suggestion to remove the last-added tag. Currently with 3 posts, many 2-tag AND combos will yield 0 results |
| Filter state persisting unexpectedly | User filters on blog page, navigates to a post, hits back, and sees filtered state via URL params -- this may be desired but can also confuse | If using URL params, this is correct behavior (the URL is the state). If using useState, filters correctly reset. Document the chosen behavior. |
| No visual distinction between "active filter" and "available filter" | User cannot tell which tags are selected vs. available | Use strong visual contrast: active filters get filled background with inverted text; inactive filters stay outlined. The neobrutalist palette provides good options (filled teal for active, outlined for inactive) |
| Showing filter bar when there are 0 or 1 unique tags | Filter UI with one option is confusing, suggests more should exist | Only render the filter bar if there are 2+ unique tags. With the current 3 posts this is fine, but handle the edge case. |

## "Looks Done But Isn't" Checklist

- [ ] **Accessibility:** Filter chips are focusable via Tab and activatable via Space/Enter -- test without a mouse
- [ ] **Accessibility:** Screen reader announces `aria-pressed` state change on filter toggle
- [ ] **Accessibility:** An `aria-live="polite"` region announces the filtered result count (e.g., "Showing 2 of 9 posts")
- [ ] **Accessibility:** Filter group has `aria-label` describing its purpose
- [ ] **Static generation:** `next build` output still shows `/blog` and `/projects` as static (circle icon), not lambda/server
- [ ] **View counts:** `PostCardViewCount` still displays after filter bar is added -- view count context is not broken
- [ ] **FOUC:** Navigate to `/blog?tags=ai` on a throttled connection -- no visible flash of all posts before filtering applies (if URL params are used)
- [ ] **Mobile:** Filter bar does not push card grid below the fold on 375px-wide screens
- [ ] **Empty state:** Select tags that match 0 posts -- verify a helpful empty state message appears
- [ ] **Back navigation:** Navigate from filtered blog list to a post, hit browser back -- filter state is preserved (if URL params) or gracefully reset (if useState)
- [ ] **Keyboard:** Tab through filter bar, toggle a chip with Space, verify visual and ARIA state change
- [ ] **ScrollReveal:** Toggle a filter on and off -- cards should not re-animate on reappearance

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Page deopted to CSR (no Suspense) | LOW | Add `<Suspense>` wrapper around the client component using `useSearchParams()`. No data or architecture change needed. |
| View count context broken | LOW | Move `<ListingViewCounts>` wrapper to encompass both filter bar and card grid. No API changes. |
| Flash of unfiltered content | LOW | Add CSS `opacity: 0` initial state on the card container, transition to `opacity: 1` after client mount. Pure CSS fix. |
| ScrollReveal re-animating on filter | LOW | Conditionally disable ScrollReveal when filters are active. Small prop change, no architecture rework. |
| Tag normalization issues | LOW | Add `.map(t => t.toLowerCase())` to the Velite transform or at the filter computation layer. One-line fix. |
| Layout shift from filter bar | LOW | Set explicit `min-height` on the filter bar container matching its rendered height. CSS-only fix. |
| Accessibility missing on filter chips | MEDIUM | Replace `<span>` with `<button aria-pressed>`, add `role="group"`, add `aria-live` region. Requires component changes but no architecture rework. |
| AND logic yielding too many empty states | LOW | Consider switching to OR logic, or displaying a count badge on each tag showing how many posts match. UX decision, not a code fix. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CSR bailout from useSearchParams | Phase 1: Component architecture | `next build` shows `/blog` and `/projects` as static |
| FOUC on filtered URL load | Phase 1: URL strategy decision; Phase 2: CSS mitigation | Throttled navigation to `/blog?tags=ai` shows no content flash |
| ScrollReveal interaction | Phase 2: UI implementation | Toggle filters; cards do not re-animate |
| CLS from filter bar insertion | Phase 1: Server-renderable filter bar design | Lighthouse CLS < 0.1 on listing pages |
| ViewCounts context breakage | Phase 1: Component boundary design | View counts display on blog listing after adding filters |
| Tag normalization | Phase 1: Data normalization | No duplicate tags appear in filter bar across all content |
| Accessibility of filter controls | Phase 2: Component implementation | axe-core audit passes on listing pages; keyboard-only testing succeeds |
| Mobile UX of filter bar | Phase 2: Responsive design | Filter bar is usable on 375px screen without pushing grid below fold |
| Empty state handling | Phase 2: Edge case UI | Selecting impossible tag combinations shows helpful message |
| AND logic with sparse content | Phase 1: Filtering logic decision | With 3 posts, verify that useful filter combinations exist before committing to AND logic |

## Sources

- [Next.js: Missing Suspense boundary with useSearchParams](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout) -- official docs on the CSR bailout error and all solution options
- [Next.js: Entire page deopted into client-side rendering](https://nextjs.org/docs/messages/deopted-into-client-rendering) -- official docs on how useSearchParams without Suspense breaks static generation
- [Next.js: useSearchParams API reference](https://nextjs.org/docs/app/api-reference/functions/use-search-params) -- static rendering behavior, Suspense requirement
- [Next.js Issue #48335: useSearchParams breaks static page rendering](https://github.com/vercel/next.js/issues/48335) -- community reports of static generation breaking from useSearchParams
- [WAI-ARIA APG: Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) -- toggle button semantics with aria-pressed
- [WAI-ARIA APG: Checkbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/) -- why checkboxes are wrong for tag filter toggles (use buttons instead)
- [W3C: ARIA22 Using role=status for status messages](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22.html) -- aria-live region for announcing filtered result counts
- [web.dev: Building a multi-select component](https://web.dev/articles/building/a-multi-select-component) -- accessible fieldset/checkbox patterns (reference, not recommended for this use case)
- [Scott O'Hara: Considering dynamic search results and content](https://www.scottohara.me/blog/2022/02/05/dynamic-results.html) -- screen reader behavior with dynamically updated result lists
- [nuqs: Type-safe search params state management](https://nuqs.dev/) -- library for URL state management in Next.js App Router (considered but not recommended due to zero-dependency codebase constraint)
- [Next.js Discussion #48110: Shallow routing in App Router](https://github.com/vercel/next.js/discussions/48110) -- window.history.pushState for shallow URL updates without server re-render
- [TestParty: Accessible toggle buttons guide](https://testparty.ai/blog/accessible-toggle-buttons-modern-web-apps-complete-guide) -- WCAG contrast requirements for toggle button states

---
*Pitfalls research for: Multi-select tag/stack filtering on listing pages (keech.dev v1.5)*
*Researched: 2026-02-22*
