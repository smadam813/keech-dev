# Codebase Concerns

**Analysis Date:** 2026-04-05

## Tech Debt

**Velite pinned at pre-release 0.3.1:**
- Issue: Velite is locked to exact version `"0.3.1"` (no caret) because it is a 0.x pre-release. Caret was explicitly removed in v1.7 phase 14. The v1.8 dependency upgrade milestone intentionally skipped upgrading it.
- Files: `package.json` line 42
- Impact: No semver range protection; manual upgrade required to receive bug fixes or new features. If a critical fix lands in 0.3.2+, it will not be adopted automatically.
- Fix approach: Monitor Velite changelog. When a stable 1.0.0 releases or a critical fix lands, evaluate upgrade manually with full build validation (`npm run velite && npm run build && npm run test`).

**`dangerouslySetInnerHTML` rendering compiled MDX:**
- Issue: Velite compiles MDX to HTML which is injected via `dangerouslySetInnerHTML={{ __html: html }}`. This is intentional (avoids Shiki transformer hydration issues with `new Function()`) but bypasses React's XSS protection for content.
- Files: `src/components/blog/mdx-content.tsx` line 30
- Impact: If a malicious MDX file were committed, it would render arbitrary HTML/JS. Risk is low because only the author can commit content, but the pipeline is fully trusted.
- Fix approach: Content is author-controlled so risk is accepted. Document the trust assumption explicitly. No fix needed unless the content pipeline accepts external input.

**DOM mutation approach in `CodeBlockEnhancer`:**
- Issue: Copy buttons are injected imperatively via DOM manipulation inside a `useEffect` after mount, bypassing React's reconciliation. The component queries `.prose` globally rather than scoping to a ref.
- Files: `src/components/blog/code-block-enhancer.tsx`
- Impact: Fragile selector coupling (`.prose` class name must stay in sync). If a blog post page is re-mounted (fast-navigation, strict mode), the `enhanced.current` ref guard prevents re-enhancement correctly, but the approach would break if `.prose` is ever renamed or if multiple `.prose` containers appear on a single page.
- Fix approach: Accept as-is for now given the single-page-per-post constraint. If `.prose` is ever refactored, update the querySelector in `code-block-enhancer.tsx` line 25 simultaneously.

**`Suspense` boundaries used without fallback props:**
- Issue: `<Suspense>` wraps `FilteredPostList` and `FilteredProjectList` but passes no `fallback` prop, resulting in `undefined` fallback (renders nothing while suspended).
- Files: `src/app/blog/page.tsx` line 23, `src/app/projects/page.tsx` line 25
- Impact: If the wrapped component suspends, users see a blank region rather than a loading skeleton. The components are unlikely to suspend in practice (no async data in client components) but the omission is fragile.
- Fix approach: Add `fallback={<LoadingSkeleton />}` or at minimum `fallback={null}` to document intent. The existing `loading.tsx` files provide route-level skeletons.

---

## Security Considerations

**`'unsafe-inline'` in CSP `script-src`:**
- Risk: The Content-Security-Policy in `src/proxy.ts` includes `'unsafe-inline'` in `script-src`, negating much of the XSS protection CSP provides for scripts. This is documented as a known gap (test SEC-01 in `src/lib/seo-assets.test.ts` asserts it is present rather than absent).
- Files: `src/proxy.ts` lines 3–13
- Current mitigation: `unsafe-eval` is explicitly absent; frame-ancestors is set to 'none'; all other sources are self-restricted. The `<meta>` approach or nonce-based CSP would allow removing `unsafe-inline`.
- Recommendations: Evaluate nonce-based CSP or `strict-dynamic` to remove `unsafe-inline`. This is a known trade-off for the current site complexity level.

**IP extraction trusts `x-forwarded-for` without validation:**
- Risk: The view-count POST handler reads the first value of `x-forwarded-for` without verifying it is the actual client IP. A user could spoof this header to bypass IP-based deduplication.
- Files: `src/app/api/views/[slug]/route.ts` lines 44–45
- Current mitigation: Rate limiting via `@upstash/ratelimit` is applied before the dedup check. View counts are non-critical UI. Deduplication is a convenience, not a security control.
- Recommendations: On Vercel, `x-forwarded-for` is populated reliably by the infrastructure. Current approach is acceptable. For additional hardness, use `request.ip` (Vercel's trusted header) if it becomes available in the Next.js 16 Route Handler API.

**Draft posts accessible via direct URL:**
- Risk: The blog listing page (`src/app/blog/page.tsx`) filters out `draft: true` posts. However, `src/app/blog/[slug]/page.tsx` does not guard against drafts — it only calls `notFound()` if the slug is absent from the compiled `posts` array.
- Files: `src/app/blog/[slug]/page.tsx` lines 48–53, `src/app/blog/page.tsx` line 15
- Current mitigation: Velite includes all posts (including drafts) in the compiled `.velite/` output so the slug lookup succeeds. `generateStaticParams()` also returns all slugs including drafts, so draft pages are statically generated and publicly accessible.
- Recommendations: Add a draft guard: `if (!post || post.draft) notFound()` in the post page. Apply the same guard to `generateStaticParams()` to exclude draft slugs from static generation.

**`navigator.clipboard` failure is unhandled:**
- Risk: The copy button in `CodeBlockEnhancer` calls `await navigator.clipboard.writeText(text)` without a try/catch. Clipboard API requires a secure context (HTTPS) and user focus — it will silently throw on HTTP or in some browser extensions.
- Files: `src/components/blog/code-block-enhancer.tsx` lines 49–60
- Current mitigation: Production is served over HTTPS via Vercel, so failure cases are rare.
- Recommendations: Wrap in try/catch and show a failure state on the button (or fall back to `execCommand`).

---

## Performance Bottlenecks

**Hero rune glow positions recomputed on every resize:**
- Problem: `useGlowPositions` uses a `ResizeObserver` on the hero section and recomputes all 14 rune overlay positions via `computeGlowPositions()` on every observation callback.
- Files: `src/hooks/use-glow-positions.ts` lines 20–35, `src/lib/rune-glows.ts` lines 49–73
- Cause: ResizeObserver fires rapidly during window resize. Each callback recomputes floating-point math across all 14 runes and triggers a React state update.
- Improvement path: Debounce the ResizeObserver callback. A 100ms debounce would eliminate visual jank from excessive re-renders during resize without affecting perceived quality.

**E2E tests require full `npm run build` before running:**
- Problem: The Playwright config (`playwright.config.ts` line 9) runs `npm run build && npm run start` as the webServer command, meaning every `npm run test:e2e` invocation triggers a full build.
- Files: `playwright.config.ts`
- Cause: E2E tests run against the production build. `reuseExistingServer: !process.env.CI` mitigates this locally only if a server is already running.
- Improvement path: Document the workflow for local e2e iteration (keep dev server running, point playwright at it) or add a `test:e2e:dev` script using `npm run dev`.

---

## Fragile Areas

**Hero animation sequence uses hardcoded `setTimeout` values:**
- Files: `src/hooks/use-hero-animation.ts` lines 56–58, 65–67
- Why fragile: The 600ms and 500ms delays are hardcoded constants that must stay in sync with CSS transition durations in `globals.css`. If either is changed independently, the animation will overlap or gap.
- Safe modification: Change both the CSS transition duration and the corresponding `setTimeout` value in `use-hero-animation.ts` together. The values are:  `bg-reveal` transition (350ms) + pause (250ms) = 600ms, then text reveal to glow cascade = 500ms.
- Test coverage: Covered by `src/hooks/use-hero-animation.test.ts` for state transitions, but CSS timing is untested.

**Rune glow position coordinates hardcoded to 2560×1429 image dimensions:**
- Files: `src/lib/rune-glows.ts` lines 11–12, `src/components/hero.tsx`
- Why fragile: `IMG_W = 2560` and `IMG_H = 1429` are hardcoded constants matching the specific hero image. If `hero.webp` is replaced, all 14 `(imgX, imgY)` coordinates in `RUNE_GLOWS` and the two constants must be updated manually.
- Safe modification: Replace hero image and all rune coordinates together. The `computeGlowPositions()` math is correct given accurate inputs.
- Test coverage: `src/hooks/use-glow-positions.test.ts` mocks the constants, so tests will not catch coordinate drift.

**`CodeBlockEnhancer` uses a module-level ref guard instead of instance guard:**
- Files: `src/components/blog/code-block-enhancer.tsx` lines 15–19
- Why fragile: `const enhanced = useRef(false)` is an instance-level ref, which is correct for a single mounted instance. However, because the component returns `null` and has no visible output, its re-mount behavior depends on the parent not unmounting it unexpectedly. In React Strict Mode (development), effects fire twice — the guard prevents double-enhancement correctly via the `useRef`, but this is non-obvious.
- Safe modification: Do not add `key` prop to `<CodeBlockEnhancer />`. Do not wrap it in conditional rendering.

---

## Test Coverage Gaps

**No tests for page components or layout components:**
- What's not tested: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/app/projects/page.tsx`, `src/app/projects/[slug]/page.tsx`, `src/app/about/page.tsx`, `src/components/layout/header.tsx`, `src/components/layout/footer.tsx`
- Files: All paths listed above
- Risk: Rendering regressions, metadata changes, and routing changes would go undetected by unit tests. E2E tests in `e2e/` provide some coverage for navigation and key flows, but only for a subset of scenarios.
- Priority: Medium — page components are primarily composition and pass-through. The most testable behavior (filtering, view counts, animations) has dedicated hook and component tests.

**No unit tests for content-rendering components:**
- What's not tested: `src/components/blog/post-card.tsx`, `src/components/blog/toc.tsx`, `src/components/blog/mobile-toc.tsx`, `src/components/blog/view-counter.tsx`, `src/components/blog/listing-view-counts.tsx`, `src/components/blog/filtered-post-list.tsx`, `src/components/projects/filtered-project-list.tsx`, `src/components/projects/project-card.tsx`
- Files: All paths listed above
- Risk: Prop contract changes, conditional rendering bugs, and accessibility regressions would go unnoticed. `ViewCounter` and `ListingViewCounts` have moderately complex async/cache logic that is currently only tested via E2E.
- Priority: Medium — `ViewCounter` and `ListingViewCounts` are highest priority given their async complexity and localStorage interaction.

**No coverage enforcement:**
- What's not tested: No coverage threshold is configured in `vitest.config.ts`.
- Files: `vitest.config.ts`
- Risk: Coverage can silently decline as new features are added. There is no automated signal when a file drops below an acceptable threshold.
- Priority: Low for a personal site — the existing test suite is reasonably thorough for the highest-complexity modules.

---

## Dependencies at Risk

**Velite 0.3.1 (pre-release, exact pin):**
- Risk: Pre-release software with no stability guarantees. No minor/patch updates are automatically received.
- Impact: Content pipeline breaks if Node.js or a transitive dependency introduces an incompatibility with Velite's exact pinned version.
- Migration plan: Monitor for Velite 1.0 stable release. Evaluate upgrade with full pipeline validation. No immediate action needed.

**eslint 9.x vs 10.x:**
- Risk: ESLint 10.x is current latest (per `npm outdated` output). The project is on 9.x via `eslint-config-next` peer dependency.
- Impact: Lint rule additions/changes in ESLint 10 are not received. Low risk for a stable config.
- Migration plan: Defer until `eslint-config-next` bumps its peer dependency to ESLint 10.

---

## Missing Critical Features

**No admin protection for draft posts:**
- Problem: Posts marked `draft: true` in frontmatter are excluded from listings and sitemap, but their statically-generated pages are publicly accessible via direct URL (see Security section above).
- Blocks: Publishing drafts without them being discoverable requires either URL obscurity (current, not enforced) or a runtime notFound guard.

---

*Concerns audit: 2026-04-05*
