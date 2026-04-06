# Codebase Structure

**Analysis Date:** 2026-04-05

## Directory Layout

```
keech-dev/
├── content/                # Authored MDX content (source of truth)
│   ├── posts/              # Blog post MDX files
│   └── projects/           # Project MDX files
├── src/
│   ├── app/                # Next.js App Router pages, layouts, API routes
│   │   ├── about/          # /about page
│   │   ├── api/
│   │   │   └── views/      # View count API routes
│   │   │       └── [slug]/ # Single-post view increment endpoint
│   │   ├── blog/           # /blog listing and post pages
│   │   │   └── [slug]/     # Individual post page + error/loading/OG
│   │   ├── feed.xml/       # RSS feed route
│   │   ├── projects/       # /projects listing and project pages
│   │   │   └── [slug]/     # Individual project page
│   │   ├── globals.css     # Tailwind v4 @theme tokens + global styles
│   │   ├── layout.tsx      # Root layout (shell, fonts, header, footer, analytics)
│   │   ├── page.tsx        # Home page (renders Hero)
│   │   ├── sitemap.ts      # Dynamic XML sitemap
│   │   ├── robots.ts       # robots.txt
│   │   ├── opengraph-image.tsx  # Root OG image
│   │   ├── error.tsx       # Route error boundary
│   │   ├── global-error.tsx     # Root error boundary
│   │   ├── not-found.tsx   # 404 page
│   │   └── loading.tsx     # Root loading skeleton
│   ├── components/
│   │   ├── blog/           # Blog-specific components
│   │   ├── icons/          # SVG icon components (brand icons)
│   │   ├── layout/         # Header, Footer
│   │   ├── projects/       # Project-specific components
│   │   ├── runes/          # Rune config and UI components
│   │   ├── ui/             # Generic reusable UI (FilterBar, FilterChip, ScrollReveal)
│   │   └── hero.tsx        # Homepage hero (not in layout/ — page-specific)
│   ├── hooks/              # Custom React hooks (client-only logic)
│   ├── lib/                # Shared utilities, data access, config
│   └── assets/             # Static assets referenced by source (fonts TTF for OG image)
│       └── fonts/
├── public/                 # Statically served files
│   ├── fonts/              # WOFF2 font files (Norse-Regular, Norse-Bold)
│   ├── images/             # Static images for posts and projects
│   │   ├── posts/
│   │   └── projects/
│   └── static/             # Velite-processed assets (generated, not committed)
├── e2e/                    # Playwright end-to-end tests
├── scripts/                # Build/dev utility scripts
├── .velite/                # Generated Velite output (gitignored)
├── .planning/              # GSD planning documents (not shipped)
├── velite.config.ts        # Content pipeline config (collections, schemas, plugins)
├── next.config.ts          # Next.js config (image quality settings)
├── tsconfig.json           # TypeScript config with path aliases
├── eslint.config.mjs       # ESLint flat config
├── vitest.config.ts        # Vitest unit test config
├── playwright.config.ts    # Playwright e2e config
├── postcss.config.mjs      # PostCSS config (for Tailwind v4)
└── src/proxy.ts            # Next.js middleware (security headers)
```

## Directory Purposes

**`content/posts/`:**
- Purpose: Blog post authoring in MDX format
- Contains: One `.mdx` file per post; frontmatter defines `title`, `slug`, `date`, optional `updated`, `description`, `tags`, `draft`
- Key files: Any `*.mdx` file here becomes a published post (unless `draft: true`)

**`content/projects/`:**
- Purpose: Project descriptions in MDX format
- Contains: One `.mdx` file per project; frontmatter defines `title`, `slug`, `description`, `date`, optional `featured`, `stack`, `github`, `demo`, `category`, `image`

**`src/app/`:**
- Purpose: Next.js App Router file-system routing
- Contains: `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx` per segment; API routes as `route.ts`
- Pattern: Pages import from `@/.velite` directly — no abstraction layer between pages and Velite data

**`src/components/blog/`:**
- Purpose: Components exclusive to blog functionality
- Key files:
  - `mdx-content.tsx` — renders compiled HTML + attaches copy buttons
  - `code-block-enhancer.tsx` — DOM-based copy button injection after mount
  - `filtered-post-list.tsx` — client wrapper for filter UI + post grid
  - `listing-view-counts.tsx` — React context provider for batch view counts + `PostCardViewCount`
  - `view-counter.tsx` — single-post view increment on mount
  - `post-card.tsx` — individual post card in listing
  - `toc.tsx` — desktop sidebar table of contents (server component)
  - `mobile-toc.tsx` — collapsible mobile table of contents

**`src/components/layout/`:**
- Purpose: Persistent shell components
- Key files: `header.tsx` (client — mobile menu, scroll lock, rune nav), `footer.tsx`

**`src/components/runes/`:**
- Purpose: Elder Futhark rune brand system
- Key files: `rune-config.ts` (server-safe data module), `rune-divider.tsx` (UI component)

**`src/components/ui/`:**
- Purpose: Generic reusable UI primitives
- Key files: `filter-bar.tsx`, `filter-chip.tsx`, `scroll-reveal.tsx`

**`src/hooks/`:**
- Purpose: Custom hooks isolating client-side browser logic from components
- Key files:
  - `use-filtered-list.ts` — URL-driven filter state (generic, used by both blog and projects)
  - `use-hero-animation.ts` — hero reveal sequence orchestration
  - `use-glow-positions.ts` — rune glow position computation with ResizeObserver
  - `use-media-query.ts` — SSR-safe `window.matchMedia` subscription
  - `use-view-store.ts` — `localStorage` view count read via `useSyncExternalStore`

**`src/lib/`:**
- Purpose: Shared utilities and infrastructure — importable by both server and client code
- Key files:
  - `utils.ts` — `cn()` class merging utility
  - `format.ts` — `formatDate()` UTC-normalized date formatter
  - `fonts.ts` — Next.js font config (Norse WOFF2, Inter Google Font)
  - `redis.ts` — Upstash Redis client singleton (`Redis.fromEnv()`)
  - `rate-limit.ts` — Upstash rate limiter (sliding window 10/60s on view POST)
  - `validation.ts` — slug format regex + batch size enforcement
  - `views.ts` — `localStorage` view count cache read/write + `formatViewCount()`
  - `rune-glows.ts` — rune glow position data + `computeGlowPositions()` function

**`e2e/`:**
- Purpose: Playwright end-to-end test specs
- Key files: `code-copy.spec.ts`, `mobile-menu.spec.ts`, `mobile-toc.spec.ts`, `view-count.spec.ts`

**`scripts/`:**
- Purpose: Development utility scripts
- Key files: `validate-colors.mjs` — CSS color token validation

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — Root HTML layout, applied to all routes
- `src/proxy.ts` — Next.js middleware; security headers on all non-static routes
- `velite.config.ts` — Content pipeline; must run before `next build`

**Configuration:**
- `tsconfig.json` — TypeScript + path aliases (`@/*`, `@/.velite`)
- `eslint.config.mjs` — ESLint flat config
- `vitest.config.ts` — Unit test runner config
- `playwright.config.ts` — E2E test config
- `src/app/globals.css` — Tailwind v4 `@theme` design tokens (colors, shadows, fonts)
- `next.config.ts` — Next.js config (minimal; image quality only)

**Core Logic:**
- `src/lib/redis.ts` — All Redis access goes through this singleton
- `src/lib/validation.ts` — All slug validation at API boundaries
- `src/lib/rate-limit.ts` — Rate limiter for view count POST
- `src/components/blog/mdx-content.tsx` — MDX rendering pipeline entry point
- `src/components/blog/listing-view-counts.tsx` — View count context + batch fetch
- `src/hooks/use-filtered-list.ts` — Shared filter logic for blog and projects

**Testing:**
- Unit tests: Co-located alongside source as `*.test.ts(x)` (e.g., `src/lib/format.test.ts`)
- E2E tests: `e2e/*.spec.ts`

## Naming Conventions

**Files:**
- All source files: `kebab-case.tsx` / `kebab-case.ts`
- Components: `kebab-case.tsx` — the named export uses PascalCase (e.g., `filtered-post-list.tsx` exports `FilteredPostList`)
- Hooks: `use-[name].ts` (e.g., `use-filtered-list.ts`)
- Test files: `[name].test.ts(x)` co-located with source
- E2E specs: `[feature].spec.ts` in `e2e/`
- API routes: `route.ts` (Next.js convention)
- Next.js special files: `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`

**Directories:**
- `kebab-case` throughout
- Component subdirectories named by domain: `blog/`, `projects/`, `layout/`, `ui/`, `runes/`, `icons/`

## Where to Add New Code

**New blog-specific component:**
- Implementation: `src/components/blog/[component-name].tsx`
- Test: `src/components/blog/[component-name].test.tsx`

**New project-specific component:**
- Implementation: `src/components/projects/[component-name].tsx`

**New generic UI primitive:**
- Implementation: `src/components/ui/[component-name].tsx`
- Test: `src/components/ui/[component-name].test.tsx`

**New page/route:**
- Implementation: `src/app/[route]/page.tsx`
- Add to sitemap: `src/app/sitemap.ts`

**New API route:**
- Implementation: `src/app/api/[route]/route.ts`
- Add slug validation: use `validateSlug()` from `src/lib/validation.ts`

**New custom hook:**
- Implementation: `src/hooks/use-[name].ts`
- Test: `src/hooks/use-[name].test.ts`

**New shared utility:**
- Implementation: `src/lib/[name].ts`
- Test: `src/lib/[name].test.ts`

**New blog post:**
- MDX file: `content/posts/[slug].mdx` (frontmatter: `title`, `slug`, `date` required)
- Hero image: `public/images/posts/[slug]/` (recommended subdirectory)

**New project:**
- MDX file: `content/projects/[slug].mdx` (frontmatter: `title`, `slug`, `description`, `date` required)

## Special Directories

**`.velite/`:**
- Purpose: Velite-compiled output — JSON collections and index files
- Generated: Yes (by `npm run velite` or `npm run build`)
- Committed: No (gitignored)
- Import: `import { posts, projects } from '@/.velite'`

**`public/static/`:**
- Purpose: Velite-processed media assets (images with content hashes)
- Generated: Yes
- Committed: No (gitignored)

**`.planning/`:**
- Purpose: GSD milestone planning, phase documents, codebase maps
- Generated: No (human + AI authored)
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and dev cache
- Generated: Yes
- Committed: No (gitignored)

---

*Structure analysis: 2026-04-05*
