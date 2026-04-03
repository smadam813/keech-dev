# Codebase Structure

**Analysis Date:** 2026-04-03

## Directory Layout

```
keech-dev/
├── .claude/                        # Claude Code configuration
│   └── skills/                     # Claude Code skills
│       └── write-blog-post/        # Blog writing skill (orchestration + guides)
├── content/                        # MDX content source files (Velite input)
│   ├── posts/                      # Blog post MDX files (5 posts)
│   └── projects/                   # Project showcase MDX files (2 projects)
├── .devcontainer/                  # Dev container configuration
├── e2e/                            # Playwright E2E test specs
├── .planning/                      # GSD planning documents
│   ├── codebase/                   # Codebase analysis documents
│   ├── milestones/                 # Versioned milestone plans (v1.3-v1.5)
│   ├── phases/                     # Phase specs (09-13)
│   ├── quick/                      # Quick task plans
│   └── research/                   # Research documents
├── public/                         # Static assets served at /
│   ├── fonts/                      # Custom WOFF2 font files
│   ├── images/                     # Site images
│   │   ├── posts/                  # Blog post images
│   │   └── projects/               # Project images
│   └── static/                     # Velite-output assets (hashed, cleaned on build)
├── .research/                      # Blog research working files (gitignored)
├── scripts/                        # Standalone utility scripts
├── src/                            # Application source code
│   ├── app/                        # Next.js App Router (routes + API)
│   │   ├── about/                  # /about route
│   │   │   └── page.tsx
│   │   ├── api/views/              # View count API
│   │   │   ├── route.ts            # GET /api/views?slugs=... (batch)
│   │   │   └── [slug]/
│   │   │       └── route.ts        # GET/POST /api/views/{slug} (single)
│   │   ├── blog/                   # /blog route
│   │   │   ├── page.tsx            # Blog listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Individual post
│   │   ├── feed.xml/
│   │   │   └── route.ts            # RSS feed route handler
│   │   ├── projects/               # /projects route
│   │   │   ├── page.tsx            # Projects listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Individual project
│   │   ├── error.tsx               # Route-level error boundary
│   │   ├── error.test.tsx          # Error boundary test
│   │   ├── global-error.tsx        # Root error boundary
│   │   ├── global-error.test.tsx   # Global error test
│   │   ├── globals.css             # Design tokens, animations, prose styles
│   │   ├── layout.tsx              # Root layout
│   │   ├── loading.tsx             # Loading skeleton
│   │   ├── loading.test.tsx        # Loading test
│   │   ├── not-found.tsx           # 404 page
│   │   ├── opengraph-image.tsx     # Dynamic OG image
│   │   ├── page.tsx                # Home page (Hero)
│   │   ├── robots.ts               # /robots.txt
│   │   └── sitemap.ts              # /sitemap.xml
│   ├── assets/fonts/               # Font source files for next/font
│   ├── components/                 # React components
│   │   ├── blog/                   # Blog-specific components
│   │   ├── layout/                 # Site-wide layout (header, footer)
│   │   ├── projects/               # Project-specific components
│   │   ├── runes/                  # Rune design system config + components
│   │   ├── ui/                     # Shared UI primitives
│   │   └── hero.tsx                # Home page hero component
│   ├── hooks/                      # Custom React hooks
│   └── lib/                        # Utility functions and service clients
├── .velite/                        # Velite build output (gitignored)
├── test-results/                   # Playwright test output (gitignored)
├── eslint.config.mjs               # ESLint flat config
├── next.config.ts                  # Next.js config (CSP, security headers)
├── playwright.config.ts            # Playwright E2E config
├── postcss.config.mjs              # PostCSS config (Tailwind v4)
├── tsconfig.json                   # TypeScript config (path aliases, strict)
├── velite.config.ts                # Velite content pipeline config
└── vitest.config.ts                # Vitest unit test config
```

## Directory Purposes

**`content/`:**
- Purpose: MDX source files processed by Velite at build time
- Contains: `.mdx` files with YAML frontmatter
- Key files: `content/posts/*.mdx` (5 posts), `content/projects/*.mdx` (2 projects)
- Slugs auto-derived from filename; frontmatter defines metadata

**`src/app/`:**
- Purpose: Next.js App Router -- pages, layouts, API routes, SEO files, error boundaries
- Contains: `page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`, `sitemap.ts`, `robots.ts`, `globals.css`, route handlers, co-located test files
- Key files: `src/app/layout.tsx` (root layout), `src/app/globals.css` (entire design system)

**`src/components/blog/`:**
- Purpose: All blog-related components
- Key files:
  - `mdx-content.tsx` -- Runtime MDX execution via `new Function()` with error fallback (client)
  - `filtered-post-list.tsx` -- Tag-filtered post grid with view counts (client)
  - `listing-view-counts.tsx` -- Batch view count Context provider (client)
  - `view-counter.tsx` -- Single post view counter with localStorage cache (client)
  - `post-card.tsx` -- Post card for listing grid (client)
  - `code-block.tsx` -- Code block wrapper with copy button
  - `copy-button.tsx` -- Clipboard copy button (client)
  - `toc.tsx` -- Desktop sidebar table of contents (server)
  - `mobile-toc.tsx` -- Sticky collapsible mobile TOC (client)

**`src/components/layout/`:**
- Purpose: Site-wide structural components used in root layout
- Key files: `header.tsx` (nav + mobile menu with scroll lock, focus management, Escape key; client), `footer.tsx` (server)

**`src/components/projects/`:**
- Purpose: Project-specific components
- Key files: `filtered-project-list.tsx` (stack-filtered grid, client), `project-card.tsx` (card for listing, client)

**`src/components/runes/`:**
- Purpose: Elder Futhark rune data and rune-themed UI elements
- Key files: `rune-config.ts` (all 24 runes + context mappings: NAV_RUNES, POST_RUNES, etc.; server-safe), `rune-divider.tsx` (decorative divider; server)

**`src/components/ui/`:**
- Purpose: Shared, domain-agnostic UI primitives
- Key files: `filter-bar.tsx` (generic filter bar with render prop), `filter-chip.tsx` (tag/stack chip with variant prop, client), `scroll-reveal.tsx` (IntersectionObserver fade-in, client)

**`src/hooks/`:**
- Purpose: Reusable client-side stateful logic
- Key files:
  - `use-filtered-list.ts` -- Generic URL-synced AND-filter with transition state
  - `use-hero-animation.ts` -- Hero reveal sequence orchestration (3-beat animation)
  - `use-glow-positions.ts` -- Responsive rune glow positioning via ResizeObserver
- Each hook has a co-located `.test.ts` file

**`src/lib/`:**
- Purpose: Pure utilities, service clients, shared functions
- Key files:
  - `utils.ts` -- `cn()` (clsx + tailwind-merge)
  - `fonts.ts` -- Norse + Inter font config (CSS variables: `--font-display`, `--font-body`)
  - `format.ts` -- `formatDate()` helper
  - `views.ts` -- `formatViewCount()`, `getCachedViews()`, `setCachedViews()` (localStorage)
  - `validation.ts` -- `validateSlug()`, `validateSlugs()` (regex, length, batch limits)
  - `rate-limit.ts` -- `viewsRateLimit` (Upstash sliding window 10 req/60s)
  - `redis.ts` -- `redis` instance (`Redis.fromEnv()`)
  - `rune-glows.ts` -- `RUNE_GLOWS` data array + `computeGlowPositions()` for object-fit: cover math
- Most lib files have co-located `.test.ts` files

**`e2e/`:**
- Purpose: Playwright E2E tests (run against dev server)
- Key files: `code-copy.spec.ts`, `mobile-menu.spec.ts`, `mobile-toc.spec.ts`, `view-count.spec.ts`

**`scripts/`:**
- Purpose: Standalone build/validation scripts
- Key files: `validate-colors.mjs` (WCAG contrast ratio checker for the palette)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout (fonts, header, footer, analytics, site-wide metadata)
- `src/app/page.tsx`: Home page (`/`)
- `src/app/blog/page.tsx`: Blog listing (`/blog`)
- `src/app/blog/[slug]/page.tsx`: Individual post (`/blog/{slug}`)
- `src/app/projects/page.tsx`: Projects listing (`/projects`)
- `src/app/projects/[slug]/page.tsx`: Individual project (`/projects/{slug}`)
- `src/app/about/page.tsx`: About page (`/about`)

**API Routes:**
- `src/app/api/views/route.ts`: Batch view count fetch
- `src/app/api/views/[slug]/route.ts`: Single view count fetch/increment

**Configuration:**
- `velite.config.ts`: Content collection schemas, rehype plugins, output config
- `tsconfig.json`: Path aliases (`@/*` -> `./src/*`, `@/.velite` -> `./.velite`), strict mode, ES2022
- `next.config.ts`: CSP header, security headers, image quality settings
- `postcss.config.mjs`: Tailwind v4 via `@tailwindcss/postcss`
- `eslint.config.mjs`: Flat config extending `next/core-web-vitals` and `next/typescript`
- `vitest.config.ts`: Vitest with jsdom, react plugin, tsconfig paths
- `playwright.config.ts`: Playwright E2E config
- `.env.local`: Environment variables (exists, not committed)

**Design System:**
- `src/app/globals.css`: All design tokens (`@theme` directive), keyframes, animation utilities, prose typography, code block styles, reduced-motion overrides
- `src/lib/fonts.ts`: Font declarations (Norse display via `localFont`, Inter body)
- `src/components/runes/rune-config.ts`: Rune-to-route mapping, aett color config, all 24 Elder Futhark runes

**Core Logic:**
- `src/components/blog/mdx-content.tsx`: Runtime MDX execution with fallback
- `src/components/layout/header.tsx`: Navigation with mobile menu, scroll lock, focus management, Escape key
- `src/components/hero.tsx`: Hero section with orchestrated reveal animation, rune glow overlays
- `src/hooks/use-filtered-list.ts`: Generic filter engine shared by blog and projects
- `src/lib/rune-glows.ts`: Rune glow position data + object-fit: cover math

**Testing:**
- `src/**/*.test.ts(x)`: Vitest unit tests (co-located with source files)
- `e2e/*.spec.ts`: Playwright E2E specs (separate directory)

## Naming Conventions

**Files:**
- `kebab-case.tsx` for components: `filtered-post-list.tsx`, `scroll-reveal.tsx`, `mobile-toc.tsx`
- `kebab-case.ts` for utilities/hooks: `use-filtered-list.ts`, `rate-limit.ts`, `rune-glows.ts`
- `page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, `loading.tsx` for Next.js conventions
- `*.test.ts(x)` for Vitest unit tests (co-located with source): `format.test.ts`, `copy-button.test.tsx`
- `*.spec.ts` for Playwright E2E tests: `mobile-menu.spec.ts`, `view-count.spec.ts`
- `kebab-case.mdx` for content: `humans-writing-code-is-over.mdx`

**Directories:**
- `kebab-case` throughout: `filter-bar`, `rune-config`
- Domain grouping in components: `blog/`, `projects/`, `layout/`, `runes/`, `ui/`
- `[slug]` for dynamic route segments (Next.js convention)

**Exports:**
- PascalCase for React components: `Hero`, `FilteredPostList`, `ScrollReveal`, `MobileToc`
- camelCase for hooks: `useFilteredList`, `useHeroAnimation`, `useGlowPositions`
- camelCase for utility functions: `formatDate`, `validateSlug`, `getCachedViews`, `computeGlowPositions`
- camelCase for instances: `redis`, `viewsRateLimit`
- UPPER_SNAKE_CASE for constant data: `RUNE_GLOWS`, `NAV_RUNES`, `POST_RUNES`, `ELDER_FUTHARK`
- PascalCase with `Props` suffix for component interfaces: `PostPageProps`, `FilteredPostListProps`

**Pages:**
- Default export functions: PascalCase matching route (e.g., `BlogPage`, `PostPage`, `Home`)
- Metadata: Named export `metadata` or async `generateMetadata()` per Next.js convention
- Static params: Named export `generateStaticParams()` per Next.js convention

## Where to Add New Code

**New Blog Post:**
- Create: `content/posts/{slug}.mdx`
- Frontmatter required: `title`, `slug`, `date`
- Frontmatter optional: `updated`, `description`, `tags`, `draft`
- Images: Place in `public/images/posts/` and reference via `/images/posts/{filename}` in MDX
- Auto-routed: `/blog/{slug}` via `generateStaticParams()` in `src/app/blog/[slug]/page.tsx`
- Rebuild: `npm run build` (or `npm run dev` with watch) regenerates `.velite/` collections

**New Project:**
- Create: `content/projects/{slug}.mdx`
- Frontmatter required: `title`, `slug`, `description`, `date`
- Frontmatter optional: `updated`, `featured`, `stack`, `github`, `demo`, `category`, `image`
- Images: Place in `public/images/projects/` and reference in frontmatter `image` field
- Auto-routed: `/projects/{slug}` via `generateStaticParams()`

**New Page Route:**
- Create: `src/app/{route-name}/page.tsx`
- For dynamic routes: `src/app/{route-name}/[param]/page.tsx` with `generateStaticParams()`
- Export default function component (PascalCase) and `metadata` or `generateMetadata()`
- Update `src/app/sitemap.ts` to include the new route
- Add navigation entry in `src/components/layout/header.tsx` (`navItems` array)
- Add rune mapping in `src/components/runes/rune-config.ts` (`NAV_RUNES`)

**New Component:**
- Determine domain: `blog/`, `projects/`, `layout/`, `ui/`, or `runes/`
- Create: `src/components/{domain}/{component-name}.tsx`
- If needs browser APIs or stateful hooks: add `'use client'` directive at top
- Export: Named PascalCase export (e.g., `export function MyComponent() { ... }`)
- For domain-agnostic UI primitives: use `src/components/ui/`
- For page-level standalone components: use `src/components/` root (like `hero.tsx`)
- Unit test: co-locate as `src/components/{domain}/{component-name}.test.tsx`

**New Hook:**
- Create: `src/hooks/use-{hook-name}.ts`
- Always `'use client'` (hooks require client context)
- Export: Named camelCase function (e.g., `export function useMyHook()`)
- Unit test: co-locate as `src/hooks/use-{hook-name}.test.ts`

**New Utility Function:**
- For general use: Add to existing module or create `src/lib/{module-name}.ts`
- Export: Named camelCase function
- Unit test: co-locate as `src/lib/{module-name}.test.ts`

**New API Route:**
- Create: `src/app/api/{resource}/route.ts`
- For dynamic segments: `src/app/api/{resource}/[param]/route.ts`
- Export named handler functions: `GET`, `POST`, etc.
- Add `export const dynamic = 'force-dynamic'` for uncacheable routes
- Validate all user input via `src/lib/validation.ts`
- For Redis access: `import { redis } from '@/lib/redis'`
- Add rate limiting if public-facing: create limiter in `src/lib/rate-limit.ts`

**New Design Token:**
- Add CSS custom property to the `@theme` block in `src/app/globals.css`
- Reference in Tailwind classes (e.g., `--color-newtoken` becomes `text-newtoken` or `bg-newtoken`)

**New Animation:**
- Define `@keyframes` in `src/app/globals.css`
- Add utility class in `@layer components` block
- Add reduced-motion override in the `@media (prefers-reduced-motion: reduce)` block
- Use `will-change` property for GPU-promoted animations

**New E2E Test:**
- Create: `e2e/{feature-name}.spec.ts`
- Run: `npm run test:e2e`

**New Content Collection:**
- Add MDX source directory: `content/{collection-name}/`
- Define schema in `velite.config.ts` `collections` object
- Import: `import { collection } from '@/.velite'`

## Special Directories

**`.velite/`:**
- Purpose: Build-time generated content collections (JSON + TypeScript types)
- Generated: Yes (by Velite prebuild step)
- Committed: No (gitignored)
- Contents: `posts.json`, `projects.json`, `index.js`, `index.d.ts`
- Regenerated on every build from `content/` MDX files

**`.next/`:**
- Purpose: Next.js build cache and compiled output
- Generated: Yes
- Committed: No (gitignored)

**`.vercel/`:**
- Purpose: Vercel deployment configuration and project metadata
- Generated: Yes (by Vercel CLI)
- Committed: No (gitignored)

**`.research/`:**
- Purpose: Working files for blog research subagents
- Generated: Yes (by Claude Code blog-writing skill)
- Committed: No (gitignored)

**`public/static/`:**
- Purpose: Velite-compiled static assets (processed content images with hashes)
- Generated: Yes (by Velite, `clean: true` wipes and regenerates each build)
- Committed: No (rebuilt each deploy)

**`.planning/`:**
- Purpose: GSD planning and analysis documents
- Generated: Partially (by GSD commands and Claude Code)
- Committed: Yes
- Subdirectories: `codebase/` (analysis), `milestones/` (v1.3-v1.5), `phases/` (09-13), `quick/` (task plans), `research/`

**`test-results/`:**
- Purpose: Playwright test artifacts
- Generated: Yes
- Committed: No (gitignored)

## Client vs Server Component Map

| Component | Type | Why Client |
|-----------|------|------------|
| `src/components/hero.tsx` | Client | useState, useEffect, useRef, ResizeObserver, image load |
| `src/components/layout/header.tsx` | Client | useState, usePathname, keyboard events, scroll lock, inert |
| `src/components/blog/mdx-content.tsx` | Client | `new Function()` execution at runtime |
| `src/components/blog/code-block.tsx` | Client | useRef for DOM access (code text extraction) |
| `src/components/blog/copy-button.tsx` | Client | useState, navigator.clipboard API |
| `src/components/blog/view-counter.tsx` | Client | useState, useEffect, useLayoutEffect, localStorage, fetch |
| `src/components/blog/listing-view-counts.tsx` | Client | createContext, useState, useEffect, useLayoutEffect, fetch |
| `src/components/blog/filtered-post-list.tsx` | Client | useSearchParams, useMemo, uses useFilteredList hook |
| `src/components/blog/post-card.tsx` | Client | Uses PostCardViewCount from context |
| `src/components/blog/mobile-toc.tsx` | Client | useState for collapsible toggle |
| `src/components/projects/filtered-project-list.tsx` | Client | useSearchParams, uses useFilteredList hook |
| `src/components/projects/project-card.tsx` | Client | Uses FilterChip with toggle behavior |
| `src/components/ui/filter-bar.tsx` | Server | Receives render prop, no browser APIs |
| `src/components/ui/filter-chip.tsx` | Client | onClick handlers, variant-based styling |
| `src/components/ui/scroll-reveal.tsx` | Client | useState, useEffect, IntersectionObserver, matchMedia |
| `src/components/layout/footer.tsx` | Server | Pure presentational |
| `src/components/blog/toc.tsx` | Server | Pure presentational (recursive list) |
| `src/components/runes/rune-config.ts` | Server | Data-only module (no component) |
| `src/components/runes/rune-divider.tsx` | Server | Pure presentational |

---

*Structure analysis: 2026-04-03*
