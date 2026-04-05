---
phase: 22
slug: typescript-6-upgrade
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npx tsc --noEmit && npm run test` |
| **Full suite command** | `npx tsc --noEmit && npm run build && npm run test && npm run lint` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npm run test`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build && npm run test && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | DEPS-05 | — | N/A | integration | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 22-01-02 | 01 | 1 | DEPS-05 | — | N/A | integration | `npm run build` | ✅ | ⬜ pending |
| 22-01-03 | 01 | 1 | DEPS-05 | — | N/A | integration | `npm run test` | ✅ | ⬜ pending |
| 22-01-04 | 01 | 1 | DEPS-05 | — | N/A | integration | `npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠�� flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
