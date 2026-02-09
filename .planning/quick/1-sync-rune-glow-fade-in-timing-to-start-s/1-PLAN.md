---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/rune-glows.ts
  - src/components/hero.tsx
  - src/app/globals.css
autonomous: true
must_haves:
  truths:
    - "All rune glows fade in simultaneously when the hero becomes visible"
    - "Each rune still breathes at its own unique rate for organic feel"
    - "No staggered entrance delays remain in any file"
  artifacts:
    - path: "src/lib/rune-glows.ts"
      provides: "Rune glow definitions without getEntranceDelay"
    - path: "src/components/hero.tsx"
      provides: "Hero component without entrance-delay CSS variable"
    - path: "src/app/globals.css"
      provides: "Simplified rune-glow--active animation without entrance-delay"
  key_links:
    - from: "src/app/globals.css"
      to: ".rune-glow--active"
      via: "animation shorthand"
      pattern: "runeGlowEntrance 800ms.*forwards.*runeGlowBreathe"
---

<objective>
Remove staggered entrance delays from rune glow animations so all runes fade in simultaneously, while preserving varied breathing rates for organic feel.

Purpose: The current power-curve cascade (3000ms spread) makes runes appear one-by-one. The desired behavior is all runes appearing at the same time.
Output: Three files modified, one function removed, CSS simplified.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/rune-glows.ts
@src/components/hero.tsx
@src/app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove getEntranceDelay and synchronize rune glow animations</name>
  <files>src/lib/rune-glows.ts, src/components/hero.tsx, src/app/globals.css</files>
  <action>
    1. In `src/lib/rune-glows.ts`: Delete the `getEntranceDelay` function (lines 75-84, including the JSDoc comment). No other code references it.

    2. In `src/components/hero.tsx`:
       - Line 7: Remove `getEntranceDelay` from the import — change to `import { RUNE_GLOWS, computeGlowPositions } from '@/lib/rune-glows'`
       - Line 141: Delete the `'--entrance-delay': getEntranceDelay(i, RUNE_GLOWS.length),` line entirely. The style object should only have `left`, `top`, `width`, `height`, and `'--breath-duration'`.

    3. In `src/app/globals.css` lines 168-172: Simplify `.rune-glow--active` to remove all `var(--entrance-delay)` references. Replace with:
       ```css
       .rune-glow--active {
         animation:
           runeGlowEntrance 800ms ease-out forwards,
           runeGlowBreathe var(--breath-duration, 6s) ease-in-out 800ms infinite;
       }
       ```
       The entrance animation starts immediately (no delay). The breathing animation starts after 800ms (the fixed entrance duration), not `calc(var(--entrance-delay) + 800ms)`.
  </action>
  <verify>
    Run `npm run build` — must complete with no errors (confirms no broken imports or references to removed function).
    Grep for "getEntranceDelay" and "entrance-delay" across `src/` — must return zero matches.
  </verify>
  <done>
    All three files updated. getEntranceDelay function removed. No staggered delays remain. Build succeeds. All runes will fade in at 0ms with breathing starting at 800ms, each at their own breathDuration.
  </done>
</task>

</tasks>

<verification>
- `npm run build` passes with zero errors
- `grep -r "getEntranceDelay" src/` returns nothing
- `grep -r "entrance-delay" src/` returns nothing
- CSS `.rune-glow--active` has no `var(--entrance-delay)` references
- Each rune still has `--breath-duration` set (varied breathing preserved)
</verification>

<success_criteria>
All rune glows enter simultaneously (no stagger). Varied breathing rates preserved. Clean build with no dead code.
</success_criteria>

<output>
After completion, create `.planning/quick/1-sync-rune-glow-fade-in-timing-to-start-s/1-SUMMARY.md`
</output>
