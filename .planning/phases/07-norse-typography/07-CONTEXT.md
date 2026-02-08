# Phase 7: Norse Typography - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace Space Grotesk with Norse display font (Joel Carrouche) across all headings (h1-h6), site name, and navigation text. Convert OTF font files to WOFF2 format. Tune letter-spacing and line-height for clean rendering at all heading sizes. Protect against layout shift during font swap. This phase establishes the runic identity foundation — hero image and rune decorations are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Weight & emphasis usage
- Bold weight for h1 and h2 only — top-level headings get Bold for impact
- Regular weight for h3-h6 — lighter feel, let the font character speak
- Site name "keech.dev" in header: Regular weight
- Navigation links (Blog, Projects, About): Regular weight
- Weight hierarchy: Bold reserved for page-level impact (h1/h2), Regular everywhere else

### Claude's Discretion
- Inline bold handling within headings (whether `<strong>` inside an h3 renders Norse Bold or stays uniform) — pick what looks cleanest
- Font loading strategy (font-display swap vs block, preload vs natural discovery) — balance performance with visual polish
- Layout shift mitigation approach (size-adjust fallback metrics tuning) — balance effort vs. result based on how different Norse metrics are from system fonts
- Fallback font chain if Norse fails to load — pick the most sensible chain (system sans-serif or Space Grotesk as middle ground)
- Preload decision — based on WOFF2 file size and performance impact

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all loading/fallback behavior.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-norse-typography*
*Context gathered: 2026-02-07*
