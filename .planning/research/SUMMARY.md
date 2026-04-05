# Project Research Summary

**Project:** keech.dev v1.8 Concerns Cleanup
**Domain:** Codebase maintenance — dead code removal, test hygiene, dependency upgrades, test coverage expansion
**Researched:** 2026-04-05
**Confidence:** HIGH

## Executive Summary

v1.8 is a maintenance milestone with five well-scoped concerns: orphaned dead code, a mislocated test file, TypeScript false-positive errors under `tsc --noEmit`, stale dependencies (both patch/minor and major), and gaps in unit test coverage for the API route handlers and the `CodeBlockEnhancer` component. All concerns are internally scoped — no new features, no new third-party integrations, no changes to the content pipeline or rendering architecture. The recommended approach is to address concerns in strict dependency order: deletions and file moves first (zero risk), then dependency upgrades, then TypeScript 6 (which touches the shared compiler config), and finally new test coverage written against the stabilized stack.

The highest-leverage single change in this milestone is adding `"types": ["node", "vitest/globals"]` to `tsconfig.json`. This one line simultaneously resolves the existing Vitest globals false-error concern AND pre-empts the breaking change introduced by TypeScript 6's `types` default becoming an empty array. The two concerns share the same root cause and the same fix — addressing them together in Phase 1 prevents a cascade of confusing errors during the later TS6 upgrade.

The main execution risk is the shiki v4 + rehype-pretty-code coupling. These two packages share a tight integration boundary; upgrading shiki without a compatible rehype-pretty-code version breaks the entire content pipeline silently (blog posts render with unstyled code blocks). Research confirms that rehype-pretty-code 0.14.3 explicitly supports shiki v4 and the project's `createCssVariablesTheme` usage requires zero code changes — but both packages must be upgraded together in a single step and validated with `npm run velite` before proceeding. ESLint 10 remains blocked by `eslint-config-next` peer dependency incompatibility and is explicitly excluded from this milestone.

## Key Findings

### Recommended Stack

All core framework dependencies (Next.js 16, React 19, Tailwind CSS v4, Velite 0.3.1) remain unchanged. The v1.8 scope is limited to tooling and auxiliary dependencies. TypeScript is safe to upgrade from 5.9.3 to 6.0.2 because the existing `tsconfig.json` already matches all of TS6's new defaults (`strict: true`, `module: esnext`, `moduleResolution: bundler`, `esModuleInterop: true`). The only required tsconfig change is adding an explicit `types` array, which is also the Vitest globals fix. ESLint stays on 9.x — `eslint-config-next` does not yet support ESLint 10 (tracked at vercel/next.js#89764, closed as "tracking upstream," no fix shipped).

**Dependency changes:**
- `shiki` 3.22.0 → 4.0.2: safe upgrade, `createCssVariablesTheme` unchanged — must upgrade alongside rehype-pretty-code
- `rehype-pretty-code` 0.14.1 → 0.14.3: required peer for shiki 4, same plugin API
- `typescript` 5.9.3 → 6.0.2: safe given existing tsconfig; requires explicit `types` array as only breaking change for this project
- `lucide-react` 0.563.0 → 1.7.0: safe after CopyButton removal; no brand icons used, named imports unchanged, `aria-hidden="true"` default is correct for decorative usage
- `@vercel/analytics` 1.6.1 → 2.0.1: drop-in for Next.js; breaking changes only affect Nuxt
- `tailwindcss` / `@tailwindcss/postcss` 4.1.18 → 4.2.2: minor, additive only
- `eslint` 9.x: do NOT upgrade to 10 — blocked by `eslint-config-next` peer dep incompatibility

### Expected Features

Research identifies these as the complete scope for v1.8. Nothing is being added to the site's functionality — all work is internal.

**Must have (table stakes for a well-maintained codebase):**
- Remove orphaned `CopyButton` component and its test file — dead code inflates coverage metrics falsely, creates false confidence
- Relocate `security-headers.test.ts` to `src/proxy.test.ts` — violates established co-location pattern; fragile relative import path
- Fix TypeScript false errors (`tsc --noEmit` reports 10 errors in test files) — masks real issues; fix is a one-line tsconfig change
- Apply minor/patch dependency updates — 6 packages behind, accumulating upgrade cliff risk
- Evaluate and apply safe major upgrades (shiki, lucide-react, @vercel/analytics, TypeScript)

**Should have (meaningful quality improvement):**
- Unit tests for API route handlers — highest-value gap in the codebase; Redis interaction, dedup logic, rate limiting, and error handling are entirely untested
- Unit tests for `CodeBlockEnhancer` — fills the coverage gap left by CopyButton removal; DOM mutation testing with `waitFor`
- OG image font path existence test — ~5 lines following existing `seo-assets.test.ts` pattern; prevents silent production failure if font path changes

**Defer to future milestones:**
- ESLint 10 upgrade — blocked on `eslint-config-next` upstream support; not a codebase issue
- `react-hooks/set-state-in-effect` suppression refactoring — documented intentional patterns (imperative DOM APIs: image decoding, IntersectionObserver); force-refactoring adds complexity without fixing bugs
- Comprehensive E2E expansion — 18 existing tests cover critical flows; diminishing returns for a personal portfolio

### Architecture Approach

v1.8 makes no changes to component boundaries, data flows, routing, or the content pipeline. The changes are file deletions, file moves, config updates, dependency version bumps, and new test files. The architecture research maps each concern to affected files precisely: shiki/rehype-pretty-code touches only `package.json` (not `velite.config.ts` or `globals.css`); CopyButton removal deletes two files with no downstream consumers; proxy test relocation is a pure move with import path update; TypeScript 6 modifies only `tsconfig.json`; new test files are additions only.

**Components affected:**

1. `package.json` — dependency version bumps (shiki, rehype-pretty-code, typescript, lucide-react, @vercel/analytics, minor/patch packages)
2. `tsconfig.json` — add `"types": ["node", "vitest/globals"]` for TS6 compatibility and Vitest globals fix
3. Test infrastructure — 3 files deleted, 1 file relocated, 3-4 new test files created

**Explicitly unchanged and safe:** `velite.config.ts`, `globals.css`, `code-block-enhancer.tsx`, `proxy.ts`, all page components, all route handlers (source code — tests are new files only).

### Critical Pitfalls

1. **TypeScript 6 `types` default breaks everything at once** — add `"types": ["node", "vitest/globals"]` to tsconfig BEFORE upgrading TypeScript. Doing it during the upgrade mixes two root causes and makes errors hard to diagnose. This is the single highest-leverage change in v1.8 because it fixes an existing concern AND prevents the TS6 cascade pitfall.

2. **Shiki + rehype-pretty-code upgrade coupling** — never upgrade shiki alone. rehype-pretty-code 0.14.1 does not support shiki v4. Must upgrade to 0.14.3 simultaneously in a single `npm install` command. Validate immediately with `npm run velite` — a broken pipeline fails silently (code blocks render unstyled with no visible error message).

3. **API route tests require `NextRequest`, not `Request`** — batch views handler uses `request.nextUrl.searchParams`, a `NextRequest`-specific extension absent from plain `Request`. Use `new NextRequest(...)` from `next/server` and add `// @vitest-environment node` at the top of API route test files (not jsdom).

4. **Dead code removal must be atomic** — `CopyButton` is only referenced in its own test file. Deleting the component without the test file causes immediate suite failure with import errors. Always remove both files together, then verify `npm run test` drops exactly 3 tests cleanly (from 135 to 132).

5. **`esModuleInterop` always-on in TS6** — low risk given this project's ESM-first `moduleResolution: bundler` config, but CJS dependencies (`unist-util-visit`, `rehype-slug`) may surface import edge cases. Verify with `npx tsc --noEmit` after upgrade.

## Implications for Roadmap

Research strongly supports a 4-phase structure with a clear dependency order. The groupings are driven by risk isolation: each phase produces a stable, verifiable checkpoint before the next phase introduces any new complexity.

### Phase 1: Dead Code and Test Hygiene

**Rationale:** Zero production behavior changes. Establishes a clean, accurate baseline — correct test counts, correct tsc output — before introducing any upgrade risk. The tsconfig `types` fix here also pre-empts the critical TS6 pitfall, which is best addressed now when it can be confirmed with `tsc --noEmit` before any TypeScript version change.
**Delivers:** Orphaned code gone, co-location convention restored, `tsc --noEmit` reports 0 errors in test files, test count drops from 135 to 132 cleanly.
**Addresses:** CopyButton removal (+ test file), proxy test relocation, Vitest globals tsconfig fix, `error.test.tsx` type issues
**Avoids:** Pitfall 6 (atomic dead code removal), Pitfall 1 (pre-empt TS6 types default by fixing tsconfig in this phase)

### Phase 2: Dependency Upgrades

**Rationale:** Isolated from feature and test work so any regressions are clearly attributable to dependency changes. Minor/patch updates before majors gives a stable baseline. Shiki + rehype-pretty-code must be a single coupled upgrade. TypeScript is deferred to Phase 3 because it affects the entire compiler — easier to diagnose in isolation after other deps are stable.
**Delivers:** All non-blocked packages at current versions; syntax highlighting pipeline validated end-to-end; no stale minor/patch debt.
**Upgrade batches (in order):**
  1. Minor/patch sweep: tailwindcss 4.2.2, tailwind-merge 3.5.0, @upstash/redis 1.37.0, @types/node 25.5.x, @types/react 19.2.14 — then `npm run build && npm run test`
  2. Shiki 4.0.2 + rehype-pretty-code 0.14.3 (coupled, validate with `npm run velite` + visual spot-check)
  3. lucide-react 1.7.0 (safe after CopyButton removal from Phase 1)
  4. @vercel/analytics 2.0.1 (leaf dependency; check CSP for new script domains in browser console)
**Avoids:** Pitfall 2 (shiki/rehype coupling), Pitfall 7 (esModuleInterop — verify with tsc), @vercel/analytics CSP domain gap

### Phase 3: TypeScript 6 Upgrade

**Rationale:** TypeScript touches every file in the project. Upgrading after dependencies are stable means any new tsc errors are attributable to TS6 strictness alone. The `types` array is already in place from Phase 1, so there will be no surprise mass errors from the default change — just any genuine type issues that stricter checking surfaces.
**Delivers:** TypeScript 6.0.2, `tsc --noEmit` reports zero errors across entire codebase, compiler aligned with TS6 defaults.
**Process:** Run `npx @andrewbranch/ts5to6` first (automated migration tool audits tsconfig), then bump typescript package, then validate with `npx tsc --noEmit`, `npm run build`, `npm run test`, `npm run lint`.
**Avoids:** Pitfall 1 (types default — pre-empted in Phase 1), Pitfall 4 (rootDir inference — ts5to6 handles this), Pitfall 7 (esModuleInterop — verify with tsc --noEmit)

### Phase 4: Test Coverage Expansion

**Rationale:** New test code cannot break production. Written against the final stable stack (post Phase 2-3) so tests reflect actual runtime behavior and are validated by the upgraded compiler from day one. API route tests are the highest priority — they cover the most complex untested business logic in the codebase (Redis interaction, IP deduplication, rate limiting, error handling).
**Delivers:** ~13 new tests across API routes and CodeBlockEnhancer; OG font path existence test; documented decision on lint suppressions.
**New files:**
  - `src/app/api/views/route.test.ts` — batch GET handler (empty slugs, valid slugs, invalid format, batch limit, Redis error)
  - `src/app/api/views/[slug]/route.test.ts` — single GET + POST (dedup logic, rate limiting, Redis errors) using `NextRequest` and `// @vitest-environment node`
  - `src/components/blog/code-block-enhancer.test.tsx` — DOM mutation tests with `waitFor`
  - OG font path test in `src/app/opengraph-image.test.ts` or extended `seo-assets.test.ts`
**Avoids:** Pitfall 3 (NextRequest in API tests — use `new NextRequest(...)` not `Request`), Anti-Pattern 4 (CopyButton coverage gap — explicitly filled here)

### Phase Ordering Rationale

- Phase 1 before Phase 2: accurate test counts and clean tsc output make it unambiguous whether an upgrade introduced a regression
- Phase 1 tsconfig fix before Phase 3: the `types` array change is most safely made when TypeScript version is unchanged — confirms the fix works before the compiler version changes
- Phase 2 before Phase 3: TypeScript 6 errors are hard to diagnose when mixed with dependency change errors; stabilize deps first
- Phase 3 before Phase 4: new tests written after TypeScript upgrade are validated by the final compiler from day one, not patched retroactively
- Shiki/rehype-pretty-code coupled within Phase 2: peer dependency constraint means they cannot be upgraded independently
- ESLint 10 not included in any phase: blocked by upstream `eslint-config-next`; not a codebase issue and no action is possible

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1:** Pure file operations (deletions, move, one-line tsconfig change). All implementation details are fully documented in research files.
- **Phase 2 minor/patch batch:** Routine `npm update` workflow with standard verification steps. Zero unknowns.
- **Phase 2 shiki/rehype:** Compatibility verified, exact versions confirmed, no code changes required in `velite.config.ts`. Standard coupled upgrade with a clear validation step.
- **Phase 4 OG font test:** ~5 lines following the existing `seo-assets.test.ts` pattern. No unknowns.

Phases that warrant a quick check during planning (not full research):
- **Phase 2 @vercel/analytics v2:** Check migration guide for CSP-relevant script domain changes before upgrading. 10-minute check to confirm no new domains need adding to `next.config.ts` CSP headers.
- **Phase 3 TypeScript 6:** Run `npx @andrewbranch/ts5to6` as the first action — its output is the migration plan. No pre-planning research needed beyond what is already documented.
- **Phase 4 API route tests:** The mock strategy and test cases are fully specified in ARCHITECTURE.md. No additional research needed; verify `NextRequest` import path during implementation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All upgrade decisions verified against official migration guides and changelogs. ESLint 10 block confirmed via tracked GitHub issue. shiki/rehype-pretty-code compatibility confirmed via package lockfile inspection. |
| Features | HIGH | Scope is well-defined by the existing CONCERNS.md audit. No ambiguity about what is in vs. out of v1.8. Anti-features are grounded in specific failure modes, not opinion. |
| Architecture | HIGH | All changes are internal. No new integrations, no external API surface changes, no component boundary changes. File-level impact map is complete and verified. |
| Pitfalls | HIGH | All pitfalls verified against official docs and known GitHub issues. Recovery paths are all LOW-cost reverts. Warning signs are specific and observable. |

**Overall confidence:** HIGH

### Gaps to Address

- **@vercel/analytics v2 CSP impact:** Research notes that new script domains may need addition to `next.config.ts` CSP headers. The exact domains are not confirmed here. Check the v2 migration guide/changelog before upgrading and test in the browser console for CSP violations post-upgrade. LOW severity — easy to detect and fix.

- **`noUncheckedSideEffectImports` TS6 new default:** A new TS6 default that may flag bare `import './globals.css'` side-effect imports. LOW risk and empirically verifiable with `tsc --noEmit` after upgrade. Not a reason to defer — include as a validation step in Phase 3.

- **@types/react in `types` array:** After adding `"types": ["node", "vitest/globals"]`, JSX types may need explicit inclusion if `tsc --noEmit` reports React JSX errors. The `next` tsconfig plugin handles IDE augmentation but its interaction with an explicit `types` array requires empirical verification. Fix is straightforward: add `"react"` and `"react-dom"` to the array if needed.

## Sources

### Primary (HIGH confidence)
- [Shiki v4.0 Blog Post](https://shiki.style/blog/v4) — breaking changes list, Node.js >= 20 requirement, removed APIs
- [Shiki Theme Colors / createCssVariablesTheme](https://shiki.style/guide/theme-colors) — function availability confirmed in v4
- [rehype-pretty-code Releases](https://github.com/rehype-pretty/rehype-pretty-code/releases) — shiki 4 compatibility in 0.14.3
- [TypeScript 6.0 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) — 9 default changes, removed options, breaking changes list
- [Vitest Globals Config](https://vitest.dev/config/globals) — `"types": ["vitest/globals"]` in tsconfig as the official pattern
- [Next.js Testing Guide: Vitest](https://nextjs.org/docs/app/guides/testing/vitest) — official component and route handler testing
- [Lucide Version 1 Guide](https://lucide.dev/guide/version-1) — breaking changes, brand icon removal confirmed
- [Vercel Analytics Releases](https://github.com/vercel/analytics/releases) — v2.0 breaking changes confirmed as Nuxt-only

### Secondary (MEDIUM confidence)
- [TypeScript 5.x to 6.0 Migration Guide (community gist)](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f) — rootDir, types, esModuleInterop changes
- [Testing Next.js API Routes (Arcjet Blog)](https://blog.arcjet.com/testing-next-js-app-router-api-routes/) — NextRequest mocking pattern
- [Vitest Discussion #1573](https://github.com/vitest-dev/vitest/discussions/1573) — community confirmation of vitest/globals tsconfig fix

### Tertiary (contextual / blocked-by-upstream)
- [eslint-config-next ESLint 10 Issue #89764 / #91702](https://github.com/vercel/next.js/issues/91702) — ESLint 10 blocked; closed as "tracking upstream," no fix shipped
- [TS6 "Will Break Your Build" (Medium)](https://thinkingthroughcode.medium.com/typescript-6-0-will-break-your-build-fix-it-first-7666eec2335a) — types default impact on vitest globals

---
*Research completed: 2026-04-05*
*Ready for roadmap: yes*
