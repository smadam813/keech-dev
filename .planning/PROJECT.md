# keech.dev

## What This Is

Personal portfolio/blog at keech.dev built with Next.js 16, React 19, Tailwind CSS v4, and Velite for MDX content. Features a neobrutalist visual identity with Norse-themed hero section including load-gated reveal animation and ambient rune glow effects. Blog posts display public view counts backed by Upstash Redis.

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

### Active

## Current Milestone: v1.5 Tag Filtering

**Goal:** Add multi-select filtering to blog and project listing pages using existing tags and stack data.

**Target features:**
- Blog listing filter bar with multi-tag selection (AND logic)
- Projects listing filter bar with multi-stack selection (AND logic)
- In-place filtering without page navigation

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

## Context

Shipped v1.4 Blog Stats with 291 LOC across 11 source files (TypeScript).
Tech stack: Next.js 16, React 19, Tailwind CSS v4, Velite, MDX, Upstash Redis.
Hero section has load-gated two-beat reveal and 14 ambient rune glows.
Blog posts display public view counts backed by Upstash Redis with IP deduplication.
Blog listing page batch-fetches counts via redis.mget() with localStorage caching.
Site is statically generated and deployed via git-push to Vercel.

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

## Constraints

- **Tech stack**: Next.js + Tailwind CSS + existing tooling only
- **Performance**: Lightweight — no heavy JS libraries for effects
- **Accessibility**: All animations must respect prefers-reduced-motion
- **Image**: No modifications to hero.webp — effects are pure CSS overlays
- **Theme**: Single theme only (no dark mode) — the palette is the brand

---
*Last updated: 2026-02-22 after v1.5 milestone started*
