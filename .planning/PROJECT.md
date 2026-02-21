# keech.dev

## What This Is

Personal portfolio/blog at keech.dev built with Next.js 16, React 19, Tailwind CSS v4, and Velite for MDX content. Features a neobrutalist visual identity with Norse-themed hero section including load-gated reveal animation and ambient rune glow effects.

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

## Current Milestone: v1.4 Blog Stats

**Goal:** Add public view counts and reading time to blog posts — the site's first backend integration.

**Target features:**
- Public view counts on blog posts (backed by Vercel KV)
- Reading time estimates calculated at build time
- API route for view count tracking

### Active

- [ ] Public view counts displayed on blog post pages and blog listing
- [ ] View count persistence via Vercel KV (Upstash Redis)
- [ ] API route for incrementing and fetching view counts
- [ ] Reading time estimates on blog post pages and blog listing

### Out of Scope

- Hero redesign or layout changes — keeping current composition
- New image assets or image layer splitting — pure CSS overlay approach
- Dark mode — single theme is the brand
- Interactive rune effects (hover, scroll-triggered) — ambient only
- Canvas-based ambient glow — over-engineered for static image
- Particle system / floating runes — clashes with neobrutalist identity
- Framer Motion or GSAP — zero-library codebase precedent

## Context

Shipped v1.3 Hero Polish with 691 LOC across 3 source files (TypeScript + CSS).
Tech stack: Next.js 16, React 19, Tailwind CSS v4, Velite, MDX.
Hero section now has load-gated two-beat reveal and 14 ambient rune glows.
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

## Constraints

- **Tech stack**: Next.js + Tailwind CSS + existing tooling only
- **Performance**: Lightweight — no heavy JS libraries for effects
- **Accessibility**: All animations must respect prefers-reduced-motion
- **Image**: No modifications to hero.webp — effects are pure CSS overlays
- **Theme**: Single theme only (no dark mode) — the palette is the brand

---
*Last updated: 2026-02-21 after v1.4 milestone start*
