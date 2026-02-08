# Phase 8: Hero Image - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an atmospheric Norse landscape hero image to the home page with "keech.dev" text overlay. The hero makes visitors feel they've arrived somewhere distinctive. Image optimization, responsive scaling, and WCAG-compliant text contrast are in scope. Rune decorations are Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Text overlay & branding
- "keech.dev" centered on the hero image — dead center, bold, immediate impact
- No tagline or subtitle — just the name, clean and mysterious, let the image speak
- Text scale is dominant — large enough to be the first thing you see, the text IS the hero moment
- Dark gradient scrim behind the text area for WCAG AA contrast against the background image

### Claude's Discretion
- Visual composition — landscape style, mood, color palette, time of day (user has source image already)
- Viewport behavior — full-screen vs partial, scroll behavior, mobile cropping strategy
- Content transition — how the hero hands off to the content below (hard cut, gradient, decorative edge)
- Scrim gradient specifics — direction, opacity, spread
- Text font size breakpoints across responsive widths
- ".dev" teal accent styling consistency with existing header logo treatment

</decisions>

<specifics>
## Specific Ideas

- Hero source image is a 7MB PNG that must be pre-optimized to <200KB before integration (noted in STATE.md blockers)
- Norse font is already integrated sitewide (Phase 7 complete) — hero text renders in Norse font automatically
- ".dev" in header logo already styled with teal accent (#2D8B8B) — hero text should be consistent with this treatment
- Bold weight for all Norse font usage (Regular weight too thin at display sizes)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-hero-image*
*Context gathered: 2026-02-08*
