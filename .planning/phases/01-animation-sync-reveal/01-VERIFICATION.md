---
phase: 01-animation-sync-reveal
verified: 2026-02-08T21:15:04Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "Fresh load timing sequence"
    expected: "Background blurs to sharp (~350ms), pauses (~250ms), text fades up (~500ms)"
    why_human: "Visual timing and animation coordination cannot be verified programmatically"
  - test: "Cached image instant reveal"
    expected: "Sequence plays immediately without blank flash"
    why_human: "Browser cache behavior requires real browser environment"
  - test: "Back button bfcache restore"
    expected: "Hero appears instantly with no re-animation"
    why_human: "bfcache behavior is browser-specific and requires navigation testing"
  - test: "Reduced-motion skip"
    expected: "All animations skipped silently, content visible immediately"
    why_human: "OS accessibility setting integration requires human verification"
  - test: "Zero CLS during reveal"
    expected: "No layout shift during animation sequence"
    why_human: "Lighthouse CLS score requires real browser measurement"
---

# Phase 01: Animation Sync & Reveal Verification Report

**Phase Goal:** Users see a polished, intentional hero entrance -- text animation never plays over a bare gradient, and the reveal sequence feels coordinated

**Verified:** 2026-02-08T21:15:04Z

**Status:** human_needed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                     | Status      | Evidence                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Text animation never plays until background image is fully visible                        | ✓ VERIFIED  | Line 39: `if (!imageLoaded \|\| hasPlayedRef.current) return` guards reveal sequence. imageLoaded set via dual-path detection (L16-24)    |
| 2   | Cached and bfcache-restored images trigger animation immediately without blank flash      | ✓ VERIFIED  | Lines 21-25: `img.complete && img.naturalWidth > 0` check handles cached/bfcache on mount. Line 77: `onLoad={handleLoad}` handles fresh   |
| 3   | Reveal plays as a coordinated two-beat sequence: background blur-to-sharp, pause, text fade-up | ✓ VERIFIED  | Lines 49-55: `setRevealStage('bg-reveal')` immediate, then `setTimeout(() => setRevealStage('text-reveal'), 600)` after 600ms delay       |
| 4   | prefers-reduced-motion causes all hero animations to be skipped with content immediately visible | ✓ VERIFIED  | Lines 42-46: JS guard skips setTimeout. globals.css L121-142: CSS @media overrides skip blur/animations, force opacity:1                  |
| 5   | No layout shift during the hero reveal sequence                                          | ✓ VERIFIED  | Lines 112-114: opacity/transform-only animations (no width/height changes). Text container always exists (L89-98), only visibility changes |
| 6   | Reveal plays once per navigation to Home, not on re-render or tab switch                 | ✓ VERIFIED  | Line 12: `hasPlayedRef = useRef(false)`. Line 39-40: `if (hasPlayedRef.current) return` then `hasPlayedRef.current = true` guard          |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact                    | Expected                                                            | Status     | Details                                                                                                         |
| --------------------------- | ------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `src/components/hero.tsx`   | Client component with load-gated two-beat reveal sequence           | ✓ VERIFIED | Contains 'use client' (L1), imageLoaded state (L10), revealStage state machine (L11), dual-path load detection  |
| `src/app/globals.css`       | Hero reveal keyframes, transition classes, reduced-motion overrides | ✓ VERIFIED | Contains heroTextReveal keyframe (L46-55), hero-bg/hero-text classes (L100-118), reduced-motion rules (L121-142) |

### Key Link Verification

| From                                         | To                       | Via                                                                        | Status     | Details                                                                                      |
| -------------------------------------------- | ------------------------ | -------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `src/components/hero.tsx`                    | `src/app/globals.css`    | CSS class names toggled by React state                                     | ✓ WIRED    | L73-74: hero-bg/hero-bg--revealed. L91-92: hero-text--hidden/hero-text--reveal via cn()      |
| `src/components/hero.tsx imageLoaded state`  | `revealStage state`      | useEffect that sequences bg-reveal → text-reveal on imageLoaded change    | ✓ WIRED    | L38-58: useEffect triggers on [imageLoaded, prefersReducedMotion], calls setRevealStage     |
| `src/components/hero.tsx prefersReducedMotion` | reveal sequence skip   | Guard in useEffect that skips animation when reduced-motion detected       | ✓ WIRED    | L42-46: if (prefersReducedMotion) skip setTimeout, jump to text-reveal. L92: CSS class guard |

### Requirements Coverage

| Requirement | Status        | Blocking Issue |
| ----------- | ------------- | -------------- |
| SYNC-01     | ✓ SATISFIED   | None           |
| SYNC-02     | ✓ SATISFIED   | None           |
| SYNC-03     | ✓ SATISFIED   | None           |
| SYNC-04     | ? NEEDS HUMAN | CLS measurement requires Lighthouse in browser |
| RVEAL-01    | ? NEEDS HUMAN | Visual timing coordination requires human perception |
| RVEAL-02    | ✓ SATISFIED   | None           |

### Anti-Patterns Found

None detected. No TODO/FIXME/placeholder comments, no empty implementations, no console.log debugging, no orphaned code.

### Human Verification Required

#### 1. Fresh load timing sequence

**Test:** Open http://localhost:3000 in Chrome with DevTools Network throttled to "Slow 3G". Hard refresh (Cmd+Shift+R). Observe hero reveal sequence.

**Expected:** Background should appear blurry first, smoothly resolve to sharp (~350ms), pause briefly (~250ms), then "keech.dev" text should fade up from below (~500ms). Total sequence ~1.1s. Text should NEVER appear before background is sharp.

**Why human:** Visual timing perception and animation coordination cannot be verified programmatically. The code structure is correct (setTimeout 600ms delay between stages), but the feel of the timing requires human judgment.

#### 2. Cached image instant reveal

**Test:** After fresh load test above, disable throttling and refresh normally (not hard refresh). Navigate to /blog, then click back to home.

**Expected:** On cached load, the sequence should still play but complete nearly instantly since the image is already cached. On back navigation (bfcache), hero should appear instantly with no re-animation.

**Why human:** Browser cache behavior and bfcache restoration are runtime behaviors that require real browser environment testing. The dual-path detection code is verified (onLoad + img.complete check), but actual browser cache/bfcache triggering needs human confirmation.

#### 3. Reduced-motion skip

**Test:** Enable "Reduce motion" in OS accessibility settings (macOS: System Settings > Accessibility > Display > Reduce motion). Refresh the page.

**Expected:** Hero background and text should appear instantly with no blur transition or fade-up animation. No visual indicator that animations were skipped.

**Why human:** OS accessibility setting integration and CSS @media query application require human verification in a real browser with OS settings changed. The code overrides are correct (CSS media query + JS matchMedia guard), but the actual skip behavior needs visual confirmation.

#### 4. Zero CLS during reveal

**Test:** Open Chrome DevTools > Lighthouse > Run audit for Performance. Check Cumulative Layout Shift score.

**Expected:** CLS for the hero section should be 0 (no layout shift during the reveal).

**Why human:** Lighthouse CLS measurement requires real browser rendering and performance metrics collection, which can only be done in a browser environment.

#### 5. Visual polish and intentional feel

**Test:** With throttling disabled and reduce-motion off, refresh the home page multiple times. Observe the overall reveal sequence feel.

**Expected:** The reveal should feel polished and intentional. The two-beat rhythm (blur-to-sharp, pause, text) should be perceptible and coordinated, not rushed or mechanical.

**Why human:** Subjective assessment of animation quality, timing polish, and "feel" cannot be programmatically verified. This is the core UX goal of the phase.

---

## Verification Summary

All must-haves verified at the code level. The hero component correctly implements:

1. **Load gating:** Text animation strictly waits for imageLoaded state
2. **Dual-path detection:** Both onLoad callback and img.complete check present
3. **Two-beat sequence:** State machine transitions loading → bg-reveal (immediate) → text-reveal (600ms delay)
4. **Reduced-motion support:** Both CSS @media overrides and JS matchMedia guard
5. **Layout stability:** Opacity/transform-only animations, no width/height changes
6. **Once-per-navigation:** hasPlayedRef guard prevents re-animation

**Automated checks passed.** Awaiting human verification of visual timing, cache behavior, reduced-motion skip, CLS score, and overall animation polish.

---

_Verified: 2026-02-08T21:15:04Z_
_Verifier: Claude (gsd-verifier)_
