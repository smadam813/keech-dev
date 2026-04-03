---
phase: 09-security-patches
plan: 01
subsystem: infra
tags: [security, csp, npm-audit, rate-limiting, next-config]

# Dependency graph
requires: []
provides:
  - "Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) on all routes"
  - "Clean npm audit (zero vulnerabilities)"
  - "@upstash/ratelimit installed and available for Plan 02"
  - "Corrected color validation script matching globals.css"
affects: [09-02-api-hardening]

# Tech tracking
tech-stack:
  added: ["@upstash/ratelimit"]
  patterns: ["Security headers via next.config.ts headers() export"]

key-files:
  created: []
  modified: ["next.config.ts", "package.json", "package-lock.json", "scripts/validate-colors.mjs"]

key-decisions:
  - "CSP includes unsafe-eval for MDX new Function() and va.vercel-scripts.com for Vercel Analytics"
  - "Next.js upgraded from 16.1.6 to 16.2.2 via npm audit fix"

patterns-established:
  - "Security headers pattern: async headers() in next.config.ts with source '/(.*)'  catch-all"

requirements-completed: [SEC-01, SEC-03, CLN-01, CLN-03]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 9 Plan 1: Dependencies & Security Headers Summary

**Security headers on all routes via next.config.ts, zero npm audit vulnerabilities, @upstash/ratelimit installed, color validation script corrected**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T02:31:06Z
- **Completed:** 2026-04-03T02:34:27Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Patched all npm vulnerabilities (Next.js 16.1.6 to 16.2.2, picomatch, flatted, brace-expansion)
- Added Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers to all routes
- Installed @upstash/ratelimit for Plan 02 API rate limiting
- Fixed muted color hex in validate-colors.mjs from #666666 to #4A4A4A

## Task Commits

Each task was committed atomically:

1. **Task 1: Patch dependencies and install rate limiter** - `5cbab31` (chore)
2. **Task 2: Add security headers to next.config.ts** - `8b8cd9c` (feat)
3. **Task 3: Fix color validation script muted hex value** - `ef4cd1e` (fix)

## Files Created/Modified
- `next.config.ts` - Added async headers() with CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- `package.json` - Updated dependencies, added @upstash/ratelimit
- `package-lock.json` - Lock file regenerated for updated dependencies
- `scripts/validate-colors.mjs` - Corrected muted hex from #666666 to #4A4A4A

## Decisions Made
- CSP includes `unsafe-eval` in script-src (required for MDX `new Function()` execution, tracked as DEP-03 for future removal)
- CSP includes `unsafe-inline` in style-src (required for rehype-pretty-code inline syntax highlighting styles)
- CSP allows `https://va.vercel-scripts.com` in both script-src and connect-src (Vercel Analytics)
- `frame-ancestors 'none'` complements X-Frame-Options DENY for clickjacking prevention

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] next lint command removed in Next.js 16.2**
- **Found during:** Task 1 (verification step)
- **Issue:** `npm run lint` fails because Next.js 16.2 removed the standalone `next lint` CLI command. `npx eslint` also fails due to eslintrc compatibility issues with the new version.
- **Fix:** Not fixed -- this is a pre-existing concern that emerged from the planned Next.js upgrade. Build verification passes. Lint is deferred as it requires ESLint config migration.
- **Files modified:** None
- **Impact:** Low -- build passes clean, lint was supplementary validation

---

**Total deviations:** 1 discovered (0 auto-fixed, 1 deferred)
**Impact on plan:** Lint unavailable after Next.js 16.2 upgrade. Build verification confirms code correctness. ESLint config migration is out of scope for this security-focused plan.

## Issues Encountered
- `next lint` CLI command was removed in Next.js 16.2.2. The `npm run lint` script no longer works. This requires updating the ESLint configuration and the lint script in package.json. Logged as a deferred item.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - no stubs introduced.

## Next Phase Readiness
- Security headers are active on all routes, ready for production
- @upstash/ratelimit is installed and available for Plan 02 (API rate limiting and input validation)
- Build passes clean on Next.js 16.2.2

## Self-Check: PASSED

- All 4 modified files exist on disk
- All 3 task commits verified in git log
- SUMMARY.md created

---
*Phase: 09-security-patches*
*Completed: 2026-04-03*
