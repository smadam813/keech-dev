---
phase: 18-react-19-lint-cleanup
plan: 01
subsystem: hooks
tags: [react-19, useSyncExternalStore, localStorage, matchMedia, tdd]

requires:
  - phase: none
    provides: standalone hooks with no phase dependencies
provides:
  - useMediaQuery hook for matchMedia subscriptions via useSyncExternalStore
  - useViewStore hook for localStorage view count reads via useSyncExternalStore
affects: [18-02 consumer migration]

tech-stack:
  added: []
  patterns: [useSyncExternalStore for browser API subscriptions]

key-files:
  created:
    - src/hooks/use-media-query.ts
    - src/hooks/use-media-query.test.ts
    - src/hooks/use-view-store.ts
    - src/hooks/use-view-store.test.ts
  modified: []

key-decisions:
  - "Module-level subscribeToStorage function for stable reference (avoids re-subscribe on every render)"
  - "useCallback wrapping getSnapshot with slug dependency for useViewStore"
  - "Inline subscribe closure for useMediaQuery (callers only pass static string literals)"

patterns-established:
  - "useSyncExternalStore pattern: module-level subscribe + useCallback getSnapshot + null/false server snapshot"
  - "TDD for hooks: mock browser APIs via vi.stubGlobal, test with renderHook + act"

requirements-completed: [RQ-01, RQ-02]

duration: 2min
completed: 2026-04-04
---

# Phase 18 Plan 01: Shared Hooks Summary

**Two useSyncExternalStore-based hooks (useMediaQuery, useViewStore) replacing useState+useEffect anti-patterns, with full TDD test coverage (9 tests)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T01:55:54Z
- **Completed:** 2026-04-05T01:57:32Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Created useViewStore hook that reads localStorage view counts via useSyncExternalStore with cross-tab sync
- Created useMediaQuery hook that subscribes to matchMedia via useSyncExternalStore with change event response
- Both hooks provide SSR-safe server snapshots (null for views, false for media query)
- 9 new tests pass, full suite at 135 tests (up from 126)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useViewStore hook with tests** - `d6f3539` (feat)
2. **Task 2: Create useMediaQuery hook with tests** - `65f583b` (feat)

_Both tasks followed TDD: RED (failing import) -> GREEN (implementation passes all tests)_

## Files Created/Modified
- `src/hooks/use-view-store.ts` - useSyncExternalStore-based localStorage view count reader with cross-tab sync
- `src/hooks/use-view-store.test.ts` - 5 tests: null default, numeric read, SSR null, SecurityError handling, storage event sync
- `src/hooks/use-media-query.ts` - useSyncExternalStore-based matchMedia subscription
- `src/hooks/use-media-query.test.ts` - 4 tests: false default, true match, SSR false, change event response

## Decisions Made
- Module-level `subscribeToStorage` function avoids re-subscribing on every render (stable reference per react.dev docs)
- `useCallback` wraps `getSnapshot` in useViewStore with `[slug]` dependency so useSyncExternalStore re-reads on slug change
- Inline subscribe closure in useMediaQuery is acceptable since callers only pass static string literals

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both hooks ready for Plan 02 consumer migration
- useMediaQuery replaces the matchMedia useState+useEffect pattern in use-hero-animation.ts and scroll-reveal.tsx
- useViewStore replaces the getCachedViews useLayoutEffect pattern in view-counter.tsx and listing-view-counts.tsx

## Self-Check: PASSED

- All 4 source/test files exist
- Both task commits verified (d6f3539, 65f583b)
- Full test suite: 135/135 passing

---
*Phase: 18-react-19-lint-cleanup*
*Completed: 2026-04-04*
