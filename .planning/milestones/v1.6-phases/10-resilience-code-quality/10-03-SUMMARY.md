---
phase: 10-resilience-code-quality
plan: 03
subsystem: components-hooks
tags: [refactor, deduplication, filter-chip, use-filtered-list]
dependency_graph:
  requires: [10-02]
  provides: [FilterChip-component, useFilteredList-hook]
  affects: [filtered-post-list, filtered-project-list, post-card, blog-post-page, project-detail-page, project-card]
tech_stack:
  added: []
  patterns: [shared-hook-extraction, component-unification]
key_files:
  created:
    - src/components/ui/filter-chip.tsx
    - src/hooks/use-filtered-list.ts
  modified:
    - src/components/blog/filtered-post-list.tsx
    - src/components/projects/filtered-project-list.tsx
    - src/app/blog/[slug]/page.tsx
    - src/components/blog/post-card.tsx
    - src/app/projects/[slug]/page.tsx
    - src/components/projects/project-card.tsx
  deleted:
    - src/components/blog/tag-chip.tsx
    - src/components/projects/tech-badge.tsx
decisions:
  - Deleted TagChip/TechBadge instead of deprecating since zero remaining imports exist
metrics:
  duration: ~3min
  completed: "2026-04-03"
  tasks: 2
  files_created: 2
  files_modified: 6
  files_deleted: 2
---

# Phase 10 Plan 03: FilterChip Unification & useFilteredList Hook Extraction Summary

Unified TagChip and TechBadge into a single FilterChip component with toggle/link/display modes, and extracted duplicated AND-filtering logic from both list components into a shared useFilteredList hook -- eliminating ~220 lines of duplicated code across 8 files.

## What Was Done

### Task 1: Create FilterChip component and useFilteredList hook
- Created `src/components/ui/filter-chip.tsx` with three modes: toggle button (aria-pressed), link (Next.js Link), and display-only span
- Created `src/hooks/use-filtered-list.ts` extracting URL-synced AND-filtering, static counts, transition animation, and toggle/clear handlers into a generic parameterized hook
- **Commit:** 643602b

### Task 2: Replace TagChip/TechBadge and inline filter logic with shared implementations
- Refactored `filtered-post-list.tsx`: removed all inline filter logic (useSearchParams, useState, useCallback, useRef, updateURL, handleToggle, handleClear), replaced with single `useFilteredList()` call
- Refactored `filtered-project-list.tsx`: same deduplication, replaced with `useFilteredList()` call
- Migrated 5 consumer files from TagChip/TechBadge to FilterChip: filtered-post-list, filtered-project-list, blog post detail, post-card, project-card, project detail
- Deleted `tag-chip.tsx` and `tech-badge.tsx` (zero remaining imports confirmed via grep)
- Net reduction: ~220 lines of duplicated code removed
- **Commit:** 2763457

## Verification Results

- `npm run build` completes successfully
- `grep -r "import.*TagChip" src/` returns zero results
- `grep -r "import.*TechBadge" src/` returns zero results
- `grep -r "useSearchParams" src/components/blog/filtered-post-list.tsx src/components/projects/filtered-project-list.tsx` returns zero results
- `grep "useFilteredList" src/components/blog/filtered-post-list.tsx src/components/projects/filtered-project-list.tsx` matches in both files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Updated additional consumer files**
- **Found during:** Task 2
- **Issue:** Plan listed only 3 consumer files to update, but `post-card.tsx`, `project-card.tsx`, and `projects/[slug]/page.tsx` also imported TagChip/TechBadge
- **Fix:** Updated all 6 consumer files to use FilterChip, enabling clean deletion of deprecated files
- **Files modified:** src/components/blog/post-card.tsx, src/components/projects/project-card.tsx, src/app/projects/[slug]/page.tsx

**2. [Rule 1 - Bug] Deleted deprecated files instead of adding comments**
- **Found during:** Task 2
- **Issue:** Plan suggested adding deprecation comments, but since zero imports remained, keeping dead files is unnecessary
- **Fix:** Deleted both files outright -- cleaner codebase, no dead code

## Known Stubs

None.

## Self-Check: PASSED
