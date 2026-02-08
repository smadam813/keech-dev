# Phase 7: Norse Typography - Research

**Researched:** 2026-02-07
**Domain:** Custom font integration (Next.js local fonts, OTF-to-WOFF2 conversion, CLS prevention, typography tuning)
**Confidence:** HIGH

## Summary

This phase replaces the current Space Grotesk display font with the Norse font by Joel Carrouche. The technical work involves three distinct layers: (1) converting the source OTF files to WOFF2 for web delivery, (2) integrating via `next/font/local` which replaces the current `next/font/google` setup, and (3) tuning letter-spacing/line-height and font-weight assignments across all heading levels and navigation elements.

The current codebase is well-structured for this change. All display font usage flows through a single CSS variable `--font-display`, configured in `src/lib/fonts.ts` and applied via Tailwind's `font-display` utility. The `<html>` tag receives the CSS variable class in `layout.tsx`. This means the font swap is architecturally clean: change the font definition in `fonts.ts`, and all existing `font-display` references automatically pick up the new font.

The Norse font files are already present in the repository at `fonts/norse/` (Norse.otf at 30KB, Norse-Bold.otf at 30KB). These are small files that will compress well to WOFF2 (likely 15-20KB each). Next.js's built-in `adjustFontFallback` feature will handle CLS prevention automatically by generating metric-adjusted fallback @font-face rules. The font's metrics (extracted from the actual files) show reasonable proportions that will pair adequately with Arial as a fallback base.

**Primary recommendation:** Use `next/font/local` with both weights in a single `localFont()` call, `font-display: swap`, `adjustFontFallback: 'Arial'` (default), and preload enabled. Convert OTF to WOFF2 via `fonttools`/`pyftsubset`. Update weight classes in CSS/components per the locked decisions.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Bold weight for h1 and h2 only -- top-level headings get Bold for impact
- Regular weight for h3-h6 -- lighter feel, let the font character speak
- Site name "keech.dev" in header: Regular weight
- Navigation links (Blog, Projects, About): Regular weight
- Weight hierarchy: Bold reserved for page-level impact (h1/h2), Regular everywhere else

### Claude's Discretion
- Inline bold handling within headings (whether `<strong>` inside an h3 renders Norse Bold or stays uniform) -- pick what looks cleanest
- Font loading strategy (font-display swap vs block, preload vs natural discovery) -- balance performance with visual polish
- Layout shift mitigation approach (size-adjust fallback metrics tuning) -- balance effort vs. result based on how different Norse metrics are from system fonts
- Fallback font chain if Norse fails to load -- pick the most sensible chain (system sans-serif or Space Grotesk as middle ground)
- Preload decision -- based on WOFF2 file size and performance impact

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/font/local` | (bundled with Next.js 16) | Load local WOFF2 fonts with automatic optimization | Built-in to Next.js, handles preloading, CSS variable injection, and fallback font generation |
| `fonttools` + `brotli` | latest (Python) | Convert OTF to WOFF2 | Industry-standard font conversion tool from Google; `pyftsubset` command handles conversion + subsetting in one step |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS v4 | 4.1.18 (already installed) | Apply font-family via `font-display` utility class | Already configured -- no changes to Tailwind setup needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fonttools` (Python) | Online converter (e.g., Vertopal, CloudConvert) | Online converters work but lose subsetting control; `fonttools` gives deterministic CLI output |
| `next/font/local` | Manual `@font-face` in CSS | Loses automatic preloading, CLS optimization, and hash-based caching that `next/font/local` provides |

**Installation (one-time font conversion -- not a project dependency):**
```bash
# Install fonttools with WOFF2 support (requires Python 3.10+)
pip install fonttools brotli
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── fonts.ts              # CHANGE: localFont() replacing Space_Grotesk
├── app/
│   ├── layout.tsx            # CHANGE: import new font variable
│   └── globals.css           # CHANGE: heading weight rules, letter-spacing/line-height tuning
├── components/
│   └── layout/
│       └── header.tsx        # CHANGE: font-weight classes on site name and nav

public/
└── fonts/                    # NEW: WOFF2 files served from here
    ├── Norse-Regular.woff2
    └── Norse-Bold.woff2

fonts/
└── norse/                    # EXISTING: Source OTF files (not deployed)
    ├── Norse.otf
    ├── Norse-Bold.otf
    └── freefont_EULA_v1-00.txt
```

### Pattern 1: Local Font Definition with Multiple Weights
**What:** Define both Regular and Bold weights in a single `localFont()` call
**When to use:** When a font family has discrete weight files (not variable font)
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/font
import localFont from 'next/font/local'

export const norse = localFont({
  src: [
    {
      path: '../../public/fonts/Norse-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Norse-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  adjustFontFallback: 'Arial',
  fallback: ['Arial', 'Helvetica Neue', 'sans-serif'],
})
```

**Key details:**
- The `src` path is relative to the file containing the `localFont()` call (`src/lib/fonts.ts`)
- Using `variable: '--font-display'` means the existing Tailwind `font-display` utility and all component classes work unchanged
- `adjustFontFallback: 'Arial'` is the default for `next/font/local` -- Next.js will auto-generate a fallback `@font-face` with `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` to match Norse's metrics

### Pattern 2: Weight Assignment via CSS Layers
**What:** Control which heading levels get Bold vs Regular through the base layer
**When to use:** When weight varies by heading level but font-family is uniform
**Example:**
```css
@layer base {
  h1, h2 {
    @apply font-display font-bold;
  }

  h3, h4, h5, h6 {
    @apply font-display font-normal;
  }
}
```

### Pattern 3: Layout.tsx Font Variable Injection
**What:** Apply the CSS variable class to `<html>` so all descendants can reference it
**When to use:** Always -- this is the Next.js standard pattern
**Example:**
```tsx
// Source: https://nextjs.org/docs/app/getting-started/fonts
import { norse } from "@/lib/fonts";
import { inter } from "@/lib/fonts";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${norse.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Anti-Patterns to Avoid
- **Keeping Space Grotesk as a dependency:** Remove the Google font import entirely. Do not load both fonts -- it wastes bandwidth and creates confusion about which font is "display."
- **Using `@font-face` manually in CSS:** Bypasses Next.js optimization pipeline (preloading, fallback generation, file hashing). Always use `next/font/local`.
- **Putting WOFF2 files in `src/`:** Font files should be in `public/fonts/` for clean separation. The `src` path in `localFont()` is relative to the TS file, so use `../../public/fonts/...` from `src/lib/fonts.ts`.
- **Setting `font-display: optional`:** While best for CLS, `optional` may cause the Norse font to never render on slow connections. For a display/brand font, `swap` is correct -- the user wants visitors to SEE the Norse character.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTF to WOFF2 conversion | Custom build script or online tool | `pyftsubset` from `fonttools` | One command, deterministic output, can subset to Latin chars only |
| CLS prevention / fallback metrics | Manual `size-adjust` and `ascent-override` calculations | `next/font/local` `adjustFontFallback` | Next.js reads the font binary and computes exact overrides automatically |
| Font preloading | Manual `<link rel="preload">` tags | `next/font/local` `preload: true` (default) | Next.js injects preload hints in the correct order and only for above-fold fonts |
| CSS variable injection | Manual `style` attribute on `<html>` | `next/font/local` `variable` option + `className` | Handles SSR hydration correctly, scopes the variable properly |

**Key insight:** `next/font/local` does almost everything for you. The only manual work is the OTF-to-WOFF2 conversion (a one-time operation) and the CSS weight/spacing tuning.

## Common Pitfalls

### Pitfall 1: Font Path Resolution in `next/font/local`
**What goes wrong:** "Module not found" error when Next.js can't resolve the font file path
**Why it happens:** `src` paths in `localFont()` are relative to the FILE calling it, not the project root. If fonts.ts is at `src/lib/fonts.ts` and fonts are at `public/fonts/`, the path must be `../../public/fonts/Norse-Regular.woff2`.
**How to avoid:** Always trace the relative path from the file containing the `localFont()` call to the font file. Test with `npm run build` immediately after changing paths.
**Warning signs:** Build fails with "Module not found: Can't resolve './fonts/...'"

### Pitfall 2: Font Weight Mismatch Between CSS and Font File
**What goes wrong:** Browser synthesizes bold (faux bold) instead of using the actual Bold weight file, causing ugly thickened letterforms
**Why it happens:** The `weight` value in the `localFont()` src array must match what CSS requests. If the Bold file is registered as weight `700` but CSS applies `font-weight: 600` (semibold), the browser may not match it.
**How to avoid:** Register Bold as `weight: '700'`, use `font-bold` (which maps to 700) for h1/h2. Register Regular as `weight: '400'`, use `font-normal` (which maps to 400) for h3-h6.
**Warning signs:** Headings look oddly thick or thin; font inspector shows "synthesized bold"

### Pitfall 3: Norse Font Has Narrow Proportions
**What goes wrong:** Text that was wide with Space Grotesk suddenly wraps or looks cramped with Norse, causing layout breakage
**Why it happens:** Norse has an `xAvgCharWidth` of 367 (Regular) on a 1000 UPM grid, which is narrower than typical sans-serif fonts. Space Grotesk is considerably wider.
**How to avoid:** After swapping the font, visually review all pages at multiple breakpoints. The narrower width is actually a benefit for headings (fits more text), but some layouts may need `letter-spacing` adjustment.
**Warning signs:** Headings that previously fit on one line still fit (good), but spacing looks too tight

### Pitfall 4: Forgetting to Remove Space Grotesk Import
**What goes wrong:** Both fonts load, wasting ~40KB+ of bandwidth and confusing the font stack
**Why it happens:** Developer adds Norse but forgets to remove the old `Space_Grotesk` import from `fonts.ts` and the `import { Space_Grotesk } from "next/font/google"` statement
**How to avoid:** Delete the entire Space Grotesk export and import. The variable name `--font-display` stays the same, so nothing else breaks.
**Warning signs:** Network tab shows Google Fonts requests alongside local font requests

### Pitfall 5: Prose Heading Weights Not Updated
**What goes wrong:** Blog post headings (h2, h3, h4 in `.prose`) all render in Bold, violating the "Bold for h1/h2 only" decision
**Why it happens:** Current `globals.css` applies `font-bold` to `.prose h2`, `.prose h3`, and `.prose h4`. The locked decision says h3-h6 should be Regular weight.
**How to avoid:** Update `.prose h3` and `.prose h4` to use `font-normal` instead of `font-bold`.
**Warning signs:** h3/h4 in blog posts look heavy instead of having the "lighter feel" the user wants

### Pitfall 6: Mobile Menu Uses Bold for Nav Links
**What goes wrong:** Mobile navigation links render in Bold, violating the "Navigation links: Regular weight" decision
**Why it happens:** Current `header.tsx` applies `font-bold` to mobile menu nav links (line 163: `'font-display text-3xl font-bold'`)
**How to avoid:** Change mobile nav links from `font-bold` to `font-normal`. Desktop nav already uses `font-medium` which should become `font-normal` as well.
**Warning signs:** Mobile menu text appears heavier than intended

## Code Examples

Verified patterns from official sources:

### OTF to WOFF2 Conversion
```bash
# Source: https://fonttools.readthedocs.io/en/latest/subset/
# Convert OTF to WOFF2, keeping only Latin characters
pyftsubset fonts/norse/Norse.otf \
  --output-file=public/fonts/Norse-Regular.woff2 \
  --flavor=woff2 \
  --layout-features="*" \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"

pyftsubset fonts/norse/Norse-Bold.otf \
  --output-file=public/fonts/Norse-Bold.woff2 \
  --flavor=woff2 \
  --layout-features="*" \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
```

### Updated fonts.ts
```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/font
import localFont from 'next/font/local'
import { Inter } from 'next/font/google'

export const norse = localFont({
  src: [
    {
      path: '../../public/fonts/Norse-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Norse-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  // Default: 'Arial' -- Next.js auto-generates metric-adjusted fallback
  // Norse metrics vs Arial: similar enough that auto-adjustment works well
  fallback: ['Arial', 'Helvetica Neue', 'sans-serif'],
})

export const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
```

### Updated layout.tsx
```tsx
import { norse, inter } from "@/lib/fonts";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${norse.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Updated Base Layer in globals.css (Weight Hierarchy)
```css
@layer base {
  html {
    @apply font-body bg-background text-foreground antialiased;
    overflow-y: scroll;
    overscroll-behavior: none;
  }

  /* Bold weight for h1 and h2 (page-level impact) */
  h1, h2 {
    @apply font-display font-bold;
  }

  /* Regular weight for h3-h6 (lighter, let character speak) */
  h3, h4, h5, h6 {
    @apply font-display font-normal;
  }
}
```

### Updated Prose Heading Styles
```css
.prose h2 {
  @apply font-display text-2xl font-bold mt-12 mb-4;
  /* h2 keeps font-bold per locked decision */
}

.prose h3 {
  @apply font-display text-xl font-normal mt-8 mb-3;
  /* CHANGED: font-bold -> font-normal */
}

.prose h4 {
  @apply font-display text-lg font-normal mt-6 mb-2;
  /* CHANGED: font-bold -> font-normal */
}
```

## Discretionary Recommendations

These are areas marked as Claude's Discretion in CONTEXT.md. Recommendations based on research:

### 1. Font Loading Strategy
**Recommendation:** `font-display: swap` with `preload: true` (both are defaults)

**Rationale:** The Norse font files are small (~30KB OTF, estimated ~15-20KB WOFF2 each). At this size, preloading is appropriate -- it adds two small `<link rel="preload">` tags. `swap` ensures text is always visible (using the fallback) and then swaps to Norse once loaded. This is correct for a brand/identity font where the user explicitly wants visitors to see the Norse character. `optional` would risk the font never appearing on slow connections, which defeats the purpose of the entire milestone.

### 2. Layout Shift Mitigation
**Recommendation:** Use `adjustFontFallback: 'Arial'` (the default) and let Next.js handle it automatically.

**Rationale:** Norse font metrics extracted from the actual font files:
- UPM: 1000, capHeight: 735, xHeight: 500, ascent: 750, descent: -250
- Arial UPM: 2048, ascent: 1854, descent: 434

Next.js reads these values from the WOFF2 binary and generates `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` properties for the fallback. This is automatic and requires zero manual tuning. The Norse font has somewhat unusual proportions (capHeight 735 vs typical 700+ range, narrower average width), but Next.js handles this via the same algorithm it uses for all Google Fonts. No need to hand-tune metrics.

### 3. Fallback Font Chain
**Recommendation:** `fallback: ['Arial', 'Helvetica Neue', 'sans-serif']`

**Rationale:** Arial is already the base for `adjustFontFallback`. Including it in the `fallback` array ensures that if Norse never loads (catastrophic failure), the site still renders in a clean sans-serif. Space Grotesk should NOT be in the fallback chain because: (a) it would require keeping the Google Fonts import, (b) it adds network dependency for a fallback, and (c) Arial with metric adjustment will be close enough.

### 4. Inline Bold Within Headings
**Recommendation:** Let `<strong>` inside h3-h6 render in Norse Bold (font-weight: 700).

**Rationale:** If someone writes `### This has **important** words` in MDX, the `<strong>` tag should pull in the Bold weight for emphasis. This is semantically correct and visually clean -- the contrast between Regular and Bold within a heading creates proper emphasis hierarchy. Making `<strong>` stay Regular would be confusing and defeat the purpose of inline emphasis. No CSS override needed; browser default behavior handles this.

### 5. Preload Decision
**Recommendation:** Keep preload enabled (default `true`).

**Rationale:** With WOFF2 compression, each file will be approximately 15-20KB. Two preloaded fonts at ~35-40KB total is well within acceptable bounds. This ensures the Norse font loads as early as possible, reducing the duration of the fallback font being visible. For a brand identity font that appears above the fold (site name, hero text), preloading is correct.

## Norse Font Metrics (Extracted from Actual Files)

| Metric | Norse Regular | Norse Bold | Notes |
|--------|--------------|------------|-------|
| unitsPerEm | 1000 | 1000 | Standard UPM |
| usWeightClass | 400 | 700 | Correct CSS weight mapping |
| xAvgCharWidth | 367 | 375 | Narrow -- tighter than typical sans-serif |
| sCapHeight | 735 | 735 | Cap height |
| sxHeight | 500 | 500 | x-height (50% of UPM) |
| sTypoAscender | 875 | 875 | Typo ascent |
| sTypoDescender | -125 | -125 | Typo descent |
| sTypoLineGap | 9 | 9 | Small line gap |
| usWinAscent | 750 | 750 | Windows ascent |
| usWinDescent | 250 | 250 | Windows descent |
| hhea ascender | 750 | 750 | Mac ascent |
| hhea descender | -250 | -250 | Mac descent |
| Format | CFF (OpenType) | CFF (OpenType) | Post-Script outlines |
| File size | 30,040 bytes | 29,764 bytes | Small; WOFF2 will be ~15-20KB |

**Key observation:** The font has a discrepancy between sTypoAscender (875) and usWinAscent/hhea ascender (750). This is unusual and means line-height rendering may differ slightly between platforms. Next.js `adjustFontFallback` uses the hhea values, which are consistent between Regular and Bold. The narrow xAvgCharWidth (367 on 1000 UPM = 36.7%) confirms Norse is a condensed-feeling display font -- expect tighter text than Space Grotesk.

## Typography Tuning Guidelines

### Letter-Spacing Recommendations
Display/decorative fonts at large sizes generally need slight positive letter-spacing for clarity:

| Size Range | Tailwind Class | Recommended letter-spacing | Rationale |
|------------|---------------|---------------------------|-----------|
| text-6xl+ (hero) | `tracking-tight` or `tracking-normal` | -0.025em to 0em | Norse at very large sizes may benefit from slightly tighter spacing for visual impact; test both |
| text-4xl to text-5xl (page h1) | `tracking-normal` | 0em | Let the font's native spacing speak |
| text-xl to text-3xl (h2, cards) | `tracking-normal` to `tracking-wide` | 0em to 0.025em | May need slight opening at medium sizes |
| text-lg and below (h3-h6, nav) | `tracking-normal` | 0em | Native spacing is fine at body-adjacent sizes |

**Strategy:** Start with `tracking-normal` everywhere, then visually tune. Norse's narrow character width means it likely does NOT need negative tracking (it's already compact).

### Line-Height Recommendations
Headings typically use tighter line-height than body text:

| Element | Recommended | Tailwind Class | Rationale |
|---------|-------------|---------------|-----------|
| h1 (hero, page) | 1.1 | `leading-tight` (1.25) or custom `leading-[1.1]` | Tight for visual impact; Norse caps are 73.5% of UPM so it can go tight |
| h2 | 1.2-1.3 | `leading-snug` (1.375) or `leading-tight` | Slightly looser for multi-line headings |
| h3-h6 | 1.3-1.4 | `leading-snug` (1.375) | Comfortable reading without feeling loose |
| Nav/site name | 1.0 | `leading-none` (1.0) | Single-line, no multi-line concern |

## Files That Need Changes

| File | Change | Scope |
|------|--------|-------|
| `src/lib/fonts.ts` | Replace `Space_Grotesk` Google font with `localFont()` Norse definition | Complete rewrite |
| `src/app/layout.tsx` | Update import from `spaceGrotesk` to `norse` | Import + className |
| `src/app/globals.css` | Split h1-h6 rule into h1-h2 (bold) and h3-h6 (normal); update prose h3/h4 weights; add letter-spacing/line-height tuning | Base layer + prose |
| `src/components/layout/header.tsx` | Site name: `font-bold` -> `font-normal`; Desktop nav: `font-medium` -> `font-normal`; Mobile nav: `font-bold` -> `font-normal` | 3 className changes |
| `src/app/page.tsx` | Possibly adjust tracking on hero h1 | 1 className tweak |
| `src/app/not-found.tsx` | 404 h1 keeps bold (it's h1), but the button `font-semibold` -> `font-normal` if it uses display font | 1 className change |
| `src/app/about/page.tsx` | h1 keeps bold; no other display-font elements need weight changes | Verify only |
| `src/app/projects/page.tsx` | h1 keeps bold | Verify only |
| `src/app/blog/page.tsx` | h1 keeps bold | Verify only |
| `src/components/blog/toc.tsx` | "Contents" h2 keeps bold | Verify only |
| `src/components/blog/post-card.tsx` | h2 keeps bold | Verify only |
| `src/components/projects/project-card.tsx` | h2 keeps bold | Verify only |
| `src/components/layout/footer.tsx` | Already no weight class on display text | Verify only |
| `public/fonts/` | NEW: Add Norse-Regular.woff2 and Norse-Bold.woff2 | New directory + files |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `@font-face` in CSS | `next/font/local` with automatic optimization | Next.js 13+ (2022) | Automatic preloading, CLS prevention, file hashing |
| `font-display: block` for brand fonts | `font-display: swap` with metric-adjusted fallbacks | 2023+ (font-metric override support) | Eliminates FOIT while minimizing FOUT shift |
| Separate TTF/WOFF/WOFF2 with format hints | WOFF2 only | 2023+ (browser support >97%) | Single format, smallest file size, universal support |
| Manual `size-adjust` calculation | `adjustFontFallback` in Next.js | Next.js 13.2+ | Framework computes metrics from font binary |

**Deprecated/outdated:**
- **WOFF (v1) format:** No longer needed. WOFF2 has 97%+ browser support. Only serve WOFF2.
- **TTF for web:** Only use for local development/editors. WOFF2 for production.
- **`@import url()` for Google Fonts:** Self-hosted via `next/font/google` or `next/font/local` is standard.

## Open Questions

1. **Exact WOFF2 file sizes after conversion**
   - What we know: Source OTF files are ~30KB each; WOFF2 compression typically achieves 30-50% reduction for CFF-based OpenType fonts
   - What's unclear: Exact compressed sizes won't be known until conversion is done
   - Recommendation: Convert first, then verify sizes. If under 30KB each, preload both. If surprisingly large, consider preloading only Regular and lazy-loading Bold.

2. **Availability of fonttools/pip on the dev machine**
   - What we know: Python 3.12.3 is available but `pip` module is not installed. `fonttools` is not present.
   - What's unclear: Whether the developer prefers to install pip/fonttools or use an alternative conversion method
   - Recommendation: Either install pip (`sudo apt install python3-pip && pip install fonttools brotli`) or use an online converter as a fallback. The conversion is a one-time operation, not a build dependency.

3. **Visual impact of Norse at small sizes (text-sm, text-xs)**
   - What we know: Norse is a display/decorative font designed for impact. It appears on footer text (`text-sm`) and possibly small UI elements.
   - What's unclear: Whether Norse remains legible and aesthetically pleasing at very small sizes
   - Recommendation: Visually review after implementation. If Norse looks poor at text-sm, consider whether footer text should use the body font (Inter) instead -- but this is outside the phase scope unless it looks broken.

## Sources

### Primary (HIGH confidence)
- Next.js Font API Reference (https://nextjs.org/docs/app/api-reference/components/font) - `localFont()` configuration, `adjustFontFallback`, `display`, `preload`, `fallback`, `variable`, `declarations` options
- Next.js Font Getting Started (https://nextjs.org/docs/app/getting-started/fonts) - Usage patterns, multiple weights, CLS prevention
- fonttools Documentation (https://fonttools.readthedocs.io/en/latest/subset/) - `pyftsubset` usage for OTF-to-WOFF2 conversion
- Norse font files (directly parsed) - Actual font metrics extracted from `fonts/norse/Norse.otf` and `fonts/norse/Norse-Bold.otf`

### Secondary (MEDIUM confidence)
- Chrome Developers Blog: Framework tools for font fallbacks (https://developer.chrome.com/blog/framework-tools-font-fallback) - How Next.js computes fallback metrics
- Chrome Developers Blog: Improved font fallbacks (https://developer.chrome.com/blog/font-fallbacks) - `size-adjust`, `ascent-override` explanation
- web.dev Font Best Practices (https://web.dev/articles/font-best-practices) - `font-display` strategy guidance

### Tertiary (LOW confidence)
- Norse font page (https://www.joelcarrouche.com/fonts/norse) - Font description and licensing (100% free for personal and commercial use)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `next/font/local` is the official Next.js solution for local fonts; well-documented with stable API
- Architecture: HIGH - Current codebase already uses CSS variable pattern; swap is architecturally clean
- Font metrics: HIGH - Extracted directly from the actual font binary files in the repo
- Pitfalls: HIGH - Based on known Next.js font integration issues and direct code analysis of the codebase
- Typography tuning: MEDIUM - Letter-spacing and line-height recommendations are general best practices; exact values need visual testing with Norse specifically

**Research date:** 2026-02-07
**Valid until:** 2026-03-09 (30 days -- stable domain, Next.js font API is mature)
