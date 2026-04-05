# Phase 18: React 19 Lint Cleanup - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate localStorage and matchMedia patterns to idiomatic React 19 APIs (useSyncExternalStore), eliminate all react-hooks/set-state-in-effect and react-hooks/ref-access-during-render lint warnings, and preserve animation orchestration with explanatory suppression comments. Target: zero lint warnings from `npm run lint`.

</domain>

<decisions>
## Implementation Decisions

### localStorage Migration (RQ-01)
- **D-01:** Create a `useSyncExternalStore`-based hook for localStorage view cache reads — replaces `useLayoutEffect` + `setState` pattern in `view-counter.tsx` and `listing-view-counts.tsx`
- **D-02:** The `subscribe` callback listens to the `storage` event for cross-tab sync; `getSnapshot` reads `localStorage.getItem()` directly
- **D-03:** `getServerSnapshot` returns `null` (no views on server) — preserves existing behavior where view counts appear only after hydration
- **D-04:** Keep `setCachedViews()` in `src/lib/views.ts` as a write utility — only the read path migrates to useSyncExternalStore

### matchMedia Migration (RQ-02)
- **D-05:** Create a `useMediaQuery(query)` hook using `useSyncExternalStore` — `getSnapshot` returns `mq.matches`, `subscribe` wires `addEventListener('change', callback)`
- **D-06:** `getServerSnapshot` returns `false` (assume no reduced motion on server) — matches current behavior where SSR renders the animated variant
- **D-07:** Replace matchMedia patterns in both `use-hero-animation.ts` and `scroll-reveal.tsx` with the shared hook

### Animation Orchestration Preservation (RQ-04)
- **D-08:** The reveal sequence effects in `use-hero-animation.ts` (beat 1 bg-reveal, beat 2 text-reveal at 600ms, beat 3 glows at 500ms) are intentional animation orchestration — suppress with `// eslint-disable-next-line react-hooks/set-state-in-effect` plus explanatory comments
- **D-09:** The `setRevealStage('text-reveal')` in the reduced-motion branch is also intentional — suppress with comment explaining it skips animation

### Additional Lint Warnings (RQ-03)
- **D-10:** Fix `header.tsx:31` — `setIsOpen(false)` on pathname change is setState-in-effect; refactor to avoid the warning (e.g., derive close state from pathname change or use appropriate pattern)
- **D-11:** Fix `use-filtered-list.ts:30,44,52` — ref-access-during-render warnings for `getItemValuesRef.current`; refactor to avoid accessing ref during render
- **D-12:** Fix `hero.tsx:63` — ref-access-during-render warning for `entranceDelays.current[i]`; refactor to avoid ref read during render
- **D-13:** Fix `scroll-reveal.tsx:18` — setState-in-effect for `setPrefersReducedMotion`; replaced by useMediaQuery hook (D-07)
- **D-14:** Fix `error.test.tsx:25` — unused variable `container`; remove or use it
- **D-15:** Fix `use-hero-animation.ts:33` — setState-in-effect for `setImageLoaded(true)` in img.complete check; refactor to avoid the warning

### Claude's Discretion
- Exact hook file placement and naming (e.g., `src/hooks/use-media-query.ts`, `src/hooks/use-view-store.ts`)
- Whether to combine localStorage subscribe + storage event or use a simpler pattern
- How to restructure `use-filtered-list.ts` ref access (could use useMemo with stable callback, or restructure the ref pattern)
- How to restructure `hero.tsx` entrance delays ref access (could precompute as a module-level constant or use useMemo)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Affected source files
- `src/components/blog/view-counter.tsx` — localStorage read via useLayoutEffect (D-01 migration target)
- `src/components/blog/listing-view-counts.tsx` — localStorage batch read via useLayoutEffect (D-01 migration target)
- `src/lib/views.ts` — getCachedViews/setCachedViews utilities (D-04 keep write path)
- `src/hooks/use-hero-animation.ts` — matchMedia + animation orchestration (D-05, D-08, D-09 targets)
- `src/components/ui/scroll-reveal.tsx` — matchMedia in effect (D-07 migration target)
- `src/components/hero.tsx` — ref-during-render for entranceDelays (D-12 target)
- `src/components/layout/header.tsx` — setState-in-effect for menu close (D-10 target)
- `src/hooks/use-filtered-list.ts` — ref-during-render for getItemValuesRef (D-11 target)
- `src/app/error.test.tsx` — unused variable (D-14 target)

### Test files
- `src/hooks/use-hero-animation.test.ts` — existing tests that must pass after refactor
- `src/lib/views.test.ts` — existing tests for view utilities

No external specs — requirements fully captured in decisions above and ROADMAP.md success criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/views.ts` — `getCachedViews()` and `setCachedViews()` already encapsulate localStorage access; the read path becomes the `getSnapshot` for useSyncExternalStore
- `src/lib/utils.ts` — `cn()` utility used throughout; no changes needed

### Established Patterns
- All client components use `'use client'` directive consistently
- Hooks live in `src/hooks/` directory
- View count components use a context provider pattern (`ListingViewCounts` → `ViewCountsContext`)
- Animation hooks return structured result objects

### Integration Points
- `ViewCounter` and `ListingViewCounts` consume `getCachedViews` — migration changes the consumption pattern from useLayoutEffect to useSyncExternalStore
- `useHeroAnimation` is consumed by `Hero` component — matchMedia migration is internal to the hook
- `ScrollReveal` is a standalone wrapper component — matchMedia migration is self-contained
- `useFilteredList` is consumed by blog and project listing pages — ref pattern fix must preserve the same public API

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the migration patterns are well-defined by React 19 idioms. The key constraint is RQ-04: animation orchestration effects MUST be preserved with suppression comments, not refactored away.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

</deferred>

---

*Phase: 18-react-19-lint-cleanup*
*Context gathered: 2026-04-04*
