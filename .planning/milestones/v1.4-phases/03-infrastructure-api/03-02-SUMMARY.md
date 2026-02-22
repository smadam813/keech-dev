---
phase: 03-infrastructure-api
plan: 02
subsystem: api
tags: [redis, dedup, view-count, gap-closure, conditional-incr]

# Dependency graph
requires:
  - phase: 03-01
    provides: "View count API with pipeline-based Redis operations"
provides:
  - "Server-enforced IP deduplication that prevents count inflation on repeat POSTs"
affects: [04-post-page-integration, 05-listing-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Two-step SET NX + conditional INCR for dedup enforcement", "redis.get() for read-only count retrieval on repeat visits"]

key-files:
  created: []
  modified:
    - src/app/api/views/[slug]/route.ts

key-decisions:
  - "Replaced pipeline with two-step sequential Redis calls for correctness over ~1-2ms latency"
  - "Dedup enforced at API layer -- repeat POSTs skip INCR entirely instead of always incrementing"

patterns-established:
  - "Dedup pattern: SET NX first, branch on result, INCR only on 'OK'"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05]

# Metrics
duration: 1min
completed: 2026-02-21
---

# Phase 3 Plan 2: Dedup Enforcement Gap Closure Summary

**Two-step SET NX + conditional INCR replacing unconditional pipeline INCR to prevent view count inflation from repeat POSTs**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-21T18:30:34Z
- **Completed:** 2026-02-21T18:31:11Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Fixed INFRA-04 dedup enforcement gap: repeat POSTs from the same IP within 24h no longer inflate the view count
- Replaced pipeline-batched approach (SET NX + unconditional INCR) with two-step conditional logic
- First POST from new IP executes SET NX then INCR (increments count)
- Repeat POST from same IP executes SET NX (fails), then GET (reads count without incrementing)
- Response shape `{ slug, views, deduplicated }` preserved for both code paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace pipeline with two-step conditional INCR in POST handler** - `897040e` (fix)

## Files Created/Modified
- `src/app/api/views/[slug]/route.ts` - Rewrote POST handler Redis logic from pipeline to two-step conditional INCR

## Decisions Made
- Replaced pipeline with two sequential Redis calls: the ~1-2ms extra latency is negligible for a personal blog and the correctness guarantee is worth the tradeoff
- Dedup enforcement moved from "flag-only" (pipeline always incremented) to "gate" (INCR only runs on first visit)

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no new external service configuration required. Existing Upstash Redis credentials from Plan 01 are sufficient.

## Next Phase Readiness
- View count API now correctly enforces dedup at the server layer
- Phase 4 client code does not need to handle dedup logic -- the API guarantees correctness
- API response shapes unchanged: GET returns `{ slug, views }`, POST returns `{ slug, views, deduplicated }`
- No blockers for Phase 4

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 03-infrastructure-api*
*Completed: 2026-02-21*
