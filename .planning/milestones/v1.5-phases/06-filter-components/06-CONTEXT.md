# Phase 6: Filter Components - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive chip toggle variants and a reusable filter bar UI. Users can interact with tag and stack chips as toggle buttons with clear active/inactive states and satisfying press feedback. This phase builds the components only — wiring them to listing pages with filter logic, URL persistence, and empty states is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Active chip styling
- Claude's discretion on active vs inactive color palette (filled accent vs inverted black, text color changes)
- Claude's discretion on inactive chip appearance (keep current bg-accent/10 or go transparent)
- Claude's discretion on hover state for inactive chips (subtle hint vs none)
- Claude's discretion on active chip shadow behavior (no shadow vs reduced shadow)

### Filter bar layout
- Claude's discretion on chip flow (wrapping rows vs horizontal scroll — decide based on actual tag/stack count in content)
- Claude's discretion on chip sort order (alphabetical vs frequency)
- Claude's discretion on "Clear all" button placement (inline at end vs right-aligned)
- Claude's discretion on whether filter bar has a label (e.g., "Filter by tags") or just shows chips directly

### Press animation feel
- Claude's discretion on press depth (full 4px vs half 2px translation)
- Claude's discretion on press mode (stay pressed while active vs momentary press then settle to active colors)
- Claude's discretion on animation speed (snappy 100-150ms vs deliberate 200-300ms)
- Claude's discretion on whether chips have shadow-brutal at rest (elevated button look vs current flat style)

### Chip differentiation
- Claude's discretion on whether TagChip and TechBadge look different as filter toggles or stay visually identical
- Claude's discretion on component architecture (single generic FilterBar vs separate per-page components)
- Claude's discretion on whether active chips show a checkmark icon or rely on color alone

### Explicit decisions
- Tags on blog post cards remain static/display-only — filter interaction only happens in the filter bar (FILT-03 is deferred to future requirements)

### Claude's Discretion
All visual and interaction design decisions for this phase are at Claude's discretion. The user trusts Claude to make choices that:
- Fit the neobrutalist visual identity (hard shadows, bold borders, dusty rose + teal palette)
- Match existing site patterns (shadow-brutal, border-2, accent colors)
- Provide clear visual distinction between active and inactive states
- Feel satisfying and responsive on click
- Work well with the existing TagChip and TechBadge component structure

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The existing components (`TagChip` in `src/components/blog/tag-chip.tsx` and `TechBadge` in `src/components/projects/tech-badge.tsx`) share identical styling today (`px-2 py-0.5 text-xs font-mono font-bold border-2 border-black bg-accent/10`) and should be evolved into polymorphic components that support both static display and interactive toggle modes.

</specifics>

<deferred>
## Deferred Ideas

- Clicking a tag on a blog post card to activate that filter (FILT-03) — explicitly deferred to future requirements

</deferred>

---

*Phase: 06-filter-components*
*Context gathered: 2026-02-27*
