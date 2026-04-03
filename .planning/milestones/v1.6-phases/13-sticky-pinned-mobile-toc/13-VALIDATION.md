---
phase: 13
slug: sticky-pinned-mobile-toc
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx playwright test e2e/mobile-toc.spec.ts` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx playwright test e2e/mobile-toc.spec.ts`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | D-01 (sticky) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ e2e/mobile-toc.spec.ts:68 | ✅ green |
| 13-01-02 | 01 | 1 | D-03 (compact bar) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ e2e/mobile-toc.spec.ts:6 | ✅ green |
| 13-01-03 | 01 | 1 | D-05 (auto-collapse) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ e2e/mobile-toc.spec.ts:90 | ✅ green |
| 13-01-04 | 01 | 1 | D-02, D-07 (mobile-only, desktop unchanged) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ implicit (Pixel 5 device + build) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Extend `e2e/mobile-toc.spec.ts` — add test for sticky visibility after scroll
- [x] Extend `e2e/mobile-toc.spec.ts` — add test for auto-collapse after heading link click

*Existing test infrastructure (Vitest + Playwright) from Phase 12 covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heading visible after scroll (not behind sticky TOC) | D-06 | Visual overlap is hard to detect via DOM assertions | Scroll to heading via TOC link, verify heading text not obscured by sticky bar |
| Edge-to-edge background coverage | D-04 | Visual rendering detail | Verify sticky TOC background covers full viewport width, no content bleeding at edges |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-03

---

## Validation Audit 2026-04-03

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 4 automatable requirements (D-01, D-03, D-05, D-02/D-07) have E2E coverage in `e2e/mobile-toc.spec.ts` (4 tests, all green). 2 manual-only items (D-04, D-06) correctly classified — visual rendering details not amenable to DOM assertions.
