# Pitfalls Research

**Domain:** v1.8 Concerns Cleanup -- dependency upgrades, test coverage, dead code removal for Next.js 16 + React 19 portfolio site
**Researched:** 2026-04-05
**Confidence:** HIGH (verified against official docs, migration guides, and codebase state)

## Critical Pitfalls

### Pitfall 1: TypeScript 6 `types` Default Change Breaks Vitest Globals AND Node Types

**What goes wrong:**
TypeScript 6 changes `types` from "auto-discover everything in `node_modules/@types`" to `[]` (empty array). This means `afterEach`, `describe`, `it`, `expect` stop resolving in test files -- but more critically, Node.js built-in types (`process`, `Buffer`, `__dirname`) also vanish from all source files. The build breaks in two places simultaneously, making it hard to diagnose which default caused what.

**Why it happens:**
TS6 changes 9 defaults at once. Developers upgrade, see errors, and chase them individually instead of understanding the root cause is the `types` default change. The current tsconfig has no explicit `types` field, so it relies entirely on auto-discovery.

**How to avoid:**
Before upgrading to TS6, explicitly add `types` to tsconfig.json:
```json
{
  "compilerOptions": {
    "types": ["node", "vitest/globals"]
  }
}
```
This simultaneously fixes the existing v1.7 concern (false `tsc --noEmit` errors on `afterEach`) AND prepares for TS6. Do this BEFORE the TS upgrade, not during.

**Warning signs:**
- `npx tsc --noEmit` suddenly reports hundreds of errors after TS6 upgrade
- Errors like `Cannot find name 'process'`, `Cannot find name 'afterEach'`
- Red squiggles in every file that uses `process.cwd()` (OG image routes, etc.)

**Phase to address:**
Phase 1 (test hygiene) -- add `types` to tsconfig as a prerequisite before any TS upgrade attempt. This is the single highest-leverage change in v1.8 because it fixes an existing concern AND prevents a future pitfall.

---

### Pitfall 2: Shiki v4 Upgrade Breaks rehype-pretty-code If Peer Dependency Is Incompatible

**What goes wrong:**
The current codebase uses `shiki@^3.22.0` and `rehype-pretty-code@^0.14.1`. Shiki v4's breaking changes are minimal (Node.js >= 20 required, typo-named APIs removed), and `createCssVariablesTheme` is unaffected. However, `rehype-pretty-code@0.14.x` declares a peer dependency on shiki -- if it does not accept shiki v4's major version, `npm install` emits peer dependency warnings and the build may fail at runtime when rehype-pretty-code's internal shiki calls hit removed or changed APIs.

**Why it happens:**
Developers check shiki's migration guide (which says "just bump from v3") but don't check rehype-pretty-code's peer dependency constraints. The `npm install` may succeed with a peer dependency warning that gets ignored, then `npm run velite` fails with an opaque error deep in rehype-pretty-code's internals.

**How to avoid:**
1. Check `npm info rehype-pretty-code peerDependencies` before upgrading shiki
2. If rehype-pretty-code 0.14.x does not support shiki v4, check for a newer rehype-pretty-code release
3. Upgrade both together in a single commit, test with `npm run velite` immediately
4. If no compatible rehype-pretty-code exists, defer shiki v4 or consider migrating to `@shikijs/rehype` (Shiki's own rehype plugin, always version-synced)

**Warning signs:**
- `npm install` shows peer dependency warnings for shiki version
- `npm run velite` or `npm run build` fails with errors from rehype-pretty-code
- Syntax highlighting disappears from blog posts (code blocks render as unstyled monochrome text)

**Phase to address:**
Dependency upgrade phase -- upgrade shiki + rehype-pretty-code together. If rehype-pretty-code 0.14.x supports shiki v4 (via loose peer deps or updated range), it is safe. If not, defer shiki upgrade or migrate to `@shikijs/rehype`.

---

### Pitfall 3: Testing Next.js App Router Route Handlers With Wrong Request Constructor

**What goes wrong:**
Next.js App Router route handlers receive `NextRequest` (extends `Request`) and return `NextResponse` (extends `Response`). In Vitest with jsdom environment, the global `Request` and `Response` are jsdom's implementations which differ from Node.js native equivalents. Tests that construct `new Request('http://localhost/api/views?slugs=a,b')` may work for basic cases, but the handler in `src/app/api/views/route.ts` uses `request.nextUrl.searchParams` -- a `NextRequest`-specific extension. Plain `Request` has no `.nextUrl` property, so the test crashes with "Cannot read properties of undefined."

**Why it happens:**
Vitest's jsdom environment provides browser-like globals but Next.js route handlers expect server-side `NextRequest` APIs. The mismatch is invisible until you test handlers that use Next.js-specific request extensions. The official Next.js testing guide focuses on component testing, not route handler testing.

**How to avoid:**
1. Import `NextRequest` from `next/server` in tests: `new NextRequest('http://localhost/api/views?slugs=a,b')`
2. Mock `@upstash/redis` and `@upstash/ratelimit` with `vi.mock()` -- never hit real Redis in tests
3. Use `// @vitest-environment node` comment at the top of API route test files (not jsdom)
4. For the batch views route (`GET /api/views?slugs=a,b`), test: valid slugs, empty slugs param, too many slugs (batch limit), malformed slug format
5. For the single view route (`GET/POST /api/views/[slug]`), test: valid slug fetch, increment, rate limit rejection, Redis error graceful handling

**Warning signs:**
- `TypeError: Cannot read properties of undefined (reading 'searchParams')` in test output
- Tests pass with plain `Request` but handler behaves differently in production
- Tests fail only in CI due to environment differences

**Phase to address:**
Test coverage phase -- when writing API route handler tests.

---

### Pitfall 4: TypeScript 6 `rootDir` Inference Change Causes Confusion

**What goes wrong:**
TS6 changes `rootDir` default from "computed from source files" to "tsconfig.json directory." For this project with `noEmit: true`, this does not affect build output. BUT: (a) the `ts5to6` migration tool may suggest adding an explicit `rootDir` that is not needed, (b) error message file paths may display differently, causing developers to waste time investigating phantom issues, (c) if anyone temporarily removes `noEmit` for debugging, output structure changes unexpectedly.

**Why it happens:**
Most migration guides emphasize `rootDir` as a critical change, so developers spend time "fixing" something that is already fine for `noEmit: true` projects.

**How to avoid:**
Run `npx @andrewbranch/ts5to6` as the first step of TS6 migration -- it auto-handles rootDir and baseUrl. Confirm the project still uses `noEmit: true` and recognize rootDir is effectively moot. Do not add an explicit rootDir unless the tool specifically recommends it.

**Warning signs:**
- `ts5to6` tool suggesting rootDir changes
- Error messages showing different file paths after upgrade

**Phase to address:**
Dependency upgrade phase -- run `ts5to6` as first step of TS6 migration.

---

### Pitfall 5: Adding `vitest/globals` to tsconfig Pollutes Non-Test Source Files

**What goes wrong:**
Adding `"types": ["vitest/globals"]` to the root tsconfig makes `describe`, `it`, `expect`, `vi` available in ALL TypeScript files, not just test files. A developer could accidentally use `expect()` in production code with no compile-time error.

**Why it happens:**
The root tsconfig applies to everything in `include`. Vitest recommends this approach without warning about scope leakage. The "proper" solution (separate `tsconfig.test.json`) adds complexity to the build tooling.

**How to avoid:**
Accept the tradeoff for this project. The codebase is ~4,900 LOC maintained by a single developer. The risk of accidentally using `expect()` in production code is negligible. Add a comment in tsconfig documenting the decision:
```json
{
  "compilerOptions": {
    // vitest/globals: enables test file type-checking (globals: true in vitest.config.ts)
    "types": ["node", "vitest/globals"]
  }
}
```

**Warning signs:**
- Auto-complete suggesting `vi.fn()` or `expect()` in non-test `.ts` files
- If this becomes annoying, split into `tsconfig.json` (without vitest/globals) + `tsconfig.test.json` (extends base, adds vitest/globals)

**Phase to address:**
Phase 1 (test hygiene) -- accept and document the tradeoff.

---

### Pitfall 6: Removing Dead Code That Has Test-Only Consumers

**What goes wrong:**
The orphaned `CopyButton` component has 3 passing tests in `copy-button.test.tsx`. Removing the component file without also removing the test file causes the test suite to fail with import errors. This is obvious in isolation but becomes a trap when batch-removing multiple dead files.

**Why it happens:**
Dead code analysis searches production imports (non-test files). Test files directly import the component, so they are not "consumers" in the production sense but ARE consumers in the test suite. Grep confirms `CopyButton` is only referenced in its own file and its test file -- no barrel exports, no dynamic imports, no re-exports.

**How to avoid:**
For every file removal:
1. Search ALL references: `grep -r "copy-button\|CopyButton" --include="*.ts" --include="*.tsx"`
2. Remove both the component and its test file as an atomic operation
3. Run `npm run test` immediately -- expect test count to drop from 135 to 132 (3 tests removed)
4. Check if `lucide-react` is still used elsewhere (it is -- `CopyButton` uses `Check` and `Copy` icons from lucide-react, but `CodeBlockEnhancer` uses inline SVGs instead; verify no other files import from lucide-react before considering removal)

**Warning signs:**
- `npm run test` shows import errors after code removal
- Test count drops but via failures, not clean removal

**Phase to address:**
Phase 1 (dead code cleanup) -- remove both files together as first change.

---

### Pitfall 7: `esModuleInterop` Always-On in TypeScript 6

**What goes wrong:**
TS6 makes `esModuleInterop: true` permanent (cannot be set to false). The current tsconfig does NOT explicitly set `esModuleInterop`, so it defaults to `false` in TS5. In TS6, it becomes always `true`. This changes how CommonJS default imports are handled. Existing `import * as foo from 'foo'` patterns continue to work, but some edge cases with CJS modules may surface.

**Why it happens:**
The current project uses `"module": "esnext"` and `"moduleResolution": "bundler"`, which already handles most interop correctly. The risk is low, but imports from CJS-only packages (`unist-util-visit`, `rehype-slug`) could theoretically behave differently.

**How to avoid:**
Run `npx tsc --noEmit` after TS6 upgrade. If any imports break, the fix is straightforward: switch from `import * as X` to `import X` (or vice versa). LOW risk for this project.

**Warning signs:**
- Import errors on CJS dependencies after TS6 upgrade
- "This expression is not callable" on default imports

**Phase to address:**
Dependency upgrade phase -- verify as part of TS6 upgrade validation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip shiki v4 upgrade | Zero risk to syntax highlighting pipeline | Growing distance from latest; harder to upgrade later | Acceptable if rehype-pretty-code does not support v4 yet |
| Add vitest/globals to root tsconfig (not split) | Simple fix, one file change | Test globals available in production file autocomplete | Always acceptable for solo-dev projects under 10K LOC |
| Keep eslint-disable comments for set-state-in-effect | No refactoring needed | 3 suppression comments remain as noise | Acceptable -- these are documented intentional patterns |
| Use plain Request in API tests | Simpler test setup | Tests don't catch NextRequest-specific bugs | Never -- always use NextRequest for route handler tests |
| Defer ESLint 10 upgrade | No migration effort | Growing gap; ESLint ecosystem moves to v10 plugin APIs | Acceptable for now -- ESLint 9 is still supported |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| shiki + rehype-pretty-code | Upgrading shiki independently | Check peer dep compatibility first; upgrade both together |
| Velite + shiki theme | Changing theme config without testing content pipeline | Always run `npm run velite` after any shiki/rehype change |
| Vitest + tsconfig types | Adding vitest/globals without adding node types | Always include both: `"types": ["node", "vitest/globals"]` |
| @upstash/redis in tests | Importing real Redis client in unit tests | Mock with `vi.mock('@upstash/redis')` -- never hit real Redis |
| next/server in Vitest | Using jsdom environment for server-side route handler tests | Use `// @vitest-environment node` for API route test files |
| @vercel/analytics v2 | Upgrading without checking CSP compatibility | New script domains may need addition to CSP connect-src/script-src |
| lucide-react v1 | Upgrading without checking icon name changes | Icon names may change between 0.x and 1.x; verify all icon imports |
| Test file relocation | Moving test file but keeping old import path | Update import to relative path from new location; run tests immediately |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| TS6 auto-discovering all @types without explicit types config | 20-50% slower type-checking, per TS team measurements | Explicit `types` array in tsconfig | Immediate on TS6 upgrade without types config |
| Running full test suite after each small change during v1.8 | Slow iteration; 135 tests + build validation per change | Group related changes into phases; run targeted tests per file during development, full suite before committing | When v1.8 has 4+ phases of changes |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Removing rate limiting tests when refactoring API routes | Rate limit bypass goes undetected | Ensure new API route tests include rate limit assertions |
| Mocking Redis in API tests but not testing error paths | Silent failures when Redis is down in production | Include test cases where Redis mock throws/rejects |
| Upgrading @vercel/analytics v2 without checking CSP | Analytics script blocked by CSP; metrics silently stop | Check v2 migration guide for new script domains; test in browser |
| Removing `unsafe-inline` from style-src during dep upgrades | Tailwind CSS v4 may still inject inline styles in edge cases | Only remove after thorough visual testing across all pages |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Syntax highlighting breaks silently after shiki upgrade | Blog posts show unstyled code blocks; no visible error | Validate with `npm run velite` + visual check of a code-heavy post |
| OG image font path breaks after dependency restructure | Social sharing cards show fallback text or broken layout | Add unit test asserting font file exists at `src/assets/fonts/Inter-Bold.ttf` |
| Test file relocation changes test names in output | No user impact, but confusing test output during development | Rename test describe blocks to match new file location |

## "Looks Done But Isn't" Checklist

- [ ] **Dead code removal:** Deleted component file but forgot test file -- `npm run test` catches this immediately
- [ ] **tsconfig types change:** Added `vitest/globals` but forgot `node` -- `process.cwd()` calls in OG routes fail under `tsc --noEmit`
- [ ] **shiki upgrade:** `npm install` succeeded but `npm run velite` not tested -- syntax highlighting may be silently broken
- [ ] **TS6 upgrade:** `tsc --noEmit` passes but `npm run build` uses Next.js's own TS checking -- test both
- [ ] **API route tests:** Tests pass in jsdom but route handlers use Node.js APIs -- add `// @vitest-environment node`
- [ ] **Test file relocation:** Moved `security-headers.test.ts` to `src/proxy.test.ts` but did not update the import path
- [ ] **Minor dep update:** `npm update` ran but `npm run build && npm run test && npm run lint` not executed afterward
- [ ] **lucide-react removal:** Removed CopyButton (only lucide consumer) but did not check if lucide-react is used elsewhere before removing from package.json

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Shiki v4 breaks rehype-pretty-code | LOW | Pin shiki back to `^3.22.0` in package.json, `npm install`, rebuild |
| TS6 upgrade causes mass errors | LOW | Pin typescript back to `^5.9.3`, revert tsconfig changes, confirm with `tsc --noEmit` |
| Vitest globals pollute autocomplete | LOW | Split tsconfig into base + test configs; minimal effort |
| API route tests fail with NextRequest | LOW | Switch `new Request()` to `new NextRequest()` from `next/server` |
| Dead code removal breaks test suite | LOW | `git restore` the removed test file, then delete both files together |
| @vercel/analytics v2 breaks CSP | LOW | Revert to v1, add new script domains to CSP, then re-upgrade |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| TS6 types default (Pitfall 1) | Phase 1: Test Hygiene | `npx tsc --noEmit` reports 0 errors in test files |
| Vitest globals pollution (Pitfall 5) | Phase 1: Test Hygiene | Comment in tsconfig documents the tradeoff |
| Dead code removal (Pitfall 6) | Phase 1: Dead Code Cleanup | `npm run test` passes with 132 tests (3 removed) |
| Test file relocation | Phase 1: Test Hygiene | `src/proxy.test.ts` exists, imports from `./proxy`, 6 tests pass |
| shiki + rehype-pretty-code compat (Pitfall 2) | Phase 2: Dependency Upgrades | `npm run velite` succeeds; blog post code blocks render correctly |
| TS6 rootDir + defaults (Pitfall 4) | Phase 2: Dependency Upgrades | `npx @andrewbranch/ts5to6` runs clean; `npm run build` succeeds |
| esModuleInterop (Pitfall 7) | Phase 2: Dependency Upgrades | `npx tsc --noEmit` passes after TS6 upgrade |
| NextRequest in API tests (Pitfall 3) | Phase 3: Test Coverage | API route tests use NextRequest, mock Redis, test error paths |
| @vercel/analytics v2 CSP | Phase 2: Dependency Upgrades | No CSP violations in browser console after analytics upgrade |

## Sources

- [Shiki v4.0 Announcement](https://shiki.style/blog/v4) -- minimal breaking changes, Node.js >= 20, typo APIs removed
- [Shiki Migration Guide](https://shiki.style/guide/migrate) -- v3 to v4 is a direct bump for most projects
- [TypeScript 6.0 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) -- 9 default changes including types to empty array
- [TypeScript 5.x to 6.0 Migration Gist](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f) -- rootDir, types, esModuleInterop, baseUrl changes
- [TS6 Migration Issue #62508](https://github.com/microsoft/TypeScript/issues/62508) -- official migration guide tracking
- [TS6 "Will Break Your Build" (Medium)](https://thinkingthroughcode.medium.com/typescript-6-0-will-break-your-build-fix-it-first-7666eec2335a) -- types default to empty array impact on vitest globals
- [Vitest Globals Config](https://vitest.dev/config/globals) -- add vitest/globals to tsconfig types
- [Vitest Globals Discussion #5086](https://github.com/vitest-dev/vitest/discussions/5086) -- scoping globals to test files only
- [Testing Next.js API Routes (Arcjet Blog)](https://blog.arcjet.com/testing-next-js-app-router-api-routes/) -- NextRequest mocking, route handler testing patterns
- [next-test-api-route-handler](https://github.com/Xunnamius/next-test-api-route-handler) -- route handler testing library (considered, overkill for 2-3 routes)
- [rehype-pretty-code npm](https://www.npmjs.com/package/rehype-pretty-code) -- peer dependency constraints on shiki
- [Next.js Testing Guide: Vitest](https://nextjs.org/docs/app/guides/testing/vitest) -- official component testing setup

---
*Pitfalls research for: v1.8 keech.dev concerns cleanup*
*Researched: 2026-04-05*
