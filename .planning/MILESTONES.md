# Milestones

## v1.6 Address Concerns (Shipped: 2026-04-03)

**Phases completed:** 5 phases, 13 plans, 25 tasks
**Quick tasks:** 3 (lint fix, traceability backport, E2E hardcoded slug fix)
**Timeline:** 2 days (2026-04-02 → 2026-04-03)
**Code changes:** 72 files, +2,522 / -409 lines (TypeScript + CSS)
**Requirements:** 38/38 satisfied | **Audit:** tech_debt (7 deferred items)

**Delivered:** Comprehensive hardening across security, quality, accessibility, SEO, and testing — resolving all 22 concerns from the codebase audit.

**Key accomplishments:**

- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) on all routes, API input validation with slug regex, batch limits, and @upstash/ratelimit rate limiting
- MDX rendering wrapped in try-catch with branded neobrutalist fallback; error boundaries at global, root-layout, and blog-post levels
- Othala rune favicon (SVG + ICO + apple-touch-icon) and dynamic OG image generators for site-level and per-post social previews
- Code quality consolidation: shared useFilteredList hook, formatDate utility, localStorage helpers, FilterChip unification, Hero refactored into custom hooks
- Vitest (18 unit tests) + Playwright (14 E2E tests) covering formatDate, view counts, glow positions, mobile menu, code copy, and mobile TOC
- Collapsible sticky mobile TOC with auto-collapse on heading navigation and adjusted scroll-margin-top clearance
- RSS feed at /feed.xml, sitemap with actual content dates, project images with responsive sizes attributes

**Quick tasks (v1.6):**

- fix(quick-260403-h6t): Fix broken `npm run lint` — migrated to native ESLint flat config for Next.js 16
- docs(quick-260403-h8n): Backport D-01 through D-07 to REQUIREMENTS.md traceability table
- fix(quick-260403-h8h): Replace hardcoded slug in code-copy E2E spec with dynamic listing navigation

**Tech debt carried forward:**

- CSP requires `unsafe-eval` for MDX `new Function()` execution (tracked as DEP-03)
- CSP requires `unsafe-inline` for rehype-pretty-code inline styles
- OG image font loading uses `readFile`/`process.cwd()` (Turbopack workaround)
- Phase 11 has 5 pending human verification items (favicon visual, OG images, RSS link, hydration)

---

## v1.5 Tag Filtering (Shipped: 2026-03-01)

**Phases completed:** 3 phases, 4 plans, 9 tasks
**Timeline:** 3 days (2026-02-27 → 2026-03-01)
**Git range:** `41406ac`..`0b91f34`
**Files modified:** 8 source files, +443/-49 lines (TypeScript + CSS)

**Delivered:** Multi-select tag and stack filtering on blog and project listing pages with AND logic, URL persistence, count badges, and smooth fade transitions.

**Key accomplishments:**

- Polymorphic TagChip and TechBadge components with display, link, and toggle modes — zero regression on existing usage sites
- Reusable FilterBar with renderChip delegation pattern, "Clear all" action, and count badge threading
- Blog tag filtering and project stack filtering with AND logic, empty states, and Suspense-isolated static generation
- URL-persisted filter state via useSearchParams + window.history.replaceState (shareable/bookmarkable)
- Per-tag/stack count badges on filter chips and "Showing X of Y" result counts when filters active
- CSS opacity fade transitions on grid content changes with prefers-reduced-motion support

---

## v1.3 Hero Polish (Shipped: 2026-02-09)

**Phases completed:** 2 phases, 2 plans, 6 tasks
**Timeline:** 9 days (2026-01-31 → 2026-02-08)
**Git range:** `7b45a9c`..`65882dc`
**Files modified:** 3 source files, 691 LOC (TypeScript + CSS)

**Delivered:** Load-gated hero reveal animation and ambient rune glow effects that make the keech.dev hero section feel polished and intentional.

**Key accomplishments:**

- Load-gated two-beat hero reveal sequence: background blur-to-sharp, then text fade-up — text animation never plays before image is visible
- Dual-path image load detection (onLoad + img.complete) covering fresh loads, cached, and bfcache scenarios
- 14 ambient rune glow overlays with object-cover position mapping and staggered power-curve entrance cascade
- Per-rune breathing cycles using only GPU-composited properties (opacity + transform) for smooth performance
- Full prefers-reduced-motion support across all new animations

---

## v1.4 Blog Stats (Shipped: 2026-02-22)

**Phases completed:** 3 phases, 6 plans, 13 tasks
**Timeline:** 2 days (2026-02-21 → 2026-02-22)
**Git range:** `e44cfc9`..`215a4a1`
**Files modified:** 11 source files, +291/-10 lines (TypeScript)

**Delivered:** Public view counts on blog posts — the site's first backend integration, backed by Upstash Redis with IP deduplication and graceful degradation.

**Key accomplishments:**

- Redis-backed view count API with GET/POST handlers and IP dedup via SHA-256 hashing (24h TTL)
- Server-enforced dedup: two-step SET NX + conditional INCR prevents count inflation from repeat visits
- ViewCounter client component with localStorage caching for flicker-free display on return visits
- Jera rune separators replacing middle-dot separators across all blog post metadata
- Batch view count endpoint with redis.mget() for single round-trip listing page retrieval
- Blog listing view counts with render-prop pattern preserving static generation and graceful degradation

---
