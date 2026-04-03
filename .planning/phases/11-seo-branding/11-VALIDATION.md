---
phase: 11
slug: seo-branding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds |

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
| 11-01-01 | 01 | 1 | SEO-01 | manual-only | Check `src/app/icon.svg`, `icon.ico`, `apple-icon.png` exist | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | SEO-04 | smoke | `npm run build` + `curl localhost:3000/sitemap.xml` | N/A | ⬜ pending |
| 11-01-03 | 01 | 1 | SEO-05 | smoke | `npm run build` + `curl localhost:3000/feed.xml` | N/A | ⬜ pending |
| 11-01-04 | 01 | 1 | SEO-06 | manual-only | `grep sizes src/components/projects/project-card.tsx` | N/A | ⬜ pending |
| 11-01-05 | 01 | 1 | CLN-02 | manual-only | `grep -c "Resume" src/app/about/page.tsx` returns 0 | N/A | ⬜ pending |
| 11-02-01 | 02 | 2 | SEO-02 | smoke | `npm run build` (build fails if opengraph-image.tsx errors) | N/A | ⬜ pending |
| 11-02-02 | 02 | 2 | SEO-03 | smoke | `npm run build` + visual check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework needed — validation is via build success and manual verification. SEO assets (images, XML feeds) are inherently visual/structural.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Favicon renders in browser tab | SEO-01 | Visual verification needed | Open site in browser, check tab icon |
| OG image preview card | SEO-02 | Social media platform rendering | Use Twitter Card Validator or LinkedIn Post Inspector |
| Per-post OG image with title | SEO-03 | Social media platform rendering | Share a blog post URL, verify title appears in preview |
| Sitemap dates are content dates | SEO-04 | Requires checking date values | `curl /sitemap.xml`, verify dates aren't today's date |
| RSS feed parseable by reader | SEO-05 | RSS reader compatibility | Open `/feed.xml` in RSS reader app/extension |
| Project images have sizes attr | SEO-06 | HTML attribute verification | Inspect rendered HTML for `sizes` on project images |
| Resume placeholder removed | CLN-02 | Content verification | Visit /about, confirm no "Resume Coming Soon" text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
