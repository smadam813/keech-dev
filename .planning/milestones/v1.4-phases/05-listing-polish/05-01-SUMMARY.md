---
phase: 05-listing-polish
plan: 01
subsystem: api
tags: [redis, batch-api, views, formatting, upstash]

# Dependency graph
requires:
  - phase: 03-infrastructure-api
    provides: "Redis client and single-slug view count API"
provides:
  - "Batch GET /api/views?slugs= endpoint via redis.mget()"
  - "Shared formatViewCount() utility for locale-aware view formatting"
  - "ViewCounter refactored to use shared formatting"
affects: [05-listing-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: ["batch Redis retrieval with mget()", "shared formatting utility extracted from component"]

key-files:
  created:
    - src/app/api/views/route.ts
    - src/lib/views.ts
  modified:
    - src/components/blog/view-counter.tsx

key-decisions:
  - "Extracted formatViewCount() to src/lib/views.ts for shared use between ViewCounter and listing cards"
  - "Batch endpoint uses redis.mget() for single round-trip retrieval of all view counts"

patterns-established:
  - "Shared formatting utilities in src/lib/ for cross-component consistency"
  - "Batch API endpoints at collection level (route.ts) vs single-item at [slug]/route.ts"

requirements-completed: [VIEW-03, UX-01]

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 5 Plan 1: Batch View Count API Summary

**Batch view count GET endpoint with redis.mget() and shared formatViewCount() utility for locale-aware display**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-22T02:22:38Z
- **Completed:** 2026-02-22T02:23:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created batch GET /api/views?slugs= endpoint that retrieves all view counts in a single Redis round-trip
- Extracted formatViewCount() into shared utility for locale-aware "N views" formatting
- Refactored ViewCounter to use shared utility -- zero behavioral change, shared source of truth

## Task Commits

Each task was committed atomically:

1. **Task 1: Create batch view count API endpoint and shared formatting utility** - `bdec6da` (feat)
2. **Task 2: Refactor ViewCounter to use shared formatViewCount utility** - `0864b3c` (refactor)

## Files Created/Modified
- `src/app/api/views/route.ts` - Batch GET endpoint using redis.mget() for multi-slug retrieval
- `src/lib/views.ts` - Shared formatViewCount() utility with locale-aware formatting
- `src/components/blog/view-counter.tsx` - Refactored to import formatViewCount from shared utility

## Decisions Made
- Extracted formatViewCount() to src/lib/views.ts rather than keeping it inline -- enables Plan 02 listing cards to reuse the same formatting
- Batch endpoint returns `{ counts: { slug: N } }` object shape for easy client-side lookup by slug

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Batch API endpoint ready for Plan 02 listing card consumption
- formatViewCount() available for import in any component
- Build passes cleanly with all new routes registered

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 05-listing-polish*
*Completed: 2026-02-22*
