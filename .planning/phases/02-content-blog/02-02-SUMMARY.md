---
phase: 02-content-blog
plan: 02
subsystem: ui
tags: [mdx, blog, react, tailwind, neobrutalist]

# Dependency graph
requires:
  - phase: 02-01
    provides: Velite MDX content engine with Post schema and syntax highlighting
provides:
  - Blog listing page with filterable, sorted posts
  - Individual post pages with MDX rendering
  - Table of contents sidebar for navigation
  - Neobrutalist UI components (PostCard, TagChip, TableOfContents)
  - Prose typography system for long-form reading
  - Copy button on code blocks with click-to-copy
affects: [02-03, 02-04, projects]

# Tech tracking
tech-stack:
  added: []
  patterns: [react-mdx-runtime, recursive-toc-components, code-block-wrappers]

key-files:
  created:
    - src/components/blog/mdx-content.tsx
    - src/components/blog/post-card.tsx
    - src/components/blog/toc.tsx
    - src/components/blog/tag-chip.tsx
    - src/components/blog/code-block.tsx
    - src/components/blog/copy-button.tsx
    - src/app/blog/[slug]/page.tsx
  modified:
    - src/app/blog/page.tsx
    - src/app/globals.css
    - velite.config.ts

key-decisions:
  - "React component for copy button instead of shiki transformer (simpler, more control)"
  - "Retrieve code text on click from pre element (fixes SSR hydration issues)"
  - "Prose class with 65ch max-width for optimal reading"
  - "Sticky TOC sidebar on desktop only, hidden on mobile"

patterns-established:
  - "CodeBlock wrapper: wraps pre elements with copy button overlay"
  - "MDXContent components prop: pass custom components for MDX rendering"
  - "Recursive TOC: TocList recursively renders nested headings"

# Metrics
duration: 12min
completed: 2026-02-01
---

# Phase 02 Plan 02: Blog UI Components Summary

**Complete blog reading experience with neobrutalist cards, MDX rendering, table of contents, and code block copy buttons**

## Performance

- **Duration:** 12 min (including post-checkpoint fixes)
- **Started:** 2026-02-01
- **Completed:** 2026-02-01
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Blog listing page at /blog showing all non-draft posts sorted by date
- Individual post pages with full MDX rendering and metadata display
- Table of contents sidebar for desktop navigation
- Neobrutalist PostCard and TagChip components with hover effects
- Prose typography system (65ch width, 1.7 line-height, 18px base)
- Code block copy button with visual feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create blog UI components** - `009a903` (feat)
2. **Task 2: Build blog listing and post pages** - `0adcf1d` (feat)
3. **Task 3: Verify blog experience** - human checkpoint (approved)

**Post-checkpoint fixes by orchestrator:**
- `6b80be3` (fix) - Replace transformerCopyButton with React component
- `a7a8c20` (fix) - Copy button now retrieves text on click

## Files Created/Modified

- `src/components/blog/mdx-content.tsx` - Client-side MDX renderer using react/jsx-runtime
- `src/components/blog/post-card.tsx` - Neobrutalist card for blog listing
- `src/components/blog/toc.tsx` - Sticky table of contents with recursive nesting
- `src/components/blog/tag-chip.tsx` - Neobrutalist tag chip component
- `src/components/blog/code-block.tsx` - Wrapper adding copy button to code blocks
- `src/components/blog/copy-button.tsx` - Copy-to-clipboard with visual feedback
- `src/app/blog/page.tsx` - Blog listing page with post grid
- `src/app/blog/[slug]/page.tsx` - Individual post page with TOC sidebar
- `src/app/globals.css` - Prose typography and code block styles
- `velite.config.ts` - Removed transformerCopyButton (now handled by React)

## Decisions Made

- **React copy button over shiki transformer:** The transformerCopyButton approach from shiki had SSR issues. Replaced with a React CopyButton component that queries the DOM on click, avoiding hydration mismatches.
- **Click-time text retrieval:** Instead of passing code text as props (SSR issues), the copy button finds the parent pre element and extracts textContent on click.
- **65ch prose width:** Standard for comfortable long-form reading, slightly narrower than viewport on desktop.
- **Mobile TOC hidden:** Table of contents is only useful on desktop where sidebar space exists.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Copy button SSR hydration mismatch**
- **Found during:** Post-Task 3 verification
- **Issue:** transformerCopyButton embedded dynamic content causing React hydration warnings
- **Fix:** Replaced with React CopyButton component, removed shiki transformer
- **Files modified:** velite.config.ts, src/components/blog/mdx-content.tsx, src/components/blog/copy-button.tsx, src/components/blog/code-block.tsx
- **Verification:** Copy button works, no console errors
- **Committed in:** 6b80be3

**2. [Rule 1 - Bug] Copy button text extraction failed**
- **Found during:** Post-fix verification
- **Issue:** Pre-extracting textContent in SSR returned empty string
- **Fix:** Changed to extract text on click event from DOM
- **Files modified:** src/components/blog/code-block.tsx, src/components/blog/copy-button.tsx
- **Verification:** Copy button correctly copies code content
- **Committed in:** a7a8c20

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Bug fixes necessary for correct functionality. No scope creep.

## Issues Encountered

- The shiki transformerCopyButton plugin added interactive elements during SSR that caused React hydration mismatches. Resolved by implementing a pure React solution that only accesses DOM on user interaction.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Blog system complete and functional
- Ready for 02-03 (About page and bio) or 02-04 (RSS feed)
- Content can be added by creating new .mdx files in content/posts/

---
*Phase: 02-content-blog*
*Completed: 2026-02-01*
