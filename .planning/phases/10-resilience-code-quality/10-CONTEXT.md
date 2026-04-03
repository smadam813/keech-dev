# Phase 10: Resilience & Code Quality - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Catch runtime errors gracefully at every route level and consolidate duplicated code into shared utilities and hooks. This phase delivers: global and route-specific error boundaries, loading state skeletons, localStorage cache helper consolidation, date formatting extraction, shared filtering hook, TagChip/TechBadge unification, Hero component refactoring, and two accessibility fixes (keyboard-visible copy button, VoiceOver list role).

Requirements covered: ERR-01, ERR-02, ERR-03, ERR-04, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, A11Y-01, A11Y-02.

</domain>

<decisions>
## Implementation Decisions

### Error Boundary Styling
- **D-01:** Error boundaries use neobrutalist branded styling — consistent with Phase 9's MDX fallback (bold borders, hard shadows, dusty rose/teal palette). Not generic React error pages.
- **D-02:** Global error boundary (`error.tsx`) shows branded message with navigation back to home. Blog error boundary (`blog/[slug]/error.tsx`) shows MDX-specific message with link back to /blog.
- **D-03:** `global-error.tsx` provides a full HTML shell (html + body tags) since it catches root layout errors — same neobrutalist styling but self-contained.
- **D-04:** Error logging uses `console.error('[route-segment]', error)` prefix pattern — consistent with `[views]` and `[mdx]` prefixes from Phase 9.

### Loading State Skeletons
- **D-05:** Loading skeletons target key content areas only (post grid, project grid, blog post content) — not full-page skeletons. The site is primarily statically generated, so loading states are brief.
- **D-06:** Skeleton styling uses neobrutalist design tokens — `border-foreground`, `bg-surface`, animated pulse. No third-party skeleton library.

### Code Deduplication
- **D-07:** `useFilteredList` hook extracted as a typed generic hook — both `FilteredPostList` and `FilteredProjectList` share the same filter logic with different item types.
- **D-08:** `formatDate()` extracted to `src/lib/format.ts` (or similar utility file) — replaces inline `toLocaleDateString` calls in post-card.tsx and blog/[slug]/page.tsx.
- **D-09:** localStorage view cache helpers consolidated in `src/lib/views.ts` — both `listing-view-counts.tsx` and `view-counter.tsx` use the same read-through cache pattern. Extract shared get/set helpers.
- **D-10:** TagChip and TechBadge unified into a single `FilterChip` component with a `variant` prop for visual differences (tag color vs stack color). Both currently have toggle-mode behavior with active/inactive states.

### Hero Component Refactoring
- **D-11:** Animation orchestration (reveal sequence timing, reduced-motion checks) extracted to `useHeroAnimation` hook.
- **D-12:** Glow positioning logic (`computeGlowPositions`, resize handling) extracted to `useGlowPositions` hook.
- **D-13:** Hero component remains a single file but delegates complex logic to hooks — not split into sub-components.

### Accessibility Fixes
- **D-14:** Code block copy button gets `focus-visible:opacity-100` class — keyboard users can see the button when they Tab to it. Currently only visible on hover.
- **D-15:** MDX list elements get `role="list"` attribute — Safari VoiceOver strips list semantics when `list-style: none` is applied. Add via MDX component override for `ul` and `ol`.

### Claude's Discretion
Claude has flexibility on: exact skeleton dimensions and animation timing, `useFilteredList` generic type constraints, hook internal API design, and `FilterChip` variant naming. These are implementation details best decided during planning with full codebase context.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Error Handling Concerns
- `.planning/codebase/CONCERNS.md` — "No Error Boundaries" section details the exact gap and fix approach. Also covers missing loading states.

### Code Quality Concerns
- `.planning/codebase/CONCERNS.md` — Moderate severity sections on duplicated localStorage helpers, date formatting, filtered list logic, and TagChip/TechBadge overlap.

### Component Architecture
- `.planning/codebase/ARCHITECTURE.md` — Component model, client vs server component decisions, existing patterns.
- `.planning/codebase/CONVENTIONS.md` — Coding conventions, import patterns, naming.

### Prior Phase Context
- `.planning/phases/09-security-patches/09-CONTEXT.md` — Phase 9 decisions on branded fallback styling, error logging patterns (carry forward to error boundaries).

### Existing Code (Key Files)
- `src/components/blog/mdx-content.tsx` — Phase 9 added try-catch with `MDXFallback` — error boundary pattern to follow.
- `src/components/blog/filtered-post-list.tsx` — Current filtering implementation (deduplicate with project list).
- `src/components/projects/filtered-project-list.tsx` — Mirror of blog filtering (deduplicate).
- `src/components/blog/tag-chip.tsx` — Tag toggle chip (unify with TechBadge).
- `src/components/projects/tech-badge.tsx` — Stack toggle badge (unify with TagChip).
- `src/components/blog/listing-view-counts.tsx` — localStorage cache usage (consolidate).
- `src/components/blog/view-counter.tsx` — localStorage cache usage (consolidate).
- `src/components/blog/code-block.tsx` — Copy button needs `focus-visible:opacity-100`.
- `src/components/hero/hero.tsx` — Animation orchestration + glow positioning to extract.
- `src/lib/views.ts` — Existing view helpers (extend with localStorage cache).
- `src/lib/rune-glows.ts` — `computeGlowPositions()` (referenced by Hero hook extraction).

### Requirements
- `.planning/REQUIREMENTS.md` — ERR-01 through ERR-04, QUAL-01 through QUAL-05, A11Y-01, A11Y-02 acceptance criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/utils.ts` — `cn()` utility for combining Tailwind classes. Use in all new components.
- `src/app/globals.css` — Neobrutalist design tokens (`--shadow-brutal`, `--border-brutal`, color vars). Use in error boundaries.
- `src/components/blog/mdx-content.tsx` — `MDXFallback` component pattern from Phase 9 — follow same styled fallback approach for error boundaries.
- `src/lib/views.ts` — Already exists with view count helpers. Extend with localStorage cache helpers.

### Established Patterns
- Client components use `'use client'` directive only where needed — error.tsx requires it (Next.js constraint).
- No hooks directory exists — create `src/hooks/` for new custom hooks.
- Tailwind classes use `cn()` for composition — maintain this pattern.
- API error logging uses `console.error('[prefix]', error)` — extend to error boundaries.

### Integration Points
- `src/app/error.tsx` — New file, global error boundary
- `src/app/global-error.tsx` — New file, root layout error boundary
- `src/app/blog/[slug]/error.tsx` — New file, blog-specific error boundary
- `src/app/loading.tsx` — New file, global loading skeleton
- `src/app/blog/loading.tsx` — New file, blog listing loading skeleton
- `src/hooks/useFilteredList.ts` — New file, shared filtering hook
- `src/hooks/useHeroAnimation.ts` — New file, animation orchestration hook
- `src/hooks/useGlowPositions.ts` — New file, glow positioning hook
- `src/lib/format.ts` — New file, date formatting utility

</code_context>

<specifics>
## Specific Ideas

- Error boundaries should match the MDX fallback styling from Phase 9 — bold borders, hard shadows, "Back to [safe page]" escape link. The user sees a branded page, not a blank screen.
- The `FilterChip` unification should preserve the visual distinction between blog tags and project stacks — color/styling variants, not identical appearance.
- Hero hook extraction should keep the Hero component readable — the hooks handle complexity, the component handles composition.

</specifics>

<deferred>
## Deferred Ideas

- ESLint migration needed after Next.js 16.2.2 removed `next lint` CLI — noted in Phase 9 execution, belongs in a cleanup task or Phase 12.

</deferred>

---

*Phase: 10-resilience-code-quality*
*Context gathered: 2026-04-03*
