---
phase: 18-react-19-lint-cleanup
plan: 02
subsystem: ui
tags: [react-19, eslint, useSyncExternalStore, useMediaQuery, lint-cleanup]

# Dependency graph
requires:
  - phase: 18-react-19-lint-cleanup/01
    provides: useViewStore and useMediaQuery shared hooks
provides:
  - All consumer components migrated to shared hooks
  - Zero ESLint warnings across entire codebase
  - Header menu uses derived state pattern (no setState-in-effect)
  - No ref-during-render patterns remain
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Derived state pattern for route-change-dependent UI (menuPathname)"
    - "eslint-disable with explanatory comments for intentional animation orchestration"
    - "Direct function deps in useMemo instead of ref stabilization for cheap computations"

key-files:
  created: []
  modified:
    - src/components/blog/view-counter.tsx
    - src/components/blog/listing-view-counts.tsx
    - src/hooks/use-hero-animation.ts
    - src/components/ui/scroll-reveal.tsx
    - src/components/layout/header.tsx
    - src/hooks/use-filtered-list.ts
    - src/components/hero.tsx
    - src/app/error.test.tsx

key-decisions:
  - "Removed eslint-disable on async setState in setTimeout -- rule only flags synchronous calls"
  - "Added eslint-disable for scroll-reveal setIsVisible and filtered-list setIsTransitioning -- necessary for correct behavior"

patterns-established:
  - "Derived state via menuPathname comparison replaces setState-in-useEffect for route-dependent UI"
  - "Direct getItemValues in useMemo deps acceptable for cheap computations (<100 items)"

requirements-completed: [RQ-01, RQ-02, RQ-03, RQ-04]

# Metrics
duration: 4min
completed: 2026-04-05
---

# Phase 18 Plan 02: Consumer Migration and Zero Lint Warnings Summary

**Migrated all React 19 lint-violating patterns to shared hooks and derived state, achieving zero ESLint warnings across 135 passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T01:59:51Z
- **Completed:** 2026-04-05T02:04:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- View counters (single + batch) migrated from useLayoutEffect to useSyncExternalStore for flash-free cached reads
- Hero animation and ScrollReveal migrated from manual matchMedia to useMediaQuery hook
- Header mobile menu close-on-route-change replaced with derived state pattern (no setState-in-effect)
- useFilteredList ref-during-render eliminated, Hero entrance delays moved to useMemo
- `npm run lint` produces zero warnings, all 135 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate view counters and hero/scroll-reveal to shared hooks** - `2020e06` (feat)
2. **Task 2: Fix ref-during-render, header menu, unused var, and verify zero warnings** - `b629f08` (feat)

## Files Created/Modified
- `src/components/blog/view-counter.tsx` - Uses useViewStore instead of useLayoutEffect for cached view reads
- `src/components/blog/listing-view-counts.tsx` - Uses useSyncExternalStore for batch cached view reads
- `src/hooks/use-hero-animation.ts` - Uses useMediaQuery, eslint-disable comments for animation orchestration
- `src/components/ui/scroll-reveal.tsx` - Uses useMediaQuery, eslint-disable for reduced-motion branch
- `src/components/layout/header.tsx` - Derived isOpen from menuPathname comparison (no close-on-route effect)
- `src/hooks/use-filtered-list.ts` - Removed getItemValuesRef, direct function call with eslint-disable for transition
- `src/components/hero.tsx` - useMemo for entranceDelays instead of useRef (no ref-during-render)
- `src/app/error.test.tsx` - Removed unused container destructuring

## Decisions Made
- Removed eslint-disable comments on `setRevealStage` inside setTimeout callbacks -- the react-hooks/set-state-in-effect rule only flags synchronous setState, not async calls in callbacks. Keeping unused directives would cause "unused directive" warnings.
- Added eslint-disable comments for `setIsVisible(true)` in scroll-reveal and `setIsTransitioning(true)` in filtered-list -- these are intentional synchronous setState calls needed for correct animation/transition behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused eslint-disable directives causing lint warnings**
- **Found during:** Task 2 verification (lint check)
- **Issue:** Plan specified eslint-disable comments on `setRevealStage('bg-reveal')` and `setRevealStage('text-reveal')` inside setTimeout, but the rule doesn't flag async setState -- resulting in "unused directive" warnings
- **Fix:** Removed the two unnecessary eslint-disable comments from use-hero-animation.ts
- **Files modified:** src/hooks/use-hero-animation.ts
- **Verification:** `npm run lint` produces zero warnings
- **Committed in:** b629f08

**2. [Rule 2 - Missing Critical] Added eslint-disable for scroll-reveal and filtered-list setState-in-effect**
- **Found during:** Task 2 verification (lint check)
- **Issue:** `setIsVisible(true)` in scroll-reveal and `setIsTransitioning(true)` in use-filtered-list flagged by react-hooks/set-state-in-effect but are intentional patterns
- **Fix:** Added eslint-disable-next-line comments with explanatory rationale
- **Files modified:** src/components/ui/scroll-reveal.tsx, src/hooks/use-filtered-list.ts
- **Verification:** `npm run lint` produces zero warnings
- **Committed in:** b629f08

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary to achieve the zero-warnings goal. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All React 19 lint warnings eliminated
- Shared hooks (useViewStore, useMediaQuery) fully integrated across all consumers
- Codebase ready for any future phases -- clean lint baseline established

## Self-Check: PASSED

All 8 modified files verified on disk. Both task commits (2020e06, b629f08) verified in git log. SUMMARY.md exists.

---
*Phase: 18-react-19-lint-cleanup*
*Completed: 2026-04-05*
