# Roadmap: keech.dev

## Overview

keech.dev transforms from empty project to distinctive personal portfolio through four phases. Phase 1 establishes the neobrutalist design system and core pages (home, navigation). Phase 2 builds the Velite content engine and blog functionality. Phase 3 delivers project showcase and about pages. Phase 4 adds polish with animations, interactions, and SEO optimization.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions if needed

- [x] **Phase 1: Foundation & Design** - Neobrutalist design system, home page, navigation
- [x] **Phase 2: Content & Blog** - Velite MDX engine, blog listing and posts
- [ ] **Phase 3: Projects & About** - Project showcase, about page, contact section
- [ ] **Phase 4: Polish & Performance** - Animations, interactions, SEO, performance

## Phase Details

### Phase 1: Foundation & Design
**Goal**: Visitors see a bold, memorable home page with working navigation and the complete neobrutalist design system in place
**Depends on**: Nothing (first phase)
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, NAV-01, NAV-02, NAV-03, HOME-01, HOME-02, HOME-03, TECH-01
**Success Criteria** (what must be TRUE):
  1. Home page displays with bold typography, custom cosmic color palette, and neobrutalist styling (chunky shadows, bold borders)
  2. Navigation allows access to all main sections (Home, Blog, Projects, About) and works on mobile
  3. Site deploys successfully to Vercel at keech.dev
  4. All text is readable against backgrounds (WCAG AA contrast)
  5. Layout responds correctly on mobile, tablet, and desktop
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Initialize Next.js 15 + Tailwind v4 design system
- [x] 01-02-PLAN.md — Create navigation shell (header, mobile nav, footer)
- [x] 01-03-PLAN.md — Build home page hero, placeholders, deploy to Vercel
- [x] 01-04-PLAN.md — Fix iOS viewport and fixed positioning issues (gap closure)

### Phase 2: Content & Blog
**Goal**: Visitors can browse blog posts and read individual articles with syntax-highlighted code
**Depends on**: Phase 1
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05
**Success Criteria** (what must be TRUE):
  1. Blog listing page shows all posts with titles and dates
  2. Individual blog posts render MDX content with proper formatting
  3. Code blocks display with syntax highlighting
  4. Posts show reading time and publication date
  5. Blog typography is comfortable for long-form reading
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Set up Velite MDX content engine with syntax highlighting
- [x] 02-02-PLAN.md — Build blog UI components and pages
- [x] 02-03-PLAN.md — Blog layout width fix (gap closure)

### Phase 3: Projects & About
**Goal**: Visitors can explore project portfolio and learn about the site owner
**Depends on**: Phase 2
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, ABUT-01, ABUT-02, ABUT-03
**Success Criteria** (what must be TRUE):
  1. Projects listing page shows all projects with visual cards
  2. Individual project pages display description, tech stack, and links
  3. Project pages link to GitHub repos and live demos where applicable
  4. About page presents bio and personal information
  5. Social links (GitHub, LinkedIn) are accessible and work
  6. PDF resume can be downloaded
**Plans**: TBD (1-3 plans)

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Polish & Performance
**Goal**: Site feels alive with subtle animations and ranks well in search engines
**Depends on**: Phase 3
**Requirements**: INTR-01, INTR-02, INTR-03, TECH-02, TECH-03
**Success Criteria** (what must be TRUE):
  1. Interactive elements have playful hover effects (shadow shifts, color changes)
  2. Page transitions feel smooth between routes
  3. Elements animate in as user scrolls
  4. Core Web Vitals pass (LCP < 2.5s, CLS < 0.1)
  5. All pages have proper SEO meta tags (title, description, OG)
**Plans**: TBD (1-2 plans)

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design | 4/4 | Complete | 2026-01-31 |
| 2. Content & Blog | 3/3 | Complete | 2026-02-01 |
| 3. Projects & About | 0/? | Ready | - |
| 4. Polish & Performance | 0/? | Not started | - |

---
*Roadmap created: 2026-01-31*
*Depth: quick (3-5 phases)*
