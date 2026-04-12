---
phase: 24-audit-gap-closures
reviewed: 2026-04-11T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/lib/posts.ts
  - src/lib/posts.test.ts
  - src/app/blog/[slug]/page.tsx
  - src/app/blog/[slug]/opengraph-image.tsx
  - src/app/blog/page.tsx
  - src/app/feed.xml/route.ts
  - src/app/sitemap.ts
  - src/components/blog/code-block-enhancer.tsx
  - src/components/blog/code-block-enhancer.test.tsx
  - src/lib/seo-assets.test.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 24: Code Review Report

**Reviewed:** 2026-04-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This phase adds a centralized `publishedPosts` draft guard, per-post OG image generation, a DOM-based code block copy enhancer, and a comprehensive SEO/gap test suite. All ten files reviewed. The draft guard implementation in `src/lib/posts.ts` and its test coverage are correct. The `CodeBlockEnhancer` component and test coverage are solid with good edge case handling. The SEO test suite is thorough and statically-validates assets without needing a runtime.

Three warnings and two info items were found — no critical issues.

The most actionable warning is the `proxy.ts` file being used as `src/middleware.ts` in name but exporting as `proxy` rather than `middleware`, and the `config` export using the Next.js middleware matcher shape — this is a naming mismatch that could silently cause the security headers to never be applied in production. It requires investigation (see WR-01). The other two warnings are a subtle `lastBuildDate` fallback that silently substitutes "now" when the feed is empty, and a one-way idempotency hole in the `CodeBlockEnhancer` run-once guard.

---

## Warnings

### WR-01: `proxy.ts` default export is named `proxy`, not `middleware` — security headers may not apply

**File:** `src/proxy.ts:15`
**Issue:** Next.js middleware requires the file to be named `src/middleware.ts` (or `middleware.ts` at the project root) and its default export to be named `middleware`. The file is named `proxy.ts` and the default export is `function proxy()`. The `config.matcher` object is present, which is only meaningful to the Next.js middleware system. If this file is not re-exported from an actual `src/middleware.ts`, the CSP, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` headers are never set — all security hardening described in CLAUDE.md silently fails.

No `src/middleware.ts` was found in the repository. The test in `seo-assets.test.ts` (SEC-01) reads `src/proxy.ts` directly and will pass regardless of whether Next.js actually loads it as middleware. That test gives a false sense of security.

**Fix:** Either rename the file to `src/middleware.ts` and the export to `middleware`, or add a `src/middleware.ts` that re-exports from `proxy.ts`:
```typescript
// src/middleware.ts
export { default, config } from './proxy'
```
Then update the SEC-01 test to read `src/middleware.ts` instead of `src/proxy.ts`.

---

### WR-02: `lastBuildDate` in RSS feed falls back to `Date.now()` when `publishedPosts` is empty

**File:** `src/app/feed.xml/route.ts:15`
**Issue:** The expression `new Date(sortedPosts[0]?.date ?? Date.now()).toUTCString()` silently uses the current wall-clock time when `publishedPosts` is empty (i.e., `sortedPosts[0]` is `undefined`). This means the RSS feed's `<lastBuildDate>` will be a non-deterministic value in CI/test builds that have no published posts, causing cache-busting on every request and potentially confusing feed readers into thinking content was updated.

Additionally, the `Date.now()` fallback produces the current time in milliseconds which is a valid input to `new Date()`, so there is no error — the bug is silent.

**Fix:** Use a fixed sentinel date instead of `Date.now()`:
```typescript
const lastBuildDate = sortedPosts.length > 0
  ? new Date(sortedPosts[0].date).toUTCString()
  : new Date(0).toUTCString()  // epoch for empty feed — deterministic
```

---

### WR-03: `CodeBlockEnhancer` run-once guard is mount-scoped, not DOM-scoped — fails on fast-refresh re-mounts

**File:** `src/components/blog/code-block-enhancer.tsx:15-19`
**Issue:** The `enhanced` ref is a component-instance ref initialized to `false`. On React fast-refresh (dev) or any re-mount (e.g., concurrent mode Strict Mode double-invoke), the component mounts a second instance with `enhanced.current = false`, runs the effect again, and skips the "already wrapped" check at line 29 only if the pre's parent has class `group`. However, in Strict Mode, the first mount's effect fires, DOM is mutated, effect cleanup runs (there is none), then the effect fires again on the second mount. Since `enhanced` is per-instance and the second instance is a new ref, it will run again — the DOM guard on line 29 (`pre.parentElement?.classList.contains('group')`) saves correctness here, but the button `addEventListener` will be attached twice to the same button element created in the first run because the wrapper/button are re-created each time the check passes.

In production this does not trigger, but the guard pattern is misleading: the ref protects against the effect running twice within the same component lifetime, while the real double-wrap protection is the DOM class check on line 29. The ref could be removed and the comment updated to clarify the DOM check is the idempotency guard.

**Fix:** Remove the ref-based guard and rely solely on the DOM class check, or add a `data-enhanced` attribute to mark the container as processed:
```typescript
// Replace ref guard with a data-attribute guard on the container
const container = document.querySelector('.prose')
if (!container || container.hasAttribute('data-code-enhanced')) return
container.setAttribute('data-code-enhanced', 'true')
```
This makes idempotency observable in the DOM and survives re-mounts correctly.

---

## Info

### IN-01: `src/lib/posts.ts` exports a module-level constant evaluated at import time

**File:** `src/lib/posts.ts:9`
**Issue:** `publishedPosts` is a `const` evaluated once when the module is first imported. In the Next.js build pipeline this is correct — Velite's content is static. However, the pattern means tests must mock `@/.velite` before importing `./posts` (which the test correctly does with `vi.mock` before the import). The comment on line 7 calls this out. No change needed — this is documented well and correct for the use case. Noting for visibility.

**Fix:** No action required. The existing comment is sufficient documentation.

---

### IN-02: `seo-assets.test.ts` reads source files via `fs.readFileSync` to assert structural properties

**File:** `src/lib/seo-assets.test.ts:48-83`
**Issue:** Several tests in the SEO-02 and SEO-03 suites assert that source files contain specific string literals (e.g., `export const size`, `'1200'`, `'#E8B4B8'`). These are brittle text-search assertions rather than runtime-validated behavior. They will pass even if the code is syntactically broken, and will falsely fail on trivially equivalent refactors (e.g., extracting the size into a variable with a different name). They provide low confidence compared to actual import + call tests.

This is a deliberate tradeoff (noted in the file header: "no Next.js runtime is needed"), so this is info-only. Consider adding at least one runtime assertion per OG image route if a lightweight test harness becomes available.

**Fix:** Low priority. If the OG image routes become testable (e.g., via a Playwright visual test or a lightweight Node invocation), migrate the structural tests to behavioral ones. For now, the existing approach is acceptable given the `ImageResponse` / jsdom incompatibility constraint.

---

_Reviewed: 2026-04-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
