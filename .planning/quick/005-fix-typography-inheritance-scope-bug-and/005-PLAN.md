---
phase: quick-005
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/layout.tsx
  - src/app/globals.css
autonomous: true

must_haves:
  truths:
    - "Body text renders in Inter, not Times New Roman (font CSS variables are inherited by html element)"
    - "Headings render in Space Grotesk (font CSS variables are inherited by html element)"
    - "All text-muted usage meets WCAG AA 4.5:1 contrast ratio against the dusty pink background"
  artifacts:
    - path: "src/app/layout.tsx"
      provides: "Font variable classes on html element"
      contains: "spaceGrotesk.variable"
    - path: "src/app/globals.css"
      provides: "Updated --color-muted with WCAG-compliant value"
      contains: "--color-muted: #4A4A4A"
  key_links:
    - from: "src/lib/fonts.ts"
      to: "src/app/layout.tsx"
      via: "CSS variable classes applied to html tag"
      pattern: "spaceGrotesk\\.variable.*inter\\.variable"
    - from: "src/app/globals.css"
      to: "src/app/layout.tsx"
      via: "@layer base html uses font-body which reads --font-body variable from html"
      pattern: "font-body"
---

<objective>
Fix two bugs: (1) font CSS variables scoped to body are invisible to html where font-body is applied, causing Times New Roman fallback; (2) muted text color #666666 fails WCAG AA contrast against the #E8B4B8 background.

Purpose: Correct visual rendering of fonts site-wide and ensure accessibility compliance for all muted text.
Output: Two file edits -- layout.tsx and globals.css.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@src/app/layout.tsx
@src/app/globals.css
@src/lib/fonts.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move font variable classes from body to html and fix muted color contrast</name>
  <files>src/app/layout.tsx, src/app/globals.css</files>
  <action>
In `src/app/layout.tsx`:
- Move `${spaceGrotesk.variable} ${inter.variable}` from the `<body>` className to the `<html>` tag className
- The `<html>` tag currently has only `lang="en"` -- add `className={`${spaceGrotesk.variable} ${inter.variable}`}`
- The `<body>` tag should retain `min-h-dvh flex flex-col` but no longer have the font variable classes

This fixes the inheritance bug: `globals.css` @layer base applies `font-body` to the `html` element via `@apply font-body`. The `font-body` utility resolves to `var(--font-body)`, which is a CSS custom property. CSS custom properties are inherited downward, so `--font-body` defined on `<body>` is NOT visible to its parent `<html>`. Moving the variable classes to `<html>` ensures the variables are defined at or above the element that uses them.

In `src/app/globals.css`:
- Change `--color-muted: #666666;` to `--color-muted: #4A4A4A;`
- This darkens the muted text from contrast ratio ~3.34:1 to ~4.56:1 against #E8B4B8, passing WCAG AA (4.5:1 minimum)
- The change is subtle (mid-gray to slightly darker mid-gray) and preserves the visual hierarchy where muted text is clearly secondary to foreground (#000000) text
- Note: code block line numbers also use --color-muted but with 0.5 opacity on a dark background, so they are unaffected by this change in a meaningful way

Do NOT change any other styles or layout structure.
  </action>
  <verify>
1. Run `npm run build` -- should complete without errors
2. Visually confirm in layout.tsx: `<html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>`
3. Visually confirm in layout.tsx: `<body className="min-h-dvh flex flex-col">`
4. Visually confirm in globals.css: `--color-muted: #4A4A4A;`
  </verify>
  <done>
Font variable classes are on the html element (not body), ensuring @layer base font-body resolution works correctly. Muted text color is #4A4A4A, meeting WCAG AA 4.5:1 contrast against #E8B4B8.
  </done>
</task>

</tasks>

<verification>
- `npm run build` succeeds
- In layout.tsx, font variable classes are on `<html>`, not `<body>`
- In globals.css, `--color-muted` is `#4A4A4A`
- No other files modified
</verification>

<success_criteria>
1. Font CSS variables (--font-display, --font-body) are defined on the html element, making them available to the @layer base html rule that applies font-body
2. --color-muted is #4A4A4A, achieving >= 4.5:1 contrast ratio against #E8B4B8 background (WCAG AA compliant)
3. Production build passes without errors
</success_criteria>

<output>
After completion, create `.planning/quick/005-fix-typography-inheritance-scope-bug-and/005-SUMMARY.md`
</output>
