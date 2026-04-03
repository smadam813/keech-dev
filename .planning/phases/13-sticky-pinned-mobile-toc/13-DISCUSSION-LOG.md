# Phase 13: Sticky/Pinned Mobile TOC - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 13-sticky-pinned-mobile-toc
**Areas discussed:** Sticky mechanism, Collapsed sticky appearance, Auto-collapse on navigation, Back-to-top affordance
**Mode:** --auto (all decisions auto-selected)

---

## Sticky Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| CSS sticky positioning | `position: sticky; top: 0` — pure CSS, no JS scroll listeners | ✓ |
| Floating overlay button | FAB-style button that opens TOC in a modal/drawer | |
| IntersectionObserver toggle | JS-driven class toggle when TOC scrolls out of view | |

**User's choice:** [auto] CSS sticky positioning (recommended default)
**Notes:** Simplest approach. Desktop TOC already uses `sticky top-24` — consistent pattern. No JavaScript positioning complexity.

---

## Collapsed Sticky Appearance

| Option | Description | Selected |
|--------|-------------|----------|
| Compact collapsed bar | Just the toggle button visible when sticky | ✓ |
| Mini floating pill | Smaller "TOC" pill that expands on tap | |
| Full accordion visible | Keep full expanded list visible while sticky | |

**User's choice:** [auto] Compact collapsed bar (recommended default)
**Notes:** Full expanded list would consume too much mobile viewport real estate. Compact bar preserves the existing accordion UX — just pinned.

---

## Auto-Collapse on Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, auto-collapse | TOC collapses after tapping a heading link | ✓ |
| No, stay expanded | TOC remains open after navigation | |
| Collapse after delay | Brief delay before auto-collapse | |

**User's choice:** [auto] Yes, auto-collapse (recommended default)
**Notes:** User navigated to target section — keeping TOC expanded would block the content they want to read.

---

## Back-to-Top Affordance

| Option | Description | Selected |
|--------|-------------|----------|
| No separate button | Sticky TOC itself is the navigation affordance | ✓ |
| Floating FAB | Separate back-to-top button alongside sticky TOC | |
| Integrated in TOC | "Back to top" link inside the TOC heading list | |

**User's choice:** [auto] No separate button (recommended default)
**Notes:** Sticky TOC provides persistent section navigation — a separate button would be redundant.

---

## Claude's Discretion

- z-index value for sticky TOC
- Visual treatment for pinned state (background opacity, shadow change)
- Transition animation for sticky state change
- Scroll-margin-top adjustments for heading targets

## Deferred Ideas

None — all decisions stayed within phase scope.
