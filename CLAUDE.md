# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Velite --watch & Next.js Turbopack (two parallel processes)
npm run build     # velite && next build (sequential — Velite must complete first)
npm run lint      # ESLint flat config (core-web-vitals + typescript; 3 React 19 rules downgraded to warn)
npm run test      # Vitest unit tests
npm run test:e2e  # Playwright end-to-end tests
npm run start     # Serve production build
npm run velite    # Run Velite content compilation alone (useful for debugging content issues)
```

No CI/CD pipelines exist — deployment is git-push to Vercel.

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

Server components by default. Client components (`'use client'`) are used only where browser APIs are needed (state, IntersectionObserver, clipboard, localStorage, keyboard events). The `inert` attribute is used for focus management in the mobile menu instead of JavaScript focus traps.

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

### View Counting

Blog post views are tracked via Upstash Redis with two API routes:

- `GET /api/views?slugs=a,b` — batch fetch counts for listing pages
- `GET/POST /api/views/[slug]` — single post fetch/increment with IP-based deduplication (SHA-256 hashed, 24h TTL)

Client components use localStorage as a read-through cache to prevent flash on repeat visits. `ListingViewCounts` provides a React context for batch counts on listing pages; `ViewCounter` handles single-post pages. View counts are non-critical UI — all fetches fail silently.

Environment variables required: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (used by `Redis.fromEnv()` in `src/lib/redis.ts`).

### Testing

Vitest for unit tests (`vitest.config.ts`), Playwright for e2e (`playwright.config.ts`). Unit tests live alongside source files as `*.test.ts(x)`. E2e specs in `e2e/`. Coverage includes error boundaries, hooks, lib utilities, and UI components.

`vitest.config.ts` enables `globals: true` so tests use `describe`/`it`/`expect` without imports. Running `npx tsc --noEmit` will show false errors in test files (`afterEach` not found, etc.) — these are expected since Vitest globals aren't in tsconfig. Use `npm run test` to validate test correctness.

### Error Handling

- `error.tsx` — route-level error boundary (also `blog/[slug]/error.tsx` for post pages)
- `global-error.tsx` — root error boundary
- `not-found.tsx` — 404 page
- `loading.tsx` — loading skeleton

Error boundaries use plain `<a>` tags (not `next/link`) intentionally — client-side routing may be broken when the error boundary is showing. Each `<a>` tag has an `eslint-disable-next-line @next/next/no-html-link-for-pages` comment to suppress the false-positive lint error. The same applies to `MDXFallback` in `mdx-content.tsx`.

### Security Hardening

`next.config.ts` sets security headers on all routes: Content-Security-Policy (self-only with eval for MDX), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin.

API routes use input validation (`src/lib/validation.ts` — slug format + batch size limits) and rate limiting via `@upstash/ratelimit` on the view-count POST endpoint.

### Static Generation & SEO

Content pages use `generateStaticParams()` for full static generation. SEO handled by `sitemap.ts`, `robots.ts`, and `opengraph-image.tsx` (dynamic OG image generation) in app root. RSS feed at `src/app/feed.xml/route.ts`. Vercel Web Analytics is included in the root layout.

### Utilities

- `cn()` in `src/lib/utils.ts` — clsx + tailwind-merge for combining Tailwind classes without conflicts. Used throughout all components.
- `formatDate()` in `src/lib/format.ts` — shared date formatter (UTC-normalized `Intl.DateTimeFormat`). Use instead of inline `toLocaleDateString()` or `new Intl.DateTimeFormat()`.

### Fonts

Norse custom WOFF2 (headings/display) and Inter (body) configured in `src/lib/fonts.ts`. Font CSS variables: `--font-display` (Norse), `--font-body` (Inter).

## Blog Writing Skill

The `.claude/skills/write-blog-post/` skill orchestrates end-to-end blog post creation: spawns 2–3 `blog-researcher` subagents in parallel, synthesizes research, writes MDX, generates image prompts, and validates with `npm run velite`. Writing principles are in `.claude/skills/write-blog-post/writing-guide.md` — specificity over abstraction, frontload value, conversational tone, no emdashes or emojis.
