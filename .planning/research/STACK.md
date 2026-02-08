# Technology Stack: v1.2 Norse Identity

**Project:** keech.dev
**Milestone:** v1.2 -- Norse display font, hero image, Elder Futhark decorative elements
**Researched:** 2026-02-07
**Overall confidence:** HIGH

## TL;DR: Zero New npm Packages

This milestone requires **zero new npm dependencies**. Everything needed is built into Next.js 16:

- `next/font/local` loads the Norse OTF/WOFF2 font (replaces `next/font/google` for display font)
- `next/image` handles hero PNG optimization with automatic WebP conversion and blur placeholder
- Unicode Runic block (U+16A0-U+16FF) renders Elder Futhark characters as text via the Norse font
- Inline SVG in JSX handles complex decorative patterns (knotwork, borders)

The only pre-build work is converting the Norse font files from OTF to WOFF2 format (a one-time manual step using a free online tool).

---

## Current Stack (Unchanged)

| Technology | Version | Purpose | v1.2 Impact |
|------------|---------|---------|-------------|
| Next.js | ^16.1.6 | App Router, React 19 | Uses built-in next/font/local and next/image |
| React | ^19.2.4 | UI rendering | No change |
| Tailwind CSS | ^4.1.18 | CSS-first @theme styling | No change -- `--font-display` variable stays identical |
| Velite | ^0.3.1 | MDX content processing | No change |
| lucide-react | ^0.563.0 | UI icons | No change (runes are NOT icons) |
| clsx + tailwind-merge | ^2.1.1 / ^3.4.0 | cn() utility | No change |
| Inter (next/font/google) | body font | Body text | Stays as-is |
| Space Grotesk (next/font/google) | display font | Headings | REPLACED by Norse via next/font/local |

---

## Stack Additions (All Built-in)

### 1. Norse Display Font via next/font/local

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `next/font/local` | built-in (Next.js 16) | Load Norse font (Joel Carrouche) as display font replacing Space Grotesk | Zero dependencies, automatic optimization, preloading, CLS reduction, CSS variable output identical to current next/font/google pattern |

**Confidence:** HIGH -- verified via [Next.js Font Optimization docs](https://nextjs.org/docs/app/getting-started/fonts) and [Font API Reference](https://nextjs.org/docs/app/api-reference/components/font)

**Font source:** Norse by Joel Carrouche (v2.20, 2014)
- License: 100% free for personal and commercial use (Joel Carrouche Free Font EULA v1.0)
- Weights: Regular (400) and Bold (700) as OTF files
- Official site: https://www.joelcarrouche.com/fonts/norse

**Critical finding:** The Norse font includes BOTH Latin extended characters AND a complete runic alphabet with Unicode support (Elder Futhark, U+16A0-U+16FF range). One font serves double duty: display headings AND Elder Futhark rune rendering. No separate rune font is needed.

**Format: Convert OTF to WOFF2 before loading.**

Why WOFF2 over OTF:
- WOFF2 is 30-50% smaller than OTF while preserving all OpenType features including ligatures, kerning, and alternate characters
- Next.js official docs show WOFF2 exclusively in all examples
- OTF is technically usable via `format('opentype')` in @font-face, but it is not documented for `next/font/local` (MEDIUM confidence it works vs HIGH confidence for WOFF2)
- WOFF2 has universal modern browser support (Chrome 36+, Firefox 39+, Safari 12+, Edge 14+)

Conversion tools (one-time, manual step):
- Fontsource Converter: https://fontsource.org/tools/converter (client-side, no upload)
- Transfonter: https://transfonter.org (generates @font-face CSS too)

**next/font/local configuration options (all verified from official API reference):**

| Option | Value | Purpose |
|--------|-------|---------|
| `src` | Array of `{path, weight, style}` objects | Points to WOFF2 files for Regular and Bold |
| `variable` | `"--font-display"` | CSS variable name -- MUST match current value for zero-change in globals.css |
| `display` | `"swap"` | Prevents FOIT (Flash of Invisible Text), shows fallback then swaps |
| `fallback` | `["Space Grotesk", "system-ui", "sans-serif"]` | Fallback chain while Norse loads |
| `adjustFontFallback` | `"Arial"` | Automatic size-adjust on fallback to reduce CLS during swap |
| `preload` | `true` (default) | Preloads font in `<head>` for faster render |
| `weight` | Not needed (specified per-file in src array) | -- |
| `declarations` | Not needed | For advanced @font-face descriptors like ascent-override |

**Integration pattern:**

```typescript
// src/lib/fonts.ts (MODIFIED -- not new file)
import localFont from "next/font/local";
import { Inter } from "next/font/google";

export const norse = localFont({
  src: [
    {
      path: "../fonts/Norse-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Norse-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Space Grotesk", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
```

**File placement:** `src/fonts/Norse-Regular.woff2` and `src/fonts/Norse-Bold.woff2`. Fonts can be stored anywhere in the app directory tree and referenced by relative path from the importing file. The `src/fonts/` directory does not currently exist and must be created.

Also include `src/fonts/LICENSE.txt` (the `freefont_EULA` file from the Norse font download zip) for proper attribution.

**What changes:**

| File | Change | Details |
|------|--------|---------|
| `src/lib/fonts.ts` | Replace Space_Grotesk with localFont | Import changes, same `--font-display` output |
| `src/app/layout.tsx` | Rename import `spaceGrotesk` to `norse` | `className={`${norse.variable} ${inter.variable}`}` |
| `src/fonts/` | NEW directory | Two WOFF2 files + license file |

**What does NOT change:**

| File | Why No Change |
|------|---------------|
| `src/app/globals.css` | `@theme inline { --font-display: var(--font-display); }` is generic -- works for any font assigned to this variable |
| Any component using `font-display` class | Class references the CSS variable, not the font name |
| Inter body font setup | Completely independent |
| package.json | `next/font/local` is built into Next.js, no install needed |

---

### 2. Hero Image via next/image (Static Import)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `next/image` | built-in (Next.js 16) | Optimized hero PNG on home page with text overlay | Automatic WebP/AVIF conversion, automatic blurDataURL for static imports, LCP optimization via preload prop, responsive sizing |

**Confidence:** HIGH -- verified via [Next.js Image Component docs](https://nextjs.org/docs/app/api-reference/components/image) and [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)

**Next.js 16-specific breaking changes affecting this feature:**

| Breaking Change | Old Behavior | New Behavior | Action Required |
|----------------|-------------|-------------|-----------------|
| `priority` deprecated, replaced by `preload` | `priority={true}` | `preload={true}` | Use `preload` prop for hero image |
| `images.qualities` default changed | All qualities 1-100 allowed | Only `[75]` allowed | Add `qualities: [75, 90]` to next.config.ts |
| `minimumCacheTTL` default changed | 60 seconds | 4 hours (14400s) | No action (beneficial) |
| `imageSizes` default removed 16 | Included 16px size | 16px removed | No impact on hero |

**Why static import over string path:**
- Automatic `width` and `height` inference -- prevents Cumulative Layout Shift
- Automatic `blurDataURL` generation -- blur-up placeholder for free, no manual base64 encoding
- Build-time validation -- missing image file causes build error, not a runtime 404
- Type safety -- TypeScript knows the import is a `StaticImageData` object

**Integration pattern:**

```typescript
// src/app/page.tsx
import Image from "next/image";
import heroImage from "@/images/hero-norse-landscape.png";

export default function Home() {
  return (
    <div className="relative min-h-[60vh]">
      <Image
        src={heroImage}
        alt="Norse landscape with Yggdrasil, mountains, and aurora borealis"
        placeholder="blur"
        preload
        quality={90}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <h1 className="font-display text-6xl font-bold">
          keech<span className="text-accent">.dev</span>
        </h1>
      </div>
    </div>
  );
}
```

**next.config.ts change required:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90], // 75 for general images, 90 for hero quality
  },
};

export default nextConfig;
```

**File placement:** `src/images/hero-norse-landscape.png` (new directory). Static import requires the file to be in the source tree, not in `public/`. If the file must be in `public/` (e.g., for external referencing), use a string `src="/images/hero.png"` instead, but you lose automatic blurDataURL and dimension inference.

**Performance budget for hero image:**

| Metric | Value | Notes |
|--------|-------|-------|
| Source PNG size | Target under 2MB | Next.js optimizes at serve time |
| Served format | WebP or AVIF (automatic) | 25-70% smaller than PNG |
| Expected served size | ~150-300KB | Depends on dimensions and detail |
| LCP impact | Mitigated | `preload` starts loading from `<head>` |
| Perceived load | Near-instant | `placeholder="blur"` shows blurred preview immediately |
| CLS impact | Zero | Static import provides exact dimensions |

---

### 3. Elder Futhark Rune Rendering via Unicode

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Unicode Runic block (U+16A0-U+16FF) | Unicode 3.0 (1999), extended in Unicode 7.0 (2014) | Render Elder Futhark rune characters as styled text | Semantic, accessible, zero additional assets. Norse font already contains these glyphs. |

**Confidence:** HIGH -- verified via [Unicode Runic Chart](https://www.unicode.org/charts/PDF/U16A0.pdf), [SYMBL Unicode reference](https://symbl.cc/en/unicode/blocks/runic/), and [Joel Carrouche Norse font description](https://www.joelcarrouche.com/fonts/norse) confirming "Latin extended, Runic" character support

**Approach: Render runes as Unicode text characters styled with the Norse font. NOT as SVG. NOT as images.**

**Why Unicode text over SVG for individual rune characters:**

| Criterion | Unicode Text | SVG Icons |
|-----------|-------------|-----------|
| Semantic HTML | Actual characters in the document | Decorative images requiring aria-label |
| Font consistency | Same Norse font renders headings AND runes | Separate rendering pipeline |
| CSS inheritance | Inherits font-size, color, letter-spacing, opacity | Requires separate fill/stroke/width styling |
| Scalability | Scales with em/rem like any text | Needs explicit viewBox and sizing |
| Performance | Zero additional HTTP requests or DOM weight | Inline SVG adds DOM nodes per element |
| Maintenance | Characters in markup | Separate SVG file per rune (24 files) |
| Theming | Responds to text-color utilities | Needs currentColor wiring |

**The 24 Elder Futhark runes (Kylver Stone traditional order):**

| Rune | Name | Unicode | Code Point |
|------|------|---------|------------|
| ᚠ | Fehu | RUNIC LETTER FEHU FEOH FE F | U+16A0 |
| ᚢ | Uruz | RUNIC LETTER URUZ UR U | U+16A2 |
| ᚦ | Thurisaz | RUNIC LETTER THURISAZ THURS THORN | U+16A6 |
| ᚨ | Ansuz | RUNIC LETTER ANSUZ A | U+16A8 |
| ᚱ | Raido | RUNIC LETTER RAIDO RAD REID R | U+16B1 |
| ᚲ | Kenaz | RUNIC LETTER KAUNA | U+16B2 |
| ᚷ | Gebo | RUNIC LETTER GEBO GYFU G | U+16B7 |
| ᚹ | Wunjo | RUNIC LETTER WUNJO WYNN W | U+16B9 |
| ᚺ | Hagalaz | RUNIC LETTER HAGLAZ H | U+16BA |
| ᚾ | Nauthiz | RUNIC LETTER NAUDIZ NYD NAUD N | U+16BE |
| ᛁ | Isa | RUNIC LETTER ISAZ IS ISS I | U+16C1 |
| ᛃ | Jera | RUNIC LETTER JERAN J | U+16C3 |
| ᛇ | Eihwaz | RUNIC LETTER IWAZ EOH | U+16C7 |
| ᛈ | Perthro | RUNIC LETTER PERTHO PEORTH P | U+16C8 |
| ᛉ | Algiz | RUNIC LETTER ALGIZ EOLHX | U+16C9 |
| ᛊ | Sowilo | RUNIC LETTER SOWILO S | U+16CA |
| ᛏ | Tiwaz | RUNIC LETTER TIWAZ TIR TYR T | U+16CF |
| ᛒ | Berkanan | RUNIC LETTER BERKANAN BEORC BJARKAN B | U+16D2 |
| ᛖ | Ehwaz | RUNIC LETTER EHWAZ EH E | U+16D6 |
| ᛗ | Mannaz | RUNIC LETTER MANNAZ MAN M | U+16D7 |
| ᛚ | Laguz | RUNIC LETTER LAUKAZ LAGU LOGR L | U+16DA |
| ᛜ | Ingwaz | RUNIC LETTER INGWAZ | U+16DC |
| ᛞ | Dagaz | RUNIC LETTER DAGAZ DAEG D | U+16DE |
| ᛟ | Othala | RUNIC LETTER OTHALAN ETHEL O | U+16DF |

**Full sequence (copy-pasteable):** `ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ`

**Usage patterns:**

```typescript
// Section divider -- purely decorative, hidden from screen readers
function RuneDivider() {
  return (
    <div
      aria-hidden="true"
      className="font-display text-accent text-2xl tracking-[0.5em] text-center my-8 select-none"
    >
      ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ
    </div>
  );
}

// CSS list marker using runes
// In globals.css:
// .rune-list li::marker {
//   content: "\16A0  ";
//   font-family: var(--font-display);
//   color: var(--color-accent);
// }

// Nav accent -- subtle rune before/after nav items
// Via Tailwind arbitrary values:
// before:content-['\16A0'] before:font-display before:text-accent before:mr-2
```

**Accessibility requirements:**
- All decorative runes MUST use `aria-hidden="true"` -- screen readers should not attempt to read decorative rune characters
- For runes that convey meaning (unlikely in this project), provide `aria-label` with the English translation
- Use `role="separator"` on divider elements where semantically appropriate
- Add `tabindex="-1"` to prevent keyboard focus on purely decorative elements

---

### 4. Inline SVG for Complex Decorative Elements

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Inline SVG (React JSX) | N/A (browser standard) | Knotwork borders, wave dividers, textured frames, corner ornaments | Correct tool for complex vector shapes that are not typographic characters. Inline in JSX for zero HTTP requests and full CSS control via currentColor. |

**Confidence:** HIGH -- standard React pattern, verified via [A11Y Collective SVG Accessibility](https://www.a11y-collective.com/blog/svg-accessibility/) and [Smashing Magazine Accessible SVG Patterns](https://www.smashingmagazine.com/2021/05/accessible-svg-patterns-comparison/)

**Use SVG for:** Complex decorative borders, Norse knotwork patterns, geometric ornament frames, wave/interlace dividers, background texture overlays.

**Do NOT use SVG for:** Individual rune characters (use Unicode text -- see section 3 above).

**Pattern:**

```typescript
// Decorative knotwork divider component
function KnotworkDivider() {
  return (
    <svg
      aria-hidden="true"
      role="separator"
      className="w-full h-8 text-foreground"
      viewBox="0 0 400 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path d="M0,16 C50,0 100,32 150,16 C200,0 250,32 300,16 C350,0 400,32 400,16" />
    </svg>
  );
}
```

**Accessibility:** All decorative SVGs must have `aria-hidden="true"` and `tabindex="-1"` (if focusable). The `role="separator"` is appropriate for divider elements. No `<title>` or `<desc>` needed for purely decorative graphics.

**Why NOT @svgr/webpack:** The project will have approximately 3-5 decorative SVG elements. Hand-crafted inline SVG in JSX is simpler, requires zero build config, and is more maintainable than importing .svg files through a webpack loader pipeline. If the project ever grows to 20+ SVGs, reconsider.

---

## What NOT to Add

| Library/Tool | Why NOT |
|-------------|---------|
| **@svgr/webpack** | Overkill for 3-5 hand-crafted decorative SVGs. Adds webpack config for no benefit. |
| **Any rune font package** (BabelStone Runic, Junicode, FreeMono) | Norse font already includes Elder Futhark glyphs at the correct Unicode code points. Adding a second font wastes bandwidth and creates styling inconsistency. |
| **sharp** (image processing) | Next.js uses sharp internally for image optimization. Do not install separately -- it is already a transitive dependency. |
| **plaiceholder** or blur-generation tools | `next/image` generates blurDataURL automatically for statically imported images. Manual generation is unnecessary. |
| **Any icon library for runes** | Runes are typographic characters, not icons. Lucide handles UI icons; runes render as text. |
| **next-fonts** (third-party) | Deprecated package. `next/font/local` is the official built-in replacement. |
| **CvltRvne font** | Demo license only. Project decision already excludes this (see PROJECT.md key decisions). |
| **Google Fonts CDN for Norse** | Norse is not available on Google Fonts or any CDN. Local loading is the only option. |
| **react-svg-inline** or similar | Unnecessary wrapper around native JSX SVG. React supports SVG natively. |
| **Framer Motion** | Not needed for this milestone. Rune/decorative elements are static or use CSS transitions only. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Display font loading | `next/font/local` (WOFF2) | Manual `@font-face` in globals.css | next/font/local provides automatic preloading, font-display swap, adjustFontFallback for CLS, and CSS variable output. Manual @font-face requires reimplementing all of this. |
| Font format | WOFF2 (converted from OTF) | OTF directly via next/font/local | WOFF2 is 30-50% smaller. All Next.js docs use WOFF2. OTF probably works but is not documented for next/font/local (MEDIUM confidence). |
| Rune rendering | Unicode text (Norse font) | SVG icon sprite sheet | Unicode is semantic, inherits CSS text properties, needs zero additional assets. Norse font already has the glyphs -- using SVG would duplicate them. |
| Rune rendering | Unicode text (Norse font) | CSS background-image rune assets | Images do not scale with text, do not inherit color, require separate files per rune, and are not accessible. |
| Hero image | `next/image` static import | `<img>` tag with manual optimization | Loses format conversion (WebP/AVIF), blur placeholder, preloading, CLS prevention, and responsive sizing. |
| Hero image | `next/image` static import | CSS `background-image` | Cannot use next/image optimization, no blur placeholder, harder responsive behavior, less accessible (no alt text). |
| Hero image format | PNG source (Next.js converts) | Pre-converted WebP source | PNG gives highest source quality. Next.js converts to WebP/AVIF at serve time. Pre-converting loses the original quality and AVIF option. |
| Decorative patterns | Inline JSX SVG | Imported .svg files via @svgr | For ~5 decorative elements, inline is simpler. No build config needed. |
| Decorative patterns | Inline JSX SVG | CSS-only decorative borders | CSS cannot create complex knotwork or interlace patterns. SVG is the correct tool for custom vector artwork. |

---

## Configuration Changes Summary

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90], // Required in Next.js 16. Default is [75].
  },
};

export default nextConfig;
```

### src/lib/fonts.ts (MODIFIED)

Replace `Space_Grotesk` from `next/font/google` with `localFont` from `next/font/local`. Keep `Inter` unchanged. Output the same `--font-display` CSS variable.

### src/app/layout.tsx (MINIMAL change)

Replace `spaceGrotesk` import name with `norse`. Template literal pattern `${norse.variable} ${inter.variable}` is identical.

### src/app/globals.css (NO changes for font swap)

The `@theme inline { --font-display: var(--font-display); }` block is already generic. May add new CSS classes for rune decorative elements (`.rune-divider`, `.rune-list`) but this is additive, not a modification.

### New files

| File | Purpose |
|------|---------|
| `src/fonts/Norse-Regular.woff2` | Norse font Regular weight |
| `src/fonts/Norse-Bold.woff2` | Norse font Bold weight |
| `src/fonts/LICENSE.txt` | Joel Carrouche Free Font EULA |
| `src/images/hero-norse-landscape.png` | AI-generated Norse landscape hero image |

---

## Performance Budget Impact

| Asset | Current | After v1.2 | Delta |
|-------|---------|------------|-------|
| Display font | Space Grotesk (~25KB via Google CDN + DNS lookup) | Norse (~30-50KB WOFF2 self-hosted, no external DNS) | +5-25KB font, -1 DNS lookup |
| Hero image | None | ~150-300KB (WebP served, source PNG) | +150-300KB (home page only) |
| Rune characters | N/A | 0KB (rendered by Norse font already loaded) | Zero |
| SVG decorations | None | ~2-5KB inline (3-5 elements) | Negligible |
| **Total home page** | ~25KB fonts | ~180-375KB | Acceptable for portfolio |
| **Total other pages** | ~25KB fonts | ~30-55KB fonts | Minimal increase |

**LCP optimization:**
- Hero image: `preload` starts loading from `<head>` before body parsing
- Hero image: `placeholder="blur"` provides near-instant perceived load
- Norse font: `display: "swap"` prevents Flash of Invisible Text
- Norse font: `adjustFontFallback: "Arial"` minimizes layout shift during font swap
- Self-hosting eliminates Google Fonts CDN round-trip (saves ~50-100ms)

---

## Installation

```bash
# No new npm packages. Zero installs.
```

**Pre-build steps (one-time, manual):**

1. Download Norse font zip from https://www.joelcarrouche.com/fonts/norse
2. Extract `Norse.otf` and `Norse Bold.otf` from the zip
3. Convert both to WOFF2 using https://fontsource.org/tools/converter (processes client-side, no upload)
4. Create `src/fonts/` directory
5. Place `Norse-Regular.woff2`, `Norse-Bold.woff2`, and `LICENSE.txt` (from zip's `freefont_EULA` file) in `src/fonts/`
6. Create `src/images/` directory
7. Place hero PNG image in `src/images/`

---

## Confidence Assessment

| Claim | Confidence | Source |
|-------|------------|--------|
| `next/font/local` supports WOFF2 files and CSS variable output | HIGH | [Next.js Font API Reference](https://nextjs.org/docs/app/api-reference/components/font), all official examples |
| `next/font/local` configuration options (src, variable, display, fallback, adjustFontFallback) | HIGH | [Next.js Font API Reference](https://nextjs.org/docs/app/api-reference/components/font) |
| OTF format works directly with `next/font/local` | MEDIUM | Not explicitly documented; community sources suggest it works via format('opentype'), but all official examples use WOFF2 |
| Norse font includes Elder Futhark Unicode characters | HIGH | [Joel Carrouche Norse font page](https://www.joelcarrouche.com/fonts/norse) states "Latin extended, Runic" with "complete runic alphabet with unicode support" |
| Norse font is free for commercial use | HIGH | [Joel Carrouche font page](https://www.joelcarrouche.com/fonts/norse), [1001Fonts](https://www.1001fonts.com/norse-font.html), [FontSpace](https://www.fontspace.com/norse-font-f21080) -- all confirm 100% free |
| `next/image` static import auto-generates blurDataURL | HIGH | [Next.js Image docs](https://nextjs.org/docs/app/getting-started/images) -- "blurDataURL is added automatically" for static imports |
| `priority` renamed to `preload` in Next.js 16 | HIGH | [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [Image Component docs](https://nextjs.org/docs/app/api-reference/components/image) |
| `images.qualities` default changed to `[75]` in Next.js 16 | HIGH | [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) |
| Elder Futhark runes are in Unicode block U+16A0-U+16FF | HIGH | [Unicode.org Runic chart](https://www.unicode.org/charts/PDF/U16A0.pdf), [SYMBL reference](https://symbl.cc/en/unicode/blocks/runic/) |
| WOFF2 is 30-50% smaller than OTF | HIGH | Multiple sources including [Fontsource](https://fontsource.org/tools/converter), [W3C WOFF2 spec](https://www.w3.org/TR/WOFF2/) |
| Zero new npm dependencies needed | HIGH | All features verified as Next.js built-ins |

---

## Sources

### Official Documentation (HIGH confidence)
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) -- local font loading patterns
- [Next.js Font API Reference](https://nextjs.org/docs/app/api-reference/components/font) -- all configuration options
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image) -- props including preload, quality, placeholder
- [Next.js Image Optimization](https://nextjs.org/docs/app/getting-started/images) -- static import, auto blurDataURL
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- breaking changes
- [Unicode Runic Block Chart](https://www.unicode.org/charts/PDF/U16A0.pdf) -- official code point reference

### Font Sources (HIGH confidence)
- [Norse Font by Joel Carrouche](https://www.joelcarrouche.com/fonts/norse) -- official font page
- [Norse on 1001Fonts](https://www.1001fonts.com/norse-font.html) -- license confirmation
- [Norse on FontSpace](https://www.fontspace.com/norse-font-f21080) -- format and license details

### Reference Material (MEDIUM confidence)
- [SYMBL Unicode Runic Block](https://symbl.cc/en/unicode/blocks/runic/) -- character listing and names
- [BabelStone Runic Elder Futhark](https://www.babelstone.co.uk/Fonts/ElderFuthark.html) -- rune reference (not using this font)
- [SVG Accessibility - A11Y Collective](https://www.a11y-collective.com/blog/svg-accessibility/) -- decorative SVG best practices
- [Accessible SVG Patterns - Smashing Magazine](https://www.smashingmagazine.com/2021/05/accessible-svg-patterns-comparison/) -- aria-hidden patterns
- [Fontsource Font Converter](https://fontsource.org/tools/converter) -- OTF to WOFF2 tool
