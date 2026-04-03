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
| 13-01-01 | 01 | 1 | D-01 (sticky) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ extends existing | ⬜ pending |
| 13-01-02 | 01 | 1 | D-03 (compact bar) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ extends existing | ⬜ pending |
| 13-01-03 | 01 | 1 | D-05 (auto-collapse) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ extends existing | ⬜ pending |
| 13-01-04 | 01 | 1 | D-06 (scroll-margin) | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | ✅ extends existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `e2e/mobile-toc.spec.ts` — add test for sticky visibility after scroll
- [ ] Extend `e2e/mobile-toc.spec.ts` — add test for auto-collapse after heading link click

*Existing test infrastructure (Vitest + Playwright) from Phase 12 covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heading visible after scroll (not behind sticky TOC) | D-06 | Visual overlap is hard to detect via DOM assertions | Scroll to heading via TOC link, verify heading text not obscured by sticky bar |
| Edge-to-edge background coverage | D-04 | Visual rendering detail | Verify sticky TOC background covers full viewport width, no content bleeding at edges |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
