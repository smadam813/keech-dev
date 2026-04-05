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

## Milestone: v1.6 — Address Concerns

**Shipped:** 2026-04-03
**Phases:** 5 | **Plans:** 13 | **Quick tasks:** 3

### What Was Built
- Security headers (CSP, X-Frame-Options, etc.) on all routes via next.config.ts headers config
- API input validation (slug regex, batch limits) and rate limiting (@upstash/ratelimit)
- MDX try-catch with branded fallback + error boundaries at three route levels
- Loading skeleton UI for route transitions
- Code quality: shared useFilteredList hook, formatDate, localStorage helpers, FilterChip unification, Hero hook extraction
- Othala rune favicon set + dynamic OG image generators (site-level + per-post)
- RSS feed at /feed.xml, sitemap with actual content dates, project image sizes
- Vitest (18 unit tests) + Playwright (14 E2E tests) infrastructure
- Collapsible mobile TOC accordion + sticky positioning with auto-collapse
- ESLint migrated to native flat config (Next.js 16 dropped `next lint` CLI)

### What Worked
- **Comprehensive audit-driven scope**: Starting from a codebase audit meant every requirement had clear justification — no scope creep, no "nice to have" features
- **Phase 13 emerged from UAT**: The sticky TOC was a backlog item promoted to a phase during Phase 12 UAT — the workflow handled mid-milestone scope addition cleanly via decimal-free insertion
- **Quick tasks for audit cleanup**: Using /gsd:quick for lint fix, traceability backport, and E2E hardcoded slug fix was efficient — full phase overhead would have been wasteful for these
- **Nyquist validation**: All 5 phases achieved compliance; the automated validation audit caught documentation gaps early
- **Milestone audit before completion**: The audit confirmed 38/38 requirements satisfied and identified only deferred tech debt, giving confidence to ship

### What Was Inefficient
- **Phase 10 had 4 plans for what could have been 2-3**: The code quality consolidation (formatDate, localStorage, FilterChip, Hero hooks) was split too granularly — plans 10-02 and 10-03 could have been one plan
- **Some SUMMARY.md one-liners were noisy**: Auto-extracted accomplishments included internal notes (e.g., "Rule 2 - Missing critical functionality") that needed manual cleanup at archive time
- **STATE.md still referenced v1.5 context**: The state file wasn't fully updated during v1.6 execution — it still showed v1.5 phase counts and performance metrics

### Patterns Established
- **Audit-driven milestone scoping**: Codebase audit → categorized concerns → requirements → roadmap phases
- **Security headers via next.config.ts**: Central headers config in next.config.ts covers all routes without middleware
- **MDX two-layer error protection**: try-catch in MDXContent component + route-level error.tsx boundary
- **Dynamic OG images via ImageResponse**: No external service; Next.js built-in ImageResponse with inline JSX
- **CSS sticky TOC**: Pure CSS `position: sticky` with auto-collapse via onClick state toggle — no IntersectionObserver needed

### Key Lessons
1. **Hardening milestones are high-value, low-glamour work** — 38 requirements across security, quality, accessibility, SEO, and testing produced no visible new features but dramatically improved site robustness
2. **CSP with static generation requires pragmatic compromises** — `unsafe-eval` for MDX and `unsafe-inline` for syntax highlighting are acceptable tradeoffs when there's no user-generated content
3. **Test infrastructure should be the last phase** — testing the final code shape avoids rewriting tests when earlier phases change APIs
4. **Quick tasks are the right tool for audit-discovered fixes** — full GSD phase overhead isn't justified for single-file documentation fixes or one-line code changes

### Cost Observations
- Model mix: ~70% opus (planning, verification, milestone ops), ~30% sonnet/haiku (execution, research)
- Sessions: Multiple (phases executed across several sessions with context handoffs)
- Notable: Largest milestone by plan count (13 plans vs 2-6 in prior milestones) with highest requirement count (38)

---

## Milestone: v1.7 — Address Additional Concerns

**Shipped:** 2026-04-05
**Phases:** 6 | **Plans:** 9 | **Tasks:** 21

### What Was Built
- Eliminated `unsafe-eval` from CSP by migrating MDX from runtime `new Function()` to compile-time HTML via `s.markdown()`
- Centralized all security headers in src/proxy.ts middleware (single source of truth)
- Migrated syntax highlighting to CSS-variables theme with 14 `--shiki-*` tokens in globals.css
- Replaced useState+useEffect anti-patterns with useSyncExternalStore hooks (useViewStore, useMediaQuery)
- Achieved zero ESLint warnings and 135 passing unit tests

### What Worked
- **Phase sequencing**: Foundation (14) → Infrastructure (15) → Migration (16-17) → Quality (18) → Verification (19) was clean — each phase built on the last with no rework
- **Research-first approach**: Phase research agents identified the s.markdown() path early, avoiding dead ends with next-mdx-remote or server-component MDX
- **Quick-inline plans**: Phases 14, 15, and 18-03 used fast execution for small scoped work — no overhead for trivial tasks
- **Audit-before-complete**: Milestone audit caught 7 stale REQUIREMENTS.md checkboxes and documentation inaccuracies before archival

### What Was Inefficient
- **REQUIREMENTS.md checkbox lag**: 7 requirements were verified satisfied but never had their checkboxes updated — the audit had to catch this. Phase transition workflow should auto-update checkboxes
- **Nyquist validation skipped entirely**: All 6 phases have draft VALIDATION.md files but none completed Nyquist. Process gap — not blocking but represents skipped quality gate
- **Phase 15 naming**: MID-01 requirement referenced `src/middleware.ts` but Next.js 16 uses `src/proxy.ts` — requirement text wasn't updated when the convention was discovered

### Patterns Established
- **CSS-variables for design tokens**: Shiki theme tokens in globals.css alongside other design tokens — consistent CSS-first approach
- **useSyncExternalStore for browser APIs**: Standard pattern for localStorage and matchMedia going forward
- **useTransition for filter transitions**: Cleaner than manual state + setTimeout for UI transitions
- **Compile-time HTML rendering**: dangerouslySetInnerHTML with author-controlled content is safe and performant

### Key Lessons
1. **Research agents save time on migration work** — the s.markdown() discovery in Phase 16 research avoided a multi-day investigation into broken alternatives
2. **Small phases execute fast** — Phases 14 and 15 were 2-minute inline executions; splitting them from Phase 16 kept commits clean without adding overhead
3. **Milestone audit is worth running** — caught documentation staleness that would have been archived as-is

### Cost Observations
- Model mix: ~70% opus (planning/execution), ~25% sonnet (research/verification agents), ~5% haiku (quick checks)
- Sessions: ~6 sessions across 3 days
- Notable: v1.7 shipped in 3 days with 6 phases — consistent velocity with v1.5/v1.6

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Days | Phases | Plans | Key Change |
|-----------|------|--------|-------|------------|
| v1.3 | 9 | 2 | 2 | First milestone; established GSD workflow |
| v1.4 | 2 | 3 | 6 | Parallel execution, render-prop pattern |
| v1.5 | 3 | 3 | 4 | Fastest plans (~1-4 min each), clean audit |
| v1.6 | 2 | 5 | 13 | Largest scope; audit-driven; first testing infrastructure |
| v1.7 | 3 | 6 | 9 | Security hardening; eliminated unsafe-eval; React 19 migration |

### Cumulative Quality

| Milestone | Requirements | Unit Tests | E2E Tests | Tech Debt |
|-----------|-------------|-----------|-----------|-----------|
| v1.3 | 6 | 0 | 0 | 0 |
| v1.4 | 6 | 0 | 0 | 0 |
| v1.5 | 13 | 0 | 0 | 0 |
| v1.6 | 38 | 18 | 14 | 7 (deferred) |
| v1.7 | 24 | 135 | 18 | 4 (minor doc items) |

### Top Lessons (Verified Across Milestones)

1. **CSS-first approaches consistently outperform JS libraries** — rune glows (CSS radial gradients), view count display (localStorage cache), filter transitions (CSS opacity), sticky TOC (CSS position: sticky), syntax highlighting tokens (CSS variables) all avoided adding dependencies
2. **Polymorphic/composable patterns prevent code duplication** — render-prop for view counts (v1.4), renderChip for filter bar (v1.5), polymorphic chips (v1.5), unified FilterChip (v1.6) all followed this principle
3. **Audit-driven scoping produces comprehensive, justified milestones** — v1.6's 38 requirements and v1.7's 24 requirements all traced back to audits, resulting in zero scope creep and 100% coverage
4. **Quick tasks complement phase workflow for small fixes** — full GSD overhead isn't warranted for single-file changes; /gsd:quick strikes the right balance
5. **Research agents prevent dead-end investigations** — confirmed in v1.6 (security header approach) and v1.7 (MDX migration path discovery)
