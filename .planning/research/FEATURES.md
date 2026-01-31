# Feature Landscape: Personal Developer Blog/Portfolio

**Domain:** Personal developer blog and portfolio website
**Researched:** 2026-01-31
**Overall Confidence:** MEDIUM-HIGH

## Table Stakes

Features users expect. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **About page with bio** | Users need to know who you are; humanizes the site | Low | Include high-quality photo, tech interests, personality |
| **Project showcase** | Core purpose of a portfolio; "show, not tell" | Medium | Each project needs description, tech stack, outcomes |
| **Responsive design** | 72% of creative professionals evaluated on personal websites; mobile usage dominant | Medium | Must work flawlessly on all device sizes |
| **Fast loading** | Slow portfolios are deal-breakers; reflects technical competence | Medium | Target < 3s load time; compress images, optimize assets |
| **Clean navigation** | Users expect clear paths to About, Projects, Contact sections | Low | Keep navigation simple and consistent |
| **Contact information** | Visitors need a way to reach you | Low | At minimum: social links; ideally: multiple options |
| **Professional domain** | Custom domain (yourname.com) is fundamental credibility signal | Low | keech.dev already planned |
| **Live project links** | Recruiters/visitors want to see working projects | Low | Every project should have "View Live" link when applicable |
| **Source code links** | Proves you can write and ship code | Low | GitHub links for open-source projects |
| **Error-free functionality** | Hiring teams peek at code; broken links destroy credibility | Low | Test all links, forms, cross-browser |
| **HTTPS** | Security baseline; browsers flag non-HTTPS sites | Low | Standard with modern hosting |

## Differentiators

Features that set keech.dev apart. Not expected, but create memorable impressions.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dark/light mode toggle** | User preference accommodation; accessibility consideration; expected by tech audiences | Medium | Use system preference detection + manual override; save preference; avoid pure black/white |
| **Neobrutalist design** | Bold, memorable visual identity; stands out from minimalist crowd | Medium | Thick borders, bold colors, high contrast, blocky layouts; aligns with stated design vision |
| **Hardware/maker project showcase** | Rare differentiator; most portfolios focus only on software | Medium | Include high-quality images, videos, schematics; tell the story of physical builds |
| **Blog with mixed content** | Establishes thought leadership; drives SEO traffic; shows personality | Medium | Tech posts drive discovery; personal posts humanize |
| **Narrative project case studies** | "Stroll through digital gallery" > "scroll through resume"; tells the creation story | Medium | Explain problem, process, challenges, outcomes; more engaging than bullet lists |
| **RSS feed** | IndieWeb support; discoverability for technical audiences | Low | Standard for blogs; many developers use RSS readers |
| **PDF resume download** | Convenience for recruiters; stated requirement | Low | Keep updated; link prominently |
| **Custom animations/micro-interactions** | Creates polished, memorable experience; demonstrates frontend skills | Medium-High | GSAP or CSS animations; don't overdo it |
| **Cosmic/psychedelic color palette** | Unique visual identity per stated vision | Medium | Bold colors work well with neobrutalism; ensure accessibility |
| **Norse design accents** | Cultural/personal touch; highly distinctive | Medium | Runes, patterns, typography choices; subtle integration |
| **Syntax-highlighted code blocks** | Essential for tech blog posts; expected by developer audience | Low | Use Prism, Shiki, or similar; include copy button |
| **Reading time estimates** | Helpful UX for blog posts | Low | Calculate based on word count |
| **SEO structured data** | Rich search results; AI discoverability (GEO) | Medium | JSON-LD schema for Person, Article, BlogPosting; Organization |
| **Open Graph / social cards** | Professional appearance when shared on social media | Low | Custom images per page/post preferred |

## Anti-Features

Features to deliberately NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Overly complex animations** | "Tempting to demonstrate technical prowess with elaborate animations... often backfires"; slow load times, distraction from content | Use purposeful, subtle animations that enhance rather than distract |
| **Too many low-quality projects** | Quantity over quality hurts credibility; "seriously hurt your portfolio" | Curate 4-8 best projects; quality over quantity |
| **Copied/tutorial projects** | "Remove copied projects from YouTube"; shows no original thinking | Build original projects or significantly extend tutorials |
| **Generic design trying to please everyone** | "Appealing to no one" | Commit to distinctive style (neobrutalism + cosmic + Norse) |
| **Background audio auto-play** | Jarring UX; accessibility nightmare | If audio needed, require explicit user action |
| **Contact form without spam protection** | Will be flooded with spam | Use reCAPTCHA or honeypot fields; or skip form entirely |
| **Complex contact form** | Friction reduces inquiries | Maximum 3-4 fields: name, email, message |
| **Outdated projects/technologies** | "Not inspire confidence in your abilities" | Keep portfolio current; remove obsolete work |
| **Broken links/images** | Signals carelessness; destroys credibility | Regular link checking; monitoring |
| **Recreating social media mechanics** | "Gruesome mechanics of social media, such as publishing likes, boosts, follower counts" | Blog is different from social media; embrace that |
| **Webmentions/comments without moderation** | Can become spam/troll magnets | Either moderate heavily or skip entirely; social links handle discussion |
| **Pure black (#000) background in dark mode** | Eye strain; makes text harder to read for users with astigmatism | Use dark gray (#121212 or similar) instead |
| **Force-following OS theme** | Users may want different mode than their OS | Provide manual override; save preference |

## Feature Dependencies

```
Core Structure (Phase 1)
    |
    +-- About page
    +-- Navigation
    +-- Responsive layout
    +-- Contact/social links
    |
    v
Project Showcase (Phase 2)
    |
    +-- Project list view
    +-- Project detail pages
    +-- Live/source links
    +-- Image optimization
    |
    +-- Software project template
    +-- Hardware project template (depends on image handling)
    |
    v
Blog System (Phase 3)
    |
    +-- Post list view
    +-- Post detail pages
    +-- Syntax highlighting
    +-- Reading time
    +-- RSS feed
    |
    +-- Categories/tags (optional)
    |
    v
Polish & Enhancement (Phase 4)
    |
    +-- Dark/light mode (can be earlier, but polish here)
    +-- Custom animations
    +-- SEO/structured data
    +-- Open Graph images
    +-- PDF resume integration
```

## MVP Recommendation

For MVP, prioritize these **table stakes** to achieve functional portfolio:

1. **About page** with bio and photo
2. **Responsive navigation** (About, Projects, Blog, Contact)
3. **Project showcase** with at least 3-5 curated projects (software focus initially)
4. **Contact via social links** (GitHub, LinkedIn, email)
5. **Fast, responsive design** with neobrutalist aesthetic applied

Add these **differentiators** early (low effort, high impact):

1. **Dark/light mode toggle** - tech audiences expect it
2. **RSS feed** - standard for blogs, minimal effort
3. **PDF resume download** - stated requirement

**Defer to post-MVP:**

- **Hardware project showcase**: More complex (images, videos, schematics); add after software projects work
- **Blog system**: Can launch portfolio without blog; add iteratively
- **Custom animations**: Polish after core functionality works
- **SEO structured data**: Valuable but not blocking launch
- **Webmentions**: Complexity not worth it for initial launch; revisit later if desired

## Sources

### High Confidence (Official/Multiple Sources)

- [Colorlib Developer Portfolios 2026](https://colorlib.com/wp/developer-portfolios/) - Portfolio examples and patterns
- [Elementor Best Web Developer Portfolio Examples](https://elementor.com/blog/best-web-developer-portfolio-examples/) - Essential portfolio elements
- [BrainStation How to Build a Web Developer Portfolio 2026](https://brainstation.io/career-guides/how-to-build-a-web-developer-portfolio) - Best practices
- [NN/G Neobrutalism Definition and Best Practices](https://www.nngroup.com/articles/neobrutalism/) - Authoritative UX perspective on neobrutalism
- [Smashing Magazine Inclusive Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/) - Accessibility best practices for dark mode
- [IndieWeb RSS](https://indieweb.org/RSS) - RSS feed standards

### Medium Confidence (Single Authoritative Source)

- [DEV Community 2026 Portfolio Anthology](https://dev.to/nk2552003/the-anthology-of-a-creative-developer-a-2026-portfolio-56jp) - 2026 portfolio trends
- [Built In Hardware Engineering Portfolio](https://builtin.com/hardware/hardware-engineering-portfolio) - Hardware portfolio guidance
- [Stephanie Walter Dark Mode Accessibility](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/) - Dark mode accessibility concerns
- [O8 Structured Data for SEO 2026](https://www.o8.agency/blog/using-structured-data-google-seo-dont-miss-out-benefits) - Structured data importance

### Low Confidence (WebSearch Only - Validate)

- [DevPortfolioTemplates 5 Mistakes](https://www.devportfoliotemplates.com/blog/5-mistakes-developers-make-in-their-portfolio-websites) - Portfolio anti-patterns
