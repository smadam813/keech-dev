# Phase 3: Projects & About - Research

**Researched:** 2026-02-01
**Domain:** Portfolio content collection, project cards, about page, resume handling
**Confidence:** HIGH

## Summary

This phase extends the existing Velite content system to support a projects collection alongside the blog posts. The infrastructure from Phase 2 (Velite configuration, MDX rendering, neobrutalist component patterns) provides a strong foundation. The primary work involves defining a new `projects` collection schema, creating project card components that mirror the established `PostCard` pattern, and building the about page with bio, photo, and social links.

The existing patterns in the codebase are well-established: neobrutalist cards with 3px borders and brutal shadows, lucide-react icons for visual elements, and the TagChip component for badges. These patterns directly translate to project cards with tech stack badges. The about page requires a new layout but can reuse the footer's social link pattern.

Resume handling is straightforward: place a PDF in `public/` and link with a download attribute. The CONTEXT.md specifies placeholder UI since the actual PDF comes later.

**Primary recommendation:** Add a `projects` collection to `velite.config.ts` with optional image support, create ProjectCard component mirroring PostCard's neobrutalist pattern, and build a simple about page with headshot image and social links that match footer styling.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| velite | 0.3.1 | Content collection for projects | Already configured, extends to projects collection |
| lucide-react | 0.563.0 | Icons for tech badges, social links | Already in use in footer |
| next/image | 16.x | Optimized images for project thumbnails, headshot | Built into Next.js, handles optimization |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | existing | cn() utility for conditional classes | All component styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Velite s.image() | Manual public folder | s.image() provides blur placeholder, dimensions |
| lucide-react | Simple Icons (brand logos) | lucide has no brand logos; use text chips for tech stack |
| Static PDF | PDF.js viewer | Over-engineered for simple resume download |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
content/
├── posts/           # Blog posts (existing)
└── projects/        # NEW: Project MDX files
    ├── keech-dev.mdx
    └── cool-project.mdx

src/
├── app/
│   ├── projects/
│   │   ├── page.tsx          # Projects listing
│   │   └── [slug]/
│   │       └── page.tsx      # Individual project
│   └── about/
│       └── page.tsx          # About page (replace stub)
├── components/
│   ├── projects/             # NEW
│   │   └── project-card.tsx  # Card for listing
│   └── about/                # NEW
│       └── social-links.tsx  # Reusable social section

public/
├── images/
│   ├── headshot.jpg          # About page photo
│   └── projects/             # Project screenshots (optional)
└── resume.pdf                # Downloadable resume (placeholder)
```

### Pattern 1: Multiple Velite Collections
**What:** Add projects collection alongside posts in velite.config.ts
**When to use:** Extending content types
**Example:**
```typescript
// velite.config.ts
// Source: https://velite.js.org/guide/define-collections

import { defineCollection, defineConfig, s } from 'velite'

const posts = defineCollection({ /* existing */ })

const projects = defineCollection({
  name: 'Project',
  pattern: 'projects/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(99),
      slug: s.slug('projects'),
      description: s.string().max(300),
      date: s.isodate(),
      updated: s.isodate().optional(),
      featured: s.boolean().default(false),
      // Tech stack as array of strings
      stack: s.array(s.string()).default([]),
      // Optional links - show what exists
      github: s.string().optional(),
      demo: s.string().optional(),
      // Optional category
      category: s.enum(['side-project', 'professional', 'open-source']).optional(),
      // Optional screenshot/thumbnail
      image: s.image().optional(),
      // MDX content for detail page
      body: s.mdx()
    })
    .transform(data => ({
      ...data,
      permalink: `/projects/${data.slug}`
    }))
})

export default defineConfig({
  root: 'content',
  collections: { posts, projects },
  // ... existing config
})
```

### Pattern 2: Project Card Component (Mirrors PostCard)
**What:** Neobrutalist card for project listings
**When to use:** Projects listing page
**Example:**
```tsx
// src/components/projects/project-card.tsx
// Source: Existing PostCard pattern in codebase

import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Github } from 'lucide-react'
import { TechBadge } from './tech-badge'

interface ProjectCardProps {
  project: {
    title: string
    slug: string
    description: string
    stack: string[]
    github?: string
    demo?: string
    image?: {
      src: string
      width: number
      height: number
      blurDataURL: string
    }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`} className="block group">
      <article
        className="h-full bg-surface border-[3px] border-black shadow-brutal
                   hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
                   transition-all duration-150 overflow-hidden"
      >
        {/* Optional image with fallback */}
        {project.image && (
          <div className="aspect-video relative border-b-[3px] border-black">
            <Image
              src={project.image.src}
              alt={project.title}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL={project.image.blurDataURL}
            />
          </div>
        )}

        <div className="p-6">
          <h2 className="font-display text-xl font-bold group-hover:text-accent transition-colors">
            {project.title}
          </h2>

          <p className="text-foreground/80 mt-2 mb-4 line-clamp-2">
            {project.description}
          </p>

          {/* Tech stack badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.stack.slice(0, 4).map((tech) => (
              <TechBadge key={tech} tech={tech} />
            ))}
          </div>

          {/* Quick links */}
          <div className="flex gap-3 text-muted">
            {project.github && (
              <span className="flex items-center gap-1 text-sm">
                <Github className="w-4 h-4" />
                Code
              </span>
            )}
            {project.demo && (
              <span className="flex items-center gap-1 text-sm">
                <ExternalLink className="w-4 h-4" />
                Demo
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
```

### Pattern 3: Tech Stack Badge (Text-Based)
**What:** Simple text chip for technology display
**When to use:** Project cards and detail pages
**Example:**
```tsx
// src/components/projects/tech-badge.tsx
// Source: Existing TagChip pattern adapted for tech stack

import { cn } from '@/lib/utils'

interface TechBadgeProps {
  tech: string
  className?: string
}

export function TechBadge({ tech, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-xs font-mono font-bold',
        'border-2 border-black bg-accent/10',
        className
      )}
    >
      {tech}
    </span>
  )
}
```

### Pattern 4: About Page with Headshot
**What:** Professional bio page with photo and social links
**When to use:** About page
**Example:**
```tsx
// src/app/about/page.tsx
// Source: Community pattern for developer about pages

import Image from 'next/image'
import { Github, Linkedin, Mail, Download } from 'lucide-react'

const socialLinks = [
  { href: 'https://github.com/smadam813', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com/in/adam-keech', icon: Linkedin, label: 'LinkedIn' },
]

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Headshot */}
        <div className="shrink-0">
          <div className="w-48 h-48 relative border-[3px] border-black shadow-brutal">
            <Image
              src="/images/headshot.jpg"
              alt="Adam Keech"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <h1 className="font-display text-4xl font-bold mb-4">About</h1>
          <div className="prose">
            <p>
              Adam Keech is a software developer based in [location].
              He specializes in [areas] and enjoys building [types of things].
            </p>
            {/* Additional paragraphs */}
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mt-6">
            {socialLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border-[3px] border-black bg-surface shadow-brutal
                             hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
                             transition-all"
                  aria-label={link.label}
                >
                  <Icon className="w-6 h-6" />
                </a>
              )
            })}
          </div>

          {/* Resume Download */}
          <a
            href="/resume.pdf"
            download
            className="inline-flex items-center gap-2 mt-6 px-4 py-2
                       border-[3px] border-black bg-accent text-background font-bold
                       shadow-brutal hover:shadow-brutal-hover
                       hover:translate-x-[2px] hover:translate-y-[2px]
                       transition-all"
          >
            <Download className="w-5 h-5" />
            Download Resume
          </a>
        </div>
      </div>
    </main>
  )
}
```

### Pattern 5: PDF Download Link
**What:** Simple download button for resume
**When to use:** About page resume section
**Example:**
```tsx
// PDF in public/resume.pdf, linked with download attribute
<a
  href="/resume.pdf"
  download="Adam_Keech_Resume.pdf"
  className="inline-flex items-center gap-2 px-4 py-2
             border-[3px] border-black bg-accent text-background font-bold
             shadow-brutal hover:shadow-brutal-hover transition-all"
>
  <Download className="w-5 h-5" />
  Download Resume
</a>

// For placeholder (no PDF yet):
<div className="inline-flex items-center gap-2 px-4 py-2
                border-[3px] border-black bg-muted/20 text-muted font-bold cursor-not-allowed">
  <Download className="w-5 h-5" />
  Resume Coming Soon
</div>
```

### Anti-Patterns to Avoid
- **Brand logo icons from lucide:** Lucide doesn't have technology brand logos (React, TypeScript, etc.); use text badges instead
- **PDF.js viewer for resume:** Over-engineered; simple download link is sufficient and more accessible
- **Contact form:** Out of scope per PROJECT.md; social links are sufficient for v1
- **Complex project navigation:** Simple back-to-list is cleaner than related/prev-next for small portfolio

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project content management | Custom JSON/folder parsing | Velite projects collection | Type-safe, schema validation, MDX support |
| Image optimization | Manual resize/blur generation | Velite s.image() + next/image | Automatic blur placeholder, dimensions |
| Tech badge icons | Icon library for all technologies | Text-based badges | No library covers all tech; text is universal |
| Social link components | Custom from scratch | Adapt footer pattern | Already implemented and tested |
| Resume hosting | External service | Static file in public/ | Simpler, no dependencies |

**Key insight:** This phase is primarily about reusing established patterns. The PostCard, TagChip, and footer social links provide templates for all new components.

## Common Pitfalls

### Pitfall 1: Missing projects collection export from Velite
**What goes wrong:** Can't import projects data, TypeScript errors
**Why it happens:** Forgot to add `projects` to collections object in defineConfig
**How to avoid:** Verify `collections: { posts, projects }` in velite.config.ts
**Warning signs:** "Cannot find module '.velite'" or missing exports

### Pitfall 2: Image paths in MDX frontmatter
**What goes wrong:** Images not loading, broken paths in production
**Why it happens:** Using absolute paths instead of relative to content folder
**How to avoid:** Use relative paths like `./images/screenshot.png` from MDX file location
**Warning signs:** 404 errors for images, missing blurDataURL

### Pitfall 3: Optional image without null check
**What goes wrong:** Runtime error when accessing image.src on undefined
**Why it happens:** Image is optional but code assumes it exists
**How to avoid:** Always check `{project.image && (...)}` before accessing properties
**Warning signs:** "Cannot read property 'src' of undefined"

### Pitfall 4: Resume download on iOS Safari
**What goes wrong:** PDF opens in browser instead of downloading
**Why it happens:** iOS Safari handles `download` attribute differently
**How to avoid:** Accept this behavior; iOS users can share/save from browser
**Warning signs:** User reports PDF not downloading on mobile

### Pitfall 5: Velite watch not detecting new projects folder
**What goes wrong:** New projects not appearing during development
**Why it happens:** Velite watch started before `content/projects/` existed
**How to avoid:** Restart dev server after creating new content folders
**Warning signs:** New MDX files not triggering rebuild

### Pitfall 6: Category enum values mismatch
**What goes wrong:** Velite validation errors on build
**Why it happens:** MDX frontmatter has category value not in enum
**How to avoid:** Use exact enum values: 'side-project', 'professional', 'open-source'
**Warning signs:** "Invalid enum value" errors during build

## Code Examples

Verified patterns from official sources:

### Project MDX Frontmatter
```yaml
# content/projects/keech-dev.mdx
---
title: keech.dev
slug: keech-dev
description: Personal portfolio and blog with neobrutalist design
date: 2026-01-31
featured: true
stack:
  - Next.js
  - TypeScript
  - Tailwind CSS
  - Velite
github: https://github.com/smadam813/keech-dev
demo: https://keech.dev
category: side-project
image: ./images/keech-dev-screenshot.png
---

## Overview

This portfolio site showcases my work and writing...

## Technical Challenges

Building a cohesive design system required...

## Outcome

The site serves as my professional home on the web...
```

### Projects Listing Page
```tsx
// src/app/projects/page.tsx
// Source: Existing blog/page.tsx pattern

import { projects } from '@/.velite'
import { ProjectCard } from '@/components/projects/project-card'

export default function ProjectsPage() {
  const sortedProjects = projects
    .sort((a, b) => {
      // Featured first, then by date
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-8">
        Projects
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {sortedProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </main>
  )
}
```

### Individual Project Page
```tsx
// src/app/projects/[slug]/page.tsx
// Source: Existing blog/[slug]/page.tsx pattern

import { projects } from '@/.velite'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { TechBadge } from '@/components/projects/tech-badge'
import { Github, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }))
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)

  if (!project) notFound()

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        All Projects
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-4">{project.title}</h1>
        <p className="text-lg text-foreground/80 mb-4">{project.description}</p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.stack.map((tech) => (
            <TechBadge key={tech} tech={tech} />
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-4">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2
                         border-[3px] border-black bg-surface
                         shadow-brutal hover:shadow-brutal-hover transition-all"
            >
              <Github className="w-5 h-5" />
              View Code
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2
                         border-[3px] border-black bg-accent text-background
                         shadow-brutal hover:shadow-brutal-hover transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Live Demo
            </a>
          )}
        </div>
      </header>

      {/* Optional screenshot */}
      {project.image && (
        <div className="mb-8 border-[3px] border-black shadow-brutal overflow-hidden">
          <Image
            src={project.image.src}
            alt={`${project.title} screenshot`}
            width={project.image.width}
            height={project.image.height}
            className="w-full"
            placeholder="blur"
            blurDataURL={project.image.blurDataURL}
          />
        </div>
      )}

      {/* Content */}
      <div className="prose">
        <MDXContent code={project.body} />
      </div>
    </main>
  )
}
```

### Static Metadata for SEO
```tsx
// src/app/projects/[slug]/page.tsx (additional)
import { Metadata } from 'next'

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)

  if (!project) return {}

  return {
    title: `${project.title} | Projects | keech.dev`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: 'article',
      images: project.image ? [{ url: project.image.src }] : undefined,
    },
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate JSON files for projects | MDX with Velite schema | 2024+ | Unified content system, type-safe |
| Manual image optimization | Velite s.image() + next/image | 2024+ | Automatic blur, dimensions |
| PDF viewer libraries | Simple download link | Always | Less complexity, better UX |
| Icon libraries for tech logos | Text-based badges | 2024+ | No library covers all tech |

**Deprecated/outdated:**
- **react-pdf for resume viewing**: Over-engineered for download-only use case
- **Technology icon packs**: Too limited coverage, maintenance burden

## Open Questions

Things that couldn't be fully resolved:

1. **Project categorization value**
   - What we know: CONTEXT.md says "Claude's discretion based on content volume"
   - What's unclear: How many projects will exist; categories may be overkill for <5 projects
   - Recommendation: Implement category in schema but make optional; add filtering UI only if >6 projects

2. **Headshot image format and size**
   - What we know: Professional photo needed, neobrutalist styling (border, shadow)
   - What's unclear: Whether user has photo ready, optimal dimensions
   - Recommendation: Use 400x400px minimum, square aspect ratio; placeholder if not available

3. **About page content depth**
   - What we know: Third-person professional tone, photo featured
   - What's unclear: How much content beyond bio (skills, timeline)
   - Recommendation: Start with bio only; add sections if content is provided

## Sources

### Primary (HIGH confidence)
- [Velite Define Collections](https://velite.js.org/guide/define-collections) - Multiple collections, schema options
- [Velite Schemas](https://velite.js.org/guide/velite-schemas) - s.image(), s.file(), optional fields
- Existing codebase patterns - PostCard, TagChip, footer social links

### Secondary (MEDIUM confidence)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image) - Fallback patterns, blur placeholder
- [Next.js Public Folder](https://nextjs.org/docs/pages/api-reference/file-conventions/public-folder) - Static file serving
- [Lucide React](https://lucide.dev/guide/packages/lucide-react) - Icon usage patterns

### Tertiary (LOW confidence)
- Community portfolio patterns - Card design, about page layouts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Extends existing Velite setup, no new dependencies
- Architecture: HIGH - Mirrors established blog patterns exactly
- Pitfalls: HIGH - Based on actual codebase and Velite documentation
- Code examples: HIGH - Adapted from verified codebase patterns

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (patterns are stable, no major changes expected)
