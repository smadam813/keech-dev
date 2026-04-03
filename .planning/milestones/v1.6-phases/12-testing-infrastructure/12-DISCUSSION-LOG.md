# Phase 12: Testing Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 12-testing-infrastructure
**Areas discussed:** Mobile TOC Design, Vitest Configuration Scope, Playwright Test Strategy, Test File Organization
**Mode:** Auto (--auto flag — all decisions auto-selected using recommended defaults)

---

## Mobile TOC Design

| Option | Description | Selected |
|--------|-------------|----------|
| Expandable accordion at top | Positioned between back-nav and content, simple, no z-index issues | ✓ |
| Sticky sidebar | Overlays content on mobile, z-index complexity | |
| Floating FAB | Requires positioning, modal overlay, more complex | |

**User's choice:** [auto] Expandable accordion at top (recommended default)
**Notes:** Simplest approach, follows common blog patterns. Collapsed by default. Neobrutalist styling. Visible below lg breakpoint where sidebar TOC is hidden.

---

## Vitest Configuration Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Co-located test files | `*.test.ts` next to source files | ✓ |
| Separate `__tests__/` directory | All tests in dedicated directory | |

**User's choice:** [auto] Co-located test files (recommended default)
**Notes:** Easier to find and maintain. Path aliases mirrored from tsconfig. jsdom for DOM tests, node for pure functions.

---

## Playwright Test Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Chromium only | Fastest, sufficient for personal portfolio | ✓ |
| Multi-browser (Chromium + Firefox + WebKit) | More coverage, slower | |

**User's choice:** [auto] Chromium only (recommended default)

| Option | Description | Selected |
|--------|-------------|----------|
| Built app (next build + next start) | Tests production artifact | ✓ |
| Dev server (next dev) | Faster iteration, but not production | |

**User's choice:** [auto] Built app (recommended default)
**Notes:** E2E tests in `e2e/` directory at project root per Playwright convention.

---

## Test File Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Required targets only | format, views, rune-glows (unit); menu, copy, views (E2E) | ✓ |
| Extended coverage | Additional tests beyond requirements | |

**User's choice:** [auto] Required targets only (recommended default)
**Notes:** Add `test` and `test:e2e` scripts to package.json. No gold-plating.

---

## Claude's Discretion

- Exact Vitest/Playwright config options
- Test assertion style
- Mobile TOC animation (CSS transition vs. instant toggle)
- TOC toggle button text/icon
- Whether to use React Testing Library for mobile TOC component test or cover via E2E only

## Deferred Ideas

- ESLint migration (from Phase 10 deferred) — not testing scope
- CI/CD pipeline — no CI exists, separate concern
- Visual regression testing — explicitly out of scope
