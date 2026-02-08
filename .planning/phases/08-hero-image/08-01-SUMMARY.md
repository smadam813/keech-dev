---
phase: 08-hero-image
plan: 01
subsystem: ui
tags: [next-image, webp, hero, responsive, wcag, sharp]

# Dependency graph
requires:
  - phase: 07-norse-typography
    provides: Norse display font (font-display) and bold weight styling
provides:
  - Full-viewport Hero component with Norse landscape background
  - Optimized WebP hero image at public/images/hero.webp
  - --color-accent-light CSS variable for dark background contexts
  - Next.js image qualities configuration
affects: [08-02, hero-refinements, responsive-layout]

# Tech tracking
tech-stack:
  added: [sharp-cli (dev tooling for image optimization)]
  patterns: [static image import for blur placeholder, radial gradient scrim overlay, server component hero]

key-files:
  created:
    - public/images/hero.webp
    - src/components/hero.tsx
  modified:
    - next.config.ts
    - src/app/page.tsx
    - src/app/globals.css

key-decisions:
  - "Static import for hero image enables automatic blurDataURL generation without manual base64"
  - "Radial gradient scrim (50% center / 35% mid / 55% edges) instead of linear for natural vignette effect"
  - "--color-accent-light (#4FBFBF) as separate variable rather than reusing --color-accent for dark backgrounds"
  - "preload prop (Next.js 16) instead of deprecated priority for LCP optimization"
  - "qualities: [75, 80] in next.config.ts to prevent silent coercion of quality={80} to 75"

patterns-established:
  - "Hero pattern: server component with static image import, gradient scrim, text overlay"
  - "Dark background accent: use --color-accent-light for WCAG AA compliance on dark surfaces"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 8 Plan 1: Hero Image Summary

**Full-viewport Norse hero with optimized 199KB WebP, radial gradient scrim, and WCAG-compliant centered "keech.dev" text overlay**

## Performance

- **Duration:** 2 min 28 sec
- **Started:** 2026-02-08T05:43:17Z
- **Completed:** 2026-02-08T05:45:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Pre-optimized 7MB Norse landscape PNG to 199KB WebP (97% reduction) at 2560px max width
- Created Hero server component with full-viewport background, dark radial scrim, and centered text overlay
- Added --color-accent-light (#4FBFBF) CSS variable for WCAG AA compliance on dark backgrounds
- Configured Next.js image qualities to support quality={80} without silent coercion

## Task Commits

Each task was committed atomically:

1. **Task 1: Pre-optimize hero image and configure Next.js** - `f9873d7` (feat)
2. **Task 2: Create Hero component, update home page, add CSS variable** - `5064615` (feat)

## Files Created/Modified
- `public/images/hero.webp` - Optimized Norse landscape hero background (199KB WebP)
- `src/components/hero.tsx` - Hero server component with image, scrim overlay, centered text
- `next.config.ts` - Added qualities: [75, 80] for image optimization
- `src/app/page.tsx` - Updated to render Hero component instead of plain centered text
- `src/app/globals.css` - Added --color-accent-light (#4FBFBF) CSS variable

## Decisions Made
- Used static image import (`import heroImage from '../../public/images/hero.webp'`) for automatic blurDataURL generation -- Next.js extracts blur placeholder at build time from static imports, no manual base64 needed
- Applied radial gradient scrim (50% center, 35% middle ring, 55% edges) instead of linear gradient for natural vignette effect that draws the eye to center text
- Created separate --color-accent-light (#4FBFBF) variable rather than modifying --color-accent -- the standard teal (#2D8B8B) is for light backgrounds, the lighter variant is specifically for WCAG AA on dark surfaces
- Used `preload` prop instead of `priority` on the Image component -- `priority` is deprecated in Next.js 16 in favor of `preload`
- Added `qualities: [75, 80]` to next.config.ts because Next.js 16 defaults to only [75], meaning quality={80} on the component would silently coerce to 75 without this configuration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npm run lint` (`next lint`) fails with a circular JSON serialization error in the ESLint/Next.js compat layer. This is a pre-existing issue unrelated to hero implementation (ESLint 9 + Next.js 16 FlatCompat layer conflict). Build with TypeScript checking passes cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Hero component is fully functional and ready for Plan 02 (responsive polish, animation, visual refinements)
- The --color-accent-light variable is available for any future dark-background text scenarios
- Image optimization pipeline (sharp-cli) is validated for any future image needs

---
*Phase: 08-hero-image*
*Completed: 2026-02-08*
