---
phase: 20
slug: dead-code-test-hygiene
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via vitest.config.ts, globals: true) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | HYGN-01 | — | N/A | smoke | `npm run test -- --run 2>&1 \| tail -3` | N/A (deletion) | ⬜ pending |
| 20-01-02 | 01 | 1 | HYGN-02 | — | N/A | manual | `grep lucide-react package.json` | N/A (no-op) | ⬜ pending |
| 20-01-03 | 01 | 1 | HYGN-03 | — | N/A | unit | `npx vitest run src/proxy.test.ts` | Will exist after relocation | ⬜ pending |
| 20-01-04 | 01 | 1 | HYGN-04 | — | N/A | type-check | `npx tsc --noEmit` | N/A (config) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

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
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
