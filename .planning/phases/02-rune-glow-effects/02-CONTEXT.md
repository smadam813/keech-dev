# Phase 2: Rune Glow Effects - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Add ambient CSS glow overlays at rune positions in the hero image. Glows pulse organically after the Phase 1 reveal sequence completes, reinforcing the Norse visual identity. No new interactive features, no changes to the reveal sequence itself.

</domain>

<decisions>
## Implementation Decisions

### Rune targeting
- All runes that glow (whether all visible or a curated subset) — Claude's discretion on count
- Positions must be pixel-precise to each rune, not approximate zones
- All runes get glows regardless of background (aurora ribbons or dark sky)
- Glows must stay aligned to their runes at all screen sizes — percentage-based positioning that tracks the image as it scales/crops

### Glow visual style
- Soft ethereal haze — large, diffuse, dreamy energy radiating from each rune
- Noticeable but ambient intensity — clearly visible glow that adds atmosphere without dominating the illustration
- Fixed color per rune — no color shifting or drifting over time

### Color grouping
- Three colors: warm amber, cool teal, pale gold — as specified in roadmap
- Fixed color per rune (no color drift)

### Claude's Discretion
- Which runes to include (all visible or curated subset for best visual effect)
- Glow size per rune (uniform vs varied by rune)
- Blend mode (additive/screen vs standard opacity)
- Color assignment strategy (by position, by meaning, or visual balance)
- Color distribution ratio across the three colors
- Breathing cycle speed (how fast the pulse rhythm is)
- Degree of timing variation between runes (subtle offset vs noticeably different rhythms)
- Entrance cascade timing (how long from first glow to last)

### Animation choreography
- Staggered fade-in entrance — glows appear one by one or in small groups cascading across the image
- After entrance, settle into a slow continuous breathing cycle that runs indefinitely
- Organic, non-uniform timing — each rune's rhythm should feel alive, not mechanical

</decisions>

<specifics>
## Specific Ideas

- The hero image features Elder Futhark runes scattered across the sky area, with Yggdrasil (world tree) at center, mountain range below, and pink/teal aurora borealis ribbons
- Glows should feel like the runes are radiating magical energy — ethereal, not neon
- The entrance happens after Phase 1's text reveal completes (the text fade-up is the trigger point)
- Performance constraint: only GPU-composited properties (opacity, transform) to avoid jank

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-rune-glow-effects*
*Context gathered: 2026-02-08*
