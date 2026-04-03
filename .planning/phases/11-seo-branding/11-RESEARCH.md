# Phase 11: SEO & Branding - Research

**Researched:** 2026-04-02
**Domain:** Next.js Metadata API (favicons, OG images, RSS, sitemap)
**Confidence:** HIGH

## Summary

Phase 11 delivers branded identity across browser tabs, social shares, search engines, and RSS readers. The entire phase uses built-in Next.js App Router file conventions -- no external libraries needed for favicons, OG images, or sitemap. RSS requires a small utility (or hand-written XML). The one non-obvious pitfall is font handling: the Norse display font exists only as WOFF2, but Satori (the engine behind `next/og` ImageResponse) requires TTF, OTF, or WOFF. A TTF version of the Norse font must be sourced or Inter used as fallback for OG images.

The project already has `metadataBase`, `openGraph`, and `twitter.card: 'summary_large_image'` configured in the root layout. The existing sitemap imports Velite collections but uses `new Date()` for static and project routes. All infrastructure is in place -- this phase fills the gaps.

**Primary recommendation:** Use Next.js file-based metadata conventions (`icon.svg`, `opengraph-image.tsx`) with `ImageResponse` from `next/og` (bundled in Next.js 16, no install needed). Build RSS as a static route handler at `app/feed.xml/route.ts`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Favicon uses Othala rune as symbol (already mapped to Home route)
- D-02: Favicon delivered as SVG + ICO + apple-touch-icon using Next.js Metadata API conventions
- D-03: Favicon color uses teal accent on dusty rose/transparent background with bold strokes
- D-04: Default OG image uses neobrutalist card -- dusty rose bg, bold black border, "keech.dev" in Norse font, description in Inter
- D-05: OG images via `opengraph-image.tsx` using ImageResponse -- zero external dependencies
- D-06: OG image dimensions: 1200x630
- D-07: Per-post OG uses same neobrutalist card with post title prominent, date, and "keech.dev" branding
- D-08: Tags on per-post OG at Claude's discretion
- D-09: Remove "Resume Coming Soon" placeholder entirely from about page

### Claude's Discretion
- Exact favicon glyph rendering/weight
- OG image internal layout (spacing, font sizes, decorative elements)
- Whether to include tags on per-post OG images
- RSS feed metadata details (author, categories)
- Sitemap date source strategy for static routes
- Project image `sizes` attribute values

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEO-01 | Favicon (.ico + .svg) and apple-touch-icon in browser tabs and mobile bookmarks | Next.js file-based icon convention: `icon.svg`, `icon.ico`, `apple-icon.png` in `src/app/` |
| SEO-02 | Default OG image renders branded card for site-level social shares | `src/app/opengraph-image.tsx` with `ImageResponse` from `next/og` (bundled in Next.js 16) |
| SEO-03 | Per-post OG images render blog post title with neobrutalist branding | `src/app/blog/[slug]/opengraph-image.tsx` receives slug via params, looks up post from Velite |
| SEO-04 | Sitemap uses actual content dates instead of `new Date()` | Replace `new Date()` with Velite collection dates; use most-recent-post date for `/blog` listing |
| SEO-05 | RSS feed at `/feed.xml` with all published blog posts | Route handler at `src/app/feed.xml/route.ts` returning `application/xml` with RSS 2.0 XML |
| SEO-06 | Project images include `sizes` attribute for optimal responsive loading | Add `sizes` prop to `<Image fill>` in project-card.tsx and projects/[slug]/page.tsx |
| CLN-02 | Resume placeholder button replaced or removed | Remove lines 53-65 in `src/app/about/page.tsx` (the disabled button and its wrapper div) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next/og | bundled (Next.js 16.1.6) | ImageResponse for OG image generation | Built into Next.js, zero dependencies, native Vercel support |
| Next.js Metadata API | bundled | File-based favicon/icon conventions | Framework convention, auto-generates meta tags |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | -- | RSS XML generation | Hand-write RSS 2.0 XML template -- too simple to need a library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written RSS XML | `feed` npm package | Overkill for a single-format feed with ~10 posts; adds a dependency for 30 lines of XML templating |
| Hand-written RSS XML | `rss` npm package | Same reasoning; the XML structure is straightforward |

**Installation:**
```bash
# No packages to install. next/og is bundled with Next.js 16.
# ImageResponse import: import { ImageResponse } from 'next/og'
```

## Architecture Patterns

### File Placement (Next.js Metadata Convention)
```
src/app/
  icon.svg              # SVG favicon (scalable, modern browsers)
  icon.ico              # ICO favicon (legacy browsers)  
  apple-icon.png        # Apple touch icon (iOS bookmarks)
  opengraph-image.tsx   # Site-level OG image generator (1200x630)
  feed.xml/
    route.ts            # RSS 2.0 feed as route handler
  blog/
    [slug]/
      opengraph-image.tsx  # Per-post OG image generator
  sitemap.ts            # (existing -- modify dates)
  about/
    page.tsx            # (existing -- remove resume placeholder)
```

### Pattern 1: Static Favicon Files
**What:** Place `icon.svg`, `icon.ico`, and `apple-icon.png` directly in `src/app/`. Next.js auto-detects them and generates the appropriate `<link>` tags.
**When to use:** When icons are static (not generated per-request).
**Key detail:** `favicon.ico` can ONLY be in the root `app/` directory. `icon.svg` and `apple-icon.png` can be in any route segment but root is standard.

### Pattern 2: Generated OG Images with ImageResponse
**What:** Export a default async function from `opengraph-image.tsx` that returns an `ImageResponse`. Next.js treats this as a special route handler.
**When to use:** Dynamic OG images (per-post titles, branding).
**Example:**
```typescript
// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const alt = 'keech.dev'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  // Load font as ArrayBuffer (TTF/OTF/WOFF only, NOT WOFF2)
  const interBold = await fetch(
    new URL('./path/to/Inter-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div style={{ /* JSX with inline styles */ }}>
        keech.dev
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: interBold, style: 'normal', weight: 700 },
      ],
    }
  )
}
```

### Pattern 3: Dynamic Route OG Images
**What:** `opengraph-image.tsx` in a `[slug]` directory receives params.
**Example:**
```typescript
// src/app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { posts } from '@/.velite'

export const alt = 'Blog post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)
  // ... return ImageResponse with post.title
}

// Required for static generation of all post OG images
export function generateStaticParams() {
  return posts.map(post => ({ slug: post.slug }))
}
```

### Pattern 4: RSS Feed as Route Handler
**What:** A route handler at `app/feed.xml/route.ts` that returns XML with `Content-Type: application/xml`.
**Example:**
```typescript
// src/app/feed.xml/route.ts
import { posts } from '@/.velite'

export function GET() {
  const publishedPosts = posts
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>keech.dev</title>
    <link>https://keech.dev</link>
    <description>Blog posts by Adam Keech</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(publishedPosts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="https://keech.dev/feed.xml" rel="self" type="application/rss+xml"/>
    ${publishedPosts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://keech.dev/blog/${post.slug}</link>
      <guid isPermaLink="true">https://keech.dev/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description || post.excerpt || ''}]]></description>
    </item>`).join('')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
```

### Pattern 5: RSS Feed Discovery via Layout Metadata
**What:** Add `alternates.types` to root layout metadata so browsers/readers auto-discover the feed.
**Example:**
```typescript
// In src/app/layout.tsx metadata
alternates: {
  types: {
    'application/rss+xml': 'https://keech.dev/feed.xml',
  },
},
```

### Anti-Patterns to Avoid
- **Using `@vercel/og` as separate package:** Next.js 16 bundles `next/og` already. Installing `@vercel/og` separately creates version conflicts.
- **Using WOFF2 fonts in ImageResponse:** Satori only supports TTF, OTF, and WOFF. WOFF2 will silently fail or throw.
- **Forgetting `generateStaticParams` in dynamic OG routes:** Without it, per-post OG images won't be statically generated at build time.
- **Using `new Date()` in sitemap:** Creates a new timestamp on every build, which tells search engines content changed when it didn't.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Favicon meta tags | Manual `<link>` tags in layout | Next.js file-based icon convention | Framework handles all variants, sizes, and format detection |
| OG image rendering | Canvas-based server-side rendering | `ImageResponse` from `next/og` | Satori handles CSS-to-image conversion with JSX syntax |
| OG meta tag injection | Manual `<meta>` tags | Next.js Metadata API (export metadata/generateMetadata) | Auto-generates og:image, og:title, twitter:image etc. |

**Key insight:** Next.js Metadata API handles the entire chain -- file detection, meta tag generation, and static optimization. Manual approaches miss edge cases (Twitter vs OG format differences, image size requirements, cache headers).

## Common Pitfalls

### Pitfall 1: Norse Font Not Available as TTF for Satori
**What goes wrong:** The Norse display font is only available as WOFF2 in `public/fonts/`. Satori (underlying `next/og`) cannot read WOFF2.
**Why it happens:** WOFF2 is optimal for web delivery but uses Brotli compression that Satori's font parser doesn't support.
**How to avoid:** Either: (a) source a Norse TTF file and place it alongside the WOFF2, or (b) use Inter Bold as the heading font in OG images with a larger size to maintain visual weight. Option (b) is pragmatic since OG images are 1200x630 thumbnails where exact font matching matters less than brand color/layout matching.
**Warning signs:** ImageResponse renders with fallback system font, text looks generic.

### Pitfall 2: ImageResponse JSX Limitations
**What goes wrong:** Satori supports a subset of CSS. Flexbox works, but Grid, `position: absolute` relative to non-positioned parents, `box-shadow` with offset, and many CSS features don't.
**Why it happens:** Satori converts JSX+CSS to SVG, not a browser render. It has its own layout engine.
**How to avoid:** Use only flexbox layout. For the neobrutalist border effect, use nested divs with background colors to simulate the shadow offset. Test locally with `npm run build` and check the generated image.
**Warning signs:** Elements overlap or don't render, shadows missing.

### Pitfall 3: Forgetting to Add Feed Discovery Link
**What goes wrong:** RSS readers can't auto-discover the feed from the homepage.
**Why it happens:** The route handler works at `/feed.xml` but browsers need a `<link rel="alternate">` tag to find it.
**How to avoid:** Add `alternates.types` to root layout metadata.
**Warning signs:** Feed works when directly accessed but not discoverable.

### Pitfall 4: Sitemap Static Route Dates
**What goes wrong:** Static routes (`/`, `/about`, `/blog`, `/projects`) still use `new Date()` after fixing blog post dates.
**Why it happens:** There's no obvious "last modified" date for listing pages.
**How to avoid:** For `/blog`, use the most recent post date. For `/projects`, use the most recent project date. For `/` and `/about`, use a meaningful hardcoded date or the most recent content date across all collections.
**Warning signs:** Search engines see the site as "changing daily" when nothing actually changed.

### Pitfall 5: SVG Favicon Rendering Across Browsers
**What goes wrong:** Complex SVG favicons with custom fonts may not render the Othala rune correctly in all browsers.
**Why it happens:** Browsers have limited SVG favicon support -- no external font loading, limited CSS.
**How to avoid:** Use the actual Unicode character for Othala (U+16DF) with a system font that supports runic, or convert the glyph to raw SVG paths. The path approach is most reliable.
**Warning signs:** Favicon shows a blank square or replacement character in some browsers.

## Code Examples

### Favicon SVG with Othala Rune (Path-Based)
```svg
<!-- src/app/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <!-- Dusty rose background -->
  <rect width="32" height="32" rx="4" fill="#E8B4B8"/>
  <!-- Othala rune glyph as path, teal stroke -->
  <!-- NOTE: Actual path data must be extracted from the Norse font's Othala glyph -->
  <text x="16" y="24" text-anchor="middle" font-size="24" font-weight="bold" fill="#2D8B8B" font-family="serif">&#5599;</text>
</svg>
```
**Note:** For maximum browser compatibility, the implementer should trace the Othala glyph to SVG `<path>` elements rather than relying on `<text>` with a Unicode character. The `<text>` approach works as a starting point but may render differently across systems.

### Neobrutalist OG Image Layout (Satori-Compatible)
```typescript
// Satori-compatible JSX for the OG card
<div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#E8B4B8',  // --color-background
  padding: '60px',
}}>
  {/* Simulated neobrutalist card with offset shadow */}
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5E6E8',  // --color-surface
    border: '4px solid #000000',
    padding: '48px',
    position: 'relative',
    // Offset shadow simulated via a background div or margin trick
  }}>
    <div style={{
      fontSize: 64,
      fontWeight: 700,
      fontFamily: 'Inter',  // Or Norse if TTF available
      color: '#000000',
    }}>
      keech.dev
    </div>
    <div style={{
      fontSize: 28,
      fontFamily: 'Inter',
      color: '#4A4A4A',  // --color-muted
      marginTop: 16,
    }}>
      Personal portfolio and blog of Adam Keech
    </div>
  </div>
</div>
```

### Sitemap Fix: Actual Content Dates
```typescript
// Key changes to src/app/sitemap.ts
const latestPostDate = posts
  .filter(p => !p.draft)
  .reduce((latest, p) => {
    const d = new Date(p.updated || p.date)
    return d > latest ? d : latest
  }, new Date(0))

const latestProjectDate = projects.reduce((latest, p) => {
  const d = new Date(p.updated || p.date)
  return d > latest ? d : latest
}, new Date(0))

// Static routes use derived dates
{ url: BASE_URL, lastModified: latestPostDate > latestProjectDate ? latestPostDate : latestProjectDate },
{ url: `${BASE_URL}/blog`, lastModified: latestPostDate },
{ url: `${BASE_URL}/projects`, lastModified: latestProjectDate },

// Project routes use their own dates
const projectRoutes = projects.map(project => ({
  url: `${BASE_URL}/projects/${project.slug}`,
  lastModified: new Date(project.updated || project.date),
}))
```

### Project Image Sizes Attribute
```typescript
// In project-card.tsx (card within grid layout)
<Image
  src={project.image.src}
  alt={`${project.title} screenshot`}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>

// In projects/[slug]/page.tsx (full-width detail image)
<Image
  src={project.image.src}
  alt={`${project.title} screenshot`}
  fill
  sizes="(max-width: 1200px) 100vw, 1200px"
  className="object-cover"
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@vercel/og` separate package | `next/og` bundled in Next.js | Next.js 14+ | No separate install needed |
| Manual `<meta>` OG tags | File-based `opengraph-image.tsx` | Next.js 13.3+ | Auto meta tag generation |
| `pages/api/og.ts` API route | `app/*/opengraph-image.tsx` co-located | Next.js 13+ | OG images co-located with routes |

**Deprecated/outdated:**
- `@vercel/og` as standalone: Still works but redundant with `next/og` in Next.js 14+.
- Manual `<Head>` OG tags: Replaced by Metadata API.

## Open Questions

1. **Norse Font TTF Availability**
   - What we know: Only WOFF2 exists in `public/fonts/`. Satori requires TTF/OTF/WOFF.
   - What's unclear: Whether a TTF version of the Norse font is available or easily obtainable.
   - Recommendation: The implementer should first check if a TTF version can be sourced (the original font download likely included TTF). If not, use Inter Bold at a larger weight for OG image headings -- the neobrutalist color scheme and layout carry the brand more than the exact font. If a TTF is found, place it at `src/assets/fonts/Norse-Bold.ttf` (outside public/, loaded via `fetch` + `import.meta.url`).

2. **Othala SVG Path Data**
   - What we know: The Othala rune (U+16DF) needs to be rendered as an SVG path for favicon reliability.
   - What's unclear: The exact path coordinates for the glyph.
   - Recommendation: The implementer can either (a) use a `<text>` element with a common serif font as a pragmatic start, or (b) extract the glyph outline from the Norse font file using a font tool. Option (a) is simpler; option (b) is pixel-perfect.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (per CLAUDE.md) |
| Config file | none -- see Wave 0 |
| Quick run command | `npm run build` (validates OG image generation, sitemap, RSS route) |
| Full suite command | `npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | Favicon files exist and are valid | manual-only | Check `src/app/icon.svg`, `icon.ico`, `apple-icon.png` exist | N/A |
| SEO-02 | Default OG image renders | smoke | `npm run build` (build fails if opengraph-image.tsx errors) | N/A Wave 0 |
| SEO-03 | Per-post OG images render with title | smoke | `npm run build` + visual check | N/A Wave 0 |
| SEO-04 | Sitemap has real dates | manual-only | `curl localhost:3000/sitemap.xml` after `npm run start` | N/A |
| SEO-05 | RSS feed valid XML with posts | smoke | `npm run build` + `curl localhost:3000/feed.xml` | N/A Wave 0 |
| SEO-06 | Project images have sizes attr | manual-only | `grep sizes src/components/projects/project-card.tsx` | N/A |
| CLN-02 | Resume placeholder removed | manual-only | `grep -c "Resume" src/app/about/page.tsx` returns 0 | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (catches OG/sitemap/RSS errors)
- **Per wave merge:** `npm run build && npm run start` (verify served output)
- **Phase gate:** Full build green + manual visual check of OG images via social media debuggers

### Wave 0 Gaps
- No test framework exists -- validation is via build success and manual verification
- This is acceptable for SEO assets (images, XML feeds) which are inherently visual/structural
- No test files needed -- `npm run build` is the primary automated gate

## Sources

### Primary (HIGH confidence)
- Next.js official docs - [opengraph-image and twitter-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- Next.js official docs - [favicon, icon, and apple-icon](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons)
- Next.js official docs - [ImageResponse function](https://nextjs.org/docs/app/api-reference/functions/image-response)
- Satori GitHub - [WOFF2 not supported](https://github.com/vercel/satori/discussions/157) - confirms TTF/OTF/WOFF only

### Secondary (MEDIUM confidence)
- [Next.js Metadata and OG images guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) - comprehensive patterns
- Multiple RSS feed tutorials cross-verified against Next.js route handler docs

### Tertiary (LOW confidence)
- None -- all findings verified against official sources

## Project Constraints (from CLAUDE.md)

- **No test framework configured** -- validation via `npm run build` and manual checks
- **No CI/CD** -- deployment is git-push to Vercel
- **Velite as prebuild step** -- content collections available at build time for sitemap/RSS/OG
- **Tailwind CSS v4 CSS-first config** -- design tokens in `globals.css` via `@theme`
- **Single theme only** -- no dark mode variants needed for OG images
- **Server components by default** -- all new files are server-side (route handlers, metadata files)
- **`cn()` utility** -- use for any Tailwind class composition
- **`metadataBase: new URL('https://keech.dev')`** -- already configured, relative OG URLs resolve correctly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js file conventions are well-documented and verified against official docs
- Architecture: HIGH - File placement follows Next.js convention exactly, patterns verified
- Pitfalls: HIGH - Font format limitation verified via Satori docs; ImageResponse CSS subset well-known
- OG image layout: MEDIUM - Satori CSS subset means some trial-and-error for exact neobrutalist shadow effect

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- Next.js metadata API is mature)
