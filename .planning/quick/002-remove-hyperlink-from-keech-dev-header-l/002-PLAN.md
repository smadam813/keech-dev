---
phase: quick-002
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/components/layout/header.tsx]
autonomous: true

must_haves:
  truths:
    - "keech.dev logo text in the header is not a clickable link"
    - "keech.dev logo still displays correctly with teal .dev accent"
    - "All nav items (Home, Blog, Projects, About) still function as links"
  artifacts:
    - path: "src/components/layout/header.tsx"
      provides: "Header with non-interactive logo"
      contains: "<span"
  key_links: []
---

<objective>
Remove the hyperlink from the "keech.dev" header logo text, replacing the `<Link>` wrapper with a plain `<span>`.

Purpose: The Home nav tab already handles navigation to `/`, so the logo link is redundant. Removing it simplifies the header and avoids duplicate navigation targets.
Output: Updated header component with non-interactive logo text.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/layout/header.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace Link wrapper with span on header logo</name>
  <files>src/components/layout/header.tsx</files>
  <action>
In `src/components/layout/header.tsx`, replace lines 94-100:

```jsx
<Link
  href="/"
  className="font-display font-bold text-2xl hover:text-accent motion-safe:transition-colors"
>
  keech
  <span className="text-accent">.dev</span>
</Link>
```

With:

```jsx
<span className="font-display font-bold text-2xl">
  keech
  <span className="text-accent">.dev</span>
</span>
```

Key changes:
- Replace `<Link href="/">` with `<span>` (no longer navigable)
- Remove `hover:text-accent` and `motion-safe:transition-colors` classes since the element is no longer interactive
- Keep `font-display font-bold text-2xl` for visual consistency
- Keep the inner `<span className="text-accent">.dev</span>` as-is
- Do NOT remove the `Link` import from `next/link` -- it is still used by nav items below
  </action>
  <verify>
1. Run `npm run build` to confirm no build errors
2. Visually confirm in the built output that lines 94-98 now use `<span>` instead of `<Link>`
  </verify>
  <done>Header logo "keech.dev" renders as plain text (not a link), retains correct font styling and teal accent on ".dev", and all nav links still work.</done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- Header logo is a `<span>`, not a `<Link>` or `<a>`
- No `href` attribute on the logo element
- `hover:text-accent` and `motion-safe:transition-colors` removed from logo
- `Link` import retained (used by nav items)
</verification>

<success_criteria>
The header logo "keech.dev" is non-interactive plain text while maintaining its visual appearance.
</success_criteria>

<output>
After completion, create `.planning/quick/002-remove-hyperlink-from-keech-dev-header-l/002-SUMMARY.md`
</output>
