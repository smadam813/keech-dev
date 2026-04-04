---
phase: 17
slug: syntax-highlighting-theme-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + playwright |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | SYN-01 | build | `npm run velite` | ✅ | ⬜ pending |
| 17-01-02 | 01 | 1 | SYN-02 | grep | `grep --shiki-foreground src/app/globals.css` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | SYN-03 | grep | `grep 'keepBackground: false' velite.config.ts` | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | SYN-04 | e2e | `npm run test:e2e` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.
- Velite build (`npm run velite`) validates theme configuration compiles
- Existing E2E tests verify code blocks render with syntax highlighting
- Grep checks verify CSS variables and config changes are present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual parity with github-dark-dimmed | SYN-04 | Color comparison is subjective | Build site, navigate to a blog post with code blocks, compare visually against current appearance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
