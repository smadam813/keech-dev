---
phase: 12
slug: testing-infrastructure
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
validated: 2026-04-03
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 + Playwright 1.59.1 |
| **Config file** | `vitest.config.ts` + `playwright.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~1s (unit/17 files/124 tests) + ~30s (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | TEST-01 | smoke | `npx vitest run` | ✅ | ✅ green |
| 12-01-02 | 01 | 1 | TEST-02 | unit | `npx vitest run src/lib/format.test.ts` | ✅ | ✅ green |
| 12-01-03 | 01 | 1 | TEST-02 | unit | `npx vitest run src/lib/views.test.ts` | ✅ | ✅ green |
| 12-01-04 | 01 | 1 | TEST-02 | unit | `npx vitest run src/lib/rune-glows.test.ts` | ✅ | ✅ green |
| 12-02-01 | 02 | 1 | A11Y-03 | e2e | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ | ✅ green |
| 12-03-01 | 03 | 2 | TEST-03 | smoke | `npx playwright test --list` | ✅ | ✅ green |
| 12-03-02 | 03 | 2 | TEST-04 | e2e | `npx playwright test e2e/mobile-menu.spec.ts` | ✅ | ✅ green |
| 12-03-03 | 03 | 2 | TEST-04 | e2e | `npx playwright test e2e/code-copy.spec.ts` | ✅ | ✅ green |
| 12-03-04 | 03 | 2 | TEST-04 | e2e | `npx playwright test e2e/view-count.spec.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` — Vitest config with path aliases and jsdom environment
- [x] `vitest.setup.ts` — Setup file for @testing-library/jest-dom matchers
- [x] `playwright.config.ts` — Playwright config with Chromium-only and webServer
- [x] `src/lib/format.test.ts` — formatDate unit tests (4 tests)
- [x] `src/lib/views.test.ts` — view count helper unit tests (8 tests)
- [x] `src/lib/rune-glows.test.ts` — computeGlowPositions unit tests (6 tests)
- [x] `e2e/mobile-menu.spec.ts` — mobile menu toggle E2E tests (3 tests)
- [x] `e2e/code-copy.spec.ts` — code copy button E2E test (1 test)
- [x] `e2e/view-count.spec.ts` — view count increment E2E test (1 test)
- [x] Install dev dependencies (vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @playwright/test)
- [x] `npx playwright install chromium` — browser binary

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile TOC visual appearance | A11Y-03 | Neobrutalist styling verification | Open blog post on mobile viewport, verify bold borders, hard shadow, teal accent on toggle |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ validated 2026-04-03

---

## Validation Audit 2026-04-03

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Unit tests:** 17 files, 124 tests — all green (1.13s)
**E2E tests:** 4 spec files, 14 tests — all enumerated
