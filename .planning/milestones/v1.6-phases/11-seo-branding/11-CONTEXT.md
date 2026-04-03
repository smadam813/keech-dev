# Phase 11: SEO & Branding - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The site presents a polished, branded identity in browser tabs, social media shares, search engine crawlers, and RSS readers. This phase delivers: favicon set (SVG + ICO + apple-touch-icon), default site-level OG image, per-post OG images with dynamic titles, accurate sitemap dates, RSS feed at `/feed.xml`, project image `sizes` attributes, and resolution of the resume placeholder button.

Requirements covered: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, CLN-02.

</domain>

<decisions>
## Implementation Decisions

### Favicon Design
- **D-01:** Favicon uses the Othala rune (ᛟ) as the symbol — it represents home/heritage and is already mapped to the Home navigation route in `src/components/runes/rune-config.ts`. This ties the favicon directly to the site's Norse identity.
- **D-02:** Favicon delivered as SVG (scalable) + ICO (legacy) + apple-touch-icon (iOS) using Next.js Metadata API conventions (`icon.svg`, `icon.ico`, `apple-icon.png` in `src/app/`).
- **D-03:** Favicon color uses the site's neobrutalist palette — teal accent on transparent or dusty rose background, with bold strokes consistent with the brand.

### OG Image Branding
- **D-04:** Default site-level OG image uses a neobrutalist card design — dusty rose background, bold black border (`--border-brutal`), site name "keech.dev" in Norse display font, description in Inter body font.
- **D-05:** OG images generated via Next.js `opengraph-image.tsx` using `@vercel/og` (ImageResponse) — zero external dependencies, native Vercel deployment support.
- **D-06:** OG image dimensions: 1200x630 (standard for Twitter/LinkedIn/Facebook).

### Per-Post OG Images
- **D-07:** Per-post OG images use the same neobrutalist card layout as the site default, with the blog post title prominently displayed, post date below, and "keech.dev" branding in corner/footer.
- **D-08:** Tag display on per-post OG images at Claude's discretion — include if layout allows without visual clutter.

### Resume Placeholder
- **D-09:** Remove the "Resume Coming Soon" placeholder button entirely from the about page. The about page already has context about Adam — no need for an indefinite placeholder. If the user later creates a resume PDF, it can be added as a real download link.

### Claude's Discretion
Claude has flexibility on: exact favicon glyph rendering/weight, OG image internal layout (spacing, font sizes, decorative elements), whether to include tags on per-post OG images, RSS feed metadata details (author, categories), sitemap date source strategy for static routes (git history vs hardcoded meaningful dates), and project image `sizes` attribute values.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SEO Concerns
- `.planning/codebase/CONCERNS.md` — "No Favicon or OG Images" section (moderate severity) details the exact gap. "SEO: No OG Images for Blog Posts" section covers per-post OG gap. Sitemap `new Date()` issue documented.

### Existing SEO Infrastructure
- `src/app/sitemap.ts` — Current sitemap implementation using `new Date()` for static routes. Needs actual content dates.
- `src/app/robots.ts` — Existing robots.txt generation.
- `src/app/layout.tsx` — Root metadata with `openGraph` and `twitter` card configuration (no images yet).
- `src/app/blog/[slug]/page.tsx` — Per-post metadata with `openGraph` (no images yet).

### Design System
- `src/app/globals.css` — Neobrutalist design tokens: `--shadow-brutal`, `--border-brutal`, color palette vars. OG images must use these same colors.
- `src/lib/fonts.ts` — Norse (display) and Inter (body) font configuration. OG images should use matching fonts.

### Rune System
- `src/components/runes/rune-config.ts` — Rune-to-route mapping. Othala (ᛟ) mapped to Home — use as favicon glyph.

### Content Pipeline
- `velite.config.ts` — Post and project schemas with date fields. RSS feed and sitemap corrections need these dates.
- `content/posts/` — Blog post MDX files with frontmatter dates.
- `content/projects/` — Project MDX files with frontmatter dates.

### About Page
- `src/app/about/page.tsx` — Resume placeholder at lines 53-63. Remove the "Resume Coming Soon" section.

### Requirements
- `.planning/REQUIREMENTS.md` — SEO-01 through SEO-06, CLN-02 acceptance criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/utils.ts` — `cn()` utility for Tailwind class composition.
- `src/app/globals.css` — All neobrutalist design tokens (colors, shadows, borders) for consistent OG image styling.
- `src/lib/fonts.ts` — Font configuration for Norse and Inter — reference for OG image font matching.
- `src/components/runes/rune-config.ts` — Rune definitions with Unicode characters and aett groupings.
- Velite collections (`@/.velite`) — Type-safe access to all posts and projects with dates.

### Established Patterns
- Metadata exported as `const metadata: Metadata` from page files — extend with `images` property.
- `metadataBase: new URL('https://keech.dev')` already configured in root layout — relative OG image URLs will resolve correctly.
- `twitter.card: 'summary_large_image'` already set — OG images will auto-display on Twitter.
- Static generation via `generateStaticParams()` — OG image routes will be statically generated too.

### Integration Points
- `src/app/icon.svg` / `src/app/icon.ico` / `src/app/apple-icon.png` — New favicon files (Next.js Metadata API convention).
- `src/app/opengraph-image.tsx` — New site-level OG image generator.
- `src/app/blog/[slug]/opengraph-image.tsx` — New per-post OG image generator.
- `src/app/feed.xml/route.ts` — New RSS feed API route.
- `src/app/sitemap.ts` — Modify to use actual content dates from Velite collections.
- `src/app/about/page.tsx` — Remove resume placeholder section.

</code_context>

<specifics>
## Specific Ideas

- Othala rune (ᛟ) as favicon ties directly to the site's navigation system where it already represents Home
- OG images should feel like the site itself — someone seeing the preview card should immediately recognize the neobrutalist identity
- Norse font in OG images reinforces the brand even outside the site context

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-seo-branding*
*Context gathered: 2026-04-02*
