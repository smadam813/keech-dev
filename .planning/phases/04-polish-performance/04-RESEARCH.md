# Phase 4: Polish & Performance - Research

**Researched:** 2026-02-01
**Domain:** CSS animations, Next.js SEO, Core Web Vitals optimization
**Confidence:** HIGH

## Summary

Phase 4 adds animations, interactions, and SEO optimization to make the site feel alive while maintaining excellent performance. The research covers four key areas: (1) hover effects using CSS-only transitions that match the existing neobrutalist shadow-shift pattern, (2) page transitions using the experimental View Transitions API in Next.js 16, (3) scroll-triggered animations using CSS scroll-driven animations with Intersection Observer fallback, and (4) SEO optimization using Next.js metadata API, sitemap.ts, robots.ts, and JSON-LD structured data.

The site already has a solid foundation with Tailwind CSS v4, next/font with display:swap configured, and neobrutalist design tokens defined in globals.css. The existing hover patterns (shadow-brutal to shadow-brutal-hover with translate) provide the template for expanding effects across all interactive elements.

**Primary recommendation:** Use CSS-only animations with Tailwind's motion-safe/motion-reduce variants for accessibility. Avoid adding Framer Motion since the required animations are achievable with pure CSS and the existing patterns already demonstrate this approach.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Place)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4.1.18 | Animations via @theme | CSS-first, motion-safe variants built-in |
| next/font | built-in | Font optimization | Automatic CLS prevention, display:swap configured |
| next/image | built-in | Image optimization | Automatic lazy loading, LCP priority support |
| Next.js Metadata API | built-in | SEO meta tags | Server-side, type-safe, OG image generation |

### New Additions (No External Dependencies)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sitemap.ts | Next.js convention | Auto-generate sitemap.xml | Required for SEO |
| robots.ts | Next.js convention | Auto-generate robots.txt | Required for SEO |
| schema-dts | ^1.1.5 | TypeScript types for JSON-LD | Type safety for structured data |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS animations | Framer Motion | +17kb bundle, overkill for shadow/translate effects |
| CSS scroll-driven | Intersection Observer only | Better browser support but less smooth |
| View Transitions API | next-transition-router | Extra dependency, experimental anyway |

**Installation:**
```bash
npm install schema-dts
```

## Architecture Patterns

### Recommended File Structure
```
src/
├── app/
│   ├── sitemap.ts           # Dynamic sitemap generation
│   ├── robots.ts            # Robots.txt generation
│   ├── opengraph-image.tsx  # Default OG image (optional)
│   └── [route]/
│       └── opengraph-image.tsx  # Route-specific OG images (optional)
├── components/
│   └── json-ld.tsx          # Reusable JSON-LD component
└── lib/
    └── structured-data.ts   # JSON-LD schema helpers
```

### Pattern 1: Neobrutalist Hover Effects (CSS-only)

**What:** Shadow shift + translate creating "pressed" effect
**When to use:** All interactive elements (cards, buttons, links with boxes)
**Example:**
```css
/* Source: Already in globals.css @theme block */
@theme {
  --shadow-brutal: 4px 4px 0 0 #000000;
  --shadow-brutal-hover: 2px 2px 0 0 #000000;
}

/* Pattern in use - from existing PostCard/ProjectCard */
.interactive-element {
  @apply shadow-brutal
         hover:shadow-brutal-hover
         hover:translate-x-[2px]
         hover:translate-y-[2px]
         transition-all duration-150;
}
```

### Pattern 2: Motion-Safe Animations

**What:** Respecting prefers-reduced-motion user preference
**When to use:** ALL animations
**Example:**
```html
<!-- Source: Tailwind CSS v4 docs -->
<!-- Only animate when user allows motion -->
<div class="motion-safe:animate-fadeIn motion-reduce:opacity-100">
  Content
</div>

<!-- Disable transitions for reduced-motion users -->
<button class="transition-all motion-reduce:transition-none">
  Click me
</button>
```

### Pattern 3: CSS Scroll-Triggered Animations with Fallback

**What:** Elements animate when entering viewport
**When to use:** Page sections, cards, content blocks
**Example:**
```css
/* Source: MDN CSS scroll-driven animations */
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Progressive enhancement with @supports */
@supports (animation-timeline: view()) {
  .scroll-animate {
    animation: fadeSlideIn linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }
}

/* Reduced motion: show immediately */
@media (prefers-reduced-motion: reduce) {
  .scroll-animate {
    animation: none;
    opacity: 1;
  }
}
```

### Pattern 4: Next.js Metadata with Template

**What:** Consistent SEO across pages with per-page customization
**When to use:** Root layout and all pages
**Example:**
```typescript
// Source: Next.js metadata docs
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://keech.dev'),
  title: {
    default: 'keech.dev',
    template: '%s | keech.dev',
  },
  description: 'Personal portfolio and blog of Adam Keech',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'keech.dev',
  },
}

// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  return {
    title: post.title,  // Becomes "Post Title | keech.dev"
    description: post.description,
    openGraph: {
      type: 'article',
      publishedTime: post.date,
    },
  }
}
```

### Anti-Patterns to Avoid
- **Animating layout properties:** Never animate width, height, margin, padding - use transform only
- **Missing motion-reduce:** Every animation MUST have a reduced-motion alternative
- **Blocking LCP images:** Hero/above-fold images need priority={true}
- **JSON.stringify without sanitization:** XSS vulnerability - always use .replace(/</g, '\\u003c')

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap generation | Manual XML file | sitemap.ts convention | Auto-includes dynamic routes |
| Robots.txt | Static file | robots.ts convention | Type-safe, can reference sitemap |
| OG images | External image files | ImageResponse API | Dynamic, type-safe, no asset management |
| Font loading CLS | Manual @font-face | next/font | Automatic fallback metrics |
| Image lazy loading | Intersection Observer | next/image | Native, LCP-aware |
| Reduced motion detection | matchMedia polling | Tailwind motion-safe/reduce | Built-in, SSR-safe |

**Key insight:** Next.js provides built-in file conventions (sitemap.ts, robots.ts, opengraph-image.tsx) that are cached, type-safe, and auto-route. Using these conventions eliminates configuration and ensures proper integration with the build system.

## Common Pitfalls

### Pitfall 1: View Transitions API is Experimental
**What goes wrong:** Production breakage when API changes
**Why it happens:** Next.js viewTransition flag is experimental, not recommended for production
**How to avoid:** Use CSS transitions for hover/focus states, reserve View Transitions for enhancement only
**Warning signs:** Console warnings about experimental features

### Pitfall 2: CLS from Scroll Animations
**What goes wrong:** Elements shifting layout as they animate in
**Why it happens:** Animating from display:none or changing dimensions
**How to avoid:** Only animate transform and opacity; use visibility for show/hide
**Warning signs:** CLS > 0.1 in Lighthouse

### Pitfall 3: Scroll-Driven Animations Browser Support
**What goes wrong:** Animations don't work in Firefox/older Safari
**Why it happens:** CSS scroll-driven animations require Safari 26+, Firefox needs flag
**How to avoid:** Use @supports feature detection, provide static fallback
**Warning signs:** Animation works in Chrome but not Safari

### Pitfall 4: Missing metadataBase
**What goes wrong:** OG images have relative URLs that social platforms can't fetch
**Why it happens:** metadataBase not set in root layout
**How to avoid:** Always set metadataBase in root layout.tsx
**Warning signs:** OG images don't show in social previews

### Pitfall 5: Duplicate JSON-LD Tags
**What goes wrong:** Structured data appears twice
**Why it happens:** React hydration re-renders the script tag
**How to avoid:** Render JSON-LD only in Server Components, never in Client Components
**Warning signs:** Google's Rich Results Test shows duplicate entries

### Pitfall 6: LCP Images Without Priority
**What goes wrong:** LCP > 2.5s even with optimized images
**Why it happens:** next/image defaults to lazy loading
**How to avoid:** Add priority={true} to above-fold images (hero, headshot)
**Warning signs:** Console warning in dev mode, poor LCP scores

## Code Examples

Verified patterns from official sources:

### Dynamic Sitemap (sitemap.ts)
```typescript
// Source: Next.js docs - app/sitemap.ts
import type { MetadataRoute } from 'next'
import { posts } from '@/.velite'
import { projects } from '@/.velite'

const BASE_URL = 'https://keech.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]

  const blogRoutes = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  const projectRoutes = projects.map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes, ...projectRoutes]
}
```

### Robots.txt (robots.ts)
```typescript
// Source: Next.js docs - app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://keech.dev/sitemap.xml',
  }
}
```

### JSON-LD for Blog Post
```typescript
// Source: Next.js JSON-LD guide - components/json-ld.tsx
import { Article, Person, WithContext } from 'schema-dts'

interface ArticleJsonLdProps {
  title: string
  description: string
  datePublished: string
  authorName: string
  url: string
}

export function ArticleJsonLd({ title, description, datePublished, authorName, url }: ArticleJsonLdProps) {
  const jsonLd: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    datePublished: datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
      url: 'https://keech.dev/about',
    },
    publisher: {
      '@type': 'Person',
      name: authorName,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  )
}
```

### Custom Animation in Tailwind v4 @theme
```css
/* Source: Tailwind CSS v4 animation docs - add to globals.css @theme block */
@theme {
  /* Fade in from below */
  --animate-fade-in-up: fadeInUp 0.5s ease-out forwards;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

### Scroll Animation with @supports Fallback
```css
/* Source: MDN scroll-driven animations - add to globals.css */
@layer components {
  .scroll-reveal {
    /* Default: visible (for browsers without support) */
    opacity: 1;
  }

  @supports (animation-timeline: view()) {
    .scroll-reveal {
      animation: fadeInUp linear both;
      animation-timeline: view();
      animation-range: entry 10% entry 90%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-reveal {
      animation: none !important;
      opacity: 1;
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion for all animations | CSS-only with motion-safe | 2024-2025 | Smaller bundles, better performance |
| Intersection Observer for scroll | CSS scroll-driven animations | 2025-2026 | Safari 26 support, smoother animations |
| next-seo package | Built-in Metadata API | Next.js 13+ | No extra dependency |
| Manual OG images | ImageResponse dynamic generation | Next.js 13+ | Type-safe, automatic |
| font-display in CSS | next/font with fallback metrics | Next.js 13+ | Zero CLS from fonts |
| priority prop on Image | fetchPriority="high" / priority | Next.js 16 | Clearer intent |

**Deprecated/outdated:**
- `next-seo` package: Replaced by built-in Metadata API
- Manual `@font-face` rules: Use next/font for automatic optimization
- `getStaticProps` for metadata: Use generateMetadata in App Router
- View Transitions in production: Still experimental in Next.js 16

## Open Questions

Things that couldn't be fully resolved:

1. **OG Image Strategy**
   - What we know: ImageResponse can generate dynamic OG images from JSX
   - What's unclear: Whether static image is sufficient or per-page dynamic images needed
   - Recommendation: Start with single branded static OG image, add dynamic for blog posts if time permits

2. **View Transitions Production Readiness**
   - What we know: Next.js 16 has experimental.viewTransition flag
   - What's unclear: Stability timeline, browser support matrix
   - Recommendation: Implement CSS transitions only, skip View Transitions for now

3. **INP (Interaction to Next Paint) Impact**
   - What we know: INP replaced FID in March 2024, measures interaction responsiveness
   - What's unclear: Whether current patterns risk poor INP scores
   - Recommendation: Test with Lighthouse after implementation, optimize if needed

## Sources

### Primary (HIGH confidence)
- [Next.js Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) - metadata API, generateMetadata, ImageResponse
- [Next.js sitemap.xml convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) - sitemap.ts patterns
- [Next.js robots.txt convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) - robots.ts patterns
- [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld) - structured data implementation
- [Next.js viewTransition config](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition) - experimental status
- [Tailwind CSS animation docs](https://tailwindcss.com/docs/animation) - motion-safe, custom keyframes
- [MDN CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) - browser support, syntax

### Secondary (MEDIUM confidence)
- [WebKit scroll-driven animations guide](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/) - Safari 26 support
- [web.dev prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) - accessibility patterns
- [Vercel Core Web Vitals guide](https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024) - LCP/CLS optimization

### Tertiary (LOW confidence)
- Community patterns for neobrutalist hover effects (general CSS hover effect articles)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all built-in Next.js features, well-documented
- Architecture: HIGH - patterns from official docs, already partially implemented
- Pitfalls: HIGH - verified from multiple sources, some from direct experience
- Scroll animations: MEDIUM - Safari 26 support recently added, Firefox still flagged
- View Transitions: LOW - explicitly experimental in Next.js docs

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain, except View Transitions which may evolve)
