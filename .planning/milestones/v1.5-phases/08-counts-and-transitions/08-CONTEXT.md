# Phase 8: Counts and Transitions - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add quantitative feedback and smooth visual transitions to the existing filter system on blog and project listing pages. Specifically: count badges on filter chips, a result count display when filtering is active, and fade transitions when the visible content changes. The filter components (TagChip, TechBadge, FilterBar, FilteredPostList, FilteredProjectList) are already built from phases 6-7.

</domain>

<decisions>
## Implementation Decisions

### Count badge design
- Claude's Discretion: Full flexibility on badge visual style (inline parenthetical, superscript, pill, etc.)
- Claude's Discretion: Whether counts are always visible or appear only when filtering
- Claude's Discretion: How zero-count chips are treated (dimmed, hidden, or normal)
- Claude's Discretion: Whether the count badge gets its own contrasting background or matches the chip

### Count context (total vs filtered)
- Claude's Discretion: Whether chip counts are static (total posts with that tag) or contextual (dynamically updating based on other active filters). Choose what best serves the UX for a small content set.

### Result count display
- Claude's Discretion: Placement of the "Showing X of Y" text (between filter bar and grid, or inline with filter bar)
- Claude's Discretion: Visibility behavior (only when filtering, or always)
- Claude's Discretion: Exact phrasing ("Showing X of Y posts", "X of Y posts", "X results", etc.)

### Fade transitions
- Claude's Discretion: What fades — individual cards independently or the whole grid as a unit
- Claude's Discretion: Transition speed (must feel cohesive with the existing 150ms chip press animations)
- Claude's Discretion: Whether the result count text animates with the grid or updates instantly
- Must use CSS opacity transitions (no animation libraries — zero-animation-library constraint)
- Must respect `prefers-reduced-motion` (skip or reduce animations when enabled)

### Claude's Discretion
All four discussion areas were delegated to Claude's judgment. Key constraints to respect:
- Neobrutalist visual identity (hard shadows, bold borders, flat aesthetic)
- Mono font (`font-mono`) already used on chips
- Existing 150ms transition timing on chip interactions
- `prefers-reduced-motion` must be honored (established pattern via ScrollReveal)
- No animation libraries (CSS only)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User deferred all visual and behavioral choices to Claude's discretion within the neobrutalist design system.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TagChip` (`src/components/blog/tag-chip.tsx`): Toggle button mode with `active`/`onToggle` props — needs `count` prop added
- `TechBadge` (`src/components/projects/tech-badge.tsx`): Same toggle pattern — needs `count` prop added
- `FilterBar` (`src/components/ui/filter-bar.tsx`): Renders chips via `renderChip` callback with `{ item, active, onToggle }` — callback signature needs count data
- `FilteredPostList` (`src/components/blog/filtered-post-list.tsx`): Has filtering logic, `filteredPosts` and `isFiltering` state — result count can derive from these
- `FilteredProjectList` (`src/components/projects/filtered-project-list.tsx`): Same pattern as blog — parallel implementation
- `ScrollReveal` (`src/components/ui/scroll-reveal.tsx`): Already conditionally skipped during filtering — fade transition replaces this behavior
- `cn()` utility (`src/lib/utils.ts`): clsx + tailwind-merge for conditional classes

### Established Patterns
- Chips use `transition-all duration-150` for press animations — fade timing should be cohesive
- `prefers-reduced-motion` is checked in ScrollReveal — same pattern should apply to new fade transitions
- Neobrutalist styling: `border-2 border-black`, `shadow-brutal`, `font-mono font-bold text-xs`
- Active chip state: `bg-accent text-white`, inactive: `bg-accent/10`

### Integration Points
- TagChip and TechBadge need a `count` prop (optional, to avoid regression on non-filter uses like post detail pages)
- FilterBar's `renderChip` callback needs count data passed through — either via expanded callback props or computed in the list components
- FilteredPostList and FilteredProjectList grids need CSS transition wrappers for fade behavior
- `globals.css` may need new transition keyframes or utility classes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-counts-and-transitions*
*Context gathered: 2026-03-01*
