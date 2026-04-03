---
phase: 9
slug: security-patches
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
audited: 2026-04-03
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 (jsdom environment) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npx vitest run && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Test File | Status |
|---------|------|------|-------------|-----------|-------------------|-----------|--------|
| 09-01-01 | 01 | 1 | SEC-03, CLN-01 | build+audit | `npm audit && npm run build` | — | ✅ green |
| 09-01-02 | 01 | 1 | SEC-01 | unit | `npx vitest run src/lib/security-headers.test.ts` | `src/lib/security-headers.test.ts` | ✅ green |
| 09-01-03 | 01 | 1 | CLN-03 | script | `node scripts/validate-colors.mjs` | — | ✅ green |
| 09-02-01 | 02 | 2 | SEC-04, SEC-05 | unit | `npx vitest run src/lib/validation.test.ts` | `src/lib/validation.test.ts` | ✅ green |
| 09-02-02 | 02 | 2 | SEC-02 | unit | `npx vitest run src/components/blog/mdx-content.test.tsx` | `src/components/blog/mdx-content.test.tsx` | ✅ green |
| 09-02-03 | 02 | 2 | SEC-06 | unit | `npx vitest run src/lib/rate-limit.test.ts` | `src/lib/rate-limit.test.ts` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Vitest was already configured (`vitest.config.ts`). No new framework installation needed.
- All test files follow existing patterns (`describe`/`it` blocks, vitest globals).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Security headers present in live HTTP response | SEC-01 | Headers configured in `next.config.ts` — only verifiable on running server | Run `npm run dev`, then `curl -I http://localhost:3000` and verify CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers |
| Rate limiting rejects rapid requests | SEC-05 | Requires sequential HTTP requests against running server with Redis | Send 11+ rapid POST requests to `/api/views/test-slug` and verify 429 response |
| Malformed MDX shows fallback in browser | SEC-02 | Visual verification of rendered fallback | Create test post with invalid MDX, navigate in browser, verify branded fallback card |

*Note: All manual-only items also have automated unit test coverage for their code-level behavior. Manual verification confirms end-to-end integration.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed

---

## Validation Audit 2026-04-03

| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |

### Tests Generated

| File | Tests | Requirements |
|------|-------|--------------|
| `src/lib/validation.test.ts` | 13 | SEC-04, SEC-05 |
| `src/lib/security-headers.test.ts` | 5 | SEC-01 |
| `src/lib/rate-limit.test.ts` | 4 | SEC-06 |
| `src/components/blog/mdx-content.test.tsx` | 3 | SEC-02 |
| **Total** | **25** | **5 requirements** |
