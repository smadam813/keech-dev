---
status: complete
phase: 16-mdx-migration
source: [16-01-SUMMARY.md, 16-02-SUMMARY.md]
started: 2026-04-04T05:00:00Z
updated: 2026-04-04T05:02:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Blog Post Content Renders
expected: Navigate to a blog post. The full post content displays correctly — headings, paragraphs, links, images, and any other markdown elements render as expected. No blank page, no raw HTML, no errors.
result: pass

### 2. Project Page Content Renders
expected: Navigate to a project page (e.g. /projects/any-project). The project description and content render correctly as formatted HTML. No raw HTML visible, no blank content area.
result: pass

### 3. Code Block Copy Button
expected: On a blog post that contains code blocks, each code block shows a copy button (clipboard icon). Clicking it copies the code to clipboard and the icon changes to a checkmark briefly.
result: pass

### 4. List Accessibility (role="list")
expected: Inspect a blog post containing bullet or numbered lists. The `<ul>` or `<ol>` elements have `role="list"` attribute present in the DOM (check via browser DevTools). This ensures VoiceOver announces them as lists.
result: pass

### 5. CSP Headers — No unsafe-eval
expected: Check response headers for any page (browser DevTools → Network tab → select the document request → Headers). The `Content-Security-Policy` header's `script-src` directive should contain `'self' 'unsafe-inline'` but NOT `'unsafe-eval'`.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
