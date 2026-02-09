---
phase: quick-3
plan: 01
subsystem: ui
tags: [css-animations, rune-glows, random-delay, hero]

requires:
  - phase: 02-rune-glow-effects
    provides: Rune glow animation system with entrance and breathing keyframes
provides:
  - Random per-rune entrance delays via --entrance-delay CSS custom property
  - Organic staggered reveal behavior on each page load
affects: [hero, rune-glows]

tech-stack:
  added: []
  patterns: [CSS custom property for per-element animation delay set via inline style]

key-files:
  created: []
  modified:
    - src/components/hero.tsx
    - src/app/globals.css

key-decisions:
  - "Power curve (exponent 1.5, 3000ms cascade) with Fisher-Yates shuffled order for random spatial reveal"
  - "Used CSS custom property --entrance-delay to bridge JS randomness to CSS animation shorthand"
  - "Delays stored in useRef to stay stable across re-renders"

patterns-established:
  - "Per-element animation delay via inline CSS custom property: generate in JSX, consume in CSS animation shorthand"

duration: 1min
completed: 2026-02-09
---

# Quick Task 3: Random Rune Glow Entrance Delays Summary

**Power curve entrance delays (3000ms cascade, exponent 1.5) with randomized spatial order via Fisher-Yates shuffle, using --entrance-delay CSS custom property**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-09T04:16:35Z
- **Completed:** 2026-02-09T04:17:17Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Restored original power curve timing (3000ms cascade, exponent 1.5) but with randomized spatial order via Fisher-Yates shuffle
- Each page load produces a different random reveal order while keeping the same "fast start, slow finish" cascade feel
- Delays stored in useRef for render stability
- Breathing animation correctly offsets to start after each rune's individual entrance completes
- Reduced motion behavior unchanged (no regression)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add random entrance delay to rune glows** - `1087c90` (feat)
2. **Fix: Use power curve with shuffled order instead of flat random** - `fb14daf` (fix)

## Files Created/Modified
- `src/components/hero.tsx` - Added `buildShuffledDelays()` using Fisher-Yates shuffle + power curve, stored in useRef, applied via `--entrance-delay` per rune
- `src/app/globals.css` - Updated `.rune-glow--active` animation to use var(--entrance-delay) for staggered entrance and offset breathing start

## Decisions Made
- Power curve (exponent 1.5, 3000ms total) with Fisher-Yates shuffled order -- same cascade feel, random spatial reveal
- Delays stored in useRef to remain stable across re-renders
- Used CSS custom property bridge pattern: JS sets `--entrance-delay` inline, CSS consumes via `var()` in animation shorthand
- Breathing start uses `calc(800ms + var(--entrance-delay, 0ms))` to guarantee seamless entrance-to-breathing transition per rune

## Deviations from Plan

Initial implementation used flat `Math.random() * 2000` delays. User clarified they wanted the original power curve timing but with randomized order. Fixed in follow-up commit `fb14daf`.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

---
*Quick Task: 3*
*Completed: 2026-02-09*
