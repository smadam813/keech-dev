---
phase: quick-004
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/app/globals.css]
autonomous: false

must_haves:
  truths:
    - "Inline code in prose text feels lightweight and integrated, not like heavy black blocks"
    - "Inline code is still visually distinguishable from surrounding prose (mono font, subtle background)"
    - "Fenced code blocks retain their full neobrutalist styling unchanged"
  artifacts:
    - path: "src/app/globals.css"
      provides: "Restyled inline code rules at lines 149-161"
      contains: ":not(pre) > code"
  key_links:
    - from: "src/app/globals.css"
      to: "inline code elements in MDX blog posts"
      via: "CSS selector :not(pre) > code and span[data-rehype-pretty-code-figure] code"
      pattern: ":not\\(pre\\) > code"
---

<objective>
Restyle inline code elements to feel lighter and more integrated with surrounding prose text.

Purpose: The current inline code styling uses a solid black border (`1px solid #000`) and generous horizontal padding (`px-1.5`) that makes every inline `code` reference look like a heavy block, drawing the eye away from the prose. The user explicitly described them as "giant black blocks" with "huge amounts of margin on left and right." Inline code should be visually distinct but not visually dominant.

Output: Updated CSS rules for inline code in `globals.css` (lines 149-161 only).
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Soften inline code styling</name>
  <files>src/app/globals.css</files>
  <action>
Modify ONLY the two inline code CSS rules at lines 149-161 in `src/app/globals.css`. DO NOT touch any other CSS in the file, especially not lines 91-148 (fenced code block styles).

Replace the two inline code rules with these updated styles:

```css
/* Inline code (not in code blocks) */
:not(pre) > code {
    @apply px-1 py-0.5 rounded font-mono text-sm;
    background-color: var(--color-surface);
    border: 1px solid var(--color-muted);
    color: var(--color-foreground);
}

/* Inline code processed by rehype-pretty-code */
span[data-rehype-pretty-code-figure] code {
    @apply px-1 py-0.5 rounded font-mono text-sm;
    background-color: var(--color-surface);
    border: 1px solid var(--color-muted);
    color: var(--color-foreground);
}
```

Key changes from current styling:
1. **Border softened:** `1px solid var(--color-foreground)` (black #000) changed to `1px solid var(--color-muted)` (gray #666). This removes the harsh black border that makes inline code look like heavy blocks.
2. **Horizontal padding reduced:** `px-1.5` (6px each side) changed to `px-1` (4px each side). This addresses the user's complaint about "huge amounts of margin on left and right."
3. **Explicit text color added:** `color: var(--color-foreground)` ensures text remains readable.

What stays the same:
- `py-0.5` vertical padding (already minimal)
- `rounded` border radius
- `font-mono` and `text-sm` (keeps code visually distinct as code)
- `background-color: var(--color-surface)` (subtle light pink background for differentiation)
  </action>
  <verify>
1. Run `npm run build` to confirm no CSS errors.
2. Visually inspect the diff to confirm ONLY lines 149-161 changed. The fenced code block styles (lines 91-148) must be byte-identical to before.
  </verify>
  <done>Both inline code CSS rules use `var(--color-muted)` border instead of `var(--color-foreground)`, and `px-1` instead of `px-1.5`. No fenced code block styles modified.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Restyled inline code to use a softer gray border and tighter padding, making it feel lighter and more integrated with prose text while still being visually distinguishable.</what-built>
  <how-to-verify>
    1. Run `npm run dev` and visit http://localhost:3000
    2. Navigate to a blog post that contains inline code references (e.g., a post mentioning function names, file paths, or variable names)
    3. Verify inline code elements:
       - Border is now a subtle gray instead of heavy black
       - Padding feels tighter and more proportional to surrounding text
       - Inline code is still clearly distinguishable (mono font, light pink background, subtle border)
       - Inline code no longer looks like "giant black blocks"
    4. Verify fenced code blocks are UNCHANGED:
       - Full-width code blocks still have 3px black border and box-shadow
       - Title bars, line numbers, and syntax highlighting all work as before
  </how-to-verify>
  <resume-signal>Type "approved" or describe any adjustments needed</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` succeeds without errors
- Lines 91-148 of globals.css are untouched (fenced code block styles)
- Lines 149-161 reflect the new lighter inline code styling
- Visual inspection confirms inline code feels integrated with prose
</verification>

<success_criteria>
Inline code in blog posts uses a gray (#666) border instead of black, with reduced horizontal padding, making it feel lighter and more integrated with surrounding prose text. Fenced code blocks remain completely unchanged.
</success_criteria>

<output>
After completion, create `.planning/quick/004-restyle-inline-code-to-feel-lighter-and-/004-SUMMARY.md`
</output>
