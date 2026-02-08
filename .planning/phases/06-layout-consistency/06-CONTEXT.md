# Phase 6: Layout Consistency - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Normalize container widths, vertical spacing, and semantic HTML across all pages so the site feels cohesive. Every listing page should share one max-width, every detail page should share another, and vertical rhythm should be consistent within each page type. Fix any nested `<main>` elements. Home page is exempt (it's the landing experience).

</domain>

<decisions>
## Implementation Decisions

### Container widths
- Listing pages (Blog index, Projects index): ~1280px max-width
- Detail/reading pages (blog post, project detail): Claude's discretion
- All pages must have breathing room from viewport edges on large screens (minimum side margins even on ultrawide)
- Same horizontal padding on mobile across all page types

### Vertical spacing
- Comfortable top spacing (~48-64px) between header and page content
- Bottom spacing (content to footer): Claude's discretion on what looks balanced
- Heading-to-content gap (e.g., "Blog" title to card grid): Claude's discretion
- Listing pages share identical spacing with each other; detail pages share identical spacing with each other; the two groups can differ from each other

### Page structure
- Listing pages: title only (no subtitle/description line), then content grid
- Detail pages: distinct hero section for title/metadata — visually separate from body content
- Semantic HTML fix (one `<main>` per page) is also an opportunity to align wrapper divs/sections to a shared pattern
- Shared page wrapper approach: Claude's discretion on component vs consistent classes

### Edge cases
- Home page is exempt from consistency rules — it's its own thing as the landing experience
- About page categorization: Claude's discretion on whether it's a "detail page" or its own thing
- If any page looks "off" compared to others, normalize it — consistency wins even if it changes the current look

### Claude's Discretion
- Detail/reading page max-width
- Bottom spacing amount
- Heading-to-content gap sizing
- Shared wrapper component vs consistent Tailwind classes
- About page categorization
- Exact spacing values within the "comfortable" range

</decisions>

<specifics>
## Specific Ideas

- On ultra-wide, Blog and Projects page titles currently don't align with each other or with "keech.dev" in the header — different container widths/padding cause visible misalignment (see screenshots: `Screenshot 2026-02-07 171610.png` and `Screenshot 2026-02-07 171644.png`)
- Blog page has a subtitle line currently ("Thoughts on code, creativity...") but decision is title-only for listing pages — subtitle should be removed for consistency

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-layout-consistency*
*Context gathered: 2026-02-07*
