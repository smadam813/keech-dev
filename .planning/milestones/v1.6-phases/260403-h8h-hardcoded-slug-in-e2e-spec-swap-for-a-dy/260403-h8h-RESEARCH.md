# Quick Task: Hardcoded Slug in E2E Spec - Research

**Researched:** 2026-04-03
**Domain:** Playwright E2E tests / Velite content pipeline
**Confidence:** HIGH

## Summary

The E2E spec `e2e/code-copy.spec.ts` hardcodes the slug `jira-vs-markdown-ai-agents` on line 8. This is the only spec with a hardcoded slug -- the other three specs (`mobile-menu`, `view-count`, `mobile-toc`) already use dynamic navigation (go to `/blog`, click first post).

The fix is straightforward: replace the hardcoded `goto('/blog/jira-vs-markdown-ai-agents')` with a dynamic approach that finds a post with code blocks at runtime. There is a secondary concern: `code-copy.spec.ts` specifically needs a post **with code blocks**, and currently only one post (`jira-vs-markdown-ai-agents`) has any fenced code. This means the dynamic lookup must still target a post with code blocks, not just any post.

**Primary recommendation:** Navigate to `/blog`, find a post link, visit it, then check for code blocks -- matching the pattern already used by the other three E2E specs. If no code block is found, `test.skip()` (the spec already has this guard on lines 14-17).

## Findings

### The Hardcoded Slug (the problem)

**File:** `e2e/code-copy.spec.ts`, line 8:
```typescript
await page.goto('/blog/jira-vs-markdown-ai-agents')
```

This breaks if:
- The post is renamed, deleted, or set to `draft: true`
- The slug changes for any reason
- A new developer clones the repo without that specific content

### How Other Specs Handle It (the pattern to follow)

Three other specs already solve this with the same pattern:

```typescript
// From view-count.spec.ts, mobile-toc.spec.ts
await page.goto('/blog')
const firstPost = page.locator('a[href^="/blog/"]').first()
await firstPost.click()
await page.waitForURL(/\/blog\/.+/)
```

This is resilient because:
- It works with any content set (at least one published post needed)
- No slug knowledge required
- Follows real user navigation flow

### The Code Block Constraint

`code-copy.spec.ts` specifically needs a post with `<figure data-rehype-pretty-code-figure>` elements. Current content inventory:

| Post | Has Code Blocks |
|------|----------------|
| jira-vs-markdown-ai-agents | Yes (2 fenced blocks) |
| evolving-fintech-pdlc-agent-driven-development | No |
| bmad-method-rewriting-epic-story-breakdown | No |
| humans-writing-code-is-over | No |
| norse-wisdom-age-of-ai | No |

The spec already handles the "no code block" case with `test.skip()` (lines 14-17). So navigating to any post and then checking is safe.

### Recommended Approach

Two options, both valid:

**Option A: Navigate via listing page (preferred -- matches existing pattern)**
```typescript
await page.goto('/blog')
const firstPost = page.locator('a[href^="/blog/"]').first()
await firstPost.click()
await page.waitForURL(/\/blog\/.+/)

const codeBlock = page.locator('figure[data-rehype-pretty-code-figure]').first()
if (await codeBlock.count() === 0) {
  test.skip(true, 'No code blocks found on this blog post')
  return
}
```

Downside: first post (sorted newest-first) might not have code blocks. The skip guard handles it, but the test becomes a no-op when the newest post lacks code.

**Option B: Iterate posts until one with code blocks is found**
```typescript
await page.goto('/blog')
const postLinks = page.locator('a[href^="/blog/"]')
const count = await postLinks.count()

let codeBlock
for (let i = 0; i < count; i++) {
  await postLinks.nth(i).click()
  await page.waitForURL(/\/blog\/.+/)
  codeBlock = page.locator('figure[data-rehype-pretty-code-figure]').first()
  if (await codeBlock.count() > 0) break
  await page.goto('/blog') // go back and try next
}

if (!codeBlock || await codeBlock.count() === 0) {
  test.skip(true, 'No blog posts with code blocks found')
  return
}
```

More robust but more complex. Given this is a personal portfolio with known content, Option A is sufficient.

**Recommendation: Option A.** It matches the existing pattern in the other three specs, is simple, and the skip guard provides a clear signal if no code blocks exist.

### Content Pipeline Context

- Posts live in `content/posts/*.mdx`, compiled by Velite at build time
- The Playwright `webServer` config runs `npm run build && npm run start` (line 28 of `playwright.config.ts`), so Velite compiles content before tests run
- Blog listing sorts published (non-draft) posts newest-first
- The `.velite/` output is gitignored and regenerated each build

### No Build-Time Slug Injection Needed

An alternative approach would be to read content at test setup time (e.g., import Velite output or parse MDX frontmatter). This is unnecessary complexity -- the Playwright pattern of navigating the live site is simpler and more realistic.

## Common Pitfalls

### Pitfall 1: Iterating posts adds flaky timing
**What goes wrong:** Navigating back and forth between listing and posts in a loop introduces timing-dependent failures.
**How to avoid:** Stick with Option A (first post + skip guard). Only iterate if the test is consistently skipped and that becomes a problem.

### Pitfall 2: Clipboard permissions on first-post approach
**What goes wrong:** Nothing changes here -- the existing `context.grantPermissions(['clipboard-read', 'clipboard-write'])` still works regardless of which post is visited.
**How to avoid:** No action needed.

## Scope of Change

- **1 file to edit:** `e2e/code-copy.spec.ts`
- **Lines affected:** ~3 lines (replace line 8 `goto` with 3-line navigate-via-listing pattern)
- **Risk:** Very low -- the skip guard already exists for the "no code blocks" case
- **No new dependencies**

## Sources

### Primary (HIGH confidence)
- Direct file inspection of all 4 E2E specs in `e2e/`
- `velite.config.ts` -- content pipeline configuration
- `playwright.config.ts` -- test infrastructure setup
- `content/posts/` -- content inventory
- `src/app/blog/page.tsx` -- listing page sort order
