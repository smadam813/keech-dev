# Domain Pitfalls

**Domain:** Norse Typography, Hero Image, and Decorative Rune Integration for Next.js Portfolio
**Project:** keech.dev
**Researched:** 2026-02-07
**Confidence:** HIGH (verified via Next.js official docs, MDN, Chrome DevDocs, codebase inspection, and multiple community sources)
**Scope:** Pitfalls specific to adding a local Norse OTF display font (replacing Google Font headings), a large PNG hero image, and decorative Elder Futhark rune elements to an existing portfolio site with established design system, WCAG AA compliance, passing Core Web Vitals, and responsive layouts.

---

## Critical Pitfalls

Mistakes that cause rewrites, performance regressions, or major accessibility breakage.

### Pitfall 1: 7MB Unoptimized Hero PNG Will Destroy LCP

**What goes wrong:** The hero image file `img/Norse_Background.png` is 7.0MB at 2752x1536 pixels, RGBA PNG format. Shipping this directly as a hero image -- even through Next.js Image component -- will cause Largest Contentful Paint (LCP) to exceed 4 seconds on mobile connections, failing Core Web Vitals. The current site passes CWV; this single addition could regress the entire performance profile.

**Why it happens:** Large PNG files with alpha channels are inherently massive. The image optimizer in Next.js can convert to WebP/AVIF at request time, but the source file still dictates initial processing cost and the optimization pipeline has limits. A 7MB source on a 3G connection takes ~19 seconds to download even before optimization kicks in. On Vercel's free tier, repeated optimization of a 7MB source per visitor increases function execution time and can hit bandwidth limits.

**Consequences:**
- LCP fails (threshold: < 2.5s good, 2.5-4s needs improvement, > 4s poor)
- Lighthouse performance score drops from green to red
- Mobile users on slower connections see a blank or partially loaded hero for seconds
- Vercel image optimization costs increase with oversized source files
- Git repository bloat: 7MB binary in the repo compounds with every version

**Prevention:**
- **Pre-optimize the source image before it enters the codebase.** Use a tool like `sharp`, `squoosh`, or ImageMagick to:
  1. Resize to maximum needed display width (e.g., 1920px for full-bleed desktop, generate smaller variants)
  2. Convert to WebP or AVIF format at 80-85% quality
  3. Target < 200KB for the primary hero image after compression
  4. Strip the alpha channel if the background color is known (RGBA PNG is far larger than RGB)
- Use `next/image` with explicit `width` and `height` (or `fill` with parent sizing) to prevent CLS
- Set `preload={true}` (Next.js 16 replaces the deprecated `priority` prop) since this is the LCP element
- Set `loading="eager"` and `fetchPriority="high"` on the hero image
- Configure `next.config.ts` to enable AVIF: `images: { formats: ['image/avif', 'image/webp'] }`
- Use `placeholder="blur"` with a pre-generated blurDataURL (10x10px inline base64) for perceived performance
- Store optimized images in `public/images/` not in arbitrary directories like `img/`

**Detection:**
- Run `lighthouse` or `pagespeed.web.dev` before and after hero image addition
- Check Network tab in DevTools: hero image transfer size should be < 300KB
- Verify LCP element in Chrome DevTools Performance panel

**Phase relevance:** Must be addressed in the very first task of the hero image phase. The source file needs optimization before any integration work begins.

**Confidence:** HIGH -- verified by inspecting the actual file (`file` command: PNG 2752x1536 RGBA, `ls -lh`: 7.0MB) and cross-referencing Next.js Image docs and web performance guidelines.

**Sources:**
- [Next.js Image Component Docs](https://nextjs.org/docs/app/api-reference/components/image)
- [DebugBear: Next.js Image Optimization](https://www.debugbear.com/blog/nextjs-image-optimization)
- [Chrome DevDocs: Image Optimization](https://developer.chrome.com/docs/performance/insights/font-display)

---

### Pitfall 2: Font Migration from Google to Local Breaks Size-Adjusted Fallback

**What goes wrong:** The codebase currently uses `next/font/google` for Space Grotesk (`src/lib/fonts.ts`). Replacing it with a Norse OTF font via `next/font/local` is not a simple path swap. The `next/font/google` module automatically generates size-adjusted fallback font metrics (using `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` CSS properties) that match the Google font's exact metrics. A custom Norse OTF font will have completely different metrics than Space Grotesk. If the fallback configuration is wrong or missing, you get visible layout shift (CLS) as the fallback font swaps to the custom font.

**Why it happens:** Google Fonts have pre-computed metrics in the `next/font` system. Local fonts use a generic fallback: `adjustFontFallback` defaults to `'Arial'` for `next/font/local`, which applies Arial-based size-adjust values. A decorative Norse/Viking display font will have dramatically different proportions than Arial -- wider glyphs, different x-height, different ascender/descender ratios. The auto-generated fallback metrics will be inaccurate, causing text to visibly reflow when the custom font loads.

**Consequences:**
- Visible text reflow (FOUT with layout shift) on every page load
- CLS score regression -- currently passing, could fail
- Headings jump in size/position as font swaps from Arial fallback to Norse display font
- The effect is most visible on the large hero text `keech.dev` which uses `text-6xl` to `text-9xl`

**Prevention:**
- Set `display: 'swap'` on the local font declaration (this is the default and correct for a display font that users should see)
- Set `adjustFontFallback: false` if the auto-generated Arial fallback looks wrong, then manually specify a `fallback` array with a visually closer system font
- Alternatively, use `display: 'optional'` for the decorative Norse font -- this tells the browser: use the font if it loads within ~100ms, otherwise keep the fallback forever for this page view. This eliminates FOUT entirely at the cost of sometimes not showing the Norse font on first visit (it will be cached for subsequent visits)
- Test the font swap visually: throttle network to Slow 3G in DevTools and watch the heading text load. Any visible jump = CLS problem
- The Norse font file MUST be co-located relative to where `localFont()` is called. If `fonts.ts` is in `src/lib/`, the font file path is relative to that directory. Example: `src/lib/fonts/NorseFont.otf` and `src: './fonts/NorseFont.otf'`
- Do NOT store the font in `/public/` -- `next/font/local` requires a relative path from the calling module, not a public URL

**Detection:**
- DevTools Performance tab: look for "Layout Shift" entries correlated with font load
- Web Vitals extension: CLS delta after font swap
- Visual: throttle to Slow 3G and watch for heading text jumping

**Phase relevance:** Font integration phase. This is the most technically nuanced task in the milestone.

**Confidence:** HIGH -- verified by reading the existing `src/lib/fonts.ts` (currently uses `next/font/google` with `display: "swap"`), cross-referencing Next.js font API docs for `adjustFontFallback`, `display`, and `fallback` options.

**Sources:**
- [Next.js Font API Reference](https://nextjs.org/docs/app/api-reference/components/font)
- [Chrome DevDocs: Font Fallbacks](https://developer.chrome.com/blog/font-fallbacks)
- [Vercel Blog: Custom fonts without compromise](https://vercel.com/blog/nextjs-next-font)

---

### Pitfall 3: Elder Futhark Runes Missing from System Fonts on Mobile Devices

**What goes wrong:** Elder Futhark runes are encoded in Unicode block U+16A0-16FF ("Runic"). If runes are rendered as raw Unicode characters (e.g., `&#x16A0;` for Fehu), they will display as empty boxes, question marks, or tofu on devices that lack a font with Runic block coverage. Android and iOS do NOT reliably include Runic Unicode support in their default system fonts. Even on Windows, support only exists in Segoe UI Historic (Windows 10+) -- not guaranteed on older systems.

**Why it happens:** Unicode defines the codepoints, but rendering requires a font that contains glyphs for those codepoints. The Runic block is obscure and not included in most system font stacks (San Francisco on iOS, Roboto on Android, system-ui on Linux). Mobile browsers will show a missing glyph indicator (tofu square) for any Runic Unicode character unless a web font covering that range is loaded.

**Consequences:**
- Decorative runes render as ugly tofu squares on most mobile devices
- Inconsistent appearance across platforms: might work on Windows desktop but fail on iOS Safari
- Screen readers may attempt to read the Unicode character names (e.g., "RUNIC LETTER FEHU FEOH FE F"), creating confusing audio
- If runes are used for navigation or meaningful content (not just decoration), the site becomes unusable on affected devices

**Prevention:**
- **Use inline SVGs for rune decorations instead of Unicode characters.** SVGs render identically on every device, have no font dependency, scale perfectly (vector), and can be styled with CSS (fill, stroke, opacity). This is the recommended approach.
- If Unicode characters are used anyway, include a web font that covers the Runic block (e.g., Junicode, BabelStone Runic, or a subset of Noto Sans Runic) loaded via `@font-face` or `next/font/local`. Only subset the specific runes needed to minimize file size.
- As a middle-ground: use a small custom SVG icon set of the 5-10 specific runes you want, rather than the full 96-character block
- For either approach, mark all decorative runes with `aria-hidden="true"` (see Pitfall 5)

**Detection:**
- Test on a real iPhone in Safari and a real Android device in Chrome
- Open the page in Chrome DevTools with "Disable local font faces" enabled (Rendering tab)
- Search for tofu: if any square boxes appear where runes should be, the font is missing

**Phase relevance:** Rune decoration phase. The SVG vs. Unicode decision should be made before implementation begins, as it affects every file where runes appear.

**Confidence:** HIGH -- verified via Unicode.org Runic block chart, BabelStone font documentation, Wikipedia Runic block article, and Alan Wood's Unicode test pages.

**Sources:**
- [Unicode Runic Block Chart (U+16A0-16FF)](https://www.unicode.org/charts/PDF/U16A0.pdf)
- [Runic Unicode Block - Wikipedia](https://en.wikipedia.org/wiki/Runic_(Unicode_block))
- [Font Support for Runic Block](https://www.fileformat.info/info/unicode/block/runic/fontsupport.htm)
- [BabelStone Runic Fonts](https://www.babelstone.co.uk/Fonts/Runic.html)

---

### Pitfall 4: OTF Display Font File Size and Format Inefficiency

**What goes wrong:** OTF (OpenType) font files are significantly larger than WOFF2 files. A decorative Norse display font in OTF format might be 200-500KB. The same font converted to WOFF2 would be 50-150KB. Shipping an OTF file directly through `next/font/local` means every visitor downloads an unnecessarily large font file, impacting First Contentful Paint and total page weight.

**Why it happens:** OTF uses less efficient compression than WOFF2. The WOFF2 format was specifically designed for web delivery with Brotli compression, achieving 30-50% smaller file sizes than OTF/TTF. Many font creators distribute in OTF/TTF format because those are the desktop-native formats. Web developers often use the file as-is without converting.

**Consequences:**
- 2-4x larger font download than necessary
- Slower font load = longer FOUT/FOIT period
- Impacts performance budget: a 400KB OTF font eats a significant chunk of the ~500KB total ideal page weight
- `next/font/local` works with OTF but does not auto-convert it to WOFF2

**Prevention:**
- **Convert the OTF font to WOFF2 before adding to the codebase.** Use tools like:
  - `fonttools` / `pyftsubset`: `pyftsubset font.otf --output-file=font.woff2 --flavor=woff2`
  - Google's `woff2_compress` tool
  - Online converters like CloudConvert or Transfonter
- If the font has many weights/styles but only one is needed (display headings are typically bold only), subset to the single weight needed
- Subset the character set: if the Norse font is only used for the site title and headings, strip unused glyphs. A font subsetted to Latin characters + a few special characters can drop from 300KB to 30KB
- Reference the WOFF2 file in `next/font/local`:
  ```typescript
  const norseFont = localFont({
    src: './fonts/norse-bold.woff2',
    weight: '700',
    display: 'swap',
    variable: '--font-display',
  })
  ```

**Detection:**
- Check font file size: anything over 100KB for a single-weight display font warrants investigation
- Network tab: observe font transfer size in the Waterfall view
- Lighthouse: "Avoid enormous network payloads" audit will flag large font files

**Phase relevance:** Font preparation, before integration. Convert and subset first, then integrate.

**Confidence:** HIGH -- OTF vs WOFF2 size differences are well-documented across multiple authoritative sources.

**Sources:**
- [BrowserStack: Variable Fonts vs Static Fonts](https://www.browserstack.com/guide/variable-fonts-vs-static-fonts)
- [MDN: Variable Fonts Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts)
- [Can I Use: WOFF2](https://caniuse.com/woff2)

---

## Moderate Pitfalls

Issues that cause visual bugs, accessibility failures, or developer frustration but are recoverable without rewrites.

### Pitfall 5: Decorative Runes Pollute Screen Reader Experience

**What goes wrong:** Decorative rune elements that lack `aria-hidden="true"` will be announced by screen readers. If using Unicode characters, screen readers will read the Unicode character name (e.g., "RUNIC LETTER FEHU FEOH FE F"). If using inline SVGs without proper ARIA, screen readers may announce the SVG structure or alt text. In both cases, decorative elements create noise for assistive technology users, degrading the accessible experience that the site currently maintains (WCAG AA compliant).

**Why it happens:** Screen readers announce all visible text content by default. Unicode characters are text content. SVGs without `aria-hidden` are treated as meaningful images. Developers add decorative elements visually and forget they exist in the accessibility tree.

**Consequences:**
- Screen reader users hear gibberish Unicode names or SVG descriptions between meaningful content
- WCAG AA compliance is broken (1.1.1 Non-text Content: decorative elements must be implementable in a way that assistive technology can ignore them)
- The site's established accessibility standard regresses

**Prevention:**
- **Every decorative rune element MUST have `aria-hidden="true"`.** No exceptions.
- For Unicode characters: wrap in a `<span aria-hidden="true">` element
  ```tsx
  <span aria-hidden="true" className="rune-decoration">&#x16A0;</span>
  ```
- For inline SVGs: add `aria-hidden="true"` and `role="presentation"` to the `<svg>` element
  ```tsx
  <svg aria-hidden="true" role="presentation" viewBox="...">...</svg>
  ```
- Never put decorative runes inside interactive elements (buttons, links) -- `aria-hidden` is inherited by children and would hide the interactive element's accessible name
- If a rune is used as part of meaningful content (e.g., a section heading), provide equivalent text content and hide the rune: `<h2><span aria-hidden="true">&#x16A0;</span> About Me</h2>` -- the heading text "About Me" carries the meaning
- Add an ESLint rule or code review checkpoint: any element containing Runic Unicode (U+16A0-16FF) or rune SVG must have `aria-hidden="true"`

**Detection:**
- Test with VoiceOver (macOS/iOS) or NVDA (Windows): navigate through the page and listen for unexpected character announcements
- Chrome Accessibility Tree inspector: check if decorative elements appear in the tree
- axe DevTools audit: scan for decorative content without appropriate ARIA

**Phase relevance:** Every task that adds rune elements. Should be a code review checkbox for every PR in this milestone.

**Confidence:** HIGH -- verified via MDN aria-hidden docs, WCAG 1.1.1, and multiple accessibility authority sources (Deque, A11Y Collective, Smashing Magazine).

**Sources:**
- [MDN: aria-hidden attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)
- [A11Y Collective: Managing Content Visibility with aria-hidden](https://www.a11y-collective.com/blog/aria-hidden-meaning/)
- [Deque: Creating Accessible SVGs](https://www.deque.com/blog/creating-accessible-svgs/)

---

### Pitfall 6: Tailwind CSS v4 Font Variable Registration Disconnect

**What goes wrong:** The current site uses `@theme inline` in `globals.css` to bridge `next/font` CSS variables to Tailwind utilities:
```css
@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
}
```
When switching from `next/font/google` to `next/font/local`, the CSS variable name MUST remain `--font-display` (or the `@theme inline` block, all `font-display` utility usages, and the base layer heading rules must all be updated in lockstep). If the variable name changes -- even slightly -- every heading on the site falls back to the browser default serif font.

**Why it happens:** Tailwind CSS v4 uses CSS-first configuration. Font families are registered via `@theme` blocks that reference CSS custom properties. These properties are set on the `<html>` element by `next/font` via the `variable` option. If the local font uses a different variable name (e.g., `--font-norse` instead of `--font-display`), Tailwind's `font-display` utility resolves to nothing. The heading styles in the base layer (`h1-h6 { @apply font-display }`) stop working silently -- no build error, just wrong fonts.

**Consequences:**
- All headings across the entire site render in the browser default font (usually Times New Roman)
- No build-time error or warning -- the failure is entirely visual
- Easy to miss in development if the developer has the Norse font installed as a system font (it would still render via system font fallback, masking the bug)

**Prevention:**
- **Keep the CSS variable name `--font-display` when creating the local font.**
  ```typescript
  const norseFont = localFont({
    src: './fonts/norse-bold.woff2',
    weight: '700',
    display: 'swap',
    variable: '--font-display',  // MUST match existing variable name
  })
  ```
- If the variable name must change, update ALL three locations in lockstep:
  1. `localFont({ variable: '--font-norse' })` in fonts.ts
  2. `@theme inline { --font-norse: var(--font-norse); }` in globals.css
  3. All `font-display` class usages changed to `font-norse` (or create a new `--font-display` alias)
- The `<html>` className in `layout.tsx` must include the new font's `.variable` property (currently: `${spaceGrotesk.variable} ${inter.variable}`)
- Test in an incognito window with DevTools "Disable local font faces" (Rendering tab) to catch fallback issues

**Detection:**
- Visual inspection: do headings use the Norse font or a serif fallback?
- DevTools Computed Styles: check `font-family` on any `<h1>` -- it should show the Norse font name, not a system font
- Search codebase for `font-display` usage to ensure all references are consistent

**Phase relevance:** Font integration phase. A single variable name mismatch breaks the entire typography hierarchy.

**Confidence:** HIGH -- verified by reading the current `globals.css` (lines 25-28 showing `@theme inline` usage), `fonts.ts`, and `layout.tsx`, cross-referenced with Tailwind CSS v4 font-family docs and multiple community discussions about this exact issue.

**Sources:**
- [Tailwind CSS v4: font-family](https://tailwindcss.com/docs/font-family)
- [Tailwind Discussion #15923: Custom font family in v4 + Next.js](https://github.com/tailwindlabs/tailwindcss/discussions/15923)
- [Tailwind Discussion #13410: NextJS font variable not applying in v4](https://github.com/tailwindlabs/tailwindcss/discussions/13410)

---

### Pitfall 7: Hero Image CLS from Missing Dimensions or Incorrect `fill` Usage

**What goes wrong:** Adding a full-width hero image with the `fill` prop but without proper parent container styling causes the image to either collapse to 0 height (invisible) or expand unboundedly, causing massive layout shift. Alternatively, using fixed `width` and `height` props on a responsive hero creates a rigid layout that doesn't adapt to viewport changes.

**Why it happens:** When using `fill`, Next.js Image sets `position: absolute` on the image, which removes it from document flow. The parent container MUST have `position: relative` (or `fixed`/`absolute`) AND explicit height or aspect ratio. Without these, the image has no dimensions to fill. Developers often add `fill` without setting up the parent, see nothing render, then try various CSS fixes that introduce layout instability.

**Consequences:**
- Hero image invisible on initial render (0-height parent)
- Or: hero image overflows its container, overlapping other content
- CLS spike as the image "pops in" once dimensions are resolved
- Different behavior across viewport sizes if responsive styles are inconsistent

**Prevention:**
- For a full-width hero with maintained aspect ratio, use a container with `aspect-ratio`:
  ```tsx
  <div className="relative w-full aspect-[16/9]">
    <Image
      src="/images/hero.webp"
      alt=""
      fill
      sizes="100vw"
      preload
      className="object-cover"
    />
  </div>
  ```
- Always provide the `sizes` prop when using `fill` -- without it, Next.js generates srcset but the browser doesn't know which size to pick, potentially downloading the largest variant
- For the hero specifically, `sizes="100vw"` is correct since it spans the full viewport
- Use `object-fit: cover` (via `className="object-cover"`) to prevent distortion
- Set `alt=""` for a purely decorative background hero image (equivalent to `role="presentation"`)
- Test at mobile, tablet, and desktop breakpoints -- the hero is the most visible element on the page

**Detection:**
- Resize the browser window: does the hero maintain its aspect ratio?
- Check CLS in Lighthouse: the hero image should contribute 0 CLS
- DevTools Elements panel: inspect the image container's computed height -- it should never be 0

**Phase relevance:** Hero image integration phase.

**Confidence:** HIGH -- verified via Next.js Image component docs (`fill`, `sizes`, parent container requirements).

**Sources:**
- [Next.js Image Component: fill](https://nextjs.org/docs/app/api-reference/components/image#fill)
- [DebugBear: Next.js Image Optimization](https://www.debugbear.com/blog/nextjs-image-optimization)

---

### Pitfall 8: Norse Aesthetic Overdone -- Losing the Neobrutalist Identity

**What goes wrong:** The existing site has a strong, cohesive neobrutalist design language: hard offset shadows, thick borders, dusty pink palette, bold geometric typography. Adding Norse elements (ornate display font, Viking imagery, runic decorations) without restraint creates a visual identity crisis. The site stops feeling like a clean neobrutalist portfolio and starts looking like a fantasy LARP site or a metal band homepage.

**Why it happens:** Norse aesthetics are inherently ornamental and maximalist (knotwork, intricate letterforms, carved patterns). Neobrutalism is inherently minimal and geometric (flat colors, hard edges, stark contrasts). These two design languages pull in opposite directions. Without deliberate constraint, each new Norse element dilutes the neobrutalist foundation until the design is incoherent.

**Consequences:**
- The site loses its professional portfolio credibility
- Design becomes cluttered and hard to navigate
- The "cosmic, Norse-touched" vision becomes "Norse-overwhelmed"
- Typography hierarchy breaks when an ornate display font competes with decorative runes for visual attention
- Previous design system investments (color palette, shadow system, border conventions) are wasted

**Prevention:**
- **Establish a "rune budget" before implementation.** Decide exactly where runes appear and enforce it:
  - YES: Homepage hero, section dividers, footer accent
  - NO: Navigation, blog post body, interactive elements, every heading
- The Norse display font should ONLY be used for the site title / hero text. Navigation, headings within content, and UI elements should retain Space Grotesk (or a clean complementary font) to maintain readability
- Rune decorations should be subtle and low-contrast (use `opacity-20` to `opacity-40`, or the muted color) -- not full-black on pink
- Follow the design principle from actual rune stones: generous negative space around inscriptions. Runes look best with room to breathe, not crammed between content blocks
- The existing color palette (dusty pink, teal, black) should remain dominant. Norse elements adapt TO the palette, not the other way around
- Create a design review checkpoint: screenshot each page after adding Norse elements and compare side-by-side with the current design. If the page is unrecognizable, you've gone too far

**Detection:**
- Squint test: squinting at the page, is the overall impression "clean with accents" or "busy and cluttered"?
- Compare screenshots: current site vs. with Norse additions. The pages should be recognizably the same site
- Ask: "Would a potential employer take this portfolio seriously?" If hesitation, pull back

**Phase relevance:** Every phase in the milestone. This is a design-direction pitfall, not a technical one. Must be a guiding principle throughout.

**Confidence:** HIGH -- based on design principles, competitor analysis, and the explicit project vision ("cosmic, Norse-touched" per the project requirements -- "touched" implies restraint, not domination).

**Sources:**
- [Design Work Life: 31 Viking Fonts for Norse-Inspired Designs](https://designworklife.com/viking-fonts-norse-style/)
- [99designs: Norse and Nordic Designs](https://99designs.com/inspiration/designs/nordic)

---

## Minor Pitfalls

Issues that cause friction or minor bugs but are straightforward to fix.

### Pitfall 9: `next/font/local` Path Relative to Calling File, Not Project Root

**What goes wrong:** The `src` path in `localFont()` is resolved relative to the file that calls it, not the project root or `public/` directory. Developers accustomed to `public/` paths or absolute imports try paths like `/fonts/norse.woff2` or `@/fonts/norse.woff2` and get "Module not found" build errors.

**Prevention:**
- The font file should be co-located near the fonts.ts file. If `fonts.ts` is at `src/lib/fonts.ts`, place fonts at `src/lib/fonts/norse-bold.woff2`
- Use relative path: `src: './fonts/norse-bold.woff2'`
- Do NOT use path aliases (`@/`), absolute paths (`/`), or `public/` directory references
- The font file should NOT be in `public/` -- `next/font/local` handles serving it with proper caching headers and optimization

**Detection:** Build fails with "Module not found" error referencing the font path.

**Phase relevance:** Font integration phase -- first 5 minutes of setup.

**Confidence:** HIGH -- verified via Next.js font docs and multiple GitHub discussions about this exact issue.

---

### Pitfall 10: `priority` Prop Deprecated in Next.js 16 -- Use `preload`

**What goes wrong:** The project runs Next.js 16.1.6 (verified in `package.json`). Developers following older tutorials use `priority` on the hero Image component. In Next.js 16, `priority` is deprecated. The component still works, but it may emit deprecation warnings and could be removed in a future version.

**Prevention:**
- Use `preload={true}` instead of `priority` on the hero Image component
- Combine with `loading="eager"` for belt-and-suspenders:
  ```tsx
  <Image
    src="/images/hero.webp"
    alt=""
    fill
    preload
    loading="eager"
    sizes="100vw"
  />
  ```
- Only apply `preload` to ONE image per page -- the LCP candidate (the hero). Preloading multiple images is counterproductive

**Detection:** Console deprecation warnings mentioning `priority`. Lighthouse audit: "Preload Largest Contentful Paint image".

**Phase relevance:** Hero image integration phase.

**Confidence:** HIGH -- verified via Next.js 16 Image component docs ("`priority` has been deprecated in favor of `preload`").

**Sources:**
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js Image Component API](https://nextjs.org/docs/app/api-reference/components/image)

---

### Pitfall 11: Hero Image Text Overlay Contrast Regression

**What goes wrong:** Placing the hero text (`keech.dev`) over a complex background image can reduce text contrast below WCAG AA thresholds (4.5:1 for normal text, 3:1 for large text). The current design has black text on a solid dusty pink background -- guaranteed high contrast. A photographic or illustrated background introduces variable brightness regions where some text areas may become unreadable.

**Prevention:**
- Apply a semi-transparent overlay between the image and text:
  ```tsx
  <div className="relative">
    <Image src="/images/hero.webp" alt="" fill className="object-cover" />
    <div className="absolute inset-0 bg-background/70" /> {/* overlay */}
    <div className="relative z-10">
      <h1>keech<span className="text-accent">.dev</span></h1>
    </div>
  </div>
  ```
- Test contrast with the overlay at multiple opacity levels. 60-80% opacity of the background color typically works
- Use `colorable` (already in devDependencies) to verify contrast ratios
- The teal accent `.dev` text needs particular attention -- teal on a dark or busy background may fail contrast
- Consider a CSS gradient overlay (transparent at top, solid at bottom) for a more natural effect

**Detection:**
- Chrome DevTools contrast ratio checker in the color picker
- `colorable` package (already in project devDependencies)
- axe DevTools: "Elements must have sufficient color contrast" audit

**Phase relevance:** Hero image integration phase, specifically the text overlay implementation.

**Confidence:** HIGH -- WCAG contrast requirements are well-established; the risk is inherent to placing text over images.

---

### Pitfall 12: Single-Weight Display Font Declared Without Explicit Weight

**What goes wrong:** When using `next/font/local` with a non-variable font file (a static OTF/WOFF2), you MUST specify the `weight` property. If omitted, the browser assigns the default CSS weight of `400` (normal). A Norse display font is almost certainly designed as bold (700+). If it's declared as weight 400 but used with `font-bold` (Tailwind's `font-weight: 700`), the browser may attempt to synthesize bold from the normal weight -- resulting in ugly, artificially thickened letterforms. Or if the font IS actually bold but registered as 400, applying `font-bold` will do nothing visible.

**Prevention:**
- Always declare the correct weight for static font files:
  ```typescript
  const norseFont = localFont({
    src: './fonts/norse-bold.woff2',
    weight: '700',          // Match the font's actual weight
    style: 'normal',
    display: 'swap',
    variable: '--font-display',
  })
  ```
- Check the font's metadata to determine its actual weight: use `fonttools` or an online font inspector
- If the font is a single-weight display font marketed as "Bold" or "Black", register it at its actual weight (700 or 900)
- Remove `font-bold` from headings if the font is already bold by design -- double-bolding produces browser-synthesized extra-bold which looks bad

**Detection:**
- Compare the font in the browser to the font in a design tool -- if it looks thicker/thinner, the weight is misconfigured
- DevTools Computed Styles: check `font-weight` and `font-synthesis` values

**Phase relevance:** Font integration phase.

**Confidence:** HIGH -- standard CSS font-weight behavior, verified via MDN and Next.js font docs.

---

### Pitfall 13: Git Repository Bloat from Binary Assets

**What goes wrong:** Adding font files (50-500KB each), a hero image (potentially megabytes), and SVG rune assets to the Git repository increases clone and pull times. Over time, as these assets are updated, Git retains every version, compounding the bloat. The current repository is lean; adding 7MB+ of binary assets is a proportionally significant increase.

**Prevention:**
- Optimize all assets BEFORE committing (Pitfall 1 for images, Pitfall 4 for fonts)
- The hero image should be < 200KB after optimization (WebP/AVIF)
- Font files should be < 100KB after WOFF2 conversion and subsetting
- SVG rune files should be tiny (< 5KB each for simple rune shapes)
- Do NOT commit the original 7MB PNG -- only the optimized version
- Consider adding the raw/source assets to `.gitignore` and keeping them in a separate design assets location
- If large source files must be version-controlled, consider Git LFS (but this is probably overkill for a personal portfolio)

**Detection:**
- `git diff --stat` before committing: total added bytes should be < 500KB for all new binary assets combined
- `du -sh .git/` before and after: significant increase indicates bloat

**Phase relevance:** Asset preparation, before first commit of binary files.

**Confidence:** HIGH -- standard Git best practice.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Font preparation | OTF not converted to WOFF2 (Pitfall 4) | Critical | Convert and subset before any integration |
| Font integration | Variable name mismatch breaks all headings (Pitfall 6) | Critical | Keep `--font-display` variable name |
| Font integration | Wrong weight declaration (Pitfall 12) | Moderate | Check font metadata, declare correct weight |
| Font integration | Path resolution error (Pitfall 9) | Minor | Co-locate font file, use relative path |
| Font integration | Fallback size-adjust mismatch causes CLS (Pitfall 2) | Critical | Test with throttled network, consider `display: 'optional'` |
| Hero image prep | 7MB PNG shipped as-is (Pitfall 1) | Critical | Pre-optimize to < 200KB WebP/AVIF |
| Hero image integration | Missing dimensions / bad `fill` setup (Pitfall 7) | Moderate | Use `fill` with `aspect-ratio` parent container |
| Hero image integration | Text contrast regression (Pitfall 11) | Moderate | Semi-transparent overlay, verify with colorable |
| Hero image integration | Using deprecated `priority` prop (Pitfall 10) | Minor | Use `preload={true}` instead |
| Rune decoration | Unicode tofu on mobile (Pitfall 3) | Critical | Use inline SVGs, not Unicode characters |
| Rune decoration | Screen reader pollution (Pitfall 5) | Moderate | `aria-hidden="true"` on every decorative rune |
| All phases | Design cohesion lost (Pitfall 8) | Critical | Rune budget, restraint principle, comparison screenshots |
| All phases | Repository bloat from unoptimized assets (Pitfall 13) | Minor | Optimize all assets before first commit |

---

## Integration Risks: Protecting Existing Achievements

The following table maps each existing achievement to the pitfalls that could regress it:

| Achievement to Protect | Threatening Pitfalls | Protection Strategy |
|------------------------|---------------------|---------------------|
| **WCAG AA compliance** | Pitfall 5 (screen reader), Pitfall 11 (contrast) | `aria-hidden` on decorations, contrast overlay on hero |
| **Core Web Vitals (LCP)** | Pitfall 1 (7MB image), Pitfall 4 (large font) | Pre-optimize all assets before integration |
| **Core Web Vitals (CLS)** | Pitfall 2 (font fallback), Pitfall 7 (image dimensions) | Explicit dimensions, test font swap at slow network |
| **Responsive layouts** | Pitfall 7 (fill without parent), Pitfall 8 (clutter) | aspect-ratio container, viewport testing |
| **Typography hierarchy** | Pitfall 6 (variable mismatch), Pitfall 12 (weight), Pitfall 8 (design clash) | Keep variable names, verify weights, restraint |
| **Design cohesion** | Pitfall 8 (overdone Norse) | Rune budget, comparison screenshots, squint test |

---

## Pre-Implementation Checklist

Before writing any code for this milestone, verify:

- [ ] Hero image optimized to < 200KB (WebP or AVIF, appropriate dimensions)
- [ ] Font file converted to WOFF2 and subsetted to needed characters
- [ ] Decision made: SVGs or Unicode for runes (SVGs recommended)
- [ ] "Rune budget" defined: exactly which pages/locations get Norse elements
- [ ] Font variable name strategy confirmed (keep `--font-display` or update everywhere)
- [ ] Baseline Lighthouse scores recorded for comparison after changes

---

## Sources

### Official Documentation
- [Next.js Font API Reference](https://nextjs.org/docs/app/api-reference/components/font)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js Getting Started: Fonts](https://nextjs.org/docs/app/getting-started/fonts)
- [Tailwind CSS v4: font-family](https://tailwindcss.com/docs/font-family)
- [MDN: aria-hidden](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)
- [MDN: Variable Fonts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts)

### Unicode and Runes
- [Unicode Runic Block Chart](https://www.unicode.org/charts/PDF/U16A0.pdf)
- [Runic Unicode Block - Wikipedia](https://en.wikipedia.org/wiki/Runic_(Unicode_block))
- [Font Support for Runic Block](https://www.fileformat.info/info/unicode/block/runic/fontsupport.htm)
- [BabelStone Runic Fonts](https://www.babelstone.co.uk/Fonts/Runic.html)
- [Alan Wood's Runic Unicode Test](https://www.alanwood.net/unicode/runic.html)

### Performance and Optimization
- [Chrome DevDocs: Font Fallbacks](https://developer.chrome.com/blog/font-fallbacks)
- [Chrome DevDocs: Font Display](https://developer.chrome.com/docs/performance/insights/font-display)
- [DebugBear: Next.js Image Optimization](https://www.debugbear.com/blog/nextjs-image-optimization)
- [Vercel Blog: Custom fonts without compromise](https://vercel.com/blog/nextjs-next-font)
- [DebugBear: Web Font Layout Shift](https://www.debugbear.com/blog/web-font-layout-shift)

### Accessibility
- [A11Y Collective: aria-hidden](https://www.a11y-collective.com/blog/aria-hidden-meaning/)
- [Deque: Creating Accessible SVGs](https://www.deque.com/blog/creating-accessible-svgs/)
- [Smashing Magazine: Accessible SVG Patterns](https://www.smashingmagazine.com/2021/05/accessible-svg-patterns-comparison/)

### Design
- [Design Work Life: Viking Fonts for Norse-Inspired Designs](https://designworklife.com/viking-fonts-norse-style/)
- [99designs: Norse and Nordic Designs](https://99designs.com/inspiration/designs/nordic)

### Community Discussions
- [Tailwind Discussion #15923: Custom font in v4 + Next.js](https://github.com/tailwindlabs/tailwindcss/discussions/15923)
- [Tailwind Discussion #13410: Font variable not applying in v4](https://github.com/tailwindlabs/tailwindcss/discussions/13410)
- [Next.js Discussion #48904: next/font works locally but not on Vercel](https://github.com/vercel/next.js/discussions/48904)
