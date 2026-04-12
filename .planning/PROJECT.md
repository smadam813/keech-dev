# keech.dev

## What This Is

Personal portfolio/blog at keech.dev built with Next.js 16, React 19, Tailwind CSS v4, and Velite for MDX content. Features a neobrutalist visual identity with Norse-themed hero section, load-gated reveal animation, ambient rune glow effects, Redis-backed blog view counts, multi-select tag/stack filtering, centralized security headers via middleware (CSP without unsafe-eval), branded error boundaries, dynamic OG images, RSS feed, CSS-variables syntax highlighting, and automated test coverage via Vitest and Playwright.

## Core Value

A polished, intentional developer portfolio — fast, visually distinctive, and well-crafted in every detail.

## Requirements

### Validated

- ✓ Hero section displays full-bleed background image with text overlay — existing
- ✓ "keech.dev" text uses fadeInUp animation — existing
- ✓ Dark gradient scrim ensures WCAG AA text contrast — existing
- ✓ Respects prefers-reduced-motion — existing
- ✓ Static generation, no client-side data fetching — existing
- ✓ Text animation waits for background image to be loaded/decoded before playing — v1.3
- ✓ Back-button navigation remains fast (bfcache not broken) — v1.3
- ✓ CSS radial gradient hotspots overlay each rune in the hero image — v1.3
- ✓ Rune hotspots pulse with staggered timing (ember-like glow) — v1.3
- ✓ Rune glow effect respects prefers-reduced-motion — v1.3
- ✓ No layout shift or flash of unstyled content during navigation — v1.3
- ✓ Public view counts displayed on blog post pages and blog listing — v1.4
- ✓ View count persistence via Upstash Redis with IP dedup — v1.4
- ✓ API routes for incrementing and batch-fetching view counts — v1.4
- ✓ Graceful degradation when API unreachable — v1.4
- ✓ Filter bar with unique tags above blog grid — v1.5
- ✓ Multi-tag AND logic filtering on blog listing — v1.5
- ✓ Count badges on tag/stack filter chips — v1.5
- ✓ Fade transitions on filter content changes — v1.5
- ✓ Filter bar with unique stack above project grid — v1.5
- ✓ Multi-stack AND logic filtering on project listing — v1.5
- ✓ Clear visual distinction for active/inactive filter chips — v1.5
- ✓ "Clear filters" resets all selections — v1.5
- ✓ Empty state with "clear filters" action — v1.5
- ✓ "Showing X of Y" result count when filters active — v1.5
- ✓ Neobrutalist press animation on filter chips — v1.5
- ✓ Filter state persists in URL search params — v1.5
- ✓ Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) on all routes — v1.6
- ✓ Zero npm audit vulnerabilities — v1.6
- ✓ MDX rendering error fallback with branded UI — v1.6
- ✓ API input validation (slug format, batch limits) — v1.6
- ✓ Rate limiting on view counter POST (10/60s per IP) — v1.6
- ✓ Color validation script corrected — v1.6
- ✓ Error boundaries at global, root-layout, and blog-post levels — v1.6
- ✓ Loading skeleton UI for route transitions — v1.6
- ✓ Shared useFilteredList hook (blog + project lists deduplicated) — v1.6
- ✓ formatDate utility and localStorage cache helpers consolidated — v1.6
- ✓ FilterChip unification (TagChip + TechBadge merged) — v1.6
- ✓ Hero component refactored with extracted hooks — v1.6
- ✓ Code block copy button keyboard-accessible — v1.6
- ✓ MDX list elements VoiceOver-compatible — v1.6
- ✓ Favicon set (SVG + ICO + apple-touch-icon) with Othala rune — v1.6
- ✓ Site-level OG image with neobrutalist branding — v1.6
- ✓ Per-post OG images with dynamic titles — v1.6
- ✓ Sitemap uses actual content dates — v1.6
- ✓ RSS feed at /feed.xml with auto-discovery — v1.6
- ✓ Project images include responsive sizes attribute — v1.6
- ✓ Resume placeholder removed from about page — v1.6
- ✓ CSP script-src permits Next.js inline scripts for hydration — v1.6
- ✓ Vitest configured with path aliases, jsdom, and React Testing Library — v1.6
- ✓ Unit tests for formatDate, view count helpers, computeGlowPositions — v1.6
- ✓ Playwright configured with Chromium-only for E2E testing — v1.6
- ✓ E2E tests for mobile menu, code copy, view count, mobile TOC — v1.6
- ✓ Collapsible mobile TOC accordion for blog posts — v1.6
- ✓ Sticky mobile TOC with auto-collapse on heading navigation — v1.6
- ✓ CSS-only sticky positioning for mobile TOC (no JS scroll listeners) — v1.6
- ✓ Visual sticky indicator distinguishes pinned from inline TOC — v1.6
- ✓ Smooth scroll with scroll-margin-top clearance on TOC heading links — v1.6
- ✓ Zero npm audit vulnerabilities — v1.7
- ✓ eslint-config-next version synced with next@16.2.2 — v1.7
- ✓ Error boundary `<a>` tags have eslint-disable comments with context — v1.7
- ✓ Velite pinned to exact version 0.3.1 — v1.7
- ✓ Stale worktree artifacts cleaned up — v1.7

- ✓ Security headers served from src/proxy.ts (middleware centralization) — v1.7
- ✓ headers() function removed from next.config.ts — v1.7
- ✓ Single CSP header per response (no duplication) — v1.7
- ✓ Velite uses s.markdown() instead of s.mdx() for content collections — v1.7
- ✓ MDXContent renders HTML via dangerouslySetInnerHTML (no new Function) — v1.7
- ✓ Code block copy button works via DOM-based approach after HTML rendering — v1.7
- ✓ VoiceOver-compatible list elements (role="list") preserved via rehype plugin — v1.7
- ✓ unsafe-eval removed from script-src in CSP — v1.7

- ✓ Syntax highlighting uses CSS-variables theme via createCssVariablesTheme() — v1.7
- ✓ Token color variables defined in globals.css as --shiki-* CSS custom properties — v1.7
- ✓ Code block background explicitly set via CSS variable (keepBackground: false) — v1.7
- ✓ Visual parity with github-dark-dimmed color scheme maintained — v1.7
- ✓ localStorage patterns in view-counter and listing-view-counts use useSyncExternalStore — v1.7
- ✓ matchMedia pattern in use-hero-animation uses useSyncExternalStore — v1.7
- ✓ Zero react-hooks/set-state-in-effect warnings from npm run lint — v1.7
- ✓ Animation orchestration effects preserved with explanatory suppression comments — v1.7
- ✓ All existing E2E tests pass with hardened CSP — v1.7
- ✓ next build output shows all pages as Static — v1.7
- ✓ Zero ESLint errors and zero warnings from npm run lint — v1.7
- ✓ Orphaned CopyButton component and test deleted — v1.8
- ✓ Security-headers test relocated to co-locate with src/proxy.ts — v1.8
- ✓ vitest/globals added to tsconfig types, zero false tsc errors — v1.8
- ✓ Error import shadowing fixed in error.test.tsx — v1.8
- ✓ Minor/patch dependencies updated (tailwindcss 4.2.2, tailwind-merge 3.5.0, @upstash/redis 1.37.0, rehype-pretty-code 0.14.3, @types/node 25.5.2, @types/react 19.2.14) — v1.8
- ✓ shiki upgraded from 3.x to 4.x with zero code changes (CSS-variables theme unchanged) — v1.8
- ✓ @vercel/analytics upgraded from 1.x to 2.x with zero code changes — v1.8
- ✓ lucide-react upgraded from 0.x to 1.x with brand icon SVG replacements — v1.8
- ✓ Zero npm audit vulnerabilities maintained after all dependency upgrades — v1.8
- ✓ TypeScript upgraded from 5.9.3 to 6.0.2 with zero source code changes — v1.8
- ✓ API route handlers (batch + single slug) fully unit tested — v1.8
- ✓ CodeBlockEnhancer DOM mutations unit tested (5 scenarios) — v1.8
- ✓ OG font file existence assertion added — v1.8
- ✓ react-hooks/set-state-in-effect suppressions verified as intentional with inline rationale — v1.8

### Active

## Current Milestone: v1.8.1 Address Missed Concerns

**Goal:** Close the three CONCERNS.md items that were out of scope during v1.8 but are genuinely worth acting on.

**Target features:**
- Draft post guard — exclude `draft: true` posts from dynamic routes and `generateStaticParams()`
- `test:e2e:dev` script — dev-server-backed E2E workflow for fast local iteration
- Clipboard failure handling — wrap copy-button write in `try/catch` with user-visible failure state

## Current State

Started v1.8.1 Address Missed Concerns (2026-04-11). Small cleanup patch on v1.8.

### Out of Scope

- Hero redesign or layout changes — keeping current composition
- New image assets or image layer splitting — pure CSS overlay approach
- Dark mode — single theme is the brand
- Interactive rune effects (hover, scroll-triggered) — ambient only
- Canvas-based ambient glow — over-engineered for static image
- Particle system / floating runes — clashes with neobrutalist identity
- Framer Motion or GSAP — zero-library codebase precedent
- Admin analytics dashboard — use Vercel Analytics instead
- Engagement features (likes/reactions) — separate milestone requiring session management
- Real-time view counter (WebSocket) — over-engineered for personal blog
- Full-text search — over-engineered for small post count; tag filtering covers primary use case
- OR logic filtering — AND is the correct default for narrowing
- Server-side filtering via route segments — explodes static generation matrix
- Sidebar filter panel — single-dimension filtering doesn't need a sidebar
- Persistent filter state in localStorage — URL search params are the persistence mechanism
- Nonce-based CSP — incompatible with static generation; nonces require per-request dynamic rendering
- Remove `unsafe-inline` from script-src — required for Next.js hydration; only removable with nonces
- Comprehensive E2E test suite — diminishing returns for personal portfolio
- Visual regression testing — high maintenance, low value for personal site

## Context

Shipped v1.8 Validate & Address Concerns — dead code removed, all dependencies current, TypeScript 6, full test coverage.
Tech stack: Next.js 16, React 19, Tailwind CSS v4, Velite (s.markdown()), Upstash Redis, TypeScript 6.0.2.
Codebase: ~5,200 LOC TypeScript + CSS across ~100 source files.
Hero section has load-gated two-beat reveal and 14 ambient rune glows.
Blog posts display public view counts backed by Upstash Redis with IP deduplication.
Blog and project listing pages support multi-select filtering with AND logic, count badges, URL persistence, and fade transitions.
Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) served from src/proxy.ts middleware.
CSP no longer requires `unsafe-eval` — MDX renders compile-time HTML via dangerouslySetInnerHTML.
Syntax highlighting uses shiki 4 CSS-variables theme with 14 --shiki-* token variables in globals.css.
Branded error boundaries at three levels catch runtime errors gracefully.
Othala rune favicon + dynamic OG images for social sharing.
RSS feed at /feed.xml, sitemap with actual content dates.
Test coverage: 154 Vitest unit tests + 18 Playwright E2E tests (16 active, 2 graceful skips).
Collapsible sticky mobile TOC for blog post section navigation.
Site is statically generated and deployed via git-push to Vercel.
Zero npm audit vulnerabilities. Zero ESLint errors/warnings. Zero dead code.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CSS overlay hotspots for rune glow | No new image assets needed, pure CSS, maintainable | ✓ Good |
| Staggered pulse timing | Each rune at its own rhythm feels organic, like embers | ✓ Good |
| Sync animation via image onLoad | Prevents text animation playing over empty gradient | ✓ Good |
| Convert Hero to client component | Need onLoad callback from Image — requires 'use client' | ✓ Good |
| Separate heroTextReveal keyframe | Hero needs more visual presence at large sizes | ✓ Good |
| 600ms delay between bg and text reveal | Two-beat rhythm (350ms blur + 250ms pause) | ✓ Good |
| 14 runes (not 13) | Visual inspection found additional rune missed by research | ✓ Good |
| Color distribution 6 teal / 4 amber / 4 gold | Adjusted from strict aett grouping for visual balance | ✓ Good |
| Manual position calibration | Research estimates were off 5-15% in both axes | ✓ Good |
| No mix-blend-mode | Preserves GPU-composited opacity animation | ✓ Good |
| @upstash/redis over deprecated @vercel/kv | @vercel/kv deprecated Dec 2024, @upstash/redis is the direct replacement | ✓ Good |
| Two-step SET NX + conditional INCR | Correctness over ~1-2ms latency for dedup enforcement | ✓ Good |
| localStorage view cache over shimmer | Shimmer felt jarring; cached count provides instant display on return visits | ✓ Good |
| Render-prop pattern for listing view counts | Keeps PostCard server-renderable while ListingViewCounts owns client boundary | ✓ Good |
| Batch redis.mget() for listing page | Single round-trip retrieval vs N individual fetches | ✓ Good |
| No slug validation against published posts | Orphan Redis keys are harmless, zero-cost simplification | ✓ Good |
| Polymorphic chip components (display/link/toggle) | Single component serves all contexts without code duplication | ✓ Good |
| renderChip prop delegation on FilterBar | FilterBar never imports specific chip components; parent controls appearance | ✓ Good |
| Mutually exclusive class pattern for toggle states | Avoids tailwind-merge conflicts with custom shadow tokens | ✓ Good |
| window.history.replaceState for URL filter updates | Avoids router.replace re-renders while Next.js syncs with useSearchParams | ✓ Good |
| Suspense boundary for useSearchParams | Isolates client island in static page; preserves static generation | ✓ Good |
| Static counts (total per tag/stack) | Simpler than contextual counts; more useful for small content sets | ✓ Good |
| Grid fades as a unit (not individual cards) | Cleaner visual for small card counts | ✓ Good |
| useRef initial-render guard for fade | Prevents flash-of-invisible-content on page load with URL-preloaded filters | ✓ Good |
| CSP with unsafe-eval + unsafe-inline | Was pragmatic for MDX new Function(); resolved in v1.7 by switching to s.markdown() | ✓ Good — unsafe-eval removed in v1.7 |
| @upstash/ratelimit sliding window (10/60s) | Simple, serverless-native rate limiting for view counter POST | ✓ Good |
| OG image font via readFile/process.cwd() | Turbopack workaround — fetch/import.meta.url not available in OG route | ⚠️ Revisit when Turbopack adds support |
| Playwright Chromium-only | No CI pipeline; Firefox/WebKit add time without value for personal site | ✓ Good |
| Pure CSS sticky TOC (no JS scroll listeners) | Simpler, more performant, leverages native browser behavior | ✓ Good |
| Auto-collapse TOC on heading click | Reduces friction — user picks a heading, TOC gets out of the way | ✓ Good |
| s.markdown() over s.mdx() for Velite | Eliminates new Function() entirely; compile-time HTML is safer and simpler | ✓ Good |
| dangerouslySetInnerHTML for MDX rendering | Only viable path after removing runtime JS execution; content is author-controlled | ✓ Good |
| DOM-based CodeBlockEnhancer for copy buttons | Post-render DOM injection works with static HTML; no React hydration needed | ✓ Good |
| src/proxy.ts for centralized security headers | Next.js 16 convention; single source of truth replaces next.config.ts headers() | ✓ Good |
| Accept unsafe-inline in style-src | Marginal security gain not worth effort; CSS-variables approach adopted for design benefits | ✓ Good |
| CSS-variables Shiki theme (createCssVariablesTheme) | Aligns with CSS-first design token approach; ~10 vars cover key token scopes | ✓ Good |
| useSyncExternalStore for localStorage/matchMedia | Idiomatic React 19; eliminates set-state-in-effect warnings cleanly | ✓ Good |
| useTransition for filter opacity transitions | Replaces manual isTransitioning/useEffect/setTimeout; eliminates 1-frame flash | ✓ Good |
| Pin Velite to exact 0.3.1 (no caret) | Prevents unexpected build breakage from minor version changes | ✓ Good |
| Retain lucide-react after CopyButton removal | 6 other consumers confirmed; only remove deps with zero importers | ✓ Good |
| Co-locate test files next to source | src/proxy.test.ts beside src/proxy.ts; easier to find and maintain | ✓ Good |
| Upgrade tailwindcss + @tailwindcss/postcss together | Avoids version mismatch build failures between paired packages | ✓ Good |
| shiki 4 zero-code upgrade | createCssVariablesTheme API unchanged from v3; no migration needed | ✓ Good |
| Brand icon SVG replacements for lucide-react 1.x | Custom GithubIcon/LinkedinIcon components replace removed brand icons | ✓ Good |
| Accept Next.js re-adding esModuleInterop | Framework invariant; always-on in TS6 regardless of tsconfig | ✓ Good |
| Verify lint suppressions rather than refactor | Animation orchestration effects require useEffect setState; documented as intentional | ✓ Good |

## Constraints

- **Tech stack**: Next.js + Tailwind CSS + existing tooling only
- **Performance**: Lightweight — no heavy JS libraries for effects
- **Accessibility**: All animations must respect prefers-reduced-motion
- **Image**: No modifications to hero.webp — effects are pure CSS overlays
- **Theme**: Single theme only (no dark mode) — the palette is the brand

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 — v1.8.1 Phase 24 complete (draft guard, dev E2E script, clipboard failure handling)*
