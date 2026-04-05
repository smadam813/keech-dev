# Codebase Concerns

**Analysis Date:** 2026-04-05

## v1.7 Milestone Summary

v1.7 resolved the majority of concerns flagged in the 2026-04-03 audit. The following were addressed across phases 15–19:

**Resolved:**
- **Security: CSP `unsafe-eval`** — MDX now compiled to static HTML by Velite at build time; `new Function()` execution eliminated. `unsafe-eval` removed from CSP. The CSP is now applied via `src/proxy.ts` (a Next.js middleware-like export) rather than `next.config.ts`.
- **Security: Dependency vulnerabilities** — `npm audit` reports 0 vulnerabilities (previously 3: 2 high, 1 moderate).
- **Linting: `eslint-config-next` version mismatch** — `eslint-config-next` updated to `^16.2.2` to match `next`.
- **Linting: 4 ESLint errors on `<a>` tags** — `eslint-disable-next-line` comments with explanations added to all affected files (`src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/blog/[slug]/error.tsx`, `src/components/blog/mdx-content.tsx`).
- **Code quality: React 19 lint warnings on view counter** — `useViewStore` now uses `useSyncExternalStore` for localStorage reads; `useLayoutEffect` + `setState` pattern eliminated in `src/components/blog/listing-view-counts.tsx`.
- **Security: No middleware** — `src/proxy.ts` implements security headers centrally with CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.
- **Housekeeping: Worktree artifacts** — `.claude/worktrees/` now contains only the directory shell (4 KB), no bloated agent directories.

**Partially resolved:**
- **Security: CSP `unsafe-inline` for styles** — still present in `src/proxy.ts` (line 6). The CSS-variables theme approach eliminates inline `style` attributes from syntax highlighting tokens, which was the original driver, but `unsafe-inline` remains in `style-src` for Tailwind compatibility.
- **React 19 lint warnings** — count reduced. Two `react-hooks/set-state-in-effect` suppression comments remain in `src/hooks/use-hero-animation.ts` (lines 34, 45) and one in `src/components/ui/scroll-reveal.tsx` (line 18). These are intentional external-system sync patterns, not bugs. Downgraded to warnings in `eslint.config.mjs`.

---

## Moderate Severity

### Security: CSP Still Requires `unsafe-inline` for Styles

- Issue: `style-src 'unsafe-inline'` remains in the CSP defined in `src/proxy.ts` (line 6). While the switch to CSS-variables syntax highlighting eliminated per-token inline styles from rehype-pretty-code, Tailwind CSS v4's runtime behavior and the broader ecosystem still require `unsafe-inline` in practice.
- Files: `src/proxy.ts` (line 6), `velite.config.ts` (rehype-pretty-code plugin)
- Impact: `unsafe-inline` for styles reduces protection against CSS injection attacks. Lower severity than `unsafe-eval` but still a CSP weakening.
- Fix approach: Investigate nonce-based CSP for styles. The `src/proxy.ts` middleware architecture is now in place to support nonce generation per request. This would allow replacing `unsafe-inline` with `nonce-{value}`.

### Dead Code: `CopyButton` Component Orphaned by MDX Migration

- Issue: `src/components/blog/copy-button.tsx` is a React `CopyButton` component that is no longer used anywhere in the application. After the MDX migration (phase 16), code block enhancement moved to `src/components/blog/code-block-enhancer.tsx`, which injects buttons imperatively via DOM manipulation.
- Files: `src/components/blog/copy-button.tsx`, `src/components/blog/copy-button.test.tsx`
- Impact: Dead production code that is actively tested (3 tests in `copy-button.test.tsx` all pass) but the component has no consumer. The test counts inflate the coverage numbers without providing real protection. Maintenance burden if lucide-react icons change.
- Fix approach: Remove `src/components/blog/copy-button.tsx` and `src/components/blog/copy-button.test.tsx`. The `CodeBlockEnhancer` in `src/components/blog/code-block-enhancer.tsx` now owns copy button functionality using inline SVGs.

### Test File: `security-headers.test.ts` Tests a Non-Existent Module Path

- Issue: `src/lib/security-headers.test.ts` imports from `../../src/proxy` (line 2) — a relative path starting from within `src/lib/` that resolves to `src/proxy.ts`. This works today but the path is fragile: moving either file breaks the import. The test also has a mismatched name — it lives in `src/lib/` but describes a `proxy` module.
- Files: `src/lib/security-headers.test.ts` (line 2)
- Impact: All 6 tests pass, but the test file's location and import path are inconsistent with the rest of the test organization pattern (tests co-located with source). If `src/proxy.ts` is renamed or moved, these tests silently stop running.
- Fix approach: Move the test to `src/proxy.test.ts` (co-located with source) and update the import to `'./proxy'`. Or rename `security-headers.test.ts` to `proxy.test.ts` in place and fix the import.

### Dependency: Major Version Updates Available

- Issue: Several packages have major version bumps available that may introduce breaking changes:
  - `@vercel/analytics` at `1.6.1`, latest `2.0.1` (major)
  - `shiki` at `3.22.0`, latest `4.0.2` (major)
  - `typescript` at `5.9.3`, latest `6.0.2` (major)
  - `lucide-react` at `0.563.0`, latest `1.7.0` (major)
  - `eslint` at `9.39.2`, latest `10.2.0` (major)
- Files: `package.json`
- Impact: Major versions may introduce breaking API changes. `shiki` v4 may affect `rehype-pretty-code` integration (custom CSS-variables theme in `velite.config.ts`). TypeScript 6 may introduce stricter checks. `lucide-react` icon API changes could break `CopyButton` or other icon consumers.
- Fix approach: Evaluate each upgrade separately in a branch. Priority: `shiki` and `rehype-pretty-code` should be upgraded together since they share a compatibility matrix. `typescript` upgrade should be tested with `npx tsc --noEmit`.

---

## Minor Severity

### TypeScript: Test Files Report False tsc Errors

- Issue: Running `npx tsc --noEmit` reports 10 errors in test files: 4x `TS7009` and 4x `TS2345` in `src/app/error.test.tsx`, and 1x `TS2304 Cannot find name 'afterEach'` in each of `src/hooks/use-glow-positions.test.ts` and `src/hooks/use-hero-animation.test.ts`.
- Files: `src/app/error.test.tsx`, `src/hooks/use-glow-positions.test.ts`, `src/hooks/use-hero-animation.test.ts`
- Impact: These are expected false positives — Vitest globals (`afterEach`, etc.) are not in tsconfig, and `error.test.tsx` passes actual `Error` objects where the component type expects them. Tests pass correctly under `npm run test`. However, tsc errors in test files can mask real errors during CI checks.
- Fix approach: Add `"@vitest/globals"` to tsconfig `compilerOptions.types` (or add a `vitest.d.ts` declaration file) to resolve the `afterEach` errors. For `error.test.tsx`, review the render call pattern — the component should receive `{ error: new Error('...'), reset: () => {} }` as a prop object, not as two separate arguments.

### Code Quality: `react-hooks/set-state-in-effect` Warnings Remain (3 instances)

- Issue: ESLint emits `react-hooks/set-state-in-effect` warnings (downgraded from errors) for intentional patterns in `src/hooks/use-hero-animation.ts` (lines 34, 45) and `src/components/ui/scroll-reveal.tsx` (line 18). All three are suppressed with `eslint-disable-next-line` comments explaining the intent.
- Files: `src/hooks/use-hero-animation.ts`, `src/components/ui/scroll-reveal.tsx`
- Impact: Suppression comments are in place with explanations. These are working patterns (DOM cache reads, reduced-motion sync) that React 19's stricter analysis cannot distinguish from bugs. Low noise since they are properly documented.
- Fix approach: No immediate action. If a future refactor touches these hooks, consider converting the image cache check in `use-hero-animation.ts` to a layout effect with `useSyncExternalStore` for consistency with the view store pattern.

### Performance: OG Image Font Loading Uses `readFile`

- Issue: Both OG image routes use `readFile(join(process.cwd(), 'src/assets/fonts/Inter-Bold.ttf'))` for font loading. This is a Turbopack workaround.
- Files: `src/app/opengraph-image.tsx` (line 10), `src/app/blog/[slug]/opengraph-image.tsx` (lines 15–17)
- Impact: Works in production but prevents edge runtime deployment (`node:fs` unavailable at the edge). If the build output directory structure changes or the assets path moves, OG images break silently — no test coverage for the font loading path.
- Fix approach: Low priority. Monitor Turbopack's support for font loading in OG image routes. Consider adding a test that asserts the font file exists at the expected path (similar to the favicon assertions in `src/lib/seo-assets.test.ts`).

### Dependency: Velite Pre-Release (0.x.x), Pinned

- Issue: `velite` is pinned at exact version `0.3.1` (no caret). Semver 0.x conventions allow breaking changes on minor version bumps.
- Files: `package.json` (line 42: `"velite": "0.3.1"`)
- Impact: Exact pin prevents accidental upgrades, which is the right call for a 0.x dependency. However, security patches or bug fixes in newer Velite versions will not be applied automatically.
- Fix approach: Periodically check Velite changelog for `0.3.x` patch releases. Upgrade in isolation since the `.velite/` import alias and collection schemas are tightly coupled to the Velite API.

### Dependency: Minor Updates Deferred

- Issue: Several packages have newer wanted versions available that have not been updated:
  - `tailwindcss` + `@tailwindcss/postcss`: `4.1.18` → `4.2.2`
  - `rehype-pretty-code`: `0.14.1` → `0.14.3`
  - `tailwind-merge`: `3.4.0` → `3.5.0`
  - `@upstash/redis`: `1.36.2` → `1.37.0`
  - `@types/node`: `25.1.0` → `25.5.2`
  - `@types/react`: `19.2.10` → `19.2.14`
- Files: `package.json`
- Impact: Minor and patch updates are generally safe but deferred maintenance can accumulate. `tailwindcss 4.2.2` and `rehype-pretty-code 0.14.3` are most relevant since they touch the rendering pipeline.
- Fix approach: Run `npm update` and verify with `npm run build && npm run test`. The CSS-variables theme integration with `rehype-pretty-code` should be validated after any rehype-pretty-code update.

---

## Scaling Considerations

### Content Volume

- Current state: 6 blog posts, 2 projects
- Concern: All posts and projects are loaded as full collections via Velite into memory at build time. At 500+ posts with full HTML body content, build memory usage could spike.
- Files: `velite.config.ts`, all listing pages importing from `@/.velite`
- Scaling path: Not a near-term concern. Monitor build duration and memory as content grows. Pagination or incremental builds would be needed at significant scale.

### Redis Key Growth

- Current state: Each unique IP+slug combination creates a dedup key (24h TTL). Each post slug creates a permanent view count key. Rate limit keys expire via sliding window.
- Concern: Dedup keys self-clean. View count keys grow linearly with post count. At current volume (6 posts), negligible.
- Files: `src/app/api/views/[slug]/route.ts`, `src/lib/rate-limit.ts`
- Scaling path: Upstash free tier allows 10K commands/day. Well within limits at current content volume.

---

## Test Coverage Assessment

### Current State

19 test files, 135 tests passing. Coverage spans:
- **Unit tests (Vitest):** Error boundaries, loading skeleton, copy button (orphaned — see concerns above), MDX content, filter chip, hooks (filtered list, glow positions, hero animation, media query, view store), lib utilities (format, rate limit, rune glows, security headers via proxy, SEO assets, validation, views)
- **E2E tests (Playwright):** Mobile menu, code copy, view count, mobile TOC

### Gaps

- **API route handlers** — `src/app/api/views/route.ts` and `src/app/api/views/[slug]/route.ts` have no unit tests. Validation and rate limiting utilities are tested, but the route handler integration (request parsing, Redis interaction, response formatting, dedup logic) is not covered.
- **Page components** — `src/app/blog/page.tsx`, `src/app/projects/page.tsx`, `src/app/about/page.tsx` have no component tests. Server components are harder to unit test but listing filter logic in `src/components/blog/filtered-post-list.tsx` and `src/components/projects/filtered-project-list.tsx` is not independently tested.
- **OG image font loading** — `src/app/opengraph-image.tsx` and `src/app/blog/[slug]/opengraph-image.tsx` font file existence is not verified by any test. A future font path change would fail silently in production.
- **`CodeBlockEnhancer`** — `src/components/blog/code-block-enhancer.tsx` has no tests. It uses DOM mutation to inject copy buttons after mount, which is testable with jsdom but currently uncovered. Meanwhile, the orphaned `CopyButton` component has 3 tests.

---

*Concerns audit: 2026-04-05*
