---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/components/layout/header.tsx]
autonomous: true

must_haves:
  truths:
    - "'.dev' in header logo displays in teal (text-accent) at all times"
    - "'keech' portion retains default foreground color in resting state"
    - "Hovering the logo link still transitions 'keech' to teal"
    - "Header logo visually matches the home page hero pattern"
  artifacts:
    - path: "src/components/layout/header.tsx"
      provides: "Split logo text with teal .dev accent"
      contains: '<span className="text-accent">.dev</span>'
  key_links:
    - from: "src/components/layout/header.tsx"
      to: "globals.css @theme"
      via: "text-accent utility class"
      pattern: "text-accent"
---

<objective>
Style ".dev" in the header logo with a teal accent color to match the home page hero treatment.

Purpose: Visual consistency — the home page hero already renders "keech" in default color with ".dev" in teal. The header logo should mirror this pattern so the brand identity is consistent across the entire site.

Output: Updated header component with split logo text.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/layout/header.tsx
@src/app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Split header logo text to accent ".dev" in teal</name>
  <files>src/components/layout/header.tsx</files>
  <action>
In `src/components/layout/header.tsx`, replace the logo Link content (lines 94-99) from plain text "keech.dev" to split markup:

```jsx
<Link
  href="/"
  className="font-display font-bold text-2xl hover:text-accent motion-safe:transition-colors"
>
  keech
  <span className="text-accent">.dev</span>
</Link>
```

The `hover:text-accent` on the parent Link will make "keech" transition to teal on hover, while the span is already teal — this matches the home page hero pattern exactly. The `motion-safe:transition-colors` on the parent handles the transition for the "keech" portion. The span stays teal at all times (hover:text-accent on a parent doesn't override a child's explicit text-accent since they resolve to the same color).

No other changes needed. Do NOT touch the mobile menu, desktop nav, or any other part of the component.
  </action>
  <verify>
Run `npm run build` to confirm no compilation errors. Then visually inspect by running `npm run dev` and checking:
1. Header logo shows "keech" in black and ".dev" in teal
2. Hovering the logo makes "keech" transition to teal (whole logo appears teal on hover)
3. The pattern matches the home page hero text treatment
  </verify>
  <done>Header logo displays "keech" in foreground color with ".dev" in teal accent, hover transitions the full text to teal, build passes without errors.</done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- Header logo renders with ".dev" in teal accent color at `/`, `/blog`, `/projects`, `/about`
- Hover effect on logo transitions smoothly
</verification>

<success_criteria>
- ".dev" in header logo permanently displays in teal (text-accent)
- "keech" displays in default foreground color, transitions to teal on hover
- No regressions to header layout, mobile menu, or navigation
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/001-style-dev-in-header-logo-with-teal-accen/001-SUMMARY.md`
</output>
