# Phase 5: Navigation Overhaul - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the bottom-pinned mobile navigation with a hamburger menu in the header. Fix iOS Safari viewport conflicts (bottom chrome overlap). Ensure keyboard accessibility (focus trapping, Escape to close). The footer remains after bottom nav removal with correct safe-area spacing.

</domain>

<decisions>
## Implementation Decisions

### Menu overlay style
- Overlay background: Claude's discretion (pick what fits neobrutalist aesthetic)
- Animation: Slide down from header — menu drops from the top, connected to the hamburger button
- Link layout: Claude's discretion (pick layout fitting neobrutalist style)
- Menu content: Claude's discretion (decide whether to include social icons or keep links-only)

### Hamburger icon & transitions
- Icon style: Claude's discretion (pick what fits the design system)
- Open/close animation (hamburger ↔ X): Claude's discretion
- Placement: Right side of header
- Header visibility while menu open: Claude's discretion (decide based on slide-down animation)

### Active page indication
- Active link styling in mobile menu: Claude's discretion (pick what fits neobrutalist style)
- Desktop nav active state: Claude's discretion (evaluate current desktop nav and decide)
- Menu close timing on link tap: Claude's discretion
- Same-page tap behavior: Claude's discretion

### Footer & safe-area behavior
- Footer position after bottom nav removal: Claude's discretion (based on current page flow)
- Footer content: Keep as-is — do not change footer content, just remove bottom nav
- Safe-area padding on notch devices: Claude's discretion (pick appropriate values)
- Hamburger vs desktop nav breakpoint: Claude's discretion (based on current desktop nav behavior)

### Claude's Discretion
The user granted broad discretion across most visual and interaction decisions. Key locked decisions:
- Menu animation direction: slide down from header (locked)
- Hamburger placement: right side of header (locked)
- Footer content: keep as-is, no changes (locked)

Everything else — overlay appearance, icon style, animations, active states, spacing, breakpoints — Claude has full flexibility to choose what fits the neobrutalist design system.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The user trusts Claude to make design decisions that align with the existing neobrutalist aesthetic (dusty pink, teal accent, hard shadows, thick borders).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-navigation-overhaul*
*Context gathered: 2026-02-07*
