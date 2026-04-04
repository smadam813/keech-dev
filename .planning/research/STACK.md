# Technology Stack

**Project:** keech.dev v1.7 - CSP Hardening, MDX Migration, Lint Cleanup
**Researched:** 2026-04-03
**Overall Confidence:** MEDIUM (MDX migration path has tradeoffs; syntax highlighting migration is well-documented)

## Executive Summary

This milestone requires NO new npm dependencies for four of five workstreams. The MDX `new Function()` elimination is the only area requiring a new package (`@mdx-js/mdx`), and even that is conditional on a non-trivial architectural change. The syntax highlighting CSP fix uses Shiki's existing `@shikijs/transformers` package (already a transitive dependency of `shiki`). The middleware, `useSyncExternalStore`, and audit fixes are all achievable with existing dependencies or native React APIs.

The biggest finding: **nonce-based CSP is incompatible with static generation**. The site is fully statically generated and deployed to Vercel CDN. Nonces require per-request dynamic rendering, which would kill performance and CDN caching. The correct approach is middleware that applies static CSP headers (no nonces) but centralizes header management, combined with eliminating the *need* for `unsafe-eval` and `unsafe-inline` through code changes.

## Recommended Stack Changes

### New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@shikijs/transformers` | ^4.0.2 | Convert Shiki inline styles to CSS classes | Eliminates `unsafe-inline` from `style-src` CSP. Uses `transformerStyleToClass` which operates on HAST-level hooks (`pre`, `tokens`), confirmed compatible with rehype plugins. Already a sub-dependency of `shiki` but needs direct installation for import access. |

### Dependencies to Update

| Technology | From | To | Why |
|------------|------|-----|-----|
| `eslint-config-next` | ^16.1.6 | ^16.2.2 | Match `next@^16.2.2` to prevent rule drift |

### Dependencies to Pin

| Technology | From | To | Why |
|------------|------|-----|-----|
| `velite` | ^0.3.1 | 0.3.1 | Pre-release (0.x.x) semver means minor bumps can break. Pin exact to prevent accidental upgrades. |

### No New Dependencies Needed

| Capability | Why No Package Needed |
|------------|----------------------|
| Next.js middleware | Built into Next.js -- create `src/middleware.ts` |
| `useSyncExternalStore` | Built into React 19 -- import from `react` |
| npm audit fixes | `npm audit fix` resolves all 3 vulnerabilities via transitive updates |
| ESLint disable comments | Configuration change only |

## Detailed Analysis by Workstream

### 1. MDX Rendering: Eliminating `unsafe-eval`

**Current state:** Velite's `s.mdx()` compiles MDX to a function-body string at build time. `MDXContent` component executes it via `new Function(code)` at runtime, requiring `unsafe-eval` in CSP.

**The core problem:** Velite intentionally outputs function-body strings (not importable modules). This is by design -- it avoids bundling component trees at build time, keeping output lean. The `new Function()` pattern IS Velite's recommended rendering approach.

**Option A: Use `@mdx-js/mdx` `run()` function (RECOMMENDED)**
- Install `@mdx-js/mdx` and use its `run()` function to execute the function-body string
- `run()` internally uses `new Function()` -- BUT it provides a cleaner API and is the official MDX way to execute function-body output
- **This does NOT eliminate `unsafe-eval`** -- it just wraps the same mechanism
- Confidence: HIGH that it works, but does NOT solve the CSP goal

**Option B: Switch to `@shikijs/rehype` + direct MDX file imports via `@next/mdx`**
- Replace Velite's MDX pipeline entirely with `@next/mdx` which compiles MDX files to importable React components
- Would eliminate `new Function()` entirely
- **Breaks the entire Velite content pipeline** -- frontmatter, collections, type-safe schemas, TOC generation, excerpt extraction all depend on Velite
- NOT recommended -- too much breakage for the CSP gain

**Option C: Accept `unsafe-eval` with documented rationale (RECOMMENDED)**
- The MDX content is author-controlled (not user-generated)
- Build output is trusted (Velite compiles at build time, deployed via git push)
- `unsafe-eval` is a weaker CSP but acceptable when content source is trusted
- Document the security boundary clearly
- Remove `unsafe-eval` only if/when Velite adds an alternative output format

**Verdict:** Keep `new Function()` for now. The `unsafe-eval` directive is a pragmatic tradeoff for author-controlled content. No package solves this without replacing Velite. Focus CSP hardening efforts on the achievable wins (removing `unsafe-inline` from styles, adding middleware).

**Confidence:** HIGH -- verified through Velite docs, MDX docs, and `@mdx-js/mdx` source analysis. All `function-body` execution paths use eval-equivalent mechanisms.

### 2. Syntax Highlighting: Eliminating `unsafe-inline` from `style-src`

**Current state:** `rehype-pretty-code` with `theme: 'github-dark-dimmed'` injects inline `style` attributes on every code token `<span>`, requiring `style-src 'unsafe-inline'`.

**Solution: `transformerStyleToClass` from `@shikijs/transformers`**

This is the Shiki maintainer-recommended approach (confirmed in [shiki#671](https://github.com/shikijs/shiki/issues/671) by Anthony Fu):

```typescript
import { transformerStyleToClass } from '@shikijs/transformers'

const toClass = transformerStyleToClass({
  classPrefix: '__shiki_',
})
```

**How it works:**
1. Replaces all inline `style` attributes with generated CSS class names
2. Class names are deterministic hashes of the style values
3. `toClass.getCSS()` returns the corresponding CSS rules
4. The CSS is injected into a stylesheet (not inline), which is CSP-safe

**Integration with Velite pipeline:**

The transformer operates on HAST-level hooks (`pre` and `tokens`), NOT the `postprocess` hook. This is critical because `@shikijs/rehype` and `rehype-pretty-code` both operate on HAST -- the `postprocess` hook is never called in rehype pipelines. Since `transformerStyleToClass` uses `pre`/`tokens` hooks, it IS compatible.

**Two sub-approaches for the rehype plugin:**

| Approach | Plugin | Pros | Cons |
|----------|--------|------|------|
| A: Keep rehype-pretty-code | `rehype-pretty-code` | No migration, just add transformer | Need to verify transformer passthrough works with rehype-pretty-code's wrapper |
| B: Switch to @shikijs/rehype | `@shikijs/rehype` | Direct Shiki integration, documented transformer support, Velite docs show this as option | Lose rehype-pretty-code's extra features (line highlighting markup, title blocks) |

**Recommendation:** Try approach A first (add `transformerStyleToClass` to `rehype-pretty-code`'s `transformers` option). If incompatible, fall back to approach B (`@shikijs/rehype` which Velite documents as a supported alternative).

**CSS extraction challenge:** `getCSS()` must be called after build-time compilation, and the CSS must be available in the page's stylesheet. Options:
1. Generate a static CSS file during Velite build and import it in `globals.css`
2. Use a Velite transform hook to write the CSS file
3. Include the CSS as a `<style>` tag with a hash in CSP (less ideal)

**Confidence:** HIGH for the transformer mechanism. MEDIUM for the build-time CSS extraction integration (needs implementation-phase validation).

### 3. Next.js Middleware for Centralized Security Headers

**Current state:** Security headers defined in `next.config.ts` `headers()` function. Works for static and dynamic routes but cannot generate per-request values (nonces).

**Critical finding: Nonces are NOT viable for this site.**

The site is fully statically generated (`generateStaticParams()` on all content pages). Nonce-based CSP requires `dynamic = 'force-dynamic'` on every page, which:
- Kills CDN caching (every request hits the origin server)
- Increases TTFB dramatically
- Increases Vercel costs (serverless function invocations vs. static CDN)
- Defeats the purpose of static generation

This is confirmed by [Next.js CSP documentation](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy) and multiple community discussions.

**Recommended approach: Middleware with static CSP headers**

Create `src/middleware.ts` that:
1. Sets all security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
2. Uses static CSP directives (no nonces) -- hardened by removing `unsafe-inline` from `style-src`
3. Centralizes header logic (remove from `next.config.ts headers()`)
4. Can later add rate limiting, redirects, or other cross-cutting concerns

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // Set security headers on response
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  // ...
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**No new dependencies needed.** Middleware is a built-in Next.js feature.

**Confidence:** HIGH -- well-documented Next.js pattern, no compatibility concerns with static generation (middleware runs at the edge before serving cached static pages on Vercel).

### 4. `useSyncExternalStore` for localStorage and Media Queries

**Current state:** Two patterns trigger React 19 lint warnings:
- `useLayoutEffect` + `setState` for localStorage reads (view-counter.tsx, listing-view-counts.tsx)
- `useEffect` + `setState` for `matchMedia` sync (use-hero-animation.ts)

**Solution: React 19's built-in `useSyncExternalStore`**

No new package needed. `useSyncExternalStore` is in React 19 core.

**Pattern for localStorage:**
```typescript
import { useSyncExternalStore } from 'react'

function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('storage', callback)
      return () => window.removeEventListener('storage', callback)
    },
    () => localStorage.getItem(key),    // client snapshot
    () => null                           // server snapshot (SSR-safe)
  )
}
```

**Pattern for matchMedia:**
```typescript
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false  // server snapshot
  )
}
```

**Benefits:**
- Eliminates `useLayoutEffect` + `setState` pattern (removes React 19 lint warnings)
- SSR-safe via `getServerSnapshot` parameter (no `useLayoutEffect` SSR warning risk)
- Semantically correct -- localStorage and matchMedia ARE external stores
- Reduces lint warnings from 10 to ~5 (the remaining ones are animation orchestration effects that are correct as-is)

**Confidence:** HIGH -- `useSyncExternalStore` is a stable React API, well-documented for exactly these patterns.

### 5. npm Audit Vulnerability Fixes

**Current vulnerabilities (3 packages, all transitive):**

| Package | Severity | Via | Fix |
|---------|----------|-----|-----|
| `flatted` 3.3.3 | HIGH (DoS + prototype pollution) | `eslint` > `file-entry-cache` > `flat-cache` | `npm audit fix` updates to 3.4.2 |
| `picomatch` 2.3.1 | HIGH (ReDoS + method injection) | `eslint-config-next` > `fast-glob` > `micromatch` | `npm audit fix` updates to 2.3.2 |
| `picomatch` 4.0.3 | HIGH (same) | `vitest` > `tinyglobby` | `npm audit fix` updates to 4.0.4 |
| `brace-expansion` 1.1.12/2.0.2 | MODERATE (DoS) | `eslint`/`typescript-eslint` | `npm audit fix` updates to 1.1.13/2.0.3 |

**Verified:** `npm audit fix --dry-run` confirms all fixes are available via direct updates (no `--force` or `overrides` needed).

**Action:** Run `npm audit fix`. No `package.json` overrides required.

**Note:** Updating `eslint-config-next` to ^16.2.2 (workstream 3) may also resolve the `picomatch` vulnerability through `eslint-config-next` by pulling in a newer `fast-glob`.

**Confidence:** HIGH -- verified with `npm audit fix --dry-run`.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| MDX rendering | Keep `new Function()` + `unsafe-eval` | `next-mdx-remote/rsc` | Broken with Next.js 15.2+ ([github#488](https://github.com/hashicorp/next-mdx-remote/issues/488)), would break on Next.js 16 |
| MDX rendering | Keep `new Function()` | `safe-mdx` | Cannot use rehype plugins, no syntax highlighting support, would require rewriting entire content pipeline |
| MDX rendering | Keep `new Function()` | `@next/mdx` direct imports | Would replace Velite entirely -- loses type-safe collections, frontmatter schemas, TOC, excerpts |
| Syntax highlighting | `transformerStyleToClass` | Shiki `css-variables` theme | Still outputs inline `style` attributes (just with CSS variable values instead of colors) -- does NOT fix CSP |
| Syntax highlighting | `transformerStyleToClass` | Nonce-based CSP for styles | Requires dynamic rendering, kills static generation |
| CSP middleware | Static headers in middleware | Nonce-based middleware | Incompatible with static generation, kills CDN caching |
| localStorage sync | `useSyncExternalStore` | Keep `useLayoutEffect` | Lint warnings persist, SSR-unsafe pattern |

## What NOT to Add

| Package | Why Not |
|---------|---------|
| `next-mdx-remote` | Broken with Next.js 15.2+, likely broken on 16.x |
| `@next-safe/middleware` | Last updated for Next.js 12, uses Pages Router patterns |
| `@next/mdx` | Would replace Velite, massive scope creep |
| `safe-mdx` | Too limited (no rehype plugins, no syntax highlighting) |
| `helmet` or `csp-header` | Overkill for static CSP; hand-written middleware is simpler |
| `shiki` v4 | Major version bump available (4.0.2) but `rehype-pretty-code@0.14.1` may not support it yet; evaluate separately |

## Installation

```bash
# New dependency
npm install @shikijs/transformers

# Update eslint-config-next to match next version
npm install -D eslint-config-next@^16.2.2

# Fix audit vulnerabilities (all transitive)
npm audit fix

# Pin velite exact version (edit package.json manually)
# Change "velite": "^0.3.1" to "velite": "0.3.1"
```

## Integration Points with Existing Pipeline

### velite.config.ts Changes

```typescript
// Add transformer to rehype-pretty-code options
import { transformerStyleToClass } from '@shikijs/transformers'

const shikiClassTransformer = transformerStyleToClass({
  classPrefix: '__shiki_',
})

// In mdx.rehypePlugins:
[rehypePrettyCode, {
  theme: 'github-dark-dimmed',
  keepBackground: true,
  defaultLang: { block: 'typescript', inline: 'typescript' },
  transformers: [shikiClassTransformer],
}]

// After build: shikiClassTransformer.getCSS() contains the stylesheet
```

### CSP Header Migration Path

```
next.config.ts headers()  -->  src/middleware.ts
  - Remove async headers() from next.config.ts
  - Move all security headers to middleware
  - Update CSP: remove 'unsafe-inline' from style-src (after transformer migration)
  - Keep 'unsafe-eval' in script-src (MDX requirement, documented)
```

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Syntax highlighting (transformerStyleToClass) | HIGH | Shiki maintainer-recommended, HAST-compatible hooks confirmed |
| Middleware (static CSP) | HIGH | Standard Next.js pattern, no nonce complexity |
| useSyncExternalStore | HIGH | Stable React API, exact use case it was designed for |
| npm audit fixes | HIGH | Verified with --dry-run |
| MDX unsafe-eval removal | HIGH (that it CANNOT be removed) | All execution paths for Velite function-body output require eval-equivalent |
| CSS extraction at build time | MEDIUM | getCSS() mechanism is clear but integration with Velite build pipeline needs validation |

## Sources

- [Velite MDX documentation](https://velite.js.org/guide/using-mdx)
- [Velite code highlighting documentation](https://velite.js.org/guide/code-highlighting)
- [Shiki CSP inline styles issue #671](https://github.com/shikijs/shiki/issues/671)
- [Shiki transformerStyleToClass PR #826](https://github.com/shikijs/shiki/pull/826)
- [Shiki transformers documentation](https://shiki.style/packages/transformers)
- [Shiki css-variables theme](https://shiki.style/guide/theme-colors)
- [@shikijs/rehype documentation](https://shiki.style/packages/rehype)
- [Next.js CSP guide](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [next-mdx-remote RSC broken on Next.js 15.2+](https://github.com/hashicorp/next-mdx-remote/issues/488)
- [MDX on-demand compilation guide](https://mdxjs.com/guides/mdx-on-demand/)
- [safe-mdx repository](https://github.com/holocron-hq/safe-mdx)
- [rehype-pretty-code documentation](https://rehype-pretty.pages.dev/)
