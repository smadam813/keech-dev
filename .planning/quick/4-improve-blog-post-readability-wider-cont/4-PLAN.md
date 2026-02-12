---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/blog/[slug]/page.tsx
  - src/app/globals.css
autonomous: true

must_haves:
  truths:
    - "Blog post content uses significantly more of the available screen width on large screens"
    - "Clicking a TOC anchor link scrolls the heading into view below the fixed header, not hidden behind it"
    - "TOC sidebar remains functional and properly positioned on large screens"
    - "Mobile layout remains unchanged and readable"
  artifacts:
    - path: "src/app/blog/[slug]/page.tsx"
      provides: "Wider blog post layout container"
      contains: "max-w-6xl"
    - path: "src/app/globals.css"
      provides: "scroll-margin-top for prose headings"
      contains: "scroll-margin-top"
  key_links:
    - from: "src/app/globals.css"
      to: "prose headings (h2, h3, h4)"
      via: "scroll-margin-top CSS property"
      pattern: "scroll-margin-top"
    - from: "src/app/blog/[slug]/page.tsx"
      to: "layout grid"
      via: "max-w-6xl container with grid columns"
      pattern: "max-w-6xl"
---

<objective>
Improve blog post readability by widening the content area and fix anchor scroll offset so TOC links work correctly with the fixed header.

Purpose: Blog posts currently feel cramped at max-w-4xl (56rem) while the site header uses max-w-7xl (80rem). Widening to max-w-6xl (72rem) gives the prose column substantially more breathing room. Additionally, the fixed header (h-16 / 64px) obscures heading anchors when clicking TOC links because no scroll-margin-top is set.

Output: Updated blog post layout and CSS with wider content, better spacing, and correct anchor scroll behavior.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/blog/[slug]/page.tsx
@src/app/globals.css
@src/components/blog/toc.tsx
@src/components/layout/header.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Widen blog post layout and improve content spacing</name>
  <files>src/app/blog/[slug]/page.tsx</files>
  <action>
    In src/app/blog/[slug]/page.tsx, make these changes to the article layout:

    1. Change outer container from `max-w-4xl` to `max-w-6xl` — this increases from 56rem to 72rem, giving the content column significantly more space while staying well under the site header's max-w-7xl (80rem).

    2. Update the grid template from `grid-cols-[1fr_auto]` to `grid-cols-[1fr_16rem]` on lg breakpoint. This gives the TOC sidebar a fixed 16rem (256px) width instead of auto-sizing, ensuring the main content column gets the remaining space predictably. The TOC component already has its own internal sizing; 16rem is sufficient for heading text.

    3. Increase the gap from `gap-12` to `gap-16` on lg breakpoint to give more visual separation between content and TOC sidebar. Keep gap-12 as the base for smaller screens where only one column shows.

    Do NOT change the mobile layout (single column). Do NOT change padding, pt, or pb values. Do NOT modify the header, tags, or any other section — only the outer article container and grid.
  </action>
  <verify>
    Run `npm run build` to confirm no build errors. Visually inspect the blog post page at a wide viewport — content should be noticeably wider with the TOC still comfortably in the sidebar.
  </verify>
  <done>Blog post content column is wider on large screens. TOC sidebar has a fixed width. Mobile layout is unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Fix anchor scroll offset for prose headings</name>
  <files>src/app/globals.css</files>
  <action>
    In src/app/globals.css, within the existing Prose Styles section (`@layer components` block containing `.prose` rules), add scroll-margin-top to all heading levels used in blog content:

    ```css
    .prose h2,
    .prose h3,
    .prose h4 {
      scroll-margin-top: 5rem;
    }
    ```

    The value of 5rem (80px) accounts for the fixed header height (h-16 = 4rem / 64px) plus 1rem (16px) of breathing room so the heading isn't flush against the header bottom.

    Place this rule after the existing heading rules (after the `.prose h4` block around line 329) and before the `/* Paragraphs */` comment. Add a comment: `/* Anchor scroll offset — clears fixed header (h-16 = 4rem) + 1rem breathing room */`

    Do NOT add scroll-margin-top to the html element or use scroll-padding-top globally — scope it to .prose headings only to avoid affecting other pages.
  </action>
  <verify>
    Run `npm run build` to confirm no CSS errors. Navigate to a blog post with a TOC, click a TOC link — the heading should scroll into view with visible space below the fixed header, not hidden behind it.
  </verify>
  <done>Clicking any TOC anchor link scrolls the target heading into view below the fixed header with comfortable spacing. No other pages are affected.</done>
</task>

</tasks>

<verification>
1. `npm run build` completes without errors
2. Blog post page at >= 1024px viewport: content column is visibly wider than before, TOC sidebar is positioned correctly on the right
3. Blog post page at < 1024px viewport: single column layout, no visible changes from before
4. Click any TOC heading link: page scrolls so the heading is visible below the fixed header, with approximately 1rem of space between header bottom and heading top
5. Direct URL with hash (e.g., /blog/post-slug#section-id): heading is visible below header on page load
</verification>

<success_criteria>
- Blog content uses max-w-6xl (72rem) container instead of max-w-4xl (56rem)
- TOC sidebar has fixed 16rem width, content column gets remaining space
- All prose headings (h2, h3, h4) have scroll-margin-top: 5rem
- No regressions on mobile layout
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/4-improve-blog-post-readability-wider-cont/4-SUMMARY.md`
</output>
