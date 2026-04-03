# Phase 10: Resilience & Code Quality - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 10-resilience-code-quality
**Areas discussed:** Error boundary styling, Loading skeleton approach, Code deduplication strategy, Hero refactoring scope
**Mode:** Auto (all areas auto-selected, recommended options chosen)

---

## Error Boundary Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Neobrutalist branded | Match Phase 9 MDX fallback — bold borders, hard shadows, site palette | ✓ |
| Minimal generic | Simple text-only error message, no brand styling | |
| React default | Use Next.js default error page behavior | |

**User's choice:** Neobrutalist branded (auto-selected — recommended, consistent with Phase 9)
**Notes:** Carries forward the branded fallback pattern established in Phase 9's MDX error handling.

---

## Loading Skeleton Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Key content skeletons | Skeleton UI for post grid, project grid, blog post content only | ✓ |
| Full page skeletons | Complete page skeleton including header, nav, footer | |
| Spinner only | Simple loading spinner, no skeleton | |

**User's choice:** Key content skeletons (auto-selected — recommended, site is primarily static)
**Notes:** Full page skeletons would be over-engineered given the site's static generation. Loading states are brief.

---

## Code Deduplication Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Typed generic hook | Extract `useFilteredList<T>` with generics — both lists share one hook | ✓ |
| Copy and adapt | Keep separate hooks with shared utility functions | |
| No extraction | Leave as-is, just clean up | |

**User's choice:** Typed generic hook (auto-selected — recommended, filtered-post-list and filtered-project-list have nearly identical logic)
**Notes:** Includes extracting formatDate, localStorage helpers, and unifying TagChip/TechBadge.

---

## Hero Refactoring Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Extract to hooks | Animation + glow positioning → custom hooks, component stays as one file | ✓ |
| Split into sub-components | Break Hero into HeroImage, HeroText, HeroGlows sub-components | |
| Leave as-is | Skip refactoring, just add types/comments | |

**User's choice:** Extract to hooks (auto-selected — recommended, matches QUAL-05 requirement)
**Notes:** Hero remains a single file delegating to hooks — readable composition, complex logic in hooks.

---

## Claude's Discretion

- Skeleton dimensions and pulse animation timing
- `useFilteredList` generic type constraints and API surface
- `FilterChip` variant naming convention
- Hook internal structure and return types

## Deferred Ideas

- ESLint migration after Next.js 16.2.2 removed `next lint` — belongs in Phase 12 or cleanup task
