---
phase: 15
slug: middleware-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + Playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | MID-01 | unit | `npx vitest run src/lib/security-headers.test.ts` | ❌ W0 (must rewrite) | ⬜ pending |
| 15-01-02 | 01 | 1 | MID-02 | unit | `npx vitest run src/lib/security-headers.test.ts` | ❌ W0 (must rewrite) | ⬜ pending |
| 15-01-03 | 01 | 1 | MID-03 | manual | `curl -s -I http://localhost:3000 \| grep -ci content-security-policy` returns 1 | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/security-headers.test.ts` — rewrite to test proxy.ts instead of next.config.ts headers()

*Existing test infrastructure (Vitest, Playwright) covers framework needs. Only the security headers test file needs updating.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Single CSP header per response | MID-03 | Requires running dev server and checking response headers | `npm run dev`, then `curl -s -I http://localhost:3000 \| grep -ci content-security-policy` must return 1 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
