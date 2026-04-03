# Phase 13: Sticky/Pinned Mobile TOC - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The mobile table of contents (built in Phase 12) becomes sticky so users can access section navigation at any scroll position without scrolling back to the top. This phase converts the existing static-position `MobileToc` accordion into a sticky element that remains accessible while reading.

Requirements covered: TBD (enhancement to A11Y-03 delivered in Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Sticky Mechanism
- **D-01:** Use CSS `position: sticky; top: 0` on the mobile TOC container so it pins to the top of the viewport when the user scrolls past its original position. Pure CSS — no JavaScript scroll listeners or IntersectionObserver for the positioning itself.
- **D-02:** The sticky behavior applies only below the `lg` breakpoint (where the mobile TOC is visible). The desktop sidebar TOC already has `sticky top-24` and remains unchanged.

### Collapsed Sticky Appearance
- **D-03:** When sticky, the TOC shows as a compact collapsed bar — just the "Contents" toggle button. The full heading list only appears when the user taps to expand, same as current behavior.
- **D-04:** Add a subtle visual indicator (e.g., slight background opacity, bottom border shadow) when the TOC is in its sticky/pinned state to distinguish it from the inline position. Claude has discretion on the exact treatment.

### Auto-Collapse on Navigation
- **D-05:** After the user taps a heading link in the expanded sticky TOC, the TOC auto-collapses. This prevents the expanded heading list from obscuring the content the user just navigated to.
- **D-06:** Smooth scroll to the target heading after collapse. Use native `scroll-behavior: smooth` or the existing scroll-margin-top pattern already in the codebase for heading anchors.

### Back-to-Top Affordance
- **D-07:** No separate back-to-top floating button. The sticky TOC itself serves as the persistent navigation affordance — adding a separate FAB would be redundant and a new capability beyond this phase's scope.

### Claude's Discretion
Claude has flexibility on: z-index value for sticky TOC (must be above content but below mobile menu overlay), transition animation when toggling between inline and sticky states, whether to add a visual "pinned" indicator (e.g., reduced shadow or background change), and scroll-margin-top adjustments for heading targets to account for the sticky TOC height.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Mobile TOC (Phase 12 Implementation)
- `src/components/blog/mobile-toc.tsx` — Current mobile TOC component with accordion toggle, neobrutalist styling, aria attributes. This is the primary file to modify.
- `src/components/blog/toc.tsx` — `TocEntry` type, `TocList` sub-component reused by mobile TOC, and desktop `TableOfContents` with existing `sticky top-24`.

### Blog Post Page
- `src/app/blog/[slug]/page.tsx` — Blog post layout where `MobileToc` is rendered. May need wrapper adjustments for sticky positioning context.

### Phase 12 Context
- `.planning/phases/12-testing-infrastructure/12-CONTEXT.md` — Original mobile TOC design decisions (D-01 through D-04). Sticky enhancement builds directly on this.

### Design Tokens
- `src/app/globals.css` — Neobrutalist tokens (`--shadow-brutal`, `--border-brutal`, color values) for any visual adjustments to sticky state.

### Coding Conventions
- `.planning/codebase/CONVENTIONS.md` — File naming, component patterns, accessibility patterns. All changes must follow these.

### Codebase Structure
- `.planning/codebase/STRUCTURE.md` — Directory layout, component organization.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/blog/mobile-toc.tsx` — Existing accordion with `useState` toggle, `ChevronDown` icon, `aria-expanded`/`aria-controls` attributes. The sticky enhancement modifies this component's container styling and adds auto-collapse on link click.
- `src/components/blog/toc.tsx` — Desktop TOC already uses `sticky top-24` — the mobile TOC adopts a similar pattern but at `top-0` and only below `lg` breakpoint.
- `src/lib/utils.ts` — `cn()` utility for conditional class composition.

### Established Patterns
- CSS sticky positioning is already used in the codebase (desktop TOC `sticky top-24`).
- Client components with `'use client'` for browser API needs — mobile TOC is already a client component.
- `prefers-reduced-motion` respected throughout — any new transitions should check this.
- Neobrutalist styling tokens used consistently across all UI elements.

### Integration Points
- `src/components/blog/mobile-toc.tsx` — Primary modification target. Add sticky positioning, auto-collapse on link click, and optional pinned-state visual treatment.
- `src/app/blog/[slug]/page.tsx` — May need minor adjustments to the mobile TOC wrapper `div` to ensure proper sticky context (no `overflow: hidden` ancestors that would break sticky positioning).
- `src/app/globals.css` — May need `scroll-margin-top` adjustment on heading anchors to account for sticky TOC height, or verify existing value is sufficient.

</code_context>

<specifics>
## Specific Ideas

- The sticky TOC should feel like a natural extension of the Phase 12 accordion — same component, just pinned. Not a new UI element.
- Auto-collapse after link click is the key UX improvement — without it, the expanded TOC would block the content users just navigated to.
- Keep the implementation minimal — this is a CSS positioning change with a small behavior enhancement (auto-collapse), not a component redesign.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-sticky-pinned-mobile-toc*
*Context gathered: 2026-04-03*
