---
phase: 04-post-page-integration
plan: 01
subsystem: ui
tags: [react, tailwind, animation, runes, view-counter]

# Dependency graph
requires:
  - phase: 03-infrastructure-api
    provides: "/api/views/[slug] POST endpoint with dedup"
provides:
  - "ViewCounter client component (POST-on-mount, shimmer, count display)"
  - "animate-shimmer Tailwind utility via @theme token"
  - "POST_RUNES.separator (Jera rune) for metadata separators"
affects: [04-post-page-integration, 05-blog-listing-cards]

# Tech tracking
tech-stack:
  added: []
  patterns: [useRef StrictMode guard for single-fire effects, opacity-pulse shimmer]

key-files:
  created:
    - src/components/blog/view-counter.tsx
  modified:
    - src/app/globals.css
    - src/components/runes/rune-config.ts

key-decisions:
  - "Shimmer uses opacity pulse (0.3-0.6) not gradient sweep to match neobrutalist hard-edge aesthetic"
  - "Shimmer-to-number transition is instant (no fade) for hard-edge consistency"
  - "Silent error handling leaves shimmer visible on failure; full degradation deferred to Phase 5"

patterns-established:
  - "useRef guard: hasFired.current prevents double-POST in React StrictMode dev mode"
  - "Shimmer placeholder: inline-block w-16 h-5 rounded-sm bg-muted/20 animate-shimmer"

requirements-completed: [VIEW-02, UX-02]

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 4 Plan 1: ViewCounter Component & Supporting Config Summary

**ViewCounter client component with POST-on-mount, shimmer loading placeholder, and Jera rune separator config**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-22T01:06:39Z
- **Completed:** 2026-02-22T01:07:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created ViewCounter client component that POSTs to `/api/views/{slug}` on mount and displays locale-formatted count
- Added shimmer opacity-pulse animation with reduced-motion override (static 0.4 opacity)
- Added POST_RUNES with Jera separator to rune-config.ts for post metadata theming

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shimmer keyframe and POST_RUNES config** - `186f279` (feat)
2. **Task 2: Create ViewCounter client component** - `820bc1f` (feat)

## Files Created/Modified
- `src/components/blog/view-counter.tsx` - Client component: POST-on-mount with StrictMode guard, shimmer placeholder, locale-formatted count display
- `src/app/globals.css` - Added shimmer keyframe, --animate-shimmer theme token, and reduced-motion override
- `src/components/runes/rune-config.ts` - Added POST_RUNES mapping with Jera (harvest) as metadata separator

## Decisions Made
- Shimmer uses opacity pulse (0.3 to 0.6) rather than gradient sweep to match neobrutalist hard-edge aesthetic
- Transition from shimmer to number is instant (no fade) for consistency with hard-edge design
- Singular/plural handled naturally: "1 view" / "N views"
- Number formatting uses toLocaleString() for locale-aware commas
- Silent error handling on fetch failure: shimmer stays visible, full degradation behavior deferred to Phase 5

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ViewCounter component ready to be wired into blog post page in plan 02
- POST_RUNES.separator available for replacing middle-dot separators in metadata rows
- animate-shimmer utility class available for any future loading states

## Self-Check: PASSED

- [x] `src/components/blog/view-counter.tsx` exists
- [x] `04-01-SUMMARY.md` exists
- [x] Commit `186f279` found (Task 1)
- [x] Commit `820bc1f` found (Task 2)
- [x] TypeScript compiles cleanly
- [x] Build succeeds

---
*Phase: 04-post-page-integration*
*Completed: 2026-02-22*
