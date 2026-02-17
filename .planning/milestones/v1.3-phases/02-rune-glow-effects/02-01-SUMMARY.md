---
phase: 02-rune-glow-effects
plan: 01
subsystem: ui
tags: [css-animation, radial-gradient, resize-observer, object-cover, rune-glow]

requires:
  - phase: 01-animation-sync-reveal
    provides: imageLoaded state, revealStage state machine, prefersReducedMotion detection, CSS animation infrastructure
provides:
  - 14 ambient rune glow overlays with staggered entrance cascade and continuous breathing
  - Object-cover position mapping utility (computeGlowPositions)
  - GPU-composited glow animation system (opacity + transform only)
  - ResizeObserver-based responsive glow repositioning
affects: []

tech-stack:
  added: []
  patterns: [object-cover-position-mapping, css-custom-property-animation-timing, staggered-entrance-cascade]

key-files:
  created:
    - src/lib/rune-glows.ts
  modified:
    - src/components/hero.tsx
    - src/app/globals.css

key-decisions:
  - "14 runes (not 13) -- visual inspection revealed an additional rune missed by initial research"
  - "Color distribution: 6 teal, 4 amber, 4 gold -- adjusted from original aett grouping for visual balance"
  - "Glow positions manually calibrated via iterative visual verification -- research estimates were significantly off"
  - "No mix-blend-mode -- standard opacity compositing to preserve GPU acceleration"

patterns-established:
  - "Object-cover position mapping: computeGlowPositions() converts image-space fractions to container-space pixels accounting for cover scaling/centering"
  - "CSS custom property animation: --entrance-delay and --breath-duration inline styles consumed by shared CSS classes"

duration: 45min
completed: 2026-02-08
---

# Plan 02-01: Rune Glow Overlays Summary

**14 ambient rune glow overlays with object-cover position mapping, staggered power-curve entrance cascade, and per-rune breathing cycles using only GPU-composited properties**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-08
- **Completed:** 2026-02-08
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Rune glow data module with 14 rune positions, object-cover mapping math, and entrance delay calculator
- CSS keyframes (runeGlowEntrance, runeGlowBreathe) with three color variants (amber, teal, gold) using radial gradients
- Hero component integration with glowsActive state gated on text-reveal completion, ResizeObserver for responsive repositioning
- All 14 glow positions manually calibrated to pixel-precise alignment on actual rune characters

## Task Commits

Each task was committed atomically:

1. **Task 1: Add glow data module and CSS keyframes/classes** - `ef9583f` (feat)
2. **Task 2: Integrate glow overlays into hero component** - `e5678d3` (feat)
3. **Task 3: Verify glow visual quality and positioning** - `7d11d6e` (fix — position tuning)

## Files Created/Modified
- `src/lib/rune-glows.ts` - Rune glow position data (14 runes), computeGlowPositions(), getEntranceDelay()
- `src/app/globals.css` - runeGlowEntrance/runeGlowBreathe keyframes, rune-glow base/active/color classes, reduced-motion overrides
- `src/components/hero.tsx` - Glow overlay rendering with ResizeObserver, glowsActive state triggered after text reveal

## Decisions Made
- 14 runes instead of 13 — visual inspection during calibration revealed an additional rune character
- Color distribution changed to 6 teal, 4 amber, 4 gold — adjusted from strict aett grouping for better visual balance across the image
- All positions manually calibrated through iterative screenshot-based verification — the research estimates were off by 5-15% in both axes
- Research rune identifications were partially incorrect — some rune names may not match their actual Elder Futhark identity

## Deviations from Plan

### Auto-fixed Issues

**1. Rune count and color distribution**
- **Found during:** Task 3 (visual verification)
- **Issue:** Research identified 13 runes; visual inspection found 14. Original aett-based color distribution didn't produce optimal visual balance.
- **Fix:** Added 14th rune entry, redistributed colors to 6 teal / 4 amber / 4 gold
- **Files modified:** src/lib/rune-glows.ts
- **Verification:** All 14 runes visually confirmed with glows at full opacity

**2. All rune positions required manual recalibration**
- **Found during:** Task 3 (visual verification)
- **Issue:** Research position estimates were off by 5-15% in both x and y axes. Linear transformation from calibration points did not extrapolate reliably.
- **Fix:** User manually calibrated all 14 positions through iterative visual verification with full-opacity debug mode
- **Files modified:** src/lib/rune-glows.ts
- **Verification:** Screenshot confirmation at each position

---

**Total deviations:** 2 (rune count/colors, position calibration)
**Impact on plan:** Position tuning was anticipated by the plan (Task 3 checkpoint). Rune count change is additive, no scope creep.

## Issues Encountered
- Linear triangulation from 2 calibration points failed to extrapolate — the research position errors were non-linear and inconsistent across the image
- Research rune identification was partially wrong — some named runes don't match their actual positions in the image

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete — all rune glow effects implemented and visually verified
- No further phases in this milestone

---
*Phase: 02-rune-glow-effects*
*Completed: 2026-02-08*
