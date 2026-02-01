# Phase 2: Content & Blog - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors can browse blog posts and read individual articles with syntax-highlighted code. This phase delivers the Velite MDX content engine, blog listing page, and individual post pages with comfortable reading typography.

</domain>

<decisions>
## Implementation Decisions

### Blog listing layout
- Excerpt preview visible for each post (~150 chars or custom description)
- Tags displayed as chips on listing cards
- Claude's discretion: Card grid vs stacked list, featured images vs text-only

### Post reading experience
- Sticky sidebar table of contents auto-generated from headings
- Claude's discretion: Reading column width, progress indicator, end-of-post navigation

### Code block styling
- Always show line numbers
- Copy button on code blocks
- Show language badge (e.g., 'typescript', 'bash')
- Claude's discretion: Theme (dark vs site-matched)

### Content metadata
- No author byline (it's obviously the owner's blog)
- Show 'last updated' date when content is revised
- Tags styled as neobrutalist chips (bold borders, hard shadows)
- Claude's discretion: Listing metadata density (date, reading time, tags)

### Claude's Discretion
- Layout format (card grid vs stacked list)
- Featured images on listing (yes/no)
- Reading column width (narrow/medium/full)
- Reading progress indicator
- End-of-post navigation (related posts, next/prev, both)
- Code block theme

</decisions>

<specifics>
## Specific Ideas

- Table of contents should be sticky sidebar that stays visible while scrolling
- Tags should feel consistent with the neobrutalist aesthetic established in Phase 1
- Code blocks need to be readable and practical for technical tutorials

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-content-blog*
*Context gathered: 2026-01-31*
