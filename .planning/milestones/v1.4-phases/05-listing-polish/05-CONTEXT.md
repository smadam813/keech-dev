# Phase 5: Listing & Polish - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

View counts appear on the blog listing page (/blog) and the entire view count feature handles edge cases gracefully. This phase adds GET-only view counts to post cards, applies locale-aware number formatting, and ensures graceful degradation when the API is unreachable. No new backend endpoints or data mutations.

</domain>

<decisions>
## Implementation Decisions

### Count placement on cards
- Same metadata row as date and reading time, using the Jera rune separator: `date ᛃ 5 min read ᛃ 42 views`
- Matches the post page pattern for visual consistency across the site

### Loading & transition
- Match the current Phase 4 pattern: confirm current ViewCounter behavior (localStorage cache for instant display on return visits, fixed-width placeholder on first visits to prevent CLS)
- Adapt this pattern appropriately for the listing context — Claude decides whether localStorage caching makes sense for listing cards or if a simpler approach is better

### Degradation appearance
- When API is unreachable, pages render fully without errors — view count simply does not appear
- Claude decides specifics: clean omission vs dash placeholder, consistency between listing and post page, console logging behavior
- Build process must not depend on Redis availability (view counts are client-side only)

### Claude's Discretion
- View count label format on cards (e.g., "42 views" vs "42" vs abbreviated)
- Number formatting approach (plain locale "1,234" vs compact "1.2K") — pick what fits a personal blog's scale
- Whether to extract a shared formatting utility for both post page and listing cards
- Fetching strategy for listing page (bulk request vs individual per card)
- Loading transition style (instant vs subtle fade)
- Console logging on API failure (silent vs console.warn)
- Whether listing cards use localStorage caching or a simpler approach

</decisions>

<specifics>
## Specific Ideas

- User wants the metadata row pattern to be consistent: the post card should mirror the post page's `date ᛃ reading time ᛃ views` layout
- Phase 4 moved away from shimmer placeholders to localStorage caching + fixed-width placeholders — listing should be informed by that evolution, not reintroduce removed patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-listing-polish*
*Context gathered: 2026-02-21*
