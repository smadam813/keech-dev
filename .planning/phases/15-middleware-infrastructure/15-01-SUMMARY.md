---
phase: 15-middleware-infrastructure
plan: "01"
subsystem: infra
tags: [middleware, security-headers, csp, next.js]

requires:
  - phase: 14-foundation-hardening
    provides: clean dependency tree and lint baseline
provides:
  - centralized security headers in src/middleware.ts
  - next.config.ts free of header configuration
affects: [16-mdx-migration, 17-syntax-highlighting, 19-verification]

tech-stack:
  added: []
  patterns: [middleware-based security headers]

key-files:
  created: [src/middleware.ts]
  modified: [next.config.ts]

key-decisions:
  - "No-parameter middleware function to avoid unused-vars lint warning"
  - "Matcher excludes _next/static, _next/image, favicon.ico, sitemap.xml, robots.txt"

patterns-established:
  - "Security headers centralized in middleware: all header changes go to src/middleware.ts"

requirements-completed: [MID-01, MID-02, MID-03]

duration: 2min
completed: 2026-04-04
---

# Phase 15 Plan 01: Centralize Security Headers in Middleware Summary

**Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) moved from next.config.ts headers() to src/middleware.ts for single-source-of-truth header management**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T03:13:27Z
- **Completed:** 2026-04-04T03:16:06Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Created `src/middleware.ts` serving all four security headers on every matched route
- Removed `headers()` function and `cspHeader` variable from `next.config.ts`
- Build verification confirms middleware active (`Proxy (Middleware)` in build output) with all pages remaining static

## Task Commits

Each task was committed atomically:

1. **Task 1: Create middleware with security headers** - `acfcc58` (feat)
2. **Task 2: Remove headers() from next.config.ts** - `e1e47f7` (refactor)
3. **Task 3: Build verification + lint fix** - `baec97a` (fix)

## Files Created/Modified
- `src/middleware.ts` - New middleware setting CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy on all non-static routes
- `next.config.ts` - Removed headers() function and cspHeader variable; only images config remains

## Decisions Made
- Used parameterless middleware function signature to avoid `@typescript-eslint/no-unused-vars` warning since the request object is not inspected
- Matcher pattern excludes `_next/static`, `_next/image`, `favicon.ico`, `sitemap.xml`, `robots.txt` -- these are served directly without header injection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused request parameter from middleware**
- **Found during:** Task 3 (Build verification)
- **Issue:** `request: NextRequest` parameter triggered `@typescript-eslint/no-unused-vars` lint warning; underscore prefix also not recognized by project ESLint config
- **Fix:** Removed parameter and `NextRequest` import entirely since middleware only sets headers without inspecting the request
- **Files modified:** src/middleware.ts
- **Verification:** `npm run lint` shows no middleware-related warnings
- **Committed in:** baec97a (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal -- lint compliance fix for our own new code. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functionality is fully wired.

## Next Phase Readiness
- Middleware infrastructure in place; Phase 16 (MDX Migration) can modify CSP directives directly in `src/middleware.ts` when removing `unsafe-eval`
- Phase 17 (Syntax Highlighting) may also adjust `style-src` directives in the same file
- Single source of truth means no risk of header duplication across config and middleware

---
*Phase: 15-middleware-infrastructure*
*Completed: 2026-04-04*
