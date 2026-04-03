---
phase: 12
slug: testing-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 + Playwright 1.59.1 |
| **Config file** | `vitest.config.ts` + `playwright.config.ts` (Wave 0 creates both) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~15 seconds (unit) + ~30 seconds (E2E) |

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
| 12-01-01 | 01 | 1 | TEST-01 | smoke | `npx vitest run` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | TEST-02 | unit | `npx vitest run src/lib/format.test.ts` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | TEST-02 | unit | `npx vitest run src/lib/views.test.ts` | ❌ W0 | ⬜ pending |
| 12-01-04 | 01 | 1 | TEST-02 | unit | `npx vitest run src/lib/rune-glows.test.ts` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 1 | A11Y-03 | manual+e2e | `npx playwright test` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 2 | TEST-03 | smoke | `npx playwright test --list` | ❌ W0 | ⬜ pending |
| 12-03-02 | 03 | 2 | TEST-04 | e2e | `npx playwright test e2e/mobile-menu.spec.ts` | ❌ W0 | ⬜ pending |
| 12-03-03 | 03 | 2 | TEST-04 | e2e | `npx playwright test e2e/code-copy.spec.ts` | ❌ W0 | ⬜ pending |
| 12-03-04 | 03 | 2 | TEST-04 | e2e | `npx playwright test e2e/view-count.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest config with path aliases and jsdom environment
- [ ] `vitest.setup.ts` — Setup file for @testing-library/jest-dom matchers
- [ ] `playwright.config.ts` — Playwright config with Chromium-only and webServer
- [ ] `src/lib/format.test.ts` — formatDate unit test stubs
- [ ] `src/lib/views.test.ts` — view count helper unit test stubs
- [ ] `src/lib/rune-glows.test.ts` — computeGlowPositions unit test stubs
- [ ] `e2e/mobile-menu.spec.ts` — mobile menu toggle E2E stubs
- [ ] `e2e/code-copy.spec.ts` — code copy button E2E stubs
- [ ] `e2e/view-count.spec.ts` — view count increment E2E stubs
- [ ] Install dev dependencies (vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @playwright/test)
- [ ] `npx playwright install chromium` — browser binary

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile TOC visual appearance | A11Y-03 | Neobrutalist styling verification | Open blog post on mobile viewport, verify bold borders, hard shadow, teal accent on toggle |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
