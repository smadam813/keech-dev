---
phase: 05-listing-polish
plan: 02
subsystem: ui
tags: [react, views, client-component, batch-fetch, localStorage, graceful-degradation]

# Dependency graph
requires:
  - phase: 05-listing-polish
    provides: "Batch GET /api/views?slugs= endpoint and shared formatViewCount() utility"
provides:
  - "ListingViewCounts client component with render-prop pattern for batch view count distribution"
  - "PostCard extended with optional views prop and Jera rune separator"
  - "Blog listing page with client-side view counts and graceful degradation"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["render-prop pattern for client/server boundary bridging", "localStorage caching with useLayoutEffect for flicker-free hydration"]

key-files:
  created:
    - src/components/blog/listing-view-counts.tsx
  modified:
    - src/components/blog/post-card.tsx
    - src/app/blog/page.tsx

key-decisions:
  - "Render-prop pattern keeps PostCard as server-renderable while ListingViewCounts owns the client boundary"
  - "useLayoutEffect reads localStorage cache before paint for instant view count display on return visits"
  - "Loose equality (views != null) catches both null and undefined for graceful degradation"

patterns-established:
  - "Render-prop pattern for distributing client-fetched data to server-compatible children"
  - "localStorage as instant-display cache layer with API as source of truth"

requirements-completed: [VIEW-03, UX-01, UX-03]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 5 Plan 2: Blog Listing View Counts Summary

**Batch-fetched view counts on blog listing post cards with render-prop client boundary, localStorage caching, and silent graceful degradation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T03:00:00Z
- **Completed:** 2026-02-22T03:08:30Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created ListingViewCounts client component that batch-fetches all view counts in one API call and distributes via render prop
- Extended PostCard with optional views prop displaying locale-formatted counts with Jera rune separator
- Blog listing page remains statically generated -- view counts hydrate client-side after initial render
- Graceful degradation: API failure silently falls back to cached or empty state, no broken layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ListingViewCounts context provider and PostCardViewCount component** - `b17bdf9` (feat)
2. **Task 2: Wire ListingViewCounts into blog listing page** - `215a4a1` (feat)
3. **Task 3: Verify view counts on blog listing and graceful degradation** - checkpoint:human-verify (approved, no code commit)

## Files Created/Modified
- `src/components/blog/listing-view-counts.tsx` - Client component that batch-fetches view counts via /api/views?slugs= and distributes to children via render prop, with localStorage caching for instant display
- `src/components/blog/post-card.tsx` - Extended with optional views prop, conditionally renders formatted count with Jera rune separator
- `src/app/blog/page.tsx` - Wrapped post grid with ListingViewCounts, passing counts to each PostCard while remaining a static Server Component

## Decisions Made
- Render-prop pattern chosen to keep PostCard as a server-renderable component while ListingViewCounts owns the client boundary
- useLayoutEffect reads localStorage cache before paint for instant view count display on return visits
- Loose equality check (views != null) handles both null and undefined for clean graceful degradation
- Silent catch on fetch failure -- cached values remain, or counts simply omitted from display

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- v1.4 Blog Stats milestone feature complete: individual post view counts + listing page batch view counts
- All view count infrastructure operational: Redis storage, API endpoints (single + batch), client-side caching, locale formatting
- No remaining plans in Phase 5 -- phase complete

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 05-listing-polish*
*Completed: 2026-02-22*
