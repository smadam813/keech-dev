---
phase: 9
slug: security-patches
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test framework configured (project has no tests) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | SEC-01 | build | `npm run build` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | SEC-02 | build | `npm run build` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 1 | SEC-03, SEC-04 | manual+build | `npm run build` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 1 | SEC-05 | manual | `curl -X POST ...` | ❌ W0 | ⬜ pending |
| 09-02-03 | 02 | 1 | SEC-06 | build | `npm run build` | ✅ | ⬜ pending |
| 09-03-01 | 03 | 1 | CLN-01 | audit | `npm audit` | ✅ | ⬜ pending |
| 09-03-02 | 03 | 1 | CLN-03 | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (build + lint + npm audit).
- No test framework installation needed — security validations are verified via build, lint, curl commands, and `npm audit`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Security headers present in response | SEC-01 | Headers only visible on deployed/running server | Run `npm run dev`, then `curl -I http://localhost:3000` and verify CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers |
| Rate limiting rejects rapid requests | SEC-05 | Requires sequential HTTP requests against running server | Send 11+ rapid POST requests to `/api/views/test-slug` and verify 429 response |
| Malformed MDX shows fallback | SEC-02 | Requires visual verification of error boundary | Create test post with invalid MDX, navigate to it in browser, verify branded fallback |
| API rejects invalid slugs | SEC-04 | Requires HTTP request against running server | `curl -X POST /api/views/'; DROP TABLE` and verify 400 response |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
