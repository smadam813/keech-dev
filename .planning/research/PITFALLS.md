# Domain Pitfalls

**Domain:** CSP hardening, MDX migration, lint cleanup for a statically generated Next.js 16 site with Velite
**Researched:** 2026-04-03
**Confidence:** HIGH (pitfalls verified against official docs, GitHub discussions, and current codebase analysis)

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Nonce-Based CSP Destroys Static Generation

**What goes wrong:** Adding middleware that generates per-request nonces forces all pages into dynamic rendering. Every page that reads `headers()` to get the nonce opts out of static generation. The entire site -- currently fully statically generated and CDN-cached on Vercel -- becomes server-rendered on every request.

**Why it happens:** Nonces must be unique per request by definition. Static pages are generated at build time when no request exists, so no nonce can be injected into the HTML body. Next.js middleware does run for static pages on Vercel (for rewrites/redirects at the edge), and it CAN set response headers on the response. But middleware cannot modify the pre-built HTML content to inject nonce attributes into `<script>` and `<style>` tags. The nonce in the CSP header would not match any tag in the HTML, causing the browser to block everything.

**Consequences:** If you force dynamic rendering to make nonces work: page load times increase (no CDN cache), Vercel serverless function invocations spike, TTFB degrades from ~50ms to ~200ms+, and hosting costs increase. For a personal portfolio site, this is a disproportionate tradeoff.

**Prevention:** Use hash-based CSP with static headers instead of nonces:
- For `script-src`: Enable `experimental.sri` in `next.config.ts` to add Subresource Integrity attributes to script tags at build time. Use `'strict-dynamic'` in the CSP which trusts scripts loaded by already-trusted scripts. The SRI hashes allow the browser to verify script integrity without per-request nonces.
- For `style-src`: Eliminate inline styles entirely (see Pitfall 3) rather than trying to nonce them. Target a static CSP with `'self'` for `style-src`.
- Move security headers from `next.config.ts` `headers()` to middleware for centralization, but keep the CSP values STATIC (no per-request nonce generation). Middleware can set static response headers on pre-built pages without requiring dynamic rendering.

**Detection:** If `next build` output shows pages as "Dynamic" or "Server" instead of "Static", static generation has been accidentally destroyed. Check for any `headers()` import from `next/headers` in page or layout components.

**Confidence:** HIGH -- confirmed by [Next.js CSP documentation](https://nextjs.org/docs/app/guides/content-security-policy) and [GitHub Discussion #54907](https://github.com/vercel/next.js/discussions/54907).

---

### Pitfall 2: Velite MDX Body Format Assumptions During Migration

**What goes wrong:** Velite's `s.mdx()` outputs a function-body string -- verified by inspecting `.velite/posts.json`, the body starts with `const{Fragment:e,jsx:t,jsxs:i}=arguments[0]`. This format is purpose-built for `new Function(code)` execution. Developers attempt to change the rendering approach without understanding this coupling. Common mistakes: (a) trying to `eval()` the string directly (same CSP problem), (b) changing Velite's `outputFormat` to `'program'` which produces ES module syntax (`import`/`export`) that cannot be passed to `new Function()`, (c) trying to use `next-mdx-remote` without realizing it also uses `new Function()` internally.

**Why it happens:** The Velite documentation shows `new Function()` as the canonical and only rendering pattern. The `s.mdx()` schema output format is not independently configurable -- it follows the global `mdx.compileOptions.outputFormat` setting which defaults to `'function-body'`. Developers search for "MDX without unsafe-eval" and find suggestions that all ultimately require either `new Function()` or file-system writes.

**Consequences:** Build failures, runtime errors where the MDX component is undefined, or -- if `next-mdx-remote` is adopted thinking it solves the problem -- the same `unsafe-eval` requirement persists.

**Prevention:** The key insight is that `mdx-content.tsx` is currently a `'use client'` component, meaning `new Function()` runs IN THE BROWSER. This is why `unsafe-eval` is needed in the CSP. The most practical migration path:

1. **Move MDX evaluation to a server component (recommended):** Convert `MDXContent` from `'use client'` to a server component. Server components execute during build (for static pages) or on the server (for dynamic pages) -- neither context is governed by the browser's CSP. `new Function()` in a server component does NOT require `unsafe-eval` in the CSP because the CSP only restricts browser-side execution. The component override map (`{ pre: CodeBlock }`) can still work because client components can be passed as props to server components in Next.js App Router.

2. **Compile-to-file approach (complex):** Write a custom Velite plugin or post-build script that converts each `body` string into an importable ES module file (`.velite/posts/[slug].mjs`), then use dynamic `import()` instead of `new Function()`. Eliminates `new Function()` entirely but requires significant pipeline changes.

3. **DO NOT use `next-mdx-remote`:** It uses `new Function()` internally ([confirmed in Issue #274](https://github.com/hashicorp/next-mdx-remote/issues/274)). Swapping to it gains nothing for CSP.

**Detection:** After migration, remove `unsafe-eval` from the CSP, load a blog post in Chrome, and check the DevTools Console for CSP violation errors. If none appear, the migration succeeded.

**Confidence:** HIGH -- verified by reading the actual Velite output, the current `mdx-content.tsx` source, and [MDX Discussion #2322](https://github.com/orgs/mdx-js/discussions/2322).

---

### Pitfall 3: Shiki CSS-Variables Theme Breaks CodeBlock Styling

**What goes wrong:** Switching rehype-pretty-code from `theme: 'github-dark-dimmed'` (which applies `style="color:#abc123"` inline on every `<span>`) to a CSS-variables theme changes the HTML output entirely. Tokens get `style="--shiki-light:#xxx;--shiki-dark:#xxx"` instead of direct `color` values. Without corresponding CSS rules that set `color: var(--shiki-light)`, all code blocks render as unstyled monochrome text against the page background.

**Why it happens:** rehype-pretty-code with a single theme writes direct inline color styles. With the multi-theme approach (`themes: { light: '...', dark: '...' }` instead of `theme: '...'`), it outputs CSS custom properties instead. The developer must provide CSS that bridges the variables to actual colors. This is poorly documented for single-theme use cases -- most CSS-variables documentation assumes you want light/dark switching.

**Consequences:** Every code block in every blog post loses syntax highlighting. On keech.dev's dusty rose background with the current neobrutalist design, unstyled code blocks are unreadable and a visible quality regression.

**Prevention:** For a single-theme site, there are three approaches ranked by simplicity:

1. **Keep inline styles, accept `'unsafe-inline'` for style-src (pragmatic):** `unsafe-inline` for styles is far less dangerous than `unsafe-eval` for scripts. CSS injection attacks are limited in scope (exfiltration via `background-image: url()` or layout manipulation) compared to script injection (full account takeover). Many security-conscious production sites accept `style-src 'unsafe-inline'` as a reasonable tradeoff. If the primary goal is removing `unsafe-eval`, this is the simplest path.

2. **Switch to `@shikijs/rehype` with CSS class output:** Replace `rehype-pretty-code` with Shiki's own rehype plugin which offers a `defaultColor` option and `cssVariablePrefix`. Configure for a single theme with class-based output, then define token colors in `globals.css`. This eliminates inline styles entirely but requires rewriting the theme CSS.

3. **Use a Shiki transformer to strip inline styles:** Keep `rehype-pretty-code` but add a custom `transformerCompactLineOptions` or a post-processing transformer that converts inline `style` attributes to `class` attributes with corresponding CSS. More surgical but fragile across Shiki version bumps.

**Detection:** Visual inspection of any blog post with code blocks. Automated: Playwright test that checks code block `<span>` elements have a non-default `color` value.

**Confidence:** HIGH -- verified against [Shiki dual themes documentation](https://shiki.matsu.io/guide/dual-themes) and [rehype-pretty-code docs](https://rehype-pretty.pages.dev/).

---

## Moderate Pitfalls

### Pitfall 4: `keepBackground: true` Creates Orphaned Inline Style After Theme Migration

**What goes wrong:** The current `velite.config.ts` has `keepBackground: true` for rehype-pretty-code. This injects a `background-color` inline style on the `<pre>` element. When migrating to CSS-variables or class-based themes, this inline background persists even if token colors switch to CSS variables, creating a split: hardcoded background + variable text colors. Worse, if you remove `keepBackground`, code blocks lose their dark background and inherit the dusty rose page background, making code unreadable.

**Prevention:** When switching theme approaches: (1) Set `keepBackground: false`, (2) Add explicit CSS: `pre[data-theme] { background-color: #22272e; }` (the github-dark-dimmed background) or use a CSS variable for it, (3) Verify the code block background renders correctly in both the `CodeBlock` wrapper and any inline code elements.

**Detection:** Code blocks appear with wrong background color -- either page-colored (dusty rose) or with jarring mismatched light/dark backgrounds.

---

### Pitfall 5: Middleware + `next.config.ts` Headers Double-Apply CSP

**What goes wrong:** When adding middleware for CSP headers, developers forget to remove the existing `headers()` function in `next.config.ts`. Both apply, resulting in duplicate `Content-Security-Policy` headers. Browsers enforce the INTERSECTION of all CSP policies -- the most restrictive combination wins. If the old config header allows `unsafe-eval` but the new middleware header removes it, the stricter policy applies (correct behavior but confusing during testing). If the middleware header is MORE permissive, the config header constrains it silently.

**Prevention:** When adding middleware CSP:
1. Remove the CSP line from `next.config.ts` `headers()` first
2. Keep non-CSP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) in middleware too for centralization, then remove the entire `headers()` function
3. Verify in DevTools Network tab that only ONE `Content-Security-Policy` header appears in responses
4. Test with a fresh browser tab (not cached) to avoid stale header confusion

**Detection:** Chrome DevTools Network tab shows two `Content-Security-Policy` response headers. Or: middleware CSP changes do not seem to take effect because the `next.config.ts` header is more restrictive.

**Confidence:** HIGH -- this is a mechanical mistake confirmed by testing response headers.

---

### Pitfall 6: `useSyncExternalStore` Hydration Mismatch with `getServerSnapshot`

**What goes wrong:** When migrating `useLayoutEffect` + `setState` patterns (localStorage reads in `view-counter.tsx` and `listing-view-counts.tsx`, `matchMedia` checks in `use-hero-animation.ts`) to `useSyncExternalStore`, the `getServerSnapshot` parameter returns a value that differs from the initial client value. This causes React hydration mismatches.

**Why it happens:** `useSyncExternalStore` requires a `getServerSnapshot` function for SSR/SSG. Since `localStorage` and `window.matchMedia` do not exist at build time, `getServerSnapshot` must return a fallback. If that fallback differs from what the client reads on first render, React detects a mismatch. The current code avoids this by using `useState(null)` + `useLayoutEffect` which defers the external store read to after hydration.

**Specific cases in this codebase:**
- **View counts (`view-counter.tsx`, `listing-view-counts.tsx`):** `getServerSnapshot` returns `null`, `getSnapshot` reads localStorage which may return a number. This mismatch triggers a hydration warning. However, since the current pattern also starts with `null` and updates in `useLayoutEffect`, the visual behavior is identical -- the mismatch warning is the only difference.
- **Reduced motion (`use-hero-animation.ts`):** `getServerSnapshot` returns `false`, but `matchMedia('(prefers-reduced-motion: reduce)')` may return `true` on the client. If the user has reduced motion enabled, the hero animation plays for one frame before being suppressed.

**Prevention:**
- `getServerSnapshot` MUST return the same value as the client's initial render to avoid hydration mismatch. For localStorage: return `null` from both `getServerSnapshot` and the initial `getSnapshot`, then trigger an update via the `subscribe` callback.
- `getSnapshot` must return a PRIMITIVE or a STABLE REFERENCE. Returning `new Object()` or a freshly-created array each time causes infinite re-renders because `Object.is()` comparison always fails. For the view counts record (`Record<string, number | null>`), use a module-level cache variable and only replace it when values actually change.
- For `matchMedia`: use the `subscribe` callback to listen for `change` events and return the current `.matches` boolean from `getSnapshot`. Return `false` from `getServerSnapshot`.
- Do NOT try to solve hydration mismatches by omitting `getServerSnapshot` -- this causes a hard error during SSR, not just a warning.

**Detection:** React hydration mismatch warnings in browser console. Content flickering on page load. Infinite re-render loops (if returning objects from `getSnapshot` without stable references).

**Confidence:** MEDIUM -- the current `useLayoutEffect` pattern works correctly. This migration is a code quality improvement to silence React 19 lint warnings, not a functional requirement. The [React docs](https://react.dev/reference/react/useSyncExternalStore) and [TkDodo's blog post](https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store) confirm the hydration risks.

---

### Pitfall 7: npm Overrides Silently Break or Stop Applying

**What goes wrong:** `overrides` in `package.json` pin a transitive dependency (`flatted`, `picomatch`) to a patched version. This works initially, but: (a) running `npm install` twice may produce different `package-lock.json` files (a known npm bug improved but not fully fixed as of early 2025), (b) when the parent dependency updates, the override path may no longer match, (c) the forced version may be API-incompatible with the consumer, causing silent runtime errors in build tools.

**Why it happens:** npm `overrides` bypass the dependency resolution algorithm. They do not verify API compatibility between the forced version and the consuming package. npm also does not warn when an override becomes stale or inapplicable after a parent version change.

**Consequences:** Silent runtime errors in Velite or ESLint builds. `npm audit` still reports vulnerabilities (override not applied). Inconsistent `package-lock.json` between developers.

**Prevention:**
- Use the most general override path: `"flatted": ">=4.0.1"` rather than `"velite>flatted": ">=4.0.1"` -- the general form catches all transitive instances
- After adding overrides, verify with `npm ls flatted` that the correct version appears everywhere in the tree
- Add a comment in `package.json` documenting WHY each override exists and WHEN it can be removed
- Run `npm run build` after adding overrides to verify build tools still function correctly
- Treat overrides as temporary technical debt -- check monthly whether upstream packages have released fixes that make the override unnecessary
- After every `npm update` or `npm install`, re-run `npm audit` to verify overrides are still effective

**Detection:** `npm audit` still shows vulnerabilities after adding overrides. `npm ls <package>` shows the old version in some paths. Build tools (Velite, ESLint) produce unexpected errors after updating unrelated dependencies.

**Confidence:** HIGH -- well-documented npm behavior, confirmed by [npm overrides RFC](https://github.com/npm/rfcs/blob/main/accepted/0036-overrides.md) and [HeroDevs guide](https://www.herodevs.com/blog-posts/a-guide-to-npm-overrides-take-control-of-your-dependencies).

---

### Pitfall 8: Server-Component MDX Breaks Client Component Overrides

**What goes wrong:** When moving `MDXContent` from `'use client'` to a server component (Pitfall 2, Option 1), the component override mechanism requires careful handling. `CodeBlock` is a `'use client'` component (uses `useRef`, `useCallback`). Passing client components as MDX overrides in a server component IS supported in Next.js App Router, but the MDX function body expects to receive the component map at evaluation time via `new Function(code)({...runtime}).default`. If the component map is applied AFTER evaluation (e.g., wrapping the output), the `<pre>` elements are already rendered without the `CodeBlock` wrapper.

**Why it happens:** The current pattern passes components via `<Component components={{ pre: CodeBlock }} />` -- this works because the MDX function body produces a component that accepts a `components` prop and uses it during rendering. This same pattern should work in a server component context. The failure mode is if the developer tries to evaluate the MDX function without passing the component map, then post-processes the output.

**Prevention:** When converting `MDXContent` to a server component:
1. The `useMDXComponent` function (which calls `new Function(code)`) should remain in the server component -- it runs at build time for static pages
2. Pass the component map the same way: `<Component components={{ pre: CodeBlock, ul: ..., ol: ... }} />`
3. Import `CodeBlock` in the server component file -- Next.js allows server components to import and render client components
4. Test with a blog post that has code blocks to verify the copy button renders and functions
5. The `try/catch` + `MDXFallback` pattern should remain, but `MDXFallback` may need to stay as a client component (it uses no client APIs currently, so it could be either)

**Detection:** Blog posts render but code blocks lack the copy button wrapper, or `CodeBlock` appears as a bare `<pre>` without the `<div className="group relative">` container. The copy button is invisible or non-functional.

---

## Minor Pitfalls

### Pitfall 9: ESLint Disable Comments Without Explanatory Context

**What goes wrong:** Adding `eslint-disable-next-line` comments for the four `@next/next/no-html-link-for-pages` errors in error boundaries without explanatory suffixes. Future maintainers see the suppress and wonder if it is intentional or a hack.

**Prevention:** The current codebase already uses the correct pattern (e.g., `// eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state` in `mdx-content.tsx`). Apply the same pattern to the remaining three files (`error.tsx`, `global-error.tsx`, `blog/[slug]/error.tsx`). For `react-hooks/set-state-in-effect` warnings: do NOT add disable comments -- these should be resolved by the `useSyncExternalStore` migration.

### Pitfall 10: `eslint-config-next` Version Update Introduces New Rule Failures

**What goes wrong:** Updating `eslint-config-next` from `^16.1.6` to match `next@16.2.2` may change rule defaults or add new rules that surface additional errors. The `next lint` CLI removal already happened; the config package itself may have rule severity changes.

**Prevention:** Update `eslint-config-next` in an isolated commit. Run `npm run lint` immediately after and fix any new errors before proceeding with other changes. Compare the diff in rule definitions between versions if unexpected errors appear.

### Pitfall 11: Velite `^0.3.1` Caret Range Allows Breaking 0.x Updates

**What goes wrong:** Under semver, `0.x` versions treat minor bumps as potentially breaking (0.3 to 0.4 is fair game). The caret `^0.3.1` allows `0.3.x` patches but a fresh install on a new machine or CI could pull a different patch version than the lockfile specifies if the lockfile is not committed.

**Prevention:** Pin exact: `"velite": "0.3.1"` (no caret). The lockfile IS committed in this repo, so the risk is low, but explicit pinning communicates intent. Do this first -- it is a one-character change.

---

## Integration Pitfalls: The CSP Chain

These pitfalls interact. The order of operations matters because each CSP change affects the others.

### The Dependency Chain

```
1. MDX rendering approach determines whether 'unsafe-eval' is needed in script-src
2. Syntax highlighting approach determines whether 'unsafe-inline' is needed in style-src
3. Both above must be resolved BEFORE writing the final CSP policy
4. CSP policy must be finalized BEFORE moving headers to middleware
5. Middleware must NOT generate per-request nonces (would break static generation)
```

### What Breaks If Done Out of Order

| Wrong Order | Consequence |
|-------------|-------------|
| Move to middleware BEFORE fixing MDX | Middleware CSP without `unsafe-eval` breaks all blog posts |
| Remove `unsafe-inline` BEFORE fixing syntax highlighting | All code blocks lose styling |
| Add SRI hashes BEFORE removing `unsafe-eval` | SRI works but `unsafe-eval` still weakens CSP -- wasted effort |
| Fix syntax highlighting BEFORE fixing MDX | Blog posts break during the intermediate state if `unsafe-eval` is accidentally removed |

### Correct Order

1. Fix MDX rendering (server component migration) -- removes need for `unsafe-eval`
2. Fix syntax highlighting (CSS-based or accept `unsafe-inline`) -- optionally removes need for `unsafe-inline` in `style-src`
3. Write the final CSP policy reflecting the new requirements
4. Move all security headers to middleware with the finalized static CSP
5. Remove `headers()` from `next.config.ts`
6. Verify all pages with DevTools -- single CSP header, no violations

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| MDX migration (removing `unsafe-eval`) | Pitfall 2 (format assumptions), Pitfall 8 (client component overrides) | Convert `MDXContent` to server component. Verify full pipeline with code-heavy blog posts. Do NOT adopt `next-mdx-remote` (same problem). |
| Syntax highlighting migration | Pitfall 3 (color loss), Pitfall 4 (background orphan) | Decide: accept `unsafe-inline` for style-src (pragmatic) or switch to class-based theme (thorough). Handle background color explicitly in CSS. Visual regression test every code variant. |
| CSP middleware | Pitfall 1 (static generation loss), Pitfall 5 (double headers) | Use hash-based static CSP, NOT nonces. Remove `headers()` from `next.config.ts`. Verify `next build` output still shows static pages. |
| `useSyncExternalStore` migration | Pitfall 6 (hydration mismatch) | Return primitives from `getSnapshot`. Match `getServerSnapshot` to initial client value (`null` for view counts, `false` for reduced motion). Use stable references for objects. |
| npm overrides | Pitfall 7 (silent breakage) | Document every override. Verify with `npm ls`. Treat as temporary. |
| ESLint cleanup | Pitfall 9 (mystery suppressions), Pitfall 10 (version sync) | Update config version first in isolation. Explanatory comments on all disable directives. |
| Velite pinning | Pitfall 11 (0.x breaking changes) | One-character fix. Do first. |

## Sources

- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) -- nonce approach requires dynamic rendering
- [Next.js Discussion #54907](https://github.com/vercel/next.js/discussions/54907) -- nonce + static page incompatibility
- [Next.js Discussion #64554](https://github.com/vercel/next.js/discussions/64554) -- hash-based CSP for SSG
- [Next.js Discussion #81703](https://github.com/vercel/next.js/discussions/81703) -- `script-src` requires `unsafe-inline` in production
- [MDX Discussion #2322](https://github.com/orgs/mdx-js/discussions/2322) -- running compiled MDX without Function constructor
- [next-mdx-remote Issue #274](https://github.com/hashicorp/next-mdx-remote/issues/274) -- also uses `new Function()` internally
- [Velite MDX Guide](https://velite.js.org/guide/using-mdx) -- function-body output format, evaluation pattern
- [Velite Code Highlighting Guide](https://velite.js.org/guide/code-highlighting) -- Shiki integration
- [Shiki Dual Themes Documentation](https://shiki.matsu.io/guide/dual-themes) -- CSS-variables theme approach
- [rehype-pretty-code Documentation](https://rehype-pretty.pages.dev/) -- theme configuration, CSS variable output
- [React useSyncExternalStore Reference](https://react.dev/reference/react/useSyncExternalStore) -- official API, `getServerSnapshot` requirements
- [TkDodo: Avoiding Hydration Mismatches](https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store) -- `getServerSnapshot` pitfalls
- [Nico's Blog: Be Careful with useSyncExternalStore](https://www.nico.fyi/blog/be-careful-with-usesyncexternalstore) -- object reference infinite re-render pitfall
- [npm Overrides RFC](https://github.com/npm/rfcs/blob/main/accepted/0036-overrides.md) -- official specification
- [HeroDevs: Guide to npm Overrides](https://www.herodevs.com/blog-posts/a-guide-to-npm-overrides-take-control-of-your-dependencies) -- practical pitfalls and version selector issues

---
*Pitfalls research for: v1.7 Address Additional Concerns -- CSP hardening, MDX migration, lint cleanup*
*Researched: 2026-04-03*
