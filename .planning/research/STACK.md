# Technology Stack

**Project:** keech.dev (Personal Blog + Portfolio)
**Researched:** 2026-01-31
**Overall Confidence:** HIGH

## Executive Summary

For a Next.js personal blog/portfolio with MDX content deploying to Vercel, the 2025/2026 standard stack is well-established: Next.js 15.x with App Router, Velite for content management, Tailwind CSS 4 for styling, and rehype-pretty-code for syntax highlighting. This stack provides excellent developer experience, type safety, and performance while remaining simple to maintain.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.5.x | React framework | Stable production version, excellent Vercel integration, App Router is mature. Version 16 is in canary - wait for stable. | HIGH |
| React | 19.x | UI library | Ships with Next.js 15, stable release | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for modern projects, excellent MDX type support | HIGH |

**Rationale:** Next.js 15.5.x is the current stable release (15.5.11 as of Jan 2026). Next.js 16 is in canary with interesting features (Cache Components, streaming improvements) but not production-ready. Stick with 15.5.x for stability. The App Router is now mature and the recommended approach.

**Sources:**
- [Next.js Releases](https://github.com/vercel/next.js/releases) - v15.5.11 is latest stable
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx)

---

### Content Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Velite | 0.3.x | MDX content processing | Type-safe content layer with Zod validation, excellent image/asset handling, actively maintained | HIGH |

**Why Velite over alternatives:**

| Option | Status | Why Not |
|--------|--------|---------|
| Contentlayer | Deprecated | Unmaintained since 2023, do not use |
| Content Collections | Active | Good option, but Velite has better asset co-location for blogs with images |
| @next/mdx only | Works | No frontmatter validation, no type generation - fine for simple sites but lacks DX |

**Velite advantages for keech.dev:**
- Zod schema validation for frontmatter (dates, tags, descriptions)
- Automatic TypeScript type generation
- Built-in image/asset co-location (images next to MDX files get processed)
- Generates type-safe data layer at build time
- Framework agnostic output (JSON + TypeScript types)

**Sources:**
- [Velite GitHub](https://github.com/zce/velite) - v0.3.1 (Dec 2025)
- [Contentlayer Alternatives](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives)

---

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility CSS | v4 simplifies config, CSS-first approach, no config file needed | HIGH |
| @tailwindcss/typography | latest | Prose styling | Essential for MDX content rendering | HIGH |
| @tailwindcss/postcss | latest | PostCSS integration | Required for Tailwind v4 with Next.js | HIGH |

**Tailwind v4 Key Changes:**
- No `tailwind.config.js` needed for basic setup
- Configuration via CSS with `@theme` blocks
- New `@plugin` syntax for loading plugins
- `@import "tailwindcss"` instead of directives

**Configuration approach for neobrutalist design:**

```css
/* globals.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* Cosmic psychedelic palette */
  --color-cosmic-purple: #6B21A8;
  --color-cosmic-pink: #DB2777;
  --color-cosmic-blue: #0891B2;
  --color-cosmic-gold: #D97706;

  /* Neobrutalist shadows */
  --shadow-brutal: 4px 4px 0 0 black;
  --shadow-brutal-lg: 6px 6px 0 0 black;
}
```

**Typography for MDX:**

```css
@plugin "@tailwindcss/typography";

/* In your CSS */
.prose {
  /* Customize prose for neobrutalist feel */
}
```

**Sources:**
- [Tailwind CSS Next.js Guide](https://tailwindcss.com/docs/guides/nextjs)
- [Neobrutalism Components](https://www.neobrutalism.dev/)

---

### Syntax Highlighting

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| rehype-pretty-code | latest | Code block styling | Shiki-powered, VS Code themes, build-time highlighting | HIGH |
| shiki | 1.x | Syntax engine | Powers rehype-pretty-code, accurate highlighting | HIGH |

**Configuration:**

```javascript
// next.config.mjs
import createMDX from '@next/mdx'
import rehypePrettyCode from 'rehype-pretty-code'

const options = {
  theme: {
    dark: 'github-dark',
    light: 'github-light',
  },
  keepBackground: false, // Control background via CSS
}

const withMDX = createMDX({
  options: {
    rehypePlugins: [[rehypePrettyCode, options]],
  },
})
```

**Why not alternatives:**

| Option | Why Not |
|--------|---------|
| Prism.js | Client-side, flash of unstyled content |
| highlight.js | Less accurate than Shiki |
| @shikijs/rehype | Works, but rehype-pretty-code adds nicer features (line highlighting, etc) |

**Sources:**
- [Rehype Pretty Code](https://rehype-pretty.pages.dev/)
- [Shiki Syntax Highlighting](https://fiachracurran.com/blog/2025-10-22-shiki-syntax-highlighting)

---

### Dark Mode

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-themes | latest | Theme switching | Proven, no flash, system preference support | HIGH |

**Configuration for Tailwind v4:**

```tsx
// providers.tsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

```css
/* globals.css - Tailwind v4 dark mode variant */
@custom-variant dark (&:where(.dark, .dark *));
```

**Sources:**
- [next-themes GitHub](https://github.com/pacocoursey/next-themes)
- [Next.js 15 Dark Mode Setup](https://dev.to/darshan_bajgain/setting-up-2025-nextjs-15-with-shadcn-tailwind-css-v4-no-config-needed-dark-mode-5kl)

---

### Animation (Optional)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Framer Motion | 11.x | React animations | Feature-rich, excellent for layout animations and gestures | MEDIUM |

**When to use:**
- Page transitions
- Micro-interactions
- Scroll-triggered animations
- Layout animations (AnimatePresence)

**Alternative consideration:**
- Motion One (3.8kb vs 32kb) if bundle size is critical
- CSS animations for simple hover effects (prefer this for neobrutalist "snappy" feel)

**Recommendation for keech.dev:** Start with CSS animations/transitions for the neobrutalist aesthetic (hard, snappy movements). Add Framer Motion only if you need complex orchestration or layout animations.

**Sources:**
- [Motion Dev](https://motion.dev/)
- [Framer Motion vs Motion One](https://motion.dev/blog/should-i-use-framer-motion-or-motion-one)

---

### SEO & Metadata

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js Metadata API | built-in | SEO | generateMetadata, static metadata exports | HIGH |
| next-sitemap | latest | Sitemap generation | Generates sitemap.xml and robots.txt at build | MEDIUM |
| rss | latest | RSS feed | Simple RSS XML generation | HIGH |

**Built-in approach (recommended):**

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}
```

**RSS Feed:** Create `app/feed.xml/route.ts` using the `rss` package.

**Sources:**
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [RSS Feed in Next.js](https://spacejelly.dev/posts/how-to-add-a-sitemap-rss-feed-in-next-js-app-router)

---

### Image Optimization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next/image | built-in | Image optimization | Automatic optimization, lazy loading, blur placeholders | HIGH |
| sharp | latest | Image processing | Required for blur placeholders, Vercel includes by default | HIGH |

**For blur placeholders with external/dynamic images:**
Use sharp directly rather than plaiceholder (unmaintained).

```typescript
import sharp from 'sharp'

async function getBlurDataURL(imagePath: string): Promise<string> {
  const buffer = await sharp(imagePath)
    .resize(10, 10)
    .toBuffer()
  return `data:image/png;base64,${buffer.toString('base64')}`
}
```

**Sources:**
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Blur Placeholder Guide](https://blog.olivierlarose.com/articles/placeholder-guide-using-next-image)

---

## Complete Package List

### Production Dependencies

```bash
npm install next@15.5 react@19 react-dom@19 velite next-themes
```

### Dev Dependencies

```bash
npm install -D typescript @types/react @types/node \
  tailwindcss@4 @tailwindcss/postcss @tailwindcss/typography postcss \
  @next/mdx @mdx-js/loader @mdx-js/react @types/mdx \
  rehype-pretty-code shiki \
  rss @types/rss \
  sharp
```

### Optional (add as needed)

```bash
# Animation (if needed)
npm install framer-motion

# Sitemap generation
npm install next-sitemap
```

---

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Contentlayer | Deprecated, unmaintained since 2023 |
| next-mdx-remote | Overkill for local files, @next/mdx is simpler |
| Prism.js | Client-side highlighting causes flash |
| plaiceholder | Unmaintained, causes Vercel build issues |
| styled-components | Unnecessary with Tailwind, adds complexity |
| CSS Modules | Unnecessary with Tailwind for this project |
| Pages Router | App Router is the standard, use it |

---

## Project Structure Recommendation

```
keech-dev/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   ├── blog/
│   │   ├── page.tsx         # Blog index
│   │   └── [slug]/
│   │       └── page.tsx     # Blog post page
│   ├── projects/
│   │   ├── page.tsx         # Projects index
│   │   └── [slug]/
│   │       └── page.tsx     # Project detail
│   └── feed.xml/
│       └── route.ts         # RSS feed
├── content/
│   ├── blog/                # MDX blog posts
│   │   └── *.mdx
│   └── projects/            # MDX project writeups
│       └── *.mdx
├── components/
│   ├── ui/                  # Neobrutalist UI components
│   └── mdx/                 # MDX component overrides
├── lib/
│   └── velite.ts            # Velite helpers
├── velite.config.ts         # Content schema
├── next.config.mjs          # Next.js + MDX config
├── postcss.config.mjs       # PostCSS + Tailwind
└── globals.css              # Tailwind + theme
```

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Core Framework (Next.js 15.5) | HIGH | Verified via GitHub releases, official docs |
| Content Layer (Velite) | HIGH | Active development, verified via GitHub |
| Styling (Tailwind v4) | HIGH | Official docs, v4 is stable |
| Syntax Highlighting | HIGH | rehype-pretty-code is standard approach |
| Dark Mode (next-themes) | HIGH | Industry standard, widely used |
| Animation | MEDIUM | Framer Motion is standard but optional |
| SEO | HIGH | Built-in Next.js APIs, well documented |

---

## Sources

**Official Documentation:**
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx)
- [Tailwind CSS Next.js Installation](https://tailwindcss.com/docs/guides/nextjs)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

**GitHub Repositories:**
- [Next.js Releases](https://github.com/vercel/next.js/releases) - v15.5.11 latest stable
- [Velite](https://github.com/zce/velite) - v0.3.1
- [next-themes](https://github.com/pacocoursey/next-themes)
- [rehype-pretty-code](https://rehype-pretty.pages.dev/)

**Community Resources:**
- [Contentlayer Alternatives](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives)
- [Neobrutalism Components](https://www.neobrutalism.dev/)
- [Josh Comeau's Blog Build](https://www.joshwcomeau.com/blog/how-i-built-my-blog/)

---

## Roadmap Implications

1. **Phase 1: Foundation** - Next.js 15.5 + Tailwind v4 + basic layout
2. **Phase 2: Content System** - Velite setup, MDX configuration, blog structure
3. **Phase 3: Design System** - Neobrutalist components, color palette, typography
4. **Phase 4: Blog Features** - Syntax highlighting, dark mode, responsive
5. **Phase 5: Portfolio** - Project pages, hardware/software showcase
6. **Phase 6: Polish** - SEO, RSS, sitemap, performance optimization
