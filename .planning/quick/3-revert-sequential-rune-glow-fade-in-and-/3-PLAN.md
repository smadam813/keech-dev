---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/hero.tsx
  - src/app/globals.css
autonomous: true
must_haves:
  truths:
    - "Each rune glow fades in at a random time between 0ms and 2000ms after activation"
    - "Random delays are different on every page load (generated client-side)"
    - "Breathing animation starts correctly after each rune's individual entrance completes"
    - "Reduced motion preference still disables all rune animations"
  artifacts:
    - path: "src/components/hero.tsx"
      provides: "Random --entrance-delay CSS custom property per rune"
      contains: "Math.random"
    - path: "src/app/globals.css"
      provides: "Animation delay using var(--entrance-delay)"
      contains: "--entrance-delay"
  key_links:
    - from: "src/components/hero.tsx"
      to: "src/app/globals.css"
      via: "--entrance-delay CSS custom property"
      pattern: "--entrance-delay"
---

<objective>
Add random entrance delays to rune glow animations so each rune fades in at a different random time (0-2000ms) on every page load, replacing the current simultaneous appearance.

Purpose: Creates an organic, mystical feel where runes reveal themselves independently rather than all appearing at once.
Output: Updated hero.tsx and globals.css with random staggered entrance behavior.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/hero.tsx
@src/app/globals.css
@src/lib/rune-glows.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add random entrance delay to rune glows</name>
  <files>src/components/hero.tsx, src/app/globals.css</files>
  <action>
**In `src/components/hero.tsx`:**

In the `RUNE_GLOWS.map()` block (around line 125-145), add a `--entrance-delay` CSS custom property to each rune's inline `style` object. Generate the delay with `Math.random() * 2000` and format as milliseconds:

```tsx
style={{
  left: pos.left,
  top: pos.top,
  width: `${rune.size}rem`,
  height: `${rune.size}rem`,
  '--breath-duration': rune.breathDuration,
  '--entrance-delay': `${Math.random() * 2000}ms`,
} as React.CSSProperties}
```

Note: `Math.random()` is called during render which means each page load produces different delays. This is intentional -- we WANT different values each render. Since `glowsActive` only flips once per page load, this runs once per rune and is stable for the lifetime of the component.

**In `src/app/globals.css`:**

Update the `.rune-glow--active` rule (around line 168-172) to use `--entrance-delay` for both the entrance animation delay and the breathing animation's start offset:

Change from:
```css
.rune-glow--active {
  animation:
    runeGlowEntrance 800ms ease-out forwards,
    runeGlowBreathe var(--breath-duration, 6s) ease-in-out 800ms infinite;
}
```

Change to:
```css
.rune-glow--active {
  animation:
    runeGlowEntrance 800ms ease-out var(--entrance-delay, 0ms) forwards,
    runeGlowBreathe var(--breath-duration, 6s) ease-in-out calc(800ms + var(--entrance-delay, 0ms)) infinite;
}
```

The `var(--entrance-delay, 0ms)` delays the entrance fade-in by the random amount. The `calc(800ms + var(--entrance-delay, 0ms))` ensures the breathing loop starts exactly when that rune's entrance animation finishes (800ms entrance duration + the entrance delay).

No changes to `rune-glows.ts` -- delays are render-time, not data.
  </action>
  <verify>
1. Run `npm run build` -- build succeeds with no errors.
2. Visual check: In the CSS, confirm `.rune-glow--active` animation shorthand includes `var(--entrance-delay, 0ms)` for entrance delay and `calc(800ms + var(--entrance-delay, 0ms))` for breathing start.
3. In hero.tsx, confirm each rune div receives `'--entrance-delay'` in its inline style with `Math.random() * 2000`.
  </verify>
  <done>
Rune glows have randomized entrance delays (0-2000ms) set via CSS custom property. Each page load produces different random timings. Breathing animation correctly offsets to start after each rune's individual entrance completes. Build passes cleanly.
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- `globals.css` `.rune-glow--active` uses `var(--entrance-delay, 0ms)` in animation shorthand
- `hero.tsx` sets `--entrance-delay` with `Math.random() * 2000` per rune
- Reduced motion media query still sets `animation: none !important` (unchanged, no regression)
</verification>

<success_criteria>
- Build succeeds
- Each rune receives a random entrance delay between 0-2000ms
- Delays are generated fresh on each page load (client-side Math.random)
- Breathing animation starts after entrance completes per-rune
- No regression to reduced motion behavior
</success_criteria>

<output>
After completion, create `.planning/quick/3-revert-sequential-rune-glow-fade-in-and-/3-SUMMARY.md`
</output>
