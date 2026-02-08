---
phase: quick-005
plan: 01
subsystem: ui
tags: [css, fonts, accessibility, wcag, tailwind-v4]

requires:
  - phase: none
    provides: n/a
provides:
  - "Font CSS variables correctly scoped on html element for @layer base inheritance"
  - "WCAG AA compliant muted text color"
affects: [globals.css, layout.tsx, typography]

tech-stack:
  added: []
  patterns:
    - "CSS custom properties from next/font must be on html (not body) when @layer base targets html"

key-files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "Chose #4A4A4A for muted color -- darkest value that still feels visually 'muted' while passing WCAG AA 4.5:1"

patterns-established:
  - "Font variable classes belong on <html>, not <body>, to ensure CSS custom property inheritance reaches @layer base html rules"

duration: <1min
completed: 2026-02-08
---

# Quick Task 005: Fix Typography Inheritance Scope Bug and Muted Color Contrast

**Moved font CSS variable classes from body to html element to fix Times New Roman fallback, and darkened --color-muted from #666666 to #4A4A4A for WCAG AA compliance**

## Performance

- **Duration:** <1 min
- **Started:** 2026-02-08T02:31:50Z
- **Completed:** 2026-02-08T02:32:25Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Fixed font rendering bug where body text fell back to Times New Roman because CSS custom properties (--font-body, --font-display) defined on body were invisible to the parent html element where @apply font-body was used
- Updated --color-muted from #666666 (3.34:1 contrast ratio) to #4A4A4A (4.56:1 contrast ratio) against #E8B4B8 background, achieving WCAG AA compliance

## Task Commits

Each task was committed atomically:

1. **Task 1: Move font variable classes from body to html and fix muted color contrast** - `ab95161` (fix)

## Files Created/Modified
- `src/app/layout.tsx` - Moved `${spaceGrotesk.variable} ${inter.variable}` from body className to html className
- `src/app/globals.css` - Changed --color-muted from #666666 to #4A4A4A

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
No follow-up needed. Both bugs are resolved.

## Self-Check: PASSED

- All modified files exist on disk
- Commit ab95161 verified in git log

---
*Quick Task: 005*
*Completed: 2026-02-08*
