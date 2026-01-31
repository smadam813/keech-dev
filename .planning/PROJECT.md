# keech.dev

## What This Is

A personal website serving as blog, portfolio, and professional contact point. Showcases code/software and hardware/maker projects alongside mixed-content writing (technical posts, personal thoughts, whatever sparks interest). Built for Vercel deployment at keech.dev.

## Core Value

A distinctive online presence that feels like stepping into a cosmic, Norse-touched world — memorable enough that visitors remember the site itself, not just the content.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Home page with intro, recent blog posts, and featured projects
- [ ] Blog listing page with all posts
- [ ] Individual blog post pages rendered from MDX
- [ ] Projects/portfolio listing page
- [ ] Individual project detail pages
- [ ] About page with bio
- [ ] Contact section with social links (GitHub, LinkedIn, etc.)
- [ ] Downloadable PDF resume
- [ ] Neobrutalist design system (bold borders, chunky shadows, raw aesthetic)
- [ ] Custom color palette derived from reference images (dusty pinks, deep teals, golds, space blacks)
- [ ] Subtle Norse design accents (angular geometries, runic-inspired border patterns)
- [ ] Playful hover interactions and subtle animations
- [ ] Mobile-responsive layout
- [ ] SEO-optimized pages with meta tags

### Out of Scope

- Contact form — social links are sufficient for v1
- Headless CMS — MDX in repo preferred
- Calendar/booking integration — not needed
- Comments system — may add later
- Newsletter signup — may add later
- Dark/light mode toggle — single cohesive theme for now

## Context

**Design inspiration:** 10 reference images from an animated music video (Parachute Ending stills) featuring surreal, psychedelic visuals with a retro-futuristic cosmic aesthetic. Colors include dusty pink/salmon skies, seafoam/teal greens, deep blacks, bright golds, and purple/lavender accents. The user has deep interest in Norse mythology and paganism, informing subtle runic/geometric design touches.

**Content types:**
- Blog posts: Mixed content (technical tutorials, project journals, personal thoughts)
- Projects: Code/software projects and hardware/maker builds
- Each project type needs appropriate display (code repos vs physical build documentation)

**Workflow:** User prefers VS Code and markdown. MDX files committed to repo, Vercel rebuilds on push.

## Constraints

- **Platform**: Vercel deployment — architecture must be Vercel-compatible
- **Framework**: Next.js + React — user requirement
- **Domain**: keech.dev — already reserved on Vercel
- **Content**: MDX files in repository — no external CMS dependencies
- **Resume**: Static PDF file — no dynamic generation needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MDX for content | User prefers local editing in VS Code, simpler than CMS | — Pending |
| Single theme (no dark/light toggle) | Cohesive aesthetic is core to the vision | — Pending |
| Social links only for contact | Simpler than contact form, sufficient for needs | — Pending |
| Neobrutalism + cosmic palette + Norse accents | Unique combination to stand apart from typical dev portfolios | — Pending |

---
*Last updated: 2025-01-31 after initialization*
