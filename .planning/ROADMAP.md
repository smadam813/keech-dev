# Roadmap: keech.dev

## Milestones

- ✅ **v1.3 Hero Polish** — Phases 1-2 (shipped 2026-02-09)
- ✅ **v1.4 Blog Stats** — Phases 3-5 (shipped 2026-02-22)
- 🚧 **v1.5 Tag Filtering** — Phases 6-8 (in progress)

## Phases

<details>
<summary>✅ v1.3 Hero Polish (Phases 1-2) — SHIPPED 2026-02-09</summary>

- [x] Phase 1: Animation Sync & Reveal (1/1 plans) — completed 2026-02-08
- [x] Phase 2: Rune Glow Effects (1/1 plans) — completed 2026-02-08

See: `.planning/milestones/v1.3-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.4 Blog Stats (Phases 3-5) — SHIPPED 2026-02-22</summary>

- [x] Phase 3: Infrastructure & API (2/2 plans) — completed 2026-02-21
- [x] Phase 4: Post Page Integration (2/2 plans) — completed 2026-02-22
- [x] Phase 5: Listing & Polish (2/2 plans) — completed 2026-02-22

See: `.planning/milestones/v1.4-ROADMAP.md` for full details.

</details>

### 🚧 v1.5 Tag Filtering (In Progress)

**Milestone Goal:** Add multi-select filtering to blog and project listing pages using existing tags and stack data, enabling users to narrow content by selecting multiple filter chips with AND logic.

- [ ] **Phase 6: Filter Components** — Interactive chip variants and reusable filter bar UI
- [ ] **Phase 7: Filtered Listing Integration** — Wire filter state to blog and project pages with AND logic, URL persistence, and empty states
- [ ] **Phase 8: Counts and Transitions** — Count badges on chips, result count display, and fade transitions on filter changes

## Phase Details

### Phase 6: Filter Components
**Goal**: Users can interact with tag and stack chips as toggle buttons with clear active/inactive states and satisfying press feedback
**Depends on**: Phase 5 (v1.4 complete)
**Requirements**: UX-01, UX-05
**Success Criteria** (what must be TRUE):
  1. TagChip and TechBadge render as `<button>` elements with `aria-pressed` when used as filter toggles, and as their original element types when used elsewhere (no regression on post detail pages)
  2. User can visually distinguish active (selected) chips from inactive chips at a glance — filled accent background vs outlined
  3. Chips depress on click with neobrutalist animation (translate + shadow reduction) matching the site's visual identity
  4. A reusable filter bar component renders a row of interactive chips with a "Clear all" button that only appears when at least one chip is selected
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Filtered Listing Integration
**Goal**: Users can filter blog posts by tags and projects by stack on the listing pages, with selections reflected in the URL for sharing
**Depends on**: Phase 6
**Requirements**: BLOG-01, BLOG-02, PROJ-01, PROJ-02, UX-02, UX-03, UX-06
**Success Criteria** (what must be TRUE):
  1. Blog listing page shows a filter bar with all unique tags above the post grid, and toggling tags filters posts using AND logic (only posts with ALL selected tags appear)
  2. Projects listing page shows a filter bar with all unique stack items above the project grid, and toggling stack items filters projects using AND logic
  3. User sees an empty state message with a "clear filters" action when no items match the selected combination
  4. User can click "Clear filters" to reset all selections, restoring the full unfiltered list
  5. Selected filters persist in the URL as search params (e.g., `?tags=ai,agile`) so filtered views can be shared or bookmarked
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Counts and Transitions
**Goal**: Users get quantitative feedback on filter state and smooth visual transitions when filtering changes the visible content
**Depends on**: Phase 7
**Requirements**: BLOG-03, BLOG-04, PROJ-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Each tag chip on the blog filter bar shows a count badge indicating how many posts match that tag
  2. Each stack chip on the projects filter bar shows a count badge indicating how many projects match that stack item
  3. User sees a result count ("Showing X of Y posts/projects") between the filter bar and the grid when filters are active
  4. Posts and projects fade in/out smoothly when filters change (CSS opacity transition, respects prefers-reduced-motion)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Animation Sync & Reveal | v1.3 | 1/1 | Complete | 2026-02-08 |
| 2. Rune Glow Effects | v1.3 | 1/1 | Complete | 2026-02-08 |
| 3. Infrastructure & API | v1.4 | 2/2 | Complete | 2026-02-21 |
| 4. Post Page Integration | v1.4 | 2/2 | Complete | 2026-02-22 |
| 5. Listing & Polish | v1.4 | 2/2 | Complete | 2026-02-22 |
| 6. Filter Components | v1.5 | 0/0 | Not started | - |
| 7. Filtered Listing Integration | v1.5 | 0/0 | Not started | - |
| 8. Counts and Transitions | v1.5 | 0/0 | Not started | - |
