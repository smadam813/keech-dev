---
phase: 18
slug: react-19-lint-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npm run lint` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | RQ-02 | unit | `npx vitest run src/hooks/use-media-query.test.ts` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | RQ-01 | unit | `npx vitest run src/hooks/use-view-store.test.ts` | ❌ W0 | ⬜ pending |
| 18-01-03 | 01 | 1 | RQ-01 | unit | `npx vitest run src/lib/views.test.ts` | ✅ | ⬜ pending |
| 18-01-04 | 01 | 1 | RQ-02, RQ-04 | unit | `npx vitest run src/hooks/use-hero-animation.test.ts` | ✅ | ⬜ pending |
| 18-01-05 | 01 | 1 | RQ-03 | lint | `npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/use-media-query.test.ts` — covers RQ-02 (useMediaQuery hook returns correct values, responds to changes)
- [ ] `src/hooks/use-view-store.test.ts` — covers RQ-01 (useViewStore reads localStorage, returns null on server)

---

## Phase Gate

All of the following must pass before phase is considered complete:

1. `npm run test -- --run` exits 0
2. `npm run lint` reports 0 warnings and 0 errors
3. View counts display correctly (manual verification via dev server)
4. Hero animation reveal sequence plays correctly (manual verification)
