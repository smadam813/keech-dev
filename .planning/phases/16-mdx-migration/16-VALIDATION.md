---
phase: 16
slug: mdx-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + Playwright |
| **Config file** | `vitest.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | MDX-01 | build | `npm run velite` | N/A -- config-level | ⬜ pending |
| 16-01-02 | 01 | 1 | MDX-02 | unit | `npm run test -- src/components/blog/mdx-content.test.tsx` | Exists (needs rewrite) | ⬜ pending |
| 16-01-03 | 01 | 1 | MDX-03 | e2e | `npx playwright test e2e/code-copy.spec.ts` | Exists | ⬜ pending |
| 16-01-04 | 01 | 1 | MDX-04 | e2e | Manual VoiceOver or DOM inspection | No dedicated test | ⬜ pending |
| 16-01-05 | 01 | 1 | MDX-05 | e2e | `npx playwright test` (all e2e against live build) | Implicit | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/blog/mdx-content.test.tsx` — needs rewrite to test HTML rendering via dangerouslySetInnerHTML instead of `new Function()` execution
- [ ] Consider adding lightweight e2e assertion for `role="list"` on blog post list elements

*Existing infrastructure covers most phase requirements. Only mdx-content unit test needs rewriting.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| VoiceOver list announcement | MDX-04 | Screen reader behavior requires manual verification | Open blog post in Safari, enable VoiceOver, navigate to a list. Verify it announces "list, N items" |
| CSP violation check | MDX-05 | Browser console inspection | Open any blog post, check browser DevTools Console for CSP violation errors. Should be zero. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
