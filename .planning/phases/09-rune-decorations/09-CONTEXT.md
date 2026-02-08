# Phase 9: Rune Decorations - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Weave Elder Futhark decorative rune elements across the site — section dividers, list bullet markers, navigation accents, and background texture. Reinforces the Norse identity established in Phases 7-8 without overwhelming the neobrutalist foundation. Does not include new page layouts, content features, or interactive rune elements.

</domain>

<decisions>
## Implementation Decisions

### Rune character selection
- Runes carry actual Elder Futhark meaning — each chosen for its symbolic association with the context where it appears
- Context-specific mapping: blog/knowledge sections get wisdom runes, project sections get craft/creation runes, navigation gets journey runes
- Support the full 24-rune Elder Futhark alphabet — not all need to appear now, but the system should accommodate all 24 for future use
- Claude researches Elder Futhark meanings and proposes the context-to-rune mapping during planning; user reviews before implementation

### Rune rendering
- Use a dedicated runic font that covers the Elder Futhark Unicode block (U+16A0–U+16FF) — NOT the existing Norse display font (Joel Carrouche), which does not contain actual rune glyphs
- Researcher to find appropriate runic font options (WOFF2, open license)
- Style and aesthetic of rune font: Claude's discretion to pick what bridges Norse theme with neobrutalist foundation

### Visual weight & density
- Accent-level prominence: clearly visible but secondary to content — like a decorative border or styled bullet, present but not dominant
- Per-page density: Claude's discretion to vary density based on what looks best (home page may be richer, content pages lighter)
- Background texture approach: Claude's discretion (faint scatter, geometric pattern, or single large rune)
- Animation: Claude's discretion on whether scroll reveal or static treatment works better

### Placement & integration
- Section dividers: Claude's discretion on rune-decorated divider style (rune between lines, rune sequence, etc.)
- Blog/project list bullets: Claude's discretion on same-rune-per-list vs different-rune-per-item
- Navigation rune accents: Claude's discretion on placement (prefix, active indicator, etc.) that complements existing header/mobile nav
- Background texture location: Claude's discretion on where it has most visual impact without distracting from content

### Styling & color treatment
- Rune color: Claude's discretion on teal accent, neutral, or mixed approach based on cohesion with existing palette
- All decorative rune elements must be aria-hidden for accessibility

### Claude's Discretion
- Divider style (rune between lines vs rune sequence vs other)
- Bullet approach (same rune per list vs varied)
- Nav accent placement and behavior
- Background texture style and location
- Color treatment (teal, neutral, or context-dependent mix)
- Animation (static vs scroll-reveal)
- Per-page density variation
- Rune font aesthetic (carved vs clean geometric vs hybrid)

</decisions>

<specifics>
## Specific Ideas

- Runes should carry actual meaning from the Elder Futhark tradition — not random decoration
- The Norse display font (Joel Carrouche) does NOT contain rune glyphs; a separate runic font is needed
- User wants to support all 24 Elder Futhark runes even if not all appear initially — build the system for the full set
- User trusts Claude's visual judgment on most placement and styling specifics — propose during planning for review

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-rune-decorations*
*Context gathered: 2026-02-08*
