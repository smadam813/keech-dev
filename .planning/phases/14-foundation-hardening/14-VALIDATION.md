---
phase: 14
slug: foundation-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + ESLint 9.x |
| **Config file** | `vitest.config.ts`, `eslint.config.mjs` |
| **Quick run command** | `npm run lint && npm audit` |
| **Full suite command** | `npm run test && npm run lint && npm audit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm audit`
- **After every plan wave:** Run `npm run test && npm run lint && npm audit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | FOUND-01 | cli | `npm audit` | ✅ | ⬜ pending |
| 14-01-02 | 01 | 1 | FOUND-02 | cli | `npm run lint 2>&1 \| head -20` | ✅ | ⬜ pending |
| 14-01-03 | 01 | 1 | FOUND-03 | grep | `grep -c 'eslint-disable-next-line' src/app/error.tsx src/app/global-error.tsx src/app/blog/[slug]/error.tsx` | ✅ | ⬜ pending |
| 14-01-04 | 01 | 1 | FOUND-04 | grep | `grep '"velite": "0.3.1"' package.json` | ✅ | ⬜ pending |
| 14-01-05 | 01 | 1 | FOUND-05 | cli | `ls .claude/worktrees/agent-* 2>/dev/null \| wc -l` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — validation uses built-in npm/eslint CLI commands and grep.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| eslint-disable comment explanatory quality | FOUND-03 | Comment content requires human judgment | Read error boundary files, verify each eslint-disable has a brief explanation of why `<a>` is used instead of `<Link>` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
