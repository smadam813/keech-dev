# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Static-first monolith (Next.js App Router with build-time content compilation)

**Key Characteristics:**
- Server components by default; client components only where browser APIs are required
- Content compiled at build time by Velite (separate prebuild step), producing type-safe JSON collections
- Static pages generated via `generateStaticParams()` for all content routes
- Single dynamic feature: view counting via Upstash Redis API routes
- No client-side routing state library; URL search params used for filter state
- Deployed as a Vercel serverless application (static pages + API route functions)

## Layers

**Content Layer (Build-Time):**
- Purpose: Transform MDX source files into type-safe JSON data consumed at build time
- Location: `content/posts/`, `content/projects/`, `velite.config.ts`
- Contains: MDX files with frontmatter, Velite collection schemas (Zod-based)
- Depends on: Velite, rehype-pretty-code, rehype-slug
- Used by: All page components that import from `@/.velite`
- Output: `.velite/posts.json`, `.velite/projects.json`, `.velite/index.js`, `.velite/index.d.ts`

**Presentation Layer (Server Components):**
- Purpose: Render pages using compiled content data; handle SEO metadata
- Location: `src/app/` (page.tsx, layout.tsx files)
- Contains: Route pages, layout, metadata exports, `generateStaticParams()`
- Depends on: `.velite` collections, shared components
- Used by: Next.js framework (routing)

**Interactive Layer (Client Components):**
- Purpose: Handle browser-only features (state, animation, clipboard, localStorage, observers)
- Location: Files with `'use client'` directive throughout `src/components/`
- Contains: Hero animations, mobile menu, filtered lists, view counters, scroll reveals, code copy
- Depends on: React hooks, browser APIs (IntersectionObserver, ResizeObserver, localStorage, clipboard)
- Used by: Server component pages that compose them

**API Layer (Serverless Functions):**
- Purpose: View count tracking with IP deduplication
- Location: `src/app/api/views/route.ts`, `src/app/api/views/[slug]/route.ts`
- Contains: Two route handlers (batch GET, single GET/POST)
- Depends on: `src/lib/redis.ts` (Upstash Redis client)
- Used by: Client-side view counter components via fetch

**Shared Utilities:**
- Purpose: Cross-cutting helpers, configuration, and constants
- Location: `src/lib/`, `src/components/runes/rune-config.ts`
- Contains: `cn()` utility, font config, Redis client, rune glow positioning, view formatting
- Depends on: clsx, tailwind-merge, @upstash/redis
- Used by: All layers

## Data Flow

**Content Build Pipeline:**

1. Author writes MDX in `content/posts/*.mdx` or `content/projects/*.mdx`
2. `velite` CLI runs as prebuild step (`npm run build` executes `velite && next build`)
3. Velite reads `velite.config.ts`, validates frontmatter against Zod schemas
4. Velite processes MDX through rehype-slug (heading IDs) and rehype-pretty-code (syntax highlighting with `github-dark-dimmed` theme)
5. Velite extracts metadata: reading time, excerpt (150 chars), table of contents
6. Velite outputs `.velite/posts.json` and `.velite/projects.json` (compiled MDX body strings + metadata)
7. Velite generates `.velite/index.js` (re-exports JSON) and `.velite/index.d.ts` (typed exports derived from `velite.config.ts` schemas)
8. Next.js build imports `posts` and `projects` from `@/.velite` (path alias to `./.velite`)
9. `generateStaticParams()` in `[slug]/page.tsx` files generates static HTML for each content item

**MDX Runtime Execution:**

1. Blog/project `[slug]/page.tsx` finds the matching post/project by slug from the Velite collection
2. Passes `post.body` (compiled MDX string) to `<MDXContent code={...} />` (`src/components/blog/mdx-content.tsx`)
3. `MDXContent` executes the compiled code via `new Function(code)` with `react/jsx-runtime`
4. The `<pre>` element is overridden with `<CodeBlock>` which wraps code blocks with a `<CopyButton>`
5. This approach avoids Shiki transformer hydration issues that occur with standard MDX component mapping

```typescript
// src/components/blog/mdx-content.tsx - Runtime MDX execution pattern
const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}
```

**View Count Flow (Single Post Page):**

1. `ViewCounter` client component (`src/components/blog/view-counter.tsx`) mounts
2. `useLayoutEffect` reads cached count from `localStorage` (key: `views:{slug}`) to prevent flash
3. `useEffect` fires `POST /api/views/{slug}` (once, guarded by `hasFired` ref)
4. API route (`src/app/api/views/[slug]/route.ts`) hashes visitor IP with SHA-256, checks Redis dedup key (`dedup:{slug}:{hash}`, 24h TTL, NX)
5. If first visit within 24h: `redis.incr(views:{slug})`, returns new count
6. If repeat: returns current count without incrementing
7. Component updates state and caches new count in localStorage

**View Count Flow (Listing Page):**

1. `FilteredPostList` wraps cards in `<ListingViewCounts slugs={allSlugs}>` context provider
2. `ListingViewCounts` (`src/components/blog/listing-view-counts.tsx`) reads cached counts via `useLayoutEffect`
3. Batch-fetches `GET /api/views?slugs=a,b,c` in `useEffect`
4. API route (`src/app/api/views/route.ts`) uses `redis.mget()` for all slugs in a single Redis call
5. `PostCardViewCount` child components read from React context via `useViewCount(slug)` hook

**Filter Flow (Blog and Projects Listing):**

1. `FilteredPostList` / `FilteredProjectList` client components read URL search params (`?tags=` or `?stack=`)
2. User clicks filter chip (TagChip/TechBadge in toggle mode via FilterBar)
3. `handleToggle` callback updates URL via `window.history.replaceState()` (no server navigation)
4. `useMemo` recomputes filtered items using AND logic (item must match ALL selected filters)
5. Content grid cross-fades (150ms opacity transition, skipped on initial render)
6. Scroll reveals are disabled when filters are active (items render immediately without animation)

**State Management:**

- No global state library. State is managed through:
  - **URL search params** -- filter state for blog tags and project stack (shareable/bookmarkable)
  - **React Context** -- `ViewCountsContext` for batch view counts on listing pages (`src/components/blog/listing-view-counts.tsx`)
  - **Component-local `useState`/`useRef`** -- animation state, menu open/close, reveal stages
  - **`localStorage`** -- view count read-through cache (non-critical, fail-silent)
  - **`useLayoutEffect`** -- synchronous reads before paint to prevent flash on repeat visits

## Key Abstractions

**Content Collections:**
- Purpose: Type-safe access to blog posts and projects with computed fields
- Definition: `velite.config.ts` defines Zod schemas with `.transform()` adding `permalink` and `readingTime`
- Consumption: `import { posts, projects } from '@/.velite'` -- static imports, no runtime fetching
- Types: Auto-generated in `.velite/index.d.ts` as `Post` and `Project`

**Filtered Lists (Render Prop Pattern):**
- Purpose: Reusable tag/stack filtering with URL state, transition animations, and pluggable chip rendering
- Implementation: `src/components/blog/filtered-post-list.tsx`, `src/components/projects/filtered-project-list.tsx`
- Both use `FilterBar` (`src/components/ui/filter-bar.tsx`) with a `renderChip` render prop callback
- `FilterBar` is domain-agnostic; blog passes `TagChip`, projects pass `TechBadge`

```typescript
// src/components/ui/filter-bar.tsx - Domain-agnostic filter with render prop
interface FilterBarProps {
  items: string[]
  activeItems: Set<string>
  onToggle: (item: string) => void
  onClear: () => void
  renderChip: (props: { item: string; active: boolean; onToggle: () => void; count?: number }) => ReactNode
  counts?: Record<string, number>
  label?: string
}
```

**Rune Configuration (Single Source of Truth):**
- Purpose: Centralize all Elder Futhark rune data and context-specific mappings
- Location: `src/components/runes/rune-config.ts`
- `ELDER_FUTHARK` constant holds all 24 runes with `char`, `code`, `name`, `meaning`, `keywords`, `aett`
- Context maps reference specific runes by symbolic association:
  - `NAV_RUNES` -- route-to-rune mapping (Othala=Home, Ansuz=Blog, Kenaz=Projects, Mannaz=About)
  - `BLOG_RUNES`, `PROJECT_RUNES` -- bullet/divider runes per domain
  - `POST_RUNES` -- separator rune (Jera) for post metadata
  - `DIVIDER_RUNES` -- default section divider (Dagaz)
- Server-safe module (no `'use client'`); imported by both server and client components

**MDXContent Runtime:**
- Purpose: Execute Velite-compiled MDX code strings as React components
- Location: `src/components/blog/mdx-content.tsx`
- Pattern: `new Function(code)({...runtime}).default` with component overrides (CodeBlock for `<pre>`)
- Shared by both blog posts and project pages

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page load (wraps all routes)
- Responsibilities: HTML structure, font CSS variables (`norse.variable`, `inter.variable`), Header/Footer, Vercel Analytics

**Home Page:**
- Location: `src/app/page.tsx`
- Triggers: `/` route
- Responsibilities: Renders `<Hero />` component (full-viewport with image, rune glows, orchestrated reveal)

**Blog Listing:**
- Location: `src/app/blog/page.tsx`
- Triggers: `/blog` route
- Responsibilities: Filters drafts, sorts by date, extracts all unique tags, renders `FilteredPostList` in `Suspense`

**Blog Post:**
- Location: `src/app/blog/[slug]/page.tsx`
- Triggers: `/blog/{slug}` route
- Responsibilities: `generateStaticParams()` for all posts, `generateMetadata()` for SEO, two-column layout (MDX content + TOC sidebar), view counter, tag chips

**Projects Listing:**
- Location: `src/app/projects/page.tsx`
- Triggers: `/projects` route
- Responsibilities: Sorts by featured/date, extracts all unique stack items, renders `FilteredProjectList` in `Suspense`

**Project Detail:**
- Location: `src/app/projects/[slug]/page.tsx`
- Triggers: `/projects/{slug}` route
- Responsibilities: `generateStaticParams()` for all projects, `generateMetadata()` with OpenGraph image, MDX rendering with `prose-projects` class, tech badges, GitHub/demo links

**About Page:**
- Location: `src/app/about/page.tsx`
- Triggers: `/about` route
- Responsibilities: Static bio page with headshot image, disabled resume download button (placeholder)

**View Count API (Batch):**
- Location: `src/app/api/views/route.ts`
- Triggers: `GET /api/views?slugs=a,b,c`
- Responsibilities: Batch fetch view counts from Redis via `mget`, returns `{ counts: Record<string, number> }`

**View Count API (Single):**
- Location: `src/app/api/views/[slug]/route.ts`
- Triggers: `GET /api/views/{slug}` (read) or `POST /api/views/{slug}` (increment)
- Responsibilities: GET returns current count; POST increments with IP-based dedup (SHA-256 hash, 24h TTL via Redis NX)

**SEO Files:**
- Location: `src/app/sitemap.ts` -- generates `/sitemap.xml` from static routes + content collections
- Location: `src/app/robots.ts` -- generates `/robots.txt` (allow all, reference sitemap)

## Rendering Strategy

| Route | Strategy | Client Components Used |
|-------|----------|----------------------|
| `/` | SSG | `Hero` (animations, ResizeObserver, image load) |
| `/blog` | SSG | `FilteredPostList`, `ListingViewCounts`, `PostCardViewCount`, `ScrollReveal` |
| `/blog/[slug]` | SSG via `generateStaticParams()` | `MDXContent`, `CodeBlock`, `CopyButton`, `ViewCounter` |
| `/projects` | SSG | `FilteredProjectList`, `ScrollReveal` |
| `/projects/[slug]` | SSG via `generateStaticParams()` | `MDXContent`, `CodeBlock`, `CopyButton` |
| `/about` | SSG | None (fully static) |
| `/api/views/*` | Dynamic (`force-dynamic`) | N/A (serverless function) |
| `/sitemap.xml` | SSG | None |
| `/robots.txt` | SSG | None |

All pages use `Header` (client component for mobile menu) via root layout.

## Error Handling

**Strategy:** Fail silently for non-critical features; `notFound()` for missing content

**Patterns:**
- **Content not found:** `posts.find(p => p.slug === slug)` returns undefined, then `notFound()` triggers the 404 page (`src/app/not-found.tsx`)
- **View count failures:** All fetch calls in `ViewCounter` and `ListingViewCounts` use `.catch(() => {})` -- view counts never block rendering
- **Redis errors:** API routes catch Redis errors, log to console with `[views]` prefix, return 500 JSON `{ error: '...' }`
- **localStorage failures:** `getCachedViews`/`setCachedViews` wrap access in try/catch, return null on failure (storage full or unavailable)
- **Font fallbacks:** Norse font falls back to Arial, Helvetica Neue, sans-serif (`src/lib/fonts.ts`)
- **No global error boundary:** Relies on Next.js built-in error handling

## Cross-Cutting Concerns

**Accessibility:**
- Reduced motion: Detected on mount via `prefers-reduced-motion` media query in `src/components/hero.tsx` and `src/components/ui/scroll-reveal.tsx`; listens for live changes; all animations skip when enabled; CSS fallbacks in `src/app/globals.css` `@media (prefers-reduced-motion: reduce)` block
- Focus management: Mobile menu uses `inert` attribute on `<main>` instead of JavaScript focus traps; focus returns to hamburger button on close (`src/components/layout/header.tsx`)
- ARIA: Mobile menu has `role="dialog"`, `aria-modal="true"`, `aria-expanded` on hamburger button; filter chips use `aria-pressed`; rune characters use `aria-hidden="true"`
- Semantic HTML: `<article>`, `<header>`, `<nav>`, `<footer>`, `<time>`, `<aside>` used throughout
- WCAG contrast: Hero includes radial gradient scrim for text contrast; `scripts/validate-colors.mjs` validates palette contrast ratios

**Animation Orchestration:**
- Hero reveal sequence in `src/components/hero.tsx`: image blur-to-sharp (350ms CSS transition) -> text fade-up (600ms delay, 500ms animation) -> rune glow cascade (500ms after text, 3000ms total cascade)
- Rune glow entrance delays: Fisher-Yates shuffled power curve (exponent 1.5) produces randomized spatial order each load
- Rune glow breathing: Non-round durations (5.0s-7.5s) prevent visual synchronization across 14 glows
- Glow positions: `computeGlowPositions()` in `src/lib/rune-glows.ts` maps image-space fractions to container coordinates accounting for `object-fit: cover` scaling; recalculated via ResizeObserver
- Scroll reveal: `src/components/ui/scroll-reveal.tsx` wraps elements with single-fire IntersectionObserver (threshold 0.1, unobserves after first trigger)
- All keyframe animations defined in CSS (`src/app/globals.css`), controlled by class toggling in JS

**Scroll Lock:**
- Mobile menu uses `position: fixed` approach with scroll position preservation (iOS Safari safe)
- Scroll position saved before lock, restored after unlock
- Implemented in `src/components/layout/header.tsx` via `useEffect` cleanup function

**Validation:**
- Content validation: Zod schemas in `velite.config.ts` enforce frontmatter shape at build time (build fails on invalid content)
- No runtime input validation on API routes (slug params taken as-is from URL)

**Logging:**
- `console.error('[views] Redis error:', error)` in both API route files
- No structured logging framework

**Authentication:** Not applicable; no user authentication or private content.

**SEO and Metadata:**
- Root layout sets base metadata template with `title.template: '%s | keech.dev'`
- Each page exports `metadata` or `generateMetadata()` for route-specific OpenGraph/Twitter cards
- `src/app/sitemap.ts` generates sitemap from static routes + all content collections
- `src/app/robots.ts` allows all crawlers, references sitemap

---

*Architecture analysis: 2026-03-22*
