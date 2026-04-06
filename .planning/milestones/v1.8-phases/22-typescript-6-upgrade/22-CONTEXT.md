# Phase 22: TypeScript 6 Upgrade - Context

**Gathered:** 2026-04-05 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade TypeScript from 5.9.3 to 6.x using the official migration tooling. The project compiles cleanly under the new compiler with all tooling (build, test, lint) validated. No new features or refactors beyond what TS6 requires.

</domain>

<decisions>
## Implementation Decisions

### Migration Approach
- **D-01:** Run the official `ts5to6` migration tool first to handle automated codemods, then fix any remaining issues manually
- **D-02:** Perform the upgrade in a single atomic step — install TS6, run migration tool, fix errors, validate — not incremental

### tsconfig Adaptation
- **D-03:** Accept new TS6 compiler defaults where they align with current settings (e.g., if TS6 changes defaults for options already set explicitly in tsconfig.json)
- **D-04:** Only add explicit overrides where needed for Next.js or Velite compatibility — don't fight the new defaults unnecessarily
- **D-05:** Keep `skipLibCheck: true` — focus validation on project source code, not third-party type definitions

### Validation Sequence
- **D-06:** Validate in order: `npx tsc --noEmit` (compiler) → `npm run build` (Velite + Next.js) → `npm run test` (Vitest) → `npm run lint` (ESLint) — fix issues at each stage before proceeding
- **D-07:** All four checks must pass with zero errors and zero warnings before the phase is complete

### Breaking Change Handling
- **D-08:** Fix source code to satisfy TS6 type rules — do not add `@ts-ignore`, `@ts-expect-error`, or weaken strictness settings
- **D-09:** If a third-party dependency's types are incompatible with TS6 (e.g., Velite, next), check for updated type packages first; `skipLibCheck` covers remaining library-level issues

### Claude's Discretion
- Exact ts5to6 CLI flags and invocation
- Whether to update `module`/`moduleResolution` values if TS6 introduces new options
- Order of manual fixes after migration tool runs
- Whether tsconfig `target` should change from ES2022

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Dependency Updates — DEPS-05: Upgrade TypeScript to 6.x, run ts5to6 migration tool, validate with tsc --noEmit

### TypeScript configuration
- `tsconfig.json` — Current compiler options (target ES2022, module esnext, moduleResolution bundler, isolatedModules true, strict true)
- `package.json` — Current typescript version (^5.9.3) and all devDependencies that may need type compatibility

### Build pipeline
- `velite.config.ts` — Velite content compiler config (must compile under TS6)
- `next.config.ts` — Next.js config (must compile under TS6)
- `eslint.config.mjs` — ESLint flat config with typescript plugin
- `vitest.config.ts` — Vitest config with path aliases

### Prior phase context
- `.planning/phases/21-dependency-upgrades/21-CONTEXT.md` — D-09: TypeScript 6 explicitly deferred to this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No new components needed — this phase only updates the compiler version

### Established Patterns
- `strict: true` already enabled — TS6 strictness additions should be minimal impact
- `isolatedModules: true` already set — aligns with TS6 direction
- `moduleResolution: "bundler"` already set — modern resolution strategy
- `vitest/globals` in tsconfig types array — must remain after migration

### Integration Points
- `tsconfig.json` — Primary config file that ts5to6 tool will modify
- `.next/types/**/*.ts` — Next.js auto-generated types (included in tsconfig)
- `next-env.d.ts` — Next.js environment type declarations
- All `*.ts` and `*.tsx` files in `src/` — must compile under TS6

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the migration is driven by DEPS-05 requirements and the ts5to6 migration tool's output. The ROADMAP.md success criteria (zero tsc errors, build passes, tests pass, lint passes) define the target state.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-typescript-6-upgrade*
*Context gathered: 2026-04-05*
