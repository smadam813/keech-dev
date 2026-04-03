# Coding Conventions

**Analysis Date:** 2026-04-03

## Naming Patterns

**Files:**
- Components: `kebab-case.tsx` (e.g., `post-card.tsx`, `filter-chip.tsx`, `copy-button.tsx`, `scroll-reveal.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-hero-animation.ts`, `use-filtered-list.ts`, `use-glow-positions.ts`)
- Utilities: `kebab-case.ts` (e.g., `format.ts`, `validation.ts`, `rune-glows.ts`, `rate-limit.ts`)
- Tests: co-located as `{module}.test.ts` or `{module}.test.tsx` in the same directory as the source
- E2E specs: `kebab-case.spec.ts` in the `e2e/` directory
- Route handlers: `route.ts` inside Next.js App Router directories
- Pages: `page.tsx`, `loading.tsx`, `error.tsx` per App Router convention
- Config files: standard names at root (`velite.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`)

**Components:**
- Use `PascalCase` function names: `PostCard`, `FilterChip`, `CodeBlock`, `MDXContent`
- Named exports only: `export function PostCard(...)` -- never `export default` for components
- Exception: Page/layout/error/loading files use `export default function` per Next.js requirement

**Functions:**
- Use `camelCase`: `formatDate()`, `validateSlug()`, `computeGlowPositions()`, `getCachedViews()`
- Event handlers use `handle` prefix: `handleLoad`, `handleToggle`, `handleClear`
- Boolean derivations use `is`/`has` prefix: `isActive`, `isOpen`, `isFiltering`, `isTransitioning`

**Variables:**
- Use `camelCase` for local variables and state: `imageLoaded`, `revealStage`, `glowsActive`, `filteredPosts`
- Use `UPPER_SNAKE_CASE` for module-level constants: `RUNE_GLOWS`, `NAV_RUNES`, `POST_RUNES`, `SLUG_PATTERN`, `MAX_SLUG_LENGTH`, `MAX_BATCH_SLUGS`
- Refs use `Ref` suffix: `imgRef`, `sectionRef`, `buttonRef`, `preRef`, `hasPlayedRef`, `prevIsOpenRef`

**Types/Interfaces:**
- Use `PascalCase`: `RuneGlow`, `PostCardProps`, `RevealStage`, `UseHeroAnimationResult`
- Props interfaces use component name + `Props` suffix: `PostCardProps`, `FilterChipProps`, `PostPageProps`
- Prefer `interface` for component props and object shapes
- Use `type` for aliases and type-only imports: `type PreProps = ComponentPropsWithoutRef<'pre'>`, `import type { Metadata }`

**CSS Classes:**
- Custom CSS classes use BEM-like kebab-case: `hero-bg`, `hero-text--hidden`, `rune-glow--active`
- Modifier pattern uses double-dash: `hero-bg--revealed`, `rune-glow--amber`

## Code Style

**Formatting:**
- No Prettier or Biome configured -- formatting relies on editor defaults and ESLint
- Indentation: 2 spaces throughout
- Semicolons: **No semicolons in `src/` code.** Root config files may use semicolons.
- Trailing commas: Used consistently in multiline arrays, objects, and function parameters
- String quotes: **Single quotes in `src/` code.** Double quotes in root config files.

**Linting:**
- ESLint v9 with flat config at `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Three React 19 rules downgraded to `"warn"`: `react-hooks/set-state-in-effect`, `react-hooks/static-components`, `react-hooks/refs`
- Ignores: `.velite/`, `.claude/worktrees/`, `.next/`
- Run via: `npm run lint` (calls `eslint .`)

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Target: ES2022, module resolution: bundler
- No `any` types in source code
- Use `type` imports for type-only usage: `import type { Metadata } from 'next'`

## Import Organization

**Order:**
1. `'use client'` directive (if needed) -- always the very first line
2. React/framework imports: `react`, `next/link`, `next/navigation`
3. Third-party libraries: `@upstash/redis`, `lucide-react`, `crypto`
4. Internal path-aliased imports: `@/components/...`, `@/lib/...`
5. Content collection imports: `@/.velite`
6. Relative imports: `./copy-button`, `./format`
7. Type-only imports: `import type { Metadata } from 'next'`

**Path Aliases:**
- `@/*` maps to `./src/*` -- use for all cross-directory imports within `src/`
- `@/.velite` maps to `./.velite` -- use only for importing Velite-generated content collections
- Relative imports (`./`) only for same-directory siblings

**Import Style:**
- Named imports: `import { cn } from '@/lib/utils'`
- `import type` for type-only: `import type { Metadata } from 'next'`
- Destructure React hooks: `import { useState, useEffect, useCallback, useRef } from 'react'`
- Icons by name: `import { ArrowLeft, Menu, X, Check, Copy } from 'lucide-react'`

## Component Patterns

**Server Components (default):**
- No directive needed -- all components are server components by default
- Import data directly from `@/.velite` at module level
- Use `async` functions for pages that await dynamic params: `export default async function PostPage({ params }: PostPageProps)`

**Client Components:**
- Marked with `'use client'` as the very first line
- Used ONLY when browser APIs are required: state, effects, IntersectionObserver, ResizeObserver, localStorage, clipboard, window.matchMedia, keyboard events, `new Function()`
- Client components in this codebase:
  - `src/components/layout/header.tsx` -- mobile menu state, keyboard events, scroll lock, focus management
  - `src/components/hero.tsx` -- image load sequence, ResizeObserver, reduced-motion
  - `src/components/ui/scroll-reveal.tsx` -- IntersectionObserver
  - `src/components/ui/filter-bar.tsx` -- receives callbacks
  - `src/components/blog/filtered-post-list.tsx` -- URL state, filter logic
  - `src/components/blog/mdx-content.tsx` -- `new Function()` for MDX execution
  - `src/components/blog/code-block.tsx` -- ref for code text extraction
  - `src/components/blog/copy-button.tsx` -- clipboard API
  - `src/components/blog/view-counter.tsx` -- fetch, localStorage
  - `src/components/blog/listing-view-counts.tsx` -- React context, fetch, localStorage
  - `src/components/blog/mobile-toc.tsx` -- expand/collapse state
  - `src/components/projects/filtered-project-list.tsx` -- URL state, filter logic

**Props Pattern:**
- Define a props interface directly above the component in the same file
- Props interfaces are file-local (not exported)
- Destructure in function signature: `function PostCard({ post }: PostCardProps)`
- Accept `className?: string` on reusable UI components
- Children typed as `ReactNode`
- Rest spread only for DOM pass-through: `{ children, ...props }: PreProps`

**Export Pattern:**
- Components: **named exports** `export function ComponentName()`
- Pages/layouts/errors: **default exports** `export default function PageName()` (Next.js requirement)
- Utilities: **named exports** `export function cn()`
- Constants: **named exports** `export const RUNE_GLOWS`
- **No barrel files** (`index.ts`) -- import directly from source file

**Component File Structure:**
1. `'use client'` directive (if needed)
2. Imports
3. Interfaces/types (file-local)
4. Helper functions/constants (file-local)
5. Main exported component function
6. Sub-components (if any, in same file)

## Error Handling

**API Routes (`src/app/api/`):**
- Validate inputs first, return 400 for invalid input with `Response.json({ error: 'message' }, { status: 400 })`
- Wrap Redis/external calls in try/catch
- Log errors with bracketed prefix: `console.error('[views] Redis error:', error)`
- Return structured JSON errors with status codes (400, 429, 500)
- Rate limiting returns 429: `Response.json({ error: 'Too many requests' }, { status: 429 })`

```typescript
// Pattern from src/app/api/views/[slug]/route.ts
if (!validateSlug(slug)) {
  return Response.json({ error: 'Invalid slug' }, { status: 400 })
}
try {
  const views = await redis.get<number>(`views:${slug}`) ?? 0
  return Response.json({ slug, views })
} catch (error) {
  console.error('[views] Redis error:', error)
  return Response.json({ error: 'Failed to fetch view count' }, { status: 500 })
}
```

**Client-Side:**
- View counting is non-critical -- all fetch failures are swallowed silently
- localStorage access wrapped in try/catch with empty catch: `catch { // Storage full or unavailable -- non-critical }`
- Comments always explain why silence is intentional

**Error Boundaries:**
- Global: `src/app/error.tsx` -- escape link to `/`
- Blog post: `src/app/blog/[slug]/error.tsx` -- escape link to `/blog`
- Root layout: `src/app/global-error.tsx` -- renders full HTML shell
- All error boundaries render: branded heading, escape link, reset button
- Never expose internal error details in UI

**Content Not Found:**
- Use `notFound()` from `next/navigation`: `if (!post) { notFound() }`
- Custom 404 at `src/app/not-found.tsx`

## Tailwind CSS / Styling Conventions

**Configuration:**
- Tailwind CSS v4 with CSS-first configuration -- all tokens in `src/app/globals.css` via `@theme`
- No `tailwind.config.js` (intentional -- Tailwind v4 CSS-first)
- PostCSS via `postcss.config.mjs` with `@tailwindcss/postcss`

**Design Token Usage:**
- Colors: `bg-background`, `text-foreground`, `text-accent`, `bg-surface`, `text-muted`
- Shadows: `shadow-brutal` (4px), `shadow-brutal-hover` (2px)
- Border: `border-[3px]` (matches `--border-brutal: 3px`)
- Opacity: `text-foreground/80`, `bg-accent/10`
- Fonts: `font-display` (Norse), `font-body` (Inter)

**Neobrutalist Interactive Pattern (apply to all clickable elements):**
```
border-[3px] border-black shadow-brutal
hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
transition-all duration-150
```
For smaller elements (tags, badges): `hover:translate-x-[1px] hover:translate-y-[1px]`

**Class Composition with `cn()`:**
```typescript
import { cn } from '@/lib/utils'
<div className={cn(
  'base-classes',
  condition && 'conditional-class',
  isActive ? 'active' : 'inactive',
  className
)}>
```

**Motion Safety:**
- CSS transitions on decorative animations use `motion-safe:` prefix
- Functional transitions (hover effects) use standard `transition-*`
- `@media (prefers-reduced-motion: reduce)` in globals.css disables keyframe animations
- Client components check `window.matchMedia('(prefers-reduced-motion: reduce)')` on mount and listen for changes

**Responsive:**
- Mobile-first, breakpoints: `md:` (768px), `lg:` (1024px)
- Container: `max-w-7xl mx-auto px-6`
- Page section: `w-full mx-auto max-w-7xl px-6 pt-12 pb-16`

## Accessibility Patterns

**ARIA on Interactive Elements:**
- All buttons have `type="button"` explicitly
- Icon-only buttons use `aria-label`
- Toggle buttons use `aria-pressed={active}`
- Menu toggle uses `aria-expanded={isOpen}` and `aria-controls="mobile-menu"`

**Decorative Elements:**
- Rune characters use `aria-hidden="true"`
- Icons paired with text use `aria-hidden="true"`

**Modal/Overlay (from `src/components/layout/header.tsx`):**
- Mobile menu: `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
- Main content gets `inert` attribute when menu open (replaces JS focus trap)
- Focus restoration via ref tracking previous open state
- Escape key closes menu
- Scroll lock: `position: fixed` approach (iOS Safari safe)

**Semantic HTML:**
- `<article>` for posts/projects, `<header>` for headers, `<nav>` for navigation
- `<aside>` for sidebar, `<time dateTime={}>` for dates, `<footer>` for footer

## Logging

**Framework:** `console` only (no logging library)
**Pattern:** `console.error('[module] description:', error)` with bracket-prefix namespace
**Client:** No logging in production -- failures are silent for non-critical features

## Comments

**Style:**
- `//` for inline comments explaining "why"
- Use ` -- ` (double-dash with spaces) for inline notes: `// Storage full or unavailable -- non-critical`
- No JSDoc on functions/components -- TypeScript types serve as documentation
- File-level JSDoc `/** */` on test files for context
- CSS section dividers: `/* ========== Section Name ========== */`

## Function Design

**Size:** Small and focused. Most components 20-60 lines. Most utility functions under 20 lines.

**Parameters:** Hooks accept typed options objects:
```typescript
interface UseHeroAnimationOptions {
  imgRef: RefObject<HTMLImageElement | null>
}
export function useHeroAnimation({ imgRef }: UseHeroAnimationOptions): UseHeroAnimationResult
```

**Return Values:**
- Hooks return typed objects with state and handlers
- Validation returns structured results: `{ valid: boolean; error?: string }`
- Pure functions return primitives

## Module Design

**Exports:**
- One primary export per file (or multiple related exports)
- No barrel files -- import directly from source paths
- No re-exports

**Co-location:**
- Components by feature: `components/blog/`, `components/projects/`, `components/runes/`, `components/ui/`, `components/layout/`
- Shared utilities in `src/lib/`
- Tests co-located with source files

## Next.js-Specific Conventions

**Metadata:**
- Static: exported `metadata` constant (type `Metadata`)
- Dynamic: `generateMetadata()` async function on slug pages
- Root layout sets `metadataBase`, title template, OpenGraph defaults

**Static Generation:**
- Content pages export `generateStaticParams()` from Velite collections
- API routes use `export const dynamic = 'force-dynamic'`

**Client Component + Suspense:**
- Client components using `useSearchParams()` wrapped in `<Suspense>` on server page

**Data Flow:**
- Velite collections imported at module level in server pages
- Data filtered/sorted in server component, passed as props to client components
- Client components never import from `@/.velite` directly

---

*Convention analysis: 2026-04-03*
