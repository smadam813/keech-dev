---
phase: 24
slug: audit-gap-closures
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 (jsdom, `globals: true`, `@vitejs/plugin-react`) + Playwright 1.59.1 |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run lint && npm run test && npm run build && npm run test:e2e:dev` |
| **Estimated runtime** | ~30s unit + ~60s build + ~30s e2e |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <touched-file>.test.tsx`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | GAP-01 | T-24-01 | Drafts excluded from `publishedPosts` (V4 Access Control) | unit | `npx vitest run src/lib/posts.test.ts` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | GAP-01 | T-24-01 | Existing call sites use shared helper, no behavioral regression | unit | `npx vitest run` | ✅ | ⬜ pending |
| 24-01-03 | 01 | 1 | GAP-01 | T-24-01 | `[slug]/page.tsx` returns 404 for draft, `generateStaticParams` excludes drafts | manual / build | `npm run build` (verify `.next/server/app/blog/` only contains published slugs) | ✅ | ⬜ pending |
| 24-01-04 | 01 | 1 | GAP-01 | T-24-01 | `opengraph-image.tsx` excludes drafts and falls through on draft slug | unit / build | `npm run build` + grep `.next/server/app/blog/` for OG outputs | ✅ | ⬜ pending |
| 24-02-01 | 02 | 2 | GAP-02 | — | `test:e2e:dev` script exists and runs Playwright against `npm run dev` | unit (script presence) + manual run | `grep '"test:e2e:dev"' package.json && npm run test:e2e:dev` | ✅ | ⬜ pending |
| 24-03-01 | 03 | 2 | GAP-03 | T-24-03 | `writeText` rejection surfaces `xIcon` + `Copy failed` aria, reverts after 2000ms (V7 Error Handling) | unit | `npx vitest run src/components/blog/code-block-enhancer.test.tsx` | ✅ | ⬜ pending |
| 24-03-02 | 03 | 2 | GAP-03 | T-24-03 | `console.error` called with the rejection error | unit | `npx vitest run src/components/blog/code-block-enhancer.test.tsx -t 'failure'` | ✅ | ⬜ pending |
| 24-03-03 | 03 | 2 | GAP-03 | T-24-03 | Existing 5 tests still pass (no regression in success path) | unit | `npx vitest run src/components/blog/code-block-enhancer.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/posts.test.ts` — NEW test file. Mock `@/.velite` with a fixture including a draft entry. Assert `publishedPosts.find(p => p.draft)` is `undefined` and that all non-draft entries are present. ~10 lines.

*Existing infrastructure covers all other phase requirements (Vitest, Playwright, jsdom, testing-library all already installed).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `next build` output excludes draft slugs from `.next/server/app/blog/` | GAP-01 | Build output inspection — no automated test for `.next/` directory structure | Run `npm run build`, then `ls .next/server/app/blog/` and verify only published slugs are present (none of the current 6 posts are drafts, so this verifies the code path doesn't crash and the helper is wired in) |
| `npm run test:e2e:dev` boots dev server and runs Playwright suite green | GAP-02 | The whole point of this gap is the dev-server flow; needs an actual run | Run `npm run test:e2e:dev` after Plan 02 ships. All existing e2e specs (`code-copy.spec.ts`, `mobile-menu.spec.ts`, `mobile-toc.spec.ts`, `view-count.spec.ts`) should pass against the dev server. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`src/lib/posts.test.ts`)
- [ ] No watch-mode flags (Vitest uses `run`, Playwright uses default non-watch)
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
