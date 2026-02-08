# keech.dev

## What This Is

A personal portfolio and blog at keech.dev featuring a distinctive neobrutalist design with cosmic, Norse-touched aesthetics. Showcases software projects and writing through MDX-powered content with syntax-highlighted code blocks, scroll animations, and comprehensive SEO. Fully polished mobile experience with hamburger menu navigation and consistent layouts.

## Core Value

A distinctive online presence that feels like stepping into a cosmic, Norse-touched world — memorable enough that visitors remember the site itself, not just the content.

## Requirements

### Validated

- ✓ DSGN-01: Responsive layout (mobile, tablet, desktop) — v1.0
- ✓ DSGN-02: Neobrutalist styling (bold borders, chunky shadows) — v1.0
- ✓ DSGN-03: Custom color palette (dusty pink, teal, gold, black) — v1.0
- ✓ DSGN-04: Norse geometric accents in design — v1.0
- ✓ DSGN-05: WCAG AA contrast compliance — v1.0
- ✓ NAV-01: Clear navigation to all sections — v1.0
- ✓ NAV-02: Navigation reinforces brand identity — v1.0
- ✓ NAV-03: Mobile navigation works intuitively — v1.0
- ✓ NAV-04: Mobile nav uses hamburger icon in header — v1.1
- ✓ NAV-05: Hamburger opens full-screen overlay with nav links — v1.1
- ✓ NAV-06: Menu auto-closes on route change — v1.1
- ✓ NAV-07: Active page is highlighted in mobile menu — v1.1
- ✓ NAV-08: Hamburger icon animates to X when menu is open — v1.1
- ✓ NAV-09: Menu traps focus while open (accessibility) — v1.1
- ✓ NAV-10: Menu locks background scroll while open — v1.1
- ✓ HOME-01: Bold landing page with name — v1.0
- ✓ HOME-02: Design makes the statement — v1.0
- ✓ HOME-03: Clear path to content via navigation — v1.0
- ✓ BLOG-01: Blog listing page — v1.0
- ✓ BLOG-02: Individual post pages from MDX — v1.0
- ✓ BLOG-03: Code syntax highlighting — v1.0
- ✓ BLOG-04: Readable typography and layout — v1.0
- ✓ BLOG-05: Date and reading time display — v1.0
- ✓ PROJ-01: Projects listing page — v1.0
- ✓ PROJ-02: Individual project detail pages — v1.0
- ✓ PROJ-03: Tech stack display — v1.0
- ✓ PROJ-04: GitHub repo links — v1.0
- ✓ PROJ-05: Live demo links — v1.0
- ✓ ABUT-01: About page with bio — v1.0
- ✓ ABUT-02: Social links (GitHub, LinkedIn) — v1.0
- ✓ ABUT-03: Downloadable PDF resume (placeholder) — v1.0
- ✓ ABUT-04: Social link buttons removed from About page (footer handles this) — v1.1
- ✓ INTR-01: Playful hover effects — v1.0
- ✓ INTR-03: Scroll-triggered animations — v1.0
- ✓ TECH-01: Vercel deployment — v1.0
- ✓ TECH-02: Core Web Vitals pass — v1.0
- ✓ TECH-03: SEO meta tags — v1.0
- ✓ TECH-04: MDX content with Velite — v1.0
- ✓ VIEW-01: Layout exports viewport-fit: cover — v1.1
- ✓ VIEW-02: Bottom-nav padding hacks removed — v1.1
- ✓ VIEW-03: Footer uses correct safe-area insets — v1.1
- ✓ LYOT-01: All pages use consistent max-width containers — v1.1
- ✓ LYOT-02: Vertical padding standardized across all pages — v1.1
- ✓ LYOT-03: Blog/Projects listing use aligned card layouts — v1.1
- ✓ LYOT-04: No nested main tags (single main in root layout) — v1.1

### Active

(None — define requirements for next milestone with `/gsd:new-milestone`)

### Out of Scope

- Contact form — social links sufficient for personal site
- Headless CMS — MDX in repo preferred for control and simplicity
- INTR-02: Smooth page transitions — View Transitions API experimental in Next.js 16, deferred
- Email link — privacy concern; social links preferred
- Newsletter signup — may add in future version
- Comments system — avoiding social mechanics for now
- Analytics dashboard — use Vercel Analytics directly
- Multi-language support — English only

## Context

**Current State (v1.1 shipped 2026-02-07):**
- ~1,400 LOC TypeScript/TSX/CSS
- Tech stack: Next.js 16, Tailwind v4, Velite, rehype-pretty-code, Lucide React
- Deployed: https://keech.dev (keech-dev.vercel.app)
- 6 phases, 18 plans executed across 2 milestones

**Content:**
- 1 sample blog post (hello-world.mdx)
- 1 sample project (keech-dev.mdx)
- Placeholder headshot and resume button on About page

**Design inspiration:** Parachute Ending music video stills with retro-futuristic cosmic aesthetic. Norse mythology influences in geometric patterns.

**Workflow:** MDX files in repo, Vercel rebuilds on push.

## Constraints

- **Platform**: Vercel deployment
- **Framework**: Next.js + React
- **Domain**: keech.dev
- **Content**: MDX files in repository
- **Resume**: Static PDF file

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tailwind v4 CSS-first @theme | No config file needed, tokens in CSS | ✓ Good |
| Space Grotesk + Inter fonts | Geometric display + readable body | ✓ Good |
| Hard offset shadows (4px 4px 0 0) | Signature neobrutalist effect | ✓ Good |
| Velite CLI prebuild pattern | Turbopack compatibility | ✓ Good |
| github-dark-dimmed syntax theme | Fits cosmic palette | ✓ Good |
| React copy button over shiki transformer | Simpler, avoids SSR issues | ✓ Good |
| Intersection Observer for scroll animations | Cross-browser support (CSS animation-timeline limited) | ✓ Good |
| Single theme (no dark/light toggle) | Cohesive aesthetic is core to vision | ✓ Good |
| Social links only for contact | Simpler than contact form | ✓ Good |
| View Transitions deferred | API experimental in Next.js 16 | — Pending |
| Hamburger menu replaces bottom nav | Eliminates iOS Safari bottom chrome overlap | ✓ Good |
| iOS scroll lock via position:fixed | Only reliable approach on iOS Safari | ✓ Good |
| Inert attribute for focus management | Simpler than manual focus trap, better browser support | ✓ Good |
| max-w-7xl for listing pages, max-w-4xl for detail | Clear visual hierarchy between page types | ✓ Good |
| Section tags for page containers | Avoids nested main elements, root layout owns main | ✓ Good |

---
*Last updated: 2026-02-07 after v1.1 milestone*
