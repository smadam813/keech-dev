---
phase: 16-mdx-migration
plan: "01"
subsystem: ui
tags: [mdx, velite, csp, security, dangerouslySetInnerHTML, rehype]

requires:
  - phase: 15-middleware-infrastructure
    provides: centralized CSP headers in src/proxy.ts
provides:
  - compile-time HTML rendering via s.markdown() replacing runtime new Function()
  - unsafe-eval removed from CSP script-src
  - DOM-based code block copy button injection
  - rehype-based role="list" for VoiceOver accessibility
affects: [17-syntax-highlighting-theme-migration, 19-verification-and-polish]

tech-stack:
  added: []
  patterns: [dangerouslySetInnerHTML for pre-compiled HTML, DOM-based progressive enhancement for interactive features]

key-files:
  created:
    - src/components/blog/code-block-enhancer.tsx
  modified:
    - velite.config.ts
    - src/components/blog/mdx-content.tsx
    - src/proxy.ts
    - src/app/blog/[slug]/page.tsx
    - src/app/projects/[slug]/page.tsx
    - src/components/blog/mdx-content.test.tsx
    - src/lib/security-headers.test.ts

key-decisions:
  - "s.markdown() outputs HTML strings at build time, eliminating need for new Function() at runtime"
  - "DOM-based CodeBlockEnhancer uses inline SVG icons instead of importing lucide-react to keep DOM manipulation self-contained"
  - "rehypeListRole plugin added to Velite config to replace React component override for role=list"

patterns-established:
  - "DOM-based progressive enhancement: use client components that enhance server-rendered HTML after mount"
  - "rehype plugins for accessibility attributes instead of React component wrappers"

requirements-completed: [MDX-01, MDX-02, MDX-03, MDX-04, MDX-05]

duration: 5min
completed: 2026-04-04
---

# Phase 16 Plan 01: MDX Migration to s.markdown() Summary

**Switched MDX rendering from runtime new Function() to compile-time HTML via Velite s.markdown() and dangerouslySetInnerHTML, removing unsafe-eval from CSP**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-04T04:42:00Z
- **Completed:** 2026-04-04T04:47:11Z
- **Tasks:** 5
- **Files modified:** 9

## Accomplishments
- Switched both posts and projects collections from s.mdx() to s.markdown() in Velite config
- Rewrote MDXContent from client component with new Function() to server component with dangerouslySetInnerHTML
- Created DOM-based CodeBlockEnhancer for copy button injection on pre-rendered HTML
- Added rehypeListRole plugin to preserve VoiceOver-compatible role="list" on lists
- Removed unsafe-eval from CSP script-src directive

## Task Commits

Each task was committed atomically:

1. **Task 1: Switch Velite to s.markdown() with rehype list role plugin** - `bd7195a` (feat)
2. **Task 2: Rewrite MDXContent to dangerouslySetInnerHTML** - `6f6e5ba` (feat)
3. **Task 3: Remove dead code-block.tsx** - `d4b7781` (chore)
4. **Task 4: Update MDXContent tests** - `f430d55` (test)
5. **Task 5: Remove unsafe-eval from CSP** - `e5e956d` (feat)

## Files Created/Modified
- `velite.config.ts` - Switched to s.markdown(), added rehypeListRole plugin, moved rehype config from mdx to markdown key
- `src/components/blog/mdx-content.tsx` - Server component rendering HTML via dangerouslySetInnerHTML
- `src/components/blog/code-block-enhancer.tsx` - Client component for DOM-based copy button injection on code blocks
- `src/components/blog/code-block.tsx` - Removed (dead code after migration)
- `src/app/blog/[slug]/page.tsx` - Changed MDXContent prop from code to html
- `src/app/projects/[slug]/page.tsx` - Changed MDXContent prop from code to html
- `src/proxy.ts` - Removed unsafe-eval from CSP script-src
- `src/components/blog/mdx-content.test.tsx` - Updated tests for HTML rendering approach
- `src/lib/security-headers.test.ts` - Updated CSP test to verify unsafe-eval absence

## Decisions Made
- Used s.markdown() which outputs HTML strings at build time, completely eliminating new Function() runtime execution
- Created CodeBlockEnhancer with inline SVG icons (Copy/Check) instead of importing lucide-react, keeping the DOM manipulation self-contained without React rendering overhead
- Moved accessibility (role="list") from React component overrides to a rehype plugin, which is the correct layer for HTML attribute injection in a compile-time pipeline

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed security headers test expecting unsafe-eval**
- **Found during:** Task 5 (CSP update)
- **Issue:** security-headers.test.ts asserted CSP contained unsafe-eval
- **Fix:** Updated assertion to check for absence of unsafe-eval
- **Files modified:** src/lib/security-headers.test.ts
- **Verification:** npm run test passes (126 tests)
- **Committed in:** e5e956d (Task 5 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary test update for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MDX content renders as compile-time HTML -- Phase 17 (syntax highlighting theme migration) can proceed
- Code blocks are enhanced via DOM after mount -- compatible with any CSS-variables theme changes
- All existing tests pass (126 tests, 17 files)
- Build produces fully static output for all pages
- Lint shows only the expected React 19 warnings (Phase 18 scope)

## Self-Check: PASSED

All 6 source files verified present. All 5 commit hashes verified in git log.

---
*Phase: 16-mdx-migration*
*Completed: 2026-04-04*
