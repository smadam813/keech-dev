# Architecture Patterns

**Domain:** Norse Typography and Decorative Rune Integration
**Researched:** 2026-02-07
**Confidence:** HIGH (verified against existing codebase, official Next.js 16 docs, and font/image APIs)

## Current Architecture Assessment

### What Exists Today

```
Font System:
  src/lib/fonts.ts
    ├── Space_Grotesk (next/font/google) → --font-display CSS variable
    └── Inter (next/font/google)         → --font-body CSS variable

  src/app/layout.tsx
    └── <html className={`${spaceGrotesk.variable} ${inter.variable}`}>

  src/app/globals.css
    └── @theme inline { --font-display: var(--font-display); --font-body: var(--font-body); }
    └── @layer base { h1-h6 { @apply font-display; } html { @apply font-body; } }

Home Page (src/app/page.tsx):
  └── Simple centered text: <h1>keech<span>.dev</span></h1>
      No hero image, no decorative elements, no background texture.

Asset Locations:
  fonts/norse/Norse.otf       (30KB, regular weight)
  fonts/norse/Norse-Bold.otf  (30KB, bold weight)
  img/Norse_Background.png    (7MB, hero image - NEEDS OPTIMIZATION)
  public/static/              (empty)
```

### Integration Points

The architecture has four clean integration seams:

1. **Font swap:** `src/lib/fonts.ts` is the single source for font configuration. Changing from `next/font/google` to `next/font/local` for the display font happens here and nowhere else. The CSS variable `--font-display` propagates automatically through `@theme inline` and `font-display` utility class references.

2. **Home page transformation:** `src/app/page.tsx` is a minimal Server Component with no dependencies. It can be restructured into a hero section without affecting any other page.

3. **Component system:** New decorative components slot into `src/components/` following the established pattern (Server Components by default, `'use client'` only when hooks are needed).

4. **CSS design tokens:** All visual tokens live in `globals.css` under `@theme`. New rune-related tokens (opacity values, animation keyframes) extend the existing system without modifying it.

## Recommended Architecture

### Component Map After Integration

```
src/
├── lib/
│   └── fonts.ts                    # MODIFIED: Norse local font replaces Space Grotesk
├── app/
│   ├── globals.css                 # MODIFIED: Add rune animation keyframes, texture utilities
│   └── page.tsx                    # MODIFIED: Hero section with background image
├── components/
│   ├── layout/
│   │   ├── header.tsx              # MODIFIED: Add rune accent to nav (optional)
│   │   └── footer.tsx              # MODIFIED: Add rune divider above footer (optional)
│   ├── decorative/                 # NEW DIRECTORY
│   │   ├── rune-divider.tsx        # NEW: Horizontal rune separator
│   │   ├── rune-accent.tsx         # NEW: Inline rune decorative mark
│   │   └── rune-texture.tsx        # NEW: CSS background texture wrapper
│   └── home/                       # NEW DIRECTORY
│       └── hero-section.tsx        # NEW: Hero image with text overlay
```

### Component Boundaries

| Component | File | Type | Responsibility | Communicates With |
|-----------|------|------|----------------|-------------------|
| **fonts.ts** | `lib/fonts.ts` | Module | Norse local font loading, CSS variable injection | Layout (className) |
| **HeroSection** | `home/hero-section.tsx` | Server | Hero background image, overlay text, CTA | Home page |
| **RuneDivider** | `decorative/rune-divider.tsx` | Server | Horizontal separator with rune glyphs | Any page/section boundary |
| **RuneAccent** | `decorative/rune-accent.tsx` | Server | Single or small cluster of decorative runes | Header, section headers |
| **RuneTexture** | `decorative/rune-texture.tsx` | Server | CSS background texture wrapper for sections | Any content section |

### Data Flow

```
Font Loading Flow:
==================

1. fonts.ts exports `norse` (localFont) and `inter` (Google font)
2. layout.tsx applies both CSS variables to <html>
3. globals.css @theme inline picks up --font-display, --font-body
4. Tailwind's font-display utility resolves to Norse font
5. All h1-h6 elements and .font-display classes render in Norse

     fonts/norse/Norse.otf
     fonts/norse/Norse-Bold.otf
            |
            v
    +------------------+
    | localFont({      |   src/lib/fonts.ts
    |   src: [...]     |
    |   variable:      |
    |   "--font-display"|
    | })               |
    +------------------+
            |
            v (norse.variable)
    +------------------+
    | <html className= |   src/app/layout.tsx
    |  norse.variable + |
    |  inter.variable>  |
    +------------------+
            |
            v (CSS custom property)
    +------------------+
    | @theme inline {  |   globals.css
    |   --font-display:|
    |   var(--font-    |
    |   display)       |
    | }                |
    +------------------+
            |
            v (Tailwind utility)
    +------------------+
    | font-display     |   Any component using
    | class resolves   |   the display font
    | to Norse         |
    +------------------+


Hero Image Flow:
================

1. Norse_Background.png stored in src/assets/ (static import for blur)
   OR public/img/ (URL reference, no blur)
2. HeroSection uses next/image with fill + preload
3. Parent div has relative positioning, full viewport height
4. Text content overlays with z-index layering

     img/Norse_Background.png
            |
            v (static import preferred)
    +------------------+
    | import heroImg   |   home/hero-section.tsx
    | from '@/assets/  |
    | hero.png'        |
    +------------------+
            |
            v
    +------------------+
    | <Image           |
    |   src={heroImg}  |
    |   fill           |
    |   preload        |   Next.js Image optimization
    |   placeholder=   |
    |   "blur"         |
    |   sizes="100vw"  |
    | />               |
    +------------------+


Decorative Rune Flow:
=====================

No data flow. Pure presentational Server Components.
Runes rendered as Unicode characters (U+16A0-U+16FF block)
styled with the Norse font, or as inline SVGs for custom shapes.
```

## Integration Details

### 1. Font Swap: next/font/google to next/font/local

**Current state:** `src/lib/fonts.ts` imports `Space_Grotesk` from `next/font/google`.

**Target state:** Replace with `localFont` from `next/font/local`, pointing to the OTF files in `fonts/norse/`.

```typescript
// src/lib/fonts.ts - AFTER modification
import localFont from "next/font/local";
import { Inter } from "next/font/google";

export const norse = localFont({
  src: [
    {
      path: "../../fonts/norse/Norse.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/norse/Norse-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

export const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
```

**Why this works with zero other changes:**
- The CSS variable name `--font-display` stays the same.
- `globals.css` references `--font-display` through `@theme inline` -- no change needed.
- Every component using `font-display` (headers, nav links, footer text) automatically renders in Norse.
- The `layout.tsx` change is minimal: rename `spaceGrotesk` import to `norse`.

```typescript
// src/app/layout.tsx - only change is the import name
import { norse, inter } from "@/lib/fonts";
// ...
<html lang="en" className={`${norse.variable} ${inter.variable}`}>
```

**Font file path resolution:** The `path` in `localFont` is relative to the file calling it (`src/lib/fonts.ts`). Since fonts live at `fonts/norse/Norse.otf` (project root), the relative path from `src/lib/` is `../../fonts/norse/Norse.otf`. Next.js resolves this at build time and inlines/optimizes the font.

**Font file size:** Both OTF files are ~30KB each. This is small enough that conversion to WOFF2 is optional (WOFF2 would save ~10-15KB total). The `next/font` system handles Content-Type and caching headers automatically.

**Weights available:** The Norse font provides only regular (400) and bold (700). The current Space Grotesk configuration loads weights 400, 500, 600, 700. After the swap, `font-medium` (500) and `font-semibold` (600) will fall back to the nearest available weight (400). This is acceptable because the Norse font is a display font used for headings and branding, where you typically only need regular and bold.

### 2. Hero Image Component

**Asset concern:** The hero image is 7MB PNG. This must be addressed before integration.

**Optimization strategy:** Move the PNG to a location where Next.js Image can optimize it, then let the built-in optimization handle format conversion (WebP/AVIF) and responsive sizing.

**Two approaches for the image source:**

**Approach A (recommended): Static import for automatic blur placeholder**

Move the image to a location importable by the component (e.g., `src/assets/hero-bg.png` or keep in `img/` and import with a relative path), then use a static import:

```typescript
// src/components/home/hero-section.tsx
import Image from 'next/image'
import heroBg from '../../../img/Norse_Background.png'
// Or if moved: import heroBg from '@/assets/hero-bg.png'

export function HeroSection() {
  return (
    <section className="relative w-full h-[80vh] min-h-[500px] overflow-hidden">
      <Image
        src={heroBg}
        alt=""
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        quality={80}
        className="object-cover"
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40 z-10" />
      {/* Content overlay */}
      <div className="relative z-20 flex items-center justify-center h-full px-6">
        <div className="text-center text-background animate-on-load">
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight">
            keech
            <span className="text-accent">.dev</span>
          </h1>
        </div>
      </div>
    </section>
  )
}
```

Static import advantages:
- Automatic `blurDataURL` generation at build time (blur-up placeholder while loading).
- Automatic `width` and `height` detection (no manual specification needed with `fill`).
- Next.js optimizes the 7MB PNG into responsive WebP/AVIF variants automatically.

**Approach B: Public directory with manual blur**

Move the image to `public/img/Norse_Background.png` and reference by URL path. Requires manually generating a `blurDataURL` or skipping the blur placeholder.

Approach A is recommended because the automatic blur placeholder significantly improves perceived performance for a 7MB source image.

**Where to place the source image for static import:**

Create `src/assets/` directory and move the hero image there. This keeps importable assets separate from `public/` (which is for files served as-is without optimization). Update `tsconfig.json` paths if desired, though a relative import works fine.

Alternatively, the image can stay at `img/Norse_Background.png` and be imported with a relative path from the component. The key requirement is that it must be importable (not in `public/`).

**Next.js 16 Image API notes:**
- Use `preload` (not the deprecated `priority` prop) to ensure the hero image loads eagerly as the LCP element.
- The `alt=""` is correct for decorative background images (empty alt communicates "decorative" to screen readers).
- `sizes="100vw"` tells the browser this image spans the full viewport width, allowing proper srcset selection.

### 3. Decorative Rune Components

**Implementation decision: Unicode characters, not SVG.**

The Elder Futhark runes exist in Unicode block U+16A0 to U+16FF. The 24 runes are:

```
ᚠ (F)  ᚢ (U)  ᚦ (Th) ᚨ (A)  ᚱ (R)  ᚲ (K)
ᚷ (G)  ᚹ (W)  ᚺ (H)  ᚾ (N)  ᛁ (I)  ᛃ (J)
ᛇ (Ei) ᛈ (P)  ᛉ (Z)  ᛊ (S)  ᛏ (T)  ᛒ (B)
ᛖ (E)  ᛗ (M)  ᛚ (L)  ᛝ (NG) ᛞ (D)  ᛟ (O)
```

**Why Unicode over SVG for rune glyphs:**
- The Norse font (Norse.otf) likely includes runic glyphs -- it is a font designed for Norse/runic typography. If it does, the runes render in the same aesthetic as the headings.
- Unicode characters are simpler than SVG: no path data to maintain, no viewBox calculations, just text nodes.
- They respond to `font-size`, `color`, `opacity`, and all CSS text properties naturally.
- Screen readers handle them correctly with `aria-hidden="true"` on the decorative wrapper.

**Fallback if Norse font lacks runic Unicode coverage:** Use a small inline SVG for each rune shape, or use a secondary webfont that covers the Runic block. Test the Norse.otf font file for U+16A0-U+16FF coverage during implementation.

#### RuneDivider Component

```typescript
// src/components/decorative/rune-divider.tsx

interface RuneDividerProps {
  runes?: string       // Custom rune sequence, defaults to a curated set
  className?: string
}

const DEFAULT_RUNES = 'ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ'

export function RuneDivider({
  runes = DEFAULT_RUNES,
  className = '',
}: RuneDividerProps) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={`flex items-center gap-4 my-8 ${className}`}
    >
      <div className="flex-1 h-[3px] bg-foreground" />
      <span className="font-display text-xl text-muted tracking-[0.5em] select-none">
        {runes}
      </span>
      <div className="flex-1 h-[3px] bg-foreground" />
    </div>
  )
}
```

**Key decisions:**
- `role="separator"` + `aria-hidden="true"`: Semantically correct for a decorative horizontal rule, hidden from screen readers.
- `font-display`: Renders in Norse font (or whatever --font-display resolves to).
- `select-none`: Prevents users from accidentally selecting decorative text.
- `tracking-[0.5em]`: Wide letter spacing for visual rhythm between rune glyphs.
- Server Component (no `'use client'` needed): Pure presentational, no hooks.

#### RuneAccent Component

```typescript
// src/components/decorative/rune-accent.tsx

interface RuneAccentProps {
  rune?: string        // Single rune character
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
}

export function RuneAccent({
  rune = 'ᚠ',
  size = 'md',
  className = '',
}: RuneAccentProps) {
  return (
    <span
      aria-hidden="true"
      className={`font-display text-accent select-none inline-block ${sizes[size]} ${className}`}
    >
      {rune}
    </span>
  )
}
```

**Usage in existing components:**
- Header logo: `keech<RuneAccent rune="ᚠ" size="sm" />.dev`
- Section headers: `<RuneAccent rune="ᚦ" /> Blog`
- Nav items: Small rune before or after active link

#### RuneTexture Component

For background textures, the decision is CSS-based patterns over image-based textures:

```typescript
// src/components/decorative/rune-texture.tsx
import { cn } from '@/lib/utils'

interface RuneTextureProps {
  children: React.ReactNode
  variant?: 'subtle' | 'medium'
  className?: string
}

export function RuneTexture({
  children,
  variant = 'subtle',
  className,
}: RuneTextureProps) {
  return (
    <div
      className={cn(
        'relative',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 pointer-events-none',
          variant === 'subtle' && 'opacity-[0.03]',
          variant === 'medium' && 'opacity-[0.06]',
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(RUNE_PATTERN_SVG)}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

// Inline SVG pattern - a few rune shapes arranged in a tile
const RUNE_PATTERN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <text x="30" y="60" font-size="24" fill="currentColor" opacity="0.5">ᚠ</text>
  <text x="100" y="40" font-size="20" fill="currentColor" opacity="0.3">ᚦ</text>
  <text x="160" y="80" font-size="22" fill="currentColor" opacity="0.4">ᚱ</text>
  <text x="50" y="130" font-size="18" fill="currentColor" opacity="0.3">ᚲ</text>
  <text x="130" y="150" font-size="26" fill="currentColor" opacity="0.5">ᛟ</text>
  <text x="20" y="180" font-size="20" fill="currentColor" opacity="0.4">ᚨ</text>
  <text x="170" y="190" font-size="16" fill="currentColor" opacity="0.3">ᛊ</text>
</svg>`
```

**Why CSS data URI over image file:**
- Zero network requests (pattern is inlined).
- Infinitely scalable (SVG, not raster).
- Tunable in code (change runes, positions, opacity without touching assets).
- Lightweight (~500 bytes vs a PNG texture that could be 50-200KB.

**Why not a plain CSS pattern:** Pure CSS (gradients, borders) cannot render rune shapes. The data URI SVG is the lightest approach that supports actual runic glyphs.

**Alternative approach if the SVG text rendering is inconsistent across browsers:** Replace the `<text>` elements with `<path>` elements tracing the rune shapes. This removes font dependency from the texture pattern. However, this adds complexity. Start with the `<text>` approach and only fall back to `<path>` if cross-browser testing reveals issues.

### 4. Image Optimization Strategy

The 7MB PNG hero image is too large to serve unoptimized. Next.js Image handles this, but the source file should also be addressed:

**Build-time optimization (automatic with next/image):**
- Next.js generates responsive variants (640w, 750w, 828w, 1080w, 1200w, 1920w, 2048w, 3840w by default).
- Converts to WebP and AVIF automatically based on `Accept` header.
- The 7MB PNG becomes ~200-500KB WebP at typical viewport widths.

**Source file optimization (manual, one-time):**
- Consider pre-compressing the source PNG or converting to a high-quality JPEG before committing. A 7MB PNG in git increases clone times.
- If the image has transparency, keep PNG. If it is a photograph/illustration without transparency, convert to JPEG at quality 90 (~1-2MB) before committing.

**Image placement for static import:**

```
Option A (recommended):
  src/assets/
    └── hero-bg.png      # Moved from img/Norse_Background.png

Option B:
  Keep img/Norse_Background.png where it is.
  Import with relative path: import heroBg from '../../../img/Norse_Background.png'
```

Option A is cleaner because `src/assets/` clearly communicates "these are build-time assets processed by the bundler" vs `public/` which means "serve as-is."

## Patterns to Follow

### Pattern 1: Server Components for Decorative Elements

**What:** All rune decorative components (RuneDivider, RuneAccent, RuneTexture) are Server Components.

**When:** Any component that is purely presentational with no interactivity, state, or browser APIs.

**Why:** Zero JavaScript shipped to the client. Decorative elements have no reason to be interactive. This is consistent with how Footer, PostCard, and TechBadge are already implemented in the codebase.

### Pattern 2: CSS Variable Font Propagation

**What:** Define fonts via `next/font`'s `variable` option, propagate through `@theme inline` in Tailwind v4, consume via utility classes (`font-display`, `font-body`).

**When:** Any font change or addition.

**Why:** This is the existing pattern in the codebase. It ensures a single source of truth for font configuration. Changing the font in `fonts.ts` automatically updates every element using `font-display`.

```
fonts.ts (source) → layout.tsx (injection) → globals.css (registration) → components (consumption)
```

### Pattern 3: Static Image Import for LCP Images

**What:** Import hero images as ES modules rather than referencing `/public/` paths.

**When:** Above-the-fold images that are the Largest Contentful Paint element.

**Why:** Static imports enable automatic `blurDataURL` generation, automatic width/height detection, and tree-shaking of unused images. For a 7MB hero image, the blur placeholder is essential for perceived performance.

```typescript
// YES - static import
import heroBg from '@/assets/hero-bg.png'
<Image src={heroBg} placeholder="blur" preload />

// NO - public path (no automatic blur)
<Image src="/img/hero-bg.png" width={1920} height={1080} preload />
```

### Pattern 4: Accessibility-First Decorative Elements

**What:** All decorative elements use `aria-hidden="true"`. Dividers use `role="separator"`. Decorative images use `alt=""`.

**When:** Any element that is purely visual and conveys no information.

**Why:** Screen readers skip these elements entirely. The site's content remains accessible without visual flourishes. This is consistent with the existing Lucide icon pattern in header.tsx (`aria-hidden="true"` on icons).

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using the Norse Font for Body Text

**What:** Applying the Norse display font to paragraph text, form inputs, or any long-form content.

**Why bad:** Display fonts with Norse/runic styling have reduced legibility at small sizes and in long passages. The existing Inter body font is optimized for reading. The Norse font should be reserved for headings, branding, and decorative elements only.

**Instead:** Keep `font-body` (Inter) for all body text. Use `font-display` (Norse) only for h1-h6, the logo, nav links, and intentional decorative uses.

### Anti-Pattern 2: Rune Components with Client-Side State

**What:** Making RuneDivider, RuneAccent, or RuneTexture client components with animation hooks.

**Why bad:** These are static decorative elements. Adding `'use client'` ships unnecessary JavaScript. If animation is desired, use CSS animations (consistent with the existing `animate-fade-in-up` pattern) controlled by the ScrollReveal wrapper that already exists.

**Instead:** Wrap decorative components in `<ScrollReveal>` if entrance animation is needed:
```tsx
<ScrollReveal>
  <RuneDivider />
</ScrollReveal>
```

### Anti-Pattern 3: Hero Image as CSS Background

**What:** Using `background-image: url(...)` in CSS instead of the Next.js Image component.

**Why bad:** CSS backgrounds bypass Next.js image optimization entirely. The 7MB PNG would be served as-is to all devices, with no responsive sizing, no format conversion (WebP/AVIF), no lazy loading, and no blur placeholder.

**Instead:** Always use `next/image` with `fill` for background-style images. The Image component handles all optimization automatically.

### Anti-Pattern 4: Importing Rune Glyphs as Individual SVG Files

**What:** Creating 24 separate SVG files (one per rune) and importing them individually.

**Why bad:** Over-engineering for decorative use. Each SVG import adds to the module graph. Unicode characters achieve the same visual result with zero file overhead when the font supports them.

**Instead:** Use Unicode characters (U+16A0 block) rendered in the Norse font. Only fall back to SVG `<path>` elements if the Norse font lacks runic glyph coverage.

## Build Order

The dependency graph for this milestone flows from foundation (font) to structure (hero) to decoration (runes):

```
Step 1: Font Swap (fonts.ts + layout.tsx)
    |    Replace Space Grotesk with Norse localFont
    |    Rename export from spaceGrotesk to norse
    |    Update layout.tsx import
    |    TEST: All headings render in Norse font. Body text unchanged.
    |    TEST: Dev server starts without errors.
    |    TEST: No layout shift (display: swap).
    |
    v
Step 2: Hero Image Setup (asset + component)
    |    Move/optimize Norse_Background.png to src/assets/
    |    Create src/components/home/hero-section.tsx
    |    TEST: Static import works, blur placeholder appears.
    |    TEST: Image is responsive across breakpoints.
    |
    v
Step 3: Home Page Integration (page.tsx)
    |    Replace current centered text with HeroSection
    |    Verify LCP performance (preload prop)
    |    TEST: Hero renders full-width with text overlay.
    |    TEST: Lighthouse LCP score acceptable.
    |
    v
Step 4: Rune Divider + Accent Components
    |    Create src/components/decorative/ directory
    |    Create RuneDivider, RuneAccent
    |    TEST: Runes render in Norse font (check Unicode coverage).
    |    TEST: aria-hidden prevents screen reader noise.
    |    DECISION POINT: If Norse font lacks runic glyphs,
    |    switch to inline SVG paths for rune shapes.
    |
    v
Step 5: Integrate Rune Decorations Into Pages
    |    Add RuneDivider between sections on home page
    |    Add RuneAccent to header logo or nav (optional)
    |    Add RuneDivider above footer (optional)
    |    TEST: Visual coherence across pages.
    |    TEST: No CLS from decorative elements.
    |
    v
Step 6: Rune Background Texture (optional, polish)
         Create RuneTexture wrapper
         Apply to home page sections or about page
         TEST: Texture is barely perceptible (3-6% opacity).
         TEST: No performance impact from CSS pattern.
```

**Why this order:**

- **Step 1 first** because every subsequent step depends on the Norse font being active. The hero text overlay, rune dividers, and rune accents all render in `font-display`. If the font swap breaks, nothing else works.
- **Steps 2-3 together** because the hero component and page integration are tightly coupled. The component is useless without being placed on the page.
- **Step 4 before Step 5** because the rune components must be built and tested (especially Unicode coverage) before integrating them across multiple pages. Step 4 includes a critical decision point.
- **Step 6 last** because texture is the most subtle and optional enhancement. It has the highest risk of looking bad if the opacity or pattern is wrong, and the lowest impact if omitted.

## Scalability Considerations

| Concern | Current (portfolio) | If Blog Grows (100+ posts) | If Design System Expands |
|---------|--------------------|-----------------------------|--------------------------|
| Font loading | 60KB total (2 OTF files), negligible | Same, fonts cached after first load | Add variable font format if more weights needed |
| Hero image | Single hero on home page | Per-page hero images would need individual optimization | Extract HeroSection into a generic component with configurable image prop |
| Rune components | Handful of instances | Same components reused, no scaling concern | Add more variants (RuneBorder, RuneCorner, RuneWatermark) |
| CSS texture | Single data URI, ~500 bytes | Same pattern reused, no scaling concern | Multiple texture variants could be defined as CSS custom properties |

## Sources

### HIGH Confidence (Official Documentation + Codebase Verification)
- [Next.js Font Optimization (App Router)](https://nextjs.org/docs/app/getting-started/fonts) - localFont API, CSS variable integration, multiple weights
- [Next.js Image Component API](https://nextjs.org/docs/app/api-reference/components/image) - fill, preload (replaces deprecated priority), placeholder, sizes props
- [Next.js Getting Started: Images](https://nextjs.org/docs/app/getting-started/images) - Static import for automatic blur placeholder
- Codebase analysis of fonts.ts, layout.tsx, globals.css, page.tsx, and all component files

### MEDIUM Confidence (Verified With Multiple Sources)
- [SVG Accessibility - A11Y Collective](https://www.a11y-collective.com/blog/svg-accessibility/) - aria-hidden="true" for decorative SVGs
- [Unicode Runic Block (U+16A0-U+16FF)](https://symbl.cc/en/unicode/blocks/runic/) - Elder Futhark code points
- [SVG Pattern Guide - SVG Backgrounds](https://www.svgbackgrounds.com/svg-pattern-guide/) - CSS data URI vs image file patterns
- [Hero Image in Next.js - Persson Dennis](https://www.perssondennis.com/articles/how-to-make-a-hero-image-in-nextjs) - fill + relative container pattern

### LOW Confidence (Needs Validation During Implementation)
- Norse.otf Unicode coverage for Runic block U+16A0-U+16FF: **must be tested at Step 4**. The font may only cover Latin characters. If so, rune glyphs will fall back to system fonts or render as boxes.
- 7MB PNG optimization via next/image: build-time behavior with very large source images should be validated. If build times are excessive, pre-optimize the source to ~1-2MB.
