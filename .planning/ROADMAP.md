# Roadmap: keech.dev

## Milestones

- **v1.0 MVP** - Phases 1-4 (shipped 2026-02-03)
- **v1.1 Polish & Consistency** - Phases 5-6 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-02-03</summary>

Delivered neobrutalist portfolio site with MDX blog, project showcase, scroll animations, and SEO. 14 plans across 4 phases. See MILESTONES.md for details.

</details>

### v1.1 Polish & Consistency (In Progress)

**Milestone Goal:** Refine the mobile experience and normalize visual consistency across all pages.

## Overview

v1.1 replaces the bottom-pinned mobile navigation with a hamburger menu in the header, fixes iOS Safari viewport conflicts, and normalizes layout consistency across all pages. Two phases: first overhaul navigation (the critical path that eliminates iOS bugs), then normalize layouts once the final nav architecture is stable.

**Phase Numbering:**
- Integer phases (5, 6): Planned milestone work
- Decimal phases (5.1, 5.2): Urgent insertions if needed (marked with INSERTED)

- [x] **Phase 5: Navigation Overhaul** - Replace bottom nav with hamburger menu and fix iOS viewport
- [ ] **Phase 6: Layout Consistency** - Normalize containers, spacing, and semantic HTML across all pages

## Phase Details

### Phase 5: Navigation Overhaul
**Goal**: Mobile users navigate the site through a hamburger menu in the header that works reliably on all devices including iOS Safari
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: NAV-04, NAV-05, NAV-06, NAV-07, NAV-08, NAV-09, NAV-10, VIEW-01, VIEW-02, VIEW-03, ABUT-04
**Success Criteria** (what must be TRUE):
  1. On mobile, a hamburger icon appears in the header; tapping it opens a full-screen overlay with navigation links, and tapping a link navigates to that page and closes the menu
  2. The background page does not scroll while the menu is open, on both iOS Safari and Android Chrome
  3. The currently active page is visually distinguished in the mobile menu, and the hamburger icon animates to an X when the menu is open
  4. When the menu is open, keyboard focus is trapped within it (Tab does not escape to background content) and Escape closes the menu
  5. On iPhone with notch/Dynamic Island, the footer sits at the natural page bottom with correct safe-area spacing and no excess padding gap from the removed bottom nav
**Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md -- Build unified responsive header with hamburger menu, scroll lock, focus management; update layout with viewport export; delete MobileNav
- [x] 05-02-PLAN.md -- Fix footer safe-area padding, remove About page social buttons, visual verification checkpoint

### Phase 6: Layout Consistency
**Goal**: Every page on the site uses consistent container widths, vertical spacing, and correct semantic HTML
**Depends on**: Phase 5
**Requirements**: LYOT-01, LYOT-02, LYOT-03, LYOT-04
**Success Criteria** (what must be TRUE):
  1. All listing pages (Blog, Projects) use the same max-width, and all detail/reading pages (post, project, about) use the same max-width, with no visible content-width jumps when navigating between pages of the same type
  2. Vertical padding above and below content is uniform across all pages (no page has noticeably more or less whitespace than others)
  3. Viewing page source shows exactly one `<main>` element in the DOM on every page (no nested main tags)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v1.0 | 14/14 | Complete | 2026-02-03 |
| 5. Navigation Overhaul | v1.1 | 2/2 | Complete | 2026-02-07 |
| 6. Layout Consistency | v1.1 | 0/? | Not started | - |
