# Phase 22: TypeScript 6 Upgrade - Research

**Researched:** 2026-04-05
**Domain:** TypeScript compiler upgrade (5.9.3 to 6.x)
**Confidence:** HIGH

## Summary

TypeScript 6.0.2 is the current latest release and represents the final JavaScript-based compiler before the Go rewrite in TS7. The upgrade path for this project is exceptionally clean because the existing tsconfig.json already uses modern settings that align with TS6 defaults: `strict: true`, `module: "esnext"`, `moduleResolution: "bundler"`, `isolatedModules: true`, and explicit `types: ["vitest/globals"]`. The project does not use any removed or deprecated features (no `baseUrl`, no `import * as`, no import assertions, no legacy module syntax).

The primary changes needed are: (1) install TypeScript 6.0.2, (2) run ts5to6 migration tool (expected to be a no-op given current config), (3) remove `esModuleInterop` since it is always-on in TS6, (4) verify the `noUncheckedSideEffectImports` default does not break CSS side-effect imports (Next.js provides `declare module '*.css' {}` via its type references), and (5) validate the full toolchain.

**Primary recommendation:** Install TS 6.0.2, run `npx @andrewbranch/ts5to6`, clean up deprecated options from tsconfig.json, then validate with the four-step sequence (tsc, build, test, lint).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Run the official `ts5to6` migration tool first to handle automated codemods, then fix any remaining issues manually
- **D-02:** Perform the upgrade in a single atomic step -- install TS6, run migration tool, fix errors, validate -- not incremental
- **D-03:** Accept new TS6 compiler defaults where they align with current settings (e.g., if TS6 changes defaults for options already set explicitly in tsconfig.json)
- **D-04:** Only add explicit overrides where needed for Next.js or Velite compatibility -- don't fight the new defaults unnecessarily
- **D-05:** Keep `skipLibCheck: true` -- focus validation on project source code, not third-party type definitions
- **D-06:** Validate in order: `npx tsc --noEmit` (compiler) -> `npm run build` (Velite + Next.js) -> `npm run test` (Vitest) -> `npm run lint` (ESLint) -- fix issues at each stage before proceeding
- **D-07:** All four checks must pass with zero errors and zero warnings before the phase is complete
- **D-08:** Fix source code to satisfy TS6 type rules -- do not add `@ts-ignore`, `@ts-expect-error`, or weaken strictness settings
- **D-09:** If a third-party dependency's types are incompatible with TS6 (e.g., Velite, next), check for updated type packages first; `skipLibCheck` covers remaining library-level issues

### Claude's Discretion
- Exact ts5to6 CLI flags and invocation
- Whether to update `module`/`moduleResolution` values if TS6 introduces new options
- Order of manual fixes after migration tool runs
- Whether tsconfig `target` should change from ES2022

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPS-05 | Upgrade TypeScript to 6.x, run ts5to6 migration tool, validate with tsc --noEmit | Full breaking change analysis completed; ts5to6 tool documented; four-step validation sequence mapped |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | 6.0.2 | TypeScript compiler | Latest stable; last JS-based release before Go rewrite [VERIFIED: npm registry] |
| @andrewbranch/ts5to6 | 1.1.1 | Migration CLI tool | Official migration tool by TS team member; handles baseUrl and rootDir changes [VERIFIED: npm registry] |

### Supporting
No additional libraries needed -- this is a compiler-only upgrade.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ts5to6 | Manual tsconfig edits | ts5to6 automates baseUrl/rootDir changes; safe to run even when no changes needed |

**Installation:**
```bash
npm install --save-dev typescript@^6.0.2
```

**Version verification:**
- `typescript@6.0.2` published to npm [VERIFIED: npm registry, 2026-04-05]
- `@andrewbranch/ts5to6@1.1.1` published to npm [VERIFIED: npm registry, 2026-04-05]

## Architecture Patterns

### Current tsconfig.json vs. TS6 Defaults Impact Analysis

This is the critical analysis. The project's current `tsconfig.json` settings are compared against TS6 default changes:

| Option | Current Value | TS6 Default | Impact |
|--------|---------------|-------------|--------|
| `strict` | `true` (explicit) | `true` | NONE -- already aligned |
| `target` | `"ES2022"` (explicit) | `"es2025"` | NONE -- explicit value preserved |
| `module` | `"esnext"` (explicit) | `"esnext"` | NONE -- already aligned |
| `moduleResolution` | `"bundler"` (explicit) | `"bundler"` | NONE -- already aligned |
| `types` | `["vitest/globals"]` (explicit) | `[]` | NONE -- explicit value preserved |
| `esModuleInterop` | `true` (explicit) | always-on (cannot be set to false) | CLEANUP -- can remove, now always-on |
| `isolatedModules` | `true` (explicit) | N/A | NONE -- still valid |
| `noUncheckedSideEffectImports` | not set | `true` | VERIFY -- CSS imports must resolve (see Pitfalls) |
| `rootDir` | not set | `.` (tsconfig dir) | NONE -- project uses `noEmit: true`, rootDir only affects output |
| `baseUrl` | not set | deprecated | NONE -- not used |

**Key finding:** This project is almost perfectly aligned with TS6 already. The only tsconfig change is removing `esModuleInterop` (now always-on). [VERIFIED: official TS6 announcement blog]

### Deprecated Options in Current Config
| Option | Status in TS6 | Action |
|--------|---------------|--------|
| `esModuleInterop: true` | Always-on, setting it generates deprecation warning | Remove from tsconfig.json |

### ts5to6 Tool Expected Behavior
The tool operates on two flags: `--fixBaseUrl` and `--fixRootDir`. Since this project:
- Has NO `baseUrl` -- `--fixBaseUrl` is a no-op
- Uses `noEmit: true` (no output directory) -- `--fixRootDir` has no practical effect

Running ts5to6 is still worth doing per D-01 to confirm there are no edge cases, but expect zero changes. [CITED: https://github.com/andrewbranch/ts5to6]

### Discretion Recommendations

**module/moduleResolution:** Keep current values (`"esnext"` / `"bundler"`). These are already the TS6 defaults and work correctly with Next.js + Turbopack. No reason to change. [ASSUMED]

**target:** Keep `"ES2022"`. While TS6 defaults to `es2025`, the explicit ES2022 is fine -- it does not affect runtime behavior since `noEmit: true` means TypeScript does not transpile output. Changing to `es2025` would only add newer lib types (RegExp.escape, Temporal API) which are not needed. [ASSUMED]

### Anti-Patterns to Avoid
- **Adding `ignoreDeprecations: "6.0"`:** This is a temporary escape hatch. The project has no deprecated patterns that need it -- do not add it.
- **Changing `target` to `es2025` without purpose:** Only matters for emit and lib types; no benefit for a `noEmit` project.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| tsconfig migration | Manual analysis of every option | `npx @andrewbranch/ts5to6` | Handles edge cases in extends chains and project references |

**Key insight:** The ts5to6 tool is authoritative because it was built by a TypeScript team member (Andrew Branch) specifically for this migration. Even if the project appears clean, running it catches edge cases. [CITED: https://github.com/andrewbranch/ts5to6]

## Common Pitfalls

### Pitfall 1: CSS Side-Effect Imports with noUncheckedSideEffectImports
**What goes wrong:** TS6 defaults `noUncheckedSideEffectImports` to `true`. Side-effect imports like `import "./globals.css"` will error if TypeScript cannot resolve the module.
**Why it happens:** CSS files are not TypeScript modules -- they need ambient declarations.
**How to avoid:** Next.js provides `declare module '*.css' {}` via `next/types/global.d.ts`, which is included through `next-env.d.ts`'s `/// <reference types="next" />`. This should satisfy the check. If it does NOT, add `"noUncheckedSideEffectImports": false` to tsconfig.json.
**Warning signs:** `tsc --noEmit` errors on `import "./globals.css"` in `layout.tsx` or `global-error.tsx`.
**Files affected:** `src/app/layout.tsx` (line 6), `src/app/global-error.tsx` (line 5). [VERIFIED: codebase grep]

### Pitfall 2: esModuleInterop Deprecation Warning Noise
**What goes wrong:** Keeping `esModuleInterop: true` in tsconfig generates a deprecation warning (the option is always-on now).
**Why it happens:** TS6 made the behavior permanent and the explicit setting is now deprecated.
**How to avoid:** Remove `esModuleInterop` from tsconfig.json entirely.
**Warning signs:** Deprecation warnings during `tsc --noEmit` or build. [CITED: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/]

### Pitfall 3: Velite Type Compilation
**What goes wrong:** Velite 0.3.1 may have internal `.d.ts` files that use patterns incompatible with TS6.
**Why it happens:** Velite is pinned at 0.3.1 (no semver range), and it may not have been tested against TS6.
**How to avoid:** `skipLibCheck: true` (already set per D-05) means TypeScript skips checking third-party `.d.ts` files. The project's own `velite.config.ts` uses standard TypeScript that should compile fine.
**Warning signs:** Errors pointing to `node_modules/velite/` files -- `skipLibCheck` should prevent these. [ASSUMED]

### Pitfall 4: Build Step Order Matters
**What goes wrong:** Running `npm run build` before verifying `tsc --noEmit` wastes time on a long build that may fail.
**Why it happens:** Velite compiles first, then Next.js -- if TypeScript errors exist, you get them late.
**How to avoid:** Follow D-06 validation sequence: `tsc --noEmit` first, then build. [VERIFIED: CONTEXT.md D-06]

### Pitfall 5: Vitest/ESLint Plugin TypeScript Version Detection
**What goes wrong:** Vitest or ESLint plugins may cache or detect the TypeScript version and behave differently.
**Why it happens:** Some plugins inspect `typescript` package version at startup.
**How to avoid:** Run `npm run test` and `npm run lint` after install to verify plugins work correctly with TS6.
**Warning signs:** Plugin initialization errors or unexpected type checking behavior in tests. [ASSUMED]

## Code Examples

### tsconfig.json After Migration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals"],
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/.velite": ["./.velite"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```
Changes from current: `esModuleInterop` removed (always-on in TS6). All other options preserved. [VERIFIED: current tsconfig.json analysis]

### Validation Commands (in order per D-06)
```bash
# Step 1: Compiler check
npx tsc --noEmit

# Step 2: Full build (Velite + Next.js)
npm run build

# Step 3: Unit tests
npm run test

# Step 4: Lint
npm run lint
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `esModuleInterop: true/false` | Always-on (remove from config) | TS 6.0 (March 2026) | Remove from tsconfig |
| `moduleResolution: "node"` | Removed; use `"nodenext"` or `"bundler"` | TS 6.0 | No impact (already using `"bundler"`) |
| `target: "es5"` | Deprecated; minimum `"es2015"` | TS 6.0 | No impact (using `"ES2022"`) |
| Auto-discover `@types/*` | `types` defaults to `[]` | TS 6.0 | No impact (already explicit `types` array) |
| `strict` defaults to `false` | Defaults to `true` | TS 6.0 | No impact (already explicit `strict: true`) |

**Deprecated/outdated:**
- `esModuleInterop` option: always-on in TS6, setting it generates deprecation warning
- `baseUrl` for module resolution: deprecated in TS6, hard removal in TS7 (not used by this project)
- Import assertions (`assert {}`): deprecated, use `with {}` instead (not used by this project)
- `module Foo {}` syntax: use `namespace Foo {}` (not used by this project)

[CITED: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Keeping `module: "esnext"` and `moduleResolution: "bundler"` is correct for Next.js 16 on TS6 | Discretion Recommendations | Low -- these are TS6 defaults and widely used |
| A2 | Keeping `target: "ES2022"` is fine since `noEmit: true` means no transpilation | Discretion Recommendations | Low -- target only affects emit and lib types |
| A3 | Velite 0.3.1 internal types may have TS6 incompatibilities | Pitfall 3 | Low -- `skipLibCheck: true` mitigates this entirely |
| A4 | Vitest/ESLint plugins may detect TS version at startup | Pitfall 5 | Low -- would surface immediately during validation |

## Open Questions

1. **noUncheckedSideEffectImports + CSS imports**
   - What we know: TS6 defaults this to `true`. Next.js provides `declare module '*.css' {}` via its type references. Two files use CSS side-effect imports.
   - What's unclear: Whether `tsc --noEmit` will properly resolve the CSS declarations through the `/// <reference types="next" />` chain with this new default.
   - Recommendation: Run `tsc --noEmit` first. If CSS imports fail, add `"noUncheckedSideEffectImports": false` to tsconfig.json as a targeted override per D-04.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test && npm run lint && npx tsc --noEmit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPS-05a | TypeScript 6 compiles with zero errors | smoke | `npx tsc --noEmit` | N/A (CLI check) |
| DEPS-05b | Build produces static pages | smoke | `npm run build` | N/A (CLI check) |
| DEPS-05c | Unit tests pass | regression | `npm run test` | Existing test suite |
| DEPS-05d | Lint passes with zero warnings | regression | `npm run lint` | Existing ESLint config |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (fast compiler check)
- **Per wave merge:** Full validation sequence (tsc + build + test + lint)
- **Phase gate:** All four checks green before verification

### Wave 0 Gaps
None -- existing test infrastructure and CLI commands cover all phase requirements. No new test files needed for a compiler upgrade.

## Security Domain

Not applicable -- this phase changes only the TypeScript compiler version. No new attack surface, no API changes, no runtime behavior changes. All security headers, CSP, rate limiting, and input validation remain unchanged.

## Sources

### Primary (HIGH confidence)
- [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) - Breaking changes, new defaults, deprecated options
- [TypeScript 6.0 migration guide issue](https://github.com/microsoft/TypeScript/issues/62508) - Official migration steps
- [ts5to6 GitHub repository](https://github.com/andrewbranch/ts5to6) - CLI tool documentation and usage
- npm registry - typescript@6.0.2, @andrewbranch/ts5to6@1.1.1 version verification
- Codebase analysis - tsconfig.json, package.json, source file grep for deprecated patterns

### Secondary (MEDIUM confidence)
- [privatenumber migration gist](https://gist.github.com/privatenumber/3d2e80da28f84ee30b77d53e1693378f) - Community migration guide cross-referenced with official docs
- [Next.js noUncheckedSideEffectImports discussion](https://github.com/vercel/next.js/discussions/84317) - CSS import workaround

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm registry verified, official Microsoft release
- Architecture: HIGH - direct analysis of current tsconfig vs TS6 defaults, all options mapped
- Pitfalls: HIGH for 1-4 (documented in official sources), MEDIUM for 5 (assumed based on general plugin behavior)

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable -- TS6 is released, breaking changes are documented)
