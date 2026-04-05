# Phase 19: Verification and Polish - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end validation that the entire site works correctly under the hardened CSP (unsafe-eval removed from script-src), all pages remain statically generated, and the codebase produces zero lint errors and zero warnings. This phase runs checks and fixes whatever fails — it does not introduce new features or refactoring.

</domain>

<decisions>
## Implementation Decisions

### Test failure remediation
- **D-01:** When Playwright E2E tests fail, fix the application code — tests validate existing user-facing behavior (mobile menu, code copy, view counts, mobile TOC). Only modify a test if the test was asserting behavior that was intentionally changed in phases 16-18.
- **D-02:** Run all 4 E2E specs: `mobile-menu.spec.ts`, `code-copy.spec.ts`, `view-count.spec.ts`, `mobile-toc.spec.ts`. All must pass on both desktop-chromium and mobile-chromium projects.

### Build output validation
- **D-03:** `next build` must show all pages as Static (○) or SSG (●). The `/feed.xml` route handler showing as Dynamic (ƒ) is expected and acceptable — route handlers are inherently dynamic in Next.js App Router. VER-02 applies to pages, not API routes.
- **D-04:** If any page unexpectedly shows as Dynamic, investigate and fix the cause (likely an accidental `cookies()` or `headers()` call, or missing `generateStaticParams`).

### Lint validation
- **D-05:** `npm run lint` must report zero errors and zero warnings. Current state is already clean — this validates no regressions from phases 16-18.
- **D-06:** If new warnings appear, fix the code rather than adding eslint-disable comments, unless the suppression is for an intentional pattern (like error boundary `<a>` tags or animation orchestration effects, which are already documented).

### Polish scope
- **D-07:** Strictly limited to VER-01, VER-02, VER-03 success criteria. No feature additions, no refactoring, no dependency updates beyond what's needed to pass the three checks.

### Claude's Discretion
- Order of running checks (lint, build, E2E) — whatever makes debugging most efficient
- Whether to run unit tests as a bonus sanity check (currently 135 passing)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — VER-01, VER-02, VER-03 success criteria definitions

### Prior phase context (dependencies)
- `.planning/phases/16-mdx-migration/16-CONTEXT.md` — MDX migration decisions (dangerouslySetInnerHTML, copy button DOM injection, rehype list role plugin)
- `.planning/phases/17-syntax-highlighting-theme-migration/17-CONTEXT.md` — CSS-variables Shiki theme decisions
- `.planning/phases/18-react-19-lint-cleanup/18-CONTEXT.md` — useSyncExternalStore migration, lint suppression decisions

### Test infrastructure
- `playwright.config.ts` — E2E test configuration (desktop + mobile projects, localhost:3000)
- `e2e/code-copy.spec.ts` — Code block copy button E2E tests
- `e2e/mobile-menu.spec.ts` — Mobile menu navigation E2E tests
- `e2e/view-count.spec.ts` — View count display E2E tests
- `e2e/mobile-toc.spec.ts` — Mobile table of contents E2E tests

### Build and lint config
- `next.config.ts` — Next.js build configuration
- `eslint.config.mjs` — ESLint flat config (core-web-vitals + typescript)
- `src/proxy.ts` — Security headers middleware (CSP policy)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 4 E2E specs already exist and test the exact behaviors needed for VER-01
- `npm run build` already produces the static/dynamic page report needed for VER-02
- `npm run lint` already validates the full codebase needed for VER-03
- 19 unit test files (135 tests) provide additional regression coverage

### Established Patterns
- E2E tests run against a production build (`npm run build && npm run start` in playwright.config.ts)
- ESLint uses flat config with `core-web-vitals` and `typescript` configs
- Three React 19 rules downgraded to `warn` in eslint.config.mjs (react-hooks/rules-of-hooks exceptions)

### Integration Points
- CSP in `src/proxy.ts` — phases 16 removed `unsafe-eval`, this phase validates nothing broke
- `src/components/blog/mdx-content.tsx` — post-migration HTML rendering via dangerouslySetInnerHTML
- `velite.config.ts` — s.markdown() + CSS-variables theme from phases 16-17

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a validation phase. Run checks, fix failures, confirm green.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-verification-and-polish*
*Context gathered: 2026-04-05*
