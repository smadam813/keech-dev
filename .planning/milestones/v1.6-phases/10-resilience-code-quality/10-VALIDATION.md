---
phase: 10
slug: resilience-code-quality
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-03
updated: 2026-04-03
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + jsdom + @testing-library/react (installed in Phase 12) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Build must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File | Status |
|---------|------|------|-------------|-----------|-------------------|------|--------|
| 10-01-01 | 01 | 1 | ERR-01 | unit | `npx vitest run src/app/error.test.tsx` | src/app/error.test.tsx | ✅ green |
| 10-01-02 | 01 | 1 | ERR-02 | unit | `npx vitest run src/app/global-error.test.tsx` | src/app/global-error.test.tsx | ✅ green |
| 10-01-03 | 01 | 1 | ERR-03 | unit | `npx vitest run "src/app/blog/[slug]/error.test.tsx"` | src/app/blog/[slug]/error.test.tsx | ✅ green |
| 10-01-04 | 01 | 1 | ERR-04 | unit | `npx vitest run src/app/loading.test.tsx` | src/app/loading.test.tsx | ✅ green |
| 10-01-05 | 01 | 1 | A11Y-01 | unit | `npx vitest run src/components/blog/copy-button.test.tsx` | src/components/blog/copy-button.test.tsx | ✅ green |
| 10-01-06 | 01 | 1 | A11Y-02 | manual-only | n/a | n/a | manual |
| 10-03-01 | 03 | 2 | QUAL-03 | unit | `npx vitest run src/hooks/use-filtered-list.test.ts` | src/hooks/use-filtered-list.test.ts | ✅ green |
| 10-03-02 | 03 | 2 | QUAL-04 | unit | `npx vitest run src/components/ui/filter-chip.test.tsx` | src/components/ui/filter-chip.test.tsx | ✅ green |
| 10-04-01 | 04 | 2 | QUAL-05 | unit | `npx vitest run src/hooks/use-hero-animation.test.ts` | src/hooks/use-hero-animation.test.ts | ✅ green |
| 10-04-02 | 04 | 2 | QUAL-05 | unit | `npx vitest run src/hooks/use-glow-positions.test.ts` | src/hooks/use-glow-positions.test.ts | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All phase requirements now have automated coverage via Vitest. A11Y-02 (VoiceOver list announcement) remains manual-only as it requires a screen reader.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Loading skeleton appears during route transition | ERR-04 | Requires observing transition timing | Navigate between routes with network throttled, verify skeleton |
| Copy button visible on keyboard Tab | A11Y-01 | focus-visible class presence is tested automatically; full keyboard UX confirmed manually | Tab to code block copy button, verify it becomes visible |
| VoiceOver reads list items correctly | A11Y-02 | Requires screen reader | Enable VoiceOver on Safari, navigate to MDX list |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete — all 8 automated gaps filled, all tests green (124/124)
