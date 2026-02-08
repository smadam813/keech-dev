# Hero Polish

## What This Is

Visual polish and bug fix for the keech.dev hero section. The home page background image loads slowly during client-side navigation, causing the "keech.dev" text animation to play over a bare gradient. This project syncs the animation with image readiness and adds a staggered rune glow effect to the Elder Futhark runes in the hero image.

## Core Value

The hero section must feel polished and intentional — the "keech.dev" text animation should never play until the background is fully visible.

## Requirements

### Validated

- ✓ Hero section displays full-bleed background image (hero.webp) with text overlay — existing
- ✓ "keech.dev" text uses fadeInUp animation — existing
- ✓ Dark gradient scrim ensures WCAG AA text contrast — existing
- ✓ Respects prefers-reduced-motion — existing
- ✓ Static generation, no client-side data fetching — existing

### Active

- [ ] Text animation waits for background image to be loaded/decoded before playing
- [ ] Back-button navigation remains fast (bfcache not broken)
- [ ] CSS radial gradient hotspots overlay each rune in the hero image
- [ ] Rune hotspots pulse with staggered timing (ember-like glow)
- [ ] Rune glow effect respects prefers-reduced-motion
- [ ] No layout shift or flash of unstyled content during navigation

### Out of Scope

- Hero redesign or layout changes — keeping current composition
- New image assets or image layer splitting — pure CSS overlay approach
- Dark mode — single theme is the brand
- Interactive rune effects (hover, scroll-triggered) — ambient only
- Other pages or components — hero section only

## Context

- The hero image is a 185KB .webp with Elder Futhark runes scattered across an aurora sky, Yggdrasil tree, and mountain range
- Currently a server component using Next.js `<Image>` with `fill`, `placeholder="blur"`, and static import
- The `animate-on-load` CSS class fires a 0.6s fadeInUp immediately on mount
- Client-side navigation remounts the component, triggering the animation before the image is decoded
- Browser back button uses bfcache, preserving the fully rendered page (hence the speed difference)
- Rune positions in the image need to be manually mapped for CSS overlay hotspots
- The site uses Tailwind CSS v4 with CSS-first configuration (no tailwind.config.js)

## Constraints

- **Tech stack**: Must stay within Next.js + Tailwind CSS + existing tooling
- **Performance**: Hero component should remain lightweight — no heavy JS libraries for effects
- **Accessibility**: All animations must respect prefers-reduced-motion
- **Image**: No modifications to hero.webp — effects are pure CSS overlays

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CSS overlay hotspots for rune glow | No new image assets needed, pure CSS, maintainable | — Pending |
| Staggered pulse timing | Each rune at its own rhythm feels organic, like embers | — Pending |
| Sync animation via image onLoad | Prevents text animation playing over empty gradient | — Pending |
| Convert Hero to client component | Need onLoad callback from Image — requires 'use client' | — Pending |

---
*Last updated: 2026-02-08 after initialization*
