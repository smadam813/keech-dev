---
phase: 24-audit-gap-closures
plan: 01
subsystem: security
tags: [nextjs, app-router, static-params, draft-guard, velite]

requires:
  - phase: none
    provides: existing blog routes with inline draft filtering

provides:
  - publishedPosts helper as single source of truth for draft filtering
  - runtime notFound() guard preventing draft leak via dynamicParams
  - mutation-safe sort pattern (spread before sort) for shared exports

affects: [blog, seo, content-pipeline]

tech-stack:
  added: []
  patterns: [shared-export-spread-before-sort, single-source-draft-filter]

key-files:
  created:
    - src/lib/posts.ts
    - src/lib/posts.test.ts
  modified:
    - src/app/sitemap.ts
    - src/app/feed.xml/route.ts
    - src/app/blog/page.tsx
    - src/app/blog/[slug]/page.tsx
    - src/app/blog/[slug]/opengraph-image.tsx
    - src/lib/seo-assets.test.ts

key-decisions:
  - "publishedPosts is a module-level filtered array; callers spread before sort to avoid mutating the shared reference"
  - "notFound() guard in opengraph-image.tsx prevents draft OG card rendering even with dynamicParams: true"
  - "No dynamicParams: false export added — runtime guard is the correct approach per research"

patterns-established:
  - "Shared export mutation safety: always [...publishedPosts].sort() never publishedPosts.sort()"
  - "Single source of truth: all post-consuming routes import from @/lib/posts, never directly from @/.velite for posts"

requirements-completed: [GAP-01]

duration: 3min
completed: 2026-04-12
---

# Phase 24 Plan 01: Draft Guard Summary

**publishedPosts helper extracts draft filtering into single source of truth, closing GAP-01 leak in slug page and OG image routes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-12T02:06:56Z
- **Completed:** 2026-04-12T02:10:04Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Created `src/lib/posts.ts` with `publishedPosts` export that filters drafts from Velite collection
- Migrated all 5 call sites (sitemap, feed.xml, blog listing, slug page, OG image) to import from the helper
- Added `notFound()` guard in `opengraph-image.tsx` so draft OG cards never render
- All sort sites use `[...publishedPosts].sort()` to prevent shared export mutation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create publishedPosts helper + unit test** - `f7a72b3` (feat)
2. **Task 2: Migrate sitemap, feed.xml, blog listing** - `4c7a5f3` (refactor)
3. **Task 3: Migrate slug page and OG image routes** - `92fd8c9` (fix)

## Files Created/Modified
- `src/lib/posts.ts` - Single source of truth for draft-filtered posts
- `src/lib/posts.test.ts` - 3 unit tests proving draft exclusion
- `src/app/sitemap.ts` - Imports publishedPosts instead of inline filter
- `src/app/feed.xml/route.ts` - Imports publishedPosts, spreads before sort
- `src/app/blog/page.tsx` - Imports publishedPosts, spreads before sort
- `src/app/blog/[slug]/page.tsx` - All 3 usages (generateStaticParams, generateMetadata, PostPage) use publishedPosts
- `src/app/blog/[slug]/opengraph-image.tsx` - Uses publishedPosts with notFound() guard
- `src/lib/seo-assets.test.ts` - Updated assertions to match new import pattern

## Decisions Made
- Used module-level `posts.filter(p => !p.draft)` rather than a function call since the collection is static at build time
- Added `notFound()` in opengraph-image.tsx (hardening the `?? 'Blog Post'` fallback) per threat model T-24-01
- Did NOT add `dynamicParams = false` per research anti-pattern guidance — runtime guard is load-bearing and sufficient
- Simplified `post?.title` to `post.title` after notFound() narrows the type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated seo-assets.test.ts assertions broken by migration**
- **Found during:** Task 2 and Task 3
- **Issue:** Existing tests checked for inline `!p.draft` in feed.xml source and `from '@/.velite'` in opengraph-image source — both no longer true after migration
- **Fix:** Updated test assertions to check for `from '@/lib/posts'` and `publishedPosts` import pattern instead
- **Files modified:** src/lib/seo-assets.test.ts
- **Verification:** All 157 tests pass
- **Committed in:** 4c7a5f3 (Task 2) and 92fd8c9 (Task 3)

---

**Total deviations:** 1 auto-fixed (bug in existing tests caused by current task changes)
**Impact on plan:** Test updates were necessary consequence of the migration. No scope creep.

## Issues Encountered
- `.velite` directory doesn't exist in worktree (gitignored, generated at build time) — created stub for Vitest mock resolution. Stub is gitignored and not committed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GAP-01 fully closed — all post-consuming routes use publishedPosts helper
- Zero inline draft filters remain in src/app/
- Build verified with all 6 published slugs prerendered
- 157 unit tests + lint clean

---
*Phase: 24-audit-gap-closures*
*Completed: 2026-04-12*
