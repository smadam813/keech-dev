# Project Research Summary

**Project:** keech.dev v1.7 — CSP Hardening, MDX Migration, Lint Cleanup
**Domain:** Security hardening for a statically generated Next.js 16 portfolio with Velite MDX pipeline
**Researched:** 2026-04-03
**Confidence:** HIGH (four independent researchers reached consistent conclusions; conflicts reconciled below)

## Executive Summary

This milestone is fundamentally a security hardening effort on a fully static site, and that architectural constraint — fully static generation deployed to Vercel CDN — shapes every decision. The most important finding across all four research threads is that **nonce-based CSP is categorically off the table**: nonces require per-request rendering, which destroys CDN caching on a site designed around static generation. The correct strategy is to eliminate the *need* for dangerous CSP directives through code changes, then enforce a tightened static CSP via middleware.

The two dangerous directives are `unsafe-eval` (from MDX runtime execution via `new Function()`) and `unsafe-inline` in `style-src` (from Shiki inline token styles). Research produces a clear recommendation for each: switch from `s.mdx()` to `s.markdown()` in Velite to eliminate `unsafe-eval` entirely — the site uses zero MDX-specific features in its content files, making this a clean swap — and accept `unsafe-inline` in `style-src` as a pragmatic tradeoff while switching to a CSS-variables theme for design system benefits. The researchers surfaced genuine conflicts on both these questions; the Conflict Resolutions section below provides the reconciled, authoritative position.

The remaining workstreams (middleware centralization, `useSyncExternalStore` migration, npm audit, lint cleanup, Velite pinning) are all straightforward with high-confidence implementation paths. None require new npm packages beyond what is already installed. The order of operations matters: pin Velite first, establish middleware second with the current permissive CSP, then tighten directives as migrations complete. The final tightened CSP removes `unsafe-eval` from `script-src` — the material security win — while `unsafe-inline` remains in both `script-src` (Next.js hydration scripts, unavoidable without nonces) and `style-src` (Shiki inline styles, pragmatically accepted).

## Conflict Resolutions

These conflicts across research files are reconciled here. The roadmapper and all implementation phases should treat these resolutions as the authoritative position.

### Conflict 1: How to Remove `unsafe-eval`

Three competing approaches were surfaced:

| Approach | Source | Assessment |
|----------|--------|------------|
| Impossible without replacing Velite | STACK.md | Incorrect framing — conflates Velite's `s.mdx()` schema with Velite itself. Velite offers `s.markdown()` as an alternative. |
| Make `MDXContent` a server component so `new Function()` runs at build time, not in browser | PITFALLS.md | Valid — CSP governs browser-side execution, not server-side. Moves eval to a safe context without changing the output format. But still uses `new Function()`. |
| Switch from `s.mdx()` to `s.markdown()` since the site uses zero MDX features | ARCHITECTURE.md | Cleanest path. Velite produces HTML; rendered via `dangerouslySetInnerHTML`. No `new Function()` anywhere. |

**Resolution: Use `s.markdown()`.** The site has 5 blog posts and 2 projects with no JSX components, no imports, and no expressions in content files. The only "MDX features" in use are component overrides (`pre`, `ul`, `ol`) which are all rehype-level concerns that can be handled by compile-time plugins. Switching to `s.markdown()` eliminates `new Function()` entirely rather than relocating it. This is the architecturally correct choice given the actual content. The Pitfalls "server component" approach is a valid fallback if content ever needs real MDX features in the future, but it is not needed now.

### Conflict 2: Can `unsafe-inline` Be Removed from `style-src`?

Three positions were identified:

| Position | Source | Assessment |
|----------|--------|------------|
| `transformerStyleToClass` can remove it | STACK.md | Technically correct. The transformer replaces inline `style` attributes with generated CSS class names, writing a companion stylesheet. But requires CSS extraction integration with the Velite build pipeline — medium complexity. |
| CSS-variables theme does NOT eliminate inline styles | ARCHITECTURE.md | Correct. `createCssVariablesTheme()` still outputs `style="color: var(--shiki-x)"` attributes. Only the values change (from hardcoded hex to CSS variable references); the `style` attribute mechanism remains. |
| Accept `unsafe-inline` for styles as pragmatic | PITFALLS.md | Correct risk assessment. CSS injection has far narrower attack surface than script injection on a site with no user-generated content. |

**Resolution: Accept `unsafe-inline` in `style-src` for v1.7, but switch to CSS-variables theme for design system benefits.** The primary security win is removing `unsafe-eval` from `script-src`. Removing `unsafe-inline` from `style-src` requires `transformerStyleToClass` (real solution, medium complexity) and is not worth the effort relative to the marginal security benefit for author-controlled content. The CSS-variables theme is still worth adopting — it moves syntax highlighting colors into `globals.css` alongside other design tokens, consistent with the site's CSS-first configuration pattern. If `unsafe-inline` removal from `style-src` ever becomes a goal, `transformerStyleToClass` is the correct tool; switching to CSS-variables theme alone is NOT sufficient.

### Clarification: `unsafe-inline` in `script-src` Persists (Not a Conflict, a Constraint)

After all migrations, `'unsafe-inline'` remains in `script-src` for Next.js hydration scripts. This is unavoidable without nonces (which require dynamic rendering). The final tightened CSP is:

```
Before: script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com
After:  script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com
```

Removing `unsafe-eval` is the material security improvement. The remaining `unsafe-inline` in `script-src` is an accepted Next.js static site constraint, not a gap.

## Key Findings

### Recommended Stack

No new npm packages are required for any workstream in v1.7. The `s.markdown()` migration, middleware creation, `useSyncExternalStore` refactor, and lint cleanup all use existing packages or built-in React/Next.js APIs. The CSS-variables theme change uses `createCssVariablesTheme` from `shiki`, which is already installed. `@shikijs/transformers` (for `transformerStyleToClass`) would only be needed if `unsafe-inline` removal from `style-src` becomes a future goal — it is not needed for v1.7.

**Actions and their dependency on existing packages:**
- `s.markdown()` (Velite built-in): replaces `s.mdx()` to produce HTML output — eliminates `new Function()` and `unsafe-eval`
- `createCssVariablesTheme()` (`shiki`, already installed): replaces hardcoded theme — moves token colors to `globals.css`
- `src/middleware.ts` (Next.js built-in): centralizes all security headers — replaces `next.config.ts` headers() function
- `useSyncExternalStore` (React 19 built-in): replaces `useLayoutEffect` + `setState` patterns — eliminates React 19 lint warnings
- `npm audit fix`: resolves 3 transitive vulnerabilities (`flatted`, `picomatch` x2) — no package.json overrides needed
- Velite pinned to `0.3.1` (exact, no caret): locks pre-release dependency — one character change to package.json

**What NOT to add:**
- `next-mdx-remote`: also uses `new Function()` internally, broken on Next.js 15.2+/16.x
- `@next/mdx`: would replace Velite entirely — massive scope creep
- `safe-mdx`: cannot handle rehype plugins, no syntax highlighting support
- `@shikijs/transformers`: only needed if `unsafe-inline` removal from `style-src` is in scope (it is not for v1.7)
- Any nonce-based CSP infrastructure: incompatible with static generation

### Expected Features

**Must have (table stakes for v1.7 to be meaningful):**
- Remove `unsafe-eval` from `script-src` — primary security goal; achieved via `s.markdown()` migration
- Centralize security headers in `src/middleware.ts` — standard Next.js pattern; removes from `next.config.ts`
- npm audit clean — 3 transitive vulnerabilities resolved via `npm audit fix`
- `eslint-config-next` version sync to `^16.2.2` — prevents rule drift with `next@16.2.2`
- ESLint disable comments for intentional `<a>` tags in error boundaries — silences 4 false-positive errors with explanatory context (3 files still need this treatment; `mdx-content.tsx` already has it)
- Pin Velite to exact version `0.3.1` — locks pre-release dependency before migration work begins

**Should have (quality signals that elevate the milestone):**
- `useSyncExternalStore` migration for localStorage and matchMedia — eliminates React 19 lint warnings, idiomatic pattern, SSR-safe; affects `view-counter.tsx`, `listing-view-counts.tsx`, `use-hero-animation.ts`
- CSS-variables Shiki theme (`createCssVariablesTheme`) — design system benefit; moves token colors to `globals.css` consistent with the site's CSS-first configuration
- Remove stale worktree artifacts — 3.6 GB disk space reclaim

**Defer (not essential for v1.7):**
- Remove `unsafe-inline` from `style-src` — marginal security gain for meaningful implementation effort; use `transformerStyleToClass` if prioritized in a future milestone
- CSP reporting endpoint (`report-uri` / `report-to`) — useful for catching regressions, not blocking
- Hash-based SRI via `experimental.sri` — webpack-only, incompatible with Turbopack (Next.js 16 default); cannot ship currently

### Architecture Approach

The migration creates no new component boundaries and changes no page-level API shapes. `src/app/blog/[slug]/page.tsx` continues to pass `post.body` to `<MDXContent code={post.body} />` — the prop name and type (`string`) stay identical; only the value changes from a JavaScript function-body string to an HTML string. All other Velite collection fields (`toc`, `excerpt`, `tags`, `metadata`) are produced by separate schema functions and are entirely unaffected by the `s.mdx()` to `s.markdown()` switch.

**New files:**
1. `src/middleware.ts` — centralized security headers, replaces `next.config.ts` headers() function
2. `src/lib/use-local-storage-snapshot.ts` — `useSyncExternalStore` adapter for localStorage (single-key and multi-key variants)
3. `src/lib/use-prefers-reduced-motion.ts` — `useSyncExternalStore` adapter for matchMedia
4. `src/components/blog/code-block-enhancer.tsx` — DOM-based client component for copy button injection after HTML-rendering migration

**Modified files:**
1. `velite.config.ts` — `s.mdx()` → `s.markdown()` on both collections; CSS-variables theme for rehype-pretty-code; new rehype plugins for `role="list"` and `<pre>` wrapping
2. `src/components/blog/mdx-content.tsx` — major rewrite from `new Function()` execution to `dangerouslySetInnerHTML`; remove `'use client'` directive
3. `src/components/blog/code-block.tsx` — DOM-based adaptation or replacement by `code-block-enhancer.tsx`
4. `next.config.ts` — remove `headers()` function entirely
5. `src/components/blog/view-counter.tsx` — replace `useLayoutEffect` with `useLocalStorageSnapshot`
6. `src/components/blog/listing-view-counts.tsx` — replace `useLayoutEffect` with `useLocalStorageSnapshots`
7. `src/hooks/use-hero-animation.ts` — replace matchMedia effect with `usePrefersReducedMotion`; keep animation orchestration `useEffect` blocks with explanatory lint suppression comments
8. `src/lib/views.ts` — add `StorageEvent` dispatch to `setCachedViews` for same-tab write notification
9. `src/app/globals.css` — add Shiki CSS variable definitions matching `github-dark-dimmed` palette

### Critical Pitfalls

1. **Nonce-based CSP destroys static generation** — middleware CAN set static response headers on pre-built Vercel CDN pages. But middleware CANNOT inject nonces into pre-built HTML content. A nonce in the CSP header with no matching nonce in the HTML body causes browsers to block everything. Do not generate per-request nonces. Keep CSP values static in middleware.

2. **Velite body format coupling** — `s.mdx()` produces a JavaScript function-body string; `s.markdown()` produces an HTML string. These are completely different. Switching the Velite schema without rewriting `MDXContent` (or vice versa) causes total content failure. Both must change together and be tested immediately with a content-heavy post.

3. **CSS-variables theme alone does NOT remove `unsafe-inline` from `style-src`** — `createCssVariablesTheme()` still emits inline `style` attributes (values change from hex to CSS variables, but the `style` attribute mechanism remains). Removing `unsafe-inline` from `style-src` after only switching themes will break all syntax highlighting. See Conflict Resolution 2.

4. **`keepBackground: true` orphaned inline style after theme migration** — when switching to CSS-variables theme, set `keepBackground: false` and add explicit CSS for the code block background in `globals.css`. Without this, code blocks lose their dark background and inherit the dusty rose page background.

5. **Double CSP headers from middleware + `next.config.ts`** — when adding middleware CSP, remove the `headers()` function from `next.config.ts` in the same commit. Browsers enforce the intersection of all CSP policies (most restrictive wins), which can cause confusing silent failures during testing. Verify in DevTools Network tab that only one `Content-Security-Policy` header appears.

6. **`useSyncExternalStore` object reference stability** — `getSnapshot` must return stable references. Primitives (string, boolean, null) are fine. For the multi-key localStorage adapter, returning a new object on every call causes infinite re-renders because React uses `Object.is` comparison. Cache the previous result and only return a new object when values actually change. Additionally, patch `setCachedViews` in `src/lib/views.ts` to dispatch a synthetic `StorageEvent` after writing — the native `storage` event only fires for cross-tab changes, not same-tab writes.

## Implications for Roadmap

The build order is dictated by a dependency chain: pin Velite first (locks the target before schema changes), establish middleware second with the current permissive CSP (single source of truth before any tightening), then MDX migration removes `unsafe-eval`, then theme migration cleans up the design system. The `useSyncExternalStore` and housekeeping work are fully independent of the CSP chain.

### Phase 1: Foundation Hardening

**Rationale:** Independent, low-risk changes that reduce noise and lock the environment before the more complex migrations. Velite must be pinned before any Velite schema changes. npm audit and ESLint sync should land before other diffs so they do not pollute migration commits.

**Delivers:** Clean dependency tree, zero npm audit vulnerabilities, reduced ESLint noise, exact-version Velite lock, stale worktree cleanup.

**Addresses:** npm audit fixes, `eslint-config-next` version sync, ESLint disable comments for error boundaries, Velite version pin, stale worktree removal.

**Avoids:** Pitfall 11 (0.x Velite breaking changes), Pitfall 9 (mystery eslint suppressions), Pitfall 7 (npm overrides silently breaking — `npm audit fix` uses direct updates, no overrides needed).

### Phase 2: Middleware Infrastructure

**Rationale:** Establishes the single location where CSP is managed. Must come before any CSP directive changes. Deploy with the CURRENT permissive CSP values — this is a centralization, not a tightening. Tightening happens in subsequent phases after the code changes that make it safe to tighten.

**Delivers:** `src/middleware.ts` with all current security headers; `headers()` function removed from `next.config.ts`.

**Addresses:** Centralized security headers (table stakes feature).

**Avoids:** Pitfall 5 (double CSP headers — remove from `next.config.ts` in the same commit as middleware creation), Pitfall 1 (confirms no nonce generation in middleware).

### Phase 3: MDX Migration (`unsafe-eval` Removal)

**Rationale:** The highest-value security change in this milestone. Must complete before the `unsafe-eval` directive is removed from the middleware CSP. Touches multiple files and requires careful sequencing: velite.config.ts schema change, MDXContent rewrite, CodeBlock DOM-based adaptation, then CSP tightening.

**Delivers:** `MDXContent` renders HTML via `dangerouslySetInnerHTML`; `'use client'` removed from `mdx-content.tsx`; `new Function()` eliminated; `unsafe-eval` removed from middleware CSP.

**Addresses:** Remove `unsafe-eval` from CSP (primary milestone goal).

**Implements:** `velite.config.ts` schema change, `mdx-content.tsx` major rewrite, `code-block-enhancer.tsx` creation, `code-block.tsx` DOM-based adaptation, `src/lib/views.ts` StorageEvent patch.

**Avoids:** Pitfall 2 (body format coupling — both schema and renderer must change together), Pitfall 8 (client component overrides — verify copy button works via DOM-based approach with actual content).

### Phase 4: Syntax Highlighting Theme Migration

**Rationale:** Independent of MDX migration but benefits from sequencing after Phase 3 (one fewer `velite.config.ts` touch). Design system improvement: token colors defined in `globals.css` alongside other design tokens, consistent with the site's CSS-first approach. Does NOT remove `unsafe-inline` from `style-src` — see Conflict Resolution 2.

**Delivers:** CSS-variables theme in `velite.config.ts`; Shiki token color variable definitions in `globals.css`; `keepBackground: false` with explicit background CSS; visual parity with current `github-dark-dimmed` color scheme.

**Addresses:** CSS-variables Shiki theme (should-have feature).

**Avoids:** Pitfall 3 (color loss — CSS variable definitions must exist in `globals.css` before removing the old theme config), Pitfall 4 (background orphan — `keepBackground: false` requires explicit `background-color` in CSS).

### Phase 5: React 19 Lint Cleanup (`useSyncExternalStore`)

**Rationale:** Fully independent of all CSP work. Can be interleaved into any prior phase, but batching here produces cleaner diffs that separate security work from code quality work. Eliminates all React 19 `set-state-in-effect` lint warnings. The animation orchestration effects in `use-hero-animation.ts` are intentional `useEffect` patterns — they stay with explanatory suppression comments.

**Delivers:** Two reusable hooks (`use-local-storage-snapshot.ts`, `use-prefers-reduced-motion.ts`); three refactored components; zero `set-state-in-effect` warnings; animation effects preserved with explanatory lint suppression.

**Addresses:** `useSyncExternalStore` migration (should-have feature), remaining lint warning cleanup.

**Avoids:** Pitfall 6 (hydration mismatch — `getServerSnapshot` returns `null` for localStorage, `false` for matchMedia; stable object references required for multi-key adapter).

### Phase 6: Verification and Polish

**Rationale:** End-to-end validation of the hardened CSP against the full site. Every page type, every code block variant, every client component that touches localStorage or matchMedia must be checked against the tightened policy.

**Delivers:** Full E2E test pass with hardened CSP; zero lint errors/warnings; single `Content-Security-Policy` header confirmed in DevTools; `next build` output still shows all pages as "Static".

**Addresses:** Final verification, any residual lint issues from `eslint-config-next` sync.

### Phase Ordering Rationale

- Foundation first to reduce noise and lock Velite before touching its config
- Middleware before MDX migration to establish the single CSP management location — tightening the CSP without middleware in place creates a split-brain between middleware and `next.config.ts`
- MDX migration before theme migration because `unsafe-eval` removal is the primary security win and involves the biggest code changes; theme migration benefits from not fighting those changes simultaneously
- `useSyncExternalStore` last to keep security-focused diffs separate from code quality diffs in the commit history
- Verification at the end because CSP violations are only meaningful to check against the final tightened policy

### Research Flags

**Phases needing implementation-phase validation:**

- **Phase 3 (MDX migration):** Two specific implementation details need early prototyping before committing to the approach:
  1. The rehype plugin for `role="list"` on `<ul>`/`<ol>` elements — needs validation that Velite's rehype plugin API supports this in `s.markdown()` mode
  2. The DOM-based copy button injection via `code-block-enhancer.tsx` — needs verification that rehype-pretty-code's `<pre>` HTML structure is stable enough for `querySelectorAll` targeting

- **Phase 4 (theme migration):** Visual regression check required. `createCssVariablesTheme()` is coarser than `github-dark-dimmed` (approximately 10 CSS variables vs 40+ token scopes). Some currently-distinct token colors will collapse. Verify no jarring color regressions in code-heavy blog posts.

**Phases with standard patterns — skip additional research:**

- **Phase 1 (foundation):** All changes are mechanical. No research needed.
- **Phase 2 (middleware):** Well-documented Next.js pattern with official examples. No research needed.
- **Phase 5 (`useSyncExternalStore`):** Stable React API with official documentation. Architecture research has already mapped every affected component and the solutions for each edge case.
- **Phase 6 (verification):** Test execution, not new development.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core finding (no eval-free path via `s.mdx()`) verified through Velite docs and MDX source. `s.markdown()` alternative confirmed in Velite docs. No new packages needed — verified against existing `package.json`. |
| Features | HIGH | Table stakes confirmed against milestone goals. Anti-features validated with specific failure modes. Feature dependencies mapped explicitly with rationale. |
| Architecture | HIGH | Integration points verified against actual codebase files named in `CLAUDE.md`. Component boundary analysis reflects the real file structure. Changed vs unchanged files mapped at line level. |
| Pitfalls | HIGH | Static generation constraint confirmed by Next.js official docs and multiple GitHub discussions. CSS-variables theme nuance confirmed against Shiki source behavior. Object reference pitfall in `useSyncExternalStore` confirmed against React source semantics. |

**Overall confidence:** HIGH

### Gaps to Address During Implementation

- **Multi-key localStorage adapter referential stability** (Phase 5): Architecture research identified the problem (new object on every `getSnapshot` call causes infinite re-renders) and proposed solutions (module-level cache, structural comparison). The exact implementation needs a focused unit test to verify the cache update logic handles all write scenarios correctly.

- **rehype plugin ordering in `velite.config.ts`** (Phase 3): When adding `role="list"` and `<pre>` wrapper plugins alongside `rehype-pretty-code`, execution order matters — `rehype-pretty-code` must run before any plugin that inspects its `<pre>` output. Verify this sequencing during Phase 3 implementation.

- **`transformerStyleToClass` CSS extraction integration** (deferred to future milestone if `style-src` `unsafe-inline` removal is ever prioritized): The `getCSS()` mechanism is clear from Shiki docs, but integrating the generated stylesheet into the Velite build pipeline (writing a static CSS file during Velite's build step, then importing it in `globals.css`) requires a custom Velite transform hook. Not needed for v1.7 but flag for future research if this goal surfaces.

## Sources

### Primary (HIGH confidence)
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) — nonce approach requires dynamic rendering; static CSP via middleware; `unsafe-inline` required in `script-src` for hydration
- [Velite MDX documentation](https://velite.js.org/guide/using-mdx) — function-body output format, `new Function()` as canonical rendering pattern
- [Velite Markdown documentation](https://velite.js.org/guide/using-markdown) — `s.markdown()` HTML output alternative
- [MDX Discussion #2322](https://github.com/orgs/mdx-js/discussions/2322) — MDX maintainers confirming all execution paths for compiled MDX require dynamic code evaluation
- [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) — official API with localStorage and matchMedia patterns, `getServerSnapshot` requirements
- [Shiki theme colors](https://shiki.style/guide/theme-colors) — `createCssVariablesTheme()` factory, inline style output behavior
- [Shiki transformers documentation](https://shiki.style/packages/transformers) — `transformerStyleToClass` mechanism (for future reference)
- [rehype-pretty-code documentation](https://rehype-pretty.pages.dev/) — transformer configuration, theme behavior

### Secondary (MEDIUM confidence)
- [Next.js SRI Issue #66901](https://github.com/vercel/next.js/issues/66901) — `experimental.sri` incompatible with Turbopack
- [Shiki CSP issue #671](https://github.com/shikijs/shiki/issues/671) — maintainer confirmation of `transformerStyleToClass` approach
- [TkDodo: Avoiding Hydration Mismatches](https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store) — `getServerSnapshot` pitfalls in practice
- [Nico's Blog: Be Careful with useSyncExternalStore](https://www.nico.fyi/blog/be-careful-with-usesyncexternalstore) — object reference infinite re-render pitfall

### Tertiary (contextual, not primary decision drivers)
- [next-mdx-remote Issue #488](https://github.com/hashicorp/next-mdx-remote/issues/488) — compatibility issues with Next.js 15.2+/16.x confirming it is not a viable alternative
- [next-mdx-remote Issue #274](https://github.com/hashicorp/next-mdx-remote/issues/274) — also uses `new Function()` internally
- [Next.js Discussion #54907](https://github.com/vercel/next.js/discussions/54907) — nonce + static page incompatibility (community confirmation)
- [npm Overrides RFC](https://github.com/npm/rfcs/blob/main/accepted/0036-overrides.md) — override behavior (moot since `npm audit fix` handles all vulnerabilities directly)

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
