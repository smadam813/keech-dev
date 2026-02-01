# Phase 4: Polish & Performance - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add animations, interactions, and SEO optimization to make the site feel alive and rank well. Core Web Vitals must pass (LCP < 2.5s, CLS < 0.1). All interactive elements get playful hover effects. Page transitions feel smooth. Elements animate as user scrolls.

</domain>

<decisions>
## Implementation Decisions

### Hover Effects
- Shadow behavior, color changes, transition speed, link treatments: Claude's discretion
- Should feel playful and match neobrutalist aesthetic

### Page Transitions
- Transition style, duration, nav behavior: Claude's discretion
- **Must respect `prefers-reduced-motion`** — disable or minimize animations for users who prefer reduced motion

### Scroll Animations
- Entrance style, stagger vs together, which elements, replay behavior: Claude's discretion
- Should be subtle, not distracting

### SEO
- OG image strategy: Claude's discretion (AI image generation available if needed — can provide prompts for user to execute)
- Structured data (JSON-LD): Claude's discretion
- **Sitemap and robots.txt: Yes, both** — auto-generated sitemap.xml and robots.txt
- Keyword focus: Claude's discretion based on content

### Claude's Discretion
- All animation timing, easing, and implementation details
- Which elements get which effects
- OG image approach (static, per-type, or dynamic)
- Structured data depth
- Performance optimization techniques

</decisions>

<specifics>
## Specific Ideas

- User has access to Google's AI image generation — Claude can create image prompts for OG images or visual assets if desired
- Reduced motion support is required (accessibility)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-polish-performance*
*Context gathered: 2026-02-01*
