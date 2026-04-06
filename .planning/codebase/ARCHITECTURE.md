# Architecture

**Analysis Date:** 2026-04-05

## Pattern Overview

**Overall:** Next.js App Router with static-first content pipeline

**Key Characteristics:**
- Server components by default; client components used only where browser APIs are required
- Content is statically compiled at build time by Velite (separate prebuild step) into type-safe collections
- No database — all content lives in MDX files; only dynamic runtime data is view counts via Upstash Redis
- Middleware (`src/proxy.ts`) handles security headers on all routes

## Layers

**Content Source:**
- Purpose: Raw authored content in MDX format
- Location: `content/posts/`, `content/projects/`
- Contains: MDX files with YAML frontmatter
- Depends on: Nothing (pure authoring layer)
- Used by: Velite compilation pipeline

**Content Compilation (Velite):**
- Purpose: Transform MDX → type-safe JSON collections with processed HTML
- Location: `velite.config.ts` → output in `.velite/` (gitignored)
- Contains: Zod schemas, rehype plugins (slug, pretty-code, list-role), `computedFields` (`permalink`, `readingTime`)
- Depends on: `content/posts/`, `content/projects/`
- Used by: Any server component via `import { posts, projects } from '@/.velite'`

**App Layer (Next.js pages):**
- Purpose: Route definitions, metadata, static param generation, data access
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, API route handlers
- Depends on: `@/.velite` for content data, `src/lib/` for utilities, `src/components/` for UI
- Used by: Next.js router

**Component Layer:**
- Purpose: Reusable UI — both server and client components
- Location: `src/components/`
- Contains: Domain-grouped components (`blog/`, `projects/`, `layout/`, `ui/`, `runes/`, `icons/`)
- Depends on: `src/lib/`, `src/hooks/`
- Used by: `src/app/` pages

**Hooks Layer:**
- Purpose: Client-side stateful logic extracted from components
- Location: `src/hooks/`
- Contains: `use-filtered-list.ts`, `use-hero-animation.ts`, `use-glow-positions.ts`, `use-media-query.ts`, `use-view-store.ts`
- Depends on: `src/lib/` (utilities)
- Used by: Client components in `src/components/`

**Library Layer:**
- Purpose: Shared utilities, data access, configuration
- Location: `src/lib/`
- Contains: `redis.ts`, `rate-limit.ts`, `validation.ts`, `views.ts`, `fonts.ts`, `format.ts`, `utils.ts`, `rune-glows.ts`
- Depends on: External SDKs (`@upstash/redis`, `@upstash/ratelimit`)
- Used by: Both `src/app/` and `src/components/`

## Data Flow

**Blog/Project page render (static):**

1. At build time: Velite reads `content/posts/*.mdx`, compiles to HTML+metadata, outputs to `.velite/`
2. `src/app/blog/page.tsx` imports `posts` from `@/.velite`, filters drafts, sorts by date
3. Server component passes filtered data as props to `FilteredPostList` (client component, wrapped in `<Suspense>`)
4. `FilteredPostList` reads URL search params to apply tag filters via `useFilteredList` hook
5. Posts render as `PostCard` components, wrapped in `ScrollReveal` when not filtering

**View count flow (dynamic, non-critical):**

1. `ListingViewCounts` (client) fetches `GET /api/views?slugs=a,b,c` on mount
2. API route validates slugs, batch-queries `mget` on Upstash Redis
3. Results stored in React context and written to `localStorage` as read-through cache
4. On individual post pages, `ViewCounter` POSTs to `/api/views/[slug]` on mount (single-fire ref guard)
5. POST handler validates slug, applies sliding-window rate limit, then sets/checks dedup key (`dedup:{slug}:{ipHash}` with 24h TTL) before calling `incr`

**State Management:**
- Filter state: URL search params (via `window.history.replaceState`) — no React state for filter values
- View counts: `localStorage` as client cache, React context for listing-page distribution
- Hero animation: local component state in `useHeroAnimation` hook with `setTimeout` orchestration

## Key Abstractions

**Velite Collections (`posts`, `projects`):**
- Purpose: Type-safe content collections generated from MDX frontmatter + compiled body
- Import: `import { posts, projects } from '@/.velite'`
- Schema defined in: `velite.config.ts`
- Generated to: `.velite/` (not committed)

**`MDXContent` component:**
- Purpose: Render pre-compiled HTML from Velite's `body` field; attach `CodeBlockEnhancer` for copy buttons
- Location: `src/components/blog/mdx-content.tsx`
- Pattern: `dangerouslySetInnerHTML` with `CodeBlockEnhancer` as a DOM-manipulating sibling; avoids Shiki hydration issues

**`useFilteredList` hook:**
- Purpose: Generic URL-driven filter state for both blog tags and project stack filters
- Location: `src/hooks/use-filtered-list.ts`
- Pattern: Reads `searchParams`, writes via `replaceState`; AND logic for multi-select; pending state via double `requestAnimationFrame`

**Rune Configuration (`ELDER_FUTHARK`, `NAV_RUNES`, etc.):**
- Purpose: Single source of truth for all rune data and context mappings
- Location: `src/components/runes/rune-config.ts`
- Pattern: Server-safe module (no `'use client'`); consumed by nav, hero glows, post metadata

**`cn()` utility:**
- Purpose: Conflict-safe Tailwind class merging
- Location: `src/lib/utils.ts`
- Pattern: `clsx` + `tailwind-merge`; used in all components

## Entry Points

**Root layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: HTML shell, font CSS variables, `<Header>`, `<Footer>`, Vercel Analytics

**Middleware (security proxy):**
- Location: `src/proxy.ts`
- Triggers: All routes except `_next/static`, `_next/image`, favicon, sitemap, robots
- Responsibilities: Sets CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

**Velite build:**
- Location: `velite.config.ts`
- Triggers: `npm run build` (sequential before `next build`) or `npm run velite`
- Responsibilities: Compile MDX collections to `.velite/`, copy assets to `public/static/`

**API routes:**
- `src/app/api/views/route.ts` — `GET /api/views?slugs=...` batch view count fetch
- `src/app/api/views/[slug]/route.ts` — `GET /api/views/[slug]` single fetch, `POST /api/views/[slug]` increment with dedup+rate-limit

**SEO/feed routes:**
- `src/app/sitemap.ts` — dynamic XML sitemap
- `src/app/robots.ts` — robots.txt
- `src/app/feed.xml/route.ts` — RSS 2.0 feed
- `src/app/opengraph-image.tsx` — dynamic root OG image
- `src/app/blog/[slug]/opengraph-image.tsx` — per-post OG image

## Error Handling

**Strategy:** Route-level error boundaries with intentional plain `<a>` tags for navigation (client router may be broken during error state)

**Patterns:**
- `src/app/error.tsx` — catches errors in main route segment; renders "Try Again" + "Go Home"
- `src/app/global-error.tsx` — root-level boundary for catastrophic failures
- `src/app/blog/[slug]/error.tsx` — blog post–specific boundary
- `src/app/not-found.tsx` — 404 handler
- `src/app/loading.tsx`, `src/app/blog/loading.tsx`, `src/app/projects/loading.tsx` — loading skeletons
- View count errors: always caught and silenced — non-critical UI; cached values remain

## Cross-Cutting Concerns

**Logging:** `console.error` in API routes only (e.g., `[views] Redis error:`)
**Validation:** `src/lib/validation.ts` — slug format regex + batch size limit applied at API boundary
**Rate Limiting:** `src/lib/rate-limit.ts` — Upstash sliding window (10 req / 60s) on view-count POST
**Authentication:** None — read-only public site; Redis credentials via env vars only
**Reduced Motion:** `useMediaQuery('(prefers-reduced-motion: reduce)')` checked in `ScrollReveal`, `useHeroAnimation`, `use-glow-positions` — all animations disabled when set

---

*Architecture analysis: 2026-04-05*
