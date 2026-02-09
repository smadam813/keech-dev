# Phase 1: Animation Sync & Reveal - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the hero animation timing bug so the "keech.dev" text animation never plays until the background image is fully visible. Establish a load-gated, coordinated two-beat reveal sequence (background resolves, then text fades up). Includes reduced-motion support. Rune glow effects are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Reveal choreography
- Two-beat sequence: background image resolves first, brief pause, then text fades up
- Background reveal approach: Claude's discretion (blur-to-sharp, opacity fade, or whatever looks best)
- Text enters via fade-up (opacity + upward slide)
- Pause duration between beats: Claude's discretion (tune for best feel)
- Only two elements in the sequence: background image and "keech.dev" text — no other hero elements animate

### Loading state appearance
- Pre-load state (what shows before image loads): Claude's discretion — pick whatever prevents flash/jank and looks natural
- Layout shift: Claude's discretion — ensure zero CLS for the hero section
- Slow connection behavior: Claude's discretion — handle the edge case appropriately
- Cached/repeat visits: Claude's discretion — pick the behavior that feels most natural for instant vs fresh loads

### Animation feel & timing
- Overall vibe: balanced — not cinematic-slow, not snappy-fast. Somewhere in between (~800ms-1.2s total sequence)
- Easing style for text fade-up: Claude's discretion — match the site's neobrutalist personality
- Text travel distance during fade-up: Claude's discretion — scale to font size and hero proportions
- No specific reference site — just polished and intentional

### Reduced-motion behavior
- What shows when reduced-motion is enabled: Claude's discretion — respect the accessibility preference appropriately
- CSS vs JS detection scope: Claude's discretion — consider Phase 2's needs when deciding
- Live toggle behavior (mid-session): Claude's discretion — align with accessibility best practices
- No visible indicator when animations are skipped — silently skip, clean UX

### Claude's Discretion
- Background reveal technique (blur-to-sharp vs opacity fade vs other)
- Pause duration between the two beats
- Pre-load state appearance
- Layout shift prevention approach
- Slow connection / loading indicator handling
- Cached visit behavior (animate or skip)
- Text easing curve and overshoot
- Text travel distance
- Reduced-motion detection scope (CSS only vs CSS + JS)
- Reduced-motion presentation (instant vs simplified fade)
- Live reduced-motion toggle response

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants a polished, intentional entrance that feels balanced in speed (~800ms-1.2s total), with the text doing a fade-up after the background resolves.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-animation-sync-reveal*
*Context gathered: 2026-02-08*
