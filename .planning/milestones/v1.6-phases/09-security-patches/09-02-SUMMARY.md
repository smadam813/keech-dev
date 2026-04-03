---
phase: 09-security-patches
plan: 02
subsystem: api, content
tags: [security, rate-limiting, input-validation, error-handling, mdx]

# Dependency graph
requires: [09-01]
provides:
  - "Slug validation (pattern + length) on all view counter API routes"
  - "Batch slug limit (20 max) on listing view endpoint"
  - "Rate limiting (10/60s sliding window per IP) on POST view counter"
  - "MDX rendering error boundary with branded fallback"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["Input validation utilities", "Rate limiting with @upstash/ratelimit", "MDX try-catch error boundary"]

key-files:
  created: ["src/lib/validation.ts", "src/lib/rate-limit.ts"]
  modified: ["src/app/api/views/[slug]/route.ts", "src/app/api/views/route.ts", "src/components/blog/mdx-content.tsx"]

key-decisions:
  - "Rate limit POST only (not GET) -- reads are harmless, writes cost Redis ops"
  - "Slug pattern ^[a-z0-9-]+$ with 100 char max covers all valid slugs while blocking injection"
  - "MDX fallback uses plain anchor href instead of Next Link since it is a client component escape hatch"

patterns-established:
  - "Validation utilities in src/lib/validation.ts for reuse across API routes"
  - "Rate limiter instances in src/lib/rate-limit.ts at module scope (avoids per-request instantiation)"

requirements-completed: [SEC-02, SEC-04, SEC-05, SEC-06]

# Metrics
duration: 2min
completed: 2026-04-03
---

# Phase 9 Plan 2: API Hardening & MDX Error Handling Summary

**Slug validation and rate limiting on view counter APIs, MDX rendering wrapped in try-catch with neobrutalist fallback component**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-03T02:37:38Z
- **Completed:** 2026-04-03T02:39:12Z
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 3

## Accomplishments
- Created validation utilities with slug pattern matching, length limits, and batch size enforcement
- Created rate limiter using @upstash/ratelimit sliding window (10 requests per 60 seconds per IP)
- Hardened /api/views/[slug] GET and POST with slug validation (400 on invalid)
- Added rate limiting to /api/views/[slug] POST (429 on excess)
- Hardened /api/views batch GET with slug validation and 20-slug batch limit (400 on excess)
- Wrapped MDX rendering in try-catch covering both new Function() and component render
- Added branded fallback with neobrutalist styling and "Back to Blog" navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create validation and rate limiting utilities, harden API routes** - `68c1b0f` (feat)
2. **Task 2: Wrap MDX rendering in try-catch with branded fallback** - `a0d65fe` (feat)

## Files Created/Modified
- `src/lib/validation.ts` - Slug validation helpers (validateSlug, validateSlugs) with pattern, length, and batch limits
- `src/lib/rate-limit.ts` - viewsRateLimit instance using @upstash/ratelimit sliding window
- `src/app/api/views/[slug]/route.ts` - Added slug validation to GET/POST, rate limiting to POST
- `src/app/api/views/route.ts` - Added batch slug validation with 20-slug limit
- `src/components/blog/mdx-content.tsx` - Added try-catch with MDXFallback component

## Decisions Made
- Rate limit POST only (not GET) since reads are harmless and do not cost Redis write ops
- Slug pattern `^[a-z0-9-]+$` with 100 char max covers all valid slugs while blocking injection attempts
- MDX fallback uses plain `<a href>` instead of Next.js `<Link>` since the component is a client-side escape hatch
- IP extraction moved above rate limiting in POST handler so it is extracted once and reused for both rate limiting and dedup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` skipped (known issue from Plan 01 -- Next.js 16.2 removed `next lint` CLI)

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - no stubs introduced.

## Next Phase Readiness
- All security requirements for v1.6 are now complete (SEC-01 through SEC-06)
- API routes are hardened with validation and rate limiting
- MDX rendering degrades gracefully on malformed content

## Self-Check: PASSED

- All 5 source files exist on disk (2 created, 3 modified)
- Both task commits verified in git log (68c1b0f, a0d65fe)
- SUMMARY.md created

---
*Phase: 09-security-patches*
*Completed: 2026-04-03*
