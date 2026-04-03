# Technology Stack

**Analysis Date:** 2026-04-03

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (`src/**/*.ts`, `src/**/*.tsx`)
- MDX - Blog posts and project content (`content/posts/**/*.mdx`, `content/projects/**/*.mdx`)

**Secondary:**
- CSS - Tailwind v4 CSS-first configuration and keyframe animations (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js v22.21.0
- Target: ES2022 (set in `tsconfig.json`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present and committed)

## Frameworks

**Core:**
- Next.js 16.2.2 - App Router, React Server Components, static generation
  - Config: `next.config.ts`
  - Turbopack used in dev mode (`next dev --turbopack`)
- React 19.2.4 - UI rendering (server components by default, client components where browser APIs needed)
- React DOM 19.2.4

**Content:**
- Velite 0.3.1 - MDX content compiler (build-time prebuild step, not a webpack plugin)
  - Config: `velite.config.ts`
  - Output: `.velite/` (gitignored, regenerated every build)
  - Import alias: `@/.velite` maps to `./.velite`

**Styling:**
- Tailwind CSS 4.1.18 - CSS-first configuration via `@theme` directive
  - No `tailwind.config.js` -- all tokens defined in `src/app/globals.css`
  - PostCSS integration via `@tailwindcss/postcss` in `postcss.config.mjs`
- PostCSS 8.5.6 - CSS processing pipeline

**Linting:**
- ESLint 9.39.2 - Flat config format
  - Config: `eslint.config.mjs`
  - Extends: `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
  - Ignores: `.velite/`, `.claude/worktrees/`, `.next/`
  - Rule overrides (set to `warn`):
    - `react-hooks/set-state-in-effect` - intentional setState in effects for external sync
    - `react-hooks/static-components` - dynamic MDX components
    - `react-hooks/refs` - ref reads in render for computed positions

**Testing:**
- Vitest 4.1.2 - Unit test runner
  - Config: `vitest.config.ts`
  - Environment: jsdom (via `jsdom` 29.0.1)
  - Test pattern: `src/**/*.test.{ts,tsx}`
  - Setup file: `vitest.setup.ts`
  - Plugins: `@vitejs/plugin-react` 6.0.1, `vite-tsconfig-paths` 6.1.1
  - Run: `npm run test`
- Playwright 1.59.1 - E2E test runner
  - Config: `playwright.config.ts`
  - Test dir: `./e2e/`
  - Projects: desktop Chromium, mobile Chromium (Pixel 5)
  - Web server: builds and starts app on `localhost:3000`
  - Run: `npm run test:e2e`
- Testing Library React 16.3.2 - Component testing utilities
- Testing Library jest-dom 6.9.1 - DOM assertion matchers

## Key Dependencies

**Critical (runtime):**
- `@upstash/redis` 1.36.2 - Serverless Redis client for view counting (`src/lib/redis.ts`)
- `@upstash/ratelimit` 2.0.8 - Rate limiting for view count API (`src/lib/rate-limit.ts`)
- `@vercel/analytics` 1.6.1 - Web analytics, imported in root layout (`src/app/layout.tsx`)
- `lucide-react` 0.563.0 - Icon library used throughout components

**Content Pipeline:**
- `rehype-pretty-code` 0.14.1 - Syntax highlighting for MDX code blocks (theme: `github-dark-dimmed`)
- `rehype-slug` 6.0.0 - Adds `id` attributes to heading elements for anchor links
- `shiki` 3.22.0 - Underlying syntax highlighter for rehype-pretty-code

**Utility:**
- `clsx` 2.1.1 - Conditional CSS class string construction
- `tailwind-merge` 3.4.0 - Merges Tailwind classes without conflicts
- Combined in `cn()` utility at `src/lib/utils.ts`:
  ```typescript
  import { type ClassValue, clsx } from "clsx";
  import { twMerge } from "tailwind-merge";
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

**Dev Dependencies:**
- `typescript` 5.9.3 - Type checking
- `@types/node` 25.1.0 - Node.js type definitions
- `@types/react` 19.2.10 - React type definitions
- `@types/react-dom` 19.2.3 - React DOM type definitions
- `eslint-config-next` 16.1.6 - Next.js ESLint rules

## Configuration

**TypeScript (`tsconfig.json`):**
- Strict mode enabled
- Module resolution: `bundler`
- JSX: `react-jsx`
- Incremental compilation enabled
- Path aliases:
  - `@/*` -> `./src/*`
  - `@/.velite` -> `./.velite`

**Next.js (`next.config.ts`):**
- Image quality settings (`qualities: [75, 80]`)
- Security headers: CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin)
- CSP allows: self, unsafe-eval, unsafe-inline, `va.vercel-scripts.com`

**PostCSS (`postcss.config.mjs`):**
- Single plugin: `@tailwindcss/postcss` (Tailwind v4 integration)

**Environment:**
- `.env.local` present (contains Upstash Redis credentials)
- Required vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Fonts (`src/lib/fonts.ts`):**
- Norse (custom WOFF2, local): `public/fonts/Norse-Regular.woff2`, `public/fonts/Norse-Bold.woff2`
  - CSS variable: `--font-display`
  - Used for headings and display text
- Inter (Google Font): weights 400, 500, 600, 700
  - CSS variable: `--font-body`
  - Used for body text

## Build Pipeline

**Development (`npm run dev`):**
```bash
velite --watch & next dev --turbopack
```
Two parallel processes: Velite watches MDX content for changes, Next.js uses Turbopack for fast HMR.

**Production Build (`npm run build`):**
```bash
velite && next build
```
Sequential: Velite must complete MDX compilation before Next.js build starts. Output goes to `.next/`.

**Lint (`npm run lint`):**
```bash
eslint .
```
Uses ESLint flat config with `next/core-web-vitals` and `next/typescript` rule sets.

**Unit Tests (`npm run test`):**
```bash
vitest run
```

**E2E Tests (`npm run test:e2e`):**
```bash
playwright test
```
Builds the app, starts on port 3000, runs desktop + mobile Chromium projects.

**Content Only (`npm run velite`):**
```bash
velite
```
Run Velite content compilation alone. Useful for debugging MDX content issues.

## Platform Requirements

**Development:**
- Node.js 22.x (no `.nvmrc` or `.node-version` file)
- npm
- `.env.local` with Upstash Redis credentials for view counting (feature degrades gracefully without them)
- No Docker or containerization required for local dev

**Production:**
- Deployed to Vercel (git-push deployment, no CI pipeline)
- Static site with two serverless API routes for view counting
- Environment variables configured in Vercel dashboard

---

*Stack analysis: 2026-04-03*
