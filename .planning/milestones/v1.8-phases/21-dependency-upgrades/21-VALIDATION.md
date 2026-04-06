---
phase: 21
slug: dependency-upgrades
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run build && npm run test && npm run lint && npm audit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npm run test && npm run lint`
- **After every plan wave:** Run `npm run build && npm run test && npm run lint && npm audit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | DEPS-01 | — | N/A | smoke | `npm run build && npm run test` | N/A | ⬜ pending |
| 21-02-01 | 02 | 2 | DEPS-02 | — | N/A | smoke | `npm run velite && npm run build && npm run test` | N/A | ⬜ pending |
| 21-03-01 | 03 | 3 | DEPS-04 | — | CSP not violated | smoke | `npm run build && npm run test` | N/A | ⬜ pending |
| 21-04-01 | 04 | 4 | DEPS-03 | — | N/A | smoke | `npm run build && npm run test` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing test infrastructure covers all phase requirements. This phase validates via build success and manual spot-checks, not new test files.
