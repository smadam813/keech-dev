# Feature Landscape: v1.2 Norse Identity

**Domain:** Norse/runic typography, hero imagery, and decorative Elder Futhark elements for a neobrutalist portfolio
**Researched:** 2026-02-07
**Overall Confidence:** HIGH

## Table Stakes

Features that are necessary for the Norse Identity milestone to feel complete. Missing any of these will leave the visual upgrade feeling half-done or inconsistent.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Norse display font replacing Space Grotesk for all headings** | The entire milestone is premised on deepening the Norse aesthetic. If headings still use a generic geometric sans-serif, the milestone has not shipped. The Joel Carrouche Norse font (Regular + Bold, OTF, freeware) must replace `--font-display` sitewide. | Med | Convert OTF to WOFF2 for 25-30% smaller file size. Use `next/font/local` with `localFont()` in `fonts.ts`. Define both Regular (400) and Bold (700) weights via `src` array. Assign to `--font-display` CSS variable. Keep `display: 'swap'` to prevent FOIT (Flash of Invisible Text). Norse includes Latin extended characters plus full runic Unicode glyphs -- both useful. |
| **Font renders correctly at all existing heading sizes** | The site has headings at `text-6xl` through `text-9xl` (home hero), `text-2xl`/`text-xl`/`text-lg` (prose headings), `text-3xl` (mobile nav), and `text-2xl` (header logo). Norse has very different metrics than Space Grotesk. If letter-spacing, line-height, or sizing looks wrong at any of these, the font swap feels broken. | Med | Norse is a display typeface with angular, wide letterforms. Test every heading context after swap: home hero, blog post titles, project titles, nav links, mobile menu, footer. May need Tailwind `tracking-*` and `leading-*` adjustments per context. `size-adjust` in `@font-face` can reduce layout shift if fallback metrics differ significantly. |
| **Hero image on home page with "keech.dev" text overlay** | The current home page is a centered text-only splash. A Norse landscape hero image (mountains, Yggdrasil, aurora, floating runes) transforms this from a blank page into an atmospheric entry point. The text overlay must maintain WCAG AA contrast. | High | Use `next/image` with `fill` and `priority` props inside a `position: relative` wrapper. Apply `object-fit: cover` and `object-position: center` via className. Layer a scrim overlay (semi-transparent gradient or solid) between image and text to guarantee contrast. Test at all breakpoints: the image will crop differently on mobile (portrait) vs desktop (landscape). Keep the focal point centered in the source image so `object-fit: cover` cropping preserves it. |
| **Hero text remains readable across all viewport sizes** | WCAG 2.1 SC 1.4.3 requires 4.5:1 contrast for body text and 3:1 for large text (18pt+ or 14pt+ bold). The "keech.dev" heading at `text-6xl`+ qualifies as large text, so 3:1 minimum. But the scrim must guarantee this regardless of which portion of the image shows. | Med | A full-image scrim overlay (not partial gradient) is safest because it guarantees contrast regardless of image region. Use `bg-black/50` or `bg-foreground/60` depending on palette. Test with Chrome DevTools contrast checker. Alt text on the hero image must describe the scene for screen readers. The text overlay itself should be real HTML text (not baked into the image) so screen readers and search engines can read it. |
| **At least one decorative rune element visible in the design** | If the milestone ships a Norse font and hero image but zero rune ornaments, the "Elder Futhark elements" goal is unmet. At minimum, one rune-based decorative element (section divider, nav accent, or list marker) must appear. | Low | Start with section dividers -- they are the most visible and least invasive. Use Elder Futhark Unicode characters (U+16A0 to U+16FF) in CSS `content` property via `::before`/`::after` pseudo-elements. The Norse font itself includes these glyphs with Unicode support, so they render in the same visual style as headings. |
| **Inter body font preserved unchanged** | The body font (Inter) must remain untouched. Norse is a display typeface with angular carved-stone aesthetics that would be unreadable at body text sizes (16px paragraph text). Web typography best practice: display fonts for headings only, clean sans-serif for body text. | None | No code change needed, but verify: the `--font-body` variable must still resolve to Inter. The font swap only touches `--font-display`. |

## Differentiators

Features that elevate the Norse identity from "font swap with hero" into "cohesive atmospheric experience." Not required for the milestone to be complete, but they are what makes visitors remember the site.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Rune section dividers between content sections** | Horizontal rules are generic. A divider with Elder Futhark runes (e.g., `ᚠ -- ᚢ -- ᚦ` or a row of spaced runes) makes every page feel intentionally Norse. Replaces or supplements existing `<hr>` styling. | Low | CSS-only via `::before`/`::after` on `<hr>` elements or a dedicated `<RuneDivider>` component. Use Unicode rune characters in the `content` property: `content: "\16A0  \16A6  \16B7"`. Apply the display font family so runes render in Norse style. Space with `letter-spacing: 0.5em` or flexbox. Wrap in `aria-hidden="true"` per WCAG SC 1.1.1 (decorative non-text content). |
| **Rune bullet markers for lists** | Custom list markers using Elder Futhark runes (e.g., the Fehu rune `ᚠ` or Algiz `ᛉ` as bullet points) in blog prose or project descriptions. Subtle but distinctive. | Low | Use CSS `::marker` pseudo-element with `content: "\16A0"` and `font-family: var(--font-display)`. The `::marker` pseudo-element supports `content`, `color`, and `font-*` properties. Alternatively, use `list-style-type: "\16A0  "` (with trailing space for padding). Apply only to `.prose ul` to keep scope controlled. |
| **Rune accents in navigation** | Small rune glyphs flanking nav link labels (e.g., `ᚠ Home ᚠ`) or a single rune preceding each link. Reinforces the Norse theme in the most frequently-seen UI element. | Low | Add `::before` pseudo-elements to nav link classes with a rune character. Use `opacity: 0.4` or the muted color to keep them atmospheric rather than distracting. Only show on desktop nav -- mobile menu links are already large and bold, additional ornament would clutter. Apply `aria-hidden="true"` to decorative pseudo-content. |
| **Subtle runic background texture on sections** | A faint repeating pattern of rune-like geometric marks behind certain page sections (hero, footer, or content areas). Adds depth without competing with content. | Med | CSS-only approach preferred for performance: use `repeating-linear-gradient` or `background-image` with a small inline SVG data URI of a simplified rune stroke. Keep opacity extremely low (5-10%) so it reads as texture, not content. Alternative: a small PNG/SVG tile (under 2KB) served from `/public/` with `background-repeat: repeat`. Avoid large raster images -- CSS patterns weigh bytes, not kilobytes. |
| **Runic background texture in footer** | The footer (dark `bg-foreground` section) is a natural canvas for a subtle rune pattern overlay. The dark background masks texture imperfections and the contrast feels intentional. | Low | Apply background texture specifically to the `<footer>` element. Since the footer already has `bg-foreground text-background`, a white/light rune pattern at 3-5% opacity creates a parchment-like effect. Simpler than full-page textures because the footer is a contained, non-scrolling element. |
| **Animated rune fade on hero load** | On page load, 2-3 floating rune characters fade in around the hero text with a subtle drift animation (similar to the existing `fadeInUp` but with slight horizontal movement). Atmospheric, not distracting. | Med | Create a `<FloatingRunes>` client component with `useEffect` for timing. Render 2-3 absolute-positioned rune `<span>` elements with `animate-on-load` and staggered `animation-delay`. Must respect `prefers-reduced-motion: reduce` -- disable animation, show runes statically. Keep runes small (text-sm to text-lg) and semi-transparent. |
| **Hero image blur-up placeholder** | While the hero image loads, show a tiny blurred placeholder (the Next.js `placeholder="blur"` prop). Prevents the jarring flash of empty space above the fold. | Low | For local images, Next.js can auto-generate blur placeholders at build time when using static imports. Add `placeholder="blur"` to the Image component. For external/dynamic images, provide a `blurDataURL` (base64-encoded tiny version). Since this is a static AI-generated image in `/public/`, a static import is simplest. |
| **Mobile-optimized hero crop** | On mobile, a 16:9 landscape hero image loses its impact because `object-fit: cover` crops the sides heavily. Provide an art-directed mobile version or adjust `object-position` per breakpoint. | Med | Two approaches: (1) Use `object-position: center 30%` on mobile to show more of the top/sky area. (2) Provide a separate portrait-oriented crop for mobile via the `<picture>` element or conditional Next.js Image `src`. Option 1 is simpler and usually sufficient. Test with the actual AI-generated image to see which area contains the most atmosphere. |

## Anti-Features

Features to explicitly NOT build. These are common traps when adding themed visual elements to a portfolio site.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Norse font for body text** | The Norse typeface is an angular display face inspired by stone-carved runes. At 16px body text size, it would be illegible, fatiguing, and inaccessible. Every web typography guide warns against display fonts for body text. Even Norse's own designer describes it as suited for "titles" and "pagan magazines" headers. | Keep Inter for all body/paragraph text. Norse exclusively for headings, nav labels, and decorative display. |
| **Full runic alphabet translation / easter egg cipher** | Tempting to show text in actual Elder Futhark runes as a gimmick. This fails because: (1) Elder Futhark has only 24 characters and does not map cleanly to modern English; (2) no visitor can read it; (3) it replaces readable content with decoration, violating accessibility principles. | Use rune characters purely as decorative ornament (dividers, markers, texture). Never replace readable Latin text with rune transliterations. |
| **Animated rune particles / snow-style falling runes** | Particle effects (runes drifting across the screen like snow) are visually cool but: (1) tank performance on mobile, (2) distract from content, (3) trigger motion sensitivity, (4) require canvas or complex JS. This pushes "atmospheric" into "annoying" territory. | Limit animation to the hero section on load (2-3 runes fading in once). No continuous particle systems. |
| **Parallax scrolling on hero image** | Parallax effects on the hero image (background scrolling slower than foreground) create janky scroll performance on mobile, trigger motion sickness in sensitive users, and conflict with neobrutalist flat/bold aesthetic. Parallax implies depth; neobrutalism embraces flatness. | Use a static hero image with `object-fit: cover`. The neobrutalist hard-edge shadows and bold borders already create visual interest without parallax. |
| **Multiple hero images / image carousel** | A carousel on the home page adds complexity (autoplay accessibility issues, gesture handling, state management) for no benefit. The home page is a landing -- one strong image is more impactful than a slideshow. | Single AI-generated hero image. Curate one excellent image rather than cycling through several mediocre ones. |
| **Rune tooltips showing meanings** | Hovering over decorative runes to reveal "Fehu: wealth" or similar tooltips seems educational but: (1) decorative runes are not meant to be interactive; (2) tooltips are inaccessible on touch devices; (3) it positions decorative elements as interactive, confusing screen readers. | Rune characters are pure decoration. If rune meanings are interesting content, write a blog post about it. Do not attach interactivity to ornamental elements. |
| **Dark mode / theme toggle for "nighttime Norse"** | PROJECT.md explicitly states single theme, no dark/light toggle. The cohesive dusty pink/teal palette is core to the brand identity. Adding a dark "midnight Norse" toggle fragments the visual identity. | One theme. The existing palette already evokes a cosmic dusk atmosphere. |
| **Video hero background** | A looping video (aurora borealis, floating runes) behind the hero text seems on-theme but: (1) massively increases page weight and load time; (2) mobile browsers often block autoplay; (3) accessibility requires pause controls; (4) Vercel bandwidth costs increase. | Static image with optional CSS-only subtle animation (floating rune glyphs via `@keyframes`). |
| **Overly ornate rune borders around every component** | Wrapping every card, code block, and button in rune-patterned borders turns "atmospheric" into "theme park." Neobrutalism relies on clean hard borders and flat shadows. Adding rune filigree to borders contradicts the design language. | Rune ornament belongs in specific controlled locations: dividers, list markers, nav accents, background textures. The existing 3px solid black borders define the neobrutalist identity and should not be replaced. |

## Feature Dependencies

```
Norse Font Swap (foundation -- do first)
    |
    +-- Download Norse font (Regular + Bold OTF)
    +-- Convert OTF to WOFF2
    +-- Configure localFont() in fonts.ts
    +-- Replace --font-display CSS variable
    +-- Test all heading contexts for visual fit
    +-- Adjust letter-spacing / line-height if needed
    |
    v
Hero Image (depends on font swap being done -- hero text uses Norse font)
    |
    +-- Acquire/generate AI Norse landscape image
    +-- Optimize image (WebP, multiple sizes)
    +-- Build hero section with next/image fill + priority
    +-- Add scrim overlay for text contrast
    +-- Position "keech.dev" text overlay
    +-- Test responsive cropping at all breakpoints
    +-- Add alt text for accessibility
    +-- Add blur-up placeholder
    |
    +-- [Enhancement] Floating rune animation on load
    +-- [Enhancement] Mobile-optimized object-position
    |
    v
Decorative Rune Elements (independent of hero, depends on font swap)
    |
    +-- Rune section dividers (CSS pseudo-elements)
    +-- Rune list markers (CSS ::marker)
    +-- Rune nav accents (CSS ::before on nav links)
    |
    +-- [Enhancement] Runic background texture (CSS gradients or SVG)
    +-- [Enhancement] Footer rune texture
    |
    v
Polish & Integration (after all above)
    |
    +-- Cross-page visual consistency audit
    +-- Performance testing (font load, image load, CLS)
    +-- Accessibility audit (contrast, screen reader, motion)
```

**Key dependency insight:** The Norse font swap is the foundation. The hero image and rune ornaments both use the display font, so it must be integrated first. Once the font is live, the hero image and rune ornaments can be built in parallel.

## What Makes Norse Font Usage Tasteful vs Overdone

This is the central design tension of the milestone. The Norse font is inherently dramatic -- angular, carved, mythological. Used well, it creates atmosphere. Used too much, it creates a costume.

### Tasteful (DO)

- **Headings only.** Norse for `h1`-`h6`, nav labels, and the site logo. Everything else stays in Inter.
- **Size creates impact.** Norse looks best large (24px+). At small sizes, its angular forms lose clarity. The existing heading hierarchy (`text-6xl` down to `text-lg`) is already well-suited.
- **Restraint on decoration.** Two to three types of rune ornament across the entire site, not one per component. Dividers + list markers + one background texture = enough.
- **Runes as texture, not content.** Decorative runes add atmosphere when they are small, faded, and peripheral. They should feel like weathered inscriptions on a stone wall, not a fantasy game UI.
- **Neobrutalist framing.** The existing hard shadows, thick borders, and flat color blocks are the primary visual language. Norse elements are layered on top as accent, not replacement.

### Overdone (DO NOT)

- **Norse font below 18px.** The angular forms become illegible and the site looks like a Halloween costume.
- **Runes on every interactive element.** Buttons, form inputs, badges, and tags should stay clean. Rune ornament on interactive elements creates ambiguity about what is clickable.
- **More than 3 rune characters visible simultaneously** (outside of a deliberate divider). A cluster of runes looks cluttered rather than atmospheric.
- **High-opacity rune textures.** Background textures above 10% opacity compete with content. At 3-5%, they add depth. At 20%+, they add noise.
- **Rune animation loops.** One-time fade-in on load is atmospheric. Continuous pulsing, rotating, or drifting runes are distracting and drain battery.

## Hero Image Technical Specification

### Recommended Image Approach

| Aspect | Recommendation | Rationale |
|--------|---------------|-----------|
| **Source dimensions** | 1920x1080 minimum (16:9) | Standard full-width hero baseline. High-DPI displays benefit from 2560px wide source. |
| **Format** | WebP with JPEG fallback | Next.js Image component auto-serves WebP/AVIF when browser supports it. Store original as high-quality JPEG or PNG in `/public/images/`. |
| **File size target** | Under 200KB after optimization | Above-fold hero image loads eagerly (`priority`), so file size directly impacts LCP. |
| **Focal point** | Center of image | `object-fit: cover` crops from edges. Center-weighted composition survives all viewport ratios. |
| **Color palette** | Dark tones (deep blues, purples, blacks) with aurora highlights | Dark hero image + light text + scrim = easy contrast. Avoid hero images with bright areas that fight the scrim. |
| **Content** | Mountains, Yggdrasil silhouette, aurora borealis, subtle floating runes | Per PROJECT.md spec. Yggdrasil and mountains create a horizon line that anchors the composition. Aurora provides color interest in the sky region. |

### Scrim Overlay Strategy

| Technique | When to Use | CSS |
|-----------|-------------|-----|
| **Full solid overlay** | Simplest, guaranteed contrast | `bg-black/50` or `bg-foreground/60` as absolute-positioned div between image and text |
| **Bottom gradient scrim** | Image top is visually interesting and should show through | `background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)` |
| **Radial spotlight** | Text is centered and image edges should show | `background: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)` |

**Recommendation for this site:** Full solid overlay. The neobrutalist aesthetic favors bold, obvious design decisions over subtle gradients. A solid `bg-foreground/50` overlay ties the hero to the existing palette and keeps the contrast deterministic. Test at 40%, 50%, and 60% opacity to find the sweet spot where the image atmosphere shows through but text is crisp.

### Responsive Behavior

| Viewport | Height | Object Position | Notes |
|----------|--------|----------------|-------|
| Desktop (1024px+) | `h-[70vh]` or `h-[80vh]` | `object-position: center` | Full cinematic hero experience |
| Tablet (768px-1023px) | `h-[60vh]` | `object-position: center` | Slightly shorter to avoid scroll trap |
| Mobile (< 768px) | `h-[50vh]` or `h-[60vh]` | `object-position: center 30%` | Show more sky/aurora, less ground. Avoid full-viewport-height hero on mobile -- users need to see there is content below. |

## Elder Futhark Rune Reference

Selected runes suitable for decorative use, chosen for visual distinctiveness and balance.

| Rune | Unicode | Hex | Name | Visual Quality | Suggested Use |
|------|---------|-----|------|---------------|---------------|
| ᚠ | U+16A0 | \16A0 | Fehu | Strong vertical with diagonals | List markers, divider anchors |
| ᚦ | U+16A6 | \16A6 | Thurisaz | Angular thorn shape | Section accents |
| ᚨ | U+16A8 | \16A8 | Ansuz | Asymmetric diagonals | Nav accents |
| ᚱ | U+16B1 | \16B1 | Raido | Geometric angularity | Background texture element |
| ᚲ | U+16B2 | \16B2 | Kauna | Simple open angle | Minimal decorative marker |
| ᚷ | U+16B7 | \16B7 | Gebo | X-shape (gift) | Divider center ornament, very balanced |
| ᚺ | U+16BA | \16BA | Hagalaz | H-like crossbar | Structural divider element |
| ᛇ | U+16C7 | \16C7 | Eihwaz | Vertical with offset branches | Background texture |
| ᛉ | U+16C9 | \16C9 | Algiz | Upward branching (protection) | Strong visual anchor, section divider focus |
| ᛏ | U+16CF | \16CF | Tiwaz | Arrow/spear pointing up | Direction indicators, nav accents |
| ᛟ | U+16DF | \16DF | Othala | Diamond with legs (heritage) | Footer accent, site identity ornament |

**Font rendering note:** These Unicode code points are in the Runic block (U+16A0-U+16FF). The Norse font by Joel Carrouche includes glyphs for these characters. When the Norse font is set as the font-family on elements using rune characters, they will render in the Norse typeface style rather than a system fallback. If the font has not loaded yet, most system fonts do NOT include Runic glyphs, so a fallback like Noto Sans Runic or the runes may render as tofu (empty boxes). Ensure the Norse font is loaded before rune ornaments are critical to layout.

## Accessibility Checklist for Norse Elements

| Element | Requirement | Implementation |
|---------|-------------|----------------|
| Decorative rune characters | Must not be announced by screen readers | Wrap in `<span aria-hidden="true">` or use CSS `content` property in pseudo-elements (inherently not in accessibility tree unless explicitly added) |
| Hero image | Must have descriptive alt text | `alt="Norse landscape with mountains, aurora borealis, and the world tree Yggdrasil"` |
| Hero text overlay | Must be real HTML text, not baked into image | Render as `<h1>` element positioned over the image via CSS |
| Text contrast over hero | Must meet WCAG 2.1 SC 1.4.3 (3:1 for large text) | Scrim overlay guarantees contrast regardless of image region |
| Rune animations | Must respect `prefers-reduced-motion` | Disable animations, show runes statically. Existing `@media (prefers-reduced-motion: reduce)` block in globals.css handles this if animation classes are used consistently |
| Background textures | Must not interfere with text readability | Keep texture opacity at 3-10%. Test with Chrome Accessibility tools. |

## MVP Recommendation

For the v1.2 milestone to feel complete with minimum scope:

**Prioritize (must-ship):**
1. **Norse font swap** -- Foundation for everything else. Replaces Space Grotesk as `--font-display`.
2. **Hero image with text overlay** -- Transforms the home page from blank splash to atmospheric entry. Includes scrim, responsive sizing, alt text.
3. **One rune divider pattern** -- A `<hr>` replacement or section divider using 3 Elder Futhark rune characters. Proves the decorative rune concept.

**Include if time allows:**
4. Rune list markers in `.prose` styles
5. Subtle rune nav accents on desktop nav links
6. Hero blur-up placeholder

**Defer to v1.3 or later:**
- Runic background textures (need design iteration to get opacity/pattern right)
- Floating rune animation on hero load (polish, not core)
- Mobile-specific hero crop (tune after seeing the actual AI image)
- Footer rune texture (nice-to-have, footer already looks good)

## Sources

### HIGH Confidence (Official Documentation, Authoritative References)

- [Next.js Font Optimization (App Router)](https://nextjs.org/docs/app/getting-started/fonts) -- `next/font/local` API, `localFont()` usage, CSS variable assignment, `display: 'swap'`
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image) -- `fill`, `priority`, `placeholder="blur"`, `sizes` prop, responsive srcSet generation
- [WCAG 2.1 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) -- 4.5:1 body text, 3:1 large text contrast requirements
- [W3C: Using Decorative Unicode Characters with aria-hidden](https://www.w3.org/WAI/GL/wiki/Using_a_Decorative_Unicode_Character) -- WCAG SC 1.1.1 compliance for decorative rune characters
- [Unicode Runic Block (U+16A0-U+16FF)](https://www.unicode.org/charts/PDF/U16A0.pdf) -- Official Unicode chart for Elder Futhark, Anglo-Saxon, and Younger Futhark rune characters
- [W3Schools UTF-8 Runic Reference](https://www.w3schools.com/charsets/ref_utf_runic.asp) -- Quick reference for rune Unicode code points
- [web.dev: Custom Bullets with CSS ::marker](https://web.dev/articles/css-marker-pseudo-element) -- `::marker` pseudo-element API, supported properties, Unicode content usage

### MEDIUM Confidence (Verified with Multiple Sources)

- [Joel Carrouche Norse Font](https://www.joelcarrouche.com/fonts/norse) -- Regular + Bold, OTF format, 100% free personal/commercial, Latin extended + Runic Unicode glyphs
- [Norse Font Download (befonts)](https://befonts.com/norse-font.html) -- Confirms OTF format, Regular + Bold weights, @font-face example
- [Smashing Magazine: Designing Accessible Text Over Images (Part 1)](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) -- Scrim, overlay, blur, and copy-space techniques for hero image text contrast
- [WCAG.com: Content Over Images Accessibility](https://www.wcag.com/blog/content-over-images-how-does-this-ux-ui-trend-impact-accessibility/) -- WCAG SC 1.4.5 (no text as images), contrast requirements, responsive design gaps
- [NN/g: Ensure High Contrast for Text Over Images](https://www.nngroup.com/articles/text-over-images/) -- Scrim overlay best practices, readability testing methodology
- [CloudConvert OTF to WOFF2](https://cloudconvert.com/otf-to-woff2) -- Tool for font format conversion, 25-30% size reduction over OTF
- [Smashing Magazine: Reduce Font Loading Impact with CSS Descriptors](https://www.smashingmagazine.com/2021/05/reduce-font-loading-impact-css-descriptors/) -- `size-adjust`, `ascent-override`, `descent-override` for zero-CLS font loading
- [Design Work Life: Viking Fonts 2026](https://designworklife.com/viking-fonts-norse-style/) -- Display font design patterns, angular letterform characteristics
- [Hero Image Sizing Guide](https://www.cronyxdigital.com/blog/hero-image-sizing-guide-for-desktop-mobile) -- 1920x1080 desktop, 1080x1920 mobile, center-weighted focal point strategy

### LOW Confidence (Single Source, Needs Validation)

- [How To Make a Hero Image in Next.js 13/14](https://www.perssondennis.com/articles/how-to-make-a-hero-image-in-nextjs-13-and-14) -- Implementation pattern with fill prop, wrapper positioning, z-index layering. Pattern aligns with official docs but specific code examples are from a single blog source.
