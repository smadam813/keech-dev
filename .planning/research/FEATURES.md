# Feature Landscape

**Domain:** Codebase concern resolution -- dead code, test hygiene, dependency updates, test coverage gaps
**Researched:** 2026-04-05
**Confidence:** HIGH (concerns are well-documented; solutions verified against official docs)

## Table Stakes

Features that are expected for a well-maintained codebase. Missing = technical debt accumulates.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Remove orphaned `CopyButton` + tests | Dead code with passing tests inflates coverage and creates false confidence. `copy-button.tsx` has zero consumers post-MDX migration (phase 16). | Low | Delete 2 files: `src/components/blog/copy-button.tsx` and `src/components/blog/copy-button.test.tsx`. Removes 3 phantom tests from coverage count. Also reduces `lucide-react` surface area (fewer icon consumers to audit for major upgrade). |
| Relocate `security-headers.test.ts` to `src/proxy.test.ts` | Test co-location is the established project pattern (tests live alongside source). Current file lives in `src/lib/` but tests `src/proxy.ts` with a fragile relative import `../../src/proxy`. Name mismatch (`security-headers` vs `proxy`) adds confusion. | Low | Move file to `src/proxy.test.ts`, update import to `'./proxy'`. All 6 tests pass unchanged -- only the file location and import path change. |
| Fix TypeScript false errors in test files | `tsc --noEmit` reports 10 false errors in test files, masking real issues. `afterEach` not recognized in 2 test files. Type mismatches in `error.test.tsx`. | Low | Add `"vitest/globals"` to `compilerOptions.types` array in `tsconfig.json`. This is the [Vitest-documented solution](https://vitest.dev/config/globals). No separate tsconfig needed. Review `error.test.tsx` render calls for remaining TS errors after globals fix. |
| Apply minor/patch dependency updates | Deferred minor updates accumulate risk. 6 packages behind: `tailwindcss 4.2.x`, `rehype-pretty-code 0.14.3`, `tailwind-merge 3.5.0`, `@upstash/redis 1.37.0`, `@types/node 25.5.x`, `@types/react 19.2.14`. | Low | Run `npm update` then `npm run build && npm run test && npm run lint`. Validate syntax highlighting rendering after `rehype-pretty-code` bump -- it touches the CSS-variables theme pipeline via `velite.config.ts`. |
| Evaluate major dependency updates | 5 packages have major bumps: `shiki 4.x`, `@vercel/analytics 2.x`, `lucide-react 1.x`, `typescript 6.x`, `eslint 10.x`. Leaving all stale creates upgrade cliff. | Medium | Each needs individual evaluation. See Differentiators for safe upgrades vs Anti-Features for deferrals. |

## Differentiators

Work that goes beyond minimum cleanup to meaningfully improve codebase quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Unit tests for API route handlers | View count routes contain the most complex untested business logic: Redis interaction, IP dedup with SHA-256 hashing, rate limiting, batch fetch, error handling. Zero test coverage today. | Medium | **Pattern:** Import `GET`/`POST` handlers directly from route files. Mock `@/lib/redis` and `@/lib/rate-limit` with `vi.mock()`. Construct `Request` objects with `new Request()`. Assert on `Response.json()` and status codes. No `next-test-api-route-handler` needed -- these are plain `(Request) -> Response` functions. **Test cases:** (1) valid slugs return counts, (2) invalid slugs return 400, (3) empty slugs param returns empty counts, (4) Redis failure returns 500, (5) rate limit exceeded returns 429, (6) first visit increments + returns `deduplicated: false`, (7) repeat visit skips increment + returns `deduplicated: true`, (8) batch fetch with mixed existing/missing slugs. **Mock setup:** `vi.mock('@/lib/redis', () => ({ redis: { get: vi.fn(), set: vi.fn(), incr: vi.fn(), mget: vi.fn() } }))`. For the `[slug]` route, mock the `params` as `Promise.resolve({ slug: 'test-post' })` to match Next.js 16's async params API. |
| Unit tests for `CodeBlockEnhancer` | DOM-mutating component with zero tests, while the orphaned React `CopyButton` it replaced has 3 tests. Covers copy button injection, wrapper creation, and idempotency guard. | Medium | **Pattern:** Render a container with `<div class="prose"><pre><code>console.log('test')</code></pre></div>`, mount `CodeBlockEnhancer` inside it, use `waitFor` to assert DOM mutations from `useEffect`. **Test cases:** (1) wraps `<pre>` in `.group.relative` div, (2) injects button with `aria-label="Copy code"`, (3) skips already-wrapped `<pre>` elements (idempotency -- `enhanced.current` guard), (4) handles missing `.prose` container gracefully (no-op), (5) copy button click calls `navigator.clipboard.writeText` with code text content. **Mock setup:** `Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })` in test setup. Use `@testing-library/react` `render()` + `waitFor()` for async DOM mutations. |
| OG font path existence test | Silent production failure risk -- if font path changes, OG images break with no test catching it. One test, maximum value per line of code. | Low | **Pattern:** Follow existing `src/lib/seo-assets.test.ts` pattern. Assert `src/assets/fonts/Inter-Bold.ttf` exists using `fs.existsSync(join(process.cwd(), 'src/assets/fonts/Inter-Bold.ttf'))`. ~5 lines of test code. Place in `src/app/opengraph-image.test.ts` or extend `seo-assets.test.ts`. |
| `@vercel/analytics` 2.x upgrade | Major version bump from 1.6.1 to 2.0.1. Analytics is a leaf dependency with a small API surface (`<Analytics />` component in root layout). Low risk, keeps Vercel integration current. | Low | Check changelog for breaking changes. Likely just an import path or prop change. Test with `npm run build`. |
| `lucide-react` 1.x upgrade | Major version from 0.563.0 to 1.7.0. After removing `CopyButton`, audit remaining `lucide-react` consumers. Icon API changes are the main risk. | Low | Only safe after `CopyButton` removal (Phase A). Check which components still import from `lucide-react` and verify icon names/props haven't changed. |
| Assess `react-hooks/set-state-in-effect` suppressions | 3 remaining suppressions in `use-hero-animation.ts` (2) and `scroll-reveal.tsx` (1). Quick evaluation of whether cleaner alternatives exist. | Low | These are intentional external-system sync patterns (image decode cache check, IntersectionObserver callback). Already well-documented with suppression comments. The `useSyncExternalStore` migration in v1.7 handled the cases where it was appropriate. These remaining cases involve imperative DOM APIs (image decoding, intersection observation) where `useSyncExternalStore` is not a natural fit. **Likely outcome:** keep suppressions as-is. Flag as "evaluate, don't force." |

## Anti-Features

Work to explicitly NOT do in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Page component tests for server components | `blog/page.tsx`, `projects/page.tsx`, `about/page.tsx` are server components that import Velite collections and do trivial data mapping. Hard to unit test (async, server-only APIs). E2E tests already cover these pages. | Rely on 18 existing Playwright E2E tests for page-level validation. |
| `next-test-api-route-handler` package | Adds a dependency for something achievable with direct function calls. App Router route handlers are plain `async (Request) -> Response` functions. The package adds complexity (resolver emulation, config) without benefit for simple handlers. | Import `GET`/`POST` directly from route files, construct `Request` objects, mock Redis at module level with `vi.mock()`. |
| TypeScript 6.x upgrade | TS 6 is very new (2026). Major TypeScript versions introduce stricter checks that cascade across entire codebases. Ecosystem tooling (`eslint-config-next`, `@vitejs/plugin-react`) may not fully support it yet. Low benefit for a solo portfolio. | Stay on TypeScript 5.9.x. Revisit when Next.js officially requires or recommends TS 6. |
| ESLint 10.x upgrade | Major ESLint version with potential flat config changes. `eslint-config-next` must explicitly support ESLint 10 -- upgrading independently risks config incompatibility. | Stay on ESLint 9.x. Upgrade only after `eslint-config-next` releases ESLint 10 support. |
| `shiki` 4.x upgrade | Shiki and `rehype-pretty-code` share a tight compatibility matrix. The CSS-variables theme (`createCssVariablesTheme`) was just set up in v1.7. Shiki 4.x may change the theme API. `rehype-pretty-code 0.14.x` may not support shiki 4 yet. | Defer until `rehype-pretty-code` explicitly supports shiki 4.x in its changelog or peer deps. Check before attempting. |
| Nonce-based CSP for styles | Requires per-request dynamic rendering, breaking static generation. Already in PROJECT.md "Out of Scope." | Accept `unsafe-inline` in `style-src`. Low-severity for author-controlled content with no user input. |
| Comprehensive E2E expansion | Diminishing returns for a personal portfolio. 18 tests cover critical flows. | Add unit tests where they provide targeted, isolated coverage (API routes, CodeBlockEnhancer). Keep E2E count stable. |
| Force-refactoring lint suppressions | The 3 `react-hooks/set-state-in-effect` suppressions are correct patterns with documented rationale. Refactoring to eliminate them would add complexity without fixing bugs. | Keep suppressions. Revisit only if those hooks are refactored for other reasons. |

## Feature Dependencies

```
Remove CopyButton ──> Enables lucide-react 1.x upgrade (fewer consumers to audit)
Fix tsc errors (vitest/globals) ──> Independent, no downstream deps
Relocate proxy test ──> Independent, no downstream deps
Minor dep updates ──> Validate rehype-pretty-code + CSS-variables theme still works
Major dep evaluation ──> Cleaner after minor updates applied (stable baseline)
API route tests ──> Need vi.mock() for @/lib/redis and @/lib/rate-limit
CodeBlockEnhancer tests ──> Need navigator.clipboard mock + waitFor for async DOM
OG font path test ──> Independent, follows existing seo-assets.test.ts pattern
@vercel/analytics 2.x ──> Independent (leaf dependency, root layout only)
lucide-react 1.x ──> Depends on CopyButton removal (reduces audit scope)
```

## Phase Grouping Recommendation

**Phase A: Dead Code + Test Hygiene** (Low complexity, high confidence, zero behavioral changes)
1. Remove orphaned `CopyButton` component and `copy-button.test.tsx`
2. Move `security-headers.test.ts` to `src/proxy.test.ts`, fix import
3. Add `"vitest/globals"` to `tsconfig.json` `compilerOptions.types`
4. Fix remaining `error.test.tsx` type issues if any persist

Rationale: Pure cleanup with no production behavior changes. Establishes clean baseline for subsequent work. All items are independent of each other within the phase.

**Phase B: Dependency Updates** (Low-Medium complexity, isolated risk)
1. Apply minor/patch updates via `npm update`
2. Validate: `npm run build && npm run test && npm run lint`
3. Verify syntax highlighting rendering (rehype-pretty-code touched)
4. Upgrade `@vercel/analytics` to 2.x (likely safe, small API surface)
5. Upgrade `lucide-react` to 1.x (safe after CopyButton removal in Phase A)
6. Evaluate `shiki 4.x` compat with `rehype-pretty-code` -- defer if incompatible

Rationale: Dependency changes can introduce subtle regressions. Isolating from cleanup means any breakage is clearly attributable. Minor updates before major gives a stable baseline.

**Phase C: Test Coverage Expansion** (Medium complexity, zero production risk)
1. API route handler tests (highest value -- most complex untested code)
2. `CodeBlockEnhancer` tests (DOM mutation coverage)
3. OG font path existence test (quick win)
4. Evaluate lint suppressions (likely keep as-is, document decision)

Rationale: New test code cannot break production. Benefits from stable dependency state after Phase B. API route tests are the highest-value addition -- they cover Redis interaction, dedup logic, rate limiting, and error handling in one test file.

**Deferred to future milestones:**
- `shiki 4.x` -- wait for `rehype-pretty-code` compat
- `typescript 6.x` -- wait for ecosystem maturity
- `eslint 10.x` -- wait for `eslint-config-next` support

## Sources

- [Vitest globals configuration](https://vitest.dev/config/globals) -- official docs confirming `"types": ["vitest/globals"]` in tsconfig resolves tsc false errors (HIGH confidence)
- [Next.js testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest) -- official guide for Vitest setup in Next.js projects (HIGH confidence)
- [Vitest Discussion #1573](https://github.com/vitest-dev/vitest/discussions/1573) -- community confirmation of vitest/globals types fix for tsc --noEmit (MEDIUM confidence)
- [Testing Next.js App Router API routes](https://blog.arcjet.com/testing-next-js-app-router-api-routes/) -- patterns for direct handler invocation with mocked dependencies (MEDIUM confidence)
- [API Testing with Vitest in Next.js](https://medium.com/@sanduni.s/api-testing-with-vitest-in-next-js-a-practical-guide-to-mocking-vs-spying-5e5b37677533) -- vi.mock() vs vi.spyOn() patterns for route handler testing (MEDIUM confidence)
- [React Testing Library component testing](https://vitest.dev/guide/browser/component-testing) -- patterns for testing DOM-mutating components with waitFor (MEDIUM confidence)

---
*Feature research for: keech.dev v1.8 concerns cleanup*
*Researched: 2026-04-05*
