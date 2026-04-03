---
phase: 11
slug: seo-branding
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
audited: 2026-04-03
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (jsdom) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/seo-assets.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~500ms |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run start` (verify served output)
- **Before `/gsd:verify-work`:** Full build must be green + manual visual check
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | SEO-01 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |
| 11-01-02 | 01 | 1 | SEO-02 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |
| 11-01-03 | 01 | 1 | SEO-03 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |
| 11-02-01 | 02 | 1 | SEO-04 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |
| 11-02-02 | 02 | 1 | SEO-05 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |
| 11-02-03 | 02 | 1 | SEO-06 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |
| 11-02-04 | 02 | 1 | CLN-02 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |
| 11-03-01 | 03 | 1 | SEC-01 | unit | `npx vitest run src/lib/seo-assets.test.ts` | src/lib/seo-assets.test.ts | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*All requirements now have automated Vitest coverage via static file analysis. No additional test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Favicon renders in browser tab | SEO-01 | Visual verification needed | Open site in browser, check tab icon |
| OG image preview card | SEO-02 | Social media platform rendering | Use Twitter Card Validator or LinkedIn Post Inspector |
| Per-post OG image with title | SEO-03 | Social media platform rendering | Share a blog post URL, verify title appears in preview |
| Sitemap dates are content dates | SEO-04 | Requires checking date values | `curl /sitemap.xml`, verify dates aren't today's date |
| RSS feed parseable by reader | SEO-05 | RSS reader compatibility | Open `/feed.xml` in RSS reader app/extension |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete

---

## Validation Audit 2026-04-03

| Metric | Count |
|--------|-------|
| Gaps found | 8 |
| Resolved | 8 |
| Escalated | 0 |

**Test file:** `src/lib/seo-assets.test.ts` — 32 tests covering all 8 requirements via static file analysis (fs.readFileSync/statSync). Approach avoids jsdom incompatibility with ImageResponse and Next.js runtime while providing genuine behavioral coverage.
