# Quick Task: Broken npm run lint - Research

**Researched:** 2026-04-03
**Confidence:** HIGH

## Summary

Two distinct issues are causing `npm run lint` to fail:

1. **`next lint` was removed in Next.js 16.** The `lint` script calls `next lint`, but Next.js 16 dropped this subcommand entirely. Next.js interprets `next lint` as `next [directory]` and fails with "Invalid project directory provided, no such directory: .../lint".

2. **`eslint.config.mjs` uses `FlatCompat` to wrap configs that are already flat.** `eslint-config-next` v16.1.6 exports native flat config (`Linter.Config[]`), not legacy `.eslintrc`-style objects. Wrapping them through `@eslint/eslintrc`'s `FlatCompat.extends()` causes a circular reference error: `TypeError: Converting circular structure to JSON`.

Both issues have the same root cause: the ESLint setup was scaffolded for an older Next.js version (pre-16) and was not updated when Next.js 16 dropped `next lint` and `eslint-config-next` moved to native flat config.

## Root Cause Analysis

### Issue 1: `next lint` removed (Confidence: HIGH)

- `next --help` lists: build, dev, start, info, telemetry, typegen, upgrade, experimental-test, experimental-analyze. No `lint`.
- Next.js 16 removed the built-in lint command, expecting projects to use `eslint` directly.
- The `package.json` script `"lint": "next lint"` is now broken.

### Issue 2: FlatCompat wrapping flat config (Confidence: HIGH)

Current `eslint.config.mjs`:
```js
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: __dirname });
const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];
```

`eslint-config-next` 16.1.6 type signature:
```ts
// node_modules/eslint-config-next/dist/core-web-vitals.d.ts
import type { Linter } from 'eslint';
declare const config: Linter.Config[];  // Already flat config!
export = config;
```

`FlatCompat.extends()` expects legacy config objects. Feeding it flat config arrays triggers circular JSON serialization in the config validator.

## Fix

Two changes required:

### 1. Update `package.json` lint script

```json
"lint": "eslint ."
```

Or more targeted:
```json
"lint": "eslint src/"
```

### 2. Rewrite `eslint.config.mjs` to use native imports

```js
import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

export default [
  ...coreWebVitals,
  ...typescript,
];
```

This eliminates the `FlatCompat` wrapper entirely. The `@eslint/eslintrc` package can be removed from devDependencies afterward.

### 3. Cleanup

Remove `@eslint/eslintrc` from devDependencies:
```bash
npm uninstall @eslint/eslintrc
```

## Common Pitfalls

### Pitfall 1: Linting the `.velite/` directory
**What goes wrong:** ESLint may try to lint generated files in `.velite/`.
**How to avoid:** Add an ignore pattern to the config:
```js
export default [
  { ignores: [".velite/"] },
  ...coreWebVitals,
  ...typescript,
];
```

### Pitfall 2: Import resolution for path aliases
**What goes wrong:** `eslint-plugin-import` may not resolve `@/*` or `@/.velite` aliases.
**How to avoid:** The `eslint-config-next` package includes `eslint-import-resolver-typescript` which reads `tsconfig.json` paths. This should work automatically. If not, verify `tsconfig.json` has the path aliases defined.

## Verification

After applying the fix, run:
```bash
npm run lint
```

Expected: ESLint runs successfully with zero or only legitimate lint warnings/errors. No "invalid directory" or "circular structure" errors.

## Sources

### Primary (HIGH confidence)
- Direct inspection of `next --help` output (Next.js 16.2.2) -- no `lint` subcommand
- Direct inspection of `eslint-config-next@16.1.6` dist type declarations -- native flat config exports
- `npm run lint` error output -- "Invalid project directory provided"
- `npx eslint .` error output -- "Converting circular structure to JSON"
