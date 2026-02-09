# Roadmap: Hero Polish

## Overview

This milestone fixes the hero animation timing bug and adds ambient rune glow effects. Phase 1 solves the core problem -- text animation playing before the background image loads -- by converting the hero to a client component with load-gated animation sequencing. Phase 2 layers CSS glow overlays at rune positions in the hero image, creating an organic ambient effect that depends on Phase 1's animation infrastructure.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Animation Sync & Reveal** - Fix the animation timing bug and establish load-gated reveal sequence
- [x] **Phase 2: Rune Glow Effects** - Add ambient CSS glow overlays at rune positions with staggered organic timing

## Phase Details

### Phase 1: Animation Sync & Reveal
**Goal**: Users see a polished, intentional hero entrance -- text animation never plays over a bare gradient, and the reveal sequence feels coordinated
**Depends on**: Nothing (first phase)
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, RVEAL-01, RVEAL-02
**Success Criteria** (what must be TRUE):
  1. Navigating to the home page via client-side link shows the text animation only after the background image is fully visible
  2. Pressing the browser back button to return to the home page shows the hero instantly with no re-animation (bfcache preserved)
  3. The reveal plays as a coordinated two-beat sequence: background resolves from blur, brief pause, then text fades up
  4. Toggling prefers-reduced-motion in OS settings causes all hero animations to be skipped with content immediately visible
  5. No layout shift occurs during the hero reveal sequence (CLS remains zero for the hero section)
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md -- Load-gated two-beat hero reveal (CSS + client component + visual verification)

### Phase 2: Rune Glow Effects
**Goal**: The hero image comes alive with subtle, ambient rune glows that pulse organically and reinforce the Norse visual identity
**Depends on**: Phase 1 (requires imageLoaded state, CSS animation infrastructure, and reduced-motion detection)
**Requirements**: GLOW-01, GLOW-02, GLOW-03, GLOW-04, GLOW-05, GLOW-06
**Success Criteria** (what must be TRUE):
  1. Visible glow spots appear at rune locations in the hero image after the reveal sequence completes
  2. Each glow spot pulses at its own rhythm with organic, non-uniform timing (not mechanical equal spacing)
  3. Glow colors vary by rune group -- warm amber, cool teal, and pale gold are visually distinguishable
  4. After the initial pulse-in, glows settle into a slow continuous breathing cycle that runs indefinitely
  5. Hero section remains smooth (no jank) on a throttled CPU, confirming only GPU-composited properties are animated
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md -- Rune glow overlays with staggered entrance, breathing cycle, and responsive object-cover positioning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Animation Sync & Reveal | 1/1 | ✓ Complete | 2026-02-08 |
| 2. Rune Glow Effects | 1/1 | ✓ Complete | 2026-02-08 |
