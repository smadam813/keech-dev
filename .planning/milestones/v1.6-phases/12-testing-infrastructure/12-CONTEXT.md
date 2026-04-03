# Phase 12: Testing Infrastructure - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The codebase gets automated test coverage over critical pure functions and browser-dependent behaviors, plus a mobile-accessible table of contents for blog posts. This phase delivers: Vitest configured with path aliases and jsdom, unit tests for date formatting / view count helpers / rune glow position calculations, Playwright configured for E2E testing, E2E tests for mobile menu toggle / code block copy button / view count increment, and a collapsible mobile TOC component.

Requirements covered: A11Y-03, TEST-01, TEST-02, TEST-03, TEST-04.

</domain>

<decisions>
## Implementation Decisions

### Mobile TOC Design
- **D-01:** Mobile TOC presented as an expandable accordion at the top of blog post content — positioned between the back-navigation link and the post body. Simple, no z-index/positioning complexity.
- **D-02:** Appears on screens below `lg` breakpoint (< 1024px) where the existing sidebar TOC is hidden. Desktop sidebar TOC remains unchanged.
- **D-03:** Collapsed by default — user taps to expand. Does not push content down on initial page load.
- **D-04:** Neobrutalist styling — bold border (`border-[3px] border-foreground`), hard shadow (`shadow-brutal`), teal accent on the toggle button. Consistent with site identity.

### Vitest Configuration
- **D-05:** Test files co-located with source files (e.g., `src/lib/format.test.ts` next to `src/lib/format.ts`). Easier to find and maintain.
- **D-06:** `vitest.config.ts` at project root with `resolve.alias` mirroring tsconfig path aliases (`@/*` → `./src/*`, `@/.velite` → `./.velite`).
- **D-07:** jsdom environment for tests that touch DOM APIs. Default `node` environment for pure function tests.

### Playwright Configuration
- **D-08:** Chromium only — sufficient for a personal portfolio, fastest execution.
- **D-09:** Tests run against built app (`next build` + `next start`) — tests the production artifact, not dev mode.
- **D-10:** E2E test files in `e2e/` directory at project root (Playwright convention).

### Test Scope
- **D-11:** Unit tests target only the required functions: `formatDate()` in `src/lib/format.ts`, view count helpers in `src/lib/views.ts`, and `computeGlowPositions()` in `src/lib/rune-glows.ts`. No gold-plating.
- **D-12:** E2E tests target only the required behaviors: mobile menu toggle, code block copy button, and view count increment. Scoped to what the success criteria demand.
- **D-13:** Add `test` and `test:e2e` scripts to `package.json`.

### Claude's Discretion
Claude has flexibility on: exact Vitest/Playwright config options, test assertion style, mobile TOC animation (CSS transition vs. instant toggle), TOC toggle button text/icon, and whether to add React Testing Library for the mobile TOC component test or cover it via E2E only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Testing Analysis
- `.planning/codebase/TESTING.md` — Comprehensive analysis of current QA strategy, test candidates, example patterns, and what is/isn't validated. Essential reading for test implementation.

### Test Target Files (Unit)
- `src/lib/format.ts` — `formatDate()` utility extracted in Phase 10.
- `src/lib/views.ts` — View count helpers (formatViewCount, localStorage cache helpers).
- `src/lib/rune-glows.ts` — `computeGlowPositions()` math with container dimension inputs.

### Test Target Files (E2E)
- `src/components/layout/header.tsx` — Mobile menu toggle, keyboard events, scroll lock, focus management.
- `src/components/blog/copy-button.tsx` — Clipboard API, copied state toggle.
- `src/components/blog/view-counter.tsx` — Fetch-based view count increment with localStorage cache.
- `src/app/api/views/[slug]/route.ts` — POST handler that E2E test will hit.

### Mobile TOC Reference
- `src/components/blog/toc.tsx` — Existing server-side TOC component with `TocEntry` type and `TocList` sub-component. Mobile TOC should reuse the same heading data structure.
- `src/app/blog/[slug]/page.tsx` — Blog post page where mobile TOC will be integrated.

### Coding Conventions
- `.planning/codebase/CONVENTIONS.md` — File naming (kebab-case), component patterns (named exports), import order, Tailwind usage, accessibility patterns. All new code must follow these.

### Codebase Structure
- `.planning/codebase/STRUCTURE.md` — Directory layout, component organization by feature area.

### Requirements
- `.planning/REQUIREMENTS.md` — A11Y-03, TEST-01 through TEST-04 acceptance criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/blog/toc.tsx` — Existing `TocEntry` type and `TocList` component for rendering heading hierarchies. Mobile TOC should reuse heading data, not re-parse.
- `src/lib/utils.ts` — `cn()` for class composition in mobile TOC component.
- `src/app/globals.css` — Neobrutalist tokens for mobile TOC styling.
- `src/hooks/` — Established hooks directory from Phase 10 for any new hooks.

### Established Patterns
- Client components marked with `'use client'` only when browser APIs needed — mobile TOC needs toggle state so it will be a client component.
- Kebab-case file naming: new files should be `mobile-toc.tsx`, `format.test.ts`, etc.
- Named exports for components, default exports only for page components.
- Accessibility: `aria-expanded` on toggle buttons, `aria-controls` linking toggle to content panel.

### Integration Points
- `vitest.config.ts` — New file at project root.
- `playwright.config.ts` — New file at project root.
- `e2e/` — New directory for Playwright test files.
- `src/components/blog/mobile-toc.tsx` — New client component for collapsible mobile TOC.
- `src/app/blog/[slug]/page.tsx` — Add mobile TOC component above post content, visible below `lg` breakpoint.
- `package.json` — Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test` as dev dependencies. Add `test` and `test:e2e` scripts.

</code_context>

<specifics>
## Specific Ideas

- Mobile TOC should feel native to the neobrutalist design — not a generic collapsible, but a styled accordion that matches the site's bold borders and hard shadows.
- The existing `TocList` component renders the heading hierarchy — the mobile version wraps this in a collapsible container, not a reimplementation.
- Unit tests should be practical and focused — test edge cases that matter (empty inputs, zero counts, unusual container dimensions), not every permutation.

</specifics>

<deferred>
## Deferred Ideas

- ESLint migration (noted in Phase 10 deferred) — Next.js 16.2.2 removed `next lint` CLI. Belongs in a cleanup task, not testing phase.
- CI/CD pipeline (GitHub Actions for running tests on push) — separate concern, no CI exists today.
- Visual regression testing — explicitly out of scope per REQUIREMENTS.md.

</deferred>

---

*Phase: 12-testing-infrastructure*
*Context gathered: 2026-04-03*
