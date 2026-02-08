# Project Research Summary

**Project:** keech.dev v1.2 Norse Identity
**Domain:** Portfolio typography enhancement with Norse aesthetic
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

This milestone transforms keech.dev's visual identity by integrating Norse design elements while preserving the existing neobrutalist foundation. Research confirms this is achievable with **zero new npm dependencies** by leveraging Next.js 16 built-in capabilities. The approach replaces Space Grotesk with a custom Norse display font via `next/font/local`, adds a hero image via `next/image`, and incorporates Elder Futhark decorative elements using Unicode characters styled by the same Norse font.

The recommended approach prioritizes restraint over maximalism. Norse elements should accent, not dominate, the existing clean neobrutalist design. The Norse font exclusively handles headings and display text; Inter body font remains unchanged. Decorative runes appear only in controlled locations (dividers, subtle accents) to avoid visual clutter that would undermine portfolio credibility. This "cosmic, Norse-touched" aesthetic means subtle atmospheric enhancement, not a fantasy-site transformation.

Key risks center on performance and design coherence. The 7MB source hero image requires pre-optimization to prevent LCP regression. Font migration from Google Fonts to local loading demands careful CSS variable coordination to avoid breaking the entire typography system. Runic Unicode characters need fallback handling for devices lacking Runic block support. Success depends on treating this as additive enhancement that respects the existing design system's constraints and achievements (WCAG AA, Core Web Vitals, responsive layouts).

## Key Findings

### Recommended Stack

All required capabilities are built into Next.js 16. No external dependencies needed.

**Core technologies:**
- **`next/font/local`** (built-in): Loads Norse font (OTF converted to WOFF2) as display font replacing Space Grotesk. Provides automatic optimization, preloading, CLS reduction, and CSS variable output identical to current `next/font/google` pattern.
- **`next/image`** (built-in): Handles hero PNG with automatic WebP/AVIF conversion, blur placeholder generation for static imports, LCP optimization via `preload` prop, and responsive sizing. Next.js 16 breaking change: use `preload` not deprecated `priority`.
- **Unicode Runic block (U+16A0-U+16FF)**: Elder Futhark characters render as text via the Norse font which includes Latin extended + complete runic alphabet. Semantic, accessible, zero assets.
- **Inline SVG in JSX**: Handles complex decorative patterns (knotwork, borders) where Unicode characters don't suffice. Inline means zero HTTP requests, full CSS control via `currentColor`.

**Critical finding:** The Norse font (Joel Carrouche, v2.20, free commercial license) serves double duty: display headings AND Elder Futhark rune rendering in one font file. Pre-build work involves converting OTF to WOFF2 (30-50% smaller, 5-10min one-time manual task using free online tools).

### Expected Features

**Must have (table stakes):**
- Norse display font replacing Space Grotesk for all headings (h1-h6, logo, nav)
- Font renders correctly at all existing heading sizes (text-6xl through text-lg)
- Hero image on home page with "keech.dev" text overlay maintaining WCAG AA contrast
- Hero text remains readable across all viewport sizes (scrim overlay required)
- At least one decorative rune element visible (section divider minimum)
- Inter body font preserved unchanged (Norse at body text sizes = illegible)

**Should have (competitive differentiators):**
- Rune section dividers between content sections (replaces generic `<hr>`)
- Rune bullet markers for lists (CSS `::marker` pseudo-element)
- Rune accents in navigation (small glyphs flanking links, desktop only)
- Subtle runic background texture on sections (3-10% opacity, CSS data URI SVG)
- Hero image blur-up placeholder (automatic with `next/image` static import)
- Mobile-optimized hero crop (`object-position` adjustment for portrait viewports)

**Defer (v2+):**
- Animated rune fade on hero load (polish, not core)
- Footer rune texture (footer already strong)
- Multiple texture variants (start with one pattern)

**Anti-features (explicitly avoid):**
- Norse font for body text (illegible at 16px)
- Full runic alphabet translations (not readable, breaks accessibility)
- Animated particle effects (performance drain, motion sensitivity)
- Parallax scrolling (janky on mobile, conflicts with neobrutalist flat aesthetic)
- Rune tooltips (decorative elements should not be interactive)
- Dark mode toggle (contradicts single-theme brand identity)
- Overly ornate rune borders on every component (theme park effect)

### Architecture Approach

This milestone integrates cleanly into the existing architecture through four seams: font swap in `fonts.ts`, hero section on home page, new decorative component directory, and additive CSS design tokens.

**Major components:**
1. **Font system modification** — `src/lib/fonts.ts` replaces `Space_Grotesk` from `next/font/google` with `localFont` from `next/font/local`. Output CSS variable name `--font-display` stays identical, so `globals.css` and all component usages require zero changes.
2. **Hero image component** — New `src/components/home/hero-section.tsx` Server Component uses `next/image` with `fill` prop, static import for automatic blur placeholder, scrim overlay for contrast, and z-index layering for text content.
3. **Decorative rune components** — New `src/components/decorative/` directory contains Server Components: `RuneDivider` (horizontal separator with rune glyphs), `RuneAccent` (inline single rune), `RuneTexture` (CSS background pattern wrapper). All use Unicode U+16A0-U+16FF rendered in Norse font, fallback to inline SVG if font lacks runic glyphs.
4. **Image optimization flow** — Move 7MB `img/Norse_Background.png` to `src/assets/hero-bg.png`, import statically. Next.js generates responsive WebP/AVIF variants at build time. Source file requires pre-optimization to ~200KB WebP before integration to avoid LCP regression.

**Key pattern:** Server Components for all decorative elements (zero client JS). CSS variable font propagation maintains single source of truth. Static image imports enable automatic blur placeholders. All decorative elements use `aria-hidden="true"` per existing accessibility standard.

### Critical Pitfalls

1. **7MB unoptimized hero PNG will destroy LCP** — The source image is 2752x1536 RGBA PNG at 7MB. Shipping directly causes 4+ second LCP, failing Core Web Vitals. Prevention: Pre-optimize to WebP/AVIF at 80-85% quality targeting <200KB before integration. Use `next/image` with `preload={true}`, `placeholder="blur"`, and configure `next.config.ts` for AVIF support.

2. **Font migration breaks size-adjusted fallback** — Replacing Google Font with local font loses auto-generated fallback metrics. Norse display font has dramatically different proportions than Arial/Space Grotesk. Wrong fallback causes visible text reflow (CLS regression). Prevention: Set `display: 'swap'` and test font load at throttled network. Consider `display: 'optional'` to eliminate FOUT entirely. Keep CSS variable name `--font-display` identical or update all three locations (fonts.ts, globals.css, component classes) in lockstep.

3. **Elder Futhark runes missing from system fonts on mobile** — Android/iOS lack Runic block (U+16A0-U+16FF) coverage. Unicode characters render as tofu squares on most mobile devices. Prevention: Use inline SVGs for rune decorations instead of Unicode (recommended), OR include web font covering Runic block (Junicode/BabelStone subset), OR accept inconsistency and test extensively.

4. **OTF display font file size inefficiency** — OTF files are 2-4x larger than WOFF2 (30-50% size reduction via Brotli compression). Norse font likely ~30KB each (Regular + Bold OTF). Prevention: Convert both OTF files to WOFF2 before integration using `fonttools`, `woff2_compress`, or online converters (Fontsource, Transfonter). Target <100KB total for both weights.

5. **Decorative runes pollute screen reader experience** — Runes without `aria-hidden="true"` are announced as Unicode character names ("RUNIC LETTER FEHU FEOH FE F"), degrading accessibility. Breaks WCAG AA compliance. Prevention: Every decorative rune element MUST have `aria-hidden="true"`. No exceptions. Add code review checkpoint.

## Implications for Roadmap

Based on research, suggested phase structure follows dependency graph: font foundation, then hero (uses font), then decorative elements (use font), then polish.

### Phase 1: Font Swap Preparation
**Rationale:** All subsequent work depends on Norse font being active (hero text, rune decorations, navigation). Font conversion must happen before integration because WOFF2 conversion is external to codebase.
**Delivers:** WOFF2 font files ready for integration
**Actions:**
- Download Norse font zip from Joel Carrouche official site
- Extract `Norse.otf` and `Norse Bold.otf`
- Convert both to WOFF2 using free online tool (Fontsource converter or Transfonter)
- Create `src/fonts/` directory
- Place `Norse-Regular.woff2`, `Norse-Bold.woff2`, `LICENSE.txt` in `src/fonts/`
**Avoids:** Pitfall 4 (OTF inefficiency)
**Research depth:** Standard (well-documented conversion tools, no research needed)

### Phase 2: Font Integration
**Rationale:** Foundation for everything else. Must work before hero/runes can be implemented.
**Delivers:** Norse font active sitewide for headings, Space Grotesk removed
**Implements:**
- Modify `src/lib/fonts.ts`: replace `Space_Grotesk` import with `localFont`, keep `--font-display` variable name
- Update `src/app/layout.tsx`: rename import from `spaceGrotesk` to `norse`
- Test all heading contexts for visual fit, adjust `tracking-*`/`leading-*` if needed
**Avoids:** Pitfall 2 (fallback mismatch causing CLS), Pitfall 6 (variable name disconnect)
**Research depth:** Medium (requires visual testing at throttled network, may need `display: 'optional'` decision)

### Phase 3: Hero Image Preparation
**Rationale:** 7MB source file must be optimized before integration to prevent LCP disaster. Parallel to Phase 2 (font integration).
**Delivers:** Optimized hero image <200KB ready for import
**Actions:**
- Pre-optimize `img/Norse_Background.png`: resize to 1920px wide, convert to WebP at 80-85% quality
- Move to `src/assets/hero-bg.png` (or keep in `img/` for static import)
- Verify dimensions and focal point for `object-fit: cover` cropping
**Avoids:** Pitfall 1 (7MB image destroying LCP), Pitfall 13 (git bloat)
**Research depth:** Standard (image optimization tools well-known)

### Phase 4: Hero Section Implementation
**Rationale:** Second foundation piece. Hero text uses Norse font from Phase 2. Hero is LCP element so must be performant.
**Delivers:** Home page transformed with atmospheric hero
**Implements:**
- Create `src/components/home/hero-section.tsx` Server Component
- Use `next/image` with static import, `fill`, `preload`, `placeholder="blur"`, `sizes="100vw"`
- Add scrim overlay (`bg-foreground/50` or gradient) between image and text
- Layer "keech.dev" text with z-index, center positioning
- Add `next.config.ts` modification: `images: { qualities: [75, 90] }`
- Test responsive cropping at mobile/tablet/desktop breakpoints
**Avoids:** Pitfall 7 (CLS from missing dimensions), Pitfall 11 (contrast regression), Pitfall 10 (deprecated `priority` prop)
**Research depth:** Medium (requires contrast testing, responsive behavior validation)

### Phase 5: Decorative Rune Components
**Rationale:** Unicode vs SVG decision point. Can be built in parallel with Phase 4 (both depend on font from Phase 2).
**Delivers:** Reusable rune decoration components
**Implements:**
- Create `src/components/decorative/` directory
- Build `RuneDivider` (section separator with 3-6 rune characters)
- Build `RuneAccent` (single rune for inline use)
- DECISION POINT: Test if Norse font renders Unicode U+16A0-U+16FF glyphs. If yes, use Unicode. If no (tofu boxes), switch to inline SVG paths.
- All components Server Components with `aria-hidden="true"`
**Avoids:** Pitfall 3 (Unicode tofu on mobile), Pitfall 5 (screen reader pollution), Pitfall 8 (design overdone)
**Research depth:** High (requires testing Unicode coverage, fallback strategy decision, visual design iteration)

### Phase 6: Rune Integration and Polish
**Rationale:** Final integration across pages. Must have all components from Phase 5 ready.
**Delivers:** Cohesive Norse aesthetic sitewide
**Implements:**
- Add `RuneDivider` between sections on home page (after hero, before content)
- Add `RuneAccent` to header logo or nav links (optional, test visual balance)
- Add `RuneDivider` above footer (optional)
- Create `RuneTexture` component with CSS data URI SVG pattern (optional)
- Apply rune list markers to `.prose` styles (optional)
**Avoids:** Pitfall 8 (overdone Norse losing neobrutalist identity)
**Research depth:** Low (design iteration and visual testing, no technical unknowns)

### Phase Ordering Rationale

- **Font preparation before integration** because WOFF2 conversion is external, one-time task that blocks all subsequent work.
- **Font integration first** because hero text overlay, rune characters, and all decorative elements depend on Norse font being active in CSS. If font swap breaks, nothing else works.
- **Hero prep and font integration in parallel** because image optimization is independent of font work. Both are foundations.
- **Hero implementation after font** because hero text must render in Norse font. Dependency enforced.
- **Rune components parallel to hero** because both depend on font, neither depends on each other. Parallel speeds delivery.
- **Rune integration last** because it's the most subjective (visual design iteration) and least technical. Can iterate safely once foundations are solid.

This ordering minimizes risk: foundations first (font, image), then structure (hero, components), then polish (integration, visual tuning).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Rune components):** Unicode coverage testing needed. If Norse font lacks Runic glyphs, pivot to SVG implementation requires design decisions on which runes, visual style, path data generation.
- **Phase 6 (Integration):** Visual design iteration to define "rune budget" and prevent overdone aesthetic. May need design review with PROJECT.md vision as reference.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Font prep):** Font format conversion well-documented, free online tools available.
- **Phase 2 (Font integration):** Next.js `next/font/local` API fully documented, clear migration path.
- **Phase 3 (Image prep):** Image optimization standard practice, tools well-known.
- **Phase 4 (Hero implementation):** Next.js Image component fully documented, pattern established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All features verified as Next.js 16 built-ins via official docs. Zero npm installs needed. Breaking changes documented (priority→preload, images.qualities default). |
| Features | HIGH | Clear delineation between must-have/should-have/anti-features based on portfolio best practices, neobrutalist design principles, and WCAG compliance requirements. |
| Architecture | HIGH | Integration seams mapped to existing codebase (fonts.ts, page.tsx, globals.css verified). Server Component pattern established, CSS variable propagation proven. |
| Pitfalls | HIGH | Critical pitfalls verified against actual files (7MB PNG exists, fonts.ts structure inspected, Next.js 16 version confirmed in package.json). Multiple authoritative sources for each pitfall. |

**Overall confidence:** HIGH

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **Norse font Unicode coverage for Runic block:** Font description confirms "Latin extended, Runic" but actual glyph rendering must be tested at Phase 5 implementation. If coverage is incomplete, fallback to inline SVG requires design iteration. Test early in Phase 5.
- **Optimal scrim opacity for text contrast:** Research recommends 40-60% for solid overlay or gradients, but actual hero image colors dictate final value. Must test with real image using Chrome DevTools contrast checker in Phase 4.
- **Mobile hero cropping focal point:** `object-position` value depends on hero image composition (where Yggdrasil/aurora/mountains are positioned). Research recommends `center 30%` but requires validation with actual AI-generated image in Phase 4.
- **Font swap CLS impact:** Whether to use `display: 'swap'` (show fallback, then swap) vs `display: 'optional'` (skip font if not loaded fast enough) depends on measured CLS delta at throttled network. Requires testing in Phase 2.
- **Rune budget definition:** How many rune decorations constitute "tasteful" vs "overdone" is subjective. Needs visual design iteration in Phase 6 with comparison screenshots against current design. Follow guideline: 2-3 rune decoration types sitewide, not per component.

## Sources

### PRIMARY (HIGH confidence)

**Stack research sources:**
- [Next.js Font Optimization (App Router)](https://nextjs.org/docs/app/getting-started/fonts) — `next/font/local` API, CSS variable assignment
- [Next.js Font API Reference](https://nextjs.org/docs/app/api-reference/components/font) — all configuration options verified
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image) — fill, preload, placeholder props
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — breaking changes (priority→preload, images.qualities)
- [Unicode Runic Block Chart](https://www.unicode.org/charts/PDF/U16A0.pdf) — Elder Futhark code points

**Features research sources:**
- [WCAG 2.1 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — contrast requirements
- [W3C: Using Decorative Unicode Characters](https://www.w3.org/WAI/GL/wiki/Using_a_Decorative_Unicode_Character) — aria-hidden compliance
- [web.dev: Custom Bullets with CSS ::marker](https://web.dev/articles/css-marker-pseudo-element) — rune list markers

**Architecture research sources:**
- Codebase inspection: fonts.ts, layout.tsx, globals.css, page.tsx verified
- [A11Y Collective: SVG Accessibility](https://www.a11y-collective.com/blog/svg-accessibility/) — decorative SVG patterns

**Pitfalls research sources:**
- [Chrome DevDocs: Font Fallbacks](https://developer.chrome.com/blog/font-fallbacks) — size-adjust, CLS prevention
- [DebugBear: Next.js Image Optimization](https://www.debugbear.com/blog/nextjs-image-optimization) — LCP optimization
- [BabelStone Runic Fonts](https://www.babelstone.co.uk/Fonts/Runic.html) — Runic Unicode coverage

### SECONDARY (MEDIUM confidence)

- [Joel Carrouche Norse Font](https://www.joelcarrouche.com/fonts/norse) — font specifications, license confirmation
- [Smashing Magazine: Text Over Images Accessibility](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) — scrim overlay techniques
- [Vercel Blog: Custom fonts without compromise](https://vercel.com/blog/nextjs-next-font) — next/font system internals
- [Tailwind CSS v4 Discussions #15923, #13410](https://github.com/tailwindlabs/tailwindcss/discussions/) — CSS variable font integration patterns

### TERTIARY (LOW confidence, needs validation)

- Norse.otf Runic Unicode coverage: Font page states "Latin extended, Runic" but actual glyph rendering unverified. Must test in Phase 5.
- Hero image composition focal point: Recommendations for `object-position` based on typical Norse landscape, but actual AI-generated image may differ. Validate in Phase 4.

---

*Research completed: 2026-02-07*
*Ready for roadmap: yes*
