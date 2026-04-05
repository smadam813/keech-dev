# Technology Stack: v1.8 Concerns Cleanup

**Project:** keech.dev
**Researched:** 2026-04-05
**Focus:** Dependency upgrades, compatibility matrices, and TypeScript configuration fixes

## Upgrade Decision Matrix

### Safe to Upgrade (Do It)

| Package | Current | Target | Risk | Rationale |
|---------|---------|--------|------|-----------|
| `shiki` | 3.22.0 | 4.0.2 | LOW | Only removes deprecated API typos (`createdBundledHighlighter` -> `createBundledHighlighter`). `createCssVariablesTheme` is unaffected -- still available and unchanged. Requires Node >= 20 (project uses 22.21.0). |
| `rehype-pretty-code` | 0.14.1 | 0.14.3 | LOW | Patch release that adds shiki 4 compatibility. Must upgrade alongside shiki 4. |
| `lucide-react` | 0.563.0 | 1.7.0 | LOW | Breaking changes: removed UMD build (irrelevant for Next.js), removed brand icons (project uses Github/ExternalLink/ArrowLeft/Menu/X/ChevronDown -- none are brand icons), `aria-hidden=true` default (correct for decorative icon usage here). Named icon imports unchanged. |
| `@vercel/analytics` | 1.6.1 | 2.0.1 | LOW | Breaking changes are license change (MPL-2.0 to MIT) and Nuxt module restructure. Neither affects a Next.js project. Drop-in upgrade. |
| `typescript` | 5.9.3 | 6.0.2 | LOW-MEDIUM | Project tsconfig already uses `strict: true`, `module: esnext`, `moduleResolution: bundler`, `target: ES2022` -- all compatible with TS6. Key change: `types` defaults to `[]` instead of auto-enumerating `@types/*`. This pairs naturally with the Vitest globals fix. Migration tool available: `npx @andrewbranch/ts5to6`. |
| `tailwindcss` | 4.1.18 | 4.2.2 | LOW | Minor version within v4. New utilities added but no breaking changes for existing CSS-first config with `@theme` directive. |
| `@tailwindcss/postcss` | 4.1.18 | 4.2.2 | LOW | Tracks tailwindcss version. Upgrade together. |
| `tailwind-merge` | 3.4.0 | 3.5.0 | LOW | Minor version. Additive changes only. |
| `@upstash/redis` | 1.36.2 | 1.37.0 | LOW | Minor version. Additive changes only. |
| `@types/node` | 25.1.0 | 25.5.2 | LOW | Type definition updates. No runtime impact. |
| `@types/react` | 19.2.10 | 19.2.14 | LOW | Type definition updates. No runtime impact. |

### Do NOT Upgrade (Blocked)

| Package | Current | Latest | Risk | Rationale |
|---------|---------|--------|------|-----------|
| `eslint` | 9.39.2 | 10.2.0 | HIGH | `eslint-config-next` does NOT support ESLint 10 yet. Upstream plugins (`eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`) have unresolved peer dependency conflicts. Next.js team tracking at vercel/next.js#89764, closed as "tracking upstream" with no fix shipped. Upgrading breaks the entire lint pipeline. |

### Leave Alone (No Concern)

| Package | Current | Why |
|---------|---------|-----|
| `velite` | 0.3.1 (exact pin) | Pre-release 0.x. Pinned intentionally per v1.7 decision. Check changelog periodically but do not upgrade in this milestone. |
| `eslint-config-next` | 16.2.2 | Already synced with next@16.2.2. Will need updating when ESLint 10 support ships. |
| `next` | 16.2.2 | No upgrade concern flagged. |
| `react` / `react-dom` | 19.2.4 | No upgrade concern flagged. |

## Compatibility Matrix: Shiki + rehype-pretty-code

This is the critical coupled upgrade. These two packages share an integration surface.

| rehype-pretty-code | shiki 3.x | shiki 4.x |
|--------------------|-----------|-----------|
| 0.14.1 (current) | YES | NO |
| 0.14.3 (target) | YES | YES |

**What the project uses from shiki:** `createCssVariablesTheme` imported from `shiki` in `velite.config.ts`. This function:
- Is NOT deprecated in shiki 4
- Is NOT one of the removed typo APIs
- Takes the same parameters (`name`, `variablePrefix`, `variableDefaults`)
- The project's existing `velite.config.ts` requires zero code changes

**What shiki 4 actually removes:**
1. `CreatedBundledHighlighterOptions` (typo) -> `CreateBundledHighlighterOptions` -- not used
2. `createdBundledHighlighter` (typo) -> `createBundledHighlighter` -- not used
3. `theme` option in `TwoslashFloatingVue` -> `themes` -- not used
4. CSS class `twoslash-query-presisted` (typo) -> `twoslash-query-persisted` -- not used

**Verdict:** Upgrade both together. No code changes needed in `velite.config.ts`.

## Upgrade Execution Order

Dependencies have compatibility chains. Execute in this order to isolate failures.

### Batch 1: Minor/Patch Updates (Zero Risk)

```bash
npm install tailwindcss@^4.2.2 @tailwindcss/postcss@^4.2.2 tailwind-merge@^3.5.0 @upstash/redis@^1.37.0
npm install -D @types/node@^25.5.2 @types/react@^19.2.14
```

Verify: `npm run build && npm run test`

### Batch 2: Shiki + rehype-pretty-code (Coupled Pair)

These MUST upgrade together. rehype-pretty-code 0.14.3 declares shiki 4 peer compatibility.

```bash
npm install shiki@^4.0.2 rehype-pretty-code@^0.14.3
```

Verify: `npm run velite` (confirms syntax highlighting pipeline works), then `npm run build && npm run test`

**What to validate:** Run `npm run velite` and inspect a compiled post's HTML output -- token `<span>` elements should still have CSS variable-based styling via class names. The `createCssVariablesTheme` in `velite.config.ts` needs zero changes.

### Batch 3: lucide-react (Isolated)

```bash
npm install lucide-react@^1.7.0
```

Verify: `npm run build` (checks all icon imports resolve)

**Consumers after CopyButton removal** (which is a separate concern):
- `src/components/layout/header.tsx`: Menu, X
- `src/components/layout/footer.tsx`: Github, Linkedin
- `src/components/blog/mobile-toc.tsx`: ChevronDown
- `src/components/projects/project-card.tsx`: Github, ExternalLink
- `src/app/blog/[slug]/page.tsx`: ArrowLeft
- `src/app/projects/[slug]/page.tsx`: ArrowLeft, Github, ExternalLink

None are brand icons (Github is specifically retained in lucide v1). All named imports work identically. The only behavioral change is `aria-hidden="true"` defaulting on -- correct for these decorative usages.

### Batch 4: @vercel/analytics (Isolated)

```bash
npm install @vercel/analytics@^2.0.1
```

Verify: `npm run build` (no API changes for Next.js usage)

### Batch 5: TypeScript 6 (Broadest Impact -- Upgrade Last)

Upgrade last because it may surface new type errors that are easier to diagnose after other upgrades are stable.

```bash
npx @andrewbranch/ts5to6        # Run migration tool first -- audits tsconfig
npm install -D typescript@^6.0.2
```

**Required tsconfig.json change:**

```json
{
  "compilerOptions": {
    "types": ["node", "vitest/globals"]
  }
}
```

Verify: `npx tsc --noEmit` (should show zero errors), then `npm run build && npm run test && npm run lint`

## TypeScript 6 Impact Analysis

### Why This Project Is Well-Positioned

The existing `tsconfig.json` already aligns with TypeScript 6 defaults and requirements:

| Setting | Current Value | TS6 Default | Impact |
|---------|--------------|-------------|--------|
| `strict` | `true` | `true` (new default) | None -- already set |
| `target` | `ES2022` | `es2025` (new default) | None -- ES2022 still valid (minimum is ES2015) |
| `module` | `esnext` | `esnext` (new default) | None -- already set |
| `moduleResolution` | `bundler` | Varies | None -- explicitly supported |
| `esModuleInterop` | `true` | Can no longer be `false` | None -- already `true` |
| `isolatedModules` | `true` | Still supported | None |

### What Needs Attention

1. **`types` field (REQUIRED):** TS6 defaults `types` to `[]` instead of auto-enumerating `@types/*`. Must explicitly add `"node"` and `"vitest/globals"`. This is also the fix for the Vitest globals tsc error concern.

2. **`noUncheckedSideEffectImports: true` (new default):** May flag bare `import './globals.css'` or similar side-effect-only imports if the file doesn't resolve. Verify with `tsc --noEmit` after upgrade.

3. **Migration tool:** `npx @andrewbranch/ts5to6` automates mechanical changes. Run it first to see what it recommends before manually editing.

### Removed Options (NOT Used By Project)

These removals do not affect this project:
- `--target es5` -- project uses ES2022
- `--moduleResolution classic` / `node10` -- project uses `bundler`
- `--module amd/umd/system/none` -- project uses `esnext`
- `--outFile` -- not used
- `--downlevelIteration` -- not used

## Vitest Globals tsconfig Fix

This resolves the "TypeScript: Test Files Report False tsc Errors" concern from CONCERNS.md.

**Problem:** `npx tsc --noEmit` reports `TS2304 Cannot find name 'afterEach'` in `src/hooks/use-glow-positions.test.ts` and `src/hooks/use-hero-animation.test.ts` because Vitest globals are injected at runtime (via `globals: true` in `vitest.config.ts`) but TypeScript has no type declarations for them.

**Fix:** Add `"vitest/globals"` to `compilerOptions.types` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["node", "vitest/globals"]
  }
}
```

**Why `"node"` must be included too:** When you set `types` explicitly, TypeScript ONLY loads the listed type packages. Omitting `"node"` would remove all Node.js type declarations (`process`, `Buffer`, `__dirname`, etc.), breaking non-test code.

**With TypeScript 5 vs 6:** The fix is identical either way. TS5 auto-discovers `@types/*` when `types` is unset, but once you set it, behavior is the same as TS6. TS6 just makes the explicit declaration mandatory.

**Note:** The `TS7009` and `TS2345` errors in `src/app/error.test.tsx` are a separate issue -- those are caused by passing `Error` objects where the component typing expects `{ error: Error; reset: () => void }` as props. That requires a code fix in the test file, not a tsconfig change.

## Confidence Assessment

| Decision | Confidence | Source |
|----------|------------|--------|
| Shiki 4 + rehype-pretty-code 0.14.3 safe together | HIGH | Shiki v4 blog post, rehype-pretty-code GitHub releases |
| `createCssVariablesTheme` unchanged in shiki 4 | HIGH | Shiki theme-colors docs, v4 blog post (not listed in removals) |
| ESLint 10 blocked by eslint-config-next | HIGH | GitHub issue #91702 confirms unresolved peer deps |
| TypeScript 6 safe for this tsconfig | HIGH | Official TS6 announcement; all project settings are supported |
| lucide-react 1.0 safe for project icons | HIGH | Official version-1 guide; no brand icons or UMD usage |
| @vercel/analytics 2.0 drop-in for Next.js | HIGH | GitHub releases; breaking changes only affect Nuxt |
| Vitest globals fix via `types` field | HIGH | Standard Vitest documentation pattern |
| Tailwind 4.1 -> 4.2 safe | MEDIUM | No documented breaking changes; CSS-first config unaffected |
| `noUncheckedSideEffectImports` impact | LOW | New TS6 default; needs validation with `tsc --noEmit` |

## Sources

- [Shiki v4.0 Blog Post](https://shiki.style/blog/v4) -- breaking changes list, Node.js 20 requirement
- [Shiki Migration Guide](https://shiki.style/guide/migrate) -- v3 to v4 section
- [Shiki Theme Colors / createCssVariablesTheme](https://shiki.style/guide/theme-colors) -- confirms function availability
- [TypeScript 6.0 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) -- breaking changes, new defaults, removed options
- [TypeScript 5.x to 6.0 Migration Guide (community)](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f)
- [ts5to6 Migration Tool](https://github.com/nicolo-ribaudo/ts5to6) -- `npx @andrewbranch/ts5to6`
- [Lucide Version 1 Guide](https://lucide.dev/guide/version-1) -- breaking changes, brand icon removal
- [ESLint v10 Migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0) -- official migration docs
- [eslint-config-next ESLint 10 Issue](https://github.com/vercel/next.js/issues/91702) -- blocked status
- [rehype-pretty-code Releases](https://github.com/rehype-pretty/rehype-pretty-code/releases) -- shiki 4 compatibility in 0.14.3
- [Vercel Analytics Releases](https://github.com/vercel/analytics/releases) -- v2.0 breaking changes
- [Tailwind CSS Releases](https://github.com/tailwindlabs/tailwindcss/releases) -- 4.2 changelog
