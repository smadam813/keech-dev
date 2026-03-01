# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.5 — Tag Filtering

**Shipped:** 2026-03-01
**Phases:** 3 | **Plans:** 4 | **Sessions:** 3

### What Was Built
- Polymorphic TagChip/TechBadge components with display, link, and toggle modes
- Reusable FilterBar with renderChip delegation and count badge threading
- Blog tag filtering and project stack filtering with AND logic and URL persistence
- Count badges, "Showing X of Y" result counts, and CSS fade transitions
- Full prefers-reduced-motion support across all filter animations

### What Worked
- **Polymorphic pattern**: Building toggle mode into existing components (instead of new filter-specific ones) meant zero code duplication and zero regression
- **renderChip delegation**: FilterBar stayed completely generic — it never imports TagChip or TechBadge, making it trivially reusable across blog and projects
- **Plan-to-plan velocity**: Plans 07-01 and 07-02 executed in ~1 min each; the pattern established in 07-01 made 07-02 nearly mechanical
- **Suspense boundary pattern**: Isolating useSearchParams in a client island preserved static generation for both listing pages
- **Clean audit**: All 13 requirements, 3 phases, 2 E2E flows passed with zero gaps, zero tech debt, zero anti-patterns

### What Was Inefficient
- **Phase 6 research was partially redundant**: Existing components were simple enough that deep research wasn't necessary — a quick read would have sufficed
- **Static vs contextual counts debate**: Spent some discussion time on whether counts should update when filters change; static counts were the obvious choice for 3-5 items

### Patterns Established
- **Polymorphic component pattern**: Render path selected by prop presence (onToggle -> button, href -> link, neither -> span)
- **URL-persisted filter state**: useSearchParams read + window.history.replaceState write — avoids router re-renders
- **Suspense boundary for static+client pages**: Server page computes data, wraps client component in Suspense
- **useRef initial-render guard**: Prevents CSS transition flash on first paint or URL-preloaded state
- **Optional count prop pattern**: Chips render count only in toggle mode; display-only mode unaffected

### Key Lessons
1. **Small content sets simplify everything** — AND logic, static counts, and unit-grid fades are all correct choices precisely because there are 3-5 items per page. These decisions would revisit at 20+ items.
2. **window.history.replaceState is the right URL update primitive for filters** — router.replace triggers unnecessary server component re-renders; replaceState updates the URL while Next.js still syncs with useSearchParams.
3. **Polymorphic components beat wrapper components** — Adding a toggle mode to existing TagChip was cleaner and more maintainable than creating a separate FilterTagChip.

### Cost Observations
- Model mix: ~50% opus (planning, verification), ~50% sonnet/haiku (execution, research)
- Sessions: 3 (one per phase, roughly)
- Notable: Fastest milestone yet — 3 days, ~8 min total execution time for 4 plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Days | Phases | Plans | Key Change |
|-----------|------|--------|-------|------------|
| v1.3 | 9 | 2 | 2 | First milestone; established GSD workflow |
| v1.4 | 2 | 3 | 6 | Parallel execution, render-prop pattern |
| v1.5 | 3 | 3 | 4 | Fastest plans (~1-4 min each), clean audit |

### Cumulative Quality

| Milestone | Requirements | Coverage | Zero-Dep Additions | Tech Debt |
|-----------|-------------|----------|-------------------|-----------|
| v1.3 | 6 | 100% | 0 | 0 |
| v1.4 | 6 | 100% | 1 (@upstash/redis) | 0 |
| v1.5 | 13 | 100% | 0 | 0 |

### Top Lessons (Verified Across Milestones)

1. **CSS-first approaches consistently outperform JS libraries** — rune glows (CSS radial gradients), view count display (localStorage cache), filter transitions (CSS opacity) all avoided adding dependencies
2. **Polymorphic/composable patterns prevent code duplication** — render-prop for view counts (v1.4), renderChip for filter bar (v1.5), polymorphic chips (v1.5) all followed this principle
3. **Small scope + fast execution beats large scope + slow execution** — all three milestones shipped with zero tech debt and 100% requirement coverage
