# Project Research Summary

**Project:** keech.dev v1.1 Polish & Consistency
**Domain:** Mobile Navigation Overhaul and Layout Normalization
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

This milestone addresses mobile navigation UX issues and visual consistency across the portfolio site. The current bottom-pinned tab bar navigation creates iOS Safari viewport conflicts that are architecturally unsolvable without moving navigation to the top. Research confirms that replacing the bottom nav with a hamburger menu in the header is the standard, proven approach that eliminates iOS bottom chrome overlap issues entirely.

The recommended implementation requires zero new dependencies. Everything needed exists in the current stack: lucide-react for icons, Tailwind CSS v4 for viewport utilities and animations, Next.js App Router for auto-close on navigation, and React hooks for state management. The work is low-complexity but high-impact — fixing iOS Safari bugs that currently make footer links untappable and normalizing inconsistent page layouts that make the site feel unpolished.

Key risks center on integration atomicity (nav removal, footer padding, and main content padding must all change together) and iOS-specific scroll lock patterns. Both risks are well-documented with proven solutions. The milestone is achievable in 3-4 hours of focused work with clear testing protocols for iOS Safari validation.

## Key Findings

### Recommended Stack

No new dependencies required. The existing stack already provides all necessary capabilities:

**Core technologies (no changes):**
- Next.js 16 with App Router — provides `usePathname` for auto-close on navigation and `viewport` export API for iOS safe area configuration
- Tailwind CSS v4 — ships `min-h-dvh`, `h-svh` viewport utilities and transition animations natively
- lucide-react — already installed, provides `Menu` and `X` icons for hamburger toggle
- React 19 — `useState` and `useEffect` handle all menu state needs

**What we're NOT adding:**
- No Framer Motion (Tailwind transitions sufficient for simple slide/fade)
- No @headlessui/react (overkill for 4-link nav)
- No hamburger-react (lucide icons + boolean state accomplishes same result)
- No body-scroll-lock library (position:fixed pattern works for simple overlay)

**Critical configuration addition:**
The project uses `env(safe-area-inset-bottom)` but lacks the required `viewport-fit=cover` configuration. This means safe-area padding currently evaluates to zero on all devices. Fix requires adding viewport export to root layout (one 6-line code block).

### Expected Features

**Must have (table stakes):**
- Hamburger icon with animated X transition — universal mobile menu signifier
- Full-screen or slide-out overlay panel — clear visual hierarchy above page content
- Body scroll lock when menu open — iOS Safari requires position:fixed pattern, not overflow:hidden
- Escape key closes menu — accessibility baseline
- Menu closes on navigation — App Router requires usePathname + useEffect pattern
- Active page indicator in menu — preserve existing usePathname logic from current MobileNav
- Consistent max-width across all pages — currently varies from max-w-3xl to max-w-6xl
- Desktop nav unchanged — hamburger only appears below md breakpoint

**Should have (differentiators):**
- Staggered link animation on menu open — fits existing animate-fade-in-up pattern
- Backdrop dim/blur on menu open — signals modal context (or solid opaque for neobrutalist aesthetic)
- Semantic nav region with ARIA — aria-expanded, aria-label, aria-controls
- Focus trap inside open menu — Tab cycling stays within menu when open
- Shared page container component — prevents future max-width drift

**Defer (out of scope):**
- Animated page transitions (View Transitions API still experimental in Next.js 16)
- Off-canvas sidebar drawer (over-engineered for 4 links)
- Bottom sheet navigation (requires gesture handling, adds complexity)
- Moving social links to hamburger menu (footer is conventional location)

### Architecture Approach

Replace bottom tab bar with hamburger menu integrated into the Header component. This eliminates iOS Safari bottom chrome overlap by moving navigation to the top where browser chrome doesn't interfere.

**Component boundaries:**
1. Header (server component) — Logo, desktop nav links, renders MobileMenuButton slot
2. MobileMenuButton (client component) — Hamburger toggle, owns `isOpen` state, renders MobileMenu
3. MobileMenu (client component) — Full-screen overlay with nav links, auto-closes on route change
4. Footer (server component) — Simplified padding (no bottom nav compensation)

**Key patterns:**
- Client component islands in server components — Header stays server-rendered, only MobileMenuButton ships client JS
- Auto-close on navigation — usePathname in useEffect detects route changes (replaces Pages Router router.events)
- Scroll lock with cleanup — position:fixed on body with saved scroll position (overflow:hidden insufficient on iOS)
- CSS transitions over JS animation — Tailwind utilities, no Framer Motion dependency

**Files affected:**
- CREATE: `mobile-menu-button.tsx`, `mobile-menu.tsx`
- MODIFY: `layout.tsx` (add viewport export, remove MobileNav, update main padding), `header.tsx` (add hamburger), `footer.tsx` (remove bottom-nav padding)
- DELETE: `mobile-nav.tsx`

**Layout normalization:**
Fix duplicate `<main>` tags across Blog, Projects, and About pages (root layout already provides main wrapper). Standardize container widths to max-w-5xl for listing pages, max-w-3xl for detail/reading pages.

### Critical Pitfalls

1. **iOS Safari bottom chrome overlap** — Current bottom-pinned nav overlaps footer when Safari's address bar collapses on scroll. Footer becomes untappable. Prevention: Replace bottom nav with hamburger (planned approach). Detection: Test on real iPhone, not Chrome DevTools.

2. **env(safe-area-inset-bottom) requires viewport-fit=cover** — Project uses env() but lacks the required viewport meta configuration. Safe-area padding currently evaluates to zero on all devices. Prevention: Export viewport config with viewportFit='cover' in root layout. This is a Next.js App Router API, not a manual meta tag.

3. **Menu not closing on Next.js route change** — App Router uses client-side navigation. Without usePathname watching, menu stays open after link clicks. Prevention: useEffect with pathname dependency that sets isOpen to false. This must ship from day one, not added as follow-up.

4. **Body scroll not locked on iOS Safari** — overflow:hidden on body is ignored by iOS Safari touch events. Background page scrolls behind open menu. Prevention: position:fixed on body + save/restore scroll position pattern (see PITFALLS.md for full code).

5. **Footer padding still references old bottom nav** — Footer has `pb-[calc(6rem+env(safe-area-inset-bottom))]` to clear bottom tab bar. When nav is removed, this creates massive empty gap. Prevention: Update footer padding in same PR as nav removal. These changes must be atomic.

6. **Main content padding not updated** — Root layout has `pb-20 md:pb-0` to clear bottom nav and `pt-0` because header is hidden on mobile. When header becomes visible with hamburger and bottom nav is removed, both values become wrong. Prevention: Change to `pt-16` (header height), remove `pb-20`. Must happen in same PR.

## Implications for Roadmap

Based on research, this milestone should be implemented in 2 sequential phases with clear atomic boundaries.

### Phase 1: Navigation Overhaul (Hamburger Menu Migration)

**Rationale:** The hamburger menu and bottom nav removal must happen atomically. All mobile navigation functionality must exist before the old nav is deleted, ensuring users are never without navigation. This phase eliminates the iOS Safari bottom chrome conflict entirely.

**Delivers:**
- Hamburger menu in header (mobile only)
- Full-screen overlay with nav links
- Auto-close on navigation (usePathname)
- Body scroll lock (iOS-compatible pattern)
- Escape key closes menu
- ARIA attributes and focus management
- Removal of bottom-pinned MobileNav component
- Updated footer padding (no bottom nav compensation)
- Updated main content padding (header clearance, no bottom padding)
- viewport-fit=cover configuration for safe-area insets

**Addresses features:**
- Hamburger icon with X transition (table stakes)
- Overlay panel (table stakes)
- Menu closes on navigation (table stakes)
- Desktop nav unchanged (table stakes)
- Staggered link animation (differentiator)
- Backdrop dim (differentiator)
- ARIA semantics (differentiator)

**Avoids pitfalls:**
- iOS bottom chrome overlap (Pitfall 1) — eliminated by moving nav to top
- Menu not closing on route change (Pitfall 3) — usePathname pattern from start
- Body scroll not locked (Pitfall 4) — position:fixed scroll lock pattern
- Footer padding coupling (Pitfall 7) — updated in same commit
- Main content padding (Pitfall 11) — updated in same commit

**Critical integration points:**
Files that must change together (atomic commit):
1. Create `mobile-menu-button.tsx` and `mobile-menu.tsx`
2. Modify `header.tsx` to integrate hamburger
3. Modify `layout.tsx` to remove MobileNav, add viewport export, update main padding
4. Modify `footer.tsx` to remove bottom-nav padding hack
5. Delete `mobile-nav.tsx`

**Testing protocol:**
- Mobile: Header visible with hamburger, menu works, background doesn't scroll when menu open
- Mobile: Footer sits at natural page bottom, no excess padding
- Mobile: No content hidden behind header
- Desktop: No change (header + nav unchanged)
- iPad 768px: Clean transition between hamburger and desktop nav
- iPhone with notch: Safe area padding works (verify viewport-fit=cover effective)

### Phase 2: Layout Consistency (Normalization)

**Rationale:** After navigation is stable, normalize container widths and clean up duplicate semantic elements. This work is independent of navigation and can be tested separately. Layout inconsistencies are currently most visible on tablet widths where max-w differences cause content to jump.

**Delivers:**
- Consistent max-width across all pages (max-w-5xl for listings, max-w-3xl for detail)
- Fix duplicate `<main>` tags (Blog, Projects, About pages all have nested main)
- Consistent vertical padding (standardize on py-8)
- Optional: Extract shared PageContainer component to prevent future drift

**Addresses features:**
- Consistent max-width across pages (table stakes)
- Shared page container component (differentiator)

**Avoids pitfalls:**
- Inconsistent max-width (Pitfall 6) — normalize to one width per page type
- Duplicate main tags (Pitfall 15) — change page-level main to div/section

**Work breakdown:**
- Audit current container patterns (already documented in ARCHITECTURE.md)
- Choose standard widths: max-w-5xl for listing pages, max-w-3xl for prose
- Update 6 page files (Blog listing/detail, Projects listing/detail, About, not-found)
- Fix semantic HTML (main → div on pages where layout provides main)
- Optional: Create PageContainer wrapper component

### Phase Ordering Rationale

- Phase 1 must come first because it addresses the critical iOS Safari bug and removes the root cause of footer/viewport conflicts. Layout normalization depends on knowing the final navigation architecture.
- The two phases are technically independent (layout width changes don't affect navigation), but sequencing them reduces risk. Testing nav changes in isolation makes debugging easier.
- Both phases are low-complexity with clear success criteria. Total effort: 3-4 hours.

### Research Flags

**No additional research needed:**
- Hamburger menu pattern is well-documented with established implementations
- iOS Safari viewport behavior is thoroughly researched in official WebKit docs
- Next.js App Router patterns are from official documentation
- Layout normalization is mechanical CSS class changes

**Standard patterns apply:**
- Client component islands (App Router best practice)
- usePathname for route change detection (replaces Pages Router router.events)
- position:fixed scroll lock (iOS Safari workaround, multiple verified sources)
- Accessibility attributes (WCAG 2.1 AA compliance)

**Skip `/gsd:research-phase` for both phases** — implementation is straightforward with no niche domain knowledge required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All features achievable with existing dependencies. Verified lucide-react icons exist, Tailwind v4 viewport utilities confirmed via official docs, Next.js viewport export API verified. |
| Features | HIGH | UX research from NN/g and Interaction Design Foundation confirms hamburger menu appropriate for simple 4-link nav. Accessibility patterns from a11ymatters and WCAG docs. |
| Architecture | HIGH | Component boundaries verified against existing codebase. Client island pattern is Next.js best practice. File changes audited, duplicate main tags confirmed in current code. |
| Pitfalls | HIGH | iOS Safari viewport behavior verified via WebKit blog and MDN. Scroll lock pattern verified via multiple iOS-specific sources with confirmed reproduction. Navigation close behavior verified in Next.js discussions. |

**Overall confidence:** HIGH

### Gaps to Address

No critical gaps. Minor items to validate during implementation:

- **Focus trap implementation details** — Research covers the requirement (focus must stay in menu when open) but not specific implementation. Manual tabIndex management vs lightweight utility. Decide during Phase 1 based on complexity vs benefit.

- **Staggered animation timing** — Research recommends 50-100ms delay per link but doesn't specify optimal value for 4 items. Quick A/B test during implementation to find what feels best with neobrutalist aesthetic.

- **Exact max-width values** — Research suggests max-w-5xl for listings and max-w-3xl for detail pages, but final decision should consider existing content density. Preview at different widths during Phase 2 before committing.

- **PageContainer component extraction** — Optional enhancement. Research doesn't address whether this adds value vs simple utility class. Decide during Phase 2 based on whether layout variations are likely in future work.

All gaps are implementation details, not architectural unknowns. None block starting work.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) — viewportFit property for viewport-fit=cover
- [Next.js usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname) — Route change detection in App Router
- [Tailwind CSS v4 Height Utilities](https://tailwindcss.com/docs/height) — dvh/svh/lvh viewport units built-in
- [MDN env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) — Safe area inset CSS environment variables
- [WebKit: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) — viewport-fit=cover and safe-area insets
- [Lucide Icons](https://lucide.dev/icons/) — Menu and X icons verified

**Standards/Specifications:**
- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) — Accessibility requirements for navigation
- [a11ymatters: Mobile Navigation](https://a11ymatters.com/pattern/mobile-nav/) — Accessible mobile nav pattern reference

### Secondary (MEDIUM confidence)

**UX Research:**
- [NN/g: Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/) — Research showing hidden nav acceptable when items are few and well-known
- [NN/g: Menu-Design Checklist: 17 UX Guidelines](https://www.nngroup.com/articles/menu-design/) — Comprehensive menu design guidelines
- [Interaction Design Foundation: Hamburger Menu UX](https://www.interaction-design.org/literature/article/hamburger-menu-ux) — When to use hamburger menus effectively

**Implementation Patterns:**
- [Erwin Hofman: 7 Steps for Accessible Hamburger Menus](https://www.erwinhofman.com/blog/build-web-accessible-hamburger-dropdown-menus/) — Accessibility implementation
- [Samuel Kraft: Safari 15 Bottom Tab Bars](https://samuelkraft.com/blog/safari-15-bottom-tab-bars-web) — iOS Safari safe area patterns
- [Jay Freestone: Locking body scroll on iOS](https://www.jayfreestone.com/writing/locking-body-scroll-ios/) — iOS-specific scroll lock pattern
- [PQINA: Prevent scrolling on iOS Safari 15](https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari) — position:fixed scroll lock approach

### Tertiary (Context)

**Community Examples:**
- [Smashing Magazine: Bottom Navigation Pattern](https://www.smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages/) — UX tradeoffs between navigation patterns
- [Conflux: Tab Bar vs Hamburger Menu](https://www.weareconflux.com/en/blog/tab-bar-vs-hamburger-menu/) — Comparison research
- [Opus.ing: iOS Viewport Units](https://opus.ing/posts/fixing-ios-safaris-menu-bar-overlap-css-viewport-units) — svh vs dvh guidance
- [Next.js Discussion #46542](https://github.com/vercel/next.js/discussions/46542) — viewport-fit=cover support confirmed

---

*Research completed: 2026-02-07*
*Ready for roadmap: yes*
