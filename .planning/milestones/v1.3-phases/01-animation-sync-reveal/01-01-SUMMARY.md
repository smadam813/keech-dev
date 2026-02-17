---
phase: 01-animation-sync-reveal
plan: 01
subsystem: ui
tags: [css-animations, react-hooks, next-image, reduced-motion, client-component]

# Dependency graph
requires: []
provides:
  - "Load-gated two-beat hero reveal sequence (blur-to-sharp bg, then text fade-up)"
  - "imageLoaded state in hero.tsx (available for Phase 2 glow animations)"
  - "prefersReducedMotion state in hero.tsx (available for Phase 2 glow animations)"
  - "Hero reveal CSS infrastructure (hero-bg, hero-text classes with reduced-motion overrides)"
affects: [02-glow-effects]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-path image load detection (onLoad callback + img.complete check for cached/bfcache)"
    - "Three-stage reveal state machine (loading -> bg-reveal -> text-reveal)"
    - "hasPlayedRef guard for once-per-navigation animation"
    - "CSS-first animation with JS orchestration via class toggling"

key-files:
  created: []
  modified:
    - src/components/hero.tsx
    - src/app/globals.css

key-decisions:
  - "Separate heroTextReveal keyframe from existing fadeInUp (24px vs 20px travel for hero scale)"
  - "Client component conversion for hero.tsx to enable image load detection and animation gating"
  - "600ms delay between bg reveal and text reveal (350ms blur transition + 250ms pause)"

patterns-established:
  - "Load-gated animation: never animate content until dependent assets are confirmed loaded"
  - "Dual-path load detection: onLoad callback + useEffect img.complete check covers fresh, cached, and bfcache scenarios"
  - "Reduced-motion: CSS @media overrides for immediate visual fallback + JS matchMedia for skipping setTimeout delays"

# Metrics
duration: ~15min
completed: 2026-02-08
---

# Phase 1 Plan 1: Hero Reveal Animation Summary

**Load-gated two-beat hero reveal: background blur-to-sharp then text fade-up, with dual-path cached image detection and reduced-motion support**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-08T20:48:49Z
- **Completed:** 2026-02-08T21:11:50Z
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 2

## Accomplishments
- Hero background image now resolves from 12px blur to sharp over 350ms, followed by a 250ms pause, then text fades up over 500ms with easeOutExpo curve
- Text animation is strictly gated on image load -- never plays before background is visible, fixing the original timing bug
- Cached and bfcache-restored images detected via dual-path strategy (onLoad + img.complete), so animation triggers immediately without blank flash
- prefers-reduced-motion fully supported: CSS media query overrides skip blur/animations, JS matchMedia skips setTimeout delay
- Once-per-navigation guard (hasPlayedRef) prevents re-animation on re-renders or tab switches

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hero reveal CSS to globals.css** - `7b45a9c` (feat)
2. **Task 2: Convert hero.tsx to client component with load-gated reveal** - `542c9ba` (feat)
3. **Task 3: Verify hero reveal sequence visually** - No commit (human-verify checkpoint, user approved)

## Files Created/Modified
- `src/app/globals.css` - Added heroTextReveal keyframe, hero-bg/hero-bg--revealed blur transition classes, hero-text--hidden/hero-text--reveal animation classes, and reduced-motion overrides for all new classes
- `src/components/hero.tsx` - Converted from server component to 'use client' with dual-path image load detection, three-stage reveal state machine, once-per-navigation guard, and reduced-motion detection with live toggle

## Decisions Made
- Used a separate `heroTextReveal` keyframe (24px travel) rather than reusing existing `fadeInUp` (20px travel) -- the hero text needs more visual presence at large font sizes
- Chose 600ms total delay between background reveal start and text reveal start (350ms blur transition + 250ms pause) for a perceptible two-beat rhythm
- Converted hero.tsx to client component -- necessary for useRef/useState/useEffect hooks that gate animation on image load state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `imageLoaded` state is exposed in hero.tsx, ready for Phase 2 glow animation triggers
- `prefersReducedMotion` state is exposed in hero.tsx, ready for Phase 2 reduced-motion gating
- Hero reveal CSS infrastructure (keyframes, transition classes, reduced-motion overrides) establishes the pattern for additional animation work
- No blockers for Phase 2

## Self-Check: PASSED

- [x] src/app/globals.css exists
- [x] src/components/hero.tsx exists
- [x] 01-01-SUMMARY.md exists
- [x] Commit 7b45a9c (Task 1) exists
- [x] Commit 542c9ba (Task 2) exists

---
*Phase: 01-animation-sync-reveal*
*Completed: 2026-02-08*
