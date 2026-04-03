---
phase: 10
slug: resilience-code-quality
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test framework configured (Vitest setup deferred to Phase 12) |
| **Config file** | none — Phase 12 installs |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Build must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | ERR-01, ERR-02, ERR-03, ERR-04 | build | `npm run build` | N/A | ⬜ pending |
| 10-01-02 | 01 | 1 | A11Y-01, A11Y-02 | build | `npm run build` | N/A | ⬜ pending |
| 10-02-01 | 02 | 2 | QUAL-01, QUAL-02, QUAL-03, QUAL-04 | build | `npm run build` | N/A | ⬜ pending |
| 10-02-02 | 02 | 2 | QUAL-05 | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* No test framework needed for this phase — all verification is via build success, file existence, and grep checks. Test framework installation is Phase 12.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Error boundary renders branded UI on runtime error | ERR-01 | Requires triggering a runtime error in browser | Throw error in a component, verify branded error page shows |
| Loading skeleton appears during route transition | ERR-04 | Requires observing transition timing | Navigate between routes with network throttled, verify skeleton |
| Copy button visible on keyboard Tab | A11Y-01 | Requires keyboard interaction in browser | Tab to code block copy button, verify it becomes visible |
| VoiceOver reads list items correctly | A11Y-02 | Requires screen reader | Enable VoiceOver on Safari, navigate to MDX list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
