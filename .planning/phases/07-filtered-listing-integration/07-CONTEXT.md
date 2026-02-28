# Phase 7: Filtered Listing Integration - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the FilterBar component (built in Phase 6) into blog and projects listing pages. Users can filter blog posts by tags and projects by stack items using AND logic. Selected filters persist in the URL as search params for sharing and bookmarking. Includes empty state when no items match and a clear filters action. Count badges (BLOG-03, PROJ-03) and fade animations (BLOG-04) are Phase 8 scope.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The user trusts Claude to make decisions consistent with the site's neobrutalist design language and existing component patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-filtered-listing-integration*
*Context gathered: 2026-02-27*
