# Feature Research

**Domain:** Next.js 16 portfolio/blog hardening (security, quality, SEO, accessibility, testing)
**Researched:** 2026-04-02
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any production-quality Next.js site should have. Missing these signals an unfinished project.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | Every production site needs these; scanners flag their absence | LOW | Add `headers()` to `next.config.ts`. CSP needs `unsafe-eval` due to `new Function()` MDX pattern -- document this tradeoff. No middleware needed for static headers. |
| MDX try-catch wrapper | `new Function()` crash = white screen for visitors | LOW | Wrap in try-catch with fallback UI in `mdx-content.tsx`. Pure defensive coding, no dependencies. |
| Favicon and apple-touch-icon | Generic browser tab icon = amateur hour | LOW | Add `.ico` + `.svg` + apple-touch-icon to `public/`. Can also use Next.js `icon.tsx` for generated icons. |
| OG images (default + per-post) | Social shares without preview images get 50-80% fewer clicks | MEDIUM | Use `opengraph-image.tsx` with `ImageResponse` (Satori). Place at `app/opengraph-image.tsx` for default, `app/blog/[slug]/opengraph-image.tsx` for per-post. 1200x630px. Can use `generateStaticParams` for build-time generation. |
| Error boundaries (`error.tsx`) | White screen on error is unacceptable in production | LOW | Add `app/error.tsx` (global) and `app/blog/[slug]/error.tsx` (MDX-specific). Must be client components. Include reset button for retry. `global-error.tsx` catches layout errors. |
| Loading states (`loading.tsx`) | Route transitions without feedback feel broken | LOW | Add `loading.tsx` with skeleton UIs matching content dimensions. Prevents CLS during navigation. |
| Input validation on API routes | Unsanitized user input in Redis keys is a security smell | LOW | Regex validate slugs (`^[a-z0-9-]+$`), cap batch size. Pure validation logic, no new deps. |
| Dependency patches (npm audit) | Known vulnerabilities in production deps = liability | LOW | `npm audit fix`, update Next.js to latest patch. CVE-2025-29927 middleware bypass is particularly relevant. |
| Sitemap accuracy | `new Date()` on every build pollutes crawl signals | LOW | Replace `new Date()` with fixed dates or most-recent-content dates. Use `project.updated ?? project.date` for projects. |
| `sizes` attribute on images | Missing `sizes` with `fill` layout = browser downloads oversized images | LOW | Add appropriate `sizes` strings to project card and detail images. No new deps. |

### Differentiators (Competitive Advantage)

Features that elevate the site from "works" to "polished professional portfolio."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| RSS feed (`/feed.xml`) | Developer audiences expect RSS; signals you care about the craft | LOW | Create `app/feed.xml/route.ts` returning XML. Use the `feed` npm package (more maintained than `rss`). Import posts from `@/.velite`, filter non-drafts, generate Atom/RSS. One new dependency. |
| Dynamic OG images per blog post | Each shared post gets a branded card with title, date, site identity | MEDIUM | `app/blog/[slug]/opengraph-image.tsx` using `ImageResponse`. Load Norse font via `fetch` + `fs.readFile` (build-time with `generateStaticParams`). Style to match neobrutalist brand (dusty rose bg, hard shadows, teal accents). |
| API rate limiting | Protects Redis quota from abuse; shows security awareness | LOW | `@upstash/ratelimit` sliding window. Already using `@upstash/redis` so same env vars. Apply in route handler directly (no middleware needed for single endpoint). |
| Code deduplication (localStorage helpers, date formatting, filtered lists, chips) | Demonstrates engineering discipline; reduces maintenance surface | MEDIUM | Extract `src/lib/views.ts` (cache helpers), `src/lib/format.ts` (date), `useFilteredList` hook or `FilteredListLayout` wrapper, shared toggle chip component. No new deps. |
| Mobile table of contents | Long posts on mobile with no section nav = poor reading UX | MEDIUM | Collapsible `<details>`/`<summary>` or sticky bottom sheet. Needs `'use client'` for expand/collapse. Must be keyboard accessible (Space/Enter), announce state to screen readers via `aria-expanded`. |
| Hero component refactor | Reduces cognitive load for future maintenance; 5 states + 5 effects is high | MEDIUM | Extract `useRevealSequence` hook (animation orchestration) and `useGlowPositions` hook (ResizeObserver). No behavior change, pure refactor. |
| Vitest + Playwright setup | Zero tests = any change is a gamble; test infra is table stakes for serious projects | MEDIUM | Vitest for unit/component tests (pure functions, synchronous components). Playwright for E2E (mobile menu, copy button, scroll reveal, MDX rendering). Async server components are NOT testable with Vitest -- use Playwright. |
| Keyboard-discoverable copy button | `focus-visible:opacity-100` is a one-line fix that shows a11y awareness | LOW | Add `focus-visible:opacity-100` to copy button classes. Minimal effort, outsized a11y improvement. |
| VoiceOver list fix | Safari VoiceOver drops list semantics with `list-style: none` | LOW | Add `role="list"` to MDX `<ul>` override in `mdx-content.tsx`. One-line fix. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| CSP without `unsafe-eval` | Strictest security posture | Requires replacing `new Function()` MDX execution entirely -- scope creep into content pipeline rewrite. `next-mdx-remote` or `@next/mdx` are different architectures. | Accept `unsafe-eval` in CSP for now. Document as future improvement. The MDX is author-controlled, version-controlled content. |
| Middleware-based CSP with nonces | "Best practice" per Next.js docs | Nonce-based CSP adds middleware complexity, is overkill for a static site with no user-generated content, and every page render needs a fresh nonce which conflicts with static generation. | Use static CSP headers via `next.config.ts` `headers()`. Simpler, works with static generation. |
| Comprehensive E2E test suite | "Test everything" mentality | Diminishing returns for a personal portfolio. Playwright tests are slow, flaky, and high-maintenance. | Targeted E2E: mobile menu toggle, copy button clipboard, view count increment. Unit tests for pure functions. Skip visual regression. |
| `@vercel/analytics` v2 + Shiki v4 major upgrades | "Always be on latest" | Major version bumps with breaking API changes. Mixing with 20+ other concerns creates compound risk. | Defer to a separate maintenance milestone. Update Next.js and Tailwind (patch/minor) only in v1.6. |
| Color validation script overhaul | Script has wrong color values | Over-engineering a dev tool. Script is run manually, not in CI. | Fix the one wrong hex value. Do not rebuild as a CSS-parser or shared config system. |
| Resume PDF upload | Placeholder button exists | Out of scope -- requires actual content creation, not a code concern | Remove the disabled button or replace with a simple "Email me for my resume" link |

## Feature Dependencies

```
[Security Headers]
    (no dependencies, standalone)

[MDX Try-Catch]
    (no dependencies, standalone)
    └──enables──> [Error Boundaries] (try-catch provides graceful MDX fallback that error boundary can catch)

[Error Boundaries]
    └──enhances──> [MDX Try-Catch] (catches any remaining uncaught errors)
    └──enhances──> [Loading States] (both improve resilience, natural to ship together)

[Favicon]
    └──enables──> [OG Images] (design assets needed for OG match favicon branding)

[OG Images - Default]
    └──enables──> [OG Images - Per Post] (default is simpler, per-post builds on same pattern)

[Input Validation]
    └──enhances──> [Rate Limiting] (validate first, then rate-limit; ship together for API hardening)

[Code Dedup: localStorage helpers]
    └──enables──> [Vitest Unit Tests] (deduplicated code has single test target)

[Code Dedup: date formatting]
    └──enables──> [Vitest Unit Tests] (formatDate is ideal first test target)

[Code Dedup: filtered lists]
    └──enables──> [Vitest Unit Tests] (hook is testable in isolation)

[Vitest Setup]
    └──enables──> [Priority Unit Tests] (infra before tests)
    └──enables──> [Playwright Setup] (often configured together)

[npm audit fix + Next.js patch]
    (no dependencies, do first -- reduces noise)
```

### Dependency Notes

- **OG Images require Favicon first:** The OG image design should incorporate the site's favicon/brand mark. Design the favicon, then use the same assets in OG templates.
- **Code Dedup enables Testing:** Extracting shared logic into `src/lib/` creates clean, isolated functions that are the ideal first test targets for Vitest.
- **Input Validation + Rate Limiting ship together:** Both harden the same API routes. Applying one without the other leaves a gap.
- **Error Boundaries + MDX Try-Catch are complementary:** Try-catch prevents the crash; error boundary catches anything that slips through. Both address the same critical concern.
- **Dependency patches should land first:** Reduces `npm audit` noise and ensures subsequent work builds on patched dependencies.

## MVP Definition

### Phase 1: Security + Patches (Foundation)

- [x] `npm audit fix` + Next.js patch update -- removes known vulnerabilities
- [x] Security headers via `next.config.ts` `headers()` -- CSP with `unsafe-eval`, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [x] MDX try-catch wrapper -- prevents white screen on malformed MDX
- [x] API input validation (slug regex, batch size cap) -- sanitizes Redis key construction
- [x] API rate limiting with `@upstash/ratelimit` -- protects Redis quota

### Phase 2: Error Resilience + Quality (Stability)

- [x] Error boundaries (`error.tsx`, `global-error.tsx`) -- graceful failure
- [x] Loading states (`loading.tsx`) -- feedback during navigation
- [x] Code deduplication (localStorage helpers, date formatting, filtered lists, chip components) -- maintainability
- [x] Hero component refactor (extract hooks) -- reduce complexity
- [x] Copy button `focus-visible:opacity-100` -- keyboard accessibility
- [x] VoiceOver list `role="list"` fix -- screen reader accessibility

### Phase 3: SEO + Branding (Visibility)

- [x] Favicon + apple-touch-icon -- brand presence in browser tabs
- [x] Default OG image (`app/opengraph-image.tsx`) -- social sharing baseline
- [x] Per-post OG images (`app/blog/[slug]/opengraph-image.tsx`) -- branded social cards
- [x] Sitemap fix (static dates, project dates) -- crawl signal accuracy
- [x] RSS feed (`/feed.xml`) -- content discoverability
- [x] Image `sizes` attributes -- performance optimization

### Phase 4: Accessibility + Testing (Polish)

- [x] Mobile table of contents -- navigation for long posts on mobile
- [x] Vitest setup + priority unit tests (format helpers, rune-glows, views lib) -- regression safety
- [x] Playwright setup + targeted E2E (mobile menu, copy button, view counter) -- integration confidence

### Deferred (Not v1.6)

- [ ] `@vercel/analytics` v2 migration -- major version, separate milestone
- [ ] Shiki v4 migration -- major version, separate milestone
- [ ] CSP without `unsafe-eval` -- requires MDX execution rearchitecture
- [ ] Resume PDF -- content creation, not a code concern
- [ ] Color validation script rebuild -- fix the hex value, do not over-engineer

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Security headers | HIGH | LOW | P1 |
| MDX try-catch | HIGH | LOW | P1 |
| Dependency patches | HIGH | LOW | P1 |
| Input validation | HIGH | LOW | P1 |
| Rate limiting | HIGH | LOW | P1 |
| Error boundaries | HIGH | LOW | P1 |
| Loading states | MEDIUM | LOW | P1 |
| Favicon | HIGH | LOW | P1 |
| OG images (default) | HIGH | MEDIUM | P1 |
| OG images (per-post) | HIGH | MEDIUM | P1 |
| Sitemap fix | MEDIUM | LOW | P1 |
| Copy button keyboard fix | MEDIUM | LOW | P1 |
| VoiceOver list fix | MEDIUM | LOW | P1 |
| Image `sizes` | MEDIUM | LOW | P1 |
| Code deduplication | MEDIUM | MEDIUM | P2 |
| RSS feed | MEDIUM | LOW | P2 |
| Hero refactor | LOW | MEDIUM | P2 |
| Mobile TOC | MEDIUM | MEDIUM | P2 |
| Vitest setup + tests | MEDIUM | MEDIUM | P2 |
| Playwright setup + tests | MEDIUM | HIGH | P3 |
| Resume placeholder cleanup | LOW | LOW | P3 |
| Color script fix | LOW | LOW | P3 |

**Priority key:**
- P1: Ship in v1.6 -- addresses audit concerns directly
- P2: Ship in v1.6 -- improves quality and maintainability
- P3: Ship in v1.6 if time permits -- lower impact

## Existing Ecosystem Patterns

### Security Headers in Next.js

The standard pattern is a `headers()` function in `next.config.ts` returning an array of header objects applied to all routes. For static sites, this is simpler and more appropriate than middleware-based CSP with nonces. The `unsafe-eval` directive is a known tradeoff when using `new Function()` for MDX -- documented by multiple Next.js blog authors.

### OG Image Generation

Next.js `ImageResponse` (powered by Satori) is the standard. It renders JSX to PNG at 1200x630. Custom fonts are loaded via `fetch()` or `fs.readFile()`. When `generateStaticParams` is exported, images are generated at build time -- ideal for a statically generated blog. The file convention `opengraph-image.tsx` is auto-linked in metadata without manual wiring.

### RSS Feed Generation

The `feed` npm package is the community standard (more actively maintained than `rss`). Create `app/feed.xml/route.ts` exporting a `GET` handler that returns a `Response` with `content-type: application/xml`. Import posts from Velite, filter drafts, map to feed items.

### Vitest with Next.js

Official Next.js docs recommend Vitest as the primary unit testing framework. Setup requires `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, and `vite-tsconfig-paths`. Critical limitation: async server components cannot be tested with Vitest -- use Playwright for those paths.

### Upstash Rate Limiting

`@upstash/ratelimit` sliding window is the standard for serverless. Uses the same Redis instance (same env vars). Typical setup: 10 requests per 10 seconds per IP. Apply directly in route handlers -- no middleware needed for a single endpoint.

## Sources

- [Next.js Error Handling Docs](https://nextjs.org/docs/app/getting-started/error-handling)
- [Next.js error.js Convention](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js opengraph-image Convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Next.js Vitest Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [Upstash Rate Limiting Blog](https://upstash.com/blog/nextjs-ratelimiting)
- [Upstash Ratelimit Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Dynamic OG Images with Next.js 16 (MakerKit)](https://makerkit.dev/blog/tutorials/dynamic-og-image)
- [CVE-2025-29927 Next.js Middleware Bypass](https://blogs.jsmon.sh/cve-2025-29927-explained-the-next-js-middleware-authorization-bypass/)

---
*Feature research for: Next.js 16 portfolio/blog hardening*
*Researched: 2026-04-02*
