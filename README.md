# keech.dev

A personal portfolio and blog with a distinctive **neobrutalist design**: bold borders, hard-offset shadows, and a cosmic palette of dusty rose, teal, and gold. An Elder Futhark rune system runs through the site as a thematic layer, with runes mapped to navigation routes, a glowing constellation over the hero image, and colors grouped by aett (Freyr amber, Hagal teal, Tyr gold).

**[keech.dev](https://keech.dev)**

## Stack

| Layer | Tech |
|-------|------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first `@theme`, no JS config) |
| Content | [Velite](https://velite.js.org/) (MDX to type-safe collections) |
| Syntax Highlighting | [rehype-pretty-code](https://rehype-pretty.pages.dev/) + [Shiki](https://shiki.style/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Fonts | Space Grotesk (headings) + Inter (body) |
| Deployment | [Vercel](https://vercel.com/) |

## Design System

The visual identity is defined entirely in CSS via Tailwind v4's `@theme` directive. No `tailwind.config.js` needed.

```css
--color-background: #E8B4B8;   /* dusty rose    */
--color-accent:     #2D8B8B;   /* teal          */
--color-surface:    #F5E6E8;   /* light pink    */
--color-foreground: #000000;   /* black         */

--shadow-neo:       4px 4px 0 0 #000;   /* signature hard-offset */
--border-width:     3px;                 /* bold, confident       */
```

Single theme by design. The aesthetic **is** the brand.

## Architecture

```
src/
├── app/                        # App Router pages
│   ├── globals.css             # Design tokens (@theme) + prose styles
│   ├── blog/[slug]/            # MDX blog posts with TOC + reading time
│   └── projects/[slug]/        # Project pages with tech stack + links
├── components/
│   ├── layout/                 # Header (hamburger nav), Footer
│   ├── blog/                   # PostCard, MDXContent, CodeBlock, TOC
│   ├── projects/               # ProjectCard, TechBadge
│   ├── runes/                  # RuneDivider
│   ├── ui/                     # ScrollReveal (Intersection Observer)
│   └── hero.tsx                # Hero section with rune glow overlay
└── lib/                        # cn(), font config, runes, rune-glows

content/
├── posts/*.mdx                 # Blog posts
└── projects/*.mdx              # Project entries
```

Server components by default. `'use client'` only where state or browser APIs are needed (6 of 14 components).

## Content Pipeline

MDX files in `content/` are processed by Velite at build time into type-safe collections:

```typescript
import { posts, projects } from '@/.velite'

// Full type safety: title, slug, date, tags, toc, body, readingTime
```

The MDX pipeline includes heading slugs, syntax highlighting with `github-dark-dimmed`, line numbers, and highlighted lines, all configured in `velite.config.ts`.

## Features

- **Responsive:** mobile-first with hamburger menu, sticky TOC on desktop
- **Accessible:** WCAG AA contrast, `prefers-reduced-motion`, `inert` focus management, semantic HTML
- **SEO:** dynamic metadata, OpenGraph, sitemap.xml, robots.txt
- **Performant:** static generation, image optimization, minimal client JS
- **Scroll animations:** Intersection Observer with single-trigger and motion preference respect

## Development

```bash
npm install
npm run dev       # Velite --watch + Next.js Turbopack
npm run build     # Production build
npm run lint      # ESLint
```

## How It Was Built

This site was built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as a pair programming partner, from design system decisions through implementation. AI-assisted development with human direction and judgment throughout.

## License

ISC
