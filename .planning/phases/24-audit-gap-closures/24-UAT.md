---
status: complete
phase: 24-audit-gap-closures
source: [24-01-draft-guard-SUMMARY.md, 24-02-SUMMARY.md, 24-03-SUMMARY.md]
started: 2026-04-11T12:00:00Z
updated: 2026-04-11T12:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Draft Posts Excluded from Blog Listing
expected: Visit /blog. No draft posts appear in the listing. Only published posts with non-draft status are shown.
result: pass

### 2. Draft Post Slug Returns 404
expected: Navigate directly to a draft post's URL (e.g. /blog/draft-slug). The page returns a 404 Not Found page instead of rendering the draft content.
result: pass

### 3. Draft OG Image Returns 404
expected: Request the OpenGraph image for a draft post slug. The OG image route returns notFound() instead of rendering an OG card for the draft.
result: pass

### 4. Published Posts in Sitemap and RSS
expected: Check /sitemap.xml and /feed.xml. All published (non-draft) posts appear with correct URLs. No draft post URLs are present in either feed.
result: pass

### 5. Dev E2E Script Runs Against Dev Server
expected: Run `npm run test:e2e:dev`. Playwright starts with Turbopack dev server (~5s startup) instead of doing a full build. Tests execute against the dev server. Default `npm run test:e2e` behavior is unchanged (still does build + start).
result: pass

### 6. Code Block Copy Failure Shows Error State
expected: On a blog post with code blocks, if the clipboard API is unavailable or fails, clicking the copy button shows an X icon with "Copy failed" label instead of crashing. After 2 seconds it reverts back to the default copy icon.
result: pass

### 7. Copy Button Screen Reader Announcements
expected: The code block copy button has aria-live="polite" so screen readers announce state changes — "Copied!" on success, "Copy failed" on failure — without requiring focus.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
