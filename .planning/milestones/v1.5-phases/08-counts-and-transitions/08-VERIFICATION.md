---
phase: 08-counts-and-transitions
verified: 2026-03-01T19:30:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 8: Counts and Transitions Verification Report

**Phase Goal:** Users get quantitative feedback on filter state and smooth visual transitions when filtering changes the visible content
**Verified:** 2026-03-01T19:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                     | Status     | Evidence                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Each tag chip on the blog filter bar shows a count badge indicating how many posts match that tag         | VERIFIED | `tagCounts` computed in `filtered-post-list.tsx` L47-53; passed as `counts={tagCounts}` to FilterBar L113; threaded via `renderChip` L114-116 to `TagChip count={count}`; TagChip renders `<span className="ml-1 opacity-60">({count})</span>` in toggle mode L33-35 |
| 2   | Each stack chip on the projects filter bar shows a count badge indicating how many projects match         | VERIFIED | `stackCounts` computed in `filtered-project-list.tsx` L45-51; passed as `counts={stackCounts}` L107; threaded via `renderChip` L108-110 to `TechBadge count={count}`; TechBadge renders same parenthetical span L31-33 |
| 3   | User sees "Showing X of Y posts" between the filter bar and grid when blog filters are active             | VERIFIED | `filtered-post-list.tsx` L119-123: `{isFiltering && <p className="text-sm font-mono text-muted mb-4">Showing {filteredPosts.length} of {posts.length} posts</p>}` |
| 4   | User sees "Showing X of Y projects" between the filter bar and grid when project filters are active       | VERIFIED | `filtered-project-list.tsx` L113-116: identical pattern with `filteredProjects.length` and `projects.length` |
| 5   | Posts and projects fade in/out smoothly when filters change (CSS opacity transition)                      | VERIFIED | Grid div uses `cn('grid gap-6...', 'transition-opacity duration-200 filter-grid-fade', isTransitioning ? 'opacity-0' : 'opacity-100')`; `isTransitioning` driven by `useEffect` on `filteredKey` changes (L61-72 blog, L57-66 projects) |
| 6   | Fade transition is skipped when prefers-reduced-motion is enabled                                         | VERIFIED | `globals.css` L221-223: `.filter-grid-fade { transition: none !important; }` inside `@media (prefers-reduced-motion: reduce)` block |
| 7   | TagChip and TechBadge display correctly without counts on detail pages (no regression)                    | VERIFIED | `src/app/blog/[slug]/page.tsx` L109: `<TagChip key={tag} tag={tag} />` — no `count` prop; `src/app/projects/[slug]/page.tsx` L74: `<TechBadge key={tech} tech={tech} />` — no `count` prop. Count prop is optional (`count?: number`) so display-only mode is unaffected |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                                               | Expected                                              | Status   | Details                                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `src/components/blog/tag-chip.tsx`                     | TagChip with optional count prop                      | VERIFIED | `count?: number` in interface L9; destructured L13; rendered in toggle mode only L33-35                      |
| `src/components/projects/tech-badge.tsx`               | TechBadge with optional count prop                    | VERIFIED | `count?: number` in interface L7; destructured L11; rendered in toggle mode only L31-33                      |
| `src/components/ui/filter-bar.tsx`                     | FilterBar with count threading via renderChip         | VERIFIED | `counts?: Record<string, number>` L11; `renderChip` callback includes `count?: number` L10; passes `count: counts?.[item]` L34 |
| `src/components/blog/filtered-post-list.tsx`           | Count computation, result count display, grid fade    | VERIFIED | `tagCounts` useMemo L47-53; result count JSX L119-123; grid fade with `isTransitioning` L124-139; `useRef` initial-render guard L56 |
| `src/components/projects/filtered-project-list.tsx`    | Count computation, result count display, grid fade    | VERIFIED | `stackCounts` useMemo L45-51; result count JSX L113-116; grid fade L119-133; `useRef` guard L54              |
| `src/app/globals.css`                                  | Reduced-motion rule for filter-grid-fade              | VERIFIED | `.filter-grid-fade { transition: none !important; }` at L221-223 inside `@media (prefers-reduced-motion: reduce)` block |

### Key Link Verification

| From                                     | To                                      | Via                                         | Status   | Details                                                                                 |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `filtered-post-list.tsx`                 | `filter-bar.tsx`                        | `counts={tagCounts}` prop on FilterBar      | WIRED    | L113: `counts={tagCounts}` — exact pattern from PLAN                                    |
| `filter-bar.tsx`                         | `tag-chip.tsx`                          | renderChip callback passes count            | WIRED    | `filter-bar.tsx` L34: `count: counts?.[item]`; `filtered-post-list.tsx` L114-116 destructures `count` and passes to `TagChip count={count}` |
| `filtered-project-list.tsx`              | `filter-bar.tsx`                        | `counts={stackCounts}` prop on FilterBar    | WIRED    | L107: `counts={stackCounts}` — exact pattern from PLAN                                  |
| `globals.css` `.filter-grid-fade`        | `filtered-post-list.tsx` grid container | `filter-grid-fade` class for reduced-motion | WIRED    | Grid div L127 includes `filter-grid-fade` class; CSS rule at L221-223 targets it        |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                | Status    | Evidence                                                                                          |
| ----------- | ----------- | ------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| BLOG-03     | 08-01       | User can see count badges on each tag chip showing how many posts match that tag            | SATISFIED | `tagCounts` useMemo + FilterBar threading + TagChip render — full chain verified                  |
| BLOG-04     | 08-01       | User can see posts fade in/out smoothly when filters change (CSS opacity, reduced-motion)   | SATISFIED | `isTransitioning` state + `transition-opacity duration-200` on grid + `filter-grid-fade` CSS rule |
| PROJ-03     | 08-01       | User can see count badges on each stack chip showing how many projects match that stack item | SATISFIED | `stackCounts` useMemo + FilterBar threading + TechBadge render — full chain verified              |
| UX-04       | 08-01       | User sees a result count ("Showing 2 of 3 posts") when filters are active                  | SATISFIED | `{isFiltering && <p>Showing X of Y posts/projects</p>}` in both list components                   |

**Orphaned requirements check:** REQUIREMENTS.md traceability table maps BLOG-03, BLOG-04, PROJ-03, UX-04 to Phase 8. All four appear in the PLAN frontmatter `requirements` field. No orphaned requirements.

### Anti-Patterns Found

None. Grep across all 6 modified files returned no TODO, FIXME, placeholder comments, empty return values, or stub implementations.

### Human Verification Required

The following behaviors are correct in code but require a running browser to visually confirm:

#### 1. Count badge visual appearance

**Test:** Open `/blog` — inspect any tag chip in the filter bar.
**Expected:** Count appears inline after the tag label, e.g., "ai (2)", in a slightly dimmed parenthetical style.
**Why human:** Visual rendering of `opacity-60` parenthetical text requires browser confirmation.

#### 2. Grid fade timing feel

**Test:** On `/blog`, click a tag chip to activate a filter.
**Expected:** The grid fades out briefly (approximately 150ms) then fades back in with the filtered results. The transition should feel smooth, not jarring.
**Why human:** 150ms setTimeout + 200ms CSS transition interaction requires visual assessment.

#### 3. Reduced-motion behavior

**Test:** In browser DevTools, enable "Emulate CSS media feature prefers-reduced-motion" with `reduce`. Activate a filter on `/blog`.
**Expected:** Grid content changes instantly with no opacity transition.
**Why human:** CSS `transition: none !important` override requires browser confirmation.

#### 4. Initial render no-flash

**Test:** Navigate directly to `/blog?tags=ai` (URL with pre-loaded filter).
**Expected:** Page loads with filtered content already visible — no flash of invisible-content (no brief opacity-0 state on load).
**Why human:** The `isInitialRender` useRef guard prevents the fade on mount; requires browser confirmation that no FOIC occurs.

### Gaps Summary

No gaps found. All 7 observable truths are verified against the actual codebase. All 4 required artifacts exist with substantive implementations (not stubs). All 4 key links are confirmed wired. All 4 requirement IDs (BLOG-03, BLOG-04, PROJ-03, UX-04) are satisfied with evidence.

The two task commits (`f837a45` and `eacfb9d`) are both present in git history and match the file changes documented in SUMMARY.md. TypeScript compiled without errors (`tsc --noEmit` returned no output). No anti-patterns detected in any modified file.

---

_Verified: 2026-03-01T19:30:00Z_
_Verifier: Claude (gsd-verifier)_
