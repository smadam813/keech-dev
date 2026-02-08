# Requirements: Hero Polish

**Defined:** 2026-02-08
**Core Value:** The hero section must feel polished and intentional — the "keech.dev" text animation should never play until the background is fully visible.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Animation Sync

- [ ] **SYNC-01**: Text animation waits for hero background image to be loaded and decoded before playing
- [ ] **SYNC-02**: Cached and bfcache-restored images trigger animation immediately (dual-path detection via onLoad + img.complete)
- [ ] **SYNC-03**: All new animations respect prefers-reduced-motion (extend existing media query block)
- [ ] **SYNC-04**: Zero cumulative layout shift during animation sequence

### Reveal Sequence

- [ ] **RVEAL-01**: Coordinated two-beat reveal: background resolves from blur, short pause (200-400ms), then text fades up
- [ ] **RVEAL-02**: Reveal sequence plays once per navigation to Home (not on re-render or tab switch)

### Rune Glow

- [ ] **GLOW-01**: CSS radial-gradient glow overlays positioned at each rune location in the hero image
- [ ] **GLOW-02**: Glow spots pulse with staggered timing using CSS custom property index
- [ ] **GLOW-03**: Non-linear delay curve for organic timing (not mechanical equal spacing)
- [ ] **GLOW-04**: Glow color varies by rune aett (Freyr=warm amber, Hagal=cool teal, Tyr=pale gold)
- [ ] **GLOW-05**: After initial pulse-in, glow enters slow ambient breathing cycle (4-8s period, infinite)
- [ ] **GLOW-06**: Glow animates only GPU-composited properties (opacity, transform) — no box-shadow or filter animation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Effects

- **ADV-01**: Subtle parallax on glow layer (mouse/tilt-driven depth separation)
- **ADV-02**: Responsive rune position mapping per breakpoint (account for object-cover cropping)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Canvas-based ambient glow | Over-engineered for static image; YouTube technique is for live video frames |
| Particle system / floating runes | Clashes with neobrutalist identity; runes are carved, not floating |
| Framer Motion or GSAP | 20-40KB for single hero animation; zero-library codebase precedent |
| Interactive rune hover effects | Glow positions are approximate overlays, not precise click targets; false affordance |
| Scroll-triggered hero animation | Hero is above-fold; should make impact on load, not on scroll-away |
| Dark mode glow variants | Single theme is the brand per CLAUDE.md |
| Hero layout/design changes | Keeping current composition; polish only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYNC-01 | — | Pending |
| SYNC-02 | — | Pending |
| SYNC-03 | — | Pending |
| SYNC-04 | — | Pending |
| RVEAL-01 | — | Pending |
| RVEAL-02 | — | Pending |
| GLOW-01 | — | Pending |
| GLOW-02 | — | Pending |
| GLOW-03 | — | Pending |
| GLOW-04 | — | Pending |
| GLOW-05 | — | Pending |
| GLOW-06 | — | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after initial definition*
