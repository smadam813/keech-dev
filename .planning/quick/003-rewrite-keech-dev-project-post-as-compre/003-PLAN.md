---
phase: quick-003
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - content/projects/keech-dev.mdx
autonomous: true

must_haves:
  truths:
    - "Project post reads like a senior engineer wrote it — specific technical decisions with rationale, not generic marketing copy"
    - "Post covers architecture decisions with WHY, not just WHAT"
    - "Post demonstrates engineering judgment through tradeoff analysis"
    - "Post is honest about scope (~1,400 LOC solo project) while showing depth of thought"
  artifacts:
    - path: "content/projects/keech-dev.mdx"
      provides: "Comprehensive portfolio project writeup"
      contains: "## Why I Built It"
  key_links: []
---

<objective>
Rewrite the keech.dev project post from a generic 3-paragraph placeholder into a comprehensive senior engineer portfolio piece that demonstrates technical depth, engineering judgment, and thoughtful decision-making.

Purpose: The current post is surface-level marketing copy. A portfolio project post should show HOW you think about engineering problems — the tradeoffs considered, the alternatives rejected, and the reasoning behind each choice. This is what hiring managers and senior engineers actually look for.

Output: A rewritten `content/projects/keech-dev.mdx` with the same frontmatter structure (updated stack list and description) and substantially expanded content.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@content/projects/keech-dev.mdx
@velite.config.ts
@src/app/globals.css
@src/components/layout/header.tsx
@src/components/ui/scroll-reveal.tsx
@src/components/blog/code-block.tsx
@src/components/blog/mdx-content.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite keech-dev.mdx as comprehensive portfolio piece</name>
  <files>content/projects/keech-dev.mdx</files>
  <action>
Rewrite `content/projects/keech-dev.mdx` entirely. Keep the same frontmatter keys but update:
- `description` to something more specific, e.g. "Neobrutalist portfolio built with Next.js 16, Tailwind v4 CSS-first theming, and Velite MDX — ~1,400 LOC with intentional design constraints"
- `stack` array expanded to: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Velite, MDX, Shiki, Vercel

The body should be structured with these sections (use ## headings):

**## Why I Built It** — Motivation beyond "I needed a portfolio." What gap existed? Why not use a template? What was the design vision (cosmic neobrutalist aesthetic — memorable enough that visitors remember the site, not just the content)? Keep it brief (2-3 paragraphs).

**## Architecture Decisions** — The interesting technical choices with reasoning:

1. **Tailwind v4 CSS-first @theme over JS config** — Design tokens live in `globals.css` inside a `@theme` block. No `tailwind.config.js`. Why: simpler mental model, tokens are CSS custom properties directly, no build-time config resolution. Tradeoff: newer approach with less ecosystem tooling, but the site's token set is small enough that this is a non-issue.

2. **Velite for content over raw MDX or a CMS** — Velite processes MDX files into type-safe collections at build time via a CLI prebuild step (`velite && next build`). Why the CLI pattern specifically: Turbopack doesn't support custom webpack plugins, so the Velite webpack plugin approach doesn't work. Running Velite as a separate prebuild step sidesteps this entirely. Tradeoff: two build steps, but the separation is actually cleaner.

3. **Single theme (no dark/light toggle)** — Deliberate constraint. The dusty pink + teal + black neobrutalist palette IS the brand. A dark mode toggle would require maintaining two visual identities, diluting both. This is a design decision, not a missing feature.

4. **React copy button over Shiki transformer** — rehype-pretty-code supports copy buttons via Shiki transformers that inject HTML at build time, but this creates SSR hydration complexity. Instead, a React `CodeBlock` component wraps `<pre>` elements and adds a `CopyButton` client component that reads `.textContent` from the DOM. Simpler, no hydration mismatch risk.

**## Solving iOS Safari's Scroll Lock** — This deserves its own section because it's a genuinely tricky problem. The mobile hamburger menu needs to lock background scroll. `overflow: hidden` on body works everywhere except iOS Safari, where the page still scrolls behind the overlay. The solution: `position: fixed` on body with the current scroll position stored, then restored on close. Also uses the `inert` attribute on `<main>` instead of a manual focus trap — better browser support, less code, and the browser handles focus correctly. Mention the specific pattern: save scrollY, apply fixed positioning, restore on cleanup.

**## Design System Approach** — How the neobrutalist system works in practice:
- Hard offset shadows (`4px 4px 0 0 #000`) as the signature visual element
- 3px solid black borders everywhere (cards, buttons, code blocks, images)
- Hover states that shift shadow to `2px 2px` with `translate(2px, 2px)` — creates a "press" effect
- Space Grotesk for headings (geometric, bold) + Inter for body (readable at length)
- `max-w-7xl` for listing pages vs `max-w-4xl` for detail pages — creates visual hierarchy between browsing and reading modes
- `github-dark-dimmed` syntax theme chosen specifically because its muted tones complement the cosmic palette rather than fighting it

**## Content Pipeline** — Brief section on how MDX flows through the system:
- MDX files in `content/` with Zod-validated frontmatter schemas
- Velite generates type-safe collections importable as `import { posts, projects } from '@/.velite'`
- rehype-pretty-code + Shiki handle syntax highlighting at build time
- MDX compiled code executed at runtime via `new Function()` with custom component overrides (CodeBlock for copy buttons)
- Table of contents auto-generated from heading structure via `s.toc()`

**## What I Learned** — Honest reflection (2-3 paragraphs). Topics to touch:
- Working with bleeding-edge versions (Next.js 16, Tailwind v4) means documentation is thin and community answers are sparse — you have to read source code
- Design constraints (single theme, limited palette) actually make decisions faster, not slower
- ~1,400 LOC for a fully polished site with animations, mobile nav, syntax highlighting, MDX content — scope discipline matters more than feature count
- The value of the `inert` attribute as a modern alternative to focus traps

**Writing style guidance:**
- First person, conversational but technical. Write like you're explaining to a peer engineer, not selling to a recruiter.
- Be specific: mention actual CSS values, actual file paths, actual library names and versions.
- Show tradeoffs considered, not just what was chosen. "I could have done X, but Y because Z" is the pattern.
- Avoid superlatives and marketing language ("cutting-edge", "revolutionary", "seamless"). Let the technical specifics speak.
- Keep it honest about scope — this is a ~1,400 LOC personal site, not a distributed system. The depth is in the decisions, not the scale.
- No bullet-point walls in the intro sections — use prose. Bullets are fine for the design system section where listing specific values.
- Total length: roughly 800-1200 words. Long enough to be substantive, short enough that someone will actually read it.
  </action>
  <verify>
1. Run `npm run velite` to confirm the MDX parses without errors
2. Run `npm run build` to confirm the full build succeeds
3. Verify the post renders correctly by checking the build output includes the project page
  </verify>
  <done>
- keech-dev.mdx contains a comprehensive project writeup with 6+ sections
- Frontmatter is valid (updated description and stack list)
- Build passes without errors
- Post demonstrates engineering judgment through specific technical decisions with rationale
- No generic/fluffy language — every claim is backed by a specific technical detail
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes successfully (Velite + Next.js)
- The project post at /projects/keech-dev renders with all sections
- Content reads as a senior engineer's portfolio piece, not a template placeholder
</verification>

<success_criteria>
The keech-dev project post is rewritten from a 3-paragraph placeholder into a comprehensive portfolio piece that covers motivation, architecture decisions with tradeoffs, a specific technical challenge (iOS Safari scroll lock), design system approach, content pipeline, and honest reflections. Build passes. No generic marketing copy remains.
</success_criteria>

<output>
After completion, create `.planning/quick/003-rewrite-keech-dev-project-post-as-compre/003-SUMMARY.md`
</output>
