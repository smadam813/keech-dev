# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- Components use **kebab-case**: `post-card.tsx`, `filter-bar.tsx`, `scroll-reveal.tsx`, `rune-divider.tsx`
- Library/utility modules use **kebab-case**: `rune-glows.ts`, `rune-config.ts`, `utils.ts`, `fonts.ts`, `redis.ts`, `views.ts`
- Page routes use Next.js App Router conventions: `page.tsx`, `layout.tsx`, `not-found.tsx`, `route.ts`
- Dynamic routes use bracket notation: `[slug]/page.tsx`, `[slug]/route.ts`
- Config files at root use their standard names: `velite.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs`

**Components:**
- Use **PascalCase** function names: `PostCard`, `FilterBar`, `ScrollReveal`, `RuneDivider`, `ListingViewCounts`
- Named exports only (no default exports for components): `export function PostCard(...)` not `export default function PostCard(...)`
- Exception: Page components use `export default function` per Next.js App Router convention

**Functions:**
- Use **camelCase**: `computeGlowPositions()`, `formatViewCount()`, `buildShuffledDelays()`, `getCachedViews()`, `setCachedViews()`
- Event handlers use `handle` prefix: `handleToggle`, `handleClear`, `handleLoad`, `handleCopy`, `handleKeyDown`
- Boolean state/derivations use `is`/`has` prefix: `isActive`, `isOpen`, `isVisible`, `isFiltering`, `isTransitioning`, `hasActive`, `hasAny`

**Variables:**
- Use **camelCase** for local variables and state: `imageLoaded`, `revealStage`, `glowsActive`, `filteredPosts`, `publishedPosts`
- Use **UPPER_SNAKE_CASE** for module-level constants and config objects: `RUNE_GLOWS`, `ELDER_FUTHARK`, `NAV_RUNES`, `POST_RUNES`, `BLOG_RUNES`, `IMG_W`, `IMG_H`, `BASE_URL`
- Refs use `Ref` suffix: `imgRef`, `sectionRef`, `buttonRef`, `preRef`, `hasPlayedRef`, `prevIsOpenRef`, `hasFired`, `isInitialRender`

**Types/Interfaces:**
- Use **PascalCase**: `RuneGlow`, `Rune`, `PostCardProps`, `FilterBarProps`, `ScrollRevealProps`, `TocEntry`
- Props interfaces use component name + `Props` suffix: `PostCardProps`, `CopyButtonProps`, `ViewCounterProps`, `FilteredPostListProps`
- Prefer `interface` for component props and object shapes
- Use `type` keyword for type aliases and import-only types: `type PreProps = ComponentPropsWithoutRef<'pre'>`, `import type { Metadata }`

**CSS Classes:**
- Custom CSS classes use **BEM-like kebab-case**: `hero-bg`, `hero-text--hidden`, `rune-glow--active`
- Modifier pattern uses double-dash: `hero-bg--revealed`, `rune-glow--active`, `rune-glow--amber`, `hero-text--reveal`
- Utility classes use kebab-case: `filter-grid-fade`, `animate-fade-in-up`, `animate-on-load`

## Code Style

**Formatting:**
- No Prettier or dedicated formatter configured -- formatting relies on editor defaults and ESLint
- Indentation: 2 spaces throughout
- Semicolons: Inconsistent between root config files (semicolons) and `src/` code (no semicolons). **Use no semicolons for new code in `src/`**
- Trailing commas: Used consistently in multiline arrays, objects, and function parameters
- String quotes: Single quotes in `src/` code. Double quotes in root config files. **Use single quotes for new code in `src/`**

**Linting:**
- ESLint v9 with flat config at `eslint.config.mjs`
- Extends `next/core-web-vitals` and `next/typescript` via `@eslint/eslintrc` FlatCompat adapter
- Run via `npm run lint` (calls `next lint`)
- No custom rules beyond Next.js defaults
- TypeScript strict mode enabled (`strict: true` in `tsconfig.json`)

## Import Organization

**Order:**
1. `'use client'` directive (if needed) -- always the very first line, before any imports
2. React/framework imports: `react`, `react/jsx-runtime`, `next/*`, `next/navigation`
3. Third-party libraries: `@upstash/redis`, `@vercel/analytics`, `lucide-react`
4. Internal absolute imports via path alias `@/`: `@/lib/utils`, `@/components/runes/rune-config`
5. Content collection imports: `@/.velite`
6. Relative imports: `./post-card`, `../../public/images/hero.webp`
7. CSS imports: `./globals.css` (only in root layout)

**Path Aliases:**
- `@/*` maps to `./src/*` -- use for all cross-directory imports within `src/`
- `@/.velite` maps to `./.velite` -- use only for importing Velite-generated content collections

**Import Style:**
- Use named imports: `import { cn } from '@/lib/utils'`
- Use `import type` for type-only imports: `import type { Metadata } from 'next'`, `import type { ReactNode } from 'react'`, `import type { MDXComponents } from 'mdx/types'`
- Destructure React hooks in import: `import { useState, useEffect, useCallback, useRef } from 'react'`
- Icons imported by name from lucide-react: `import { Github, ExternalLink, ArrowLeft, Menu, X, Check, Copy, Download } from 'lucide-react'`

## Component Patterns

**Server Components (default):**
- No directive needed -- all components are server components by default
- Used for: pages, layouts, static display components (`PostCard`, `Footer`, `TagChip` in display-only mode, `TechBadge` in display-only mode, `RuneDivider`, `TableOfContents`, `TocList`)
- Import data directly from `@/.velite` at module level in pages
- Use `async` functions for pages that await dynamic params: `export default async function PostPage({ params }: PostPageProps)`

**Client Components:**
- Marked with `'use client'` as the very first line of the file
- Used **only** when browser APIs are required:
  - State/effects: `useState`, `useEffect`, `useLayoutEffect`, `useRef`, `useCallback`
  - Browser APIs: `IntersectionObserver`, `ResizeObserver`, `localStorage`, `navigator.clipboard`, `window.matchMedia`, `window.history.replaceState`
  - Keyboard/DOM events: `keydown` listeners, focus management
  - Runtime code execution: `new Function()` in MDXContent
- Client components in this codebase:
  - `src/components/layout/header.tsx` -- mobile menu state, keyboard events, scroll lock, focus management
  - `src/components/hero.tsx` -- image load sequence, ResizeObserver, reduced-motion detection
  - `src/components/ui/scroll-reveal.tsx` -- IntersectionObserver, reduced-motion detection
  - `src/components/ui/filter-bar.tsx` -- receives callbacks (needs client parent)
  - `src/components/blog/filtered-post-list.tsx` -- URL state, filter logic
  - `src/components/blog/mdx-content.tsx` -- `new Function()` for MDX execution
  - `src/components/blog/code-block.tsx` -- ref for code text extraction
  - `src/components/blog/copy-button.tsx` -- clipboard API, copied state
  - `src/components/blog/view-counter.tsx` -- fetch, localStorage
  - `src/components/blog/listing-view-counts.tsx` -- React context, fetch, localStorage
  - `src/components/projects/filtered-project-list.tsx` -- URL state, filter logic

**Props Pattern:**
- Define a props interface directly above the component function in the same file
- Props interfaces are **not exported** -- they are file-local
- Destructure props in function signature: `function PostCard({ post }: PostCardProps)`
- Optional props use `?` with defaults via destructuring: `{ className = '' }`, `{ label = 'Filters' }`, `{ depth = 0 }`
- Children typed as `ReactNode` or `React.ReactNode`
- Rest spread only for pass-through to DOM: `{ children, ...props }: PreProps`

**Export Pattern:**
- Components use **named exports**: `export function ComponentName()`
- Page components use **default exports**: `export default function PageName()`
- Utility functions use **named exports**: `export function cn()`, `export function formatViewCount()`
- Constants use **named exports**: `export const ELDER_FUTHARK = ...`, `export const RUNE_GLOWS: RuneGlow[] = [...]`
- No barrel files (`index.ts`) -- import directly from the specific file path
- No re-exports

**Component File Structure (typical order):**
1. `'use client'` directive (if needed)
2. Imports
3. Interfaces/types (file-local)
4. Helper functions / constants (file-local, above the main component)
5. Main exported component function
6. Sub-components (if any, defined in same file -- e.g., `TocList` in `toc.tsx`)

## Error Handling

**API Routes (`src/app/api/`):**
- Wrap all Redis calls in try/catch blocks
- Log errors with bracketed prefix: `console.error('[views] Redis error:', error)`
- Return structured JSON error responses with HTTP status: `Response.json({ error: 'Failed to fetch view counts' }, { status: 500 })`
- Validate input parameters before processing (e.g., empty slugs returns `{ counts: {} }`)

```typescript
// Pattern from src/app/api/views/route.ts
try {
  const values = await redis.mget<(number | null)[]>(...keys)
  // ... process values
  return Response.json({ counts })
} catch (error) {
  console.error('[views] Redis error:', error)
  return Response.json(
    { error: 'Failed to fetch view counts' },
    { status: 500 }
  )
}
```

**Client-Side Fetch Errors:**
- View counting is explicitly non-critical -- all fetch failures are swallowed silently
- Pattern: `.catch(() => { /* View count is non-critical UI -- fail silently. */ })`
- Comments always explain why silence is intentional

**localStorage Access:**
- Wrap in try/catch for environments where storage is unavailable or full
- Empty catch blocks with explanatory comments: `catch { // Storage full or unavailable -- non-critical }`

```typescript
// Pattern from src/components/blog/view-counter.tsx
function getCachedViews(slug: string): number | null {
  try {
    const raw = localStorage.getItem(`views:${slug}`)
    return raw !== null ? Number(raw) : null
  } catch {
    return null
  }
}
```

**Content Not Found:**
- Use Next.js `notFound()` from `next/navigation` when content lookup returns undefined
- Pattern: `if (!post) { notFound() }`
- Custom 404 page at `src/app/not-found.tsx`

**General Principles:**
- No global error boundary configured
- No toast/notification system
- Fail silently for non-critical features; use `notFound()` for missing content
- Nullish coalescing (`??`) preferred over logical OR for falsy-safe defaults: `values[i] ?? 0`, `raw ?? ''`

## Tailwind CSS / Styling Conventions

**Configuration:**
- Tailwind CSS v4 with **CSS-first configuration** -- all design tokens defined in `src/app/globals.css` via `@theme` directive
- No `tailwind.config.js` file -- this is intentional (Tailwind v4 CSS-first)
- PostCSS configured via `postcss.config.mjs` with `@tailwindcss/postcss` plugin

**Design Token Usage (from `src/app/globals.css`):**
- Semantic color classes: `bg-background`, `text-foreground`, `text-accent`, `hover:text-accent-hover`, `text-accent-light`, `bg-surface`, `text-muted`
- Shadow utilities: `shadow-brutal`, `shadow-brutal-lg`, `shadow-brutal-hover`
- Border width: `border-[3px]` (matches `--border-brutal: 3px`)
- Opacity variants: `text-foreground/80`, `bg-accent/10`, `bg-accent/20`
- Font families: `font-display` (Norse), `font-body` (Inter)

**Neobrutalist Interactive Element Pattern:**
Apply this pattern to all clickable cards, buttons, and links with a "physical" feel:
```
border-[3px] border-black shadow-brutal
hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
transition-all duration-150
```
For smaller elements (tags, badges): use `hover:translate-x-[1px] hover:translate-y-[1px]`

**Responsive Layout:**
- Mobile-first approach
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- Column-to-row: `flex flex-col md:flex-row`
- Show/hide: `hidden md:flex` / `md:hidden`
- Container pattern: `max-w-7xl mx-auto px-6`
- Page section pattern: `w-full mx-auto max-w-7xl px-6 pt-12 pb-16`
- Page title pattern: `font-display text-4xl md:text-5xl font-bold mb-10`

**Class Composition with `cn()`:**
Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional class merging:
```typescript
import { cn } from '@/lib/utils'

// Conditional classes
<div className={cn(
  'base-classes-always-applied',
  condition && 'conditional-class',
  isActive ? 'active-classes' : 'inactive-classes',
  className  // allow parent override
)}>
```

**Motion Safety:**
- CSS transitions on decorative animations use `motion-safe:` prefix: `motion-safe:transition-colors`, `motion-safe:transition-all`
- Functional transitions (card hover, filter fade) use standard `transition-*` without prefix
- `@media (prefers-reduced-motion: reduce)` overrides in `src/app/globals.css` disable all keyframe animations globally
- Client components that animate check `window.matchMedia('(prefers-reduced-motion: reduce)')` on mount and listen for live changes

**Custom CSS in `src/app/globals.css`:**
- Written in `@layer base` (typography resets) and `@layer components` (animation classes, prose styles, code blocks)
- BEM-like naming for animation state classes: `.hero-bg`, `.hero-bg--revealed`, `.rune-glow--active`, `.rune-glow--amber`
- Prose typography is custom (no `@tailwindcss/typography` plugin used)
- Code block styling targets `[data-rehype-pretty-code-figure]` attributes

## Accessibility Patterns

**ARIA on Interactive Elements:**
- All buttons have explicit `type="button"` (prevents form submission)
- Icon-only buttons/links use `aria-label`: `aria-label="GitHub"`, `aria-label="Copy code"`, `aria-label={copied ? 'Copied!' : 'Copy code'}`
- Toggle buttons use `aria-pressed={active}` for filter chips
- Mobile menu toggle uses `aria-expanded={isOpen}` and `aria-controls="mobile-menu"`

**Decorative Elements:**
- All rune characters use `aria-hidden="true"` since they are decorative
- Lucide icons paired with text use `aria-hidden="true"` on the icon
- Divider components use `role="separator"`

**Modal/Overlay Pattern (from `src/components/layout/header.tsx`):**
- Mobile menu: `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`
- Main content gets `inert` attribute when menu is open (replaces JS focus trap)
- Focus restoration: ref tracks previous open state, returns focus to trigger button on close
- Escape key handler closes the menu
- Scroll lock uses `position: fixed` approach (iOS Safari safe)

**Semantic HTML:**
- `<article>` for blog posts and project cards
- `<header>` for page/card headers
- `<nav>` for navigation menus
- `<footer>` for site footer
- `<main>` in root layout
- `<aside>` for sidebar (table of contents)
- `<time dateTime={post.date}>` for dates
- `role="group" aria-label="Filter by tag"` on filter containers

**External Links:**
- Use `target="_blank" rel="noopener noreferrer"` for all external links

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- API routes use `console.error` with a bracketed prefix: `console.error('[views] Redis error:', error)`
- No client-side logging in production code (failures are silent for non-critical features)
- No structured logging, log levels, or observability tooling beyond Vercel Analytics

## Comments

**When to Comment:**
- Explain "why" for non-obvious decisions and browser workarounds
- Architecture comments at the top of config modules
- Inline comments before complex logic blocks

**Style:**
- Single-line comments with `//` -- use `--` (double hyphen) in comment prose, not em-dash character
- JSDoc `/** */` blocks on exported functions, constants, and interfaces with non-obvious purpose
- CSS section dividers: `/* ========== Section Name ========== */`
- File-level purpose comments: `// Elder Futhark Rune Configuration` / `// Server-safe module (no client directive needed).`

**Examples from codebase:**
```typescript
// From src/components/layout/header.tsx
// Scroll lock (iOS Safari safe: position fixed approach)
// Focus management via inert attribute on main content
// Auto-close on route change

// From src/components/blog/view-counter.tsx
// View count is non-critical UI -- fail silently.
// Cached value (if any) remains displayed.

// From src/components/hero.tsx
// Beat 1: Background blur-to-sharp (immediate)
// Beat 2: Text fade-up (after blur transition + pause)
```

## Function Design

**Size:** Functions are small and focused. Most components are 20-60 lines. The largest component (`Hero` at ~177 lines) is exceptional due to animation orchestration with multiple effects.

**Parameters:**
- Destructure props objects in function signatures
- Define typed interfaces for all props, not inline types
- Wrap callbacks in `useCallback` with explicit dependency arrays
- Use `useRef` for values that should not trigger re-renders: `hasFired`, `isInitialRender`, `hasPlayedRef`

**Return Values:**
- Components return JSX (single root element or fragment `<>...</>`)
- Early null returns for guard clauses: `if (entries.length === 0) return null`, `if (views == null) return null`
- Utility functions return explicitly typed values

## Module Design

**Exports:**
- One primary export per file (component or utility function)
- Some files export multiple related items: `rune-config.ts` exports `ELDER_FUTHARK`, `NAV_RUNES`, `BLOG_RUNES`, `PROJECT_RUNES`, `DIVIDER_RUNES`, `POST_RUNES`, `TEXTURE_RUNES`, and the `Rune` interface
- `listing-view-counts.tsx` exports the `ListingViewCounts` provider, `useViewCount` hook, and `PostCardViewCount` consumer

**Barrel Files:** Not used. Import directly from source file paths.

**Co-location:**
- Components grouped by feature: `components/blog/`, `components/projects/`, `components/runes/`, `components/ui/`, `components/layout/`
- Shared utilities in `src/lib/` (small, focused modules)
- Page-specific data transforms stay in page files (e.g., filtering/sorting posts)

## Next.js-Specific Conventions

**Metadata:**
- Exported `metadata` constant from page files for static metadata (type `Metadata` from `next`)
- `generateMetadata()` async function for dynamic metadata on slug-based pages
- Root layout at `src/app/layout.tsx` sets `metadataBase`, title template (`'%s | keech.dev'`), OpenGraph, and Twitter defaults
- Separate `viewport` export (type `Viewport`) in root layout

**Static Generation:**
- Content pages export `generateStaticParams()` for build-time path generation from Velite collections
- API routes use `export const dynamic = 'force-dynamic'` to opt out of caching

**Page Layout Pattern:**
```typescript
// Consistent page wrapper
<section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
  <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Page Title</h1>
  {/* Content */}
</section>
```

**Back Navigation Pattern:**
```typescript
<Link
  href="/blog"
  className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
>
  <ArrowLeft size={16} />
  <span>All Blog Posts</span>
</Link>
```

**Client Component Wrapping with Suspense:**
- Client components that use `useSearchParams()` are wrapped in `<Suspense>` on the server page to avoid hydration issues:
```typescript
// From src/app/blog/page.tsx
<Suspense>
  <FilteredPostList posts={publishedPosts} allTags={allTags} />
</Suspense>
```

**Data Flow:**
- Velite collections imported at module level in server page components
- Data filtered/sorted in server component, passed as props to client components
- Client components never import from `@/.velite` directly

---

*Convention analysis: 2026-03-22*
