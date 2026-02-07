# Requirements: keech.dev

**Defined:** 2026-02-07
**Core Value:** A distinctive online presence that feels like stepping into a cosmic, Norse-touched world — memorable enough that visitors remember the site itself, not just the content.

## v1.1 Requirements

Requirements for v1.1 Polish & Consistency. Each maps to roadmap phases.

### Navigation

- [x] **NAV-04**: Mobile nav uses hamburger icon in header (replaces bottom-pinned bar)
- [x] **NAV-05**: Hamburger opens full-screen overlay with nav links
- [x] **NAV-06**: Menu auto-closes on route change
- [x] **NAV-07**: Active page is highlighted in mobile menu
- [x] **NAV-08**: Hamburger icon animates to X when menu is open
- [x] **NAV-09**: Menu traps focus while open (accessibility)
- [x] **NAV-10**: Menu locks background scroll while open

### iOS Viewport

- [x] **VIEW-01**: Layout exports `viewport-fit: cover` for proper safe-area support
- [x] **VIEW-02**: Bottom-nav padding hacks removed from layout and footer
- [x] **VIEW-03**: Footer uses correct safe-area insets with viewport-fit enabled

### Layout Consistency

- [ ] **LYOT-01**: All pages use consistent max-width for content containers
- [ ] **LYOT-02**: Vertical padding is standardized across all pages
- [ ] **LYOT-03**: Blog listing and Projects listing use aligned card layouts
- [ ] **LYOT-04**: Nested `<main>` tags removed (single `<main>` in root layout only)

### About Page Cleanup

- [x] **ABUT-04**: Social link buttons removed from About page (footer handles this)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Interactions

- **INTR-02**: Smooth page transitions (View Transitions API — experimental in Next.js 16)

### Content

- **CONT-01**: RSS feed
- **CONT-02**: Dark mode toggle

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Desktop nav changes | Desktop nav works well as-is; only mobile needs hamburger |
| Contact form | Social links sufficient for personal site |
| Newsletter signup | May add in future version |
| Comments system | Avoiding social mechanics for now |
| Dark mode | Separate milestone — significant design system work |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-04 | Phase 5 | Complete |
| NAV-05 | Phase 5 | Complete |
| NAV-06 | Phase 5 | Complete |
| NAV-07 | Phase 5 | Complete |
| NAV-08 | Phase 5 | Complete |
| NAV-09 | Phase 5 | Complete |
| NAV-10 | Phase 5 | Complete |
| VIEW-01 | Phase 5 | Complete |
| VIEW-02 | Phase 5 | Complete |
| VIEW-03 | Phase 5 | Complete |
| LYOT-01 | Phase 6 | Pending |
| LYOT-02 | Phase 6 | Pending |
| LYOT-03 | Phase 6 | Pending |
| LYOT-04 | Phase 6 | Pending |
| ABUT-04 | Phase 5 | Complete |

**Coverage:**
- v1.1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after roadmap creation*
