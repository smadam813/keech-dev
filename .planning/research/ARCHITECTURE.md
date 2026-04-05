# Architecture: v1.8 Concern Resolution Integration

**Domain:** Codebase cleanup for Next.js 16 portfolio site
**Researched:** 2026-04-05
**Supersedes:** v1.7 architecture research (2026-04-03)
**Confidence:** HIGH (all concerns are internal to the existing codebase; minimal external dependency risk)

## Overview

v1.8 resolves five categories of concerns from the codebase audit. Each integrates differently with the existing architecture. This document maps each concern to affected components, data flows, and a suggested build order based on dependencies.

---

## 1. Shiki v4 + rehype-pretty-code Compatibility

### Current Architecture

```
velite.config.ts
  -> imports createCssVariablesTheme from 'shiki'
  -> passes CSS-variables theme to rehype-pretty-code plugin
  -> rehype-pretty-code uses shiki internally for tokenization
  -> tokens rendered as <span> elements with CSS variable references (no hardcoded colors)
  -> globals.css defines --shiki-* CSS custom properties for token colors
```

### Integration Analysis

**Shiki v3 -> v4 breaking changes are minimal** (HIGH confidence, from [official v4 blog post](https://shiki.style/blog/v4)):
- Drops Node.js 18 support (project uses Node.js 20+, no impact)
- Removes misspelled API names (`createdBundledHighlighter` -> `createBundledHighlighter`, `CreatedBundledHighlighterOptions` -> `CreateBundledHighlighterOptions`)
- `createCssVariablesTheme` is NOT deprecated or removed -- still documented and supported on [shiki.style/guide/theme-colors](https://shiki.style/guide/theme-colors)
- No changes to theme API, tokenization output, or CSS-variables approach

**rehype-pretty-code 0.14.1 -> 0.14.3** supports shiki v4 (the library's lockfile shows shiki 4.0.1). This is a patch update within the same 0.14.x line, so the plugin API is stable.

### Components Modified

| File | Change | Type | Risk |
|------|--------|------|------|
| `package.json` | Bump `shiki` ^3.22.0 -> ^4.0.2, `rehype-pretty-code` ^0.14.1 -> ^0.14.3 | Modify | LOW |
| `velite.config.ts` | No changes needed | None | None |
| `src/app/globals.css` | No changes needed (--shiki-* variables unchanged) | None | None |

### Validation

```bash
npm run build        # Velite compiles MDX with new shiki/rehype-pretty-code
npm run test         # Existing tests pass
npm run test:e2e     # Code copy E2E test validates syntax highlighting renders
```

Visual spot-check: load a blog post with code blocks, confirm token colors match github-dark-dimmed palette.

---

## 2. Relocate security-headers.test.ts to Co-locate with src/proxy.ts

### Current Architecture

```
src/
  proxy.ts                    # Security headers middleware (source)
  lib/
    security-headers.test.ts  # Tests for proxy.ts (mislocated, fragile import path)
```

The test imports `from '../../src/proxy'` -- a fragile relative path that traverses up from `src/lib/` then back into `src/`. The codebase convention is test files co-located with their source: `src/lib/format.ts` has `src/lib/format.test.ts`, `src/hooks/use-hero-animation.ts` has `src/hooks/use-hero-animation.test.ts`, etc.

### Integration Analysis

This is a pure file move with import path update. No component boundaries, data flows, or APIs change. The 6 existing tests remain identical in content.

### Components Modified

| File | Change | Type | Risk |
|------|--------|------|------|
| `src/lib/security-headers.test.ts` | DELETE | Remove | None |
| `src/proxy.test.ts` | CREATE (moved content, updated import) | New | None |

### New File: `src/proxy.test.ts`

The import changes from `from '../../src/proxy'` to `from './proxy'`. Test body is unchanged. The Vitest config includes `src/**/*.test.{ts,tsx}`, which covers `src/proxy.test.ts`.

### Validation

```bash
npm run test  # Confirm 6 proxy tests still pass at new location
```

---

## 3. Remove CopyButton Without Breaking CodeBlockEnhancer

### Current Architecture

```
src/components/blog/
  copy-button.tsx           # ORPHANED React component (uses lucide-react Check/Copy icons)
  copy-button.test.tsx      # 3 tests for orphaned component
  code-block-enhancer.tsx   # ACTIVE DOM-based copy button injection (inline SVGs)
```

**CopyButton** was the React component approach (pre-v1.7). It accepted a `getText` prop and rendered lucide-react `<Copy>` / `<Check>` icons. It was part of the `CodeBlock` component mapping in the old MDX `components` prop override system.

**CodeBlockEnhancer** replaced it in v1.7 when MDX moved to `dangerouslySetInnerHTML`. It uses DOM manipulation post-mount to inject copy buttons with inline SVG strings. These two components have **zero shared code or dependencies**.

### Integration Analysis

CopyButton has no consumers (confirmed via grep -- only imported by its own test file and referenced in planning docs). Removing it is a pure deletion with no downstream effects on CodeBlockEnhancer.

The removal also eliminates one `lucide-react` import site (`Check`, `Copy`), but `lucide-react` is still used by 6 other source files (`header.tsx`, `footer.tsx`, `mobile-toc.tsx`, `blog/[slug]/page.tsx`, `projects/[slug]/page.tsx`, `project-card.tsx`), so the dependency stays in `package.json`.

### Components Modified

| File | Change | Type | Risk |
|------|--------|------|------|
| `src/components/blog/copy-button.tsx` | DELETE | Remove | None -- no consumers |
| `src/components/blog/copy-button.test.tsx` | DELETE | Remove | None -- tests orphaned component |

### What NOT to Touch

`src/components/blog/code-block-enhancer.tsx` requires no changes. It is completely independent -- uses inline SVG strings, not lucide-react imports.

### Validation

```bash
npm run test   # Test count drops by 3 (copy-button tests removed), all remaining pass
npm run build  # No import errors
npm run lint   # No unused import warnings
```

---

## 4. API Route Handler Tests for Next.js App Router

### Current Architecture

```
src/app/api/views/
  route.ts           # GET /api/views?slugs=a,b (batch fetch)
  [slug]/
    route.ts         # GET/POST /api/views/[slug] (single fetch/increment)

Dependencies (already independently tested):
  src/lib/redis.ts       # Redis client (Redis.fromEnv())
  src/lib/validation.ts  # validateSlug(), validateSlugs()
  src/lib/rate-limit.ts  # viewsRateLimit (sliding window)
```

The route handlers are App Router `route.ts` exports (`GET`, `POST` functions). They accept `Request` objects and return `Response.json()`. The handlers depend on `redis`, `validation`, and `rate-limit` modules.

### Integration Analysis

**Testing approach:** Direct handler invocation with mocked Redis. This is the standard pattern for Next.js App Router route handlers per [Next.js testing docs](https://nextjs.org/docs/app/guides/testing/vitest):

1. Mock `@/lib/redis` (the `redis` object and its methods: `mget`, `get`, `set`, `incr`)
2. Mock `@/lib/rate-limit` (the `viewsRateLimit.limit` method)
3. Construct `Request` objects with appropriate URLs and headers
4. Call the exported `GET`/`POST` functions directly
5. Assert on `Response` status and JSON body

**Key architectural detail:** In Next.js 16 App Router, the `params` argument is `Promise<{ slug: string }>` (async params). Tests must pass `{ params: Promise.resolve({ slug: 'test' }) }`.

### New Components

| File | Type | Purpose | Risk |
|------|------|---------|------|
| `src/app/api/views/route.test.ts` | CREATE | Tests for batch GET handler | None -- new tests only |
| `src/app/api/views/[slug]/route.test.ts` | CREATE | Tests for single GET + POST handlers | None -- new tests only |

### Test Coverage Map

**`route.test.ts` (batch GET):**
- Empty slugs param returns `{ counts: {} }`
- Valid slugs returns counts from Redis mget
- Invalid slug format returns 400
- Batch size limit exceeded returns 400
- Redis error returns 500

**`[slug]/route.test.ts` (single GET + POST):**
- GET with valid slug returns view count
- GET with invalid slug returns 400
- GET with Redis error returns 500
- POST increments on first visit (dedup NX returns `'OK'`)
- POST skips increment on repeat visit (dedup NX returns `null`)
- POST with invalid slug returns 400
- POST with rate limit exceeded returns 429
- POST with Redis error returns 500

### Mock Strategy

```typescript
vi.mock('@/lib/redis', () => ({
  redis: {
    mget: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
  }
}))

vi.mock('@/lib/rate-limit', () => ({
  viewsRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  }
}))
```

The `crypto.createHash` used in the POST handler for IP hashing works natively in Node.js -- no mock needed.

### Validation

```bash
npm run test  # New tests pass alongside existing suite (expect ~13 new tests)
```

---

## 5. TypeScript 6 Impact on Existing Configuration

### Current Architecture

`tsconfig.json` settings:
- `strict: true` (already set)
- `target: "ES2022"` (explicit)
- `module: "esnext"` (explicit)
- `moduleResolution: "bundler"` (explicit)
- `jsx: "react-jsx"` (explicit)
- No explicit `types` array (auto-discovers `@types/*`)
- `noEmit: true` (type-checking only, Next.js handles compilation)

### Integration Analysis

**TypeScript 6.0 breaking changes assessed against this project** (HIGH confidence, from [official announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) and [migration guide](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f)):

| Change | Current Config | Impact |
|--------|---------------|--------|
| `strict` defaults to `true` | Already `true` | **None** |
| `module` defaults to `esnext` | Already `"esnext"` | **None** |
| `moduleResolution` defaults to `bundler` | Already `"bundler"` | **None** |
| `target` defaults to `es2025` | Explicit `"ES2022"` | **None** -- explicit setting preserved |
| `types` defaults to empty array | Not set (auto-discovers) | **BREAKING** |
| `esModuleInterop` always `true` | Not explicitly set | **None** -- was already `true` via `strict` |
| JS strict mode unconditional | ESM project, already strict | **None** |
| `baseUrl` deprecated | Not used (paths are relative) | **None** |

**The one breaking change:** TypeScript 6 stops auto-discovering `@types/*` packages. The project has `@types/node`, `@types/react`, and `@types/react-dom` installed but does not list them in `compilerOptions.types`. After upgrading, `process`, `Buffer`, and React JSX types would not be found by `tsc`.

**Fix:** Add `"types": ["node"]` to `compilerOptions` in `tsconfig.json`. The `next` plugin handles React/JSX type augmentation. If `tsc --noEmit` still reports React type errors, add `"react"` and `"react-dom"` to the array.

**Vitest globals bonus:** The existing concern about `afterEach`/`describe` false positives in `npx tsc --noEmit` (10 errors in test files) can be addressed simultaneously. Since TypeScript 6 requires an explicit `types` array anyway, adding Vitest global declarations becomes natural. Options:
1. Add a `vitest-globals.d.ts` file with `/// <reference types="vitest/globals" />`
2. Or add `"vitest/globals"` to the `types` array (if Vitest supports this pattern)

### Components Modified

| File | Change | Type | Risk |
|------|--------|------|------|
| `package.json` | Bump `typescript` ^5.9.3 -> ^6.0.2 | Modify | MEDIUM |
| `tsconfig.json` | Add `"types": ["node"]` to compilerOptions | Modify | LOW |
| `vitest-globals.d.ts` or tsconfig types | Add vitest globals type declarations | New or Modify | LOW |

### What About the `next` Plugin?

The `next` tsconfig plugin (`"plugins": [{ "name": "next" }]`) handles React/JSX type augmentation in the IDE. The explicit `types` array should not interfere. However, `@types/react` and `@types/react-dom` may need to be listed if `tsc --noEmit` reports JSX errors after the upgrade. Test empirically.

### Validation

```bash
npx tsc --noEmit    # Zero errors (currently has 10 false positives in test files)
npm run build       # Next.js builds successfully
npm run test        # All tests pass
npm run lint        # No new lint errors
```

---

## Dependency Graph and Build Order

```
Independent concerns (no cross-dependencies):

  [1] Remove CopyButton          (pure deletion, zero risk)
  [2] Relocate proxy test        (pure file move, zero risk)

Concerns with validation dependencies:

  [3] Shiki v4 + rehype-pretty-code upgrade
      -> Must validate syntax highlighting output before proceeding
      -> Upgrade both together (shiki + rehype-pretty-code)

  [4] TypeScript 6 upgrade
      -> Touches tsconfig.json (shared by all compilation)
      -> Should be done AFTER shiki/rehype upgrade to avoid debugging two things at once
      -> Fixes test file false positives as a bonus

  [5] API route handler tests
      -> New test files only, no source changes
      -> Best AFTER TypeScript 6 upgrade so new tests are written against final tsconfig
```

### Recommended Build Order

```
Phase 1: Safe deletions and moves (no source logic changes)
  |- Remove CopyButton + copy-button.test.tsx
  |- Move security-headers.test.ts -> proxy.test.ts

Phase 2: Dependency upgrades
  |- Shiki v4 + rehype-pretty-code 0.14.3
  |- Minor/patch dependency updates (tailwindcss, tailwind-merge, @types/*, etc.)

Phase 3: TypeScript 6 upgrade
  |- Bump typescript to ^6.0.2
  |- Add types array to tsconfig.json
  |- Fix vitest globals type discovery
  |- Validate with tsc --noEmit (target: zero errors)

Phase 4: New test coverage
  |- API route handler tests (batch GET, single GET, POST)
  |- CodeBlockEnhancer tests (DOM mutation testing with jsdom)
  |- OG image font path existence test

Phase 5: Remaining cleanup
  |- Evaluate react-hooks/set-state-in-effect suppressions
  |- Address any issues surfaced by TypeScript 6 stricter checking
```

**Rationale:** Deletions first (reduce noise, clean test counts), then upgrades (stabilize dependencies), then TypeScript (compiler changes affect everything), then new code (tests written against final stack). TypeScript 6 before new tests ensures new test files are validated by the updated compiler from the start.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Upgrading Shiki Without rehype-pretty-code
**What:** Bumping shiki to v4 while keeping rehype-pretty-code at 0.14.1.
**Why bad:** rehype-pretty-code 0.14.1 may have a shiki peer dependency pinned to ^3.x, causing peer dep warnings or subtle runtime incompatibilities.
**Instead:** Upgrade both simultaneously: `shiki@^4.0.2` + `rehype-pretty-code@^0.14.3`.

### Anti-Pattern 2: Adding Types Array Without Testing
**What:** Adding `"types": ["node"]` to tsconfig without running `tsc --noEmit`.
**Why bad:** May miss types that were auto-discovered before (e.g., `@testing-library/jest-dom` matchers, React JSX types).
**Instead:** Run `tsc --noEmit` after adding the types array, fix any new errors iteratively.

### Anti-Pattern 3: Writing Route Handler Tests That Hit Real Redis
**What:** Not mocking `@/lib/redis` in API route tests.
**Why bad:** Tests become flaky, require env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), and mutate production data.
**Instead:** Always mock the redis module. Test handler logic (request parsing, response formatting, dedup flow), not the Redis client.

### Anti-Pattern 4: Removing CopyButton Tests Without Planning CodeBlockEnhancer Coverage
**What:** Deleting 3 copy-button tests without planning CodeBlockEnhancer tests.
**Why bad:** Net loss of copy-button-related test coverage. The orphaned tests are misleading, but the gap should be filled.
**Instead:** Schedule CodeBlockEnhancer tests in the same milestone (Phase 4 in the build order above).

### Anti-Pattern 5: TypeScript 6 Upgrade Before Dependency Upgrades
**What:** Upgrading TypeScript before updating `@types/node`, `@types/react`, `@types/react-dom`.
**Why bad:** Older `@types` packages may have incompatibilities with TypeScript 6. If both break simultaneously, debugging is harder.
**Instead:** Update `@types/*` packages as part of the minor/patch dependency sweep (Phase 2), then upgrade TypeScript (Phase 3).

---

## Component Boundaries Summary

### New Files

| File | Type | Purpose |
|------|------|---------|
| `src/proxy.test.ts` | Test | Relocated proxy tests (co-located) |
| `src/app/api/views/route.test.ts` | Test | Batch GET handler tests |
| `src/app/api/views/[slug]/route.test.ts` | Test | Single GET + POST handler tests |
| `vitest-globals.d.ts` (or tsconfig change) | Config | Vitest globals type declarations |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/blog/copy-button.tsx` | Orphaned by v1.7 MDX migration |
| `src/components/blog/copy-button.test.tsx` | Tests for orphaned component |
| `src/lib/security-headers.test.ts` | Relocated to `src/proxy.test.ts` |

### Modified Files

| File | Nature of Change |
|------|-----------------|
| `package.json` | Dependency version bumps (shiki, rehype-pretty-code, typescript, @types/*) |
| `tsconfig.json` | Add `types` array for TypeScript 6 compatibility |

### Unchanged Files

| File | Why Unchanged |
|------|--------------|
| `velite.config.ts` | `createCssVariablesTheme` API unchanged in shiki v4 |
| `src/app/globals.css` | --shiki-* variables unchanged |
| `src/proxy.ts` | Security headers middleware untouched |
| `src/components/blog/code-block-enhancer.tsx` | Independent of CopyButton removal |
| `src/components/blog/mdx-content.tsx` | No MDX pipeline changes in v1.8 |
| All page components | No rendering changes |

---

## Scalability Considerations

| Concern | Impact | Notes |
|---------|--------|-------|
| Shiki v4 bundle size | Negligible | Build-time only (Velite), not shipped to client |
| TypeScript 6 build time | May improve slightly | Stricter defaults can enable more optimizations |
| New test files | Adds ~15-20s to test suite | Acceptable for 3 new test files |
| Dependency update frequency | Same as before | Patch/minor updates are low-risk going forward |

No scaling concerns for any of these changes.

## Sources

- [Shiki v4.0 Blog Post](https://shiki.style/blog/v4) -- breaking changes documentation (HIGH confidence)
- [Shiki Migration Guide](https://shiki.style/guide/migrate) -- version-by-version migration paths (HIGH confidence)
- [Shiki Theme Colors / CSS Variables](https://shiki.style/guide/theme-colors) -- createCssVariablesTheme documentation (HIGH confidence)
- [TypeScript 6.0 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) -- official breaking changes (HIGH confidence)
- [TypeScript 5.x to 6.0 Migration Guide](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f) -- community migration checklist (MEDIUM confidence)
- [Next.js Vitest Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest) -- official testing documentation (HIGH confidence)
- [rehype-pretty-code](https://rehype-pretty.pages.dev/) -- plugin documentation (HIGH confidence)
- [Next.js App Router Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) -- API route handler documentation (HIGH confidence)

---
*Architecture research for: keech.dev v1.8 concerns cleanup milestone*
*Researched: 2026-04-05*
