# Architecture Patterns

**Domain:** Personal Blog + Portfolio Website (Next.js + MDX)
**Researched:** 2026-01-31
**Confidence:** HIGH (verified with official Next.js documentation)

## Recommended Architecture

### High-Level Overview

```
keech.dev Architecture
=======================

                     [Vercel Edge]
                          |
                          v
               +------------------+
               |  Next.js 15+     |
               |  App Router      |
               +------------------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
    [Static Pages]  [Dynamic Routes]  [API Routes]
    - Home           - /blog/[slug]    - Contact form
    - About          - /projects/[id]  - (optional)
    - Blog index
    - Projects index

          |               |
          +-------+-------+
                  |
                  v
        +------------------+
        |  Content Layer   |
        |  (Velite/MDX)    |
        +------------------+
                  |
          +-------+-------+
          |               |
          v               v
    [/content/blog]  [/content/projects]
    *.mdx files      *.mdx files
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **App Shell** | Root layout, fonts, metadata, theme | All pages |
| **Design System** | Neobrutalist tokens, primitives | All UI components |
| **Navigation** | Header, mobile menu, footer | App Shell |
| **Content Engine** | Parse MDX, frontmatter, generate routes | Blog/Project pages |
| **Blog Components** | Post list, post card, post layout | Content Engine, Design System |
| **Project Components** | Project grid, project card, project detail | Content Engine, Design System |
| **MDX Components** | Custom components for rich content | Individual MDX files |
| **Static Pages** | Home, About, Contact | Design System, Navigation |

### Data Flow

```
Build Time:
===========

1. Velite/next-mdx-remote scans /content directory
2. Parses frontmatter → generates type-safe content objects
3. generateStaticParams() returns all slugs
4. Next.js pre-renders each page with content

     /content/blog/*.mdx
            |
            v
    +------------------+
    | Content Parser   | ← Velite/next-mdx-remote + gray-matter
    | (build time)     |
    +------------------+
            |
            v
    +------------------+
    | Type-Safe Data   | ← Auto-generated TypeScript types
    | getAllPosts()    |
    | getPostBySlug()  |
    +------------------+
            |
            v
    +------------------+
    | Page Components  | ← Server Components (default)
    | /app/blog/[slug] |
    +------------------+
            |
            v
    +------------------+
    | Static HTML      | ← Pre-rendered at build
    +------------------+


Request Time:
=============

1. User requests /blog/my-post
2. Vercel serves pre-rendered HTML (instant)
3. React hydrates interactive components only
4. Client components handle theme toggle, mobile menu

     Browser Request
            |
            v
    +------------------+
    | Vercel CDN       | ← Cached static HTML
    +------------------+
            |
            v
    +------------------+
    | React Hydration  | ← Selective hydration
    +------------------+
            |
            v
    +------------------+
    | Client Components| ← Theme, menu, interactions
    +------------------+
```

## Directory Structure

**Recommended: Feature-based organization with src folder**

```
keech-dev/
├── src/
│   ├── app/                          # App Router
│   │   ├── layout.tsx                # Root layout (fonts, providers)
│   │   ├── page.tsx                  # Home page
│   │   ├── globals.css               # Tailwind + neobrutalist tokens
│   │   │
│   │   ├── blog/
│   │   │   ├── page.tsx              # Blog listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Individual post
│   │   │
│   │   ├── projects/
│   │   │   ├── page.tsx              # Projects grid
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Project detail
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx              # About page
│   │   │
│   │   └── api/                      # Optional API routes
│   │       └── contact/
│   │           └── route.ts          # Contact form handler
│   │
│   ├── components/
│   │   ├── ui/                       # Design system primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                   # Shell components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── nav.tsx
│   │   │   └── mobile-menu.tsx       # Client component
│   │   │
│   │   ├── blog/                     # Blog-specific
│   │   │   ├── post-card.tsx
│   │   │   ├── post-list.tsx
│   │   │   └── post-layout.tsx
│   │   │
│   │   ├── projects/                 # Project-specific
│   │   │   ├── project-card.tsx
│   │   │   └── project-grid.tsx
│   │   │
│   │   └── mdx/                      # MDX custom components
│   │       ├── code-block.tsx
│   │       ├── callout.tsx
│   │       ├── image.tsx
│   │       └── index.tsx             # Export all MDX components
│   │
│   ├── lib/                          # Utilities
│   │   ├── content.ts                # Content fetching helpers
│   │   ├── utils.ts                  # General utilities (cn, etc.)
│   │   └── fonts.ts                  # Font configuration
│   │
│   └── types/                        # TypeScript types
│       └── content.ts                # Post, Project interfaces
│
├── content/                          # MDX content (outside src)
│   ├── blog/
│   │   ├── first-post.mdx
│   │   └── second-post.mdx
│   │
│   └── projects/
│       ├── project-one.mdx
│       └── project-two.mdx
│
├── public/
│   ├── images/
│   ├── resume.pdf                    # Downloadable resume
│   └── favicon.ico
│
├── mdx-components.tsx                # Required for App Router MDX
├── velite.config.ts                  # Content schema (if using Velite)
├── next.config.mjs                   # Next.js + MDX config
├── tailwind.config.ts                # Tailwind + neobrutalist theme
└── package.json
```

## Patterns to Follow

### Pattern 1: Server Components by Default

**What:** All components are Server Components unless explicitly marked with `'use client'`

**When:** Always start here. Only add `'use client'` when needed.

**Rationale:** Reduces JavaScript bundle, improves initial load, enables async data fetching.

```typescript
// src/app/blog/[slug]/page.tsx - Server Component (default)
import { getPostBySlug, getAllPosts } from '@/lib/content'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  return (
    <article>
      <h1>{post.title}</h1>
      <PostContent content={post.content} />
    </article>
  )
}
```

### Pattern 2: Content as Data with Type Safety

**What:** Treat MDX files as a type-safe data source, not just pages

**When:** Always for blog posts and projects

**Rationale:** Enables filtering, sorting, querying content programmatically

```typescript
// velite.config.ts - Define content schema
import { defineConfig, s } from 'velite'

export default defineConfig({
  collections: {
    posts: {
      name: 'Post',
      pattern: 'blog/**/*.mdx',
      schema: s.object({
        title: s.string(),
        slug: s.slug('posts'),
        date: s.isodate(),
        description: s.string(),
        published: s.boolean().default(true),
        tags: s.array(s.string()).optional(),
        content: s.mdx(),
      }),
    },
    projects: {
      name: 'Project',
      pattern: 'projects/**/*.mdx',
      schema: s.object({
        title: s.string(),
        slug: s.slug('projects'),
        description: s.string(),
        url: s.string().url().optional(),
        github: s.string().url().optional(),
        featured: s.boolean().default(false),
        tech: s.array(s.string()),
        content: s.mdx(),
      }),
    },
  },
})
```

### Pattern 3: Composition over Configuration

**What:** Build MDX component system through composition, not complex configs

**When:** For all MDX rendering

```typescript
// mdx-components.tsx
import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from '@/components/mdx/code-block'
import { Callout } from '@/components/mdx/callout'
import Image from 'next/image'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Override HTML elements with styled versions
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold border-b-4 border-black mb-6">
        {children}
      </h1>
    ),
    img: (props) => (
      <Image
        {...props}
        className="border-4 border-black shadow-brutal"
        sizes="100vw"
        style={{ width: '100%', height: 'auto' }}
      />
    ),
    pre: CodeBlock,

    // Custom components available in MDX
    Callout,

    ...components,
  }
}
```

### Pattern 4: Neobrutalist Design Tokens

**What:** Define design system through Tailwind CSS custom properties

**When:** During initial setup, before building components

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Neobrutalist color palette */
    --background: 60 9% 98%;      /* Off-white */
    --foreground: 0 0% 0%;         /* Pure black */
    --primary: 45 93% 58%;         /* Bold yellow */
    --secondary: 339 90% 51%;      /* Hot pink */
    --accent: 173 80% 40%;         /* Teal */
    --destructive: 0 84% 60%;      /* Red */

    /* Neobrutalist borders and shadows */
    --border-width: 3px;
    --shadow-offset: 4px;
    --radius: 0;                   /* Sharp corners */
  }
}
```

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      boxShadow: {
        brutal: 'var(--shadow-offset) var(--shadow-offset) 0 0 hsl(var(--foreground))',
        'brutal-sm': '2px 2px 0 0 hsl(var(--foreground))',
        'brutal-lg': '6px 6px 0 0 hsl(var(--foreground))',
      },
      borderWidth: {
        brutal: 'var(--border-width)',
      },
    },
  },
}
```

### Pattern 5: Colocation with Private Folders

**What:** Keep route-specific utilities next to routes using underscore prefix

**When:** When logic is specific to one route/feature

```
src/app/blog/
├── _lib/
│   └── filters.ts      # Blog-specific filtering logic
├── _components/
│   └── tag-filter.tsx  # Only used on blog listing
├── page.tsx
└── [slug]/
    └── page.tsx
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client Components for Static Content

**What:** Using `'use client'` on components that only display data

**Why bad:** Increases bundle size, prevents server-side rendering benefits

**Instead:** Keep data-display components as Server Components. Only use client for interactivity.

```typescript
// BAD - unnecessary client component
'use client'
export function PostCard({ post }) {
  return <div>{post.title}</div>
}

// GOOD - Server Component (no directive needed)
export function PostCard({ post }) {
  return <div>{post.title}</div>
}
```

### Anti-Pattern 2: Fetching in Client Components

**What:** Loading content data in useEffect or client-side

**Why bad:** Causes loading spinners, SEO issues, unnecessary waterfalls

**Instead:** Fetch in Server Components or at build time

```typescript
// BAD - client-side fetching
'use client'
export function PostList() {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    fetch('/api/posts').then(r => r.json()).then(setPosts)
  }, [])
  return posts.map(p => <PostCard key={p.slug} post={p} />)
}

// GOOD - Server Component with async
export async function PostList() {
  const posts = await getAllPosts()
  return posts.map(p => <PostCard key={p.slug} post={p} />)
}
```

### Anti-Pattern 3: Monolithic MDX Configuration

**What:** Putting all MDX logic in next.config.mjs with many plugins

**Why bad:** Hard to debug, slow builds, tight coupling

**Instead:** Use minimal config, handle transforms in components

```javascript
// BAD - plugin soup
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm, remarkMath, remarkEmoji, ...10more],
    rehypePlugins: [rehypeSlug, rehypeHighlight, ...10more],
  },
})

// GOOD - minimal config, handle in components
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
})
// Then handle syntax highlighting etc. in component layer
```

### Anti-Pattern 4: Deep Nesting in Route Segments

**What:** Creating deeply nested route structures for organizational purposes

**Why bad:** Confusing URLs, harder to maintain, route group abuse

**Instead:** Flat routes, use private folders for organization

```
# BAD
app/(marketing)/(pages)/(static)/about/page.tsx → /about

# GOOD
app/about/page.tsx → /about
```

### Anti-Pattern 5: Contentlayer for New Projects

**What:** Using Contentlayer which is abandoned/unmaintained

**Why bad:** No updates since March 2024, incompatible with latest Next.js, security risks

**Instead:** Use Velite or next-mdx-remote with gray-matter

## Build Order and Dependencies

### Phase 1: Foundation (Must come first)

Dependencies: None

1. **Project scaffold** - Next.js 15+, TypeScript, Tailwind CSS
2. **Design tokens** - Neobrutalist color palette, shadows, borders
3. **Root layout** - Fonts, providers, metadata template
4. **Basic navigation** - Header, footer (can be simple)

**Rationale:** Everything else depends on these foundations being in place.

### Phase 2: Design System

Dependencies: Phase 1

1. **Primitive components** - Button, Card, Input (neobrutalist styled)
2. **Layout components** - Container, Section, Grid
3. **Typography** - Heading, Text, Link components

**Rationale:** UI components are needed before building pages.

### Phase 3: Content Engine

Dependencies: Phase 1

1. **Velite/MDX setup** - Schema definition, build integration
2. **Content utilities** - getAllPosts, getPostBySlug, etc.
3. **MDX components** - Code blocks, callouts, images
4. **mdx-components.tsx** - Global MDX overrides

**Rationale:** Content engine can be built parallel to design system.

### Phase 4: Static Pages

Dependencies: Phase 1, Phase 2

1. **Home page** - Hero, recent posts, featured projects
2. **About page** - Bio, resume download link
3. **Contact section** - Social links

**Rationale:** Static pages test the design system.

### Phase 5: Content Pages

Dependencies: Phase 2, Phase 3

1. **Blog listing** - Post cards with filtering
2. **Blog post** - Full post layout with MDX rendering
3. **Projects listing** - Project grid
4. **Project detail** - Project page with MDX

**Rationale:** Content pages depend on both design system and content engine.

### Phase 6: Polish

Dependencies: Phase 4, Phase 5

1. **SEO** - Metadata, Open Graph images, sitemap
2. **Performance** - Image optimization, font loading
3. **Accessibility** - Focus states, screen reader testing
4. **Dark mode** - Theme toggle (if desired)

**Dependency Graph:**

```
Phase 1: Foundation
       |
       +------------------+
       |                  |
       v                  v
Phase 2: Design     Phase 3: Content
   System               Engine
       |                  |
       +--------+---------+
                |
                v
         Phase 4: Static
            Pages
                |
                v
         Phase 5: Content
            Pages
                |
                v
         Phase 6: Polish
```

## Content Management Recommendation

**Recommended: Velite**

| Criterion | Velite | next-mdx-remote | Contentlayer |
|-----------|--------|-----------------|--------------|
| Actively maintained | Yes | Yes | No (abandoned) |
| Type safety | Full Zod schemas | Manual | Full |
| Next.js 15+ support | Yes | Yes | No |
| Build performance | Fast (<8s/1000 docs) | Depends | Good |
| Learning curve | Low | Low | Medium |
| Content as data | Native | Manual | Native |

**Why Velite:**
- Inspired by Contentlayer but actively maintained
- Zod schemas provide runtime validation + TypeScript types
- Handles images and static assets automatically
- Fast build times
- Works seamlessly with Next.js 15+

**Alternative: next-mdx-remote + gray-matter**
- If you prefer lighter-weight setup
- More manual work for type safety
- Good for simpler sites

## Scalability Considerations

| Concern | 10 Posts | 100 Posts | 500+ Posts |
|---------|----------|-----------|------------|
| Build time | <10s | <30s | 1-2min (consider ISR) |
| Bundle size | Minimal | Minimal | Minimal (SSG) |
| Navigation | Flat list | Pagination | Pagination + Search |
| Organization | Single folder | Date-based folders | Category folders |

For keech.dev (personal blog), 100 posts is a reasonable upper bound. The architecture handles this easily with static generation.

## Sources

### HIGH Confidence (Official Documentation)
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx) - Official MDX integration
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - Directory conventions
- [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) - Static generation API

### MEDIUM Confidence (Authoritative Sources)
- [Velite Introduction](https://velite.js.org/guide/introduction) - Velite documentation
- [Josh Comeau's Blog Architecture](https://www.joshwcomeau.com/blog/how-i-built-my-blog/) - Real-world implementation
- [Neobrutalism.dev](https://www.neobrutalism.dev/) - Neobrutalist component patterns

### Context (Ecosystem Research)
- [Contentlayer Status](https://github.com/contentlayerdev/contentlayer/issues/429) - Why not Contentlayer
- [Contentlayer Alternatives](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives) - Ecosystem context
- [Next.js Best Practices 2026](https://www.serviots.com/blog/nextjs-development-best-practices) - Current patterns
