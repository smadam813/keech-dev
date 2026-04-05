# Phase 19: Verification and Polish - Research

**Researched:** 2026-04-05
**Domain:** End-to-end validation (E2E tests, build output, lint)
**Confidence:** HIGH

## Summary

Phase 19 is a pure validation phase -- run three checks (E2E tests, build output, lint), fix whatever fails, and confirm green. The codebase is already in excellent shape: lint exits 0 with no warnings, all 135 unit tests pass, `next build` produces all-static pages, and Playwright 1.59.1 with Chromium is installed. The primary risk area is the E2E code-copy test, which now tests against DOM-injected copy buttons (Phase 16 migration) rather than React component overrides -- the test's `figure[data-rehype-pretty-code-figure]` selector and `getByRole('button', { name: 'Copy code' })` locators need to work with the new `CodeBlockEnhancer` DOM injection pattern.

The CSP in `src/proxy.ts` no longer includes `unsafe-eval` in script-src (removed in Phase 16). All rendering now uses `dangerouslySetInnerHTML` instead of `new Function()`, so the hardened CSP should not cause any breakage. The E2E tests run against a production build (Playwright config: `npm run build && npm run start`), which means they inherently test under the real CSP headers served by the proxy middleware.

**Primary recommendation:** Run checks in order: lint (fastest feedback, 2s), build (validates static generation, ~15s), E2E (most comprehensive, ~2min). Fix any failures found. This phase should be very quick if Phase 18 was completed cleanly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** When Playwright E2E tests fail, fix the application code -- tests validate existing user-facing behavior (mobile menu, code copy, view counts, mobile TOC). Only modify a test if the test was asserting behavior that was intentionally changed in phases 16-18.
- **D-02:** Run all 4 E2E specs: `mobile-menu.spec.ts`, `code-copy.spec.ts`, `view-count.spec.ts`, `mobile-toc.spec.ts`. All must pass on both desktop-chromium and mobile-chromium projects.
- **D-03:** `next build` must show all pages as Static (circle) or SSG (filled circle). The `/feed.xml` route handler showing as Dynamic (f) is expected and acceptable -- route handlers are inherently dynamic in Next.js App Router. VER-02 applies to pages, not API routes.
- **D-04:** If any page unexpectedly shows as Dynamic, investigate and fix the cause (likely an accidental `cookies()` or `headers()` call, or missing `generateStaticParams`).
- **D-05:** `npm run lint` must report zero errors and zero warnings. Current state is already clean -- this validates no regressions from phases 16-18.
- **D-06:** If new warnings appear, fix the code rather than adding eslint-disable comments, unless the suppression is for an intentional pattern (like error boundary `<a>` tags or animation orchestration effects, which are already documented).
- **D-07:** Strictly limited to VER-01, VER-02, VER-03 success criteria. No feature additions, no refactoring, no dependency updates beyond what's needed to pass the three checks.

### Claude's Discretion
- Order of running checks (lint, build, E2E) -- whatever makes debugging most efficient
- Whether to run unit tests as a bonus sanity check (currently 135 passing)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VER-01 | All existing E2E tests pass with hardened CSP | Playwright 1.59.1 installed with Chromium; all 4 specs exist; CSP in proxy.ts has unsafe-eval removed; E2E webServer config runs production build which serves real CSP headers |
| VER-02 | next build output shows all pages as Static | Verified: current build already shows all pages as Static/SSG; only API routes and feed.xml are Dynamic (expected per D-03) |
| VER-03 | Zero ESLint errors and zero warnings from npm run lint | Verified: `npm run lint` currently exits 0 with no output (clean); ESLint flat config has 3 React 19 rules at warn level |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase uses existing tooling only.

### Core (Already Installed)
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| Playwright | 1.59.1 | E2E testing | Installed with Chromium [VERIFIED: npx playwright --version] |
| Next.js | 16.x | Build + static generation | Installed [VERIFIED: next build succeeds] |
| ESLint | flat config | Lint validation | Installed [VERIFIED: npm run lint exits 0] |
| Vitest | 4.1.2 | Unit tests (bonus check) | Installed [VERIFIED: 135 tests pass] |

## Architecture Patterns

### Validation Execution Order

Run checks from fastest to slowest for optimal debugging feedback:

1. **Lint** (~2s) -- fastest, catches syntax/style issues immediately
2. **Unit tests** (~2s) -- bonus sanity check, catches logic regressions
3. **Build** (~15s) -- validates static generation, catches import errors
4. **E2E** (~2min) -- most comprehensive, requires production build

This order means if lint fails, you fix it before wasting time on a full build. If the build fails, you fix it before waiting for E2E. [ASSUMED]

### E2E Test Architecture

Playwright is configured with:
- **Two projects:** `desktop-chromium` and `mobile-chromium` (Pixel 5 viewport) [VERIFIED: playwright.config.ts]
- **Web server:** `npm run build && npm run start` -- tests run against real production build [VERIFIED: playwright.config.ts]
- **Base URL:** `http://localhost:3000` [VERIFIED: playwright.config.ts]
- **Workers:** 1 (sequential execution) [VERIFIED: playwright.config.ts]
- **Retries:** 0 [VERIFIED: playwright.config.ts]
- **Timeout:** 120s for web server startup [VERIFIED: playwright.config.ts]

### CSP Validation Through E2E

The E2E tests inherently validate the hardened CSP because:
1. Playwright's `webServer` runs `npm run build && npm run start`
2. The production server uses `src/proxy.ts` as middleware
3. `proxy.ts` serves the CSP header on every response
4. If any page relies on `unsafe-eval` (which was removed in Phase 16), it would fail at runtime during E2E

This means VER-01 ("E2E tests pass with hardened CSP") is validated by simply running the E2E suite -- no special CSP testing is needed. [VERIFIED: proxy.ts, playwright.config.ts]

### Build Output Parsing

The `next build` output shows route status with these symbols:
- `○` (Static) -- prerendered as static content
- `●` (SSG) -- prerendered with `generateStaticParams`
- `ƒ` (Dynamic) -- server-rendered on demand

Per D-03, only pages matter. Route handlers (`/api/*`, `/feed.xml`) are expected to be Dynamic. [VERIFIED: next build output]

**Current build output status (verified):**
- All pages: Static (circle) or SSG (filled circle)
- Dynamic entries: `/api/views`, `/api/views/[slug]`, `/feed.xml` -- all route handlers, all expected [VERIFIED: npm run build]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSP validation | Custom CSP testing script | Playwright E2E suite | Production build already serves real CSP; E2E tests exercise all interactive features under it |
| Build output parsing | Script to parse next build output | Visual inspection of next build terminal output | Only ~15 routes; human-readable format is sufficient |
| Lint validation | Custom lint wrapper | `npm run lint` exit code | Exit code 0 = clean, non-zero = issues |

## Common Pitfalls

### Pitfall 1: Code-Copy E2E Selector Mismatch
**What goes wrong:** The code-copy E2E test uses `figure[data-rehype-pretty-code-figure]` to find code blocks and then looks for a copy button inside. After Phase 16's migration to `dangerouslySetInnerHTML` + `CodeBlockEnhancer`, the DOM structure changed -- copy buttons are now injected into a wrapper `div.group.relative` around `<pre>`, not directly inside `<figure>`.
**Why it happens:** Phase 16 changed from React component overrides (`CodeBlock` wrapping `<pre>`) to DOM injection (`CodeBlockEnhancer` wrapping `<pre>` in a `div` post-mount).
**How to avoid:** Verify the test's locator chain works with the new DOM structure. The test hovers on `figure` then looks for `button` inside it -- the button is actually inside `div.group > button` which is inside `figure`. Since `getByRole('button', { name: 'Copy code' })` scoped to `codeBlock` (the figure) will traverse descendants, this should still work if the wrapper div is inside the figure.
**Warning signs:** `code-copy.spec.ts` timing out or failing to find the copy button.

### Pitfall 2: ESLint Warn-Level Rules Producing Output
**What goes wrong:** The three React 19 rules downgraded to `warn` in eslint.config.mjs could produce warning output even though lint exits 0. D-05 requires zero warnings.
**Why it happens:** ESLint exits 0 for warnings, but Phase 18 was supposed to fix the underlying code patterns (useSyncExternalStore migration) so no warnings fire.
**How to avoid:** After running lint, check for any output text -- not just exit code. An exit code of 0 with warning text is still a D-05 violation.
**Warning signs:** `npm run lint` exits 0 but prints warning lines. Current status: clean (no output). [VERIFIED: npm run lint]

### Pitfall 3: Mobile-Menu Test Device Mismatch
**What goes wrong:** `mobile-menu.spec.ts` sets `test.use({ ...devices['Pixel 5'] })` at the top, but the test also runs in the `desktop-chromium` project. On desktop viewport the hamburger menu button may not be visible (hidden behind responsive breakpoint).
**Why it happens:** The test file overrides the device to Pixel 5 regardless of project, so this should work. But if the override doesn't take effect in certain Playwright versions, the test could fail on desktop.
**How to avoid:** Verify the test passes in both projects. If it only makes sense on mobile, consider whether it should be limited to the mobile project. Per D-01, only modify tests if behavior was intentionally changed.
**Warning signs:** Mobile menu test failing specifically in desktop-chromium project.

### Pitfall 4: View Count Test Redis Dependency
**What goes wrong:** The view-count E2E test could fail if Redis is unavailable.
**Why it happens:** The test intercepts API calls with `page.route()` to mock responses, so it should not depend on Redis. But if the route pattern `**/api/views/**` doesn't match the actual API URL, the real API would be called.
**How to avoid:** The test already handles this correctly -- it intercepts `**/api/views/**` and returns `{ views: 42 }`. [VERIFIED: view-count.spec.ts]
**Warning signs:** Test showing unexpected view count numbers instead of 42.

## Code Examples

### Running All Validation Checks
```bash
# Step 1: Lint (fastest feedback)
npm run lint

# Step 2: Unit tests (bonus sanity check)
npm run test

# Step 3: Build (validates static generation)
npm run build

# Step 4: E2E (comprehensive behavioral validation)
npm run test:e2e
```

### Checking Build Output for Dynamic Pages
```bash
# Look for the ƒ symbol on non-API, non-feed routes
npm run build 2>&1 | grep -E '^\s*(○|●|ƒ)\s+/' | grep -v '/api/' | grep -v '/feed'
```
All entries should show circle or filled circle, not f. [VERIFIED: current build is clean]

### Running Single E2E Spec for Debugging
```bash
# Run just the code-copy spec on desktop
npx playwright test e2e/code-copy.spec.ts --project=desktop-chromium

# Run just mobile-menu on mobile
npx playwright test e2e/mobile-menu.spec.ts --project=mobile-chromium
```

## Current Codebase Status (Pre-Phase Snapshot)

Verified on 2026-04-05:

| Check | Status | Detail |
|-------|--------|--------|
| `npm run lint` | PASS | Exit 0, no output [VERIFIED] |
| `npm run test` | PASS | 19 files, 135 tests, 0 failures [VERIFIED] |
| `npm run build` | PASS | All pages Static/SSG, only route handlers Dynamic [VERIFIED] |
| `npm run test:e2e` | NOT RUN | Requires full production build + server startup; will be validated during execution |
| CSP `unsafe-eval` removed | CONFIRMED | `src/proxy.ts` script-src has only `'self' 'unsafe-inline'` [VERIFIED] |
| Phase 18 useSyncExternalStore | CONFIRMED | Found in 5 files under `src/` [VERIFIED] |

**Key observation:** Three out of four checks already pass. The E2E suite is the primary unknown and the main value of this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 (E2E) + Vitest 4.1.2 (unit) |
| Config file | `playwright.config.ts` (E2E), `vitest.config.ts` (unit) |
| Quick run command | `npm run lint && npm run test` |
| Full suite command | `npm run lint && npm run test && npm run build && npm run test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VER-01 | All E2E tests pass with hardened CSP | E2E | `npm run test:e2e` | Yes -- 4 spec files in e2e/ |
| VER-02 | All pages Static in build output | build check | `npm run build` (visual inspection) | N/A -- build output |
| VER-03 | Zero ESLint errors/warnings | lint | `npm run lint` | N/A -- lint config |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run test`
- **Per wave merge:** Full suite: `npm run lint && npm run test && npm run build && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. All tools installed, all specs written, all configs in place.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | N/A (validation phase, no new inputs) |
| V6 Cryptography | No | N/A |

This phase validates existing security controls (CSP) but does not introduce new ones. The CSP validation happens implicitly through E2E tests running under production headers.

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSP bypass via unsafe-eval | Elevation of Privilege | Removed in Phase 16; validated by E2E running under real CSP |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Running checks lint -> unit -> build -> E2E is optimal order | Architecture Patterns | Low -- order is a convenience optimization, not correctness-critical |

All other claims in this research were verified via direct tool execution (lint, build, file reads).

## Open Questions

1. **E2E test results under hardened CSP**
   - What we know: Lint, unit tests, and build all pass. CSP has unsafe-eval removed. Code-copy uses DOM injection which does not require eval.
   - What's unclear: Whether all 4 E2E specs pass in both projects. This hasn't been run yet.
   - Recommendation: Run `npm run test:e2e` as the first action in execution. This is the primary validation this phase provides.

## Sources

### Primary (HIGH confidence)
- `playwright.config.ts` -- E2E configuration (2 projects, production build webServer)
- `eslint.config.mjs` -- flat config with 3 React 19 warn rules
- `src/proxy.ts` -- CSP headers (unsafe-eval confirmed removed)
- `src/components/blog/code-block-enhancer.tsx` -- DOM-based copy button injection
- `src/components/blog/mdx-content.tsx` -- dangerouslySetInnerHTML rendering
- `npm run lint` output -- exits 0, no warnings [VERIFIED: 2026-04-05]
- `npm run test` output -- 135/135 pass [VERIFIED: 2026-04-05]
- `npm run build` output -- all pages Static/SSG [VERIFIED: 2026-04-05]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools verified installed and working
- Architecture: HIGH -- all config files read, patterns documented from source
- Pitfalls: MEDIUM -- code-copy DOM structure hypothesis needs E2E verification

**Research date:** 2026-04-05
**Valid until:** 2026-04-12 (stable -- no dependency changes expected)
