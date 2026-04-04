# Feature Research

**Domain:** CSP hardening, MDX migration, middleware, lint cleanup for Next.js 16 portfolio site
**Researched:** 2026-04-03
**Confidence:** MEDIUM-HIGH (verified against official docs and Velite source behavior)

## Feature Landscape

### Table Stakes (Must Ship for v1.7 to Be Meaningful)

Features that directly address the security and quality concerns driving this milestone.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Remove `unsafe-eval` from CSP | Core security goal of v1.7. `unsafe-eval` allows arbitrary code execution, undermining the entire CSP | HIGH | Requires replacing `new Function()` MDX rendering. Biggest lift in this milestone. See deep dive below. |
| Remove `unsafe-inline` from style-src CSP | Completes the CSP hardening story. Inline styles from rehype-pretty-code are the only reason `unsafe-inline` exists | MEDIUM | Switch to Shiki CSS-variables theme with class-based transformer. Must restyle all code blocks. |
| Centralized security headers via middleware | Headers in `next.config.ts` cannot be dynamic. Middleware is the standard Next.js pattern for CSP | LOW-MEDIUM | Straightforward `src/middleware.ts` creation. Can ship with current CSP first, then tighten. |
| npm audit clean | 3 transitive vulnerabilities (flatted, picomatch). Table stakes for a security-focused milestone | LOW | `overrides` in package.json for transitive deps. |
| eslint-config-next version sync | Version skew (16.1.6 vs next 16.2.2) causes rule drift | LOW | Bump and verify no new lint errors surface. |
| Silence intentional lint violations | 4 ESLint errors from intentional `<a>` tags in error boundaries, 10 warnings from React 19 hook rules | LOW | Add disable comments with explanations for `<a>` tags. Migrate patterns to `useSyncExternalStore` to eliminate warnings. |
| Pin Velite to exact version | Pre-release 0.x dependency with caret range. Accidental minor bump could break build | LOW | Change `"^0.3.1"` to `"0.3.1"` in package.json. |

### Differentiators (Quality Signals Beyond Minimum)

Features that elevate the milestone from "fixed some stuff" to "hardened professionally."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `useSyncExternalStore` for browser APIs | Eliminates React 19 lint warnings AND removes `useLayoutEffect` SSR footgun AND is the idiomatic React pattern for external stores | MEDIUM | Replaces 3 patterns: localStorage in ViewCounter, localStorage in ListingViewCounts, matchMedia in useHeroAnimation. See deep dive below. |
| Hash-based CSP with SRI for static pages | Maintains full static generation while providing script integrity verification | LOW-MEDIUM | `experimental.sri` in next.config.ts. Avoids the nonce-vs-static tradeoff entirely. |
| CSP reporting endpoint | Logs CSP violations in production to catch regressions | LOW | `report-uri` or `report-to` directive pointing to a free reporting service or Vercel function logs. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Nonce-based CSP via middleware | Standard recommendation for strict CSP. Next.js docs show this pattern. | **Kills static generation entirely.** Every page becomes dynamically rendered per-request. For a portfolio site with 5 blog posts, this trades CDN-cached static pages for per-request server rendering just to generate a nonce. The performance and complexity cost is wildly disproportionate to the security benefit. | Eliminate the need for nonces: remove `unsafe-eval` by fixing MDX rendering, remove `unsafe-inline` by eliminating inline styles. Use `experimental.sri` for script integrity hashing. No nonces needed. |
| next-mdx-remote for MDX rendering | Popular library, has RSC support via `next-mdx-remote/rsc`. | **Still uses `new Function()` internally.** The function-body output format requires `new Function()` to execute. Does not eliminate `unsafe-eval`. Also has open compatibility bugs with Next.js 15.2+ and 16.x (GitHub issue #488). Would replace one `new Function()` caller with another. | Compile MDX to importable JS modules at build time via custom Velite schema with `outputFormat: 'program'`. |
| @next/mdx as Turbopack loader | Official Next.js MDX integration. Build-time compilation to real modules. | **Incompatible with Velite content pipeline.** `@next/mdx` treats `.mdx` files as page routes or importable modules within the Next.js app directory. Velite compiles MDX from `content/` into `.velite/` data collections with frontmatter, TOC, metadata, excerpt, and reading time. Switching to `@next/mdx` would require rebuilding the entire content pipeline, losing Velite's schema validation and transforms, and restructuring how posts are queried. Massive scope creep. | Keep Velite for content pipeline. Change the output format and rendering approach only. |
| safe-mdx library | Renders MDX without eval by parsing AST directly to React elements. | Cannot handle expressions with methods/functions, imports, or inline component declarations. The CodeBlock component override and list role overrides in the current MDX component model would need careful testing. Adds a niche dependency with uncertain maintenance. | Compile-to-file approach: have Velite write importable JS modules instead of function-body strings. |
| Full dynamic middleware for all security concerns | Rate limiting, CSP, CORS, auth, all in middleware. | Over-engineering for a personal portfolio. Rate limiting is already per-route and works fine. Adding global rate limiting in middleware means every static asset request hits the limiter. | Middleware for CSP headers only. Keep rate limiting in API route handlers where it belongs. |

## Feature Deep Dives

### 1. MDX Rendering Migration (Remove `unsafe-eval`)

**Current state:** Velite compiles MDX via `s.mdx()` using `outputFormat: 'function-body'` (the default). This produces a string of JavaScript code stored in the `.velite/` output. At render time in `mdx-content.tsx`, `new Function(code)` executes it with React's jsx-runtime to produce components. This requires `script-src 'unsafe-eval'` in CSP.

**Critical finding:** Both Velite's default `s.mdx()` AND the esbuild bundle snippet in Velite's official docs still use `new Function()` for rendering. The esbuild approach pre-optimizes the code but the final rendering path is identical: `const fn = new Function(code); return fn({...runtime}).default`. **There is no Velite-native way to avoid `new Function()` today.**

**Viable approach -- compile to importable modules:**

The MDX spec supports `outputFormat: 'program'` which produces a complete ES module with `export default` instead of a function body. The strategy:

1. In `velite.config.ts`, define a custom schema (`s.custom()`) that compiles MDX with `outputFormat: 'program'`
2. Write the compiled output as `.js` files to a known directory (e.g., `.velite/mdx/[slug].js`)
3. In the blog post page component, dynamically import the compiled module: `const { default: Content } = await import(`.velite/mdx/${slug}.js`)`
4. No `new Function()` needed -- standard ES module import resolved by the bundler

**Component model with module approach:**
- Custom components (CodeBlock for `<pre>`, `<ul>`/`<ol>` with `role="list"`) are currently passed at render time via the `components` prop to `MDXContent`
- With the module approach, components are still passed the same way. MDX modules compiled with `outputFormat: 'program'` export a default component that accepts a `components` prop
- The `MDXContent` wrapper changes from `new Function()` execution to a dynamic import
- Server component compatible -- `MDXContent` no longer needs `'use client'` since there is no runtime eval. The compiled module is just a React component.
- The `react/jsx-runtime` import is handled by the bundler at build time instead of being passed as a runtime argument

**What changes in the Velite output:**
- Currently: `.velite/posts.json` contains `{ body: "function(MDXContent){...}" }` -- a string
- After: `.velite/posts.json` contains `{ body: "./mdx/my-post.js" }` -- a path to an importable module
- Plus: `.velite/mdx/[slug].js` files -- actual importable ES modules

**Risks:**
- Velite's `s.custom()` API for MDX compilation may not expose all necessary options (rehype plugins, remark plugins). Needs validation.
- Dynamic imports in Next.js server components work differently than standard `import()`. May need `next/dynamic` or careful path resolution.
- The `.velite/` directory is gitignored and regenerated on build. Module files must be written during Velite's build step.

**Complexity:** HIGH. Requires custom Velite schema, build pipeline changes, new file output, updated import patterns in the blog post page, and verification that all MDX features (code blocks, headings, TOC) still work.

### 2. CSP Strategy for Static Generation

**Current state:** `next.config.ts` sets CSP via `headers()` with `unsafe-eval` and `unsafe-inline`. All pages are statically generated and served from CDN.

**The nonce trap:** Next.js middleware can generate per-request nonces, but this forces ALL pages to dynamic rendering. The official Next.js docs state explicitly: "you must use dynamic rendering to add nonces." For a statically generated portfolio with CDN edge caching, this is a non-starter. The overhead of server-rendering every page request to generate a nonce far outweighs the security benefit for author-controlled content.

**Recommended three-pronged approach:**

1. **Eliminate `unsafe-eval`** by fixing MDX rendering (compile-to-module). The eval problem disappears entirely.
2. **Eliminate `unsafe-inline` for styles** by switching to CSS-variables Shiki theme with class-based output. No inline styles = no `unsafe-inline` needed.
3. **Hash-based integrity for scripts** via `experimental.sri` in next.config.ts. Generates SHA-256 hashes of JS files at build time, adds `integrity` attributes to `<script>` tags. Provides script integrity verification without nonces.

**What middleware does in this model:** Middleware sets the CSP header (enabling future per-route flexibility) but the CSP itself contains no nonces. The directives become: `script-src 'self' 'strict-dynamic' https://va.vercel-scripts.com; style-src 'self'; ...`. Moving headers from `next.config.ts` to middleware is still valuable because:
- Centralizes all security headers in one file
- Enables future per-route CSP variations if needed
- Is the idiomatic Next.js pattern
- Can be extended later without touching `next.config.ts`

**Vercel Analytics script:** Currently allowed via `https://va.vercel-scripts.com` in `script-src`. This stays as an explicit origin allowance.

**SRI caveat:** `experimental.sri` only hashes external script files, not inline scripts from `dangerouslySetInnerHTML`. Next.js uses inline scripts for hydration data. This means inline scripts still need `'unsafe-inline'` in script-src OR `'strict-dynamic'` to trust them via the initial script chain. Verify this interaction carefully.

### 3. CSS-Variables Shiki Theme (Remove `unsafe-inline`)

**Current state:** `rehype-pretty-code` with `github-dark-dimmed` theme injects inline `style` attributes on every code token (e.g., `style="color: #adbac7"`), requiring `style-src 'unsafe-inline'`.

**How CSS-variables themes work in Shiki:**

Shiki provides a `createCssVariablesTheme()` factory function:
```typescript
import { createCssVariablesTheme } from 'shiki/core'
const myTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  fontStyle: true
})
```

Tokens get `style="color: var(--shiki-token-keyword)"` instead of `style="color: #f47067"`. You define actual colors in CSS:
```css
--shiki-foreground: #adbac7;
--shiki-background: #22272e;
--shiki-token-constant: #6cb6ff;
--shiki-token-string: #96d0ff;
--shiki-token-comment: #768390;
--shiki-token-keyword: #f47067;
--shiki-token-parameter: #f69d50;
--shiki-token-function: #dcbdfb;
--shiki-token-string-expression: #96d0ff;
--shiki-token-punctuation: #768390;
--shiki-token-link: #539bf5;
```

**Important nuance:** The CSS-variables theme still emits inline `style` attributes (just with `var()` references instead of hex values). To fully eliminate `unsafe-inline` for styles, you need EITHER:

**Option A: Custom transformer** -- Strip inline `style` attributes and apply `class` attributes instead. Write a Shiki transformer or rehype plugin that converts `style="color: var(--shiki-token-X)"` to `class="shiki-token-X"`. Define all token styles in `globals.css`:
```css
.shiki-token-keyword { color: var(--shiki-token-keyword); }
.shiki-token-string  { color: var(--shiki-token-string); }
/* etc. */
```

**Option B: Accept var() inline styles** -- Some CSP implementations consider `var()` references safe because they only reference values defined in stylesheets. However, the CSP spec does not distinguish between `style="color: red"` and `style="color: var(--x)"` -- both require `unsafe-inline`. So Option A is required for a strict CSP.

**Recommended approach:** Option A (custom transformer). The token set is finite (~12 types). A single rehype plugin post-processing step can convert all inline style attributes to class names. The CSS variable definitions go in `globals.css` under `@theme` alongside the existing design tokens, matching the site's CSS-first configuration pattern.

**Complexity:** MEDIUM. Theme creation is straightforward. The class-based transformer is a small plugin. The main effort is mapping all token types from `github-dark-dimmed` to CSS variables and verifying visual parity.

### 4. `useSyncExternalStore` for Browser APIs

**Current state:** Three patterns use `useLayoutEffect`/`useEffect` + `setState` to sync browser state:

1. **ViewCounter** (`view-counter.tsx` line 15-17): `useLayoutEffect` reads `localStorage` before paint to prevent flash of empty count
2. **ListingViewCounts** (`listing-view-counts.tsx` line 23-33): Same pattern for batch cached counts
3. **useHeroAnimation** (`use-hero-animation.ts` line 38-44): `useEffect` reads `matchMedia` for reduced-motion preference with change listener

These trigger 4 `react-hooks/set-state-in-effect` warnings and the `useLayoutEffect` pattern has an SSR footgun (generates React warnings if component ever renders on server).

**How `useSyncExternalStore` works:**

Three arguments:
- `subscribe(callback)`: Registers a listener for store changes, returns cleanup function
- `getSnapshot()`: Returns current store value synchronously. Called during render (before commit), so reads happen at the same time as `useLayoutEffect` -- no flash.
- `getServerSnapshot()`: Returns a safe default for SSR/hydration. Must match initial client render to avoid hydration mismatch.

**localStorage store pattern:**
```typescript
function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    (callback) => {
      // 'storage' fires on cross-tab changes
      window.addEventListener('storage', callback)
      return () => window.removeEventListener('storage', callback)
    },
    () => localStorage.getItem(key),
    () => null  // No localStorage on server
  )
}
```

**matchMedia store pattern:**
```typescript
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => false  // Safe default for SSR
  )
}
```

**Benefits:**
- Eliminates all 4 `react-hooks/set-state-in-effect` warnings (React 19's lint rule specifically recommends `useSyncExternalStore` as the fix)
- Removes `useLayoutEffect` entirely -- no SSR warning potential
- `getSnapshot` is called during render (synchronous), providing the same flash-prevention as `useLayoutEffect` + `setState`
- `getServerSnapshot` provides safe SSR defaults without conditional hook logic
- Cross-tab localStorage sync comes free via the `storage` event listener
- Concurrent rendering safe -- prevents tearing that `useEffect` + `setState` is susceptible to

**Caveats:**
- The `subscribe` function must be declared outside the component or wrapped in `useCallback` to avoid resubscribing on every render (React compares by reference)
- `getSnapshot` should return the same reference if data hasn't changed (use `Object.is` comparison). For primitives (string, number, boolean), this is automatic.
- For the view counter, `getServerSnapshot` returns `null` which means the count shows nothing during SSR/hydration, then the real value after hydration. This matches the current behavior since `useLayoutEffect` doesn't run on server either.
- The `storage` event only fires for cross-tab changes, not same-tab `setItem` calls. For same-tab updates (after POST to view API), you still need to call `setCachedViews` which writes to localStorage. To trigger a re-read, dispatch a custom event or update a separate signal.

**Complexity:** MEDIUM. Three components to refactor. Store factories are reusable. Main risk is the same-tab localStorage write notification pattern (may need a small event emitter wrapper).

## Feature Dependencies

```
[Remove unsafe-eval]
    requires [MDX compile-to-module migration]
        depends-on [Velite custom schema with outputFormat: 'program']

[Remove unsafe-inline from style-src]
    requires [CSS-variables Shiki theme + class-based transformer]

[Middleware CSP headers]
    enhances [Remove unsafe-eval] (cleaner header management)
    enhances [Remove unsafe-inline] (cleaner header management)
    independent-of [MDX migration] (can ship with current CSP first)

[useSyncExternalStore migration]
    independent-of [all CSP work] (pure code quality)

[eslint-config-next sync]
    independent-of [all other features]

[Pin Velite version]
    should-precede [MDX compile-to-module migration] (lock version before changing output)

[npm audit fixes]
    independent-of [all other features]
```

### Dependency Notes

- **MDX migration requires Velite custom schema:** Cannot change rendering without changing what Velite outputs. The `s.mdx()` schema hardcodes `outputFormat: 'function-body'`. A custom schema using `s.custom()` with `@mdx-js/mdx` compile is needed.
- **Middleware enhances but does not block CSP changes:** Deploy middleware with current `unsafe-eval`/`unsafe-inline` CSP first, then tighten directives after MDX and Shiki migrations complete.
- **useSyncExternalStore is fully independent:** Can ship in any phase. Eliminates lint warnings regardless of CSP work.
- **Pin Velite before MDX migration:** Lock the version so the custom schema targets a known, stable API surface.
- **CSS-variables theme and MDX migration are independent:** Can be done in parallel or either order. Both contribute to CSP hardening but neither depends on the other.

## Prioritization

### Phase 1: Foundation (Low Risk, High Independence)

- [ ] Pin Velite to exact version -- prevents accidental breakage during migration work
- [ ] npm audit fixes via overrides -- quick security win
- [ ] eslint-config-next version sync -- eliminates version drift
- [ ] ESLint disable comments for intentional `<a>` tags in error boundaries -- silences 4 false-positive errors
- [ ] `useSyncExternalStore` migration for localStorage and matchMedia -- eliminates 10 lint warnings, improves code quality, idiomatic React

### Phase 2: CSP Infrastructure + Inline Style Elimination

- [ ] Add `src/middleware.ts` with current CSP (still has `unsafe-eval`/`unsafe-inline`) -- establishes the middleware pattern
- [ ] CSS-variables Shiki theme + class-based transformer in velite.config.ts -- eliminates all inline styles from code blocks
- [ ] Update CSP in middleware to remove `unsafe-inline` from style-src -- validates the Shiki migration

### Phase 3: MDX Migration (Biggest Lift, Highest Value)

- [ ] Custom Velite schema with `outputFormat: 'program'` writing importable `.js` modules
- [ ] Update `MDXContent` to import compiled modules instead of `new Function()` execution
- [ ] Remove `'use client'` from `mdx-content.tsx` (no longer needed without runtime eval)
- [ ] Update CSP in middleware to remove `unsafe-eval` from script-src -- validates the MDX migration
- [ ] Add `experimental.sri` for hash-based script integrity -- bonus security layer

### Phase 4: Cleanup and Verification

- [ ] Remove stale worktree artifacts (3.6 GB disk space)
- [ ] Verify full lint clean run (zero errors, zero warnings)
- [ ] Verify all E2E tests pass with new CSP (code blocks render, MDX content displays, copy button works)

## Feature Prioritization Matrix

| Feature | Security Value | Implementation Cost | Priority |
|---------|---------------|---------------------|----------|
| Remove `unsafe-eval` (MDX migration) | HIGH | HIGH | P1 |
| Remove `unsafe-inline` (Shiki CSS-vars) | HIGH | MEDIUM | P1 |
| Middleware for CSP headers | MEDIUM | LOW | P1 |
| `useSyncExternalStore` migration | LOW (code quality) | MEDIUM | P2 |
| npm audit fixes | MEDIUM | LOW | P1 |
| eslint-config-next sync | LOW | LOW | P1 |
| ESLint disable comments for `<a>` tags | LOW (noise reduction) | LOW | P1 |
| Pin Velite version | LOW (stability) | LOW | P1 |
| Hash-based SRI | MEDIUM | LOW | P2 |
| CSP reporting | LOW | LOW | P3 |
| Clean stale worktrees | LOW (housekeeping) | LOW | P3 |

**Priority key:**
- P1: Core to milestone goals -- CSP hardening and lint cleanup
- P2: Valuable quality improvements that complement the core goals
- P3: Nice to have, ship if time permits

## Sources

- [Velite MDX documentation](https://velite.js.org/guide/using-mdx) -- confirms `function-body` default, documents `s.mdx()` behavior
- [Velite snippets](https://velite.js.org/other/snippets) -- esbuild bundle approach still uses `new Function()` for rendering
- [MDX output formats discussion](https://github.com/orgs/mdx-js/discussions/2322) -- `outputFormat: 'program'` produces importable ES modules
- [safe-mdx](https://github.com/holocron-hq/safe-mdx) -- AST-based rendering without eval (evaluated, not recommended for this project)
- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) -- nonces require dynamic rendering; `experimental.sri` for hash-based alternative
- [next-mdx-remote issues](https://github.com/hashicorp/next-mdx-remote/issues/488) -- compatibility problems with Next.js 15.2+/16.x
- [Shiki theme colors](https://shiki.style/guide/theme-colors) -- `createCssVariablesTheme()` factory, CSS variable token mapping
- [rehype-pretty-code](https://rehype-pretty.pages.dev/) -- unstyled by default, provides data attributes for custom styling
- [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) -- official API docs with localStorage and matchMedia patterns
- [useSyncExternalStore localStorage guide](https://dev.to/muhammed_fayazts_e35676/usesyncexternalstore-the-right-way-to-sync-react-with-localstorage-3c5f) -- practical implementation patterns
- [Next.js experimental SRI](https://nextjs.org/docs/app/guides/content-security-policy) -- hash-based CSP compatible with static generation
- [Next.js SRI issues](https://github.com/vercel/next.js/issues/66901) -- known CDN encoding issues with integrity hashes
- [@next/mdx Turbopack compatibility](https://github.com/vercel/next.js/issues/67453) -- plugin serialization requirements for Turbopack

---
*Feature research for: keech.dev v1.7 CSP hardening, MDX migration, lint cleanup*
*Researched: 2026-04-03*
