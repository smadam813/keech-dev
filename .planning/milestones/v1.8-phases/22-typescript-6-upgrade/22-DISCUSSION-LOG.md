# Phase 22: TypeScript 6 Upgrade - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 22-TypeScript 6 Upgrade
**Mode:** auto
**Areas discussed:** Migration approach, tsconfig adaptation, Validation sequence, Breaking change handling

---

## Migration Approach

| Option | Description | Selected |
|--------|-------------|----------|
| ts5to6 first, then manual fixes | Run official migration tool for automated codemods, fix remaining issues by hand | ✓ |
| Manual migration only | Skip migration tool, update tsconfig and fix errors manually | |
| Incremental migration | Upgrade in stages with compatibility flags | |

**User's choice:** [auto] ts5to6 first, then manual fixes (recommended default)
**Notes:** Official tooling handles known breaking changes automatically; manual pass catches edge cases.

---

## tsconfig Adaptation

| Option | Description | Selected |
|--------|-------------|----------|
| Accept new defaults, override only for compatibility | Let TS6 defaults apply where sensible, add explicit overrides only for Next.js/Velite needs | ✓ |
| Pin all current values explicitly | Lock every compiler option to current value to prevent behavior changes | |
| Minimal tsconfig (rely on TS6 defaults entirely) | Remove explicit options that now match TS6 defaults | |

**User's choice:** [auto] Accept new defaults, override only for compatibility (recommended default)
**Notes:** Current tsconfig already uses modern settings (bundler resolution, isolatedModules, strict) that align with TS6 direction.

---

## Validation Sequence

| Option | Description | Selected |
|--------|-------------|----------|
| tsc → build → test → lint | Compiler first, then full stack validation in dependency order | ✓ |
| build only (covers tsc implicitly) | Let Next.js build catch everything | |
| All in parallel | Run all checks simultaneously | |

**User's choice:** [auto] tsc → build → test → lint (recommended default)
**Notes:** Matches established validation pattern from Phase 21 (D-06).

---

## Breaking Change Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fix source code, no suppressions | Adapt code to satisfy TS6 rules without adding ts-ignore or weakening strictness | ✓ |
| Allow targeted @ts-expect-error | Use suppressions for third-party type incompatibilities | |
| Weaken strictness temporarily | Relax compiler options to pass, tighten later | |

**User's choice:** [auto] Fix source code, no suppressions (recommended default)
**Notes:** skipLibCheck handles third-party type issues; project code should be fully TS6 compliant.

---

## Claude's Discretion

- ts5to6 CLI flags, tsconfig target changes, module/moduleResolution updates, fix ordering

## Deferred Ideas

None
