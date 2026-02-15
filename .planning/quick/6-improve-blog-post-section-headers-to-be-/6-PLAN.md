---
phase: quick-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/globals.css
autonomous: false
must_haves:
  truths:
    - "Blog post h2 headings are visually prominent and clearly distinguishable from body text"
    - "h2 headings use a teal accent element consistent with neobrutalist design language"
    - "Heading hierarchy remains clear: h1 > h2 > h3 > h4 with proper spacing"
  artifacts:
    - path: "src/app/globals.css"
      provides: "Updated .prose h2 styling with increased size and accent treatment"
      contains: ".prose h2"
  key_links: []
---

<objective>
Make blog post section headers (h2) more visually prominent and eye-catching so they serve as strong visual anchors when scanning long posts.

Purpose: Currently h2 is text-2xl (1.5rem) which barely distinguishes from body text (1.125rem). Headers like "Why Your PDLC Breaks When AI Shows Up" get lost in the content. The fix increases size and adds a neobrutalist accent treatment.

Output: Updated .prose h2 styles in globals.css
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
  <name>Task 1: Enhance .prose h2 styling with size increase and teal accent</name>
  <files>src/app/globals.css</files>
  <action>
In `src/app/globals.css`, replace the existing `.prose h2` rule (lines 318-320) with an enhanced version:

```css
.prose h2 {
  @apply font-display text-3xl font-bold mt-16 mb-6;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid var(--color-accent);
}
```

Key decisions:
- **Size: text-3xl (1.875rem)** — up from text-2xl (1.5rem). This creates clear separation from body (1.125rem) while staying below the blog h1 (text-3xl/4xl/5xl responsive). Do NOT go to text-4xl as it would collide with h1 at mobile breakpoint.
- **Bottom border with teal accent** — uses `border-bottom: 3px solid var(--color-accent)` with `padding-bottom: 0.5rem` for breathing room. This was chosen over a left border because blockquotes already use `border-l-4 border-accent` (line 399) and we need visual differentiation. The 3px width matches `--border-brutal` for design consistency.
- **Spacing: mt-16 mb-6** — increased from mt-12 mb-4 to give h2 more breathing room above (clear section breaks) and slightly more below (visual pause before content).

Do NOT add box-shadow or background color — keep the treatment clean and let the teal underline do the work. The neobrutalist identity comes through the bold border width (3px) matching the design token.

Also adjust `.prose h3` spacing to maintain hierarchy rhythm — change from `mt-8 mb-3` to `mt-10 mb-4` so there is still a clear distinction between h2 and h3 section breaks:

```css
.prose h3 {
  @apply font-display text-xl font-bold mt-10 mb-4;
}
```
  </action>
  <verify>
Run `npm run build` to confirm no CSS compilation errors. Then visually inspect a blog post with multiple h2 sections (e.g., the fintech PDLC post) by running `npm run dev` and visiting http://localhost:3000/blog/fintech-pdlc — h2 headers should be noticeably larger than body text with a teal underline.
  </verify>
  <done>
- .prose h2 renders at text-3xl with a 3px teal bottom border and padding-bottom
- h2 has mt-16 mb-6 creating clear visual section breaks
- h3 spacing adjusted to mt-10 mb-4 maintaining hierarchy
- Blog post h1 > h2 > h3 > h4 size hierarchy remains clear at all breakpoints
- Build succeeds with no errors
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual verification of h2 styling on blog post</name>
  <files>src/app/globals.css</files>
  <action>Present the completed styling changes to the user for visual review.</action>
  <what-built>Enhanced h2 section headers with increased size (text-3xl), teal accent bottom border (3px), and improved spacing for visual prominence in blog posts.</what-built>
  <how-to-verify>
1. Run `npm run dev` if not already running
2. Visit http://localhost:3000/blog/fintech-pdlc
3. Scroll through the post and confirm:
   - h2 headers are clearly larger and more prominent than body text
   - Each h2 has a teal underline that feels consistent with the neobrutalist design
   - There is generous whitespace above each h2 creating clear section breaks
   - h3 subheadings are visually subordinate to h2 but still distinct from body
   - The overall reading flow feels well-structured with clear visual hierarchy
4. Check on mobile viewport (resize browser to ~375px width) — h2 should still look proportionate
  </how-to-verify>
  <verify>User confirms visual appearance is satisfactory.</verify>
  <done>User approves the h2 styling or provides specific adjustments.</done>
  <resume-signal>Type "approved" or describe any adjustments needed (e.g., "border too thick", "needs more spacing", "try left border instead")</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- Blog post pages render h2 with teal bottom border accent
- Visual hierarchy: h1 (3xl-5xl responsive) > h2 (3xl + teal border) > h3 (xl) > h4 (lg)
</verification>

<success_criteria>
Blog post h2 headings are immediately eye-catching when scanning a post, with clear visual weight from size increase and teal accent treatment consistent with the neobrutalist design system.
</success_criteria>

<output>
After completion, create `.planning/quick/6-improve-blog-post-section-headers-to-be-/6-SUMMARY.md`
</output>
