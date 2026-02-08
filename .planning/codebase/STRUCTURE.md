# Codebase Structure

**Analysis Date:** 2026-02-08

## Directory Layout

```
keech-dev/
├── .git/                       # Git repository
├── .planning/                  # GSD planning documents (this directory)
│   └── codebase/              # Generated codebase analysis
├── .gitignore                 # Git ignore rules
├── CLAUDE.md                  # Project context for Claude Code
├── README.md                  # Project documentation
├── content/                   # MDX content source files
│   ├── posts/                 # Blog post MDX files
│   │   └── hello-world.mdx
│   └── projects/              # Project showcase MDX files
│       └── keech-dev.mdx
├── public/                    # Static assets (images, fonts)
│   ├── fonts/                 # Custom WOFF2 font files
│   │   ├── Norse-Regular.woff2
│   │   └── Norse-Bold.woff2
│   ├── images/                # Static images
│   │   └── hero.webp
│   └── static/                # Compiled static assets from Velite
├── src/                       # Source code
│   ├── app/                   # Next.js App Router (route definitions)
│   │   ├── about/             # About page route
│   │   │   └── page.tsx
│   │   ├── blog/              # Blog index and posts
│   │   │   ├── [slug]/        # Dynamic post route
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx       # Blog index
│   │   ├── projects/          # Projects index and details
│   │   │   ├── [slug]/        # Dynamic project route
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx       # Projects index
│   │   ├── not-found.tsx      # 404 fallback
│   │   ├── robots.ts          # Robots.txt generation
│   │   ├── sitemap.ts         # Sitemap generation
│   │   ├── globals.css        # Global styles (Tailwind + design tokens)
│   │   ├── layout.tsx         # Root layout wrapper
│   │   └── page.tsx           # Home page (/)
│   ├── components/            # Reusable React components
│   │   ├── layout/            # Layout components
│   │   │   ├── footer.tsx
│   │   │   └── header.tsx     # Navigation + mobile menu
│   │   ├── blog/              # Blog-specific components
│   │   │   ├── code-block.tsx # Code block wrapper with copy button
│   │   │   ├── copy-button.tsx
│   │   │   ├── mdx-content.tsx # MDX runtime executor
│   │   │   ├── post-card.tsx  # Blog post preview card
│   │   │   ├── tag-chip.tsx   # Tag display component
│   │   │   └── toc.tsx        # Table of contents sidebar
│   │   ├── projects/          # Project showcase components
│   │   │   ├── project-card.tsx
│   │   │   └── tech-badge.tsx
│   │   ├── runes/             # Elder Futhark rune components
│   │   │   ├── rune-config.ts # All 24 runes + semantic mappings
│   │   │   └── rune-divider.tsx
│   │   ├── ui/                # Primitive UI components
│   │   │   └── scroll-reveal.tsx # IntersectionObserver animation
│   │   └── hero.tsx           # Hero section (home page)
│   └── lib/                   # Utilities and configuration
│       ├── fonts.ts           # Font loader (Norse, Inter)
│       └── utils.ts           # Utility functions (cn() for className)
├── .planning/codebase/        # Generated analysis documents
├── eslint.config.mjs          # ESLint configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
├── package-lock.json         # Dependency lock file
├── postcss.config.mjs        # PostCSS configuration (Tailwind)
├── tsconfig.json             # TypeScript configuration
└── velite.config.ts          # Content compilation configuration

[Generated at build time]
├── .velite/                   # Compiled content collections
│   └── index.ts              # Exports `posts` and `projects` arrays
├── .next/                     # Next.js build output
└── out/                       # Static export output (if using `next export`)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router directory; defines all routes and layouts
- Contains: Page components, route handlers, layouts, metadata
- Key files: `layout.tsx` (root wrapper), `page.tsx` (home), `globals.css` (design system)
- Pattern: File/folder structure directly maps to URL routes (`blog/[slug]/page.tsx` → `/blog/:slug`)

**`src/components/`:**
- Purpose: Reusable React component library
- Contains: Presentational components organized by feature domain
- Key files: `Header` (navigation), `MDXContent` (blog rendering), `PostCard`/`ProjectCard` (preview cards)
- Organization: Subdirectories by feature (layout, blog, projects, ui, runes) for discoverability

**`src/lib/`:**
- Purpose: Utilities, configuration, helpers
- Contains: Font loaders, utility functions, shared constants
- Key files: `fonts.ts` (custom and Google fonts), `utils.ts` (cn() helper)

**`content/`:**
- Purpose: Markdown source files for blog posts and projects
- Contains: MDX files with frontmatter (YAML) and markdown/JSX body
- Key files: `posts/*.mdx`, `projects/*.mdx`
- Pattern: Slugs auto-derived from filename; frontmatter defines metadata (title, date, tags, etc.)

**`public/`:**
- Purpose: Static assets served directly by Next.js
- Contains: Images, custom fonts, compiled assets from Velite
- Key files: `fonts/` (Norse WOFF2), `images/` (hero.webp), `static/` (Velite output)

**`.planning/codebase/`:**
- Purpose: GSD analysis and planning documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md (generated)
- Generated by: GSD mapper tools; consumed by planner/executor

**`.velite/`:**
- Purpose: Build-time generated content collections
- Contains: Type-safe collections of posts and projects with extracted metadata
- Generated by: `velite` build step (runs before Next.js build)
- Committed: No (git-ignored); regenerated on each build

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - Home page (/)
- `src/app/layout.tsx` - Root layout (all routes)
- `src/app/blog/page.tsx` - Blog index
- `src/app/blog/[slug]/page.tsx` - Individual blog post
- `src/app/projects/page.tsx` - Projects showcase
- `src/app/projects/[slug]/page.tsx` - Individual project detail
- `src/app/about/page.tsx` - About page

**Configuration:**
- `tsconfig.json` - TypeScript paths: `@/*` → `./src/*`, `@/.velite` → `./.velite`
- `next.config.ts` - Next.js image quality configuration
- `velite.config.ts` - Content schema definitions, rehype plugins, output paths
- `src/app/globals.css` - Tailwind v4 configuration, design tokens (@theme), animations

**Core Logic:**
- `src/components/blog/mdx-content.tsx` - Executes compiled MDX body strings
- `src/components/layout/header.tsx` - Navigation with mobile menu, scroll lock, focus management
- `src/components/runes/rune-config.ts` - All 24 Elder Futhark runes + semantic mappings
- `src/lib/fonts.ts` - Font loaders (Norse custom, Inter Google font)

**Content Pipeline:**
- `velite.config.ts` - Defines post/project schemas, rehype plugins (slug, pretty-code), metadata extraction
- `content/posts/*.mdx` - Blog post source files
- `content/projects/*.mdx` - Project showcase source files
- `.velite/index.ts` - Generated: exported `posts` and `projects` collections (type-safe)

**Testing:**
- No test framework configured; no test files present

## Naming Conventions

**Files:**
- **Components:** PascalCase (e.g., `Header.tsx`, `PostCard.tsx`, `MDXContent.tsx`)
- **Utilities:** camelCase (e.g., `fonts.ts`, `utils.ts`, `rune-config.ts`)
- **Content:** kebab-case (e.g., `hello-world.mdx`, `keech-dev.mdx`)
- **Styles:** kebab-case (e.g., `globals.css`, `tailwind.css`)

**Directories:**
- **Feature domains:** kebab-case plurals (e.g., `components/`, `projects/`, `routes/`) or descriptive (e.g., `layout/`, `blog/`, `ui/`)
- **Dynamic routes:** Square brackets (e.g., `[slug]/`, `[id]/`) per Next.js convention
- **Internal dirs:** lowercase (e.g., `src/`, `public/`, `content/`)

**TypeScript:**
- **Interfaces:** PascalCase suffix Props (e.g., `PostCardProps`, `MDXContentProps`)
- **Types:** PascalCase (e.g., `Rune`)
- **Constants:** SCREAMING_SNAKE_CASE for exports (e.g., `ELDER_FUTHARK`, `NAV_RUNES`, `BLOG_RUNES`)
- **Variables:** camelCase (e.g., `isOpen`, `formattedDate`, `publishedPosts`)
- **Functions:** camelCase (e.g., `generateStaticParams()`, `generateMetadata()`, `useMDXComponent()`)

## Where to Add New Code

**New Blog Post:**
- Create: `content/posts/{slug}.mdx`
- Frontmatter required: `title`, `slug`, `date`, optional: `updated`, `description`, `tags`, `draft`
- Build: `npm run build` regenerates `.velite/` collection
- Route auto-generated: `/blog/{slug}` via `generateStaticParams()` in `src/app/blog/[slug]/page.tsx`

**New Project:**
- Create: `content/projects/{slug}.mdx`
- Frontmatter required: `title`, `slug`, `date`, `description`, optional: `featured`, `stack`, `github`, `demo`, `category`, `image`
- Build: `npm run build` regenerates `.velite/` collection
- Route auto-generated: `/projects/{slug}` via `generateStaticParams()` in `src/app/projects/[slug]/page.tsx`

**New Component:**
- Location: `src/components/{domain}/{component-name}.tsx`
- Example: `src/components/blog/new-feature.tsx` for blog-related component
- If interactive (state, hooks): Add `'use client'` directive at top
- Pattern: Export named component (e.g., `export function NewFeature() { ... }`)
- Import in parent: `import { NewFeature } from '@/components/{domain}/new-feature'`

**New Utility Function:**
- Location: `src/lib/utils.ts` (or new file `src/lib/{domain}.ts` if domain-specific)
- Pattern: Named export (e.g., `export function myHelper() { ... }`)
- Import: `import { myHelper } from '@/lib/utils'`

**New Page/Route:**
- Location: `src/app/{route-slug}/page.tsx`
- If dynamic: `src/app/{route-slug}/[param]/page.tsx`
- Pattern: Default export (e.g., `export default function MyPage() { ... }`)
- Metadata: Add `export const metadata: Metadata = { ... }`
- Static generation: Add `export async function generateStaticParams() { ... }` if dynamic

**New Style:**
- **Global:** Add to `src/app/globals.css` using `@layer` directives
- **Component-scoped:** Use Tailwind utility classes inline; avoid new CSS files
- **Design tokens:** Add CSS custom properties to `@theme` block in `src/app/globals.css`

## Special Directories

**`.velite/`:**
- Purpose: Generated content collections
- Generated: Yes (by Velite at build time)
- Committed: No (git-ignored)
- Touch: Never manually edit; regenerated on each build from `content/` MDX files

**`.next/`:**
- Purpose: Next.js build cache and intermediate files
- Generated: Yes (by Next.js)
- Committed: No (git-ignored)

**`.planning/`:**
- Purpose: GSD planning and analysis documents
- Generated: Yes (by GSD tools)
- Committed: Yes (to repo for team context)

**`public/static/`:**
- Purpose: Compiled static assets from Velite (e.g., optimized images referenced in MDX)
- Generated: Yes (by Velite)
- Committed: No (git-ignored)

---

*Structure analysis: 2026-02-08*
