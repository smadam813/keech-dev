# Project Research Summary

**Project:** keech.dev v1.6 — Address Concerns
**Domain:** Next.js 16 App Router portfolio/blog hardening (security, quality, SEO, testing)
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

This milestone hardens an existing, production-quality Next.js 16 portfolio/blog against a documented set of concerns: missing security headers, unguarded MDX execution, absent error boundaries, no test infrastructure, SEO gaps (no OG images, no RSS, broken sitemap), and duplicated code across two filtered-list components. The existing stack (Next.js 16, React 19, Tailwind CSS v4, Velite, Upstash Redis, Vercel) is sound and unchanged — all work is additive hardening on top of a validated foundation. Only four new production dependencies are required: `@upstash/ratelimit`, `feed`, and the Vitest/Playwright testing stack.

The recommended approach is a security-first, quality-second, visibility-third sequence. Security headers and the MDX try-catch wrapper have the highest impact-to-effort ratio of anything in the milestone and should land first. Error boundaries and code deduplication come next as they reduce the blast radius of subsequent work. OG images, RSS, and the sitemap fix ship together as a cohesive SEO/branding phase. Testing infrastructure is deferred until after deduplication so tests cover the final code shape, not the pre-refactor shape. Dependency upgrades land last, individually, with a build verification between each.

The most significant architectural risk is CSP configuration. The nonce-based approach shown in Next.js docs requires dynamic rendering and is incompatible with this site's static generation model. The correct approach is header-based CSP via `next.config.ts` with `unsafe-eval` accepted as a necessary trade-off for `new Function()` MDX execution. All other risks are moderate and well-understood: OG image edge runtime font-size limits, Vitest's inability to resolve the `@/.velite` alias without explicit config, and the behavioral subtlety risk in the filtered-list hook extraction.

## Key Findings

### Recommended Stack

The existing stack requires no replacement. Four additions cover the full scope: `@upstash/ratelimit` (rate limiting using the already-present Redis instance), `feed` (TypeScript-native RSS/Atom generation), and the Vitest + Playwright test stack. All other v1.6 features — security headers, error boundaries, OG images, favicon, sitemap fix, loading states, input validation — use built-in Next.js capabilities with no new packages.

**Core new technologies:**
- `@upstash/ratelimit@^2.0.8`: API rate limiting — uses existing Redis instance, no new env vars, sliding window algorithm
- `feed@^5.2.0`: RSS/Atom/JSON feed generation — TypeScript-native, spec-compliant, preferred over older `rss` package
- `vitest@^4.1.2`: Unit/integration test runner — ESM-native, officially recommended by Next.js docs for App Router, requires Node ≥ 20
- `@playwright/test@^1.59.1`: E2E testing — required for browser-dependent behaviors (mobile menu, copy button, MDX rendering) that Vitest cannot cover
- `@testing-library/react@^16.3.2`: Component test utilities — v16+ supports React 19

**What NOT to add:** `helmet`, `next-safe`, `@vercel/og` (deprecated), `next-seo`, `jest`, `next-mdx-remote`. Do not upgrade `@vercel/analytics` v2 or Shiki v4 in this milestone — major version bumps belong in a separate maintenance pass.

### Expected Features

All features in scope are confirmed against research. No speculative capabilities were proposed.

**Must have (table stakes):**
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) — every production site needs these; scanners flag their absence
- MDX try-catch wrapper — `new Function()` crash produces a white screen with no recourse for visitors
- Error boundaries (`error.tsx`, `global-error.tsx`, `blog/[slug]/error.tsx`) — graceful failure at the right granularity
- Loading states (`loading.tsx`) — route transitions without feedback feel broken
- Favicon and apple-touch-icon — generic browser tab icon reads as unfinished
- OG images (default + per-post) — social shares without preview images get 50–80% fewer clicks
- Input validation on API routes — unsanitized user input in Redis key construction is a security smell
- Dependency patches (`npm audit fix`, Next.js patch) — CVE-2025-29927 middleware bypass is directly relevant
- Sitemap fix — `new Date()` on every build pollutes crawl signals
- Image `sizes` attributes — missing `sizes` with `fill` layout causes oversized downloads

**Should have (differentiators):**
- API rate limiting with `@upstash/ratelimit` — protects Redis quota, signals security awareness
- RSS feed at `/feed.xml` — developer audiences expect this
- Dynamic OG images per blog post — branded social cards per post
- Code deduplication (localStorage helpers, date formatting, filtered lists) — demonstrates engineering discipline
- Hero component refactor (extract `useRevealSequence`, `useGlowPositions` hooks) — reduces 5-state/5-effect complexity
- Keyboard-accessible copy button (`focus-visible:opacity-100`) — one-line fix with outsized a11y impact
- VoiceOver list fix (`role="list"`) — Safari VoiceOver semantics restoration
- Vitest + Playwright test infrastructure — zero tests means any change is a gamble

**Defer (not v1.6):**
- `@vercel/analytics` v2 migration — major version, separate milestone
- Shiki v4 migration — major version, separate milestone
- CSP without `unsafe-eval` — requires `next-mdx-remote` rearchitecture, out of scope
- Resume PDF — content creation concern, not a code concern
- Color validation script rebuild — fix the one wrong hex value only

### Architecture Approach

The v1.6 changes are additive: new files for error boundaries, loading states, OG images, RSS route, favicon, and middleware; modifications to `next.config.ts`, `mdx-content.tsx`, the two API routes, `sitemap.ts`, and `src/lib/views.ts`. The only new directory is `src/hooks/` for the extracted `useFilteredList` hook and `src/lib/rate-limit.ts` as a module-scope singleton for `@upstash/ratelimit`. No component architecture changes beyond the two filtered-list components consuming the shared hook.

**Major components and their v1.6 responsibilities:**
1. `next.config.ts` — gains `headers()` returning the full CSP + security header array; this is the correct mechanism for static-site security headers (not middleware)
2. `src/middleware.ts` (new) — applies rate limiting to `/api/views/*` routes only via `matcher` config; Ratelimit instance declared at module scope for ephemeral cache persistence
3. `src/app/error.tsx` + `global-error.tsx` + `blog/[slug]/error.tsx` (all new) — two-level error boundary hierarchy; blog-level boundary preserves layout, global-error handles root layout crashes and must include its own `<html>`/`<body>`
4. `src/app/opengraph-image.tsx` + `src/app/blog/[slug]/opengraph-image.tsx` (both new) — static PNG generation at build time via `generateStaticParams()`; uses `ImageResponse` from `next/og` with Norse font loaded via `fetch()`
5. `src/app/feed.xml/route.ts` (new) — RSS 2.0 feed from Velite `posts` collection; marked `force-static` for build-time pre-rendering
6. `src/hooks/use-filtered-list.ts` (new) — generic hook over URL state, filter logic, and transitions; consuming components shrink from ~150 lines to ~40 lines of rendering

### Critical Pitfalls

1. **CSP nonces destroy static generation** — The official Next.js CSP docs show nonce-based middleware as the primary approach, but nonces require dynamic rendering, which kills `generateStaticParams()`. Use `next.config.ts` `headers()` with static CSP instead. Deploy as `Content-Security-Policy-Report-Only` first, verify on every page type (especially blog posts where `new Function()` requires `unsafe-eval`), then enforce.

2. **CSP silently breaks Vercel Analytics** — `connect-src` is frequently omitted from CSP, causing analytics scripts to load but data beacons to fail silently. Vercel Analytics requires allowlisting in both `script-src` and `connect-src`. Verify the Vercel Analytics dashboard shows data after the CSP deploy.

3. **Error boundary hierarchy mistakes** — `error.tsx` does not catch errors from `layout.tsx` in its own segment; `global-error.tsx` is required for root layout errors and must include its own `<html>`/`<body>`. A blog-post error boundary that only offers "try again" is a poor UX — MDX rendering errors are deterministic and retrying will always fail. Offer a "return to blog" link instead.

4. **Vitest cannot resolve `@/.velite` without explicit alias** — The `.velite/` directory is gitignored and only exists after `velite` runs. Tests pass locally but fail in CI or after fresh clone. Add explicit `resolve.alias` in `vitest.config.ts` and either run `npm run velite` as a `globalSetup` step or mock `@/.velite` in test config. Structure unit tests of pure functions to avoid transitive Velite imports.

5. **OG images exceed edge runtime limits** — The `ImageResponse` API has a 500KB bundle size limit including fonts. Loading the Norse WOFF2 font may push over the limit. Use `fetch(new URL('./font.woff2', import.meta.url))` (not `fs.readFileSync`), test with `curl` against the OG endpoint, and fall back to Inter-only if Norse exceeds the budget.

## Implications for Roadmap

Based on research, the dependency graph and pitfall-phase mapping strongly suggest a 4-phase structure.

### Phase 1: Security + Patches

**Rationale:** Highest impact-to-effort ratio. Security headers and the MDX try-catch wrapper are standalone changes with no dependencies. Dependency patches reduce CVE exposure and eliminate `npm audit` noise from subsequent phases. Input validation and rate limiting harden the same API surface and belong together. This phase has no new dependencies except `@upstash/ratelimit`.

**Delivers:** CSP headers (Report-Only first, then enforcing), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, MDX try-catch fallback UI, slug regex validation on both API routes, batch size cap, sliding window rate limiting on `/api/views/*`, and patched dependencies.

**Features addressed:** Security headers, MDX try-catch, input validation, rate limiting, dependency patches.

**Critical pitfall to avoid:** Do not use nonce-based CSP middleware — it destroys static generation. Test CSP in Report-Only mode on every page type before switching to enforcing. Declare the `Ratelimit` instance at module scope (not inside the handler).

### Phase 2: Resilience + Code Quality

**Rationale:** Error boundaries and loading states are independently deployable and reduce risk for all subsequent phases. Code deduplication should precede test infrastructure so tests cover the final, deduplicated code shape. Hero refactor and a11y fixes are low-risk and round out the quality pass.

**Delivers:** `error.tsx` (global), `global-error.tsx`, `blog/[slug]/error.tsx` with navigation-away UX, `loading.tsx` skeleton, `src/lib/views.ts` expanded with localStorage helpers, `src/lib/format.ts` with `formatDate()`, `useFilteredList` hook with both consuming components updated, Hero hook extraction, copy button keyboard fix, VoiceOver list fix.

**Features addressed:** Error boundaries, loading states, code deduplication, hero refactor, keyboard copy button, VoiceOver fix.

**Critical pitfall to avoid:** Extract the `useFilteredList` hook only (URL state + filter logic) — do not extract a shared rendering layout component. The rendering differences between PostCard and ProjectCard make a shared layout fragile. Verify URL filter persistence, browser back/forward, and fade transition timing after extraction.

### Phase 3: SEO + Branding

**Rationale:** OG images depend on a stable error boundary layer (if OG generation fails during build, error boundaries provide development feedback). Favicon should precede OG images as the brand asset informs OG template design. RSS and sitemap fix are low-complexity, high-value and group naturally with the SEO pass.

**Delivers:** Favicon (`.ico` + `.svg` + apple-touch-icon), default site OG image at 1200x630, per-post dynamic OG images generated at build time, sitemap with accurate dates, RSS feed at `/feed.xml`, and `sizes` attributes on project images.

**Features addressed:** Favicon, default OG image, per-post OG images, sitemap fix, RSS feed, image `sizes`.

**Critical pitfall to avoid:** Export `generateStaticParams()` from `opengraph-image.tsx` to ensure images are pre-generated at build time (not on-demand). Load the Norse font via `fetch()` not `fs.readFileSync`. Test OG images with Twitter Card Validator and Facebook Sharing Debugger, not just direct URL access. Set a default OG image in root `layout.tsx` metadata for pages without custom OG images.

### Phase 4: Testing Infrastructure

**Rationale:** Testing comes last because it should cover the final, stable code shape after all deduplication and refactoring is complete. Tests written before deduplication would need to be rewritten. Playwright E2E is intentionally narrow — only browser-dependent behaviors that Vitest cannot cover (mobile menu, copy button, view counter increment).

**Delivers:** `vitest.config.mts` with `@/.velite` alias resolution, Vitest unit tests for pure functions (`formatDate`, `formatViewCount`, `computeGlowPositions`, slug validation regex), Playwright config targeting Chromium only, targeted E2E tests for mobile menu toggle, copy button clipboard, and view count increment.

**Features addressed:** Vitest setup + priority unit tests, Playwright setup + targeted E2E.

**Critical pitfall to avoid:** Configure the `@/.velite` alias in `vitest.config.ts` on day one. Run `npm run velite` before `vitest run` in CI. Do not attempt to unit-test the full MDX rendering pipeline with Vitest — use Playwright for that. Skip visual regression testing (high maintenance, diminishing returns for a personal site).

### Phase Ordering Rationale

- Security first because headers and the MDX try-catch are the highest-impact/lowest-risk changes in the milestone and are entirely independent of everything else
- Deduplication before testing because tests should validate the final code shape, not a pre-refactor shape that is about to change
- Error boundaries before OG images because build-time OG generation failures surface more clearly when error boundaries are already in place during development
- Rate limiting (with its new dependency) before testing so the dependency is stable before tests are written around it
- Dependency upgrades deferred entirely to a future milestone — the research was clear that mixing 20+ hardening concerns with major version bumps creates compound debugging risk

### Research Flags

Phases with well-documented patterns — skip additional research during planning:
- **Phase 1 (Security + Patches):** CSP header configuration is exhaustively documented. The specific directives needed are confirmed by research. Implementation is mechanical.
- **Phase 2 (Resilience + Code Quality):** Error boundary file conventions are stable Next.js App Router behavior. Hook extraction is pure TypeScript refactoring with no external dependencies.
- **Phase 4 (Testing):** Vitest + Playwright setup is well-documented. The `@/.velite` alias pitfall is identified and the fix is known.

Phases that may benefit from targeted research during planning:
- **Phase 3 (SEO + Branding):** OG image font loading behavior at the edge runtime boundary warrants a quick verification pass when Norse font file size is known. If the font exceeds the 500KB Satori bundle limit, the fallback strategy (Inter-only for OG images) needs a design decision.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against official Next.js docs, package repositories, and official Upstash documentation. Version compatibility confirmed. |
| Features | HIGH | Features map directly to documented concerns from the v1.6 planning context. No speculative capabilities. Prioritization matrix is grounded in effort estimates. |
| Architecture | HIGH | Implementation patterns drawn from official Next.js file conventions and API references. Build order rationale is dependency-graph-based, not opinion-based. |
| Pitfalls | HIGH | Pitfalls verified against official docs, GitHub issues (including specific issue numbers), and current codebase analysis. Recovery strategies are concrete. |

**Overall confidence:** HIGH

### Gaps to Address

- **Norse font size for OG images:** The actual WOFF2 file size of the Norse custom font is unknown. If it exceeds ~300KB, it may push Satori's 500KB bundle limit when combined with the image generation code. Measure during Phase 3 implementation and decide between Norse or Inter-only for OG image branding.

- **CSP enforcement timing:** Research recommends deploying `Content-Security-Policy-Report-Only` first, then enforcing in a follow-up commit. The roadmap should plan for two commits per the CSP feature: one Report-Only deploy, one enforcing deploy after verification. This is a workflow consideration, not a technical gap.

- **Vitest async server component limitation:** Async server components (the blog post page, project detail page) cannot be unit-tested with Vitest. The scope of Playwright E2E coverage for server-rendered content is a judgment call — research recommends keeping it narrow (MDX rendering, mobile menu, copy button). The exact E2E test count will be determined during implementation.

## Sources

### Primary (HIGH confidence)
- [Next.js Content Security Policy Guide](https://nextjs.org/docs/app/guides/content-security-policy) — nonce approach incompatibility with static generation
- [Next.js Error Handling Docs](https://nextjs.org/docs/app/getting-started/error-handling) — error boundary file conventions
- [Next.js error.js File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/error) — client component requirement, reset behavior
- [Next.js opengraph-image Convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — file-based OG image wiring
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response) — Satori bundle limits, font loading
- [Next.js Vitest Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest) — official setup, alias resolution
- [Next.js headers() Config Reference](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers) — static header application
- [Upstash Ratelimit Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) — sliding window, ephemeral cache pattern
- [@upstash/ratelimit GitHub](https://github.com/upstash/ratelimit-js) — middleware integration examples
- [Vitest 4.0 Announcement](https://vitest.dev/blog/vitest-4) — breaking changes, Node ≥ 20 requirement
- [feed npm package](https://github.com/jpmonette/feed) — RSS/Atom/JSON generation API
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) — v1.59 current stable

### Secondary (MEDIUM confidence)
- [GitHub Issue #63015: CSP Broken in App Router](https://github.com/vercel/next.js/issues/63015) — nonce application failures
- [GitHub Issue #62046: error.tsx not rendered for static routes](https://github.com/vercel/next.js/issues/62046) — error boundary static generation behavior
- [GitHub Discussion #72424: Vitest path alias docs](https://github.com/vercel/next.js/discussions/72424) — `vite-tsconfig-paths` configuration
- [CVE-2025-29927 Next.js Middleware Bypass](https://blogs.jsmon.sh/cve-2025-29927-explained-the-next-js-middleware-authorization-bypass/) — relevance to dependency patching
- [Dynamic OG Images with Next.js 16 (MakerKit)](https://makerkit.dev/blog/tutorials/dynamic-og-image) — font loading patterns
- [Upstash Blog: Next.js Rate Limiting](https://upstash.com/blog/nextjs-ratelimiting) — middleware implementation patterns
- [Vercel CSP Docs](https://vercel.com/docs/headers/security-headers) — Report-Only recommendation

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
