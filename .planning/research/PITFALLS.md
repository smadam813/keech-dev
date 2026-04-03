# Pitfalls Research

**Domain:** Hardening an existing Next.js 16 App Router portfolio/blog (CSP, testing, error boundaries, OG images, dependency upgrades, code deduplication)
**Researched:** 2026-04-02
**Confidence:** HIGH (pitfalls verified against official docs, GitHub issues, and current codebase analysis)

## Critical Pitfalls

### Pitfall 1: CSP Nonces Force Dynamic Rendering, Destroying Static Generation

**What goes wrong:**
The standard Next.js CSP approach uses nonces in middleware -- a unique random token per request added to `Content-Security-Policy` and applied to script tags. This requires every page to be dynamically rendered because a static page has no per-request context to generate nonces. Enabling nonce-based CSP converts the entire site from static to dynamic, killing the core performance advantage of a portfolio site and breaking `generateStaticParams()`.

**Why it happens:**
The official Next.js CSP docs show nonce-based middleware as the primary approach. Developers follow this path without realizing it is incompatible with `output: 'export'` or static generation. The site currently generates all content pages statically via `generateStaticParams()`.

**How to avoid:**
Use header-based CSP in `next.config.ts` `headers()` function with hash-based allowlisting instead of nonces. For this project specifically:
- Set CSP via `next.config.ts` `headers()` -- these apply to static pages without dynamic rendering
- Use `'unsafe-eval'` in `script-src` because `new Function()` in MDX execution requires it (there is no workaround short of replacing the MDX execution model)
- Use `'unsafe-inline'` in `style-src` because Tailwind CSS v4 may inject inline styles
- Whitelist Vercel Analytics domains explicitly in `script-src` and `connect-src`
- Start with `Content-Security-Policy-Report-Only` to validate before enforcing

**Warning signs:**
- Pages that were static now show `x-nextjs-cache: MISS` on every request
- Build output changes from "Static" to "Dynamic" in the Next.js build summary
- TTFB increases from ~50ms to ~200ms+ on Vercel

**Phase to address:**
Security hardening phase (first phase) -- CSP headers are the highest-risk item and should be tackled early with `Report-Only` mode to surface breakage before enforcing.

---

### Pitfall 2: CSP Breaks Vercel Analytics, Inline Styles, or MDX Execution

**What goes wrong:**
A strict CSP blocks three things this site depends on: (1) `new Function()` for MDX rendering fails without `'unsafe-eval'`, turning every blog post into a white screen; (2) Vercel Analytics script fails to load if its domains are not allowlisted; (3) Tailwind CSS v4's runtime behavior or any inline styles break without `'unsafe-inline'` or proper hashing in `style-src`.

**Why it happens:**
CSP is deployed in enforcing mode without testing against every page type. The developer tests the homepage (no MDX, no analytics widget visible), sees no errors, and ships. Blog posts crash, analytics silently stop collecting, and style regressions appear on pages with dynamic class application.

**How to avoid:**
1. Deploy CSP as `Content-Security-Policy-Report-Only` first -- this logs violations to the browser console without blocking anything
2. Test every page type: homepage, blog listing, single blog post (MDX execution), project listing, project detail, about page, 404 page
3. Check the browser console for CSP violation reports on each page
4. Required directives for this site:
   - `script-src 'self' 'unsafe-eval' https://va.vercel-scripts.com` (MDX + Vercel Analytics)
   - `style-src 'self' 'unsafe-inline'` (Tailwind CSS v4 inline styles)
   - `connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com` (Analytics data reporting)
   - `img-src 'self' data: blob:` (Next.js Image optimization)
   - `font-src 'self'` (Norse + Inter WOFF2 fonts)
5. Only switch from `Report-Only` to enforcing after a full verification pass

**Warning signs:**
- Blog posts render blank (MDX execution blocked)
- Vercel Analytics dashboard shows zero traffic after deploy
- Styles appear broken or elements unstyled on specific pages
- Console shows `Refused to evaluate a string as JavaScript` errors

**Phase to address:**
Security hardening phase -- deploy `Report-Only` first, enforce in a follow-up commit after verification.

---

### Pitfall 3: Error Boundaries That Swallow MDX Errors or Break Layout

**What goes wrong:**
Adding `error.tsx` at the wrong level either (a) catches MDX rendering errors but replaces the entire page including header/footer with a generic error screen, or (b) catches layout-level errors and creates an infinite error loop. The `global-error.tsx` file replaces the entire HTML document including `<html>` and `<body>` tags, which means the site's header, footer, fonts, and styles disappear when it triggers.

**Why it happens:**
Developers add `error.tsx` at `src/app/error.tsx` thinking it catches all errors gracefully. But `error.tsx` in a segment does NOT catch errors from `layout.tsx` in the same segment -- it only catches errors from `page.tsx` and child components. For root layout errors, you need `global-error.tsx`, which must include its own `<html>` and `<body>` tags and cannot use the root layout's fonts or styles.

**How to avoid:**
1. Add `error.tsx` at `src/app/blog/[slug]/error.tsx` specifically for MDX rendering errors -- this preserves the root layout (header, footer, fonts)
2. Add `error.tsx` at `src/app/error.tsx` as a general fallback -- preserves root layout
3. Add `global-error.tsx` at `src/app/global-error.tsx` only as a last-resort -- must duplicate font loading and basic styles since root layout is bypassed
4. The blog slug error boundary should offer a "return to blog" link, not just "try again" (retrying broken MDX will always fail)
5. Error boundaries are client components -- do not attempt to use `generateMetadata` or server-only APIs in them

**Warning signs:**
- Error page shows without any styling, fonts, or navigation
- "Try again" button on error page re-triggers the same error infinitely
- Error in root layout crashes to browser default error page
- Build errors masquerade as runtime errors during static generation

**Phase to address:**
Error resilience phase (early) -- error boundaries should be in place before adding features that might break (dependency upgrades, refactoring).

---

### Pitfall 4: Vitest Cannot Resolve `@/.velite` Imports Without Explicit Alias

**What goes wrong:**
Tests that import any module which transitively imports from `@/.velite` (the generated Velite content collections) fail with `Cannot find module '@/.velite'` or similar resolution errors. The `.velite/` directory only exists after running `velite` build, and `vite-tsconfig-paths` may not resolve the `@/.velite` alias correctly since it maps to a gitignored build artifact outside `src/`.

**Why it happens:**
The `@/.velite` path alias is unusual -- it maps to `./.velite` (project root, outside `src/`), which is a generated directory that does not exist until `velite` runs. `vite-tsconfig-paths` reads `tsconfig.json` paths but the `.velite/` directory may not exist in CI or fresh clones until the build step runs. Tests importing components that depend on post/project collections will fail.

**How to avoid:**
1. Add explicit alias in `vitest.config.ts`: `resolve: { alias: { '@/.velite': path.resolve(__dirname, '.velite') } }`
2. Create a `.velite/__mocks__` or test fixture that provides mock post/project data, so tests do not depend on real Velite output
3. Run `npm run velite` as a `globalSetup` in Vitest config if testing against real content
4. For unit tests of pure functions (`src/lib/views.ts`, `src/lib/rune-glows.ts`), structure tests to avoid transitive Velite imports entirely
5. Add `npm run velite` to the CI pipeline before `vitest run`

**Warning signs:**
- Tests pass locally (where `.velite/` exists from dev) but fail in CI
- `Module not found` errors referencing `.velite` paths
- Mysterious test failures after `git clean` or fresh clone

**Phase to address:**
Testing setup phase -- the Vitest configuration must handle Velite aliases from day one or every test that touches content-dependent code will fail.

---

### Pitfall 5: OG Image Generation Exceeds Edge Runtime Limits or Blocks Static Pages

**What goes wrong:**
Dynamic OG images via `opengraph-image.tsx` use the `ImageResponse` API (based on Satori), which has a 500KB bundle size limit including fonts. Loading the Norse custom font (WOFF2) into the OG image generator can exceed this limit. Additionally, if `opengraph-image.tsx` uses Node.js APIs (like `fs.readFileSync` for fonts) but the corresponding page uses edge runtime, the image route breaks with cryptic import errors.

**Why it happens:**
Developers load multiple font weights/styles or large font files into the OG image generator. The Norse display font may be too large for the edge runtime bundle limit. Alternatively, developers use `fs.readFileSync` to load fonts (common in tutorials) which fails on edge runtime.

**How to avoid:**
1. Use `fetch()` with `new URL('./font.woff2', import.meta.url)` to load fonts -- works in both Node and Edge runtimes
2. Keep font file size under 200KB for OG images -- use a single weight of Inter for body text in OG images, skip Norse if it pushes over the limit
3. Test OG images with `curl http://localhost:3000/blog/your-slug/opengraph-image` during development
4. For blog posts, pass only `title`, `description`, and `date` to the OG template -- do not try to render MDX content in the image
5. Consider using Node.js runtime explicitly (`export const runtime = 'nodejs'`) if edge constraints are too tight -- this is fine for a portfolio site with low traffic

**Warning signs:**
- OG images work locally but fail on Vercel deployment
- Build error mentioning bundle size exceeded
- Social media previews show broken image icons
- OG image endpoint returns 500 or takes >5 seconds

**Phase to address:**
SEO/branding phase -- OG images should be added after error boundaries are in place so failures degrade gracefully.

---

### Pitfall 6: Dependency Upgrades Break Build in Cascading Ways

**What goes wrong:**
Upgrading Shiki v3 to v4, `@vercel/analytics` v1 to v2, and Next.js simultaneously creates a debugging nightmare. If the build breaks, you cannot tell which upgrade caused it. Shiki v4 may change how `rehype-pretty-code` generates HTML, breaking the `CodeBlock` component's `<pre>` override. `@vercel/analytics` v2 changes the import path or initialization pattern. A Next.js patch may change CSP behavior or static generation semantics.

**Why it happens:**
Developers batch all dependency updates into one commit to "get it over with." When the build breaks, they face multiple interacting changes and cannot bisect the failure.

**How to avoid:**
1. Upgrade one dependency at a time, verify build + visual check between each
2. Order: Next.js patch first (fixes security vulns), then Tailwind CSS minor, then Shiki major, then `@vercel/analytics` major
3. For Shiki v4: the breaking changes are minor (typo corrections in API names) but verify `rehype-pretty-code` compatibility -- it may need its own update to support Shiki v4
4. For `@vercel/analytics` v2: check if the import path changes from `@vercel/analytics/next` to something else, and test that the `<Analytics />` component still works
5. Pin Velite at `0.3.1` -- do not upgrade a pre-release 0.x dependency during a hardening milestone
6. Run `npm run build` after each individual upgrade, not just `npm run dev`

**Warning signs:**
- Build succeeds but code blocks render without syntax highlighting
- Build succeeds but Vercel Analytics stops collecting data (silent failure)
- TypeScript errors in files you did not touch
- `npm audit` shows new vulnerabilities introduced by updated transitive dependencies

**Phase to address:**
Dependency cleanup phase (late in milestone) -- upgrades should be the last thing done, after tests are in place to catch regressions.

---

### Pitfall 7: Code Deduplication Introduces Subtle Behavioral Regressions

**What goes wrong:**
Extracting a shared `useFilteredList` hook from `FilteredPostList` and `FilteredProjectList` introduces subtle differences in URL parameter handling, filter chip rendering, or transition timing. The two components look 90% identical but the 10% difference (different card components, different filter keys like `tags` vs `stack`, different sort logic) means the abstraction either leaks or forces awkward parameterization.

**Why it happens:**
The components genuinely share structure, so deduplication feels obvious. But the abstraction boundary is drawn wrong -- either too much is extracted (forcing collection-specific logic into generic callbacks) or too little (the hook handles URL state but the component still duplicates animation/transition logic). Without tests, the regression is caught only by manual visual inspection.

**How to avoid:**
1. Write tests for current behavior BEFORE refactoring -- capture URL state management, filter logic, transition behavior, and empty state rendering for both blog and projects
2. Extract the `useFilteredList` hook first (URL state + filter logic), keep rendering in separate components
3. Do NOT extract a shared `FilteredListLayout` component -- the rendering differences (PostCard vs ProjectCard, tag chip vs tech badge) make a shared layout fragile
4. Verify after extraction: URL filter persistence, browser back/forward with filters, "clear filters" behavior, "Showing X of Y" count accuracy, fade transition timing
5. Extract localStorage helpers and date formatting BEFORE the filtered list refactor -- these are low-risk and reduce noise in the larger refactor

**Warning signs:**
- Filters work on blog but break on projects (or vice versa) after refactoring
- URL parameters use wrong key names (`tags` vs `stack` confusion)
- Transition animation plays on initial page load (the `useRef` initial-render guard gets lost in extraction)
- "Showing X of Y" count is wrong after clearing filters

**Phase to address:**
Code quality phase (middle of milestone) -- deduplication should happen after tests are in place and before dependency upgrades, so regressions are caught immediately.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `'unsafe-eval'` in CSP for MDX | MDX rendering works without rearchitecting | Weakens CSP, any future XSS can escalate to arbitrary code execution | Acceptable for now -- replacing `new Function()` requires migrating to `next-mdx-remote` or similar, which is out of scope for a hardening milestone |
| `'unsafe-inline'` in `style-src` | Tailwind CSS v4 works without style hashing | Inline style injection attacks possible | Acceptable -- Tailwind v4 CSS-first config may inject inline styles; hashing every style is impractical |
| Skipping Playwright E2E tests | Faster test setup, focus on unit tests | Mobile menu, copy button, scroll reveal remain untested | Acceptable for v1.6 MVP -- add E2E in a future milestone when behavior is stable |
| Keeping `FilteredPostList` and `FilteredProjectList` separate | Zero regression risk, no refactoring needed | 150 lines of duplication remain | Never -- the duplication is a real maintenance burden and should be addressed, but only with tests in place first |
| Pinning Velite at 0.3.1 | Avoids 0.x breaking changes during hardening | Falling behind on Velite improvements | Acceptable until Velite reaches 1.0 or a needed feature requires upgrade |

## Integration Gotchas

Common mistakes when connecting to external services or integrating new features.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| CSP + Vercel Analytics | Forgetting `connect-src` for analytics data reporting -- script loads but data fails to send silently | Allowlist both `script-src` (script loading) and `connect-src` (data beacons) for Vercel Analytics domains |
| @upstash/ratelimit in middleware | Declaring the `Ratelimit` instance inside the middleware handler -- ephemeral cache resets on every invocation | Declare `Ratelimit` instance at module scope so the ephemeral cache persists while the edge function is warm |
| @upstash/ratelimit + static pages | Applying rate limiting middleware to all routes, including static assets and pages | Use `matcher` config in middleware to only apply rate limiting to `/api/*` routes |
| Vitest + Velite | Running tests without building Velite first -- `.velite/` directory missing | Add `velite` as a `globalSetup` step or mock the `@/.velite` import in test config |
| OG images + custom fonts | Using `fs.readFileSync` for font loading (Node.js only) | Use `fetch(new URL('./font.woff2', import.meta.url))` which works in both Node and Edge runtimes |
| Error boundaries + static generation | Expecting `error.tsx` to catch build-time static generation errors | `error.tsx` only catches runtime client-side errors -- build failures surface as build errors, not error boundaries |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rate limiting with per-request Redis calls | Every API request makes a Redis roundtrip even if the user is not rate-limited | Use `@upstash/ratelimit` ephemeral cache (module-scope instance) to skip Redis for repeated calls from same IP | At >100 concurrent requests; Redis latency adds 50-100ms per API call |
| OG image generation without caching | Every social media crawler hit regenerates the OG image from scratch | Set `revalidate` export or use ISR-style caching for OG image routes; Vercel CDN caches by default but verify | When a post goes viral and crawlers hit the OG endpoint hundreds of times |
| Loading all posts in OG image route | OG image route imports full `posts` collection just to find one post's title | Import only the needed post data, or pass title/description via search params | At 500+ posts; unnecessary memory allocation per OG image render |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| CSP allows `'unsafe-eval'` but no other restrictions | Attacker who achieves XSS can execute arbitrary JS via eval | Pair `'unsafe-eval'` with strict `default-src 'self'`, tight `connect-src`, `frame-ancestors 'none'`, and `object-src 'none'` to limit blast radius |
| Rate limiting only on POST, not GET for batch views endpoint | GET `/api/views?slugs=` accepts unbounded comma-separated slugs, enabling Redis abuse | Validate slug format with regex, limit batch size to 50 slugs max, apply rate limiting to all API routes |
| Slug parameters used directly in Redis key construction | Crafted slugs like `../../admin` or extremely long strings create unexpected Redis keys | Validate all slugs with `^[a-z0-9][a-z0-9-]*[a-z0-9]$` regex, max length 100 characters |
| Deploying CSP in enforcing mode without testing | Legitimate site functionality breaks silently for all visitors | Always deploy as `Content-Security-Policy-Report-Only` first, monitor for 24-48 hours, then enforce |

## UX Pitfalls

Common user experience mistakes when adding hardening features.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Error boundary shows "Something went wrong" with only a "Try again" button for MDX errors | MDX errors are deterministic -- retrying will always fail; user is stuck | Show "This post could not be loaded" with a link back to `/blog`, not a retry button |
| Loading skeleton for blog post shows shimmer where content will be | Blog posts are statically generated and load instantly; skeleton flashes for 0ms and creates visual noise | Only add `loading.tsx` to routes that actually have async data fetching; skip for fully static pages |
| Rate limit error returns generic 429 with no context | User sees a broken page or mysterious "Too Many Requests" error | Return a friendly JSON error with `retryAfter` header; client-side view counter should fail silently on 429 |
| OG image has tiny text or wrong aspect ratio | Social media preview looks unprofessional or text is unreadable | Design OG images at 1200x630 pixels (1.91:1 ratio); minimum font size 32px; test with Twitter Card Validator and Facebook Sharing Debugger |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **CSP headers:** Often missing `connect-src` for API/analytics beacons -- script loads but data fails silently. Verify analytics data appears in Vercel dashboard after CSP deploy.
- [ ] **CSP headers:** Often tested only on homepage -- verify on blog post pages (MDX eval), project pages (images), and 404 page.
- [ ] **Error boundaries:** Often missing `global-error.tsx` -- root layout errors crash to browser default. Verify by temporarily breaking the root layout in dev.
- [ ] **Error boundaries:** Often forget that error pages must include their own `<html>` and `<body>` tags in `global-error.tsx`. Test that fonts and basic styles appear on the global error page.
- [ ] **OG images:** Often tested only with direct URL access -- verify with actual social media preview tools (Twitter Card Validator, Facebook Sharing Debugger, LinkedIn Post Inspector).
- [ ] **OG images:** Often forget to set default OG image in root `layout.tsx` metadata -- pages without custom OG images show no preview.
- [ ] **Rate limiting:** Often tested only for blocking -- verify that legitimate single-visit users are never rate limited. Test the happy path, not just the block path.
- [ ] **Vitest setup:** Often works in IDE but fails in `npm test` -- verify the test command works from a clean terminal with no IDE extensions.
- [ ] **Deduplication refactor:** Often verified only with mouse interaction -- test keyboard navigation of filter chips, URL-preloaded filter state, and browser back/forward.
- [ ] **Dependency upgrades:** Often verified with `npm run dev` only -- run `npm run build && npm run start` to catch production-only issues (Turbopack dev vs webpack production differences).

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CSP breaks site in production | LOW | CSP was deployed as enforcing -- redeploy with `Report-Only` or remove the header entirely via `next.config.ts` change; Vercel deploys in <60 seconds |
| Error boundary swallows all errors | LOW | Error boundaries are additive files -- delete the problematic `error.tsx` and the parent segment handles errors instead |
| Vitest config breaks build | LOW | Vitest config is separate from Next.js config -- `vitest.config.ts` does not affect `npm run build`; fix at leisure |
| OG image breaks in production | MEDIUM | Social media caches OG images aggressively -- even after fixing, cached broken previews persist for hours/days. Use `?v=2` cache-bust param or social platform cache-clear tools |
| Deduplication regression in filters | MEDIUM | Git revert the extraction commit, re-add tests for the specific broken behavior, then re-attempt extraction |
| Shiki v4 breaks code highlighting | MEDIUM | Pin `rehype-pretty-code` and `shiki` back to working versions in `package.json`; verify with `npm run build` |
| Multiple simultaneous dependency breaks | HIGH | Cannot bisect -- must revert all upgrades and re-apply one at a time. This is why upgrades must be done individually. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CSP nonces destroy static generation | Security hardening (Phase 1) | Build output shows all pages as "Static" after CSP headers added |
| CSP breaks Vercel Analytics / MDX | Security hardening (Phase 1) | Deploy with `Report-Only`, check browser console on all page types, verify Vercel Analytics dashboard |
| Error boundaries break layout | Error resilience (Phase 2) | Navigate to each error page directly; verify header/footer/fonts present on segment error pages |
| Vitest cannot resolve `@/.velite` | Testing setup (Phase 2-3) | `npm test` passes in a fresh clone after `npm install && npm run velite` |
| OG images exceed edge limits | SEO/branding (Phase 3) | `curl` each OG image endpoint returns 200 with image content-type; test with social preview tools |
| Dependency upgrades cascade | Dependency cleanup (Phase 4, last) | Each upgrade is a separate commit; `npm run build` passes after each |
| Code deduplication regressions | Code quality (Phase 3, after tests) | Tests for filter behavior pass before AND after extraction; manual check of URL persistence + transitions |

## Sources

- [Next.js CSP Guide](https://nextjs.org/docs/pages/guides/content-security-policy) -- nonce approach requires dynamic rendering
- [Next.js Error Handling Docs](https://nextjs.org/docs/app/getting-started/error-handling) -- `error.tsx` does not catch layout errors
- [Next.js Vitest Setup Guide](https://nextjs.org/docs/app/guides/testing/vitest) -- `vite-tsconfig-paths` for alias resolution
- [Next.js OG Image Docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) -- 500KB bundle limit, font loading patterns
- [GitHub Issue #63015: CSP Broken in App Router](https://github.com/vercel/next.js/issues/63015) -- nonce application failures
- [GitHub Issue #62046: error.tsx not rendered for static routes](https://github.com/vercel/next.js/issues/62046) -- error boundaries and static generation
- [GitHub Discussion #72006: OG Image Loading Times](https://github.com/vercel/next.js/discussions/72006) -- performance optimization strategies
- [GitHub Discussion #72424: Vitest path alias docs](https://github.com/vercel/next.js/discussions/72424) -- `vite-tsconfig-paths` configuration
- [Shiki v4 Migration Guide](https://shiki.style/guide/migrate) -- breaking changes from v3
- [Shiki v4 Blog Post](https://shiki.style/blog/v4) -- Node.js 20+ requirement, API name corrections
- [Upstash Ratelimit Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) -- ephemeral cache pattern
- [Upstash Blog: Next.js Rate Limiting](https://upstash.com/blog/nextjs-ratelimiting) -- middleware implementation patterns
- [Vercel CSP Docs](https://vercel.com/docs/headers/security-headers) -- best practices, Report-Only recommendation
- [@vercel/analytics v2 Changelog](https://github.com/vercel/analytics/releases) -- resilient intake, license change
- [GitHub Issue #89754: Nonce CSP + cacheComponents](https://github.com/vercel/next.js/issues/89754) -- nonce incompatibility with caching

---
*Pitfalls research for: v1.6 Address Concerns -- hardening an existing Next.js 16 portfolio/blog*
*Researched: 2026-04-02*
