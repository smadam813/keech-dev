# Technology Stack

**Analysis Date:** 2026-04-05

## Languages

**Primary:**
- TypeScript 6.x - All source files (`src/**/*.ts`, `src/**/*.tsx`)
- MDX - Content authoring (`content/posts/**/*.mdx`, `content/projects/**/*.mdx`)

**Secondary:**
- CSS - Design tokens and animations (`src/app/globals.css` via Tailwind v4 `@theme` directive)

## Runtime

**Environment:**
- Node.js 22.x (confirmed via `node --version`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (lockfileVersion 3) — present

## Frameworks

**Core:**
- Next.js 16.2.x - App Router, React Server Components, static generation with `generateStaticParams()`
- React 19.2.x - UI rendering; server components default, client components (`'use client'`) only where browser APIs required
- Tailwind CSS 4.2.x - CSS-first configuration; no `tailwind.config.js`, all tokens in `src/app/globals.css` via `@theme`

**Content Pipeline:**
- Velite 0.3.1 - MDX compilation to type-safe collections at build time; outputs to `.velite/` (gitignored); runs as a separate prebuild step (not a webpack plugin) due to Turbopack incompatibility
- rehype-pretty-code 0.14.x - Syntax highlighting in MDX
- rehype-slug 6.x - Heading anchor IDs in MDX
- Shiki 4.x - Syntax highlighting engine; uses CSS-variables theme defined in `globals.css` with `--shiki-*` prefix

**Testing:**
- Vitest 4.x - Unit tests; config at `vitest.config.ts`; `globals: true` so no imports needed for `describe`/`it`/`expect`
- Playwright 1.59.x - E2E tests; config at `playwright.config.ts`; two projects: `desktop-chromium` (Desktop Chrome) and `mobile-chromium` (Pixel 5)
- @testing-library/react 16.x - Component rendering in unit tests
- @testing-library/jest-dom 6.x - DOM matchers
- jsdom 29.x - DOM environment for Vitest (`environment: 'jsdom'`)

**Build/Dev:**
- Turbopack - Dev server bundler (`next dev --turbopack`)
- PostCSS 8.x - CSS processing; config at `postcss.config.mjs`; uses `@tailwindcss/postcss` plugin only
- ESLint 9.x - Flat config at `eslint.config.mjs`; extends `eslint-config-next` core-web-vitals + typescript; three React 19 rules downgraded to `warn`

## Key Dependencies

**Critical:**
- `velite` 0.3.1 - Must complete before `next build`; all content is unavailable without it
- `@upstash/redis` 1.37.x - View count storage via REST API; required at runtime for API routes
- `@upstash/ratelimit` 2.0.x - Sliding window rate limiting on view-count POST (10 req/60s per IP)

**UI:**
- `lucide-react` 1.7.x - Icon components
- `clsx` 2.1.x - Conditional class names
- `tailwind-merge` 3.5.x - Deduplicates Tailwind class conflicts; combined with clsx in `src/lib/utils.ts` as `cn()`

**Analytics:**
- `@vercel/analytics` 2.0.x - Web analytics component injected in root layout (`src/app/layout.tsx`)

**Fonts:**
- Norse (custom WOFF2) - Display/heading font; local files at `public/fonts/Norse-Regular.woff2`, `public/fonts/Norse-Bold.woff2`; CSS variable: `--font-display`
- Inter (Google Fonts via `next/font/google`) - Body font; CSS variable: `--font-body`

## Configuration

**Environment:**
- `.env.local` file present (never read contents)
- Required at runtime: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (consumed by `Redis.fromEnv()` in `src/lib/redis.ts`)

**TypeScript:**
- Config at `tsconfig.json`; `strict: true`, `target: ES2022`, `moduleResolution: bundler`
- Path aliases: `@/*` → `./src/*`, `@/.velite` → `./.velite`
- `types: ["vitest/globals"]` included so Vitest globals are recognized

**Build:**
- `next.config.ts` — minimal; sets `images.qualities: [75, 80]`; security headers formerly set here are now absent from next.config.ts (applied elsewhere or removed)
- `velite.config.ts` — defines two collections (`posts`, `projects`) with Zod schemas, MDX rehype pipeline, output to `.velite/` and `public/static/`
- `postcss.config.mjs` — single plugin: `@tailwindcss/postcss`

## Platform Requirements

**Development:**
- Node.js 22.x
- Must run `velite --watch` alongside `next dev --turbopack` (both run in parallel via `npm run dev`)

**Production:**
- Deployed to Vercel via git push; no CI/CD pipeline
- Full static generation for content pages
- Dynamic API routes at `/api/views` and `/api/views/[slug]` (require Upstash Redis credentials at runtime)

---

*Stack analysis: 2026-04-05*
