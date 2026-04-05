# Phase 18: React 19 Lint Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 18-react-19-lint-cleanup
**Mode:** auto
**Areas discussed:** localStorage migration, matchMedia migration, animation orchestration, additional lint warnings

---

## localStorage Migration

| Option | Description | Selected |
|--------|-------------|----------|
| useSyncExternalStore hook | Create a hook with getSnapshot reading localStorage, subscribe on storage event | ✓ |
| Keep useLayoutEffect with suppression | Suppress the lint warning, keep existing pattern | |
| Move to context-only (no localStorage) | Drop localStorage cache entirely | |

**User's choice:** [auto] useSyncExternalStore hook (recommended default)
**Notes:** Idiomatic React 19 pattern. getServerSnapshot returns null for SSR compatibility.

---

## matchMedia Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Shared useMediaQuery hook via useSyncExternalStore | Single hook reused by hero animation and scroll-reveal | ✓ |
| Per-component useSyncExternalStore inline | Each component writes its own subscribe/getSnapshot | |
| CSS-only detection (remove JS entirely) | Use CSS @media queries only, no JS state | |

**User's choice:** [auto] Shared useMediaQuery hook (recommended default)
**Notes:** Eliminates matchMedia setState-in-effect warnings in both use-hero-animation.ts and scroll-reveal.tsx.

---

## Animation Orchestration

| Option | Description | Selected |
|--------|-------------|----------|
| Suppress with explanatory comments | Keep orchestration effects, add eslint-disable with rationale | ✓ |
| Refactor to state machine | Replace setTimeout chain with state machine pattern | |
| Use requestAnimationFrame | Replace setTimeout with rAF-based timing | |

**User's choice:** [auto] Suppress with explanatory comments (recommended default)
**Notes:** Matches RQ-04 requirement. These are genuine animation sequences, not sync-from-external-store patterns.

---

## Additional Lint Warnings

| Option | Description | Selected |
|--------|-------------|----------|
| Fix all to zero warnings | Refactor every warning site for clean lint output | ✓ |
| Fix only Phase 18 scope (RQ-01-04) | Only fix localStorage/matchMedia warnings, defer others | |

**User's choice:** [auto] Fix all to zero warnings (recommended default)
**Notes:** RQ-03 requires zero set-state-in-effect warnings. Full cleanup also catches ref-during-render and unused variable warnings for Phase 19 verification readiness.

---

## Claude's Discretion

- Hook naming and file placement
- Exact refactor approach for ref-during-render patterns
- localStorage subscribe implementation details

## Deferred Ideas

None — analysis stayed within phase scope.
