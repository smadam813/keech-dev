# keech.dev

## What This Is

Personal portfolio/blog at keech.dev built with Next.js 16, React 19, Tailwind CSS v4, and Velite for MDX content. Features a neobrutalist visual identity with Norse-themed hero section, load-gated reveal animation, ambient rune glow effects, Redis-backed blog view counts, multi-select tag/stack filtering, security headers, branded error boundaries, dynamic OG images, RSS feed, and automated test coverage via Vitest and Playwright.

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

### Active

## Current Milestone: v1.7 Address Additional Concerns

**Goal:** Harden CSP by eliminating `unsafe-eval` and `unsafe-inline`, centralize security via middleware, and clean up remaining lint/dependency/testing concerns.

**Target features:**
- Migrate MDX rendering from `new Function()` to compile-time approach, removing `unsafe-eval` from CSP
- Add Next.js middleware for centralized security headers with nonce-based CSP
- Migrate syntax highlighting to class-based/CSS-variables styling, removing `unsafe-inline` from CSP
- Fix npm audit vulnerabilities via overrides or updates
- Sync eslint-config-next version and silence intentional lint violations
- Migrate localStorage/media query patterns to `useSyncExternalStore`
- Pin Velite to exact version
- Clean up stale worktree artifacts

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
- CSP without `unsafe-eval` — requires replacing `new Function()` MDX execution (tracked as DEP-03)
- Nonce-based CSP via middleware — incompatible with static generation
- Comprehensive E2E test suite — diminishing returns for personal portfolio
- Visual regression testing — high maintenance, low value for personal site

## Context

Shipped v1.6 Address Concerns with 38 requirements across security, quality, accessibility, SEO, and testing.
Tech stack: Next.js 16, React 19, Tailwind CSS v4, Velite, MDX, Upstash Redis.
Codebase: ~72 source files modified in v1.6, total project well over 3,000 LOC TypeScript + CSS.
Hero section has load-gated two-beat reveal and 14 ambient rune glows.
Blog posts display public view counts backed by Upstash Redis with IP deduplication.
Blog and project listing pages support multi-select filtering with AND logic, count badges, URL persistence, and fade transitions.
All pages serve security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) via next.config.ts headers().
Branded error boundaries at three levels catch runtime errors gracefully.
Othala rune favicon + dynamic OG images for social sharing.
RSS feed at /feed.xml, sitemap with actual content dates.
Test coverage: 18 Vitest unit tests + 14 Playwright E2E tests.
Collapsible sticky mobile TOC for blog post section navigation.
Site is statically generated and deployed via git-push to Vercel.
CSP currently requires `unsafe-eval` (MDX `new Function()`) and `unsafe-inline` (rehype-pretty-code inline styles).
npm audit reports 3 transitive vulnerabilities (flatted, picomatch). eslint-config-next version skew from next@16.2.2.

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
| CSP with unsafe-eval + unsafe-inline | Pragmatic for MDX new Function() and rehype-pretty-code; no user-generated content | ✓ Good — revisit when MDX pipeline changes (DEP-03) |
| @upstash/ratelimit sliding window (10/60s) | Simple, serverless-native rate limiting for view counter POST | ✓ Good |
| OG image font via readFile/process.cwd() | Turbopack workaround — fetch/import.meta.url not available in OG route | ⚠️ Revisit when Turbopack adds support |
| Playwright Chromium-only | No CI pipeline; Firefox/WebKit add time without value for personal site | ✓ Good |
| Pure CSS sticky TOC (no JS scroll listeners) | Simpler, more performant, leverages native browser behavior | ✓ Good |
| Auto-collapse TOC on heading click | Reduces friction — user picks a heading, TOC gets out of the way | ✓ Good |

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
*Last updated: 2026-04-04 after Phase 14 Foundation Hardening complete*
