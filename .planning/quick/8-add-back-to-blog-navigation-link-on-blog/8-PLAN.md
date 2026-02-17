---
phase: quick-8
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/blog/[slug]/page.tsx
autonomous: true
requirements: [QUICK-8]
must_haves:
  truths:
    - "Blog post pages display a back-to-blog navigation link above the post title"
    - "The link navigates to /blog when clicked"
    - "The link styling matches the existing back-to-projects link on project pages"
  artifacts:
    - path: "src/app/blog/[slug]/page.tsx"
      provides: "Back-to-blog navigation link"
      contains: "All Blog Posts"
  key_links:
    - from: "src/app/blog/[slug]/page.tsx"
      to: "/blog"
      via: "Next.js Link component with ArrowLeft icon"
      pattern: "href.*blog"
---

<objective>
Add a "back to blog" navigation link on individual blog post pages, matching the pattern used on project detail pages.

Purpose: Blog post readers currently have no quick way to return to the blog listing. Project pages already have this pattern — an ArrowLeft icon with "All Projects" text linking back to /projects. This task mirrors that UX for blog posts.
Output: Updated blog post page with back-to-blog link.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/blog/[slug]/page.tsx
@src/app/projects/[slug]/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add back-to-blog navigation link to blog post page</name>
  <files>src/app/blog/[slug]/page.tsx</files>
  <action>
    Add a back-to-blog link to `src/app/blog/[slug]/page.tsx`, modeled after the project page pattern in `src/app/projects/[slug]/page.tsx` (lines 53-59).

    1. Add imports for `ArrowLeft` from `lucide-react` and `Link` from `next/link` (Link may already be imported — check first).

    2. Inside the `<article>` element, BEFORE the grid div (`<div className="grid ..."`), add:
    ```tsx
    <Link
      href="/blog"
      className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
    >
      <ArrowLeft size={16} />
      <span>All Blog Posts</span>
    </Link>
    ```

    This places the back link above the grid layout (which contains the main content column and sidebar TOC), keeping it full-width and not constrained to the content column. The text reads "All Blog Posts" to parallel "All Projects" on the project page.
  </action>
  <verify>
    Run `npm run build` to confirm no TypeScript or build errors. Visually confirm the link appears by checking the compiled output or running `npm run dev` and visiting a blog post.
  </verify>
  <done>
    Blog post pages render a back-to-blog link with ArrowLeft icon above the post content. The link points to /blog, uses the same styling as the project page back link (text-muted with hover:text-foreground transition), and the build succeeds without errors.
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- Blog post page source contains Link to "/blog" with ArrowLeft icon
- Styling classes match the project page back link pattern
</verification>

<success_criteria>
- Every blog post page shows a "All Blog Posts" link with left arrow icon above the title
- The link navigates to /blog
- Visual styling is consistent with the project page back link
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/8-add-back-to-blog-navigation-link-on-blog/8-SUMMARY.md`
</output>
