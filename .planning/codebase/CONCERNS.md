# Codebase Concerns

**Analysis Date:** 2026-03-22

## Critical Severity

### Security: `new Function()` MDX Execution

- Issue: `new Function(code)` executes arbitrary JavaScript at runtime with no sandboxing, try-catch, or CSP consideration
- Files: `src/components/blog/mdx-content.tsx` (line 13)
- Impact: Any compromise of the Velite build output or `.velite/` directory results in arbitrary code execution in every visitor's browser. If content sourcing ever expands beyond the local `content/` directory, this is a direct XSS vector.
- Current mitigation: Content is version-controlled and compiled by Velite at build time. The `.velite/` output directory is gitignored.
- Fix approach:
  1. Wrap the `new Function(code)` call in a try-catch with a fallback UI (prevents page crash on malformed MDX)
  2. Add `Content-Security-Policy` headers via `next.config.ts` `headers()` -- at minimum restrict `script-src` and consider `unsafe-eval` implications
  3. Long-term: evaluate `next-mdx-remote` or similar libraries that provide controlled MDX execution

### Security: No Security Headers

- Issue: No Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, or other security headers configured
- Files: `next.config.ts` (no `headers()` function defined), no `src/middleware.ts` file exists
- Impact: Site is vulnerable to clickjacking, MIME sniffing, and has no eval restrictions. The `new Function()` pattern makes CSP configuration particularly important.
- Fix approach: Add a `headers()` function to `next.config.ts` with:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` with appropriate directives (will need `unsafe-eval` unless MDX execution is reworked)

### Security: Dependency Vulnerabilities

- Issue: `npm audit` reports 2 vulnerabilities (1 high in `flatted`, 1 moderate in `next`) including CSRF bypass, HTTP smuggling, and unbounded disk cache growth
- Files: `package.json`, `package-lock.json`
- Impact: The `next` vulnerabilities include null origin CSRF bypass for Server Actions and unbounded image disk cache growth. While current Server Actions usage is minimal, the CSRF bypass affects the views API.
- Fix approach: Run `npm audit fix` to apply available patches. Update `next` from `16.1.6` to latest patch.

### Missing: No Test Coverage

- Issue: Zero test files exist anywhere in the codebase. No test framework is configured.
- Files: Every file under `src/` is untested
- Impact: Refactoring, dependency upgrades, and bug fixes carry regression risk. The MDX execution path, view counting API, and date formatting logic are all untested.
- Fix approach:
  1. Install Vitest (aligns with Vite-compatible ecosystem)
  2. Priority test targets: `src/lib/views.ts`, `src/lib/rune-glows.ts` (pure functions), API routes `src/app/api/views/`, MDX rendering path
  3. Add Playwright for E2E coverage of mobile menu, copy button, scroll reveal

## Moderate Severity

### Missing: No Error Boundaries

- Issue: No `error.tsx` or `loading.tsx` files exist in any route segment. No React error boundaries wrap client components.
- Files: All route segments under `src/app/` lack error/loading boundaries
- Impact: Any client-side error (e.g., MDX execution failure, API fetch error in view counter) crashes the entire page with a white screen instead of graceful degradation
- Fix approach: Add `error.tsx` at `src/app/error.tsx` (global) and `src/app/blog/[slug]/error.tsx` (MDX-specific). Add `loading.tsx` skeletons for route transitions.

### Missing: No Favicon or OG Images

- Issue: No favicon (`.ico`, `.svg`, `.png`), no apple-touch-icon, and no Open Graph images exist anywhere in the codebase
- Files: `public/` directory has no icon files; `src/app/` has no `icon.tsx`, `opengraph-image.tsx`, or `apple-icon.tsx`
- Impact: Browser tabs show a generic icon. Social media shares of blog posts and the site itself render without a preview image, significantly reducing click-through rates.
- Fix approach:
  1. Add favicon files to `public/` or use Next.js Metadata API `icon.tsx`
  2. Create `opengraph-image.tsx` using Next.js Image Generation for dynamic OG images per blog post
  3. Add default OG image reference in `src/app/layout.tsx` metadata

### Code Duplication: localStorage Cache Helpers

- Issue: `getCachedViews()` and `setCachedViews()` functions are copy-pasted identically in two files
- Files: `src/components/blog/view-counter.tsx` (lines 10-25), `src/components/blog/listing-view-counts.tsx` (lines 19-34)
- Impact: Bug fixes or behavior changes must be applied in two places. Easy to diverge.
- Fix approach: Extract to `src/lib/views.ts` alongside the existing `formatViewCount()` function

### Code Duplication: Date Formatting

- Issue: Identical `Intl.DateTimeFormat` construction with same options (`en-US`, `numeric` year, `long` month, `numeric` day, `UTC` timezone) repeated in three locations
- Files: `src/app/blog/[slug]/page.tsx` (lines 53-58, 61-66), `src/components/blog/post-card.tsx` (lines 19-24)
- Impact: Inconsistent formatting if one instance is modified without the others
- Fix approach: Create `formatDate(isoString: string): string` in `src/lib/views.ts` or a new `src/lib/format.ts`

### Code Duplication: Filtered List Components

- Issue: `FilteredPostList` and `FilteredProjectList` share nearly identical structure (~90% structural overlap): URL-based filter state, transition animation, `updateURL` via `replaceState`, clear handler, empty state UI
- Files: `src/components/blog/filtered-post-list.tsx` (154 lines), `src/components/projects/filtered-project-list.tsx` (150 lines)
- Impact: Any filter behavior fix or enhancement must be applied in both files. The URL management logic, transition state, and empty state pattern are identical.
- Fix approach: Extract a generic `useFilteredList` hook or a `FilteredListLayout` wrapper component that accepts collection-specific rendering via render props

### Code Duplication: TagChip and TechBadge

- Issue: `TagChip` and `TechBadge` share identical toggle button mode implementation (same class logic, same `aria-pressed`, same shadow/translate hover pattern)
- Files: `src/components/blog/tag-chip.tsx` (lines 17-37), `src/components/projects/tech-badge.tsx` (lines 15-36)
- Impact: Minor -- visual consistency could diverge if one is updated without the other
- Fix approach: Extract shared toggle badge component, or keep separate if they intentionally diverge in future

### Performance: Missing `sizes` on Project Card Images

- Issue: `<Image>` components in project cards use `fill` layout without a `sizes` prop
- Files: `src/components/projects/project-card.tsx` (lines 32-37), `src/app/projects/[slug]/page.tsx` (lines 115-120)
- Impact: Without `sizes`, Next.js Image generates default srcset but the browser cannot select the optimal image size, potentially downloading larger images than needed on mobile
- Fix approach: Add `sizes="(max-width: 768px) 100vw, 50vw"` to project card images and `sizes="(max-width: 1024px) 100vw, 56rem"` to project detail images

### API: No Rate Limiting on View Counter

- Issue: The POST endpoint at `/api/views/[slug]` has IP-based deduplication (24h TTL) but no rate limiting
- Files: `src/app/api/views/[slug]/route.ts`
- Impact: A bot or malicious actor can hammer the endpoint with requests from rotating IPs, inflating view counts and consuming Upstash Redis quota. Each unique IP creates a dedup key and an increment.
- Fix approach: Add Upstash Ratelimit (`@upstash/ratelimit`) with a sliding window. Vercel's Edge middleware or Next.js middleware can enforce this before the route handler runs.

### API: No Input Validation on Slug Parameters

- Issue: Slug parameters from URL paths and query strings are used directly in Redis key construction without validation or sanitization
- Files: `src/app/api/views/[slug]/route.ts` (line 14, 32: `views:${slug}`), `src/app/api/views/route.ts` (line 8: splits on comma, no validation)
- Impact: Crafted slugs could create unexpected Redis keys. The batch endpoint accepts arbitrary comma-separated values with no length limit on the slugs array.
- Fix approach: Validate slugs against `generateStaticParams()` output or enforce a regex pattern (e.g., `^[a-z0-9-]+$`). Limit batch size in the GET `/api/views` endpoint.

### SEO: No OG Images for Blog Posts

- Issue: Blog post metadata includes `openGraph` but no images. Project metadata conditionally includes images only when `project.image` exists. The root layout metadata has no images.
- Files: `src/app/blog/[slug]/page.tsx` (lines 35-42), `src/app/layout.tsx` (lines 22-28)
- Impact: Social media shares render without preview images. This significantly reduces engagement and click-through rates for shared content.
- Fix approach: Use Next.js `opengraph-image.tsx` convention or add a default OG image to metadata

### Sitemap: Static Routes Use `new Date()`

- Issue: Static routes in the sitemap (`/`, `/about`, `/blog`, `/projects`) and project routes use `new Date()` for `lastModified`, meaning every build regenerates with the current date regardless of actual content changes
- Files: `src/app/sitemap.ts` (lines 8-11, 21-25)
- Impact: Search engines see constantly changing `lastModified` dates for unchanged pages, reducing crawl efficiency signals. Blog post dates correctly use `post.date`, but project routes do not use `project.date` or `project.updated`.
- Fix approach: Use fixed dates for static routes (or the most recent content date). Use `project.updated ?? project.date` for project routes.

## Minor Severity

### Accessibility: Table of Contents Hidden on Mobile

- Issue: The `<aside>` containing the table of contents is `hidden lg:block`, completely removing it from the DOM on mobile/tablet
- Files: `src/app/blog/[slug]/page.tsx` (line 121)
- Impact: Mobile readers of long posts have no way to navigate between sections. On a 3000-word post, this is a significant UX gap.
- Fix approach: Add a collapsible TOC component for mobile (e.g., sticky bottom bar or expandable section at top of article)

### Accessibility: Copy Button Not Keyboard-Discoverable

- Issue: The copy button is `opacity-0 group-hover:opacity-100`, making it invisible until mouse hover. Keyboard-only users tabbing through code blocks cannot see the button they're about to activate.
- Files: `src/components/blog/copy-button.tsx` (line 29)
- Impact: Keyboard and screen reader users can still activate the button, but sighted keyboard users have no visual indication it exists
- Fix approach: Add `focus-visible:opacity-100` alongside `group-hover:opacity-100`

### Accessibility: Custom List Bullets May Affect VoiceOver

- Issue: `list-style: none` on `.prose ul` with `::before` pseudo-element rune bullets. The code includes a comment acknowledging this Safari/VoiceOver concern.
- Files: `src/app/globals.css` (lines 361-383)
- Impact: Safari VoiceOver may not announce list semantics. The comment states this is considered acceptable because structural `<li>` children are retained.
- Fix approach: Add `role="list"` to MDX `<ul>` elements via the MDX component overrides in `src/components/blog/mdx-content.tsx` if VoiceOver behavior is confirmed problematic

### Accessibility: `useLayoutEffect` SSR Warning Potential

- Issue: `useLayoutEffect` is used in two client components for localStorage reads. While these are client components (`'use client'`), `useLayoutEffect` generates React warnings during SSR if components are ever server-rendered.
- Files: `src/components/blog/view-counter.tsx` (line 32), `src/components/blog/listing-view-counts.tsx` (line 40)
- Impact: Currently safe because components are exclusively client-rendered. If rendering approach changes, this would produce console warnings.
- Fix approach: No action needed unless these components need SSR. The pattern is intentional for preventing flash.

### Performance: Hero Component Complexity

- Issue: The Hero component manages 5 state variables, 5 `useEffect` hooks, a `ResizeObserver`, and a `setTimeout` chain for reveal orchestration
- Files: `src/components/hero.tsx` (177 lines)
- Impact: High cognitive complexity for a single component. The reveal sequence timing (350ms + 250ms pause + 500ms text + glow cascade) is spread across multiple effects with implicit ordering dependencies.
- Fix approach: Consider extracting animation orchestration into a custom `useRevealSequence` hook. The `ResizeObserver` logic could be a separate `useGlowPositions` hook.

### Performance: Unoptimized About Page Headshot

- Issue: The about page headshot uses explicit `width={384}` and `height={512}` with `object-cover` but no `sizes` attribute
- Files: `src/app/about/page.tsx` (lines 17-24)
- Impact: Minor -- the image is small (76KB webp) and has `priority` set, but explicit sizing means Next.js generates a single variant rather than responsive srcset
- Fix approach: Low priority. Image is already well-optimized at 76KB.

### Missing: No RSS Feed

- Issue: Blog has no RSS/Atom feed endpoint despite having structured post data with dates, descriptions, and content
- Files: No feed endpoint exists
- Impact: Content consumers who prefer RSS cannot subscribe to the blog. Reduces discoverability.
- Fix approach: Create `src/app/feed.xml/route.ts` that generates RSS from the `posts` collection

### Missing: Resume Placeholder

- Issue: The About page has a disabled "Resume Coming Soon" button that is permanently non-functional
- Files: `src/app/about/page.tsx` (lines 54-65)
- Impact: Minor UX concern -- a disabled button with no timeline sets unclear expectations
- Fix approach: Either add the resume PDF or remove the button until ready

### Code Quality: `validate-colors.mjs` Palette Mismatch

- Issue: The color validation script uses `muted: '#666666'` but `globals.css` defines `--color-muted: #4A4A4A`
- Files: `scripts/validate-colors.mjs` (line 6), `src/app/globals.css` (line 11)
- Impact: WCAG contrast validation results from the script do not reflect the actual palette. The script reports incorrect contrast ratios for any pair involving the muted color.
- Fix approach: Update the script's palette to match `globals.css` values. Consider deriving the palette from CSS custom properties or a shared config.

### Dependency: Velite Pre-Release

- Issue: `velite@0.3.1` is pre-release (0.x.x semver). The API surface may change on minor version bumps.
- Files: `package.json`, `velite.config.ts`
- Impact: A Velite upgrade could require config file changes, schema API changes, or output format changes. The `.velite/` import alias and collection schemas are tightly coupled.
- Fix approach: Pin the exact version in `package.json`. Test upgrades in a branch. Monitor the Velite GitHub repository for breaking change announcements.

### Dependency: Outdated Packages

- Issue: Several dependencies have available updates including Next.js (`16.1.6` -> `16.2.1`), Tailwind CSS (`4.1.18` -> `4.2.2`), `@vercel/analytics` (`1.6.1` -> `2.0.1` major), and Shiki (`3.22.0` -> `4.0.2` major)
- Files: `package.json`
- Impact: The Next.js update specifically addresses the `npm audit` vulnerabilities. The `@vercel/analytics` and Shiki major bumps may require import or API changes.
- Fix approach: Update Next.js and Tailwind CSS (patch/minor). Evaluate `@vercel/analytics` v2 and Shiki v4 migration paths separately as major versions.

### Browser Compatibility: `inert` Attribute

- Issue: The `inert` HTML attribute is used for focus management on mobile menu open
- Files: `src/components/layout/header.tsx` (lines 56-68)
- Impact: `inert` has strong modern browser support (Chrome 102+, Safari 15.5+, Firefox 112+). Older browsers ignore it, meaning main content remains focusable while the mobile menu is open. This is a progressive enhancement concern, not a blocker.
- Fix approach: Acceptable as-is. The attribute degrades gracefully. Add polyfill only if analytics show significant older browser traffic.

## Scaling Considerations

### Content Volume

- Current state: 5 blog posts, 2 projects
- Concern: All posts and projects are loaded into memory as full collections via Velite. At 500+ posts with full MDX body content, build memory usage could spike.
- Files: `velite.config.ts`, all listing pages that import from `@/.velite`
- Scaling path: Velite handles content at build time only. Monitor build duration and memory. If problematic, investigate Velite collection pagination or splitting.

### Redis Key Growth

- Current state: Each unique IP+slug combination creates a dedup key with 24h TTL. Each post slug creates a permanent view count key.
- Concern: Dedup keys are self-cleaning (24h TTL), but view count keys grow without bound. At thousands of posts, the key count grows linearly.
- Files: `src/app/api/views/[slug]/route.ts`
- Scaling path: Upstash free tier allows 10K commands/day. Monitor usage. View counts are simple integers -- storage is minimal even at scale.

---

*Concerns audit: 2026-03-22*
