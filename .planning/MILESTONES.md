# Project Milestones: keech.dev

## v1.1 Polish & Consistency (Shipped: 2026-02-07)

**Delivered:** Refined mobile navigation with hamburger menu and normalized layout consistency across all pages.

**Phases completed:** 5-6 (4 plans total)

**Key accomplishments:**

- Replaced bottom-pinned mobile nav with hamburger menu in header (full-screen overlay, neobrutalist styling)
- iOS Safari-safe scroll lock, inert-based focus trapping, and viewport-fit cover for safe-area support
- Normalized listing pages (Blog, Projects) to max-w-7xl with consistent structure and spacing
- Normalized detail pages (blog post, project, about) to max-w-4xl with uniform vertical padding
- Eliminated all nested `<main>` tags — single `<main>` in root layout only

**Stats:**

- 10 files modified, +181/-113 lines
- 2 phases, 4 plans, 8 tasks
- 1 day (2026-02-07)

**Git range:** `feat(05-01)` → `docs(06-02)`

**What's next:** TBD — add real content, dark mode, RSS feed, page transitions

---

## v1.0 MVP (Shipped: 2026-02-03)

**Delivered:** A distinctive personal portfolio with neobrutalist design, MDX-powered blog and projects, and polished animations.

**Phases completed:** 1-4 (14 plans total)

**Key accomplishments:**

- Neobrutalist design system with Tailwind v4 CSS-first theming (dusty pink, teal, hard shadows)
- Velite MDX content engine with syntax-highlighted code blocks
- Full portfolio site: Home, Blog, Projects, About pages
- Cross-browser scroll animations with Intersection Observer
- Comprehensive SEO infrastructure (metadata, sitemap, robots.txt)
- iOS-compatible responsive design with dvh units and safe-area support

**Stats:**

- 1,336 lines of TypeScript/TSX/CSS
- 4 phases, 14 plans
- 31 requirements satisfied
- 4 days from start to ship (2026-01-31 → 2026-02-03)

**Git range:** `feat(01-01)` → `docs(04)`

**What's next:** v1.1 or v2.0 — add real content, dark mode, RSS feed

---
