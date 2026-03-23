# Codebase Structure

**Analysis Date:** 2026-03-22

## Directory Layout

```
keech-dev/
├── .claude/                        # Claude Code configuration
│   └── skills/                     # Claude Code skills
│       └── write-blog-post/        # Blog writing skill (SKILL.md + instructions)
├── content/                        # MDX content source files
│   ├── posts/                      # Blog post MDX files
│   └── projects/                   # Project showcase MDX files
├── .devcontainer/                  # Dev container configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── devcontainer.json
├── .planning/                      # GSD planning documents
│   ├── codebase/                   # Codebase analysis (this file lives here)
│   ├── milestones/                 # Versioned milestone plans
│   │   ├── v1.3-phases/
│   │   ├── v1.4-phases/
│   │   └── v1.5-phases/
│   ├── quick/                      # Quick task plans
│   └── research/                   # Research documents
├── public/                         # Static assets served by Next.js
│   ├── fonts/                      # Custom WOFF2 font files
│   ├── images/                     # Static images
│   │   ├── posts/                  # Blog post images
│   │   ├── projects/               # Project images
│   │   ├── headshot.webp           # About page photo
│   │   └── hero.webp               # Home page hero image
│   └── static/                     # Velite-compiled static assets
├── .research/                      # Blog research working files (gitignored)
├── scripts/                        # Standalone utility scripts
│   └── validate-colors.mjs         # WCAG contrast ratio checker
├── src/                            # Application source code
│   ├── app/                        # Next.js App Router (routes)
│   │   ├── about/                  # /about route
│   │   │   └── page.tsx
│   │   ├── api/                    # API routes (serverless functions)
│   │   │   └── views/              # View count API
│   │   │       ├── route.ts        # GET /api/views?slugs=... (batch)
│   │   │       └── [slug]/
│   │   │           └── route.ts    # GET/POST /api/views/{slug} (single)
│   │   ├── blog/                   # /blog route
│   │   │   ├── [slug]/             # /blog/{slug} dynamic route
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx            # Blog listing
│   │   ├── projects/               # /projects route
│   │   │   ├── [slug]/             # /projects/{slug} dynamic route
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx            # Projects listing
│   │   ├── globals.css             # Tailwind v4 config, design tokens, animations
│   │   ├── layout.tsx              # Root layout (Header, Footer, fonts, Analytics)
│   │   ├── not-found.tsx           # 404 page
│   │   ├── page.tsx                # Home page (Hero component)
│   │   ├── robots.ts               # /robots.txt generation
│   │   └── sitemap.ts              # /sitemap.xml generation
│   ├── components/                 # Reusable React components
│   │   ├── blog/                   # Blog-specific components
│   │   │   ├── code-block.tsx      # Code block wrapper with copy button
│   │   │   ├── copy-button.tsx     # Clipboard copy button for code blocks
│   │   │   ├── filtered-post-list.tsx  # Blog listing with tag filtering
│   │   │   ├── listing-view-counts.tsx # View count context provider + display
│   │   │   ├── mdx-content.tsx     # Runtime MDX executor (new Function)
│   │   │   ├── post-card.tsx       # Blog post preview card
│   │   │   ├── tag-chip.tsx        # Tag display/toggle chip
│   │   │   ├── toc.tsx             # Table of contents sidebar
│   │   │   └── view-counter.tsx    # Single post view counter
│   │   ├── layout/                 # Site-wide layout components
│   │   │   ├── footer.tsx          # Footer with social links
│   │   │   └── header.tsx          # Navigation, mobile menu, scroll lock
│   │   ├── projects/               # Project-specific components
│   │   │   ├── filtered-project-list.tsx  # Project listing with stack filtering
│   │   │   ├── project-card.tsx    # Project preview card
│   │   │   └── tech-badge.tsx      # Technology badge display/toggle
│   │   ├── runes/                  # Elder Futhark rune system
│   │   │   ├── rune-config.ts      # All 24 runes + context mappings
│   │   │   └── rune-divider.tsx    # Horizontal divider with rune
│   │   ├── ui/                     # Generic UI primitives
│   │   │   ├── filter-bar.tsx      # Domain-agnostic filter chip bar
│   │   │   └── scroll-reveal.tsx   # IntersectionObserver scroll animation
│   │   └── hero.tsx                # Home page hero (image, animations, rune glows)
│   └── lib/                        # Shared utilities and configuration
│       ├── fonts.ts                # Font loaders (Norse custom, Inter Google)
│       ├── redis.ts                # Upstash Redis client initialization
│       ├── rune-glows.ts           # Rune glow positions + object-fit math
│       ├── utils.ts                # cn() utility (clsx + tailwind-merge)
│       └── views.ts                # formatViewCount() helper
├── .velite/                        # Generated content collections (gitignored)
│   ├── index.d.ts                  # TypeScript type definitions
│   ├── index.js                    # Re-exports JSON collections
│   ├── posts.json                  # Compiled blog post data
│   └── projects.json               # Compiled project data
├── .vercel/                        # Vercel deployment config (gitignored)
├── .vscode/                        # VS Code workspace settings
│   └── tasks.json                  # VS Code task definitions
├── CLAUDE.md                       # Project context for Claude Code
├── README.md                       # Project documentation
├── eslint.config.mjs               # ESLint flat config (next/core-web-vitals + typescript)
├── next.config.ts                  # Next.js config (image quality only)
├── next-env.d.ts                   # Next.js TypeScript environment (generated)
├── package.json                    # Dependencies and npm scripts
├── package-lock.json               # Dependency lock file
├── postcss.config.mjs              # PostCSS config (Tailwind v4 plugin)
├── tsconfig.json                   # TypeScript config (paths, strict mode)
└── velite.config.ts                # Velite content schema definitions
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router; each subdirectory maps to a URL route
- Contains: Page components (`page.tsx`), route layouts, API routes, SEO files
- Key files: `layout.tsx` (root wrapper with Header/Footer), `globals.css` (entire design system), `page.tsx` (home)
- Convention: File/folder structure directly maps to URL routes (`blog/[slug]/page.tsx` -> `/blog/:slug`)

**`src/components/`:**
- Purpose: Reusable React components organized by feature domain
- Contains: Server and client components (client components marked with `'use client'`)
- Organization: Subdirectories group by domain (`blog/`, `projects/`, `layout/`, `runes/`, `ui/`)
- The `hero.tsx` file sits at the `components/` root because it is a page-level component not belonging to a subdomain

**`src/components/blog/`:**
- Purpose: All blog-related components
- Contains: Post rendering (MDXContent, CodeBlock, CopyButton), listing (FilteredPostList, PostCard, TagChip), view tracking (ViewCounter, ListingViewCounts), navigation (TableOfContents)
- 9 files, most are client components

**`src/components/projects/`:**
- Purpose: All project-related components
- Contains: Listing (FilteredProjectList, ProjectCard), display (TechBadge)
- 3 files; mirrors blog structure but simpler (no view counts, no TOC)

**`src/components/layout/`:**
- Purpose: Site-wide structural components used in root layout
- Contains: `header.tsx` (navigation, mobile menu, scroll lock, focus management), `footer.tsx` (social links)
- Header is a client component; Footer is a server component

**`src/components/runes/`:**
- Purpose: Elder Futhark rune data and rune-themed UI elements
- Contains: `rune-config.ts` (data, all 24 runes + context mappings), `rune-divider.tsx` (section divider component)
- `rune-config.ts` is server-safe (no `'use client'`), imported across both server and client components

**`src/components/ui/`:**
- Purpose: Generic, domain-agnostic UI primitives
- Contains: `filter-bar.tsx` (render-prop filter chip container), `scroll-reveal.tsx` (IntersectionObserver wrapper)

**`src/lib/`:**
- Purpose: Shared utilities, configuration, and service clients
- Contains: Font loaders, Redis client, class-name utility, view formatting, rune glow positioning math
- 5 files; all are plain TypeScript modules (no React components)

**`content/`:**
- Purpose: MDX source files for all site content
- Contains: Blog posts (`posts/*.mdx`) and projects (`projects/*.mdx`)
- Current content: 5 blog posts, 2 projects
- Slugs auto-derived from filename; frontmatter defines metadata

**`public/`:**
- Purpose: Static assets served directly by Next.js at the root URL path
- Contains: Custom fonts (`fonts/`), images (`images/`), Velite-compiled assets (`static/`)
- `images/posts/` -- blog post images referenced from MDX
- `images/projects/` -- project screenshot images
- `static/` -- Velite output for processed content images (gitignored, regenerated on build)

**`scripts/`:**
- Purpose: Standalone utility scripts not part of the build pipeline
- Contains: `validate-colors.mjs` -- computes WCAG contrast ratios for the color palette
- Run manually: `node scripts/validate-colors.mjs`

**`.claude/skills/write-blog-post/`:**
- Purpose: Claude Code skill for end-to-end blog post creation
- Contains: `SKILL.md` (orchestration instructions), `writing-guide.md` (style guide), `research-instructions.md`, `writer-instructions.md`, `image-prompt-instructions.md`, `example-post.mdx`
- Used by Claude Code when spawning blog-writing subagents

**`.devcontainer/`:**
- Purpose: Dev container configuration for consistent development environments
- Contains: `Dockerfile`, `docker-compose.yml`, `devcontainer.json`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout (Header, Footer, fonts, Vercel Analytics)
- `src/app/page.tsx`: Home page (`/`)
- `src/app/blog/page.tsx`: Blog listing (`/blog`)
- `src/app/blog/[slug]/page.tsx`: Individual blog post (`/blog/{slug}`)
- `src/app/projects/page.tsx`: Projects listing (`/projects`)
- `src/app/projects/[slug]/page.tsx`: Individual project (`/projects/{slug}`)
- `src/app/about/page.tsx`: About page (`/about`)
- `src/app/not-found.tsx`: 404 fallback page

**API Routes:**
- `src/app/api/views/route.ts`: Batch view count fetch (`GET /api/views?slugs=...`)
- `src/app/api/views/[slug]/route.ts`: Single view count fetch/increment (`GET/POST /api/views/{slug}`)

**Configuration:**
- `velite.config.ts`: Content collection schemas (Post and Project), rehype plugins, output config
- `tsconfig.json`: Path aliases (`@/*` -> `./src/*`, `@/.velite` -> `./.velite`), strict mode, ES2022 target
- `next.config.ts`: Minimal config (image quality settings only)
- `postcss.config.mjs`: Tailwind v4 via `@tailwindcss/postcss`
- `eslint.config.mjs`: Flat config extending `next/core-web-vitals` and `next/typescript`
- `src/app/globals.css`: Design system (Tailwind `@theme` tokens, keyframes, prose styles, code block styles, animation utilities, reduced-motion overrides)

**Core Logic:**
- `src/components/blog/mdx-content.tsx`: Runtime MDX execution via `new Function()`
- `src/components/layout/header.tsx`: Navigation with mobile menu, scroll lock, focus management, keyboard handling
- `src/components/hero.tsx`: Hero section with orchestrated reveal animation, rune glow overlays, ResizeObserver
- `src/components/runes/rune-config.ts`: All 24 Elder Futhark runes + semantic context mappings
- `src/lib/rune-glows.ts`: Rune glow position data + `computeGlowPositions()` for object-fit: cover math
- `src/lib/redis.ts`: Upstash Redis client (`Redis.fromEnv()`)

**Content Pipeline:**
- `velite.config.ts`: Schema definitions, rehype plugin chain, output directory config
- `content/posts/*.mdx`: Blog post source files (5 posts)
- `content/projects/*.mdx`: Project source files (2 projects)
- `.velite/index.js`: Generated re-export of JSON collections
- `.velite/index.d.ts`: Generated TypeScript types derived from velite.config.ts schemas

## Naming Conventions

**Files:**
- Components: kebab-case `.tsx` (e.g., `post-card.tsx`, `mdx-content.tsx`, `scroll-reveal.tsx`)
- Config/data modules: kebab-case `.ts` (e.g., `rune-config.ts`, `rune-glows.ts`)
- Utilities: kebab-case `.ts` (e.g., `utils.ts`, `fonts.ts`, `views.ts`)
- Content: kebab-case `.mdx` (e.g., `humans-writing-code-is-over.mdx`, `keech-dev.mdx`)
- Images: kebab-case `.webp` (e.g., `hero.webp`, `headshot.webp`, `agent-driven-workflow.webp`)
- Root config: standard names (`package.json`, `tsconfig.json`, `velite.config.ts`, `eslint.config.mjs`)

**Directories:**
- Feature domains: kebab-case plurals (e.g., `components/`, `projects/`, `posts/`)
- Organizational: lowercase singular (e.g., `layout/`, `blog/`, `ui/`, `lib/`)
- Dynamic routes: Square brackets per Next.js convention (e.g., `[slug]/`)
- Hidden dirs: dot-prefixed (e.g., `.velite/`, `.planning/`, `.claude/`)

**Exports:**
- Components: Named PascalCase exports (e.g., `export function PostCard`, `export function Hero`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `ELDER_FUTHARK`, `NAV_RUNES`, `RUNE_GLOWS`, `POST_RUNES`)
- Interfaces: PascalCase with `Props` suffix for component props (e.g., `PostCardProps`, `FilterBarProps`)
- Types: PascalCase (e.g., `Rune`, `RuneGlow`)
- Utility functions: camelCase (e.g., `cn()`, `formatViewCount()`, `computeGlowPositions()`)

**Pages:**
- Default export functions: PascalCase matching route (e.g., `export default function BlogPage`, `export default function PostPage`)
- Metadata: Named export `metadata` or `generateMetadata()` per Next.js convention
- Static params: Named export `generateStaticParams()` per Next.js convention

## Where to Add New Code

**New Blog Post:**
- Create: `content/posts/{slug}.mdx`
- Frontmatter required: `title`, `slug`, `date`
- Frontmatter optional: `updated`, `description`, `tags`, `draft`
- Images: Place in `public/images/posts/` and reference via `/images/posts/{filename}` in MDX
- Auto-routed: `/blog/{slug}` via `generateStaticParams()` in `src/app/blog/[slug]/page.tsx`
- Rebuild: `npm run build` regenerates `.velite/` collections

**New Project:**
- Create: `content/projects/{slug}.mdx`
- Frontmatter required: `title`, `slug`, `description`, `date`
- Frontmatter optional: `updated`, `featured`, `stack`, `github`, `demo`, `category`, `image`
- Images: Place in `public/images/projects/` and reference in frontmatter `image` field
- Auto-routed: `/projects/{slug}` via `generateStaticParams()` in `src/app/projects/[slug]/page.tsx`

**New Page/Route:**
- Create: `src/app/{route-name}/page.tsx`
- For dynamic routes: `src/app/{route-name}/[param]/page.tsx`
- Export default function component (PascalCase) and `metadata` or `generateMetadata()`
- For static content routes: add `generateStaticParams()` if dynamic
- Update `src/app/sitemap.ts` to include the new route
- Consider adding navigation entry in `src/components/layout/header.tsx` (`navItems` array) and a rune mapping in `src/components/runes/rune-config.ts` (`NAV_RUNES`)

**New Component:**
- Determine domain: `blog/`, `projects/`, `layout/`, `ui/`, or `runes/`
- Create: `src/components/{domain}/{component-name}.tsx`
- If needs browser APIs or React hooks with state: add `'use client'` directive at top
- Export: Named export (e.g., `export function MyComponent() { ... }`)
- Import: `import { MyComponent } from '@/components/{domain}/{component-name}'`
- For domain-agnostic/primitive components: use `src/components/ui/`
- For page-level standalone components: use `src/components/` root (like `hero.tsx`)

**New Utility Function:**
- For general use: Add to `src/lib/utils.ts`
- For domain-specific: Create `src/lib/{domain}.ts` (e.g., `src/lib/views.ts` for view formatting)
- Export: Named export (e.g., `export function myHelper() { ... }`)
- Import: `import { myHelper } from '@/lib/{module}'`

**New API Route:**
- Create: `src/app/api/{resource}/route.ts`
- For dynamic segments: `src/app/api/{resource}/[param]/route.ts`
- Export named handler functions: `GET`, `POST`, etc.
- Add `export const dynamic = 'force-dynamic'` if the route must not be cached
- For Redis access: import `redis` from `@/lib/redis`

**New Design Tokens:**
- Add CSS custom properties to the `@theme` block in `src/app/globals.css`
- Reference in Tailwind classes (e.g., `--color-newtoken` becomes `text-newtoken` or `bg-newtoken`)

**New Animation:**
- Define `@keyframes` in `src/app/globals.css`
- Add utility class in `@layer components` block
- Add reduced-motion override in the `@media (prefers-reduced-motion: reduce)` block
- Use `will-change` property for GPU-promoted animations

**New Rune Mapping:**
- Add context map in `src/components/runes/rune-config.ts` referencing runes from `ELDER_FUTHARK`
- Follow existing pattern: `export const NEW_RUNES = { purpose: ELDER_FUTHARK.runeName } as const`

## Special Directories

**`.velite/`:**
- Purpose: Build-time generated content collections (JSON + TypeScript types)
- Generated: Yes (by Velite prebuild step)
- Committed: No (gitignored)
- Contents: `posts.json`, `projects.json`, `index.js`, `index.d.ts`
- Regenerated on every `npm run build` or `npm run dev` from `content/` MDX files

**`.next/`:**
- Purpose: Next.js build cache and compiled output
- Generated: Yes (by Next.js)
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
- Purpose: Velite-compiled static assets (processed content images)
- Generated: Yes (by Velite, output config in `velite.config.ts`: `assets: 'public/static'`)
- Committed: Not explicitly gitignored, but `clean: true` in config wipes and regenerates each build

**`.planning/`:**
- Purpose: GSD planning and analysis documents
- Generated: Yes (by GSD tools and Claude Code)
- Committed: Yes (provides project context)
- Subdirectories: `codebase/` (analysis), `milestones/` (versioned plans), `quick/` (task plans), `research/`

**`.claude/skills/`:**
- Purpose: Claude Code skill definitions for repeatable tasks
- Generated: No (manually authored)
- Committed: Yes
- Contains: `write-blog-post/` skill with orchestration, research, writing, and image prompt instructions

## Client vs Server Component Map

| Component | Directive | Why Client |
|-----------|-----------|------------|
| `src/components/hero.tsx` | `'use client'` | useState, useEffect, useRef, ResizeObserver, image load events |
| `src/components/layout/header.tsx` | `'use client'` | useState, usePathname, keyboard events, scroll lock, inert |
| `src/components/blog/mdx-content.tsx` | `'use client'` | `new Function()` execution at runtime |
| `src/components/blog/code-block.tsx` | `'use client'` | useRef for DOM access (code text extraction) |
| `src/components/blog/copy-button.tsx` | `'use client'` | useState, navigator.clipboard API |
| `src/components/blog/view-counter.tsx` | `'use client'` | useState, useEffect, useLayoutEffect, localStorage, fetch |
| `src/components/blog/listing-view-counts.tsx` | `'use client'` | createContext, useState, useEffect, useLayoutEffect, localStorage, fetch |
| `src/components/blog/filtered-post-list.tsx` | `'use client'` | useSearchParams, useState, useCallback, history.replaceState |
| `src/components/projects/filtered-project-list.tsx` | `'use client'` | useSearchParams, useState, useCallback, history.replaceState |
| `src/components/ui/filter-bar.tsx` | `'use client'` | Receives callback props from client parents |
| `src/components/ui/scroll-reveal.tsx` | `'use client'` | useState, useEffect, useRef, IntersectionObserver, matchMedia |
| `src/components/layout/footer.tsx` | Server | No browser APIs needed |
| `src/components/blog/post-card.tsx` | Server | Pure presentational |
| `src/components/blog/tag-chip.tsx` | Server | Pure presentational (toggle mode works via props from client parent) |
| `src/components/blog/toc.tsx` | Server | Pure presentational |
| `src/components/projects/project-card.tsx` | Server | Pure presentational |
| `src/components/projects/tech-badge.tsx` | Server | Pure presentational |
| `src/components/runes/rune-config.ts` | Server | Data-only module |
| `src/components/runes/rune-divider.tsx` | Server | Pure presentational |

---

*Structure analysis: 2026-03-22*
