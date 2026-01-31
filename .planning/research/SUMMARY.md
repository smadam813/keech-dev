# Project Research Summary

**Project:** keech.dev
**Domain:** Personal Developer Blog + Portfolio Website
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

keech.dev is a personal blog and portfolio site targeting the modern Next.js ecosystem with a distinctive neobrutalist aesthetic. The 2026 standard stack for this domain is well-established: Next.js 15.5 with App Router, Velite for type-safe MDX content management, Tailwind CSS v4 for styling, and rehype-pretty-code for syntax highlighting. This combination provides excellent developer experience, build-time performance, and zero-config deployment to Vercel.

The recommended approach prioritizes foundation over features: establish the neobrutalist design system and content pipeline first, then layer on blog and project showcases. The architecture leverages Server Components by default, treating MDX content as a type-safe data layer rather than just pages. This enables powerful content querying while maintaining static generation performance. The key differentiator for keech.dev is the unique visual identity (neobrutalist + cosmic palette + Norse accents) combined with hardware/maker project showcases, which sets it apart from typical developer portfolios.

Critical risks center on accessibility, particularly ensuring neobrutalist color schemes meet WCAG contrast requirements, and MDX configuration pitfalls that can cause cryptic errors. Mitigation requires upfront contrast validation for all color pairs and following Next.js MDX setup patterns exactly. The research shows high confidence for technical decisions but flags design system validation and hardware project presentation as areas needing attention during implementation.

## Key Findings

### Recommended Stack

Next.js 15.5 represents the current stable release with mature App Router support, while Next.js 16 remains in canary and should be avoided for production. Velite has emerged as the recommended content layer following Contentlayer's abandonment in 2023, providing Zod schema validation and automatic TypeScript type generation for MDX frontmatter. Tailwind CSS v4 simplifies configuration with a CSS-first approach, eliminating the need for tailwind.config.js files for basic setups.

**Core technologies:**
- **Next.js 15.5.x**: React framework with App Router — stable production release with excellent Vercel integration
- **Velite 0.3.x**: MDX content processing — type-safe content layer with Zod validation, better than deprecated Contentlayer
- **Tailwind CSS 4.x**: Utility CSS framework — new CSS-first configuration, built-in support for design tokens
- **rehype-pretty-code**: Code syntax highlighting — Shiki-powered with VS Code themes, build-time rendering
- **next-themes**: Dark mode management — proven solution with no flash, system preference support

**Critical version requirements:**
- Avoid Next.js 16 canary — use stable 15.5.11
- Avoid Contentlayer — deprecated since 2023
- Use Tailwind v4 CSS-first config — no tailwind.config.js needed for basic setup

### Expected Features

The feature landscape divides cleanly into table stakes (expected baseline) and differentiators (memorable impressions). Missing table stakes features signal an incomplete or unprofessional portfolio, while differentiators create the distinctive keech.dev identity.

**Must have (table stakes):**
- About page with bio and professional photo — humanizes the site, users need to know who you are
- Project showcase with live/source links — core portfolio purpose, recruiters expect working demonstrations
- Responsive design — 72% of creative professionals are evaluated on personal websites, mobile is critical
- Fast loading (<3s) — slow portfolios destroy credibility, reflects technical competence
- Professional domain (keech.dev) — fundamental credibility signal, already secured
- Contact information — minimum social links, enables opportunities

**Should have (competitive differentiators):**
- Dark/light mode toggle — expected by technical audiences, accessibility consideration
- Neobrutalist design system — bold visual identity that stands out from minimalist crowd
- Hardware/maker project showcase — rare differentiator showing breadth beyond software
- Narrative project case studies — "stroll through digital gallery" approach over bullet lists
- Syntax-highlighted code blocks — essential for tech blog credibility
- RSS feed — IndieWeb support, technical audience expects it

**Defer (v2+):**
- Custom animations/micro-interactions — polish after core functionality works
- SEO structured data — valuable but not blocking launch
- Webmentions/comments — complexity not worth it initially, social links handle discussion
- Advanced filtering/search — can launch with basic blog index, add as content grows

### Architecture Approach

The architecture follows modern Next.js patterns: Server Components by default, static generation for content pages, and treating MDX as a type-safe data source. Velite generates TypeScript types from Zod schemas at build time, enabling functions like `getAllPosts()` and `getPostBySlug()` that behave like a traditional CMS but compile to static JSON. The App Router structure separates concerns into `/app` (routes), `/components` (UI), `/content` (MDX files), and `/lib` (utilities).

**Major components:**
1. **Content Engine** — Velite parses MDX files, validates frontmatter with Zod, generates type-safe data layer at build time
2. **Design System** — Neobrutalist tokens defined in CSS custom properties, primitive components (Button, Card) composed into features
3. **App Shell** — Root layout provides fonts, theme provider, metadata template; navigation/footer shared across routes
4. **Blog Components** — Post list, post card, post layout consume type-safe content from Velite
5. **Project Components** — Similar pattern to blog but with project-specific schema (tech stack, live URLs, GitHub links)
6. **MDX Components** — Custom overrides for code blocks, images, callouts available in all MDX files via mdx-components.tsx

**Key patterns:**
- Server Components by default — only add `'use client'` when interactivity needed (theme toggle, mobile menu)
- Content as data — treat MDX like CMS, query/filter programmatically, leverage TypeScript types
- Composition over configuration — build MDX component system through React composition, not complex plugin chains
- Neobrutalist design tokens — define via CSS custom properties, consume via Tailwind utilities

### Critical Pitfalls

Research uncovered several pitfalls specific to Next.js 15 App Router with MDX that can cause major delays or rewrites if not addressed upfront.

1. **Missing mdx-components.tsx file** — Cryptic "createContext only works in Client Components" error when this required file is missing; must be created at project root immediately during MDX setup, following official Next.js guide exactly

2. **Neobrutalist design without WCAG contrast testing** — Bold color schemes fail accessibility; test ALL color pairs with contrast checker (minimum 4.5:1 for body text) before building components; limit palette to 2-3 bold colors, use black/white for text

3. **Route Handlers inside Server Components** — Unnecessary API routes and fetch() calls where direct async function calls work; wastes network hops, creates localhost URL problems; call content/database logic directly in Server Components

4. **Blank lines in JSX within MDX** — MDX parser interprets blank lines as paragraph breaks, causing cryptic parsing errors; never leave blank lines inside JSX tags, document authoring rules upfront

5. **next-mdx-remote import limitations** — Cannot use import/export in MDX files, all components must pass through props; evaluate if @next/mdx fits needs better, plan component architecture before committing to approach

## Implications for Roadmap

Based on combined research, the recommended phase structure follows dependency chains discovered in architecture research and feature prioritization.

### Phase 1: Foundation & Design System
**Rationale:** Everything else depends on these foundations. Design tokens must be validated for accessibility before any components are built. The neobrutalist aesthetic requires upfront color contrast testing to avoid accessibility rewrites.

**Delivers:**
- Next.js 15.5 project scaffold with TypeScript
- Tailwind v4 with neobrutalist design tokens (validated for WCAG contrast)
- Root layout with fonts, metadata template, theme provider
- Core primitive components (Button, Card, Input) with neobrutalist styling
- Basic navigation header/footer

**Addresses:**
- Professional domain (keech.dev)
- Responsive design baseline
- Neobrutalist design system (table stakes differentiator)

**Avoids:**
- Pitfall #2: Contrast testing happens in this phase, not after components exist
- Pitfall #4: Design tokens defined correctly from start

**Research flag:** LOW — Tailwind v4 and neobrutalist patterns well-documented

### Phase 2: Content Engine
**Rationale:** Content system can be built in parallel with design polish. Velite setup is independent of UI components. Getting MDX configuration right early prevents rewrites.

**Delivers:**
- Velite configuration with Zod schemas for posts and projects
- Type-safe content utilities (getAllPosts, getPostBySlug)
- mdx-components.tsx with custom overrides
- Syntax highlighting via rehype-pretty-code
- Content authoring guidelines (MDX rules documented)

**Addresses:**
- Blog system foundation
- Project showcase data structure
- Syntax-highlighted code blocks (differentiator)

**Avoids:**
- Pitfall #1: mdx-components.tsx created immediately
- Pitfall #4: MDX blank line rules documented for authors
- Pitfall #5: Using Velite avoids next-mdx-remote import limitations

**Uses:** Velite (STACK.md), rehype-pretty-code (STACK.md)

**Research flag:** LOW — Velite setup well-documented, official Next.js MDX guide comprehensive

### Phase 3: Static Pages & Navigation
**Rationale:** Static pages test the design system and provide MVP portfolio presence. Can launch with just About + Projects before blog is complete.

**Delivers:**
- Home page with hero, recent posts preview, featured projects
- About page with bio, photo, resume download link
- Contact section with social links (GitHub, LinkedIn, email)
- Polished navigation with mobile menu (client component)

**Addresses:**
- About page with bio (must have)
- Contact information (must have)
- Fast loading (must have)
- Professional domain presence

**Avoids:**
- Pitfall #3: Server Components for static content, client only for mobile menu

**Research flag:** LOW — Standard patterns, well-established

### Phase 4: Blog Features
**Rationale:** Blog leverages content engine from Phase 2 and design system from Phase 1. Includes dark mode as it's expected by technical audiences.

**Delivers:**
- Blog listing page with post cards
- Individual blog post pages with MDX rendering
- Reading time estimates
- Dark/light mode toggle with next-themes
- RSS feed generation

**Addresses:**
- Blog with mixed content (differentiator)
- Dark/light mode (differentiator)
- RSS feed (differentiator)

**Avoids:**
- Pitfall #10: Theme toggle properly marked 'use client'
- Pitfall #16: RSS feed tested with validator, not browser

**Uses:** next-themes (STACK.md), RSS package (STACK.md)

**Research flag:** LOW — Blog patterns well-established, dark mode well-documented

### Phase 5: Project Showcase
**Rationale:** Projects follow similar pattern to blog but with project-specific schema. Hardware projects need special consideration for image galleries.

**Delivers:**
- Projects grid/listing page
- Project detail pages with MDX rendering
- Differentiated templates for software vs hardware projects
- Image galleries for hardware builds (lazy-loaded, optimized)
- Live demo links and GitHub links

**Addresses:**
- Project showcase (must have)
- Hardware/maker projects (differentiator)
- Narrative case studies (differentiator)
- Live project links (must have)
- Source code links (must have)

**Avoids:**
- Pitfall #6: LCP images marked with priority prop
- Pitfall #11: Case-sensitive imports established as convention

**Research flag:** MEDIUM — Hardware project presentation less documented; may need research-phase for image gallery patterns and video embedding

### Phase 6: Polish & SEO
**Rationale:** Final optimizations after core functionality works. SEO structured data, performance tuning, accessibility audit.

**Delivers:**
- SEO metadata using Next.js Metadata API
- Open Graph images for social sharing (metadataBase set)
- Sitemap generation via next-sitemap
- Image optimization audit (blur placeholders, lazy loading)
- Accessibility audit (focus states, screen reader testing)
- Performance testing (Core Web Vitals)

**Addresses:**
- Error-free functionality (must have)
- Fast loading optimization (must have)
- HTTPS (must have via Vercel)

**Avoids:**
- Pitfall #7: metadataBase set in root layout for OG images
- Pitfall #6: LCP images audited and optimized
- Pitfall #2: Final accessibility validation

**Research flag:** LOW — SEO patterns well-documented in Next.js docs

### Phase Ordering Rationale

- **Phase 1 before all others**: Design tokens must be contrast-validated before components exist to avoid rewrites
- **Phase 2 parallel to Phase 1 polish**: Content engine is independent of UI, can be built simultaneously
- **Phase 3 tests Phase 1**: Static pages validate design system works before complex content rendering
- **Phase 4 and 5 parallel**: Blog and Projects follow same patterns, could be built in either order or parallel
- **Phase 6 last**: Polish requires complete feature set to optimize

**Dependency chains identified:**
- Design System → Static Pages → Content Pages
- Content Engine → Blog Features
- Content Engine → Project Showcase
- All phases → Polish & SEO

**Grouping rationale:**
- Foundation/Design/Content Engine are infrastructure layers
- Static Pages/Blog/Projects are feature layers that consume infrastructure
- Polish/SEO applies across all features

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 5 (Project Showcase)**: Hardware project presentation patterns less documented; may need `/gsd:research-phase` for image gallery best practices, video embedding, schematic display strategies

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Next.js setup, Tailwind v4, neobrutalist components well-documented
- **Phase 2 (Content Engine)**: Velite configuration, MDX setup covered in official docs
- **Phase 3 (Static Pages)**: Standard React/Next.js patterns
- **Phase 4 (Blog)**: Mature patterns, many examples in ecosystem
- **Phase 6 (Polish)**: SEO and performance optimization well-established

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Next.js 15.5, Velite, Tailwind v4 verified via official docs and GitHub releases; clear version recommendations |
| Features | HIGH | Table stakes vs differentiators identified from multiple portfolio best practice sources; clear MVP path |
| Architecture | HIGH | Server Components, Velite content layer, design system patterns verified in official Next.js docs and real-world implementations |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls verified from Vercel blog and official docs; neobrutalist accessibility concerns from NN/g; some pitfalls from single community sources |

**Overall confidence:** HIGH

Research surfaced clear technical decisions with minimal ambiguity. The Next.js 15 + Velite + Tailwind v4 stack is well-trodden territory with official documentation and recent community adoption. Feature landscape has consensus around table stakes for developer portfolios. Architecture patterns are standardized for App Router.

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **Neobrutalist + Norse design integration**: While neobrutalist patterns are documented, combining with Norse design accents and cosmic palette is unique to keech.dev; requires design exploration and contrast testing during Phase 1; no off-the-shelf examples found

- **Hardware project presentation**: Most portfolio research focuses on software projects; optimal image gallery patterns, video embedding, schematic display for hardware builds needs validation during Phase 5; consider `/gsd:research-phase` when reaching that phase

- **Cosmic palette contrast**: The specific cosmic/psychedelic color palette (cosmic purple, pink, blue, gold) needs WCAG testing; research identified the requirement but didn't validate specific color values; must happen in Phase 1 before components

- **Custom animations scope**: Research flagged over-animation as anti-pattern but didn't specify optimal level for neobrutalist sites; defer decisions until Phase 6, start conservative with CSS transitions

- **Resume PDF strategy**: Research identified resume download as table stakes but didn't address update workflow; during Phase 3, decide between manual PDF replacement vs generated from data

## Sources

### Primary (HIGH confidence)
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx) — Official MDX integration patterns
- [Next.js Releases](https://github.com/vercel/next.js/releases) — v15.5.11 verified as latest stable
- [Tailwind CSS Next.js Installation](https://tailwindcss.com/docs/guides/nextjs) — Tailwind v4 CSS-first configuration
- [Velite GitHub](https://github.com/zce/velite) — v0.3.1 active development verified
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — SEO patterns
- [Vercel Blog: Common Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) — App Router pitfalls

### Secondary (MEDIUM confidence)
- [NN/g: Neobrutalism](https://www.nngroup.com/articles/neobrutalism/) — Design best practices and accessibility concerns
- [Rehype Pretty Code](https://rehype-pretty.pages.dev/) — Syntax highlighting configuration
- [Josh Comeau: How I Built My Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog/) — Real-world MDX pitfalls and patterns
- [Contentlayer Alternatives](https://www.wisp.blog/blog/contentlayer-has-been-abandoned-what-are-the-alternatives) — Velite vs Contentlayer comparison
- [BrainStation Web Developer Portfolio Guide](https://brainstation.io/career-guides/how-to-build-a-web-developer-portfolio) — Portfolio feature expectations
- [WebAIM Contrast](https://webaim.org/articles/contrast/) — WCAG contrast requirements

### Tertiary (LOW confidence)
- [DevPortfolioTemplates 5 Mistakes](https://www.devportfoliotemplates.com/blog/5-mistakes-developers-make-in-their-portfolio-websites) — Portfolio anti-patterns, single source
- [MDXBlog: next-mdx-remote Limitations](https://www.mdxblog.io/blog/next-mdx-remote-limitations) — Content layer trade-offs, community source
- [Built In Hardware Engineering Portfolio](https://builtin.com/hardware/hardware-engineering-portfolio) — Hardware portfolio guidance, needs validation for web context

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
