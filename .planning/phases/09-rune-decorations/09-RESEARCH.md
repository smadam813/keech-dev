# Phase 9: Rune Decorations - Research

**Researched:** 2026-02-08
**Domain:** Elder Futhark rune decorations, CSS custom markers, web font integration, accessible decorative elements
**Confidence:** HIGH

## Summary

Phase 9 weaves Elder Futhark rune elements across the site as decorative accents: section dividers, list bullet markers, navigation accents, and background texture. The core technical domain involves rendering Unicode Runic characters (U+16A0-U+16FF) via a web font, styling them through CSS custom list markers and pseudo-elements, and creating subtle SVG-based background textures -- all while maintaining accessibility with `aria-hidden`.

A critical discovery during research: **the existing Norse font (Joel Carrouche) DOES contain 81 runic glyphs covering the entire Elder Futhark and more in the Unicode Runic block.** This directly contradicts the user's assumption in CONTEXT.md ("Joel Carrouche does not contain actual rune glyphs"). The user must be informed of this finding so they can decide whether to use the existing Norse font or still require a separate dedicated runic font. If they choose the Norse font, no new font dependency is needed. If they prefer a distinct aesthetic for runes vs. headings, Noto Sans Runic (Google Fonts, OFL-1.1) or BabelStone Runic Elder Futhark (OFL-1.1, WOFF2 available) are the best options.

**Primary recommendation:** Present the Norse font's runic coverage finding to the user. If Norse font is approved for rune rendering, implement with zero new dependencies. If a separate font is desired, use Noto Sans Runic via `next/font/google` for simplest integration.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Runes carry actual Elder Futhark meaning -- each chosen for its symbolic association with the context where it appears
- Context-specific mapping: blog/knowledge sections get wisdom runes, project sections get craft/creation runes, navigation gets journey runes
- Support the full 24-rune Elder Futhark alphabet -- not all need to appear now, but the system should accommodate all 24 for future use
- Claude researches Elder Futhark meanings and proposes the context-to-rune mapping during planning; user reviews before implementation
- Use a dedicated runic font that covers the Elder Futhark Unicode block (U+16A0-U+16FF) -- NOT the existing Norse display font (Joel Carrouche), which does not contain actual rune glyphs **(NOTE: Research found this premise is incorrect -- see Open Questions)**
- Researcher to find appropriate runic font options (WOFF2, open license)
- Accent-level prominence: clearly visible but secondary to content
- All decorative rune elements must be aria-hidden for accessibility

### Claude's Discretion

- Divider style (rune between lines vs rune sequence vs other)
- Bullet approach (same rune per list vs varied)
- Nav accent placement and behavior
- Background texture style and location
- Color treatment (teal, neutral, or context-dependent mix)
- Animation (static vs scroll-reveal)
- Per-page density variation
- Rune font aesthetic (carved vs clean geometric vs hybrid)
- Style and aesthetic of rune font: pick what bridges Norse theme with neobrutalist foundation

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Norse font (Joel Carrouche) | Already installed | Runic glyphs via `--font-display` | Already loaded sitewide, contains 81 Unicode Runic glyphs -- zero additional font load |
| Noto Sans Runic | 5.2.6 (Google Fonts) | Alternative runic font if separate aesthetic desired | OFL-1.1, available via `next/font/google`, clean geometric sans-serif rune aesthetic |
| BabelStone Runic Elder Futhark | 3.005 | Alternative runic font with carved aesthetic | OFL-1.1, WOFF2 available, more traditional/inscribed rune style |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS `@counter-style` | Native CSS | Custom list bullet markers | Creating cyclic rune bullets for lists (~94% browser support) |
| CSS `::before` pseudo-element | Native CSS | Fallback bullet approach + nav accents | Universal browser support alternative if `@counter-style` insufficient |
| SVG data URIs | N/A | Background texture patterns | Lightweight repeating rune patterns at 3-10% opacity |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Norse font for runes | Noto Sans Runic | Adds a second font load (~5-10KB WOFF2) but provides distinct rune aesthetic separate from heading font |
| Norse font for runes | BabelStone Runic Elder Futhark | More traditional carved aesthetic; requires manual WOFF2 download and `next/font/local` setup |
| `@counter-style` for bullets | `::before` pseudo-element | More verbose CSS but 100% browser support and more styling control (color, size, font-family) |
| SVG data URI texture | CSS `background-image` with repeated `<text>` | SVG text approach allows using the font but is more complex; pure CSS gradient patterns are lighter but can't render rune shapes |
| React components for runes | CSS-only approach | React components provide more flexibility (context-aware rune selection, props) but add JS overhead for purely decorative elements |

**Installation (if using Noto Sans Runic):**
```bash
# No npm install needed -- available via next/font/google
```

**Installation (if using BabelStone):**
```bash
# Manual download required from babelstone.co.uk
# Place WOFF2 file in public/fonts/
```

## Elder Futhark Reference

### The 24 Runes by Aett

**First Aett (Freyr's/Freya's Aett) -- Creation & Prosperity:**

| # | Rune | Unicode | Name | Meaning | Keywords |
|---|------|---------|------|---------|----------|
| 1 | ᚠ | U+16A0 | Fehu | Wealth | Abundance, success, resources |
| 2 | ᚢ | U+16A2 | Uruz | Aurochs/Strength | Endurance, power, vitality |
| 3 | ᚦ | U+16A6 | Thurisaz | Thorn/Giant | Protection, conflict, defense |
| 4 | ᚨ | U+16A8 | Ansuz | God (Odin) | Communication, wisdom, inspiration |
| 5 | ᚱ | U+16B1 | Raidho | Journey | Travel, movement, progress |
| 6 | ᚲ | U+16B2 | Kenaz | Torch | Knowledge, enlightenment, creativity |
| 7 | ᚷ | U+16B7 | Gebo | Gift | Exchange, generosity, reciprocity |
| 8 | ᚹ | U+16B9 | Wunjo | Joy | Harmony, success, celebration |

**Second Aett (Hagal's Aett) -- Transformation & Challenge:**

| # | Rune | Unicode | Name | Meaning | Keywords |
|---|------|---------|------|---------|----------|
| 9 | ᚺ | U+16BA | Hagalaz | Hail | Disruption, change, catalyst |
| 10 | ᚾ | U+16BE | Nauthiz | Need | Necessity, constraint, hardship |
| 11 | ᛁ | U+16C1 | Isa | Ice | Stillness, patience, preservation |
| 12 | ᛃ | U+16C3 | Jera | Year/Harvest | Rewards, cycles, fruition |
| 13 | ᛇ | U+16C7 | Eihwaz | Yew tree | Renewal, transformation, initiation |
| 14 | ᛈ | U+16C8 | Perthro | Fate/Mystery | Secrets, chance, destiny |
| 15 | ᛉ | U+16C9 | Algiz | Elk/Protection | Guardian, sanctuary, instinct |
| 16 | ᛊ | U+16CA | Sowilo | Sun | Victory, illumination, achievement |

**Third Aett (Tyr's Aett) -- Divinity & Ascension:**

| # | Rune | Unicode | Name | Meaning | Keywords |
|---|------|---------|------|---------|----------|
| 17 | ᛏ | U+16CF | Tiwaz | Tyr (god) | Justice, leadership, honor |
| 18 | ᛒ | U+16D2 | Berkano | Birch | Growth, nurturing, creativity |
| 19 | ᛖ | U+16D6 | Ehwaz | Horse | Partnership, progress, trust |
| 20 | ᛗ | U+16D7 | Mannaz | Human | Identity, community, social order |
| 21 | ᛚ | U+16DA | Laguz | Water/Lake | Intuition, flow, adaptability |
| 22 | ᛜ | U+16DC | Ingwaz | Ing (god) | Fertility, potential, completion |
| 23 | ᛟ | U+16DF | Othala | Heritage | Inheritance, ancestry, legacy |
| 24 | ᛞ | U+16DE | Dagaz | Day | New beginnings, awakening, breakthrough |

### Proposed Context-to-Rune Mapping

Based on rune meanings and the site's content sections:

**Navigation -- Journey/Path Runes:**
| Nav Item | Rune | Name | Rationale |
|----------|------|------|-----------|
| Home | ᛟ (U+16DF) | Othala | Heritage, ancestral home, one's domain |
| Blog | ᚨ (U+16A8) | Ansuz | Communication, wisdom, divine speech |
| Projects | ᚲ (U+16B2) | Kenaz | Torch/knowledge, craft, creative fire |
| About | ᛗ (U+16D7) | Mannaz | The self, human identity, community |

**Blog/Knowledge Sections -- Wisdom Runes:**
- Primary bullet: ᚨ Ansuz (wisdom, communication)
- Divider: ᚲ Kenaz (enlightenment, knowledge)
- Alternative bullets: ᛃ Jera (harvest of learning), ᛊ Sowilo (illumination)

**Project Sections -- Craft/Creation Runes:**
- Primary bullet: ᚲ Kenaz (craft, creative fire)
- Divider: ᚠ Fehu (wealth of work, abundance)
- Alternative bullets: ᚢ Uruz (strength, building), ᛒ Berkano (growth, creation)

**General/Shared:**
- Section dividers: ᛞ Dagaz (new beginnings -- transition between sections)
- Background texture: ᚱ Raidho (journey), ᛉ Algiz (protection), ᚹ Wunjo (joy)

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── runes/
│   │   ├── rune-divider.tsx       # Reusable section divider with rune ornament
│   │   ├── rune-config.ts         # Elder Futhark data: all 24 runes, meanings, mappings
│   │   └── rune-background.tsx    # Background texture component (if React-based)
│   ├── layout/
│   │   ├── header.tsx             # Add rune accents to nav items
│   │   └── footer.tsx             # (minor: possible rune accent)
│   └── ...
├── app/
│   └── globals.css                # Rune bullet styles, @counter-style, background texture CSS
└── lib/
    └── fonts.ts                   # Add runic font (if separate from Norse)
```

### Pattern 1: Centralized Rune Configuration

**What:** Single source of truth for all 24 Elder Futhark runes with Unicode characters, names, meanings, and context mappings.
**When to use:** Every component that renders runes imports from this config -- ensures consistency and makes future rune additions trivial.

```typescript
// src/components/runes/rune-config.ts

export interface Rune {
  char: string       // Unicode character (e.g., 'ᚠ')
  code: string       // Unicode code point (e.g., 'U+16A0')
  name: string       // Proto-Germanic name (e.g., 'Fehu')
  meaning: string    // Primary meaning (e.g., 'Wealth')
  aett: 1 | 2 | 3   // Which aett (group of 8)
}

export const ELDER_FUTHARK: Record<string, Rune> = {
  fehu:     { char: '\u16A0', code: 'U+16A0', name: 'Fehu',     meaning: 'Wealth',      aett: 1 },
  uruz:     { char: '\u16A2', code: 'U+16A2', name: 'Uruz',     meaning: 'Strength',    aett: 1 },
  thurisaz: { char: '\u16A6', code: 'U+16A6', name: 'Thurisaz', meaning: 'Protection',  aett: 1 },
  ansuz:    { char: '\u16A8', code: 'U+16A8', name: 'Ansuz',    meaning: 'Wisdom',      aett: 1 },
  raidho:   { char: '\u16B1', code: 'U+16B1', name: 'Raidho',   meaning: 'Journey',     aett: 1 },
  kenaz:    { char: '\u16B2', code: 'U+16B2', name: 'Kenaz',    meaning: 'Knowledge',   aett: 1 },
  gebo:     { char: '\u16B7', code: 'U+16B7', name: 'Gebo',     meaning: 'Gift',        aett: 1 },
  wunjo:    { char: '\u16B9', code: 'U+16B9', name: 'Wunjo',    meaning: 'Joy',         aett: 1 },
  // ... all 24 runes
}

// Context mappings
export const NAV_RUNES = {
  '/':         ELDER_FUTHARK.othala,    // Home = heritage
  '/blog':     ELDER_FUTHARK.ansuz,     // Blog = wisdom/communication
  '/projects': ELDER_FUTHARK.kenaz,     // Projects = craft/torch
  '/about':    ELDER_FUTHARK.mannaz,    // About = self/identity
} as const

export const BLOG_RUNES = {
  bullet: ELDER_FUTHARK.ansuz,
  divider: ELDER_FUTHARK.kenaz,
} as const

export const PROJECT_RUNES = {
  bullet: ELDER_FUTHARK.kenaz,
  divider: ELDER_FUTHARK.fehu,
} as const
```

### Pattern 2: Rune Divider Component (Server Component)

**What:** A reusable `<RuneDivider>` that replaces plain `<hr>` elements with a rune-decorated divider.
**When to use:** Between major page sections, in blog post content, between project listings.

```tsx
// src/components/runes/rune-divider.tsx
import { ELDER_FUTHARK, type Rune } from './rune-config'

interface RuneDividerProps {
  rune?: Rune
  className?: string
}

export function RuneDivider({ rune = ELDER_FUTHARK.dagaz, className = '' }: RuneDividerProps) {
  return (
    <div className={`flex items-center gap-4 my-8 ${className}`} role="separator">
      <div className="flex-1 h-[2px] bg-foreground" />
      <span
        aria-hidden="true"
        className="font-display text-2xl text-accent select-none"
      >
        {rune.char}
      </span>
      <div className="flex-1 h-[2px] bg-foreground" />
    </div>
  )
}
```

### Pattern 3: CSS Custom List Bullets with Rune Characters

**What:** Replace default disc/decimal bullets with Elder Futhark rune characters.
**When to use:** Blog prose lists, project detail lists.

```css
/* Approach A: @counter-style (94% browser support) */
@counter-style rune-bullet {
  system: cyclic;
  symbols: '\16A8';  /* Ansuz - wisdom */
  suffix: ' ';
}

.prose ul {
  list-style-type: rune-bullet;
}

/* Approach B: ::before pseudo-element (100% browser support, more control) */
.prose ul {
  list-style: none;
  padding-left: 1.5em;
}

.prose ul > li::before {
  content: '\16A8';  /* Ansuz rune */
  font-family: var(--font-display);
  color: var(--color-accent);
  display: inline-block;
  width: 1.5em;
  margin-left: -1.5em;
  font-size: 0.85em;
  vertical-align: baseline;
}
```

### Pattern 4: SVG Background Texture

**What:** Low-opacity repeating rune pattern as page section background.
**When to use:** Hero section underlayer, page section accents, footer background.

```css
/* SVG data URI with rune characters rendered as text */
.rune-texture {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Ctext x='10' y='40' font-size='24' fill='%23000' opacity='0.05'%3E%E1%9A%A0%3C/text%3E%3Ctext x='60' y='80' font-size='24' fill='%23000' opacity='0.05'%3E%E1%9A%B1%3C/text%3E%3C/svg%3E");
  background-repeat: repeat;
}
```

**Note:** SVG `<text>` elements in data URIs rely on system fonts, not web fonts. For reliable rune rendering in SVG backgrounds, use SVG `<path>` elements instead of `<text>`. Create path data by tracing the rune shapes -- this is resolution-independent, tiny, and guaranteed to render identically across all browsers.

### Pattern 5: Navigation Rune Accent

**What:** Small rune character displayed alongside nav items as decorative accent.
**When to use:** Desktop nav items, mobile nav overlay.

```tsx
// In header.tsx nav items
{navItems.map((item) => (
  <Link key={item.href} href={item.href} className={/* ... */}>
    <span aria-hidden="true" className="font-display text-xs mr-1 opacity-60">
      {NAV_RUNES[item.href]?.char}
    </span>
    {item.label}
  </Link>
))}
```

### Anti-Patterns to Avoid

- **Latin-mapped rune fonts:** Do NOT use fonts that map rune shapes to Latin letters (A=ᚨ). Use proper Unicode Runic block characters. The Norse font and Noto Sans Runic both use correct Unicode encoding.
- **Rune overload:** Too many rune elements on a single page overwhelms the neobrutalist design. Stick to accent-level density -- 3-5 visible rune elements per viewport maximum.
- **Random rune selection:** Each rune has meaning in the Elder Futhark tradition. Random selection looks decorative but misses the authenticity the user wants.
- **Forgetting aria-hidden:** Every decorative rune element must be `aria-hidden="true"` since screen readers would otherwise announce meaningless Unicode characters.
- **Using `<text>` in SVG data URIs for runes:** SVG text in data URIs can't reference web fonts, so rune characters may render as tofu. Use SVG `<path>` elements with traced rune shapes instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom bullet markers | Manual DOM manipulation per `<li>` | CSS `@counter-style` or `::before` pseudo-element | CSS handles this declaratively with zero JS |
| Section dividers | Complex SVG generation at runtime | Static React component with CSS flexbox | A `div` with flexbox lines + centered rune char is simpler and faster |
| Background texture | Canvas-based rune rendering | SVG `<path>` data URI in CSS `background-image` | SVG paths are ~200 bytes, render at any resolution, need no JS |
| Font subsetting | Manual font file editing | `next/font` handles optimization; or use Norse font which is already loaded | next/font already subsets and optimizes WOFF2 delivery |
| Rune Unicode lookup | Hardcoded hex values scattered across files | Centralized `rune-config.ts` with all 24 runes | Single source of truth prevents errors and enables future additions |

**Key insight:** Every rune decoration in this phase is CSS + static markup. There is zero need for client-side JavaScript (`'use client'`). All rune components can be server components, keeping the JS bundle untouched.

## Common Pitfalls

### Pitfall 1: SVG Text Elements and Web Fonts

**What goes wrong:** SVG `<text>` elements in CSS `background-image` data URIs render rune characters as empty boxes (tofu) because the browser can't load web fonts inside inline SVG data URIs.
**Why it happens:** Data URIs are self-contained; the SVG cannot reference external fonts like `@font-face` declarations.
**How to avoid:** Use SVG `<path>` elements with the rune shapes traced as vector paths. Each Elder Futhark rune is geometrically simple (straight lines, angles) and can be represented in ~50-100 bytes of path data.
**Warning signs:** Background texture looks fine in dev (system font fallback may have rune support) but breaks in production or on mobile.

### Pitfall 2: Safari list-style Semantics

**What goes wrong:** Setting `list-style: none` on `<ul>` elements causes Safari/VoiceOver to strip list semantics -- users don't hear "list, 5 items."
**Why it happens:** WebKit intentionally removes list semantics when bullet indicators are removed, assuming the developer is using `<ul>` for layout rather than a real list.
**How to avoid:** Two options: (1) Add `role="list"` to any `<ul>` with `list-style: none`, or (2) Use `@counter-style` / `list-style-type: string` which replaces the bullet character but doesn't remove it, preserving semantics.
**Warning signs:** Automated accessibility audits may warn about redundant ARIA roles on native elements.

### Pitfall 3: Rune Font Not Loading for Background

**What goes wrong:** Rune characters in decorative elements display as tofu (empty squares) on systems without runic Unicode font support.
**Why it happens:** The web font may not be loaded yet when the element first renders, or the element uses a CSS context where the web font isn't applied.
**How to avoid:** Ensure `font-family: var(--font-display)` is explicitly set on any element rendering rune characters. For background textures, use SVG paths instead of font characters.
**Warning signs:** FOUT (flash of unstyled text) where runes briefly show as boxes, or persistent tofu on mobile.

### Pitfall 4: Excessive Visual Weight

**What goes wrong:** Rune decorations compete with content for attention, undermining the neobrutalist design's clarity.
**Why it happens:** Adding runes to navigation, bullets, dividers, and backgrounds simultaneously can create visual noise.
**How to avoid:** Follow accent-level density: runes should feel like border decoration, not primary content. Use opacity (60-80% for inline elements, 3-10% for backgrounds), smaller font sizes, and the muted/accent color rather than full foreground.
**Warning signs:** The eye is drawn to rune decorations before reading the actual content.

### Pitfall 5: Inconsistent Rune Rendering Across Fonts

**What goes wrong:** If both Norse font and a separate runic font are loaded, the same Unicode rune character renders differently depending on which font the browser selects.
**Why it happens:** CSS `font-family` fallback chains mean the browser picks the first font that has the glyph. If Norse font is in the chain and contains runic glyphs, it may override the dedicated runic font.
**How to avoid:** If using a dedicated runic font, create a separate CSS custom property (e.g., `--font-runes`) and explicitly assign it to rune elements. Don't rely on the `--font-display` fallback chain.
**Warning signs:** Runes look different in nav vs. dividers, or change appearance after font loading completes.

## Code Examples

### Complete Rune Divider with Lines

```tsx
// src/components/runes/rune-divider.tsx
// Server component -- no 'use client' needed
import { ELDER_FUTHARK, type Rune } from './rune-config'
import { cn } from '@/lib/utils'

interface RuneDividerProps {
  rune?: Rune
  className?: string
  variant?: 'single' | 'triple'
}

export function RuneDivider({
  rune = ELDER_FUTHARK.dagaz,
  className,
  variant = 'single'
}: RuneDividerProps) {
  return (
    <div
      className={cn('flex items-center gap-4 my-8', className)}
      role="separator"
    >
      <div className="flex-1 h-[2px] bg-foreground" />
      <span
        aria-hidden="true"
        className="font-display text-2xl text-accent select-none leading-none"
      >
        {variant === 'triple'
          ? `${rune.char} ${rune.char} ${rune.char}`
          : rune.char}
      </span>
      <div className="flex-1 h-[2px] bg-foreground" />
    </div>
  )
}
```

### Rune List Bullets via CSS

```css
/* globals.css addition */

/* Rune bullets for blog prose lists */
.prose ul {
  list-style: none;
  padding-left: 1.75em;
}

.prose ul > li {
  position: relative;
}

.prose ul > li::before {
  content: '\16A8';  /* ᚨ Ansuz */
  font-family: var(--font-display);
  color: var(--color-accent);
  position: absolute;
  left: -1.5em;
  font-size: 0.8em;
  line-height: inherit;
}
```

### Navigation Rune Accents

```tsx
// Modified navItems array in header.tsx
const navItems = [
  { href: '/', label: 'Home', rune: '\u16DF' },      // ᛟ Othala
  { href: '/blog', label: 'Blog', rune: '\u16A8' },   // ᚨ Ansuz
  { href: '/projects', label: 'Projects', rune: '\u16B2' }, // ᚲ Kenaz
  { href: '/about', label: 'About', rune: '\u16D7' }, // ᛗ Mannaz
]

// In the nav rendering:
<Link href={item.href} className={cn(/* existing classes */)}>
  <span aria-hidden="true" className="font-display text-xs opacity-50 mr-1">
    {item.rune}
  </span>
  {item.label}
</Link>
```

### SVG Path Background Texture

```css
/* Rune texture using SVG paths (not font-dependent) */
/* Example: Fehu (ᚠ) and Raidho (ᚱ) as simple strokes */
.rune-bg-texture {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M20 10 L20 50 M20 10 L35 25 M20 25 L35 40' stroke='%23000' stroke-width='1.5' fill='none' opacity='0.05'/%3E%3Cpath d='M65 60 L65 100 M65 60 L80 75 M65 75 L80 90' stroke='%23000' stroke-width='1.5' fill='none' opacity='0.05'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 100px 100px;
}
```

### Runic Font Setup (if separate font chosen)

```typescript
// src/lib/fonts.ts -- adding Noto Sans Runic
import { Noto_Sans_Runic } from 'next/font/google'

export const notoRunic = Noto_Sans_Runic({
  weight: '400',
  subsets: ['runic'],
  variable: '--font-runes',
  display: 'swap',
})
```

```css
/* globals.css -- if using separate font variable */
@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-runes: var(--font-runes);  /* Only if separate runic font */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `list-style-image` for custom bullets | `@counter-style` or `::before` pseudo-element | CSS3+ / 2023 | `@counter-style` now has 94% support; `::before` has 100% |
| Image files for repeating textures | SVG data URIs in CSS | 2020+ | Eliminates HTTP requests, ~0.5KB vs 50-200KB for images |
| `::marker` for full bullet control | Still limited in Safari (color/font-size only) | Ongoing | Cannot use `::marker` with `content` or `font-family` in Safari |
| Latin-mapped rune fonts | Unicode Runic block (U+16A0-U+16FF) | Unicode 3.0 (1999) | Proper semantics, copy-pasteable, works with any compliant font |

**Deprecated/outdated:**
- `list-style-image`: Works but offers no control over size, position, or color. `::before` approach is superior.
- `::marker` with `content` property: Not usable cross-browser due to Safari limitations. Use `::before` instead.

## Open Questions

1. **Norse Font vs. Dedicated Runic Font**
   - What we know: The existing Norse font (Joel Carrouche) contains 81 glyphs in the Unicode Runic block (U+16A0-U+16F0), covering ALL 24 Elder Futhark runes. This was verified via `fc-query` on the WOFF2 file. External sources confirm the Norse font has "really cool-looking entries for the Runic Unicode Block." The CONTEXT.md stated the Norse font "does not contain actual rune glyphs" -- this is factually incorrect.
   - What's unclear: Whether the user wants runes to look visually distinct from headings (separate font aesthetic), or prefers the cohesion of a single font family handling both Latin headings and runic decorations.
   - Recommendation: **Present this finding to the user before planning proceeds.** If Norse font runes are acceptable, this eliminates the need for any new font dependency and ensures visual cohesion. The Norse font's rune style is already Nordic-inspired and neobrutalist-compatible. If the user still wants a distinct rune aesthetic, recommend Noto Sans Runic for its clean geometric style and easy `next/font/google` integration.

2. **Context-Specific Rune Mapping Approval**
   - What we know: The proposed mapping (navigation: journey runes, blog: wisdom runes, projects: craft runes) follows Elder Futhark meanings faithfully.
   - What's unclear: Whether the user has preferences for specific runes beyond what the research proposes.
   - Recommendation: Include the full mapping table in the PLAN.md for user review before implementation.

3. **Background Texture Density and Placement**
   - What we know: 3-10% opacity is the requirement. SVG path data URIs are the most reliable cross-browser approach.
   - What's unclear: Exact placement (full page vs. specific sections), pattern density (how many runes per tile), and whether the texture should vary by page.
   - Recommendation: Start with a single texture applied to the main content area below the hero, adjustable via CSS class. Home page hero already has a dark scrim, so texture works best on lighter content sections.

## Sources

### Primary (HIGH confidence)
- `fc-query` on `public/fonts/Norse-Bold.woff2` and `Norse-Regular.woff2` -- verified 81 Unicode Runic glyphs (U+16A0-U+16F0) present in Norse font
- [Unicode Runic Block (U+16A0-U+16FF) - SYMBL](https://symbl.cc/en/unicode/blocks/runic/) -- Unicode code points for all runic characters
- [Noto Sans Runic - Fontsource](https://fontsource.org/fonts/noto-sans-runic) -- subsets (latin, latin-ext, runic), OFL-1.1 license, weight 400
- [Noto Sans Runic - Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+Runic) -- official Google Fonts availability
- [BabelStone Runic Elder Futhark](https://www.babelstone.co.uk/Fonts/ElderFuthark.html) -- OFL-1.1, WOFF2, v3.005, 24 Elder Futhark runes
- [CSS ::marker - Can I Use](https://caniuse.com/css-marker-pseudo) -- Safari limitation: only `color` and `font-size` supported
- [CSS @counter-style - Can I Use](https://caniuse.com/css-at-counter-style) -- ~94% browser support, partial (no image symbols)
- [MDN list-style-type](https://developer.mozilla.org/en-US/docs/Web/CSS/list-style-type) -- string values, @counter-style syntax

### Secondary (MEDIUM confidence)
- [Elder Futhark Rune Meanings - Labyrinthos](https://labyrinthos.co/blogs/elder-futhark-norse-runes-meanings-list) -- complete 24-rune listing with aett groupings and meanings
- [Thorraborinn (Tumblr)](https://thorraborinn.tumblr.com/post/110245148723/rune-fonts) -- confirms Norse font by Joel Carrouche has "really cool-looking entries for the Runic Unicode Block"
- [Scott O'Hara: Fixing Lists](https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html) -- Safari VoiceOver list-style:none semantics removal
- [Manuel Matuzovic: list-style-type](https://www.matuzo.at/blog/heres-what-i-didnt-know-about-list-style-type/) -- string values, @counter-style, ::before alternatives
- [SVG Backgrounds](https://www.svgbackgrounds.com/how-to-add-svgs-with-css-background-image/) -- SVG data URI background technique

### Tertiary (LOW confidence)
- Noto Sans Runic file size -- not found in any source; estimated 5-10KB WOFF2 based on 94 glyphs. Needs validation.
- SVG `<text>` font rendering in data URIs -- stated as unreliable based on general web knowledge, but not verified with a specific test against the Norse font. Recommendation to use `<path>` is precautionary.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- existing Norse font verified to contain runes; Noto Sans Runic confirmed on Google Fonts with WOFF2
- Architecture: HIGH -- CSS patterns for custom bullets, dividers, and SVG backgrounds are well-established and verified against browser support data
- Pitfalls: HIGH -- Safari `::marker` limitations confirmed via Can I Use; VoiceOver list semantics documented by accessibility experts
- Elder Futhark reference: MEDIUM -- rune names and meanings sourced from multiple rune references; Unicode code points verified against official Unicode charts

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable domain -- CSS and Unicode standards don't change frequently)
