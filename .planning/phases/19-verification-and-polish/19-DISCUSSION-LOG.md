# Phase 19: Verification and Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 19-verification-and-polish
**Mode:** auto
**Areas discussed:** Test failure remediation, Build output validation, Lint validation, Polish scope

---

## Test Failure Remediation

| Option | Description | Selected |
|--------|-------------|----------|
| Fix the code | Tests validate existing behavior — fix code to match | ✓ |
| Fix the test | Only if test asserts intentionally-changed behavior | |

**User's choice:** Fix the code (auto-selected recommended default)
**Notes:** E2E tests cover mobile menu, code copy, view counts, mobile TOC — all existing user-facing behavior.

---

## Build Output Validation

| Option | Description | Selected |
|--------|-------------|----------|
| /feed.xml Dynamic is acceptable | Route handlers are inherently dynamic in Next.js | ✓ |
| All routes must be Static | Would require removing the RSS feed route handler | |

**User's choice:** /feed.xml Dynamic is acceptable (auto-selected recommended default)
**Notes:** VER-02 applies to pages, not API routes. Current build already shows all pages as Static/SSG.

---

## Lint Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Fix code over adding suppressions | Only suppress for documented intentional patterns | ✓ |
| Suppress any new warnings | Keep code changes minimal | |

**User's choice:** Fix code over adding suppressions (auto-selected recommended default)
**Notes:** Current lint is already clean. This validates no regressions from phases 16-18.

---

## Polish Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Strictly VER-01, VER-02, VER-03 | No extras, no feature creep | ✓ |
| Include additional cleanup | Fix anything else found during validation | |

**User's choice:** Strictly VER-01, VER-02, VER-03 (auto-selected recommended default)
**Notes:** Verification phase — run checks, fix failures, confirm green.

---

## Claude's Discretion

- Check execution order (lint, build, E2E)
- Whether to include unit tests as bonus sanity check

## Deferred Ideas

None.
