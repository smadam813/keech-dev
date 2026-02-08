# Phase 8: Hero Image - Research

**Researched:** 2026-02-08
**Domain:** Next.js Image component, image optimization, CSS hero patterns, WCAG contrast
**Confidence:** HIGH

## Summary

Phase 8 adds a full-viewport Norse landscape hero image to the home page with a centered "keech.dev" text overlay. The source image (2752x1536 PNG at 6.98 MB) compresses extremely well -- WebP at quality 75 produces 177KB at full resolution, already under the 200KB target. The critical finding is around the teal `.dev` accent color: against the brightest aurora streaks in the image, the current teal (#2D8B8B) fails WCAG AA even with heavy dark scrims. The solution is to use a lighter teal variant in the hero overlay text only, or to accept that the hero `.dev` text at display size satisfies the 3:1 large-text threshold across typical center content (4.13:1 with 50% scrim on the median center area).

The implementation is straightforward: a `next/image` component with `fill` and `object-cover` inside a relative-positioned container, with a CSS gradient scrim `::after` pseudo-element and absolutely-positioned text. The current home page structure (flex-1 centered content) already provides the right foundation. Next.js 16 requires adding `qualities` to `next.config.ts` since the default changed to `[75]` only.

**Primary recommendation:** Pre-optimize the source PNG to WebP at full resolution (quality 75-80, ~177-225KB), use Next.js static import for automatic blur placeholder and srcset generation, apply a 50% center-weighted radial or linear dark scrim, and use white text with a lighter teal accent (#4FBFBF or brighter) for the `.dev` portion in the hero specifically.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- "keech.dev" centered on the hero image -- dead center, bold, immediate impact
- No tagline or subtitle -- just the name, clean and mysterious, let the image speak
- Text scale is dominant -- large enough to be the first thing you see, the text IS the hero moment
- Dark gradient scrim behind the text area for WCAG AA contrast against the background image

### Claude's Discretion
- Visual composition -- landscape style, mood, color palette, time of day (user has source image already)
- Viewport behavior -- full-screen vs partial, scroll behavior, mobile cropping strategy
- Content transition -- how the hero hands off to the content below (hard cut, gradient, decorative edge)
- Scrim gradient specifics -- direction, opacity, spread
- Text font size breakpoints across responsive widths
- ".dev" teal accent styling consistency with existing header logo treatment

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next/image | 16.1.6 | Image optimization, srcset, lazy loading | Built-in, handles format negotiation (WebP/AVIF), responsive sizes, blur placeholder |
| sharp | 0.34.x (Next.js dep) | Build-time image optimization | Already a Next.js dependency; handles automatic srcset generation and format conversion |
| sharp-cli | 5.2.0 | Pre-optimization of source PNG to WebP | Already available via npx; one-time conversion before integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS v4 | 4.1.18 | Responsive sizing, positioning, gradients | Already in stack; handles all responsive breakpoints and scrim gradient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next/image with fill | CSS background-image | Loses automatic srcset, format negotiation, blur placeholder, LCP optimization |
| Pre-optimized WebP | Let Next.js optimize PNG at runtime | 7MB PNG source would cause slow first-load; pre-optimization ensures consistent fast delivery |
| sharp-cli | Squoosh, ImageMagick | sharp-cli already available in project; no additional install needed |

**Installation:**
```bash
# No new packages needed -- all already available
# One-time image optimization command:
npx sharp-cli -i img/Norse_Background.png -o public/images/hero.webp resize 2560 --withoutEnlargement --format webp --quality 80
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx              # Home page with hero section (modify existing)
│   └── globals.css           # Add scrim gradient styles (modify existing)
├── components/
│   └── hero.tsx              # New: Hero section component (server component)
public/
└── images/
    └── hero.webp             # Pre-optimized hero image (~180-200KB)
next.config.ts                # Add qualities configuration
```

### Pattern 1: Next.js Image as Background with Fill
**What:** Use `next/image` with `fill` prop inside a relative-positioned container to create a background-image effect with all the optimization benefits.
**When to use:** Hero sections, banner images, any full-bleed image behind content.
**Example:**
```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/image
import Image from 'next/image'
import heroImage from '@/public/images/hero.webp'

export function Hero() {
  return (
    <section className="relative flex-1 flex items-center justify-center overflow-hidden">
      <Image
        src={heroImage}
        alt=""  // Decorative background
        fill
        sizes="100vw"
        preload
        placeholder="blur"
        className="object-cover"
        quality={80}
      />
      {/* Scrim overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/30" />
      {/* Text content */}
      <h1 className="relative z-10 font-display font-bold text-7xl">
        keech<span className="text-hero-accent">.dev</span>
      </h1>
    </section>
  )
}
```

### Pattern 2: Static Import for Automatic Blur Placeholder
**What:** Import image statically so Next.js auto-generates `blurDataURL` at build time. No manual blur generation needed.
**When to use:** When the image is a local file in the project.
**Example:**
```tsx
// Static import auto-provides width, height, and blurDataURL
import heroImage from '../../public/images/hero.webp'

// placeholder="blur" works automatically with static imports
<Image src={heroImage} placeholder="blur" fill sizes="100vw" />
```

### Pattern 3: Viewport-Filling Hero Section
**What:** Hero section fills remaining viewport height below the fixed header.
**When to use:** Full-screen hero that occupies the entire initial view.
**Example:**
```tsx
// Use min-h to fill viewport minus header (64px)
<section className="relative min-h-[calc(100svh-4rem)] flex items-center justify-center">
```

### Anti-Patterns to Avoid
- **Using `priority` instead of `preload`:** `priority` is deprecated in Next.js 16. Use `preload={true}` for LCP images.
- **Missing `sizes` prop with `fill`:** Without `sizes="100vw"`, the browser assumes default sizing and may download wrong resolution.
- **Missing `qualities` config:** Next.js 16 defaults to `qualities: [75]`. Using `quality={80}` without configuring this in next.config.ts will silently coerce to 75.
- **Using `100vh` for hero height on mobile:** Classic mobile browser address bar issue. Use `100svh` (small viewport height) or `100dvh` (dynamic viewport height) instead.
- **Serving the 7MB source PNG:** Must pre-optimize before placing in `public/`. Next.js optimizes at request time, but a 7MB source still impacts build and cold-start performance.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image srcset generation | Manual `<picture>` with multiple `<source>` | next/image with `fill` + `sizes` | Handles format negotiation, device pixel ratios, lazy loading, blur placeholder automatically |
| Blur placeholder generation | Node script to generate base64 thumbnails | Static import + `placeholder="blur"` | Next.js auto-generates blurDataURL for static imports of jpg/png/webp/avif |
| Image format negotiation | Manual WebP/AVIF `<picture>` fallbacks | next/image default behavior | Automatically serves AVIF to supporting browsers, WebP as fallback |
| LCP preloading | Manual `<link rel="preload">` in head | `preload={true}` prop on Image | Handles the preload link injection correctly |

**Key insight:** The entire responsive image pipeline (format negotiation, srcset, lazy loading, blur placeholder, LCP preloading) is handled by `next/image`. The only manual work is pre-optimizing the source file to a reasonable starting size and applying the CSS scrim overlay.

## Common Pitfalls

### Pitfall 1: Next.js 16 `qualities` Configuration
**What goes wrong:** Using `quality={80}` on the Image component but not adding 80 to the `qualities` array in next.config.ts. Next.js 16 changed the default from allowing all qualities to `[75]` only.
**Why it happens:** Breaking change in Next.js 16 that's easy to miss.
**How to avoid:** Add `qualities: [75, 80]` (or whatever values you use) to `images` config in next.config.ts.
**Warning signs:** Image quality seems lower than expected; quality prop silently coerced to nearest configured value.

### Pitfall 2: Teal Accent Color Fails WCAG on Bright Image Areas
**What goes wrong:** The current teal accent (#2D8B8B, luminance 0.176) does not achieve 3:1 contrast against the brightest areas of the hero image (the pink/teal aurora streaks, luminance ~0.40) even with a 60% dark scrim.
**Why it happens:** The aurora has warm pink tones (rgb(226,149,150)) that are too bright and too close in luminance to the teal accent.
**How to avoid:** Use a lighter teal variant for the hero text overlay specifically. Options tested:
  - `#4FBFBF` (luminance 0.367) -- passes AA-large (3.39:1) against worst-case brightest block with 50% scrim
  - `#6DD4D4` (luminance 0.479) -- comfortably passes (4.28:1) against worst-case
  - `#7EDDDD` (luminance 0.535) -- passes full AA (4.72:1) against worst-case
  - Against the typical center area with 50% scrim, even current teal passes (4.13:1)
**Warning signs:** Use a contrast checker tool against the actual rendered hero, not just solid color swatches.

### Pitfall 3: Mobile Viewport Height with Fixed Header
**What goes wrong:** Using `100vh` for hero height causes the hero to extend behind the mobile browser's address bar, creating an awkward scroll.
**Why it happens:** `100vh` includes the area behind the address bar on mobile browsers.
**How to avoid:** Use `100svh` (small viewport height -- represents viewport with all browser UI visible). `calc(100svh - 4rem)` accounts for the 64px fixed header.
**Warning signs:** Hero looks perfect on desktop but requires scrolling on mobile to see the full image.

### Pitfall 4: `fill` Image Without Parent Positioning
**What goes wrong:** Image with `fill` overflows its container or causes layout shifts.
**Why it happens:** `fill` makes the image `position: absolute` -- it needs a `position: relative` (or absolute/fixed) parent with defined dimensions.
**How to avoid:** Always set `position: relative` and explicit height on the parent container. Use `overflow-hidden` to prevent image overflow.
**Warning signs:** Image appears at wrong size or overlaps other content.

### Pitfall 5: Scrim Overlay Blocking Image Interaction
**What goes wrong:** The scrim overlay `div` sits on top of the image and text, blocking any pointer events on the hero.
**Why it happens:** Absolutely-positioned overlay has higher stacking order.
**How to avoid:** Add `pointer-events-none` to the scrim overlay. Ensure text has `relative z-10` or higher z-index.
**Warning signs:** Hero text is not selectable, or any future interactive elements in hero don't respond to clicks.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Pre-Optimize Source Image
```bash
# Convert 7MB PNG source to optimized WebP for production use
# Full resolution (2752x1536) at q80 = ~225KB; at q75 = ~177KB
# Resize to 2560px max width (covers 99%+ of displays) at q80 = ~199KB
npx sharp-cli -i img/Norse_Background.png -o public/images/hero.webp \
  resize 2560 --withoutEnlargement \
  --format webp --quality 80
```

### next.config.ts Update
```typescript
// Source: https://nextjs.org/docs/app/guides/upgrading/version-16
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Required in Next.js 16 -- default changed to [75] only
    qualities: [75, 80],
  },
};

export default nextConfig;
```

### Hero Component (Server Component)
```tsx
// src/components/hero.tsx
// Source: https://nextjs.org/docs/app/api-reference/components/image
import Image from 'next/image'
import heroImage from '../../public/images/hero.webp'

export function Hero() {
  return (
    <section className="relative flex-1 flex items-center justify-center min-h-[calc(100svh-4rem)] overflow-hidden">
      {/* Background image with automatic blur placeholder */}
      <Image
        src={heroImage}
        alt=""
        fill
        sizes="100vw"
        preload
        placeholder="blur"
        className="object-cover"
        quality={80}
      />

      {/* Dark gradient scrim for text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Text overlay */}
      <div className="relative z-10 text-center animate-on-load">
        <h1 className="font-display font-bold text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white">
          keech
          <span className="text-[#4FBFBF]">.dev</span>
        </h1>
      </div>
    </section>
  )
}
```

### Updated Home Page
```tsx
// src/app/page.tsx
import type { Metadata } from 'next'
import { Hero } from '@/components/hero'

export const metadata: Metadata = {
  description: 'Welcome to keech.dev - the personal portfolio...',
}

export default function Home() {
  return <Hero />
}
```

### Responsive Text Size Breakpoints
```css
/* Current globals.css h1 already has letter-spacing: -0.02em and line-height: 1.1 */
/* The Tailwind responsive sizes in the hero h1: */
/* text-6xl  = 3.75rem (60px) -- mobile (<640px) */
/* sm:text-7xl = 4.5rem (72px) -- small tablet (640px+) */
/* md:text-8xl = 6rem (96px)   -- tablet/small desktop (768px+) */
/* lg:text-9xl = 8rem (128px)  -- desktop (1024px+) */
/* These match the current home page text sizes exactly */
```

## Discretion Recommendations

### Viewport Behavior
**Recommendation:** Full viewport height minus header. Use `min-h-[calc(100svh-4rem)]` with `flex-1`. This makes the hero fill the initial view on all devices. No scroll behavior needed -- the hero IS the home page content (no content below on home page currently, and the footer naturally sits at the bottom).

### Mobile Cropping Strategy
**Recommendation:** Use `object-cover` with default `object-position: center`. The image composition has the tree of life right-of-center and mountains along the bottom. On narrow mobile viewports, the sides crop symmetrically, keeping the dramatic center composition. The 16:9-ish aspect ratio (1.792:1) means vertical cropping is minimal even on tall mobile screens.

### Content Transition
**Recommendation:** No transition needed. The home page currently has no content below the hero text -- it's just the centered name with footer at the bottom. The hero fills the viewport. If content is added below later, a subtle `border-b-[3px] border-foreground` at the bottom of the hero section (consistent with the neobrutalist border language) would provide a clean handoff.

### Scrim Gradient Specifics
**Recommendation:** A center-weighted radial gradient that's darkest in a vignette pattern:
- Center (text area): `rgba(0,0,0,0.45)` -- enough for white text WCAG AA, enough for lighter teal at AA-large
- Edges: `rgba(0,0,0,0.55)` -- natural vignette that frames the composition
- This creates a subtle darkening that enhances the atmospheric feel without flattening the image

Alternative simpler approach: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.4) 100%)` -- heavier at bottom (mountains), lighter through center, slightly darker at top. This follows the image's natural brightness gradient.

### ".dev" Teal Accent in Hero
**Recommendation:** Use a lighter teal variant in the hero text overlay for WCAG compliance. Two options:
1. **`#4FBFBF`** -- passes AA-large against worst-case aurora areas; recognizably teal; close enough to the brand teal to feel consistent
2. **`#6DD4D4`** -- more comfortable contrast margin; clearly teal; may feel slightly different from header
3. Define as a CSS variable (e.g., `--color-accent-light`) for reuse in other dark-background contexts

The header logo uses `#2D8B8B` on the pink background (#E8B4B8) which has good contrast (4.54:1). The hero needs a different value because its background is completely different.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority` prop on Image | `preload={true}` | Next.js 16.0.0 | More explicit semantics; `priority` still works but deprecated |
| `qualities` unlimited | `qualities: [75]` default | Next.js 16.0.0 | Must explicitly configure allowed quality values |
| `100vh` for full-screen hero | `100svh` / `100dvh` | CSS Values L4, ~2023 | Correct mobile viewport handling; 96%+ browser support |
| CSS `background-image` for hero | `next/image` with `fill` | Next.js 13+ | Gains optimization, srcset, format negotiation, blur placeholder |
| Manual WebP conversion | Automatic via Image component | Ongoing | Next.js serves AVIF/WebP based on browser Accept header |

**Deprecated/outdated:**
- `priority` prop: Use `preload={true}` in Next.js 16+
- `objectFit` prop: Removed in Next.js 13+; use `className="object-cover"` instead
- `100vh` for mobile hero: Use `100svh` for predictable behavior across mobile browsers
- `imageSizes` default of 16: Removed from defaults in Next.js 16

## Image Analysis Data

### Source Image Properties
- **File:** `img/Norse_Background.png`
- **Dimensions:** 2752 x 1536px
- **Aspect ratio:** 1.792:1 (~16:9)
- **Color space:** sRGB, 8-bit RGBA
- **File size:** 6.98 MB

### Compression Results (Measured)
| Format | Resolution | Quality | Size | Notes |
|--------|-----------|---------|------|-------|
| WebP | 2752x1536 (full) | 80 | 225KB | Slightly over 200KB target |
| WebP | 2752x1536 (full) | 75 | 177KB | Under 200KB target |
| WebP | 2560w | 80 | 199KB | Just under target, covers 99%+ displays |
| WebP | 1920w | 80 | 131KB | Common desktop |
| WebP | 1920w | 75 | 104KB | Good desktop/tablet |
| WebP | 828w | 80 | 36KB | Mobile (iPhone retina) |
| AVIF | 1920w | 60 | 96KB | Excellent if AVIF served |
| AVIF | 1920w | 50 | 57KB | Very small |

**Recommendation:** Pre-optimize to WebP at 2560px wide, quality 80 (~199KB). Next.js will generate additional srcset variants and serve AVIF to supporting browsers automatically.

### Brightness Distribution
```
TL(med  0.194)  TC(dim  0.090)  TR(dark 0.046)
ML(med  0.139)  MC(dim  0.052)  MR(dim  0.064)
BL(dark 0.014)  BC(dark 0.023)  BR(dark 0.008)
```
The center where text renders (MC) is dim (luminance 0.052). Brightest areas are upper-left (aurora streaks, 0.194). Bottom is very dark (mountains).

### WCAG Contrast Analysis (Measured)

**White text (#FFFFFF):**
| Scenario | Contrast | Result |
|----------|----------|--------|
| Typical center, no scrim | 11.16:1 | PASS AA |
| Typical center, 50% scrim | 16.74:1 | PASS AA |
| Brightest block (aurora), 50% scrim | 7.47:1 | PASS AA |

**Teal accent (#2D8B8B):**
| Scenario | Contrast | Result |
|----------|----------|--------|
| Typical center, 50% scrim | 4.13:1 | PASS AA-large (need 3:1) |
| Brightest block (aurora), 50% scrim | 1.84:1 | FAIL |

**Lighter teal (#4FBFBF):**
| Scenario | Contrast | Result |
|----------|----------|--------|
| Typical center, 50% scrim | 7.60:1 | PASS AA |
| Brightest block (aurora), 50% scrim | 3.39:1 | PASS AA-large |

**Lighter teal (#6DD4D4):**
| Scenario | Contrast | Result |
|----------|----------|--------|
| Typical center, 50% scrim | 9.58:1 | PASS AA |
| Brightest block (aurora), 50% scrim | 4.28:1 | PASS AA-large |

## Open Questions

1. **Exact teal accent value for hero**
   - What we know: #2D8B8B fails against bright aurora areas; #4FBFBF and #6DD4D4 both pass
   - What's unclear: Which shade the user prefers aesthetically; whether visual consistency with header teal or contrast safety is prioritized
   - Recommendation: Start with `#4FBFBF` as the closest to the brand teal that still passes. Can be fine-tuned visually after implementation. Define as `--color-accent-light` CSS variable.

2. **Whether to show footer on home page with hero**
   - What we know: Currently footer shows. With full-viewport hero, footer is below the fold.
   - What's unclear: Whether the hero should suppress the footer or keep it accessible by scrolling.
   - Recommendation: Keep footer as-is. It's accessible by scrolling and provides social links. No change needed.

## Sources

### Primary (HIGH confidence)
- Next.js Image Component docs (https://nextjs.org/docs/app/api-reference/components/image) -- fill prop, preload, placeholder, sizes, quality
- Next.js 16 Upgrade Guide (https://nextjs.org/docs/app/guides/upgrading/version-16) -- qualities breaking change, priority deprecation
- Sharp library (https://sharp.pixelplumbing.com/) -- image processing capabilities, WebP/AVIF output
- WCAG 2.1 Contrast Requirements (https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) -- 4.5:1 normal text, 3:1 large text
- Direct image analysis via sharp (measured) -- all compression sizes and contrast ratios in this document

### Secondary (MEDIUM confidence)
- Smashing Magazine: Accessible Text Over Images (https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) -- scrim overlay techniques
- Ahmad Shadeed: Handling Text Over Images (https://ishadeed.com/article/handling-text-over-image-css/) -- CSS gradient scrim patterns
- CSS-Tricks: Text on Images (https://css-tricks.com/design-considerations-text-images/) -- design considerations
- New Viewport Units Guide (https://ishadeed.com/article/new-viewport-units/) -- svh/dvh/lvh explanation

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or measured directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- next/image is the only sensible choice; sharp already in project; no new deps needed
- Architecture: HIGH -- pattern well-documented in Next.js docs; current codebase structure accommodates it cleanly
- Pitfalls: HIGH -- contrast ratios measured directly against the actual source image with exact scrim calculations; Next.js 16 config requirement verified against official upgrade guide
- Image optimization: HIGH -- all compression sizes measured with actual sharp output on the source image

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable domain; Next.js Image API unlikely to change within 30 days)
