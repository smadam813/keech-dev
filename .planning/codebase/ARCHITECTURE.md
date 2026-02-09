# Architecture

**Analysis Date:** 2026-02-08

## Pattern Overview

**Overall:** Next.js static site generation (SSG) with content-driven pages. Client-side enhancement for navigation and interactive components via strategic use of `'use client'`. All content is pre-compiled at build time through Velite.

**Key Characteristics:**
- Statically generated pages (SSG) via `generateStaticParams()` for all content routes
- Content pipeline: MDX source files → Velite compilation → type-safe collections in `.velite/`
- Minimal client-side JavaScript: only 6 components use `'use client'` directive
- Single theme (no dark mode): neobrutalist visual identity with Elder Futhark rune decorations
- No API routes, no database, no server-side data fetching

## Layers

**Presentation (Pages & Layouts):**
- Purpose: Route-level components that coordinate layout and content display
- Location: `src/app/` (Next.js App Router structure)
- Contains: Page components, layout wrapper, metadata/SEO configuration
- Depends on: `@/components/*`, `@/.velite` (content collections)
- Used by: Next.js router; serves as HTTP entry points

**Components:**
- Purpose: Reusable UI elements organized by feature domain
- Location: `src/components/` with subdirectories: `layout/`, `blog/`, `projects/`, `ui/`, `runes/`
- Contains: React functional components, mostly server components with strategic client boundaries
- Depends on: `@/lib/*`, Next.js features (Image, Link), external packages (lucide-react, tailwindcss)
- Used by: Page components and other components

**Utilities & Styling:**
- Purpose: Shared functions, font configuration, design tokens
- Location: `src/lib/` (utilities), `src/app/globals.css` (design system)
- Contains: `cn()` utility for className merging, font loaders, design tokens via CSS custom properties
- Depends on: External libraries (clsx, tailwind-merge)
- Used by: All components and pages

**Content Collections:**
- Purpose: Type-safe, pre-compiled content from MDX files
- Location: `.velite/` (generated at build time), source: `content/posts/` and `content/projects/`
- Contains: Two Zod-validated collections (posts, projects) with extracted metadata (TOC, reading time, excerpts)
- Depends on: Velite compiler configured in `velite.config.ts`
- Used by: Page components to fetch and render content

## Data Flow

**Content Compilation Pipeline:**

1. Developer writes/updates MDX files in `content/posts/` or `content/projects/`
2. `npm run build` (or `npm run dev --watch`) triggers Velite preprocessor
3. Velite applies:
   - Zod schema validation (title, slug, date, tags, body, etc.)
   - rehype-slug: adds IDs to headings for TOC generation
   - rehype-pretty-code: syntax highlights code blocks with github-dark-dimmed theme
   - Metadata extraction: reading time, excerpt (first 150 chars)
   - MDX body serialized as executable code string
4. Compiled collections written to `.velite/index.ts` (type-safe exports)
5. Page components import: `import { posts, projects } from '@/.velite'`

**Page Render Flow (Static Generation):**

1. `src/app/blog/[slug]/page.tsx` calls `generateStaticParams()` to enumerate all blog routes
2. Next.js pre-renders static HTML for each slug at build time
3. For each post, `generateMetadata()` extracts metadata for SEO (OpenGraph, Twitter cards)
4. Page component fetches post from in-memory collection, renders layout with:
   - Post header: title, publish date, update date, tags
   - MDXContent: executes compiled body string via `new Function()`
   - TableOfContents: sidebar with heading links (desktop only)
5. Static HTML cached; no server-side rendering or incremental generation

**Runtime MDX Execution:**

1. `MDXContent` component (`src/components/blog/mdx-content.tsx`) receives serialized MDX body string
2. Uses `new Function(code)` to create React component from string
3. Passes React runtime (`react/jsx-runtime`) to function: allows component rendering
4. Overrides `pre` elements with `CodeBlock` wrapper for copy button
5. Returns rendered JSX tree

**State Management:**

- **Content state:** Velite collections are immutable, in-memory, readonly at runtime
- **UI state:** React hooks only in 6 client components (Header, CodeBlock, CopyButton, ScrollReveal)
- **Global styles:** Tailwind CSS utilities + CSS custom properties in `globals.css`
- **Layout state:** Header manages mobile menu state (open/closed) and scroll lock

## Key Abstractions

**Content Collection (Velite Schemas):**
- Purpose: Type-safe, validated content with extracted metadata
- Examples: `src/app/blog/page.tsx` (imports and filters posts), `src/app/blog/[slug]/page.tsx` (renders individual post)
- Pattern: Declarative Zod schema defines post/project shape; compiler extracts metadata automatically

**Component Boundaries (`'use client'`):**
- Purpose: Identify which interactive features require client-side JavaScript
- Examples: `Header` (navigation, menu state), `CodeBlock` (copy button), `ScrollReveal` (IntersectionObserver), `CopyButton` (clipboard API)
- Pattern: Minimal boundary placement: only components needing browser APIs or React hooks marked `'use client'`

**Card Components (PostCard, ProjectCard):**
- Purpose: Reusable content preview with consistent neobrutalist styling
- Examples: `src/components/blog/post-card.tsx`, `src/components/projects/project-card.tsx`
- Pattern: Link wrapper + article element; hover states trigger shadow and translate transforms (neobrutalist style)

**Rune Configuration:**
- Purpose: Single source of truth for Elder Futhark runes and their semantic mappings
- Examples: `NAV_RUNES`, `BLOG_RUNES`, `PROJECT_RUNES`, `DIVIDER_RUNES`
- Pattern: Centralized config in `src/components/runes/rune-config.ts`; context-aware mappings for navigation and content sections

## Entry Points

**Home (/):**
- Location: `src/app/page.tsx`
- Triggers: User navigates to root URL
- Responsibilities: Renders Hero component (full-screen section with background image, title overlay)

**Blog Index (/blog):**
- Location: `src/app/blog/page.tsx`
- Triggers: User navigates to /blog
- Responsibilities: Fetches all non-draft posts, sorts by date (newest first), renders grid of PostCard components with ScrollReveal animation

**Blog Post (/blog/[slug]):**
- Location: `src/app/blog/[slug]/page.tsx`
- Triggers: User navigates to /blog/{post-slug}
- Responsibilities: Generates static params, fetches single post by slug, renders article layout with title, metadata, tags, table of contents sidebar, MDX body

**Projects Index (/projects):**
- Location: `src/app/projects/page.tsx`
- Triggers: User navigates to /projects
- Responsibilities: Fetches all projects, sorts featured first then by date, renders grid with ProjectCard components

**Project Detail (/projects/[slug]):**
- Location: `src/app/projects/[slug]/page.tsx` (mirrors blog structure)
- Triggers: User navigates to /projects/{project-slug}
- Responsibilities: Similar to blog post: static generation, metadata, rendering project detail with MDX body

**About (/about):**
- Location: `src/app/about/page.tsx`
- Triggers: User navigates to /about
- Responsibilities: Static page (likely server component with minimal content)

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Wraps all routes
- Responsibilities: Configures site metadata (SEO), imports fonts, renders Header/Footer wrapper, manages viewport and OpenGraph configuration

## Error Handling

**Strategy:** Graceful degradation with fallback UI

**Patterns:**
- **404 Handling:** `src/app/not-found.tsx` rendered when `notFound()` called (e.g., invalid blog slug in `src/app/blog/[slug]/page.tsx`)
- **Missing Content:** Pages check for falsy post/project and call `notFound()` rather than rendering null
- **Font Fallbacks:** `src/lib/fonts.ts` defines fallback sans-serif fonts (Arial, Helvetica Neue) if custom Norse font fails to load
- **Image Optimization:** Next.js Image component with placeholder="blur" and quality optimization; next.config.ts specifies [75, 80] quality levels

## Cross-Cutting Concerns

**Logging:** Not applicable; no server-side logging configured. Browser console only for debugging.

**Validation:** Handled at compile time via Velite/Zod schemas. MDX frontmatter must match schema (title, slug, date, tags, etc.) or build fails.

**Authentication:** Not applicable; no user authentication or private content.

**SEO & Metadata:**
- Root layout: Sets base metadata template
- Page components: Override via `generateMetadata()` function to inject post-specific OpenGraph, Twitter cards
- Static generation ensures all content pre-rendered for search engine crawling

**Scroll Management:** Header component implements scroll lock when mobile menu open (position: fixed approach compatible with iOS Safari).

**Accessibility:**
- Navigation menu: `aria-expanded`, `aria-controls`, `aria-label`, `aria-modal`, `role="dialog"` attributes
- Focus management: Uses `inert` attribute on main content when menu open (native HTML, no JavaScript focus trap)
- Escape key: Closes mobile menu when pressed
- Motion preferences: ScrollReveal respects `prefers-reduced-motion: reduce` media query
- Text contrast: Hero section includes radial gradient scrim to ensure WCAG AA text contrast over background image

---

*Architecture analysis: 2026-02-08*
