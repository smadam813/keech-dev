# Technology Stack

**Analysis Date:** 2026-02-08

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code (`.ts`, `.tsx` files)
- MDX - Content source for blog posts and projects

**Secondary:**
- JavaScript (ES2022 target) - Config files and build scripts

## Runtime

**Environment:**
- Node.js (version not specified in `.nvmrc` - uses system default)

**Package Manager:**
- npm (default Node.js package manager)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router
  - Uses Turbopack (next dev --turbopack) for fast local development
  - Static generation via `generateStaticParams()` for all content pages

**UI & Styling:**
- React 19.2.4 - Component library
- Tailwind CSS 4.1.18 - Utility-first CSS framework
  - CSS-first configuration via `@theme` directive in `src/app/globals.css`
  - No `tailwind.config.js` file (all tokens in globals.css)
  - Neobrutalist design system with custom colors and shadow utilities

**Content:**
- Velite 0.3.1 - Static site generation for MDX collections
  - Runs as separate prebuild step (not webpack plugin - incompatible with Turbopack)
  - Compiles MDX in `content/posts/` and `content/projects/` to `.velite/` output
  - Zod schema validation for frontmatter metadata

**Code Syntax & Processing:**
- rehype-slug 6.0.0 - Adds IDs to heading elements for table of contents
- rehype-pretty-code 0.14.1 - Syntax highlighting via Shiki
- Shiki 3.22.0 - Code syntax highlighter (github-dark-dimmed theme)

**UI Components & Icons:**
- Lucide React 0.563.0 - Icon library (GitHub, LinkedIn, Check, Copy icons used)

**Utilities:**
- clsx 2.1.1 - Conditional CSS class utility
- tailwind-merge 3.4.0 - Merge Tailwind CSS classes intelligently

## Key Dependencies

**Critical:**
- next 16.1.6 - Core framework; without it the app doesn't run
- react 19.2.4 - Component runtime
- velite 0.3.1 - Content pipeline; without it MDX won't compile

**Infrastructure:**
- @tailwindcss/postcss 4.1.18 - Tailwind CSS PostCSS plugin
- postcss 8.5.6 - CSS transformation tool (required by Tailwind)
- @types/node 25.1.0 - Node.js type definitions
- @types/react 19.2.10 - React type definitions
- @types/react-dom 19.2.3 - React DOM type definitions

## Build & Dev Tools

**Build:**
- `velite && next build` - Sequential build: Velite compiles content, then Next.js builds app

**Development:**
- `velite --watch & next dev --turbopack` - Parallel processes: Velite watches MDX files, Next.js dev server with Turbopack

**Linting:**
- ESLint 9.39.2 - JavaScript linter
  - Config: `eslint.config.mjs` (flat config format)
  - Extends: `next/core-web-vitals` + `next/typescript`
- @eslint/eslintrc 3.3.3 - ESLint v9 compatibility layer for legacy configs

**Development Dependencies:**
- TypeScript 5.9.3 - Type checking
- colorable 1.0.5 - Utility library (purpose not clear from imports)

## Configuration

**Environment:**
- No `.env` file required for local development
- No environment variables referenced in source code
- Vercel deployment configured via git push (automatic CI/CD)

**Build Configuration:**
- `next.config.ts` - Next.js config (image quality settings: 75, 80)
- `tsconfig.json` - TypeScript config
  - Target: ES2022
  - Module resolution: bundler
  - Path aliases: `@/*` → `./src/*`, `@/.velite` → `./.velite`
  - Strict mode enabled
- `velite.config.ts` - Content compilation config
- `postcss.config.mjs` - PostCSS config (Tailwind CSS plugin)
- `eslint.config.mjs` - ESLint linting rules

**Fonts:**
- Google Fonts: Inter (body, 400/500/600/700 weights)
- Custom WOFF2: Norse (display font, 400/700 weights in `public/fonts/`)
- Configured in `src/lib/fonts.ts` with `next/font/local` and `next/font/google`

## Platform Requirements

**Development:**
- Node.js runtime
- npm package manager
- No database required
- No API server required

**Production:**
- Vercel hosting (automatic deployment on git push)
- Edge functions supported but not currently used
- Static generation only (no runtime API endpoints)

---

*Stack analysis: 2026-02-08*
