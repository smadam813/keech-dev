---
phase: quick
plan: 260403-h8h
subsystem: e2e-tests
tags: [e2e, playwright, resilience]
dependency_graph:
  requires: []
  provides: [dynamic-e2e-navigation]
  affects: [e2e/code-copy.spec.ts]
tech_stack:
  added: []
  patterns: [dynamic-listing-navigation]
key_files:
  modified: [e2e/code-copy.spec.ts]
decisions:
  - Used Option A (first post + skip guard) per research recommendation, not Option B (iterate all posts)
metrics:
  duration: "28s"
  completed: "2026-04-03"
  tasks_completed: 1
  tasks_total: 1
---

# Quick Task 260403-h8h: Hardcoded Slug in E2E Spec Summary

Replaced hardcoded `/blog/jira-vs-markdown-ai-agents` slug in code-copy E2E spec with dynamic listing navigation via `/blog` page, matching the pattern already used by the other three E2E specs.

## What Changed

Replaced the direct `page.goto('/blog/jira-vs-markdown-ai-agents')` with a 3-line dynamic navigation pattern:

```typescript
await page.goto('/blog')
const firstPost = page.locator('a[href^="/blog/"]').first()
await firstPost.click()
await page.waitForURL(/\/blog\/.+/)
```

The existing skip guard (`test.skip` when no code blocks found) remains unchanged and handles the case where the first post lacks code blocks.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Replace hardcoded slug with dynamic listing navigation | ed80b09 | e2e/code-copy.spec.ts |

## Verification Results

- No hardcoded slugs remain in `e2e/` directory (`grep -r "jira-vs-markdown" e2e/` returns nothing)
- `code-copy.spec.ts` contains `page.goto('/blog')` and `a[href^="/blog/"]` locator
- All 4 E2E specs now use dynamic navigation
- Skip guard still present for posts without code blocks
- Existing test logic (hover, copy, copied state, revert) unchanged

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None.
