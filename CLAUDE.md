# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Velite --watch & Next.js Turbopack (two parallel processes)
npm run build     # velite && next build (sequential — Velite must complete first)
npm run lint      # ESLint (next/core-web-vitals + next/typescript)
npm run start     # Serve production build
npm run velite    # Run Velite content compilation alone (useful for debugging content issues)
```

No test framework is configured. No CI/CD pipelines exist — deployment is git-push to Vercel.

## Architecture

Personal portfolio/blog at keech.dev. Next.js 16 App Router with React 19, Tailwind CSS v4, and Velite for MDX content.

### Content Pipeline

MDX files in `content/posts/` and `content/projects/` are compiled by Velite at build time into type-safe collections in `.velite/` (gitignored, regenerated on every build). Import via `@/.velite`:

```typescript
import { posts, projects } from '@/.velite'
```

Velite runs as a **separate prebuild step** (not a webpack plugin) because Turbopack doesn't support custom webpack plugins. The `velite.config.ts` defines two collections with Zod schemas, rehype-slug for heading IDs, and rehype-pretty-code with `github-dark-dimmed` theme.

Compiled MDX is executed at runtime via `new Function()` in `MDXContent` — the `<pre>` element is overridden with a `CodeBlock` wrapper that adds a copy button. This avoids Shiki transformer hydration issues.

**Post frontmatter** (required: `title`, `slug`, `date`; optional: `updated`, `description`, `tags`, `draft`). **Project frontmatter** (required: `title`, `slug`, `description`, `date`; optional: `updated`, `featured`, `stack`, `github`, `demo`, `category`, `image`). Full schemas in `velite.config.ts`.

### Path Aliases

- `@/*` → `./src/*`
- `@/.velite` → `./.velite` (generated content collections)

### Component Model

Server components by default. Only 6 components use `'use client'` — each for a specific browser API need (state, IntersectionObserver, clipboard, keyboard events). The `inert` attribute is used for focus management in the mobile menu instead of JavaScript focus traps.

### Styling

Tailwind CSS v4 with **CSS-first configuration** — all design tokens live in `src/app/globals.css` via `@theme` directive. There is no `tailwind.config.js`. The neobrutalist visual identity uses:

- Hard-offset shadows (`--shadow-brutal: 4px 4px 0 0 #000`)
- Bold borders (`--border-brutal: 3px`)
- Dusty rose background, teal accents, black foreground
- Single theme only (no dark mode) — the palette is the brand

### Rune Design Language

Elder Futhark runes are used as a thematic design element throughout the site — not just decoration but part of the brand identity:

- **Navigation**: Each route has a mapped rune (Othala → Home, Ansuz → Blog, Kenaz → Projects, Mannaz → About) defined in `src/components/runes/rune-config.ts`
- **Hero**: 14 rune glows positioned over the hero image with breathing animations. Positioning data in `src/lib/rune-glows.ts` uses 0–1 fraction coordinates, computed against `object-fit: cover` scaling via `computeGlowPositions()`
- **Animation timing**: Rune breathing durations use non-round values (5.0s–7.5s) to prevent visual synchronization
- Runes are colored by aett grouping: Freyr (amber), Hagal (teal), Tyr (gold)

### Animation Patterns

- **Reduced-motion**: Checked on mount via `prefers-reduced-motion` media query and listened for changes; all animations respect this
- **Hero reveal sequence**: Orchestrated with setTimeout — image blur→sharp, then text fade-up, then rune glow cascade
- **Scroll reveal**: `ScrollReveal` component wraps elements with single-fire IntersectionObserver (threshold 0.1)
- **Scroll lock**: Uses `position: fixed` approach (iOS Safari safe, unlike `overflow: hidden`)

### Static Generation

All content pages use `generateStaticParams()` for full static generation. No API routes, no database, no server-side data fetching. SEO handled by `sitemap.ts` and `robots.ts` in app root.

### Utilities

- `cn()` in `src/lib/utils.ts` — clsx + tailwind-merge for combining Tailwind classes without conflicts. Used throughout all components.

### Fonts

Space Grotesk (headings) and Inter (body) configured in `src/lib/fonts.ts`, plus Norse custom WOFF2 fonts in `public/fonts/`. Font CSS variables: `--font-display` (Norse), `--font-body` (Inter).

## Blog Writing Skill

The `.claude/skills/write-blog-post/` skill orchestrates end-to-end blog post creation: spawns 2–3 `blog-researcher` subagents in parallel, synthesizes research, writes MDX, generates image prompts, and validates with `npm run velite`. Writing principles are in `.claude/skills/write-blog-post/writing-guide.md` — specificity over abstraction, frontload value, conversational tone, no emdashes or emojis.
