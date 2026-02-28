---
phase: 07-filtered-listing-integration
plan: 01
subsystem: ui
tags: [next.js, react, useSearchParams, suspense, filtering, url-state]

# Dependency graph
requires:
  - phase: 06-filter-components
    provides: FilterBar generic component and TagChip toggle-mode component
provides:
  - FilteredPostList client component with tag filtering, URL persistence, and view count integration
  - Blog listing page refactored with Suspense boundary for static generation
affects: [07-02-filtered-listing-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [useSearchParams with replaceState for URL-persisted filter state, Suspense boundary isolating client island in static page]

key-files:
  created:
    - src/components/blog/filtered-post-list.tsx
  modified:
    - src/app/blog/page.tsx

key-decisions:
  - "Used window.history.replaceState instead of router.replace to avoid triggering server component re-renders"
  - "ListingViewCounts wraps all slugs (not filtered) so view counts fetch once regardless of filter changes"
  - "ScrollReveal bypassed during active filtering to prevent re-animation on filter changes"

patterns-established:
  - "URL-persisted filter state: useSearchParams read + replaceState write pattern for lightweight URL updates"
  - "Suspense boundary in server page to isolate useSearchParams client component while preserving static generation"

requirements-completed: [BLOG-01, BLOG-02, UX-02, UX-03, UX-06]

# Metrics
duration: 1min
completed: 2026-02-27
---

# Phase 7 Plan 1: Filtered Blog Listing Summary

**FilteredPostList client component with AND-logic tag filtering, URL persistence via useSearchParams, and Suspense-isolated blog page preserving static generation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T02:53:54Z
- **Completed:** 2026-02-28T02:54:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created FilteredPostList client component with full tag filtering (AND logic), URL state via useSearchParams/replaceState, empty state with clear action, and ScrollReveal bypass during active filtering
- Refactored blog page to extract unique tags server-side, wrap FilteredPostList in Suspense boundary, maintaining static generation (verified in build output as circle icon)
- View counts continue to work correctly via ListingViewCounts context wrapping all post slugs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FilteredPostList client component** - `93629a9` (feat)
2. **Task 2: Refactor blog page with Suspense boundary** - `a733c6d` (feat)

## Files Created/Modified
- `src/components/blog/filtered-post-list.tsx` - Client component owning filter state, AND logic, view count integration, empty state, and ScrollReveal bypass
- `src/app/blog/page.tsx` - Server component page refactored with Suspense boundary wrapping FilteredPostList, allTags extraction

## Decisions Made
- Used `window.history.replaceState` instead of `router.replace()` to write URL changes -- avoids triggering server component re-renders while Next.js still syncs the change with useSearchParams
- Passed all post slugs (not filtered slugs) to `ListingViewCounts` so view counts are fetched once on mount and remain available for any card that appears after filtering
- Bypassed `ScrollReveal` wrapper when `activeTags.size > 0` so cards appear instantly on filter changes instead of re-triggering entrance animations
- Used empty `<Suspense>` (no fallback) since hydration is near-instant with 3 posts and an empty fallback produces less CLS than a mismatched skeleton

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Blog filtering complete, ready for Phase 7 Plan 2 (filtered projects listing)
- FilteredPostList pattern can serve as reference for the projects equivalent
- FilterBar and TagChip components proven to work correctly in integration

## Self-Check: PASSED

- FOUND: src/components/blog/filtered-post-list.tsx
- FOUND: src/app/blog/page.tsx
- FOUND: 93629a9 (Task 1 commit)
- FOUND: a733c6d (Task 2 commit)

---
*Phase: 07-filtered-listing-integration*
*Completed: 2026-02-27*
