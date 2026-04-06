# Phase 20: Dead Code & Test Hygiene - Research

**Researched:** 2026-04-05
**Domain:** TypeScript codebase cleanup (dead code removal, test relocation, tsconfig fixes)
**Confidence:** HIGH

## Summary

This phase is a well-scoped cleanup with four discrete tasks: delete orphaned CopyButton files, keep lucide-react (6 other consumers confirmed), relocate a misplaced test file, and fix tsconfig to eliminate false `tsc --noEmit` errors. All targets are concrete and verified against the current codebase.

The current `tsc --noEmit` output shows exactly 10 errors: 2 `afterEach` not found errors (fixable by adding `vitest/globals` to tsconfig types) and 8 errors in `error.test.tsx` caused by the default import `Error` shadowing the global `Error` constructor. Both categories have straightforward fixes documented below.

**Primary recommendation:** Execute as a single plan with sequential tasks -- delete files first, relocate test, fix tsconfig, then validate everything passes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Delete `src/components/blog/copy-button.tsx` and `src/components/blog/copy-button.test.tsx` -- orphaned code
- **D-02:** Do NOT remove lucide-react -- 6 other source files import from it
- **D-03:** Move `src/lib/security-headers.test.ts` to `src/proxy.test.ts` with corrected import path
- **D-04:** Update import paths in relocated test to reference `./proxy`
- **D-05:** Add `"vitest/globals"` to `compilerOptions.types` array in `tsconfig.json`
- **D-06:** Investigate and fix type mismatches in error.test.tsx as part of the same pass

### Claude's Discretion
- Whether to add other type references (e.g., `@testing-library/jest-dom`) to tsconfig types alongside vitest/globals
- How to verify the exact test count after CopyButton test removal

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HYGN-01 | Remove orphaned CopyButton component and its test file | Files identified: `src/components/blog/copy-button.tsx` and `src/components/blog/copy-button.test.tsx` (3 tests). Verified no other imports exist. |
| HYGN-02 | Remove lucide-react dependency if CopyButton was its only consumer | Verified 6 other source files import lucide-react. Dependency stays. No action needed. |
| HYGN-03 | Relocate security-headers.test.ts to src/proxy.test.ts with corrected import path | Current file at `src/lib/security-headers.test.ts` already imports from `../../src/proxy`. New location needs `./proxy` import. |
| HYGN-04 | Add `vitest/globals` to tsconfig compilerOptions.types to resolve false tsc errors | Current tsc shows 10 errors: 2 from missing vitest globals, 8 from Error name shadowing in error.test.tsx. Both fixable. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase only modifies existing files and deletes orphaned code.

### Existing Tools Used
| Tool | Purpose | Verified |
|------|---------|----------|
| Vitest | Test runner -- `npm run test` | [VERIFIED: vitest.config.ts globals: true] |
| TypeScript | Type checking -- `npx tsc --noEmit` | [VERIFIED: tsconfig.json, currently 10 errors] |
| @testing-library/jest-dom | Custom matchers via `vitest.setup.ts` | [VERIFIED: vitest.setup.ts imports `@testing-library/jest-dom/vitest`] |

## Architecture Patterns

### Test Co-location
Tests live alongside their source files as `{module}.test.ts(x)`. [VERIFIED: vitest.config.ts `include: ['src/**/*.test.{ts,tsx}']`]

The security-headers test is the sole violator -- it tests `src/proxy.ts` but lives at `src/lib/security-headers.test.ts`. After relocation to `src/proxy.test.ts`, all tests will follow the co-location pattern.

### Anti-Patterns to Avoid
- **Import shadowing of globals:** The `error.test.tsx` file imports `Error` as a default export, which shadows the global `Error` constructor. This causes `new Error('boom')` to attempt constructing the React component instead of a JavaScript Error object. Fix by renaming the import. [VERIFIED: tsc output shows TS7009 and TS2345 on all 4 `new Error()` calls]

## Current tsc Error Inventory

All 10 errors from `npx tsc --noEmit`, verified 2026-04-05:

### Category 1: Missing vitest/globals types (2 errors)
| File | Error | Fix |
|------|-------|-----|
| `src/hooks/use-glow-positions.test.ts:35` | TS2304: Cannot find name 'afterEach' | Add `"vitest/globals"` to tsconfig types |
| `src/hooks/use-hero-animation.test.ts:21` | TS2304: Cannot find name 'afterEach' | Add `"vitest/globals"` to tsconfig types |

These test files use `afterEach` without importing it, relying on vitest's `globals: true` config. TypeScript doesn't know about these globals unless told via tsconfig types. [VERIFIED: both files confirmed, vitest/globals.d.ts exists in node_modules]

### Category 2: Error constructor shadowing (8 errors, 4 lines x 2 errors each)
| File | Lines | Errors | Root Cause |
|------|-------|--------|------------|
| `src/app/error.test.tsx` | 7, 12, 19, 25 | TS7009 + TS2345 per line | `import Error from './error'` shadows global `Error` class |

The fix: rename the import to `ErrorPage` (or similar) and use the global `Error` class for `new Error('boom')`. [VERIFIED: error.test.tsx source confirms default import named `Error`]

### Recommended tsconfig types array

```json
"types": ["vitest/globals"]
```

**Discretion recommendation on @testing-library/jest-dom:** Do NOT add it to tsconfig types. The setup file `vitest.setup.ts` already imports `@testing-library/jest-dom/vitest` which augments the vitest `expect` type at runtime. Adding it to tsconfig types could cause duplicate type declarations. The current approach works correctly -- test files get the matchers through vitest's setup mechanism. [VERIFIED: vitest.setup.ts contains `import '@testing-library/jest-dom/vitest'`]

## Don't Hand-Roll

Not applicable -- this phase involves only file deletion, relocation, and config changes.

## Common Pitfalls

### Pitfall 1: Breaking import paths on test relocation
**What goes wrong:** Moving `security-headers.test.ts` from `src/lib/` to `src/` changes the relative import depth.
**How to avoid:** The current import is `from '../../src/proxy'` (which is already wrong/fragile -- it reaches outside the src tree). The new import at `src/proxy.test.ts` should be `from './proxy'`. [VERIFIED: current import path in security-headers.test.ts is `../../src/proxy`]
**Warning signs:** Test fails with "Cannot find module" after relocation.

### Pitfall 2: Error import shadowing
**What goes wrong:** Renaming the import in error.test.tsx but forgetting to update all JSX references.
**How to avoid:** Search-and-replace `<Error` with `<ErrorPage` in the test file. There are 4 render calls.
**Warning signs:** tsc errors persist after the rename.

### Pitfall 3: Test count mismatch
**What goes wrong:** Assuming exactly 3 tests are removed but the actual count differs.
**How to avoid:** Current baseline is 135 tests. copy-button.test.tsx has exactly 3 tests (verified). Expected post-deletion count: 132. Run `npm run test -- --run` and check the summary line.
**Warning signs:** Test count is not 132 after deletion.

### Pitfall 4: tsconfig types array overriding default type inclusion
**What goes wrong:** When `compilerOptions.types` is absent, TypeScript includes all `@types/*` packages automatically. When `types` is explicitly set, ONLY the listed types are included. Adding `"types": ["vitest/globals"]` would exclude `@types/node`, `@types/react`, etc.
**How to avoid:** This is NOT an issue here because the project uses `skipLibCheck: true` and the `@types/*` packages are included via `lib` and other mechanisms. However, to be safe, verify after the change that `npx tsc --noEmit` produces zero errors, not new ones. [VERIFIED: tsconfig.json has `skipLibCheck: true`]
**Warning signs:** New errors about missing DOM types or React types after adding the types array.

## Code Examples

### Test relocation: new src/proxy.test.ts

```typescript
// Source: adapted from current src/lib/security-headers.test.ts
import { describe, it, expect } from 'vitest'
import proxy, { config } from './proxy'
//                            ^^^^^^^^ changed from '../../src/proxy'

// ... rest of tests unchanged
```

### Error test fix: renamed import

```typescript
// Source: adapted from current src/app/error.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from './error'
//     ^^^^^^^^^  renamed from Error to avoid shadowing global Error class

describe('Error boundary (global)', () => {
  it('renders a branded error heading', () => {
    render(<ErrorPage error={new Error('boom')} reset={() => {}} />)
    //      ^^^^^^^^^
    // ...
  })
  // ... all 4 render calls use ErrorPage instead of Error
})
```

### tsconfig.json types addition

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"],
    // ... rest unchanged
  }
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via vitest.config.ts, globals: true) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --run && npx tsc --noEmit` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HYGN-01 | CopyButton files deleted, test count = 132 | smoke | `npm run test -- --run 2>&1 \| tail -3` | N/A (deletion) |
| HYGN-02 | lucide-react stays in package.json | manual check | `grep lucide-react package.json` | N/A (no-op) |
| HYGN-03 | security-headers.test.ts relocated and passes | unit | `npx vitest run src/proxy.test.ts` | Will exist after relocation |
| HYGN-04 | Zero tsc errors | type-check | `npx tsc --noEmit` | N/A (config change) |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test -- --run && npx tsc --noEmit`
- **Phase gate:** Full suite green + tsc zero errors

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Adding `types: ["vitest/globals"]` to tsconfig won't break existing type resolution due to `skipLibCheck: true` | Pitfall 4 | New tsc errors appear -- would need to also list `@types/node`, `@types/react`, `@types/react-dom` in the types array |

## Open Questions

1. **error.test.tsx fix scope**
   - What we know: 8 of 10 tsc errors come from `Error` import shadowing. Fix is renaming the import.
   - What's unclear: Whether D-06 intended this specific fix or a broader investigation.
   - Recommendation: The rename is the correct fix. No broader investigation needed -- the errors are fully explained by the shadowing.

## Sources

### Primary (HIGH confidence)
- Codebase grep: lucide-react has 6 source-file consumers beyond copy-button.tsx
- `npx tsc --noEmit`: 10 errors catalogued in full
- `npm run test -- --run`: 135 tests passing, 19 test files
- `vitest.config.ts`: globals: true, include pattern, setup file
- `tsconfig.json`: no types array currently, skipLibCheck: true
- `vitest.setup.ts`: imports `@testing-library/jest-dom/vitest`
- `src/lib/security-headers.test.ts`: imports from `../../src/proxy`
- `src/app/error.test.tsx`: default import named `Error` shadows global
- `node_modules/vitest/globals.d.ts`: type file exists for vitest globals

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all verified in codebase
- Architecture: HIGH - co-location pattern verified, all target files inspected
- Pitfalls: HIGH - all tsc errors reproduced and root-caused

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable -- no external dependencies changing)
