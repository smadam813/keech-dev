# Phase 20: Dead Code & Test Hygiene - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove orphaned code, fix test co-location and tsconfig for accurate baselines. The codebase should have zero orphaned code, tests co-locate with their source files, and `tsc --noEmit` reports zero false errors.

</domain>

<decisions>
## Implementation Decisions

### CopyButton Removal
- **D-01:** Delete `src/components/blog/copy-button.tsx` and `src/components/blog/copy-button.test.tsx` — these are orphaned (CodeBlockEnhancer replaced CopyButton's functionality)
- **D-02:** Do NOT remove lucide-react — 6 other source files import from it (header.tsx, footer.tsx, mobile-toc.tsx, project-card.tsx, blog/[slug]/page.tsx, projects/[slug]/page.tsx). HYGN-02 outcome: dependency stays.

### Test Relocation
- **D-03:** Move `src/lib/security-headers.test.ts` to `src/proxy.test.ts` — the test covers middleware security headers defined in `src/proxy.ts`, not a lib module
- **D-04:** Update import paths in the relocated test file to reference `./proxy` instead of the old path

### TypeScript Config
- **D-05:** Add `"vitest/globals"` to `compilerOptions.types` array in `tsconfig.json` — this resolves false `tsc --noEmit` errors for `afterEach`, `describe`, `it`, `expect` etc. in test files
- **D-06:** Current tsc errors also include type mismatches in error.test.tsx — these should be investigated as part of the same pass

### Claude's Discretion
- Whether to add other type references (e.g., `@testing-library/jest-dom`) to tsconfig types alongside vitest/globals
- How to verify the exact test count after CopyButton test removal (npm run test with count assertion)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dead code targets
- `src/components/blog/copy-button.tsx` — Orphaned component to delete (HYGN-01)
- `src/components/blog/copy-button.test.tsx` — Orphaned test to delete (HYGN-01)

### Test relocation
- `src/lib/security-headers.test.ts` — Test file to relocate (HYGN-03)
- `src/proxy.ts` — Target module the test should co-locate with

### Config
- `tsconfig.json` — Needs vitest/globals type addition (HYGN-04)
- `vitest.config.ts` — Reference for how vitest globals are currently configured

### Requirements
- `.planning/REQUIREMENTS.md` §Dead Code & Test Hygiene — HYGN-01 through HYGN-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No new components needed — this phase only removes and relocates

### Established Patterns
- Tests co-locate with source: `{module}.test.ts(x)` alongside `{module}.ts(x)`
- Vitest globals enabled in vitest.config.ts (`globals: true`)
- E2E tests in separate `e2e/` directory

### Integration Points
- `package.json` — lucide-react stays (6 consumers confirmed)
- `tsconfig.json` — types array modification affects all TypeScript compilation
- Test count baseline — currently ~135 unit tests, expected ~132 after CopyButton removal (3 tests in copy-button.test.tsx)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a straightforward cleanup phase with clear targets defined in requirements.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

</deferred>

---

*Phase: 20-dead-code-test-hygiene*
*Context gathered: 2026-04-05*
