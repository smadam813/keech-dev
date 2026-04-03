# Codebase Concerns

**Analysis Date:** 2026-04-03

## v1.6 Milestone Summary

The v1.6 "Address Concerns" milestone resolved the majority of issues from the 2026-03-22 audit. All 38 requirements passed verification. The following categories are now addressed: error boundaries, code duplication (localStorage helpers, date formatting, filtered lists, tag/tech badges), security headers, slug validation, rate limiting, favicons, OG images, RSS feed, sitemap dates, copy button keyboard accessibility, VoiceOver list roles, mobile TOC, testing infrastructure, resume placeholder, color script mismatch, project image sizes, and dependency updates.

This document captures what remains and what emerged during v1.6 work.

## Moderate Severity

### Security: CSP Requires `unsafe-eval` for MDX Execution

- Issue: `new Function(code)` in the MDX rendering path forces `script-src 'unsafe-eval'` in the Content-Security-Policy header, weakening the CSP significantly
- Files: `src/components/blog/mdx-content.tsx` (line 14), `next.config.ts` (line 5)
- Impact: The `unsafe-eval` directive allows `eval()` and similar dynamic code execution in the browser. While a try-catch fallback now prevents crashes, the fundamental XSS vector from compromised build output remains. CSP cannot block it.
- Fix approach: Migrate to `next-mdx-remote` or a compile-time MDX approach that produces static React components instead of runtime `new Function()` execution. This would allow removing `unsafe-eval` entirely. Tracked as DEP-03 in milestone audit.

### Security: CSP Requires `unsafe-inline` for Syntax Highlighting

- Issue: `rehype-pretty-code` injects inline `style` attributes on code tokens, requiring `style-src 'unsafe-inline'` in the CSP
- Files: `next.config.ts` (line 6), `velite.config.ts` (rehype-pretty-code plugin)
- Impact: `unsafe-inline` for styles reduces protection against CSS injection attacks. This is a common tradeoff for syntax highlighting libraries.
- Fix approach: Investigate Shiki's CSS-variables theme approach or a transformer that outputs class-based styling instead of inline styles. Alternatively, generate nonce-based CSP headers via middleware.

### Security: Dependency Vulnerabilities

- Issue: `npm audit` reports 3 vulnerabilities (2 high in `flatted` and `picomatch`, 1 moderate). These are transitive dependencies.
- Files: `package.json`, `package-lock.json`
- Impact: `flatted` has unbounded recursion DoS and prototype pollution via `parse()`. `picomatch` has ReDoS via extglob quantifiers and method injection in POSIX character classes. Both are transitive (not directly used in application code) but present in the dependency tree.
- Fix approach: Run `npm audit fix`. If transitive dependencies cannot be updated directly, use `overrides` in `package.json` to force patched versions.

### Linting: `eslint-config-next` Version Mismatch

- Issue: `eslint-config-next` is pinned at `16.1.6` while `next` is at `16.2.2`. Additionally, ESLint produces 4 errors and 10 warnings on a clean run.
- Files: `package.json` (line 54: `eslint-config-next@^16.1.6`), `eslint.config.mjs`
- Impact: The version skew between `next` and `eslint-config-next` may cause rule drift. The 4 errors are:
  - 3x `@next/next/no-html-link-for-pages` in error boundary fallbacks (`src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/blog/[slug]/error.tsx`, `src/components/blog/mdx-content.tsx`) — these use `<a>` instead of `<Link>` intentionally (error boundaries should not depend on Next.js router)
  - The 10 warnings are `react-hooks/set-state-in-effect` (4x) and `react-hooks/refs` (1x) — downgraded to warnings in config but still firing
- Fix approach: Update `eslint-config-next` to match `next` version (`^16.2.2`). For the `<a>` errors in error boundaries, add targeted ESLint disable comments with explanation — error boundaries intentionally avoid `<Link>` to prevent cascading failures. For `set-state-in-effect` warnings, these are intentional patterns (localStorage reads in `useLayoutEffect`, media query sync) that React 19's stricter rules flag.

### Lint Script: `next lint` CLI Removed

- Issue: The original `npm run lint` script used `next lint`, which was removed in Next.js 16.2.2. The script has been updated to `eslint .` but this was a breaking change during v1.6.
- Files: `package.json` (line 8: `"lint": "eslint ."`)
- Impact: Resolved for the project, but worth noting that Next.js major CLI changes can break CI-like workflows. The current `eslint .` invocation works but does not benefit from Next.js's automatic ESLint configuration detection that `next lint` provided.
- Fix approach: No action needed. Current setup works. Monitor Next.js release notes for lint tooling changes.

### Missing: No Middleware

- Issue: No `src/middleware.ts` exists. Security headers are applied via `next.config.ts` `headers()` function, and rate limiting is applied per-route in API handlers.
- Files: No middleware file exists
- Impact: Headers applied via `next.config.ts` work for static and dynamic routes but cannot be dynamic (e.g., nonce-based CSP). Rate limiting in individual route handlers means each new API route must independently remember to add rate limiting. Middleware would centralize both.
- Fix approach: Consider adding `src/middleware.ts` for centralized security headers with nonce-based CSP and global rate limiting. This would also enable removing `unsafe-inline` from style-src by using nonces.

## Minor Severity

### Code Quality: React 19 Lint Warnings (10 warnings)

- Issue: React 19's stricter `react-hooks` rules flag intentional patterns used throughout the codebase
- Files:
  - `src/components/blog/view-counter.tsx` (line 17) — `setCounts` in `useLayoutEffect` for localStorage cache read
  - `src/components/blog/listing-view-counts.tsx` (line 33) — same pattern
  - `src/hooks/use-hero-animation.ts` (lines 40, 54) — `setPrefersReducedMotion` and `setRevealStage` in effects for external system sync
  - `src/components/hero.tsx` (line 63) — ref access in render for computed glow positions
- Impact: 10 warnings on every lint run. These are all intentional patterns (localStorage reads before paint, media query sync, computed positions from refs). The warnings are downgraded from errors via `eslint.config.mjs` rules but add noise.
- Fix approach: For localStorage patterns, consider `useSyncExternalStore` with a localStorage adapter to eliminate the `useLayoutEffect` + `setState` pattern. For media query sync, use `useSyncExternalStore` with `matchMedia`. For ref reads in render, this is a computed value pattern that React 19 flags but is functionally correct for positional data.

### Code Quality: `<a>` Tags in Error Boundaries (4 errors)

- Issue: Error boundary fallback UIs use raw `<a>` tags instead of Next.js `<Link>` component
- Files: `src/app/error.tsx` (line 26), `src/app/global-error.tsx` (line 32), `src/app/blog/[slug]/error.tsx` (line 28), `src/components/blog/mdx-content.tsx` (line 29)
- Impact: ESLint reports 4 errors. However, this is intentional — error boundaries should not depend on the Next.js router, which may itself be in an error state. Using `<a>` ensures navigation works even during catastrophic failures.
- Fix approach: Add `// eslint-disable-next-line @next/next/no-html-link-for-pages` comments above each `<a>` tag with a brief explanation. This documents the intent and silences the errors.

### Performance: OG Image Font Loading Uses `readFile`

- Issue: Blog post OG image generation loads the Inter-Bold font via `readFile(join(process.cwd(), ...))` instead of `fetch` or `import.meta.url`
- Files: `src/app/blog/[slug]/opengraph-image.tsx` (lines 14-16), `src/app/opengraph-image.tsx` (same pattern likely)
- Impact: This is a Turbopack workaround. The `readFile`/`process.cwd()` approach works in production but may break if the build output directory structure changes. It also prevents edge runtime deployment since `node:fs` is not available at the edge.
- Fix approach: Low priority. Monitor Turbopack's support for font loading in OG image routes. When Turbopack supports `fetch` for local assets in image generation, migrate to that approach.

### Dependency: Velite Pre-Release (0.x.x)

- Issue: `velite@0.3.1` is pre-release. The API surface may change on minor version bumps per semver 0.x conventions.
- Files: `package.json` (line 42: `"velite": "^0.3.1"`), `velite.config.ts`
- Impact: A Velite upgrade could require config file changes, schema API changes, or output format changes. The `.velite/` import alias and collection schemas are tightly coupled.
- Fix approach: Pin the exact version (`"velite": "0.3.1"` without caret) to prevent accidental upgrades. Test upgrades in a branch.

### Dependency: Major Version Updates Available

- Issue: `@vercel/analytics` (`1.6.1` -> `2.0.1` major) and `shiki` (`3.22.0` -> `4.0.2` major) have major version bumps available
- Files: `package.json`
- Impact: Major versions may introduce breaking API changes. `@vercel/analytics` v2 may change the import or initialization pattern. Shiki v4 may affect rehype-pretty-code integration.
- Fix approach: Evaluate each migration separately. Check changelogs for breaking changes before upgrading.

### Accessibility: `useLayoutEffect` SSR Warning Potential

- Issue: `useLayoutEffect` is used in two client components for localStorage reads
- Files: `src/components/blog/view-counter.tsx` (line 15), `src/components/blog/listing-view-counts.tsx` (line 23)
- Impact: Currently safe because components are exclusively client-rendered (`'use client'` directive). If rendering approach ever changes, `useLayoutEffect` generates React warnings during SSR.
- Fix approach: No action needed unless SSR is required. The `useSyncExternalStore` migration mentioned in the lint warnings section would also resolve this.

### Housekeeping: Worktree Artifacts (3.6 GB)

- Issue: `.claude/worktrees/` contains 7+ agent worktree directories consuming 3.6 GB of disk space
- Files: `.claude/worktrees/agent-a0f09039/`, `.claude/worktrees/agent-a4b27611/`, and 5 others
- Impact: Disk space waste. These directories are gitignored but persist locally. Each contains a full copy of `node_modules` and build artifacts.
- Fix approach: Delete stale worktree directories: `rm -rf .claude/worktrees/agent-*`. These are ephemeral Claude Code agent working directories that are safe to remove after their tasks complete.

## Scaling Considerations

### Content Volume

- Current state: 5 blog posts, 2 projects
- Concern: All posts and projects are loaded into memory as full collections via Velite. At 500+ posts with full MDX body content, build memory usage could spike.
- Files: `velite.config.ts`, all listing pages that import from `@/.velite`
- Scaling path: Not a near-term concern. Monitor build duration and memory as content grows.

### Redis Key Growth

- Current state: Each unique IP+slug combination creates a dedup key with 24h TTL. Each post slug creates a permanent view count key. Rate limit keys use sliding window with automatic expiry.
- Concern: Dedup keys are self-cleaning (24h TTL). View count keys grow linearly with post count. Rate limit keys managed by `@upstash/ratelimit`.
- Files: `src/app/api/views/[slug]/route.ts`, `src/lib/rate-limit.ts`
- Scaling path: Upstash free tier allows 10K commands/day. At current content volume, this is not a concern.

## Test Coverage Assessment

### Current State

17 test files exist covering:
- **Unit tests (Vitest):** Error boundaries, loading skeleton, copy button, MDX content, filter chip, hooks (filtered list, glow positions, hero animation), lib utilities (format, rate limit, rune glows, security headers, SEO assets, validation, views)
- **E2E tests (Playwright):** Mobile menu, code copy, view count, mobile TOC

### Gaps

- **API route handlers** (`src/app/api/views/route.ts`, `src/app/api/views/[slug]/route.ts`) have no unit tests. The validation and rate limiting logic they use is tested, but the route handler integration (request parsing, Redis interaction, response formatting) is not.
- **Page components** (`src/app/blog/page.tsx`, `src/app/projects/page.tsx`, etc.) have no component tests. These are server components which are harder to unit test but could have integration tests.
- **OG image generation** (`src/app/opengraph-image.tsx`, `src/app/blog/[slug]/opengraph-image.tsx`) is untested. The SEO assets test file (`src/lib/seo-assets.test.ts`) exists but OG image rendering output is not verified.

---

*Concerns audit: 2026-04-03*
