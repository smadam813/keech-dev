# Phase 2: Content & Blog - Research

**Researched:** 2026-01-31
**Domain:** MDX content system with Velite, syntax highlighting, blog typography
**Confidence:** HIGH

## Summary

This phase implements a complete MDX-powered blog system using Velite as the content engine and rehype-pretty-code for syntax highlighting. The stack is well-established and documented, with clear patterns for Next.js App Router integration.

The research confirms that Velite v0.3.1 provides built-in support for all required features: `s.toc()` for table of contents extraction, `s.metadata()` for reading time/word count, and `s.excerpt()` for post previews. The rehype-pretty-code v0.14.1 library handles syntax highlighting with Shiki, supporting line numbers, language badges, and copy buttons via the `@rehype-pretty/transformers` package.

Key constraint discovered: Velite's VeliteWebpackPlugin does not work with Turbopack. Since the project uses `npm run dev --turbopack` (Turbopack), the recommended workaround is using the Next.js config-based Velite initialization with top-level await, or running Velite separately.

**Primary recommendation:** Use Velite with Next.js config initialization (not webpack plugin) to maintain Turbopack compatibility, configure rehype-pretty-code with line numbers and copy button transformers, and implement a sticky table of contents using Velite's built-in `s.toc()` schema.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| velite | 0.3.1 | MDX content to type-safe data layer | Contentlayer successor, Zod schemas, maintained |
| rehype-pretty-code | 0.14.1 | Syntax highlighting | Shiki-powered, VS Code themes, build-time |
| shiki | latest | Syntax highlighting engine | VS Code's tokenizer, accurate highlighting |
| @rehype-pretty/transformers | latest | Copy button, transformers | Official extension for rehype-pretty-code |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rehype-slug | 6.x | Add IDs to headings | Required for TOC anchor links |
| rehype-autolink-headings | 7.x | Link headings to themselves | Optional, improves UX for sharing sections |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Velite | Contentlayer | Contentlayer is unmaintained, Velite is active |
| rehype-pretty-code | @shikijs/rehype | Nearly identical, rehype-pretty-code has more features |
| Shiki themes | Prism.js | Prism is lighter but less accurate, no VS Code themes |

**Installation:**
```bash
npm install velite rehype-pretty-code shiki @rehype-pretty/transformers rehype-slug
```

## Architecture Patterns

### Recommended Project Structure
```
content/
└── posts/                # Blog post MDX files
    ├── first-post.mdx
    └── second-post.mdx

src/
├── app/
│   └── blog/
│       ├── page.tsx          # Blog listing page
│       └── [slug]/
│           └── page.tsx      # Individual post page
├── components/
│   ├── blog/
│   │   ├── post-card.tsx     # Listing card component
│   │   ├── mdx-content.tsx   # MDX renderer wrapper
│   │   ├── toc.tsx           # Table of contents sidebar
│   │   └── tag-chip.tsx      # Neobrutalist tag component
│   └── mdx/                  # Custom MDX components
│       ├── code-block.tsx    # Enhanced code block
│       └── index.tsx         # MDX component exports
└── lib/
    └── posts.ts              # Post data access helpers

.velite/                      # Generated type-safe data (gitignored)
velite.config.ts              # Velite configuration
```

### Pattern 1: Velite Next.js Config Integration (Turbopack-compatible)
**What:** Initialize Velite in next.config.ts using top-level await instead of webpack plugin
**When to use:** When using Turbopack (default in Next.js 16+)
**Example:**
```typescript
// next.config.ts
// Source: https://velite.js.org/guide/with-nextjs

import type { NextConfig } from 'next'

// Run Velite before Next.js starts
if (process.env.NODE_ENV === 'development') {
  const { build } = await import('velite')
  await build({ watch: true, clean: false })
} else {
  const { build } = await import('velite')
  await build({ watch: false, clean: true })
}

const nextConfig: NextConfig = {
  // ... existing config
}

export default nextConfig
```

### Pattern 2: Blog Post Schema with All Required Fields
**What:** Complete Velite schema for blog posts with TOC, metadata, excerpt, tags
**When to use:** Defining the posts collection
**Example:**
```typescript
// velite.config.ts
// Source: https://velite.js.org/guide/velite-schemas

import { defineCollection, defineConfig, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { transformerCopyButton } from '@rehype-pretty/transformers'

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(99),
      slug: s.slug('posts'),
      date: s.isodate(),
      updated: s.isodate().optional(),
      description: s.string().max(300).optional(),
      tags: s.array(s.string()).default([]),
      draft: s.boolean().default(false),
      toc: s.toc(),
      metadata: s.metadata(),
      excerpt: s.excerpt({ length: 150 }),
      body: s.mdx()
    })
    .transform(data => ({
      ...data,
      permalink: `/blog/${data.slug}`,
      readingTime: data.metadata.readingTime
    }))
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true
  },
  collections: { posts },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: 'github-dark-dimmed',
          keepBackground: true,
          transformers: [
            transformerCopyButton({
              visibility: 'hover',
              feedbackDuration: 2500
            })
          ]
        }
      ]
    ]
  }
})
```

### Pattern 3: MDX Content Renderer
**What:** Client component to render Velite-compiled MDX
**When to use:** Displaying blog post content
**Example:**
```tsx
// src/components/blog/mdx-content.tsx
// Source: https://velite.js.org/guide/using-mdx
'use client'

import * as runtime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'

interface MDXContentProps {
  code: string
  components?: MDXComponents
}

const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

export function MDXContent({ code, components = {} }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={components} />
}
```

### Pattern 4: Sticky Table of Contents
**What:** Sidebar TOC that remains visible while scrolling
**When to use:** Blog post pages with headings
**Example:**
```tsx
// src/components/blog/toc.tsx
// Source: Community pattern for sticky sidebar TOC

interface TocEntry {
  title: string
  url: string
  items: TocEntry[]
}

interface TocProps {
  entries: TocEntry[]
}

export function TableOfContents({ entries }: TocProps) {
  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto">
      <h2 className="font-display text-lg font-bold mb-4">Contents</h2>
      <TocList entries={entries} />
    </nav>
  )
}

function TocList({ entries, depth = 0 }: { entries: TocEntry[]; depth?: number }) {
  return (
    <ul className={depth > 0 ? 'ml-4' : ''}>
      {entries.map((entry) => (
        <li key={entry.url} className="my-2">
          <a
            href={entry.url}
            className="text-muted hover:text-foreground transition-colors"
          >
            {entry.title}
          </a>
          {entry.items.length > 0 && (
            <TocList entries={entry.items} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  )
}
```

### Anti-Patterns to Avoid
- **Building custom syntax highlighting:** Use rehype-pretty-code with Shiki, don't roll your own tokenizer
- **Client-side MDX compilation:** Velite compiles at build time; never compile MDX in the browser
- **Manual reading time calculation:** Use `s.metadata()` which provides readingTime automatically
- **Hardcoded TOC:** Use `s.toc()` schema helper which extracts headings automatically
- **Inline styles for code blocks:** Use data attributes from rehype-pretty-code for CSS styling

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reading time calculation | Word count / 200 wpm formula | `s.metadata()` | Handles edge cases, markdown-aware |
| Table of contents extraction | Regex on markdown headings | `s.toc()` | Proper AST parsing, nested structure |
| Excerpt generation | String slice on content | `s.excerpt({ length: 150 })` | Respects word boundaries, strips markdown |
| Syntax highlighting | Custom tokenizer | rehype-pretty-code + Shiki | VS Code accuracy, 100+ themes |
| Heading anchor links | Manual ID assignment | rehype-slug | Consistent slug generation, collision handling |
| Copy button for code | Custom clipboard API wrapper | transformerCopyButton | Handles feedback state, accessibility |
| Date formatting | Inline Date methods | Intl.DateTimeFormat or date-fns | Locale-aware, consistent |

**Key insight:** Content processing has many edge cases (frontmatter, nested lists, code blocks in lists). Velite's schema helpers handle these; custom solutions will miss edge cases.

## Common Pitfalls

### Pitfall 1: Turbopack + VeliteWebpackPlugin Incompatibility
**What goes wrong:** Velite's VeliteWebpackPlugin doesn't work with Turbopack, causing content to not load in dev
**Why it happens:** Turbopack is not webpack-compatible; webpack plugins don't execute
**How to avoid:** Use the Next.js config initialization pattern (top-level await) instead of webpack plugin
**Warning signs:** Content not loading, "Cannot find module '.velite'" errors, empty blog listings

### Pitfall 2: Missing .velite from .gitignore
**What goes wrong:** Generated files committed to git, causing merge conflicts
**Why it happens:** Velite outputs to `.velite/` which looks like a source directory
**How to avoid:** Add `.velite` to `.gitignore` immediately after setup
**Warning signs:** Large diffs with generated code, TypeScript files in `.velite/`

### Pitfall 3: Code Block Styling Without Data Attributes
**What goes wrong:** CSS classes don't match rehype-pretty-code output
**Why it happens:** rehype-pretty-code uses data attributes, not classes
**How to avoid:** Style using `[data-rehype-pretty-code-figure]`, `[data-line]`, etc.
**Warning signs:** Code blocks unstyled, line numbers not appearing despite config

### Pitfall 4: Vercel Deployment Failure with Sharp
**What goes wrong:** Build fails with "free(): invalid size" or memory errors
**Why it happens:** Sharp (image processing) has deployment-specific issues
**How to avoid:** If using `s.image()`, ensure sharp is properly configured for Vercel
**Warning signs:** Local builds pass, Vercel builds fail with cryptic errors

### Pitfall 5: ESM Import Warnings
**What goes wrong:** Webpack cache warnings during build
**Why it happens:** Dynamic `import('velite')` in config triggers cache invalidation
**How to avoid:** Warnings are benign; can be suppressed but not harmful
**Warning signs:** `[webpack.cache.PackFileCacheStrategy]` warnings in console

### Pitfall 6: Line Numbers Not Showing
**What goes wrong:** `showLineNumbers` in markdown but numbers don't appear
**Why it happens:** CSS for line numbers counter not added to styles
**How to avoid:** Add CSS for `code[data-line-numbers] > [data-line]::before` counter
**Warning signs:** `data-line-numbers` attribute present but no visual numbers

## Code Examples

Verified patterns from official sources:

### Blog Listing Page
```tsx
// src/app/blog/page.tsx
// Source: Velite Next.js example pattern

import { posts } from '@/.velite'
import { PostCard } from '@/components/blog/post-card'

export default function BlogPage() {
  // Filter out drafts in production
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-8">Blog</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {publishedPosts.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </main>
  )
}
```

### Individual Blog Post Page
```tsx
// src/app/blog/[slug]/page.tsx
// Source: Velite Next.js example pattern

import { posts } from '@/.velite'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { TableOfContents } from '@/components/blog/toc'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return posts.map(post => ({ slug: post.slug }))
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)

  if (!post) notFound()

  return (
    <article className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
        <div className="prose prose-lg max-w-none">
          <header className="mb-8 not-prose">
            <h1 className="font-display text-4xl font-bold">{post.title}</h1>
            <div className="text-muted mt-2">
              <time>{new Date(post.date).toLocaleDateString()}</time>
              <span className="mx-2">-</span>
              <span>{post.readingTime} min read</span>
            </div>
          </header>
          <MDXContent code={post.body} />
        </div>
        <aside className="hidden lg:block">
          <TableOfContents entries={post.toc} />
        </aside>
      </div>
    </article>
  )
}
```

### CSS for Code Blocks with Line Numbers
```css
/* src/app/globals.css - Add to existing file */
/* Source: https://rehype-pretty.pages.dev/ */

/* Code block container */
[data-rehype-pretty-code-figure] {
  @apply my-6 overflow-hidden rounded-lg border-[3px] border-black shadow-brutal;
}

/* Language badge / title */
[data-rehype-pretty-code-title] {
  @apply bg-foreground text-background px-4 py-2 font-mono text-sm font-bold;
}

/* Code content */
[data-rehype-pretty-code-figure] pre {
  @apply overflow-x-auto py-4;
}

[data-rehype-pretty-code-figure] code {
  @apply grid;
}

/* Line numbers */
code[data-line-numbers] {
  counter-reset: line;
}

code[data-line-numbers] > [data-line]::before {
  counter-increment: line;
  content: counter(line);
  @apply inline-block w-8 mr-4 text-right text-muted/50;
}

/* Individual lines */
[data-line] {
  @apply px-4 border-l-2 border-transparent;
}

/* Highlighted lines */
[data-highlighted-line] {
  @apply bg-accent/10 border-l-accent;
}

/* Copy button (from transformers) */
[data-rehype-pretty-code-figure] button[data-copy] {
  @apply absolute top-2 right-2 p-2 opacity-0 transition-opacity;
}

[data-rehype-pretty-code-figure]:hover button[data-copy] {
  @apply opacity-100;
}
```

### Neobrutalist Tag Chip
```tsx
// src/components/blog/tag-chip.tsx
// Source: Project design system (neobrutalist pattern)

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagChipProps {
  tag: string
  href?: string
  className?: string
}

export function TagChip({ tag, href, className }: TagChipProps) {
  const chipClasses = cn(
    'inline-block px-3 py-1 text-sm font-bold',
    'border-[3px] border-black bg-surface',
    'shadow-brutal-hover hover:shadow-none',
    'transition-shadow',
    className
  )

  if (href) {
    return (
      <Link href={href} className={chipClasses}>
        {tag}
      </Link>
    )
  }

  return <span className={chipClasses}>{tag}</span>
}
```

### Reading-Optimized Typography
```css
/* src/app/globals.css - Prose styles */
/* Source: Typography best practices research */

/* Blog post prose container */
.prose {
  /* Optimal reading width: 50-75 characters */
  max-width: 65ch;

  /* Body text sizing */
  font-size: 1.125rem; /* 18px */
  line-height: 1.7;
}

.prose h2 {
  @apply font-display text-2xl font-bold mt-12 mb-4;
}

.prose h3 {
  @apply font-display text-xl font-bold mt-8 mb-3;
}

.prose p {
  @apply mb-6;
}

.prose a {
  @apply text-accent underline underline-offset-2 hover:text-accent-hover;
}

.prose ul, .prose ol {
  @apply mb-6 pl-6;
}

.prose li {
  @apply mb-2;
}

.prose blockquote {
  @apply border-l-4 border-accent pl-4 italic my-6;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .prose {
    font-size: 1rem; /* 16px on mobile */
    line-height: 1.6;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Contentlayer | Velite | 2024 (Contentlayer unmaintained) | Velite is actively maintained, simpler API |
| Prism.js | Shiki via rehype-pretty-code | 2023+ | VS Code accuracy, better themes |
| next-mdx-remote | Velite `s.mdx()` | 2024 | Build-time compilation, type-safe |
| Custom webpack plugins | Next.js config initialization | 2025 (Turbopack default) | Turbopack compatibility |
| tailwind.config.js | Tailwind v4 @theme CSS | 2025 | CSS-first, no JS config |

**Deprecated/outdated:**
- **Contentlayer**: Unmaintained since 2023, use Velite instead
- **@next/mdx for content sites**: Better to use Velite for structured content with metadata
- **Prism.js with rehype-prism**: Shiki provides better accuracy and VS Code themes
- **VeliteWebpackPlugin**: Use Next.js config initialization for Turbopack compatibility

## Open Questions

Things that couldn't be fully resolved:

1. **Copy button JSX mode with Velite**
   - What we know: `@rehype-pretty/transformers` copy button has `jsx: true` option for React
   - What's unclear: Whether additional client registration is needed with Velite's MDX output
   - Recommendation: Test during implementation; may need client-side `registerCopyButton` call

2. **Active TOC heading highlighting**
   - What we know: Intersection Observer pattern is standard for tracking visible headings
   - What's unclear: Best integration approach with Velite's static TOC data
   - Recommendation: Implement as enhancement after basic TOC works

3. **Shiki theme matching neobrutalist aesthetic**
   - What we know: github-dark-dimmed is default, many themes available
   - What's unclear: Which theme best complements dusty pink background
   - Recommendation: Test github-dark and one-dark-pro during implementation

## Sources

### Primary (HIGH confidence)
- [Velite GitHub](https://github.com/zce/velite) - v0.3.1, December 2025
- [Velite Documentation](https://velite.js.org/guide/with-nextjs) - Next.js integration
- [Velite Schemas](https://velite.js.org/guide/velite-schemas) - s.toc(), s.metadata(), s.excerpt()
- [rehype-pretty-code](https://rehype-pretty.pages.dev/) - v0.14.1, March 2025
- [@rehype-pretty/transformers](https://jsr.io/@rehype-pretty/transformers) - Copy button configuration

### Secondary (MEDIUM confidence)
- [Typography best practices](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/) - 50-75 character line length
- [MDX TOC patterns](https://www.nikolailehbr.ink/blog/mdx-table-of-contents/) - Sticky sidebar implementation
- [Reading progress indicators](https://nehalist.io/creating-a-reading-progress-bar-in-react/) - Scroll-based progress

### Tertiary (LOW confidence)
- Community templates (mext15, nextjs-velite-blog-template) - Pattern validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation reviewed, versions verified
- Architecture: HIGH - Velite examples and official patterns followed
- Pitfalls: HIGH - GitHub issues reviewed, official docs warn about Turbopack
- Code examples: MEDIUM - Adapted from official examples, some patterns from community

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (Velite is actively maintained, check for updates)
