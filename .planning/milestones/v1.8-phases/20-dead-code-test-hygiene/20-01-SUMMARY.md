---
phase: 20-dead-code-test-hygiene
plan: 01
subsystem: testing
tags: [typescript, vitest, dead-code, test-hygiene]

# Dependency graph
requires: []
provides:
  - Clean baseline with zero dead code and co-located tests
  - tsconfig with vitest/globals type declarations
affects: [21-dependency-upgrades]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test files co-located next to source (src/proxy.test.ts beside src/proxy.ts)"
    - "vitest/globals in tsconfig.json types array for tsc compatibility"
    - "Rename default imports that shadow globals (ErrorPage instead of Error)"

key-files:
  created:
    - src/proxy.test.ts
  modified:
    - tsconfig.json
    - src/app/error.test.tsx

key-decisions:
  - "Retained lucide-react in package.json (6 other consumers confirmed)"
  - "Pre-existing tsc errors from missing build artifacts (.velite, .next/types) are out of scope"

patterns-established:
  - "Test co-location: test files live next to their source module"
  - "Import alias avoidance: default imports must not shadow global constructors"

requirements-completed: [HYGN-01, HYGN-02, HYGN-03, HYGN-04]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 20 Plan 01: Dead Code & Test Hygiene Summary

**Removed orphaned CopyButton files, relocated security-headers test to co-locate with proxy module, and fixed tsconfig/test shadowing for zero targeted tsc errors**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T20:41:56Z
- **Completed:** 2026-04-05T20:44:07Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Deleted orphaned CopyButton component and its 3 tests (dead code since v1.7 MDX migration)
- Relocated security-headers test from src/lib/ to src/proxy.test.ts with corrected relative import
- Added vitest/globals to tsconfig types array, eliminating afterEach false positives in tsc
- Renamed Error import to ErrorPage in error.test.tsx, fixing 8 constructor shadowing errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete orphaned CopyButton files** - `4ad7678` (chore)
2. **Task 2: Relocate security-headers test to src/proxy.test.ts** - `2ef4fce` (refactor)
3. **Task 3: Fix tsconfig types and error.test.tsx shadowing** - `7416959` (fix)

## Files Created/Modified
- `src/components/blog/copy-button.tsx` - Deleted (orphaned since v1.7)
- `src/components/blog/copy-button.test.tsx` - Deleted (tests for dead code)
- `src/lib/security-headers.test.ts` - Deleted (relocated)
- `src/proxy.test.ts` - Created (relocated test with corrected import)
- `tsconfig.json` - Added vitest/globals to types array
- `src/app/error.test.tsx` - Renamed Error import to ErrorPage

## Decisions Made
- Retained lucide-react in package.json -- confirmed 6 other source files import it
- Pre-existing tsc errors from missing build artifacts (.velite/, .next/types/) are out of scope for this plan; they only appear when Velite has not been run

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The plan stated `tsc --noEmit` should report zero errors, but 34 pre-existing errors remain from missing build artifacts (.velite/ directory is gitignored, .next/types/ requires a build). These are not caused by this plan's changes. The 10 specific errors targeted by the plan (2 afterEach + 8 Error shadowing) are all resolved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Codebase has zero dead code files and co-located tests
- Clean baseline established for dependency upgrades in Phase 21
- All 132 tests pass, zero lint errors

---
*Phase: 20-dead-code-test-hygiene*
*Completed: 2026-04-05*
