# Phase 21: Dependency Upgrades - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 21-dependency-upgrades
**Mode:** auto
**Areas discussed:** Upgrade ordering, Shiki 4 migration, Validation strategy, Conditional dependencies

---

## Upgrade Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Risk-tiered batches | Minor/patch first, then majors one-at-a-time | ✓ |
| All at once | Single npm update pass | |
| Reverse risk | Major versions first to surface breakage early | |

**User's choice:** [auto] Risk-tiered batches (recommended default)
**Notes:** Safest approach — minor/patch updates are low-risk and establish a clean baseline before tackling major version jumps.

---

## Shiki 4 Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Coupled upgrade | shiki 4 + rehype-pretty-code 0.14.3 together in one commit | ✓ |
| Sequential | shiki 4 first, then rehype-pretty-code separately | |

**User's choice:** [auto] Coupled upgrade (recommended default)
**Notes:** ROADMAP.md already specifies these must upgrade as a coupled pair. Sequential approach risks broken intermediate state.

---

## Validation Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Full pipeline per batch | build + test + lint + audit after each batch | ✓ |
| Final validation only | Run full pipeline once after all upgrades | |
| Build-only per batch | Only build after each batch, full suite at end | |

**User's choice:** [auto] Full pipeline per batch (recommended default)
**Notes:** Ensures each batch is independently valid and any breakage is immediately attributable.

---

## Conditional Dependencies

| Option | Description | Selected |
|--------|-------------|----------|
| DEPS-03 active | lucide-react stays, upgrade to 1.x | ✓ |
| DEPS-03 N/A | lucide-react removed, skip | |

**User's choice:** [auto] DEPS-03 active (recommended default)
**Notes:** Phase 20 D-02 confirmed lucide-react has 6 consumers and was not removed.

---

## Claude's Discretion

- Exact npm commands and flags for each upgrade batch
- Whether to use `npm update` vs manual `npm install package@version`
- Order of major upgrades within the major-version batch

## Deferred Ideas

- TypeScript 6 upgrade — Phase 22
- ESLint 10 upgrade — blocked upstream
