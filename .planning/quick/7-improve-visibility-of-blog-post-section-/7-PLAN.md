---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/globals.css
autonomous: true

must_haves:
  truths:
    - "Blog h2 headings are clearly larger and more prominent than body text"
    - "Blog h3 headings are visibly distinct from body text"
    - "Clear visual hierarchy maintained: h1 > h2 > h3 > h4 > body"
    - "Mobile responsive sizes scale proportionally"
  artifacts:
    - path: "src/app/globals.css"
      provides: "Updated prose heading sizes for improved visibility"
      contains: "text-4xl"
  key_links: []
---

<objective>
Increase blog post heading sizes to create strong visual contrast against body text.

Purpose: h2 and h3 headings currently blend too closely with body text (h2 is only 1.67x body size, h3 is barely distinguishable). Section headers need to unmistakably announce new sections.

Output: Updated prose heading styles in globals.css with larger sizes across the heading hierarchy.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/globals.css
@src/app/blog/[slug]/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Increase prose heading sizes for stronger visual hierarchy</name>
  <files>src/app/globals.css</files>
  <action>
Update the .prose heading styles in the "Prose Styles (Blog Typography)" section of globals.css:

**Desktop sizes (current -> new):**
- `.prose h2`: `text-3xl` (1.875rem) -> `text-4xl` (2.25rem). This gives a 2x ratio vs body text (1.125rem), making section headers unmistakable. Keep existing `font-bold`, `mt-16`, `mb-6`, `padding-bottom: 0.5rem`, and `border-bottom: 3px solid var(--color-accent)` unchanged.
- `.prose h3`: `text-xl` (1.25rem) -> `text-2xl` (1.5rem). Bumps from barely-distinguishable 1.11x to a clear 1.33x ratio vs body. Keep existing `font-bold`, `mt-10`, `mb-4` unchanged.
- `.prose h4`: `text-lg` (1.125rem) -> `text-xl` (1.25rem). Currently same size as body text which provides zero hierarchy signal. Keep existing `font-bold`, `mt-6`, `mb-2` unchanged.

**Mobile responsive sizes (inside `@media (max-width: 640px)`):**
- `.prose h2`: `text-2xl` -> `text-3xl` (scale up proportionally to match desktop increase)
- `.prose h3`: `text-lg` -> `text-xl` (scale up proportionally)
- Do NOT add a mobile h4 override (it wasn't there before and text-xl is fine on mobile)

Do NOT change: font-display, font-bold, margin/padding values, border-bottom on h2, scroll-margin-top, letter-spacing in base layer, or any non-heading prose styles.

Note on h1: The blog post h1 in page.tsx uses inline classes `text-3xl md:text-4xl lg:text-5xl` which are NOT affected by .prose styles (h1 sits outside the `.prose` div). No h1 collision concern.
  </action>
  <verify>
Run `npm run build` to confirm no build errors. Visually inspect the CSS changes to confirm:
1. `.prose h2` has `text-4xl`
2. `.prose h3` has `text-2xl`
3. `.prose h4` has `text-xl`
4. Mobile `.prose h2` has `text-3xl`
5. Mobile `.prose h3` has `text-xl`
6. All other heading properties remain unchanged
  </verify>
  <done>
Heading hierarchy on desktop: h2=2.25rem (2x body), h3=1.5rem (1.33x body), h4=1.25rem (1.11x body). Mobile scales proportionally. Existing teal accent border on h2 preserved. Build succeeds with no errors.
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- `.prose h2` uses `text-4xl` (2.25rem) with teal border preserved
- `.prose h3` uses `text-2xl` (1.5rem)
- `.prose h4` uses `text-xl` (1.25rem)
- Mobile responsive breakpoint scales proportionally
- No other prose styles altered
</verification>

<success_criteria>
Blog post section headings are visibly larger and more prominent than body text, with clear size differentiation at each level of the heading hierarchy. The teal accent border from quick-6 remains on h2.
</success_criteria>

<output>
After completion, create `.planning/quick/7-improve-visibility-of-blog-post-section-/7-SUMMARY.md`
</output>
