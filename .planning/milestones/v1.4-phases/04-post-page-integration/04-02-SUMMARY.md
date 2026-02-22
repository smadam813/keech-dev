---
phase: 04-post-page-integration
plan: 02
subsystem: ui
tags: [react, runes, view-counter, jera, static-generation]

# Dependency graph
requires:
  - phase: 04-post-page-integration
    plan: 01
    provides: "ViewCounter client component, POST_RUNES.separator config, animate-shimmer utility"
provides:
  - "Blog post page with integrated ViewCounter and Jera rune separators"
  - "Blog listing post cards with Jera rune separators replacing middle dots"
affects: [05-listing-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [localStorage view cache with useLayoutEffect for flicker-free hydration]

key-files:
  created: []
  modified:
    - src/app/blog/[slug]/page.tsx
    - src/components/blog/post-card.tsx
    - src/components/blog/view-counter.tsx

key-decisions:
  - "Replaced shimmer placeholder with localStorage caching to avoid visual flicker per user feedback"
  - "useLayoutEffect reads cached count before paint to prevent hydration mismatch"
  - "suppressHydrationWarning approach was tried but caused stale DOM -- reverted to useLayoutEffect"

patterns-established:
  - "localStorage view cache: cache last-known count per slug, read synchronously via useLayoutEffect before first paint"

requirements-completed: [VIEW-01, VIEW-04]

# Metrics
duration: ~5min
completed: 2026-02-22
---

# Phase 4 Plan 2: Post Page Integration Summary

**ViewCounter wired into blog post page with Jera rune separators on both post pages and listing cards, static generation preserved**

## Performance

- **Duration:** ~5 min (includes checkpoint review and fix iteration)
- **Started:** 2026-02-22T01:15:00Z
- **Completed:** 2026-02-22T01:40:29Z
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments
- Integrated ViewCounter into blog post metadata row: `date [Jera] X min read [Jera] N views`
- Replaced all middle-dot separators with teal Jera rune characters across post pages and listing cards
- Confirmed static generation preserved (`npm run build` shows static symbol for /blog/[slug])
- Improved ViewCounter UX by replacing shimmer animation with localStorage-cached count display

## Task Commits

Each task was committed atomically:

1. **Task 1: Integrate ViewCounter and Jera separators into blog post page** - `8a572b0` (feat)
2. **Task 2: Replace middle-dot separators with Jera rune in post cards** - `841c6a8` (feat)
3. **Task 3: Verify view counter and rune separators** - checkpoint:human-verify (approved, no commit)

**Checkpoint fix:** `ed37604` (fix) - Removed shimmer placeholder, added localStorage view cache

## Files Created/Modified
- `src/app/blog/[slug]/page.tsx` - Added ViewCounter import and Jera rune separators in metadata row
- `src/components/blog/post-card.tsx` - Replaced middle-dot separator with Jera rune character
- `src/components/blog/view-counter.tsx` - Replaced shimmer animation with useLayoutEffect + localStorage caching

## Decisions Made
- Replaced shimmer placeholder with localStorage caching per user feedback during checkpoint review -- shimmer felt jarring, cached count provides instant display on repeat visits
- Used useLayoutEffect (not useEffect) to read localStorage before paint, avoiding visible flicker
- Tried suppressHydrationWarning approach first but it caused stale DOM issues -- reverted to useLayoutEffect which works correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced shimmer with localStorage view cache**
- **Found during:** Task 3 (checkpoint review)
- **Issue:** Shimmer placeholder animation felt visually jarring to user; also caused brief flash on every page load even for repeat visitors
- **Fix:** Added localStorage caching of last-known view count per slug, read synchronously via useLayoutEffect before first paint. Removed shimmer animation entirely.
- **Files modified:** src/components/blog/view-counter.tsx
- **Verification:** User approved after fix -- no flicker on page load, count displays immediately for cached slugs
- **Committed in:** `ed37604`

---

**Total deviations:** 1 auto-fixed (1 bug fix per user feedback)
**Impact on plan:** Improved UX over original plan. No scope creep -- same component, better loading behavior.

## Issues Encountered
- suppressHydrationWarning was attempted as a simpler solution but caused stale DOM where server-rendered "0" persisted instead of updating to cached count. Resolved by switching to useLayoutEffect approach.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ViewCounter is live on all blog post pages -- Phase 4 integration complete
- Jera rune separators are consistent across post pages and listing cards
- Phase 5 can add view counts to blog listing cards (GET-only, VIEW-03)
- Phase 5 can add graceful degradation (UX-03) and number formatting (UX-01)
- localStorage caching pattern established for ViewCounter can be reused in listing cards

## Self-Check: PASSED

- [x] `src/app/blog/[slug]/page.tsx` exists
- [x] `src/components/blog/post-card.tsx` exists
- [x] `src/components/blog/view-counter.tsx` exists
- [x] `04-02-SUMMARY.md` exists
- [x] Commit `8a572b0` found (Task 1)
- [x] Commit `841c6a8` found (Task 2)
- [x] Commit `ed37604` found (Checkpoint fix)

---
*Phase: 04-post-page-integration*
*Completed: 2026-02-22*
