# Phase 4: Post Page Integration - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Display a live view count on each individual blog post page. The count increments on visit (via client-side POST after hydration) while the page remains statically generated. A placeholder prevents layout shift while the count loads. Blog listing cards (Phase 5) and graceful degradation (Phase 5) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Count placement
- View count appears at the end of the metadata row, after reading time: `date ᛃ X min read ᛃ X views`
- Label format: "X views" (text, matching conversational style of "5 min read")

### Rune separator
- Replace all `·` (middle dot) metadata separators with the Jera rune ᛃ (Harvest, second aett/teal)
- Applies to both the individual post page (`[slug]/page.tsx`) and blog listing cards (`post-card.tsx`)
- Add Jera to a `POST_RUNES` or similar mapping in `rune-config.ts` for the metadata separator role
- Thematic fit: "harvest" of readership, the cycle of writing and being read

### Loading placeholder
- Skeleton shimmer animation where the view count will appear
- Shimmer is the standard loading pattern for all view counts across the site (including future Phase 5 cards)

### Low-count display
- Show "0 views" honestly — no hiding, no minimum threshold
- Every post starts at zero; transparency over vanity

### Claude's Discretion
- Shimmer visual style (neobrutalist hard-edge vs soft — pick what fits the design system)
- Transition from shimmer to number (instant vs fade)
- Singular/plural handling ("1 view" vs "1 views")
- Number formatting approach (locale-aware commas vs compact notation)
- Whether POST response updates displayed count live or defers to next visit

</decisions>

<specifics>
## Specific Ideas

- User specifically wanted Norse rune theming carried into the metadata row, not just decorative elements — the rune IS the separator, not an icon next to text
- Jera chosen for its "harvest/cycles" meaning — resonates with the publish→read cycle
- Consistency matters: rune separator on both post page and listing cards, shimmer pattern reused everywhere counts appear

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-post-page-integration*
*Context gathered: 2026-02-21*
