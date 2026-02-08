---
phase: quick-009
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/about/page.tsx
autonomous: true

must_haves:
  truths:
    - "Portrait photo displays at 3:4 aspect ratio (no square cropping)"
    - "Portrait photo is visually larger than the previous 192px square"
    - "Layout remains side-by-side on md+ screens and stacks on mobile"
  artifacts:
    - path: "src/app/about/page.tsx"
      provides: "Updated portrait container with 3:4 aspect ratio"
      contains: "aspect-[3/4]"
  key_links: []
---

<objective>
Enlarge the portrait photo on the About page and restore its natural 3:4 aspect ratio.

Purpose: The current w-48 h-48 container forces a square crop via object-cover, cutting off the top and bottom of the portrait. The existing headshot.webp already has 3:4 data (896x1200), so this is purely a CSS container fix.
Output: Updated About page with larger, properly proportioned portrait.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/about/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update portrait container to 3:4 aspect ratio and larger size</name>
  <files>src/app/about/page.tsx</files>
  <action>
    In `src/app/about/page.tsx`, update the photo section container div (currently `w-48 h-48`):

    1. Replace the inner container classes from `w-48 h-48` to `w-48 aspect-[3/4] md:w-56 md:aspect-[3/4]`. This gives:
       - Mobile: 192px wide x 256px tall (3:4)
       - md+: 224px wide x ~299px tall (3:4)
       This is noticeably larger than the old 192x192 square and shows the full portrait.

    2. Remove the explicit `h-48` entirely -- aspect ratio handles the height.

    3. Keep all existing classes: `relative`, `border-[3px]`, `border-black`, `shadow-brutal`, `overflow-hidden`.

    4. On the Image component, keep `className="w-full h-full object-cover"` -- with the correct 3:4 container matching the 3:4 source image, object-cover will display the full image with no cropping.

    5. On the outer wrapper div (currently just `shrink-0`), add `self-center md:self-start` so on mobile (stacked layout) the photo centers horizontally, and on md+ it aligns to the top of the flex row.

    The resulting photo section should look like:
    ```tsx
    {/* Photo section */}
    <div className="shrink-0 self-center md:self-start">
      <div className="relative w-48 aspect-[3/4] md:w-56 border-[3px] border-black shadow-brutal overflow-hidden">
        <Image
          src="/images/headshot.webp"
          alt="Adam Keech"
          width={384}
          height={512}
          className="w-full h-full object-cover"
          priority
        />
      </div>
    </div>
    ```
  </action>
  <verify>
    Run `npm run build` to confirm no build errors. Visually confirm the container no longer has equal width/height (aspect ratio is 3:4, not 1:1).
  </verify>
  <done>
    Portrait photo container uses aspect-[3/4] instead of square dimensions. Photo is larger (w-48/w-56 responsive) and displays the full 3:4 portrait without cropping. Build passes cleanly.
  </done>
</task>

</tasks>

<verification>
- `npm run build` passes with no errors
- The photo container in page.tsx uses `aspect-[3/4]` (not `h-48`)
- The container width is `w-48 md:w-56` (larger than old fixed 192px square)
</verification>

<success_criteria>
Portrait photo on About page displays at 3:4 aspect ratio (taller than wide), is visually larger than the previous 192px square, and the page layout remains clean on both mobile and desktop.
</success_criteria>

<output>
After completion, create `.planning/quick/9-enlarge-portrait-photo-and-restore-3-4-a/9-SUMMARY.md`
</output>
