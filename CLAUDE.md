# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio and blog website at keech.dev. Neobrutalist design aesthetic with a cosmic, Norse-touched theme. Deployed on Vercel.

## Commands

```bash
npm run dev     # Start dev server (Velite + Next.js with Turbopack)
npm run build   # Production build (Velite then Next.js)
npm run lint    # ESLint validation
npm run velite  # Rebuild content only
```

## Tech Stack

- **Framework:** Next.js 16 with App Router (React 19)
- **Content:** Velite (MDX → type-safe data in `.velite/`)
- **Styling:** Tailwind CSS v4 (CSS-first @theme in globals.css, no tailwind.config)
- **Fonts:** Space Grotesk (headings), Inter (body)
- **Code Highlighting:** rehype-pretty-code with Shiki (`github-dark-dimmed` theme)
- **Icons:** Lucide React

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Design tokens via @theme, prose styles
│   ├── blog/[slug]/        # Dynamic blog post pages
│   └── projects/[slug]/    # Dynamic project pages
├── components/
│   ├── layout/             # Header, Footer, MobileNav
│   ├── blog/               # PostCard, MDXContent, TOC, CodeBlock
│   ├── projects/           # ProjectCard, TechBadge
│   └── ui/                 # ScrollReveal animation wrapper
└── lib/                    # cn() utility, font config

content/                    # MDX source files (processed by Velite)
├── posts/*.mdx
└── projects/*.mdx

.velite/                    # Generated (gitignored) - import content from here
```

## Content System (Velite)

Content is defined in `velite.config.ts`. MDX files in `content/` are processed into type-safe data:

```typescript
import { posts, projects } from '@/.velite'
```

Post schema: `title, slug, date, description?, tags[], draft?, toc, body`
Project schema: `title, slug, description, date, featured?, stack[], github?, demo?, category?, image?, body`

## Design System

Defined in `globals.css` using Tailwind v4's `@theme`:

- **Colors:** dusty pink background (#E8B4B8), teal accent (#2D8B8B), light pink surface (#F5E6E8)
- **Shadows:** Hard offset neobrutalist (4px 4px 0 0 #000)
- **Borders:** 3px solid black
- **Prose:** Custom `.prose` class for blog typography
- **Single theme only** — no dark/light toggle (cohesive aesthetic is core to vision)

## Key Patterns

- **Path alias:** `@/*` → `./src/*`, `@/.velite` → `./.velite`
- **'use client':** Only on components with hooks (MobileNav, ScrollReveal, CopyButton, CodeBlock, MDXContent)
- **ScrollReveal:** Intersection Observer wrapper for fade-in animations (respects `prefers-reduced-motion`)
- **MDX runtime:** Compiled MDX executed via `new Function()` with custom component overrides

## Commit Convention

Format: `type(phase): description`
- Types: feat, fix, docs, test, chore

## Planning Documents

Project planning in `.planning/`:
- `PROJECT.md` - Vision and requirements
- `STATE.md` - Current status
