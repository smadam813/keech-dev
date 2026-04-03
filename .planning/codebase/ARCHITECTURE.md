# Architecture

**Analysis Date:** 2026-04-03

## Pattern Overview

**Overall:** Static-first Next.js 16 App Router monolith with build-time content compilation via Velite and a minimal dynamic API surface (view counts via Upstash Redis)

**Key Characteristics:**
- Server Components by default; `'use client'` only where browser APIs are needed
- Content (MDX) compiled at build time by Velite into type-safe collections, imported as static data
- Two API routes handle the only dynamic feature (view counts via Upstash Redis)
- No middleware, no ORM, no database beyond Redis key-value store
- No global state library; URL search params for filter state, React Context for batch view counts
- Single-theme neobrutalist design system defined entirely in CSS (`globals.css` `@theme` directive)
- Deployed to Vercel via git-push (no CI/CD pipeline)

## Layers

**Content Pipeline (Build Time):**
- Purpose: Transform MDX source files into type-safe, queryable collections
- Location: `content/posts/`, `content/projects/` (source) -> `.velite/` (output, gitignored)
- Config: `velite.config.ts`
- Contains: Zod-validated frontmatter schemas, rehype plugins (slug, pretty-code), computed fields (permalink, readingTime, excerpt, toc)
- Depends on: Velite, rehype-pretty-code, rehype-slug, Shiki
- Used by: All page components that import `posts` or `projects` from `@/.velite`

**Presentation Layer (React Components):**
- Purpose: Render pages and UI
- Location: `src/app/` (routes), `src/components/` (shared components)
- Contains: Server components (pages, layouts) and client components (interactive UI)
- Depends on: Velite collections, hooks, lib utilities
- Used by: Next.js runtime

**Hooks Layer (Client Logic):**
- Purpose: Encapsulate stateful client-side behavior into reusable units
- Location: `src/hooks/`
- Contains:
  - `use-filtered-list.ts` -- generic URL-synced AND-filter with transition state
  - `use-hero-animation.ts` -- hero reveal sequence orchestration (3-beat: blur->text->glows)
  - `use-glow-positions.ts` -- responsive rune glow positioning via ResizeObserver
- Depends on: Next.js navigation hooks (`useSearchParams`, `usePathname`), browser APIs (matchMedia, ResizeObserver)
- Used by: Client components

**Library Layer (Shared Utilities):**
- Purpose: Pure functions, configuration, and external service clients
- Location: `src/lib/`
- Contains:
  - `utils.ts` -- `cn()` (clsx + tailwind-merge)
  - `fonts.ts` -- Norse + Inter font config
  - `format.ts` -- `formatDate()` helper
  - `views.ts` -- `formatViewCount()`, localStorage cache helpers (`getCachedViews`, `setCachedViews`)
  - `validation.ts` -- slug validation (regex, length, batch limits)
  - `rate-limit.ts` -- Upstash rate limiter instance (sliding window 10 req/60s)
  - `redis.ts` -- Upstash Redis client (`Redis.fromEnv()`)
  - `rune-glows.ts` -- hero rune glow positioning data + `computeGlowPositions()`
- Depends on: External packages (clsx, tailwind-merge, @upstash/redis, @upstash/ratelimit)
- Used by: Components, hooks, API routes

**API Layer (Server Runtime):**
- Purpose: Dynamic view count tracking with rate limiting and IP deduplication
- Location: `src/app/api/views/route.ts`, `src/app/api/views/[slug]/route.ts`
- Contains: Two route handlers (batch GET, single GET/POST)
- Depends on: `src/lib/redis.ts`, `src/lib/validation.ts`, `src/lib/rate-limit.ts`
- Used by: Client components (`ViewCounter`, `ListingViewCounts`) via fetch

## Data Flow

**Content Build Pipeline:**

1. MDX files authored in `content/posts/*.mdx` and `content/projects/*.mdx`
2. `velite` CLI runs as prebuild step (`npm run build` = `velite && next build`); in dev, `velite --watch` runs in parallel with Next.js
3. Velite reads `velite.config.ts`, parses frontmatter against Zod schemas
4. `.transform()` adds computed fields: `permalink` (`/blog/{slug}` or `/projects/{slug}`), `readingTime`
5. Velite extracts `toc` (table of contents), `excerpt` (150 chars), `metadata` (readingTime)
6. Rehype plugins process MDX body: `rehype-slug` adds heading IDs, `rehype-pretty-code` applies Shiki syntax highlighting (`github-dark-dimmed` theme)
7. Output written to `.velite/` directory (gitignored): `posts.json`, `projects.json`, `index.js`, `index.d.ts`
8. Page components import collections: `import { posts, projects } from '@/.velite'` (path alias in `tsconfig.json`)
9. `generateStaticParams()` in `[slug]/page.tsx` files pre-renders all content pages at build time

**MDX Runtime Execution:**

1. Blog/project `[slug]/page.tsx` (Server Component) finds matching item by slug
2. Passes `post.body` (compiled MDX string) to `<MDXContent code={...} />` client component
3. `MDXContent` (`src/components/blog/mdx-content.tsx`) executes code via `new Function(code)({...runtime}).default`
4. Default component overrides: `<pre>` -> `CodeBlock` (adds copy button), `<ul>`/`<ol>` -> elements with `role="list"`
5. Try/catch wraps execution; on failure, renders `<MDXFallback>` UI with link back to blog listing

**View Count Flow (Single Post Page):**

1. `ViewCounter` (`src/components/blog/view-counter.tsx`) mounts on post page
2. `useLayoutEffect` reads localStorage cache (`views:{slug}`) to prevent count flash on repeat visits
3. `useEffect` fires `POST /api/views/{slug}` (once, guarded by `hasFired` ref)
4. API route (`src/app/api/views/[slug]/route.ts`):
   - Validates slug via `validateSlug()` (regex `^[a-z0-9-]+$`, max 100 chars)
   - Extracts IP from `x-forwarded-for` header
   - Applies rate limit via `viewsRateLimit.limit(ip)` (10 req/60s sliding window)
   - Hashes IP with SHA-256
   - Checks Redis dedup key (`dedup:{slug}:{hash}`, NX, 24h TTL)
   - If new visitor: `redis.incr(views:{slug})`, returns count + `deduplicated: false`
   - If repeat: returns current count + `deduplicated: true`
5. Client updates state and writes to localStorage cache
6. All fetches wrapped in `.catch(() => {})` -- view counts never block rendering

**View Count Flow (Listing Page):**

1. `FilteredPostList` wraps cards in `<ListingViewCounts slugs={allSlugs}>` context provider
2. `ListingViewCounts` (`src/components/blog/listing-view-counts.tsx`):
   - `useLayoutEffect` reads cached counts from localStorage
   - `useEffect` batch-fetches `GET /api/views?slugs=a,b,c`
3. API route (`src/app/api/views/route.ts`) validates slugs (max 20), uses `redis.mget()` for single Redis call
4. `PostCardViewCount` child components read from `ViewCountsContext` via `useViewCount(slug)` hook

**Filter Flow (Blog and Projects Listings):**

1. Server component sorts/filters Velite collections, extracts available filter values (tags or stack)
2. Passes data to client component (`FilteredPostList` or `FilteredProjectList`) wrapped in `<Suspense>`
3. Client component uses `useFilteredList` hook (`src/hooks/use-filtered-list.ts`):
   - Reads active filters from URL search params (`?tags=x,y` or `?stack=x,y`)
   - AND-logic filtering: items must match ALL selected filter values
   - Computes static filter counts (total items per filter value)
4. `handleToggle` updates URL via `window.history.replaceState()` (no server re-render, no page navigation)
5. 150ms opacity transition on content change (skipped on initial render and when `prefers-reduced-motion`)
6. `ScrollReveal` wrapping is disabled when filters are active (items render immediately)

**State Management:**
- No global state library (no Redux, Zustand, etc.)
- URL search params for filter state (synced via `useSearchParams()`, shareable/bookmarkable)
- React Context for batch view counts (`ViewCountsContext` in `ListingViewCounts`)
- localStorage for view count read-through cache (fail-silent)
- `useLayoutEffect` for synchronous reads before paint to prevent flash
- Component-local `useState`/`useRef` for all other state

## Key Abstractions

**Velite Content Collections:**
- Purpose: Type-safe access to blog posts and projects with computed fields
- Definition: `velite.config.ts` defines Zod schemas with `.transform()` adding `permalink`, `readingTime`
- Consumption: `import { posts, projects } from '@/.velite'` -- static imports, treated as arrays in Server Components
- Types: Auto-generated in `.velite/index.d.ts` as `Post` and `Project`

**useFilteredList Hook:**
- Purpose: Generic URL-synced AND-filter with transition state and filter counts
- Location: `src/hooks/use-filtered-list.ts`
- Pattern: Generic `<T>` hook parameterized by item type, filter accessor (`getItemValues`), and URL param name
- Returns: `filteredItems`, `activeFilters`, `isFiltering`, `isTransitioning`, `filterCounts`, `handleToggle`, `handleClear`
- Used by: `src/components/blog/filtered-post-list.tsx` (param: `tags`), `src/components/projects/filtered-project-list.tsx` (param: `stack`)

**MDXContent Runtime:**
- Purpose: Execute Velite-compiled MDX strings as React components with error handling
- Location: `src/components/blog/mdx-content.tsx`
- Pattern: `new Function(code)({...runtime}).default` with component overrides and try/catch fallback
- Shared by: Blog posts and project pages (both use `<MDXContent code={item.body} />`)

**Rune Design System:**
- Purpose: Elder Futhark rune theming integrated into navigation, hero, content bullets, and dividers
- Config: `src/components/runes/rune-config.ts` -- all 24 runes with char, code, name, meaning, keywords, aett
- Context maps: `NAV_RUNES` (route-to-rune), `POST_RUNES` (separator), `BLOG_RUNES`/`PROJECT_RUNES` (bullets), `DIVIDER_RUNES`
- Hero data: `src/lib/rune-glows.ts` -- 14 glow positions as 0-1 fraction coordinates, colored by aett (amber, teal, gold)
- CSS bullets: `globals.css` `.prose ul > li::before` uses Ansuz rune; `.prose-projects` variant uses Kenaz

**FilterBar + FilterChip (Render Prop Pattern):**
- Purpose: Domain-agnostic filter UI composed by blog and project listing components
- `src/components/ui/filter-bar.tsx`: Receives `renderChip` callback, handles layout and clear button
- `src/components/ui/filter-chip.tsx`: Chip component with `variant` prop (`tag`, `tech`, or default)
- Blog passes `variant="tag"`, projects pass `variant="tech"`

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render (wraps all routes)
- Responsibilities: HTML shell, font CSS variables (`norse.variable`, `inter.variable`), site-wide metadata, `<Header>`, `<Footer>`, Vercel Analytics, RSS alternate link

**Home Page:**
- Location: `src/app/page.tsx`
- Renders: `<Hero>` component (full-viewport animated hero with rune glows)

**Blog Listing:**
- Location: `src/app/blog/page.tsx`
- Renders: Filters out drafts, sorts by date, extracts unique tags, renders `FilteredPostList` in `<Suspense>`

**Blog Post:**
- Location: `src/app/blog/[slug]/page.tsx`
- Renders: Two-column layout (MDX content + TOC sidebar), mobile sticky TOC, view counter, tag chips as links to filtered listing
- SSG: `generateStaticParams()` for all posts, `generateMetadata()` for per-page SEO

**Projects Listing:**
- Location: `src/app/projects/page.tsx`
- Renders: Sorts by featured/date, extracts unique stack items, renders `FilteredProjectList` in `<Suspense>`

**Project Detail:**
- Location: `src/app/projects/[slug]/page.tsx`
- Renders: MDX content with `prose-projects` class, project image, GitHub/demo links, stack badges
- SSG: `generateStaticParams()` for all projects

**About:**
- Location: `src/app/about/page.tsx`
- Renders: Static bio page with headshot image

**API - Batch Views:**
- Location: `src/app/api/views/route.ts`
- Triggers: `GET /api/views?slugs=a,b,c` (listing page client fetch)

**API - Single Views:**
- Location: `src/app/api/views/[slug]/route.ts`
- Triggers: `GET /api/views/{slug}` (read) or `POST /api/views/{slug}` (increment with dedup)

**SEO Assets:**
- `src/app/sitemap.ts`: Dynamic sitemap from static routes + Velite collections
- `src/app/robots.ts`: Static robots.txt (allow all, reference sitemap)
- `src/app/feed.xml/route.ts`: RSS 2.0 feed from published posts (1h cache)
- `src/app/opengraph-image.tsx`: Dynamic OG image generation

## Rendering Strategy

| Route | Strategy | Client Components Used |
|-------|----------|----------------------|
| `/` | SSG | `Hero` (animations, ResizeObserver, image load) |
| `/blog` | SSG | `FilteredPostList`, `ListingViewCounts`, `PostCardViewCount`, `ScrollReveal`, `FilterChip` |
| `/blog/[slug]` | SSG via `generateStaticParams()` | `MDXContent`, `CodeBlock`, `CopyButton`, `ViewCounter`, `MobileToc`, `FilterChip` |
| `/projects` | SSG | `FilteredProjectList`, `ScrollReveal`, `FilterChip` |
| `/projects/[slug]` | SSG via `generateStaticParams()` | `MDXContent`, `CodeBlock`, `CopyButton`, `FilterChip` |
| `/about` | SSG | None (fully static) |
| `/api/views/*` | Dynamic (`force-dynamic`) | N/A (serverless function) |
| `/feed.xml` | Dynamic (route handler) | N/A |
| `/sitemap.xml` | SSG | None |
| `/robots.txt` | SSG | None |

All pages include `Header` (client component for mobile menu) via root layout.

## Error Handling

**Strategy:** Graceful degradation with neobrutalist-styled error boundaries; fail silently for non-critical features

**Patterns:**
- `src/app/error.tsx`: Route-level error boundary (client component with `reset()` + "Go Home" link)
- `src/app/global-error.tsx`: Root error boundary (re-declares full `<html>` shell with fonts/styles)
- `src/app/not-found.tsx`: Custom 404 page
- `src/app/loading.tsx`: Loading skeleton (Suspense fallback)
- `src/components/blog/mdx-content.tsx`: Try/catch around `new Function()` with `<MDXFallback>` UI
- View count API routes: try/catch with `console.error('[views]')` prefix, returns 500 JSON response
- View count client components: `.catch(() => {})` silent failure (non-critical UI, cached values remain)
- Rate limiting: 429 response from `@upstash/ratelimit` sliding window

## Cross-Cutting Concerns

**Security Headers:** CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin) configured in `next.config.ts` via `headers()`. CSP allows `unsafe-eval` (required for MDX `new Function()`) and `unsafe-inline` (Tailwind runtime styles). `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`.

**Input Validation:** `src/lib/validation.ts` validates all slug input to API routes: regex `^[a-z0-9-]+$`, max 100 chars per slug, max 20 slugs per batch request. Both API routes validate before any Redis operation.

**Rate Limiting:** `src/lib/rate-limit.ts` creates `viewsRateLimit` using `@upstash/ratelimit` sliding window (10 requests per 60 seconds per IP). Applied only on POST to `/api/views/[slug]`.

**Accessibility:**
- Reduced-motion respected throughout: CSS `@media (prefers-reduced-motion: reduce)` overrides in `globals.css` + JS `matchMedia` checks with live change listeners in `use-hero-animation.ts` and `scroll-reveal.tsx`
- Mobile menu: `inert` attribute on `<main>` for focus management, `aria-expanded`/`aria-controls` on hamburger, `role="dialog"` + `aria-modal="true"` on overlay, Escape key closes, focus returns to button on close
- Mobile TOC: `aria-expanded`, `aria-controls`, click-to-close on link selection
- MDX overrides: `<ul>` and `<ol>` get `role="list"` (Safari VoiceOver fix)
- Semantic HTML: `<article>`, `<header>`, `<nav>`, `<footer>`, `<time>`, `<aside>` used throughout

**Animation Orchestration:**
- Hero reveal sequence (`src/hooks/use-hero-animation.ts`): image blur-to-sharp (350ms CSS transition) -> text fade-up (600ms delay) -> rune glow cascade (500ms after text, 3s total cascade)
- Rune glow entrance: Fisher-Yates shuffled power curve delays (exponent 1.5) for randomized spatial order each load
- Rune glow breathing: Non-round durations (5.0s-7.5s) prevent visual synchronization
- Glow positions: `computeGlowPositions()` in `src/lib/rune-glows.ts` maps 0-1 fraction coordinates to container pixels accounting for `object-fit: cover` scaling; recalculated via ResizeObserver in `src/hooks/use-glow-positions.ts`
- Scroll reveal: `src/components/ui/scroll-reveal.tsx` wraps elements with single-fire IntersectionObserver (threshold 0.1)
- All keyframe animations defined in CSS (`globals.css`), controlled by class toggling in JS
- Filter transition: 150ms opacity fade on content grid change, skipped on initial render

**Logging:** `console.error()` with bracketed prefix tags: `[views]` (API routes), `[app]` (error boundary), `[global]` (global error), `[mdx]` (MDX render failures).

**SEO:** Per-page `generateMetadata()` or `metadata` export, root layout title template (`%s | keech.dev`), `sitemap.ts`, `robots.ts`, `feed.xml/route.ts`, `opengraph-image.tsx`. RSS alternate declared in root layout metadata.

---

*Architecture analysis: 2026-04-03*
