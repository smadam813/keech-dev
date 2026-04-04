# Architecture Patterns

**Domain:** CSP hardening, MDX migration, middleware, lint cleanup for existing Next.js 16 portfolio
**Researched:** 2026-04-03
**Supersedes:** v1.6 architecture research (2026-04-02)

## Integration Overview

This document answers four specific architecture questions about how new v1.7 features integrate with the existing keech.dev codebase. Each section identifies the exact integration points, new vs modified components, and build-order dependencies.

---

## 1. Replacing `new Function()` MDX Execution While Keeping Velite

### Current State

Velite's `s.mdx()` compiles MDX at build time into a **function-body string** stored in `.velite/posts.json`. The compiled output starts with `const{Fragment:e,jsx:t,jsxs:i}=arguments[0]` -- it is a raw JavaScript function body expecting `react/jsx-runtime` passed via `arguments[0]`.

`MDXContent` in `src/components/blog/mdx-content.tsx` (line 14) calls `new Function(code)` which constructs a function from this string, then invokes it with the jsx runtime to get a React component. This requires `'unsafe-eval'` in the CSP `script-src` directive.

The site currently has 5 blog posts and 2 projects. The body field is approximately 30KB per post.

### The Fundamental Constraint

MDX produces JavaScript. Running JavaScript from a string requires either `eval`, `new Function`, dynamic `import()` of a file, or avoiding JavaScript entirely. The MDX maintainers have stated this explicitly in [Discussion #2322](https://github.com/orgs/mdx-js/discussions/2322): there is no way to "run" compiled MDX without some form of dynamic code execution.

### Recommended Approach: Switch to `s.markdown()` with HTML Output

**Confidence: MEDIUM**

Switch from `s.mdx()` to `s.markdown()` in `velite.config.ts`. This produces an **HTML string** instead of a JavaScript function body. Render via `dangerouslySetInnerHTML` which is safe because:
- All content is author-controlled (no user-generated content)
- Content is compiled at build time by Velite with rehype plugins
- The HTML is deterministic and committed as build output

**What changes:**

| File | Change | Type |
|------|--------|------|
| `velite.config.ts` | `s.mdx()` -> `s.markdown()` on both collections | Modify |
| `src/components/blog/mdx-content.tsx` | Replace `new Function()` with `dangerouslySetInnerHTML={{ __html: code }}` | Modify (major rewrite) |
| `src/components/blog/mdx-content.tsx` | Remove `'use client'` directive -- no longer needs client-side JS execution | Modify |
| `src/components/blog/mdx-content.tsx` | Remove `react/jsx-runtime` import | Modify |
| `src/components/blog/code-block.tsx` | Must become a DOM-based client enhancement (see below) | Modify |
| `next.config.ts` or `src/middleware.ts` | Remove `'unsafe-eval'` from `script-src` | Modify |
| `.velite/posts.json` | Body field changes from JS function string to HTML string | Auto-regenerated |

**What you lose and how to recover it:**

1. **Custom `<ul role="list">` and `<ol role="list">` overrides:** Currently passed via MDX `components` prop. With HTML output, add a custom rehype plugin to `velite.config.ts` that adds `role="list"` attributes at compile time. This is a 10-line plugin.

2. **`<pre>` -> `CodeBlock` component mapping:** Currently the MDX component override system maps `pre` to `CodeBlock` at render time. With HTML output, two options:
   - **Option A (preferred):** Use a rehype plugin to wrap each `<pre>` element in a `<div class="code-block-wrapper" data-code-block>` at compile time. Then a client component queries the container for `[data-code-block]` elements and injects copy buttons via a `useEffect` + DOM manipulation approach.
   - **Option B:** Keep the HTML rendering as a server component and nest a thin client component that uses `useRef` + `useEffect` to find `<pre>` elements and append copy buttons to the DOM. This is essentially what many syntax-highlighting copy-button implementations do.

**MDXContent after migration (simplified):**

```typescript
// No longer needs 'use client'
interface MDXContentProps {
  code: string  // Now HTML string, not JS function body
}

function MDXFallback() { /* unchanged */ }

export function MDXContent({ code }: MDXContentProps) {
  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: code }}
    />
  )
}
```

The copy button functionality moves to a separate client component:

```typescript
// src/components/blog/code-block-enhancer.tsx
'use client'
import { useEffect, useRef } from 'react'

export function CodeBlockEnhancer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const preElements = containerRef.current.querySelectorAll('pre')
    // Inject copy buttons into DOM for each <pre>
  }, [])

  return <div ref={containerRef}>{children}</div>
}
```

### Alternative Considered: `safe-mdx` Library

**Confidence: LOW** -- not recommended.

[safe-mdx](https://github.com/holocron-hq/safe-mdx) parses raw MDX strings into an AST and renders without eval. However, it expects raw MDX source, not Velite's compiled function-body output. Using it would mean bypassing Velite's compilation pipeline entirely, adding a runtime dependency for parsing, and losing all build-time rehype plugin processing. This defeats the purpose of keeping Velite.

### Alternative Considered: Pre-compile to Static Files

**Confidence: LOW** -- fragile.

Write a post-Velite build step that takes each post's function-body string, executes it in Node.js via `renderToStaticMarkup()`, and writes HTML back. Preserves component overrides but adds build complexity, is fragile across React version changes, and is effectively doing at build time what `s.markdown()` already does natively.

### Recommendation

**Use `s.markdown()`.** The site uses zero MDX-specific features in content files -- no JSX components in posts, no imports, no expressions. The only "MDX features" are component overrides (`pre`, `ul`, `ol`) which can all be handled at the rehype level during compilation. This is the cleanest path to removing `unsafe-eval` with the least moving parts.

### Integration Point with Existing Architecture

The blog post page (`src/app/blog/[slug]/page.tsx`, line 108) passes `post.body` to `<MDXContent code={post.body} />`. The prop name stays the same but the value changes from "compiled JS function body" to "HTML string." The page component itself requires no changes. `generateStaticParams()` is unaffected. All other Velite collection fields (title, slug, toc, excerpt, tags, metadata) remain identical because they use separate schema functions (`s.toc()`, `s.excerpt()`, etc.) that are independent of `s.mdx()` vs `s.markdown()`.

---

## 2. Middleware for Nonce-Based CSP Without Breaking Static Generation

### Current State

Security headers are set in `next.config.ts` via the `headers()` function (lines 19-31). This applies static CSP headers to all routes matching `/(.*).` The CSP includes `'unsafe-eval'` and `'unsafe-inline'`.

No `src/middleware.ts` exists. Rate limiting is applied per-route in API handlers.

### The Static Generation Constraint

**Nonce-based CSP is fundamentally incompatible with fully static pages.** Nonces must be unique per request. Static pages are generated at build time and served from CDN cache with no per-request execution to generate or inject nonces.

Forcing dynamic rendering via `export const dynamic = 'force-dynamic'` would destroy CDN caching and SSG performance benefits across the entire site.

Next.js's `experimental.sri` (Subresource Integrity) is the hash-based alternative for static sites, but it is **webpack-only and does not work with Turbopack** ([Issue #66901](https://github.com/vercel/next.js/issues/66901)), which is the default bundler in Next.js 16. Not a viable path.

### Recommended Approach: Middleware for Centralized Static CSP (No Nonces)

**Confidence: HIGH**

Use middleware to centralize all security header management in one place, replacing the `next.config.ts` `headers()` function. The CSP remains static (no nonces) but is managed from a single location that can be incrementally tightened as other migrations complete.

**Benefits over current `headers()` approach:**
1. Single location for all security headers
2. Route-aware header customization (could apply different CSP to API routes vs pages)
3. Colocates with rate limiting if that moves to middleware
4. Foundation for future nonce-based CSP if the site ever moves to dynamic rendering

**What changes:**

| File | Change | Type |
|------|--------|------|
| `src/middleware.ts` | New file: sets security headers on all responses | New |
| `next.config.ts` | Remove `headers()` function entirely | Modify |

**Middleware implementation:**

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
    // 'unsafe-eval' removed after MDX migration
    // 'unsafe-inline' stays in script-src for Next.js hydration scripts
    "style-src 'self' 'unsafe-inline'",
    // 'unsafe-inline' in style-src stays (Shiki inline styles, see Section 3)
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://va.vercel-scripts.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    // Skip static files, images, and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

### Why `'unsafe-inline'` Remains in `script-src`

Next.js injects inline `<script>` tags for hydration data and route prefetching. Without nonces, these cannot be individually whitelisted. The `'unsafe-inline'` directive in `script-src` must remain for any statically-generated Next.js site that does not use nonces. This is an accepted tradeoff documented in the [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).

The key security win is removing `'unsafe-eval'` (via MDX migration), which blocks `eval()`, `new Function()`, and similar dynamic code execution.

### Build Order Dependency: The CSP Chain

The middleware CSP values depend on which other migrations are complete:

```
Step 1: Deploy middleware with CURRENT permissive CSP
        (same values as next.config.ts headers, just moved to middleware)
        
Step 2: Complete MDX migration (s.markdown)
        -> Remove 'unsafe-eval' from script-src in middleware
        
Step 3: Complete CSS-variables theme migration (if pursued)
        -> Remove 'unsafe-inline' from style-src in middleware (only if inline styles fully eliminated)
```

**Middleware must be introduced first** with the current permissive CSP, then tightened incrementally. This avoids the risk of deploying a too-strict CSP that breaks the site before migrations are complete.

---

## 3. Switching rehype-pretty-code from Inline Styles to CSS-Variables

### Current State

`velite.config.ts` configures `rehype-pretty-code` with the `github-dark-dimmed` theme and `keepBackground: true`. Shiki injects **inline `style` attributes** on every `<span>` token inside code blocks with hardcoded hex colors like `style="color: #adbac7"`. This requires `style-src 'unsafe-inline'` in the CSP.

The `CodeBlock` component (`src/components/blog/code-block.tsx`) wraps `<pre>` elements with a relative-positioned `<div>` and a `CopyButton`. It passes through all props to the underlying `<pre>` and is completely theme-independent -- it reads `textContent`, not style attributes.

### The CSS-Variables Theme: What It Actually Does

Shiki's `createCssVariablesTheme()` factory replaces hardcoded hex colors with CSS variable references. Instead of `style="color: #adbac7"`, tokens get `style="color: var(--shiki-foreground)"`. You define the actual colors in your stylesheet.

**Critical detail: This still uses inline `style` attributes.** The `css-variables` theme does NOT eliminate inline styles. It replaces hardcoded values with variable references, but the `style` attribute itself remains on every token `<span>`. You still need `'unsafe-inline'` in `style-src`.

### Can We Actually Remove `'unsafe-inline'` from `style-src`?

To truly eliminate inline styles from Shiki output, you would need either:

1. **A custom transformer** that post-processes Shiki output to replace `style` attributes with CSS classes based on token type. Shiki does not ship one natively. You would need to write a rehype plugin that strips `style="color: var(--shiki-X)"` and adds `class="shiki-X"` instead, then define all classes in CSS.

2. **Switch to a completely different syntax highlighter** that outputs class-based markup (like `highlight.js` via `rehype-highlight`), but this loses Shiki's TextMate grammar accuracy.

Neither option is trivial, and both add maintenance burden for marginal security benefit.

### Pragmatic Recommendation: CSS-Variables Theme + Keep `'unsafe-inline'`

**Confidence: HIGH**

Switch to `createCssVariablesTheme()` for design system benefits (colors defined in CSS, easy to tweak) but **accept that `'unsafe-inline'` stays in `style-src`**. The security surface of CSS injection is much smaller than script injection, and for a site with no user-generated content, it is an acceptable tradeoff.

**What changes:**

| File | Change | Type |
|------|--------|------|
| `velite.config.ts` | Import `createCssVariablesTheme` from `shiki`, replace theme config | Modify |
| `velite.config.ts` | Set `keepBackground: false` (background color will come from CSS) | Modify |
| `src/app/globals.css` | Add Shiki CSS variable definitions matching `github-dark-dimmed` palette | Modify |

**velite.config.ts change:**

```typescript
import { createCssVariablesTheme } from 'shiki'

const codeTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
})

// In mdx config:
[rehypePrettyCode, {
  theme: codeTheme,
  keepBackground: false,
  defaultLang: { block: 'typescript', inline: 'typescript' },
}]
```

**globals.css additions:**

```css
/* Shiki syntax highlighting -- github-dark-dimmed equivalent */
[data-rehype-pretty-code-figure] pre {
  --shiki-foreground: #adbac7;
  --shiki-background: #22272e;
  --shiki-token-constant: #6cb6ff;
  --shiki-token-string: #96d0ff;
  --shiki-token-comment: #768390;
  --shiki-token-keyword: #f47067;
  --shiki-token-parameter: #f69d50;
  --shiki-token-function: #dcbdfb;
  --shiki-token-string-expression: #96d0ff;
  --shiki-token-punctuation: #adbac7;
  --shiki-token-link: #6cb6ff;
  background-color: var(--shiki-background);
}
```

**Note on variable granularity:** The `css-variables` theme is less granular than full TextMate themes. Where `github-dark-dimmed` might distinguish 40+ token scopes, the CSS-variables theme maps to roughly 10 CSS variables. Some tokens that had distinct colors will collapse to the same variable. The visual difference is minor for a blog's code samples.

### Impact on CodeBlock Component

**None.** The `CodeBlock` component is completely unaffected by the theme change. It wraps `<pre>` with a copy button using `querySelector('code')?.textContent` to extract text. No style attributes are read, written, or depended upon. The `CopyButton` component is also theme-independent.

If the MDX migration to `s.markdown()` happens (Section 1), then the `CodeBlock` component changes are driven by that migration, not the theme migration. The two changes are independent.

### If You Want to Fully Eliminate Inline Styles (Optional, Lower Priority)

**Confidence: LOW** -- significant effort for marginal gain.

Write a custom rehype plugin that runs after `rehype-pretty-code`:

```typescript
// rehype-strip-shiki-styles.ts
import { visit } from 'unist-util-visit'

export function rehypeStripShikiStyles() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.properties?.style) {
        const style = node.properties.style as string
        const match = style.match(/color:\s*var\(--shiki-([^)]+)\)/)
        if (match) {
          node.properties.className = [
            ...(node.properties.className || []),
            `shiki-${match[1]}`
          ]
          delete node.properties.style
        }
      }
    })
  }
}
```

Then add corresponding CSS classes. This is doable but adds a custom plugin to maintain and test.

---

## 4. Where `useSyncExternalStore` Fits in the Component Tree

### Current State

Three locations use `useLayoutEffect`/`useEffect` + `useState` to sync with external browser APIs, generating React 19 lint warnings:

| Component | External Source | Current Pattern | Lint Warning |
|-----------|----------------|-----------------|--------------|
| `ViewCounter` (line 15) | `localStorage` | `useLayoutEffect` + `getCachedViews` + `setViews` | `set-state-in-effect` |
| `ListingViewCounts` (line 23) | `localStorage` (multiple keys) | `useLayoutEffect` + loop + `setCounts` | `set-state-in-effect` |
| `useHeroAnimation` (line 39) | `window.matchMedia` | `useEffect` + `setPrefersReducedMotion` + `addEventListener` | `set-state-in-effect` |
| `useHeroAnimation` (line 54) | setTimeout-driven state | `useEffect` + `setRevealStage` | `set-state-in-effect` |

The fourth warning (`setRevealStage` in the reveal sequence effect) is NOT a candidate for `useSyncExternalStore` because it is not subscribing to an external store -- it is orchestrating a timed animation sequence. That pattern is correct as-is and should have its lint warning suppressed with a comment.

### Architecture: Two Reusable Store Adapters

**Confidence: HIGH**

Create two focused hooks in `src/lib/`:

#### Adapter 1: `useLocalStorageSnapshot`

```typescript
// src/lib/use-local-storage-snapshot.ts
import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  // 'storage' event fires when OTHER tabs change localStorage
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function useLocalStorageSnapshot(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => { try { return localStorage.getItem(key) } catch { return null } },
    () => null  // SSR: no localStorage
  )
}
```

#### Adapter 2: `usePrefersReducedMotion`

```typescript
// src/lib/use-prefers-reduced-motion.ts
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
```

### Component Changes

**ViewCounter (`src/components/blog/view-counter.tsx`):**

Replace the `useLayoutEffect` block (lines 15-17) with:

```typescript
const cachedRaw = useLocalStorageSnapshot(`views:${slug}`)
const cachedViews = cachedRaw !== null ? Number(cachedRaw) : null
```

Keep the `useEffect` for the POST request and `setViews`. The component still needs local state for the "fresh from API" value. The `useSyncExternalStore` handles the initial cached read; `useState` handles the API response.

**ListingViewCounts (`src/components/blog/listing-view-counts.tsx`):**

This is trickier because it reads multiple localStorage keys in a loop. Two options:

- **Option A:** Call `useLocalStorageSnapshot` for each slug. But hooks cannot be called in a loop with dynamic count. This requires a different adapter that subscribes once and reads multiple keys.
- **Option B (recommended):** Create a `useLocalStorageSnapshots(keys: string[])` variant that takes an array of keys and returns a record. Internally it uses a single `useSyncExternalStore` subscription with a `getSnapshot` that reads all keys.

```typescript
// Addition to use-local-storage-snapshot.ts
export function useLocalStorageSnapshots(keys: string[]): Record<string, string | null> {
  const stableKeys = JSON.stringify(keys)
  return useSyncExternalStore(
    subscribe,
    () => {
      const result: Record<string, string | null> = {}
      for (const key of JSON.parse(stableKeys) as string[]) {
        try { result[key] = localStorage.getItem(key) } catch { result[key] = null }
      }
      return result
    },
    () => {
      const result: Record<string, string | null> = {}
      for (const key of JSON.parse(stableKeys) as string[]) result[key] = null
      return result
    }
  )
}
```

**Note on referential stability:** `useSyncExternalStore` calls `getSnapshot` on every render and uses `Object.is` to compare results. The above returns a new object each time, which would trigger infinite re-renders. The `getSnapshot` function needs memoization or the result needs structural comparison. The pragmatic solution is to `JSON.stringify` the result and use a wrapper that parses it, or use `useRef` to cache the previous result and only return a new object when values actually change.

**useHeroAnimation (`src/hooks/use-hero-animation.ts`):**

Replace the matchMedia effect (lines 38-44) with:

```typescript
const prefersReducedMotion = usePrefersReducedMotion()
```

Remove the `useState` for `prefersReducedMotion` and the entire `useEffect` block that sets up the matchMedia listener. The hook return value keeps the same shape.

The `setRevealStage` effects (lines 48-67, 72-75) are NOT external store subscriptions -- they are animation orchestration using `setTimeout`. These should remain as `useEffect` + `useState` with lint suppression comments explaining the intentional pattern.

### Where in the Component Tree

No component tree changes. The `useSyncExternalStore` hooks slot into existing client components without introducing new client boundaries:

```
Layout (server)
  +-- Hero (client)
  |     +-- useHeroAnimation
  |           +-- usePrefersReducedMotion  <-- replaces matchMedia effect
  |
  +-- BlogPostPage (server)
  |     +-- MDXContent (client -> possibly server after migration)
  |     +-- ViewCounter (client)
  |           +-- useLocalStorageSnapshot  <-- replaces useLayoutEffect
  |
  +-- BlogListPage (server)
        +-- ListingViewCounts (client)
              +-- useLocalStorageSnapshots  <-- replaces useLayoutEffect
              +-- PostCardViewCount (client, via context)
```

### Subtlety: Write-Then-Read in View Counters

View counter components write to localStorage after an API response (`setCachedViews`), then expect subsequent renders to reflect the new value. With `useSyncExternalStore`, the `storage` event only fires from **other tabs**, not the current window.

**Solution:** After writing to localStorage, dispatch a synthetic `storage` event on the current window:

```typescript
export function setCachedViews(slug: string, count: number): void {
  try {
    const key = `views:${slug}`
    localStorage.setItem(key, String(count))
    // Notify current-tab subscribers
    window.dispatchEvent(new StorageEvent('storage', { key }))
  } catch { /* non-critical */ }
}
```

This ensures the `useSyncExternalStore` subscription picks up the write from the same tab. Update `src/lib/views.ts` accordingly.

### New and Modified Files

| File | Type | Purpose |
|------|------|---------|
| `src/lib/use-local-storage-snapshot.ts` | New | `useSyncExternalStore` adapter for localStorage |
| `src/lib/use-prefers-reduced-motion.ts` | New | `useSyncExternalStore` adapter for matchMedia |
| `src/components/blog/view-counter.tsx` | Modify | Replace `useLayoutEffect` with snapshot hook |
| `src/components/blog/listing-view-counts.tsx` | Modify | Replace `useLayoutEffect` with snapshots hook |
| `src/hooks/use-hero-animation.ts` | Modify | Replace matchMedia effect with `usePrefersReducedMotion` |
| `src/lib/views.ts` | Modify | Add `StorageEvent` dispatch to `setCachedViews` |

---

## Build Order: The CSP Chain and Dependencies

The four workstreams have a dependency chain:

```
Phase 1: Middleware
  |  Move headers from next.config.ts to middleware.ts
  |  Deploy with CURRENT permissive CSP (same values, new location)
  |  No functional change, just centralizes management
  |
Phase 2: MDX Migration  
  |  Switch s.mdx() -> s.markdown() in velite.config.ts
  |  Rewrite MDXContent to render HTML
  |  Adapt CodeBlock copy button to DOM-based approach
  |  THEN: Remove 'unsafe-eval' from middleware CSP
  |
Phase 3: CSS-Variables Theme (optional)
  |  Switch rehype-pretty-code theme to createCssVariablesTheme
  |  Add CSS variable definitions to globals.css
  |  Set keepBackground: false
  |  NOTE: Does NOT enable removing 'unsafe-inline' from style-src
  |        (inline style attributes still present, just with CSS var values)
  |
Phase 4: useSyncExternalStore (independent)
  |  Can run in parallel with Phase 2 or 3
  |  No CSP impact -- pure code quality improvement
  |  Eliminates 6 of 10 React 19 lint warnings
```

**Phase 1 must come first** because it establishes the single location where CSP is managed. Without it, tightening CSP requires editing `next.config.ts` headers while also having middleware for other concerns -- a split-brain situation.

**Phase 2 before Phase 3** because `unsafe-eval` removal is the significant security win. CSS-variables is a design-system improvement, not a CSP improvement.

**Phase 4 is independent** of all CSP work and can be interleaved anywhere.

### Critical Note on `'unsafe-inline'` in `script-src`

After all migrations, the CSP will still contain `'unsafe-inline'` in `script-src` for Next.js hydration scripts. This is unavoidable without nonce-based CSP, which requires dynamic rendering. The final tightened CSP will be:

```
script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com
style-src 'self' 'unsafe-inline'
```

This is a significant improvement over the current:

```
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com
style-src 'self' 'unsafe-inline'
```

The removal of `'unsafe-eval'` is the material security improvement.

---

## Component Boundaries Summary

### New Components/Files

| File | Type | Purpose |
|------|------|---------|
| `src/middleware.ts` | New | Centralized security headers |
| `src/lib/use-local-storage-snapshot.ts` | New | `useSyncExternalStore` for localStorage |
| `src/lib/use-prefers-reduced-motion.ts` | New | `useSyncExternalStore` for matchMedia |
| `src/components/blog/code-block-enhancer.tsx` | New (if using s.markdown) | Client-side copy button injection for HTML-rendered code blocks |

### Modified Components

| File | Nature of Change |
|------|-----------------|
| `velite.config.ts` | `s.mdx()` -> `s.markdown()`, theme change, possible new rehype plugins |
| `src/components/blog/mdx-content.tsx` | Major rewrite: HTML rendering instead of JS execution, possibly becomes server component |
| `src/components/blog/code-block.tsx` | May need DOM-based approach or be replaced by `code-block-enhancer.tsx` |
| `next.config.ts` | Remove `headers()` function |
| `src/components/blog/view-counter.tsx` | Replace `useLayoutEffect` with `useSyncExternalStore` |
| `src/components/blog/listing-view-counts.tsx` | Replace `useLayoutEffect` with `useSyncExternalStore` |
| `src/hooks/use-hero-animation.ts` | Replace matchMedia effect with `usePrefersReducedMotion` |
| `src/lib/views.ts` | Add `StorageEvent` dispatch to `setCachedViews` |
| `src/app/globals.css` | Add Shiki CSS variable definitions |

### Unchanged Components

| File | Why Unchanged |
|------|--------------|
| `src/app/blog/[slug]/page.tsx` | Still passes `post.body` to MDXContent; prop semantics shift but API shape identical |
| `src/app/blog/page.tsx` | No MDX rendering on listing page |
| `src/components/blog/copy-button.tsx` | Pure UI, no dependency on theme or MDX approach |
| All `@/.velite` imports | Import path unchanged, non-body fields unchanged |
| `src/app/sitemap.ts` | No MDX dependency |
| `src/app/feed.xml/route.ts` | No MDX rendering |

---

## Scalability Considerations

| Concern | Current (5 posts) | At 50 posts | At 500 posts |
|---------|-------------------|-------------|--------------|
| Middleware overhead | Negligible | Negligible | Negligible (header set only) |
| `s.markdown()` HTML in JSON | ~30KB per body | ~300KB total | ~3MB total JSON, monitor build memory |
| `useSyncExternalStore` subscriptions | 1-5 storage listeners | Same | Same (listing page is one component) |
| CSS variable theme CSS | ~500 bytes | Same | Same |
| Velite rebuild time | <2s | ~5s | ~15s, may need investigation |

No scaling concerns for any of these changes at foreseeable content volumes.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Nonce-Based CSP on a Static Site

**What:** Create middleware that generates nonces and injects them into every response.
**Why bad:** Forces all pages to dynamic rendering, destroying CDN caching and static generation benefits. Every page request now invokes a serverless function.
**Instead:** Use static CSP via middleware without nonces. Accept `'unsafe-inline'` for scripts as the tradeoff for keeping static generation.

### Anti-Pattern 2: Removing `'unsafe-inline'` from `style-src` via CSS-Variables Theme Alone

**What:** Switch to `createCssVariablesTheme`, assume inline styles are gone, remove `'unsafe-inline'`.
**Why bad:** The CSS-variables theme still outputs inline `style` attributes. Only the values change from hardcoded to CSS variables. Removing `'unsafe-inline'` will break all code syntax highlighting.
**Instead:** Keep `'unsafe-inline'` in `style-src`. If you must eliminate it, write a custom rehype plugin to strip `style` attributes and add classes (significant effort for marginal gain).

### Anti-Pattern 3: Using `useSyncExternalStore` for Animation Orchestration

**What:** Try to model the hero reveal sequence (setTimeout-based stage transitions) as an external store.
**Why bad:** Animation orchestration is not an external store. It is internal component state driven by timers. Forcing it into `useSyncExternalStore` adds complexity without benefit.
**Instead:** Keep `useEffect` + `setTimeout` + `useState` for animation staging. Suppress the lint warning with a comment explaining the intentional pattern.

### Anti-Pattern 4: Running MDX `new Function()` in Middleware

**What:** Try to pre-evaluate MDX in middleware and pass rendered HTML downstream.
**Why bad:** Middleware runs at the edge with no access to React rendering. It cannot execute JSX. This is architecturally impossible.
**Instead:** Switch to `s.markdown()` so the HTML is produced at Velite build time, not at request time.

## Sources

- [Velite MDX Support](https://velite.js.org/guide/using-mdx) -- Velite's official MDX docs showing `new Function()` pattern
- [Velite Markdown Support](https://velite.js.org/guide/using-markdown) -- `s.markdown()` alternative
- [Velite Code Highlighting](https://velite.js.org/guide/code-highlighting) -- Rehype plugin integration
- [MDX Discussion #2322](https://github.com/orgs/mdx-js/discussions/2322) -- MDX maintainers confirming no alternative to dynamic execution
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) -- Official nonce/hash CSP guidance
- [Next.js SRI Issue #66901](https://github.com/vercel/next.js/issues/66901) -- SRI incompatible with Turbopack
- [Shiki Theme Colors](https://shiki.style/guide/theme-colors) -- `createCssVariablesTheme` documentation
- [Rehype Pretty Code](https://rehype-pretty.pages.dev/) -- Plugin documentation
- [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) -- Official React docs
- [useSyncExternalStore with localStorage](https://dev.to/muhammed_fayazts_e35676/usesyncexternalstore-the-right-way-to-sync-react-with-localstorage-3c5f) -- Pattern examples
- [safe-mdx](https://github.com/holocron-hq/safe-mdx) -- Evaluated and not recommended for this use case
- [Next.js Discussion #54907](https://github.com/vercel/next.js/discussions/54907) -- Using nonces with Next.js limitations

---
*Architecture research for: keech.dev v1.7 CSP hardening milestone*
*Researched: 2026-04-03*
