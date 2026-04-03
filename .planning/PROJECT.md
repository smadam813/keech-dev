# keech.dev

## What This Is

Personal portfolio/blog at keech.dev built with Next.js 16, React 19, Tailwind CSS v4, and Velite for MDX content. Features a neobrutalist visual identity with Norse-themed hero section, load-gated reveal animation, ambient rune glow effects, Redis-backed blog view counts, and multi-select tag/stack filtering on listing pages.

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

### Active

(Defining requirements for v1.6)

## Current Milestone: v1.6 Address Concerns

**Goal:** Resolve all security, quality, accessibility, and SEO concerns identified in the codebase audit — hardening the site across every severity level.

**Target features:**
- Security hardening: CSP headers, MDX try-catch, dependency patches, API rate limiting + input validation
- Error resilience: error boundaries, loading states
- SEO/branding: favicon, OG images, sitemap fix, RSS feed
- Code quality: deduplicate localStorage helpers, date formatting, filtered list components, TagChip/TechBadge
- Accessibility: mobile TOC, keyboard-discoverable copy button, VoiceOver list fix
- Performance: image `sizes` attributes, Hero component refactor
- Testing: Vitest setup + priority test targets
- Cleanup: outdated packages, resume placeholder, color validation script fix

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

## Context

Shipped v1.5 Tag Filtering with 2,360 LOC across TypeScript + CSS.
Tech stack: Next.js 16, React 19, Tailwind CSS v4, Velite, MDX, Upstash Redis.
Hero section has load-gated two-beat reveal and 14 ambient rune glows.
Blog posts display public view counts backed by Upstash Redis with IP deduplication.
Blog and project listing pages support multi-select filtering with AND logic, count badges, URL persistence, and fade transitions.
Site is statically generated and deployed via git-push to Vercel.
Codebase audit (2026-03-22) identified 22 concerns across security, quality, accessibility, SEO, and performance — all targeted for v1.6.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CSS overlay hotspots for rune glow | No new image assets needed, pure CSS, maintainable | ✓ Good — 14 runes positioned with radial gradient overlays |
| Staggered pulse timing | Each rune at its own rhythm feels organic, like embers | ✓ Good — power-curve entrance cascade + per-rune breathing |
| Sync animation via image onLoad | Prevents text animation playing over empty gradient | ✓ Good — dual-path detection covers all load scenarios |
| Convert Hero to client component | Need onLoad callback from Image — requires 'use client' | ✓ Good — minimal JS, most logic is CSS-driven |
| Separate heroTextReveal keyframe | Hero needs more visual presence at large sizes (24px vs 20px) | ✓ Good — distinct from body fadeInUp |
| 600ms delay between bg and text reveal | Two-beat rhythm (350ms blur + 250ms pause) | ✓ Good — feels coordinated and intentional |
| 14 runes (not 13) | Visual inspection found additional rune missed by research | ✓ Good — all runes covered |
| Color distribution 6 teal / 4 amber / 4 gold | Adjusted from strict aett grouping for visual balance | ✓ Good — balanced across image |
| Manual position calibration | Research estimates were off 5-15% in both axes | ✓ Good — pixel-precise alignment |
| No mix-blend-mode | Preserves GPU-composited opacity animation | ✓ Good — smooth performance |
| @upstash/redis over deprecated @vercel/kv | @vercel/kv deprecated Dec 2024, @upstash/redis is the direct replacement | ✓ Good — future-proof, same underlying service |
| Two-step SET NX + conditional INCR | Correctness over ~1-2ms latency for dedup enforcement | ✓ Good — repeat POSTs never inflate count |
| localStorage view cache over shimmer | Shimmer felt jarring; cached count provides instant display on return visits | ✓ Good — flicker-free UX |
| Render-prop pattern for listing view counts | Keeps PostCard server-renderable while ListingViewCounts owns client boundary | ✓ Good — clean server/client split |
| Batch redis.mget() for listing page | Single round-trip retrieval vs N individual fetches | ✓ Good — efficient at any post count |
| No slug validation against published posts | Orphan Redis keys are harmless, zero-cost simplification | ✓ Good — simpler API |
| Polymorphic chip components (display/link/toggle) | Single component serves all contexts without code duplication | ✓ Good — zero regression on existing usage sites |
| renderChip prop delegation on FilterBar | FilterBar never imports specific chip components; parent controls appearance | ✓ Good — reusable across blog and projects |
| Mutually exclusive class pattern for toggle states | Avoids tailwind-merge conflicts with custom shadow tokens | ✓ Good — deterministic styling |
| window.history.replaceState for URL filter updates | Avoids router.replace re-renders while Next.js syncs with useSearchParams | ✓ Good — lightweight URL updates |
| Suspense boundary for useSearchParams | Isolates client island in static page; preserves static generation | ✓ Good — /blog and /projects remain static routes |
| Static counts (total per tag/stack) | Simpler than contextual counts; more useful for small content sets | ✓ Good — shows content distribution at a glance |
| Grid fades as a unit (not individual cards) | Cleaner visual for small card counts | ✓ Good — consistent transition |
| useRef initial-render guard for fade | Prevents flash-of-invisible-content on page load with URL-preloaded filters | ✓ Good — no FOIC |

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
*Last updated: 2026-04-02 after v1.6 milestone started*
