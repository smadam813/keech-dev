# Feature Landscape: v1.1 Polish & Consistency

**Domain:** Mobile navigation overhaul and cross-page layout normalization
**Researched:** 2026-02-07
**Overall Confidence:** HIGH

## Table Stakes

Features users expect from this type of change. Missing any of these will leave the polish milestone feeling incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Hamburger icon with animated X transition** | Universal mobile menu signifier. Users instinctively recognize three horizontal lines as "open menu." The icon must visually transform to an X when open so users know how to close it. | Low | CSS-only transforms on three span elements. No library needed. Rotate top/bottom lines 45deg/-45deg, fade middle line. Use 200-300ms transition. |
| **Full-screen or slide-out overlay panel** | When the hamburger opens, navigation links must appear in a panel that clearly sits above page content. Anything less (a tiny dropdown) feels incomplete on mobile. | Low-Med | Full-screen overlay is simpler to implement and fits neobrutalist aesthetic better than a partial slide panel. Use `position: fixed; inset: 0` with background color. |
| **Body scroll lock when menu is open** | If the background page scrolls while the menu overlay is visible, the experience feels broken. Users expect the overlay to be the only scrollable context. | Low | Set `overflow: hidden` on `<html>` element when menu opens. For iOS Safari resilience, also apply `position: fixed; width: 100%` to body and restore scroll position on close. |
| **Escape key closes menu** | Keyboard users and power users expect Escape to dismiss overlays. Accessibility baseline. | Low | Single `useEffect` with `keydown` listener. Also close on route change via `usePathname()`. |
| **Active page indicator in menu** | Users need to see where they currently are. The existing bottom nav has this; the hamburger menu must preserve it. | Low | Already have `usePathname()` logic from current `MobileNav`. Apply accent color or underline to active link. |
| **Consistent max-width across all pages** | Currently: Header=`max-w-6xl`, Blog=`max-w-6xl`, Projects=`max-w-5xl`, About=`max-w-3xl`, Footer=`max-w-5xl`. This makes pages feel like different websites. | Low | Standardize on one max-width for the content container (recommend `max-w-5xl` or `max-w-6xl`). Individual content areas within pages can use narrower widths for readability. |
| **Consistent vertical padding across listing pages** | Blog uses `py-8`, About uses `py-12`. Should be uniform. | Low | Standardize on `py-8` or `py-10` for all top-level page containers. |
| **Remove redundant About page social links** | The About page has GitHub/LinkedIn icon buttons that duplicate the footer social links visible on every page. Redundancy adds visual noise without value. | Low | Delete the `socialLinks` array and the social links section from `about/page.tsx`. The footer handles this globally. Keep the resume download button -- that is unique to About. |
| **Menu closes on navigation** | When a user taps a link in the hamburger menu, the menu must close and the page must navigate. If the menu stays open after navigation, it feels broken. | Low | Listen to `usePathname()` changes in a `useEffect` and set `isOpen` to `false`. |
| **Desktop nav unchanged** | The desktop header nav works well. The hamburger menu must only appear on mobile (below `md` breakpoint). Desktop must continue to show the horizontal nav bar. | Low | Already handled by `md:hidden` / `hidden md:block` pattern in current components. Preserve this. |

## Differentiators

Features that elevate the polish beyond "it works" into "it feels great." Not strictly required but noticeably improve the experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Staggered link animation on menu open** | Links fading in one after another (50-100ms delay each) creates a polished, intentional feel. Distinguishes a crafted portfolio from a template. | Low | CSS `animation-delay` or `transition-delay` on each nav link. Fits the existing `animate-fade-in-up` pattern. |
| **Backdrop dim/blur on menu open** | A semi-transparent backdrop behind the menu panel signals "modal context" and draws focus to navigation. | Low | `bg-foreground/80` or `backdrop-blur-sm` on the overlay container. Neobrutalist sites often use a solid opaque background instead of blur, which is even simpler. |
| **Smooth height/opacity transition on open/close** | Instead of instant show/hide, the menu panel animates in (slide-down, fade, or scale). Makes the interaction feel fluid rather than jarring. | Low-Med | CSS transitions on `opacity` and `transform`. Use `translate-y` or `scale` with 200-300ms duration. Must respect `prefers-reduced-motion`. |
| **Focus trap inside open menu** | When the menu overlay is open, Tab key cycling stays within the menu and hamburger button rather than reaching hidden page content. Full accessibility compliance. | Med | Requires tracking first and last focusable elements, intercepting Tab keydown, and wrapping focus. Consider a small utility or manual implementation. No library needed for 4-5 links. |
| **Shared page container component** | Extract the `<main className="container mx-auto max-w-Xyl px-6 py-8">` pattern into a reusable `<PageContainer>` component. Eliminates future drift. | Low | A thin wrapper component. All pages import it. Single source of truth for container sizing. |
| **Semantic nav region with ARIA** | Labeling the mobile nav with `aria-label="Main navigation"`, using `aria-expanded` on the hamburger button, and `aria-controls` referencing the menu panel ID. | Low | Small attribute additions. HIGH accessibility value for screen reader users. Should be table stakes for any production site, but most portfolio sites skip it. |

## Anti-Features

Features to explicitly NOT build in this milestone. These are common mistakes or scope creep traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Animated page transitions between routes** | View Transitions API is still experimental in Next.js 16. Already explicitly deferred in PROJECT.md (INTR-02). Adding this now would couple navigation changes to an unstable API. | Keep the standard instant navigation. Revisit when View Transitions stabilize. |
| **Off-canvas sidebar drawer** | Sidebar drawers that push page content to the side add complexity (transforms on the entire page) and feel wrong for a 4-link portfolio nav. Over-engineered for the use case. | Use a simple full-screen overlay. Four links do not need a sidebar. |
| **Bottom sheet navigation** | iOS-style bottom sheets are trendy but require gesture handling (drag to dismiss), spring physics, and careful touch event management. High complexity for minimal benefit. | The hamburger overlay is simpler and universally understood. |
| **Tabs or segmented controls replacing nav** | Adding horizontal tabs within pages (e.g., blog categories as tabs) would introduce navigation-within-navigation confusion. | Keep flat page structure. Use filtering/sorting within pages if needed later. |
| **Global toast/notification system** | Sometimes bundled with nav overhauls. Not needed for a static portfolio. | Not applicable. |
| **Sticky sub-navigation headers** | Adding secondary sticky headers on listing pages (e.g., a filter bar that sticks below the header) competes with the primary navigation and clutters the viewport on mobile. | Keep pages simple. The Table of Contents sidebar on blog posts is the only secondary nav, and it already hides on mobile. |
| **Per-page max-width variation for "visual interest"** | Intentionally varying container widths page-to-page is sometimes advocated for "visual rhythm." In practice, it makes the site feel inconsistent and unfinished. The current inconsistency is a bug, not a feature. | Use one max-width. Let content within pages determine its own narrower bounds (e.g., prose at max-w-3xl inside a max-w-5xl container). |
| **Moving social links to the hamburger menu** | Adding GitHub/LinkedIn inside the mobile menu might seem helpful but duplicates the footer links and clutters the nav with non-navigation items. | Social links belong in the footer. The footer is always reachable and is the conventional location. |

## Feature Dependencies

```
Hamburger Menu (core)
    |
    +-- Hamburger icon button (replaces bottom-pinned MobileNav)
    +-- Menu overlay panel with nav links
    +-- Open/close state management (useState)
    +-- Body scroll lock
    +-- Close on Escape key
    +-- Close on route change
    |
    +-- [Enhancement] Animated icon transition (bars to X)
    +-- [Enhancement] Staggered link animations
    +-- [Enhancement] Focus trap
    +-- [Enhancement] ARIA attributes
    |
    v
Layout Normalization (independent, no dependency on hamburger)
    |
    +-- Audit current max-width and padding per page
    +-- Decide standard container dimensions
    +-- Apply to all pages
    |
    +-- [Enhancement] Extract <PageContainer> component
    |
    v
About Page Cleanup (independent, no dependency on above)
    |
    +-- Remove socialLinks array and rendered social buttons
    +-- Keep resume download button
    +-- Verify page still looks balanced without social section
```

**Key observation:** All three workstreams (hamburger menu, layout normalization, About cleanup) are independent of each other. They can be built and tested in any order, or even in parallel. The hamburger menu is the largest piece of work, but still small in absolute terms.

## Current State Audit

Analysis of the existing codebase reveals the specific issues this milestone addresses.

### Layout Inconsistencies Found

| Page | Container Classes | Issues |
|------|-------------------|--------|
| Root layout `<main>` | `pt-0 md:pt-16 pb-20 md:pb-0` | `pb-20` accommodates bottom nav; must change to `pb-0` when bottom nav is removed |
| Header | `max-w-6xl mx-auto px-6` | Reference width for desktop nav |
| Footer | `max-w-5xl mx-auto px-6` | Narrower than header (inconsistent) |
| Footer | `pb-[calc(6rem+env(safe-area-inset-bottom))]` | Extra padding for bottom nav; must be removed |
| Home | `px-6 md:pb-16` (centered flex) | No max-width wrapper (fine for centered hero) |
| Blog listing | `container mx-auto max-w-6xl px-6 py-8` | Uses both `container` and `max-w-6xl` (redundant) |
| Blog post | `mx-auto max-w-6xl px-6 py-8` | No `container` class (differs from listing) |
| Projects listing | `container mx-auto max-w-5xl px-6 py-8` | Different max-width than blog |
| Project detail | `container mx-auto max-w-3xl px-6 py-8` | Narrowest max-width |
| About | `max-w-3xl mx-auto px-6 py-12` | Different padding (`py-12` vs `py-8` everywhere else), no `container` |

### Recommended Normalization

- **Outer container:** `max-w-5xl mx-auto px-6 py-8` across all content pages
- **Blog listing:** Keep `max-w-6xl` because 3-column grid needs width; or reduce grid to 2 columns at `max-w-5xl`
- **Blog post:** Keep `max-w-6xl` because of sidebar TOC layout
- **Prose content:** Already self-contained at comfortable reading width via `.prose` styles
- **Footer:** Change to match header width (`max-w-6xl`)
- **Drop `container`:** Tailwind's `container` class and explicit `max-w-*` together are redundant. Pick one pattern. Recommend explicit `max-w-*` with `mx-auto` since it is already the majority pattern.

### About Page Redundancy

The About page defines its own `socialLinks` array (lines 9-12) with GitHub and LinkedIn, identical to the footer's `socialLinks` (footer.tsx lines 4-7). Removing the About page social buttons eliminates:
- 18 lines of code (array + render section)
- Visual redundancy (same icons appear twice on the About page: once in content, once in footer)
- Import of `Github` and `Linkedin` icons from the About page

The resume download button (lines 74-86) is unique to About and must be kept.

### Mobile Nav Replacement Impact

Removing the bottom-pinned `MobileNav` triggers these required changes:

1. **Root layout:** Remove `pb-20 md:pb-0` from `<main>` (no longer need bottom clearance)
2. **Footer:** Remove `pb-[calc(6rem+env(safe-area-inset-bottom))]` (no longer need bottom nav clearance). Simplify to `py-8` matching `md:py-8`
3. **Header:** Add hamburger button visible only on mobile (`md:hidden`). Hide text nav links on mobile (`hidden md:flex`)
4. **MobileNav component:** Replace entirely with hamburger menu overlay component, or integrate hamburger into Header component

## Implementation Recommendation

### Approach: Integrate hamburger into Header

Rather than keeping a separate `MobileNav` component, add the hamburger button and overlay directly to `header.tsx` (converting it to a client component). This keeps all navigation logic in one place.

**Structure:**
- Header renders: logo + desktop nav links (hidden on mobile) + hamburger button (hidden on desktop)
- Hamburger button toggles overlay state
- Overlay renders: full-screen panel with nav links
- Overlay closes on: link click, Escape key, route change

**Why not keep MobileNav separate:**
- The hamburger button lives in the header (top-right), not at the bottom
- Having nav state split across two components adds unnecessary complexity
- One component = one source of truth for navigation

### Complexity Assessment

| Task | Estimated Effort | Risk |
|------|-----------------|------|
| Hamburger menu (full implementation with animations, a11y) | 2-3 hours | Low -- well-understood pattern |
| About page social link removal | 10 minutes | None |
| Layout normalization (all pages) | 30-60 minutes | Low -- mechanical find-and-replace |
| Footer bottom-padding cleanup | 10 minutes | None |
| Root layout padding adjustment | 10 minutes | Low -- test on mobile |
| Total | ~3-4 hours | Low |

## Sources

### High Confidence (Authoritative UX Research)

- [NN/g: Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/) -- Research showing hidden nav reduces discoverability, but acceptable when items are few and well-known (our case: 4 links)
- [NN/g: Menu-Design Checklist: 17 UX Guidelines](https://www.nngroup.com/articles/menu-design/) -- Comprehensive menu design guidelines
- [Interaction Design Foundation: Hamburger Menu UX](https://www.interaction-design.org/literature/article/hamburger-menu-ux) -- When and how to use hamburger menus effectively

### High Confidence (Accessibility Standards)

- [Accede-Web: Hamburger Menu Accessibility](https://www.accede-web.com/en/guidelines/rich-interface-components/burger-menu/) -- ARIA attributes, focus management, keyboard interaction requirements
- [Erwin Hofman: 7 Steps for Building Accessible Hamburger Menus](https://www.erwinhofman.com/blog/build-web-accessible-hamburger-dropdown-menus/) -- Step-by-step accessibility implementation
- [A11y Matters: Mobile Navigation](https://a11ymatters.com/pattern/mobile-nav/) -- Accessible mobile nav pattern reference

### High Confidence (CSS/Viewport)

- [Opus.ing: Fixing iOS Safari's Menu Bar Overlap with CSS Viewport Units](https://opus.ing/posts/fixing-ios-safaris-menu-bar-overlap-css-viewport-units) -- Modern `dvh`/`svh` viewport unit guidance for iOS Safari
- [MDN: CSS length units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) -- Official reference for `svh`, `lvh`, `dvh` units

### Medium Confidence (Community/Multiple Sources Agree)

- [Conflux: Tab Bar vs Hamburger Menu](https://www.weareconflux.com/en/blog/tab-bar-vs-hamburger-menu/) -- Comparison research: bottom tabs 40% faster task completion, but hamburger appropriate for simple sites
- [Smashing Magazine: Bottom Navigation Pattern](https://www.smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages/) -- Analysis of when bottom nav vs hamburger is appropriate
- [Matt Olpinski: 12 Things to Remove From Your Portfolio](https://mattolpinski.com/articles/fix-your-portfolio/) -- Includes guidance on simplifying redundant UI elements
- [CSS-Tricks: Prevent Page Scrolling When Modal is Open](https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/) -- Body scroll lock techniques
