# Domain Pitfalls

**Domain:** Mobile Navigation Overhaul and Layout Consistency for Next.js Portfolio
**Project:** keech.dev
**Researched:** 2026-02-07
**Confidence:** HIGH (verified via official WebKit docs, MDN, Next.js docs, and multiple community sources with confirmed reproduction)
**Scope:** Pitfalls specific to replacing bottom-pinned mobile nav with hamburger menu, fixing iOS Safari viewport overlap, removing redundant UI, and normalizing layout consistency.

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: iOS Safari Bottom Chrome Overlap with Fixed Elements

**What goes wrong:** The current bottom-pinned `MobileNav` (`fixed bottom-0`) overlaps with the `Footer` when iOS Safari's bottom chrome (address bar / home indicator bar) collapses on scroll. The nav appears to float above where the user expects it, or the footer gets buried behind both the nav and the browser chrome. This is the exact bug reported in the project context.

**Why it happens:** iOS Safari dynamically resizes the viewport when the user scrolls. The browser's bottom toolbar shrinks/disappears on scroll-down and reappears on scroll-up. `position: fixed; bottom: 0` elements anchor to the viewport edge, but the viewport edge itself moves. The footer uses `pb-[calc(6rem+env(safe-area-inset-bottom))]` to account for the nav, but this calculation assumes a static viewport -- when the chrome collapses, the math breaks and elements stack awkwardly.

**Consequences:**
- Footer content becomes untappable (interactive area does not match visual position)
- Visual stacking where nav bar and footer overlap or leave a gap
- Users on iPhone cannot reliably reach footer social links
- The problem is invisible in desktop browser testing and Chrome DevTools mobile emulation

**Prevention:**
- **Replace the bottom-pinned nav entirely.** A hamburger menu in the header eliminates the root cause -- no more competing fixed-bottom elements. This is the planned approach and it is the correct one.
- If any fixed-bottom element is retained, use `svh` (small viewport height) units rather than `dvh` or `vh` for height calculations. `svh` represents the viewport with all chrome visible, which is the safe conservative value.
- Never use `100vh` for mobile layout calculations. Use `100dvh` for full-viewport containers and `100svh` for fixed elements.
- Test on a real iOS device. Chrome DevTools mobile mode does **not** simulate Safari's dynamic viewport behavior.

**Detection:**
- Scroll down on a real iPhone in Safari and watch the footer/nav area
- Content behind the nav bar becomes visible as a flash during scroll transitions
- Tap targets near the bottom of the screen fail intermittently

**Phase relevance:** Phase 1 (Navigation Overhaul) -- the hamburger menu migration eliminates this entire class of bugs.

**Sources:**
- [WebKit: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Opus.ing: Fixing iOS Toolbar Overlap](https://opus.ing/posts/fixing-ios-safaris-menu-bar-overlap-css-viewport-units)
- [WebKit Bug 261185: svh/dvh units unexpectedly equal](https://bugs.webkit.org/show_bug.cgi?id=261185)
- [dev-tips: Overlapping bottom nav despite 100vh in iOS Safari](https://dev-tips.com/css/overlapping-bottom-navigation-bar-despite-100vh-in-ios-safari)

---

### Pitfall 2: env(safe-area-inset-bottom) Requires viewport-fit=cover

**What goes wrong:** The current codebase uses `env(safe-area-inset-bottom)` in both the `MobileNav` and `Footer` components, but there is no `viewport-fit=cover` configuration anywhere in the project. Without this meta tag, `env(safe-area-inset-bottom)` resolves to `0` on all devices, making the safe-area padding completely inert.

**Why it happens:** `env(safe-area-inset-bottom)` only returns non-zero values when the viewport meta tag includes `viewport-fit=cover`. This is by design -- the browser only reports safe area insets when you opt into extending content into the unsafe area. Most developers assume `env()` "just works" because the CSS doesn't error.

**Consequences:**
- On devices with a home indicator (iPhone X and later), content can be obscured by the home bar
- The footer's `pb-[calc(6rem+env(safe-area-inset-bottom))]` currently does nothing beyond the static `6rem` padding
- The mobile nav's `paddingBottom: 'env(safe-area-inset-bottom)'` inline style is also inert
- No visual error -- the CSS is valid, it just evaluates to zero

**Prevention:**
- In the root layout, export a viewport configuration:
  ```typescript
  import type { Viewport } from 'next'
  export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  }
  ```
- This is the Next.js App Router way to set viewport meta tags (not in the metadata export -- it is a separate `viewport` export)
- After adding `viewport-fit=cover`, verify that all edge-to-edge elements properly account for safe areas

**Detection:**
- Inspect the rendered HTML and look for `viewport-fit=cover` in the viewport meta tag -- if absent, `env()` values are zero
- On an iPhone with a home indicator, check if bottom padding actually appears

**Phase relevance:** Phase 1 (Navigation Overhaul) -- must fix before any safe-area-dependent layout changes.

**Sources:**
- [MDN: env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)
- [Next.js: generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport)
- [CSS-Tricks: The Notch and CSS](https://css-tricks.com/the-notch-and-css/)

---

### Pitfall 3: Hamburger Menu Not Closing on Next.js Route Change

**What goes wrong:** User taps a link in the hamburger menu, the page content changes (App Router client-side navigation), but the menu stays open. The user sees the new page content behind the still-visible menu overlay.

**Why it happens:** Next.js App Router uses client-side navigation by default. The route changes without a full page reload, so React state (including `isOpen`) persists. If the menu open/close state is not wired to route changes, the menu never closes on navigation.

**Consequences:**
- User must manually close the menu after every navigation
- Content is obscured by the open menu overlay
- Feels broken -- users expect menu to close after selecting a destination

**Prevention:**
- Use `usePathname()` from `next/navigation` in a `useEffect` to close the menu whenever the pathname changes:
  ```typescript
  const pathname = usePathname()
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])
  ```
- This is the standard Next.js App Router pattern. Do NOT use router events (which are Pages Router only).
- Place this effect in the same component that owns the `isOpen` state.

**Detection:**
- Open the hamburger menu, tap a nav link, observe whether the menu closes
- Test all navigation paths, including blog post links and back button

**Phase relevance:** Phase 1 (Navigation Overhaul) -- must be implemented from the start, not added as a fix later.

**Sources:**
- [Next.js: usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname)
- [DevJonas: State change on route change with usePathname](https://devjonas.medium.com/how-to-change-a-state-when-a-route-is-changing-using-nextjs-app-directory-with-usepathname-d5c5e35b36a1)
- [Next.js Discussion #16316: Burger menu page switching](https://github.com/vercel/next.js/discussions/16316)

---

### Pitfall 4: Body Scroll Not Locked When Menu Overlay Is Open

**What goes wrong:** When the hamburger menu overlay is open, the user can still scroll the page content behind it. On iOS Safari specifically, `overflow: hidden` on the body does NOT prevent scrolling -- the page bounces and scrolls behind the overlay.

**Why it happens:** iOS Safari has a long-standing behavior where `overflow: hidden` on `<body>` is ignored for touch scroll events. This is a WebKit design decision, not a bug. Desktop browsers respect `overflow: hidden` on body; iOS Safari does not.

**Consequences:**
- User scrolls the background page while trying to interact with the menu
- Disorienting visual experience
- Can cause the user to lose their scroll position
- Menu items may shift position if the background scrolls

**Prevention:**
- When the menu opens, apply `position: fixed; inset: 0; overflow: hidden` to the body, and store the current `scrollY` position
- When the menu closes, remove those styles and restore the scroll position using `window.scrollTo(0, savedPosition)`
- The full pattern:
  ```typescript
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])
  ```
- Alternatively, use `overscroll-behavior: none` on the overlay container (works in newer Safari versions but not universally)

**Detection:**
- Open the menu on an iPhone and try to scroll -- if the background moves, the lock is broken
- Also test with the on-screen keyboard visible (compounds the problem)

**Phase relevance:** Phase 1 (Navigation Overhaul) -- must ship with the hamburger menu, not as a follow-up.

**Sources:**
- [Medium: I fixed a decade-long iOS Safari problem (body scroll lock)](https://stripearmy.medium.com/i-fixed-a-decade-long-ios-safari-problem-0d85f76caec0)
- [Markus Oberlehner: Prevent body scrolling on iOS](https://markus.oberlehner.net/blog/simple-solution-to-prevent-body-scrolling-on-ios)
- [PQINA: Prevent scrolling on iOS Safari 15](https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari)
- [Jay Freestone: Locking body scroll on iOS](https://www.jayfreestone.com/writing/locking-body-scroll-ios/)

---

## Moderate Pitfalls

Mistakes that cause delays or noticeable UX issues.

### Pitfall 5: Hamburger Menu Missing Accessibility Fundamentals

**What goes wrong:** The hamburger menu looks fine but is completely broken for screen reader users and keyboard-only navigation. No focus management, no ARIA attributes, no escape-to-close.

**Why it happens:** Developers build the visual/interaction layer first and treat accessibility as a follow-up task. But an inaccessible navigation is a critical failure, not a polish item.

**Consequences:**
- Screen reader users cannot navigate the site on mobile
- Keyboard users get trapped or cannot reach menu items
- Fails WCAG 2.1 AA compliance (which is table stakes for professional sites)
- Focus escapes behind the overlay, causing confusion

**Prevention:**
- The hamburger button must have `aria-expanded="true|false"` and `aria-label="Menu"` (or `aria-label="Open navigation"` / `"Close navigation"` toggled)
- When the menu opens, move focus to the first menu item or the close button
- When the menu closes (via close button or Escape key), return focus to the hamburger button
- Add `role="dialog"` or `role="navigation"` to the menu container
- Trap focus within the menu while it is open (Tab should cycle through menu items only)
- Listen for Escape key to close the menu
- The menu content should be `aria-hidden="true"` when closed, or removed from the DOM entirely

**Detection:**
- Navigate the site using only Tab/Shift+Tab/Enter/Escape
- Test with VoiceOver on iOS or NVDA on Windows
- Run axe-core or Lighthouse accessibility audit

**Phase relevance:** Phase 1 (Navigation Overhaul) -- build accessibility in from the start, not retrofitted.

**Sources:**
- [DEV.to: Your hamburger menu button is inaccessible](https://dev.to/savvasstephnds/your-hamburger-menu-button-is-inaccessible-here-s-how-to-fix-it-7n)
- [Erwin Hofman: 7 steps for accessible hamburger menus](https://www.erwinhofman.com/blog/build-web-accessible-hamburger-dropdown-menus/)
- [a11ymatters: Mobile Navigation](https://a11ymatters.com/pattern/mobile-nav/)

---

### Pitfall 6: Inconsistent max-width Across Pages

**What goes wrong:** Different pages use different `max-w-*` values, causing content to jump width when navigating. The current codebase has this exact problem:
- Home: no max-width (full flex container)
- Blog listing: `max-w-6xl`
- Projects listing: `max-w-5xl`
- About: `max-w-3xl`
- Blog post detail: `max-w-6xl`
- Project detail: `max-w-3xl`

Users perceive the width inconsistency as sloppiness, especially on larger tablets where the difference between `max-w-3xl` (48rem) and `max-w-6xl` (72rem) is 384px.

**Why it happens:** Each page was built independently with "whatever looks right" width. No shared layout width convention was established. The widths may each be locally reasonable (narrow for reading, wide for grids) but the overall experience feels inconsistent.

**Consequences:**
- Visual jarring when navigating between pages
- Header/footer feel disconnected from content when widths differ dramatically
- On tablets, content "jumps" left/right as max-width changes between routes

**Prevention:**
- Establish a content-width convention: pick one primary `max-w` for listing pages and one for reading/detail pages
- Use a shared layout wrapper component (e.g., `<PageContainer variant="wide|narrow">`) to enforce consistency
- Acceptable pattern: listing pages use `max-w-5xl`, detail/reading pages use `max-w-3xl`, but apply consistently
- The Home page is an exception (hero layout) and does not need to match

**Detection:**
- Navigate between Blog and Projects listing pages at tablet width -- watch for content width jumping
- Navigate from About to Blog -- the content area nearly doubles in width

**Phase relevance:** Phase 2 (Layout Consistency) -- after navigation is settled, normalize widths.

---

### Pitfall 7: Footer Padding Calculation Breaks When Bottom Nav Is Removed

**What goes wrong:** The current footer has `pb-[calc(6rem+env(safe-area-inset-bottom))] md:py-8` to account for the bottom-pinned mobile nav. When the bottom nav is replaced with a hamburger menu, this extra padding remains, creating a massive empty gap at the bottom of every page on mobile.

**Why it happens:** The footer padding was coupled to the existence of the bottom nav. When one component changes, the other is forgotten. The `6rem` is hard-coded specifically to clear the 4rem nav bar plus padding.

**Consequences:**
- Huge empty space below footer on mobile
- Footer looks broken or "too far from content"
- Easy to miss because the change is in a different file from the nav removal

**Prevention:**
- When removing the `MobileNav` bottom bar, simultaneously update the footer padding
- Remove the mobile-specific `pb-[calc(6rem+...)]` and use standard padding (e.g., `py-8`) for all breakpoints
- Keep `env(safe-area-inset-bottom)` padding only if needed for the home indicator bar on notched iPhones (but use the correct amount -- just `env(safe-area-inset-bottom)`, not `6rem + env(...)`)
- Consider wrapping safe-area handling in a utility class rather than inline calc()

**Detection:**
- After removing the bottom nav, view any page on mobile -- the footer will have ~6rem of unexplained bottom padding
- Compare footer spacing on mobile vs desktop

**Phase relevance:** Phase 1 (Navigation Overhaul) -- must be done in the same PR as the nav removal.

---

### Pitfall 8: Hamburger Menu Transition/Animation Causing Layout Shifts

**What goes wrong:** The menu slides in from the side or fades in, but during the animation, it pushes page content or causes the scrollbar to appear/disappear, creating a layout shift.

**Why it happens:** If the menu is part of the document flow (not overlaid), it displaces content. Even if overlaid, toggling `overflow: hidden` on body can cause the scrollbar to disappear, shifting content by ~15px (scrollbar width).

**Consequences:**
- Content shifts horizontally when menu opens/closes
- On desktop (if the breakpoint is wrong), the hamburger might appear and cause shifts
- Layout shift hurts CLS (Cumulative Layout Shift) score

**Prevention:**
- Use `position: fixed` or `position: absolute` for the menu overlay -- never let it be in normal document flow
- When locking body scroll, add `padding-right` equal to the scrollbar width to prevent content shift (use `window.innerWidth - document.documentElement.clientWidth` to calculate)
- On mobile, scrollbar width is typically 0, so this mainly matters if the hamburger is visible at tablet sizes
- Use `transform: translateX()` for slide-in animation rather than `width` or `left` changes -- transforms do not trigger layout recalculation

**Detection:**
- Watch header content when opening/closing menu -- does it shift horizontally?
- Check CLS score in Lighthouse before and after adding the menu

**Phase relevance:** Phase 1 (Navigation Overhaul) -- get the animation approach right from the start.

---

### Pitfall 9: Removing About Page Social Links Creates Orphaned Content

**What goes wrong:** The About page's social links (GitHub, LinkedIn) and the disabled "Resume Coming Soon" button are removed to de-duplicate from the footer, but the About page then feels empty or missing a call-to-action. The page loses its "contact surface."

**Why it happens:** The buttons served a dual purpose: navigation shortcut AND visual weight for the about page design. Removing them solves the duplication problem but creates a design problem.

**Consequences:**
- About page feels incomplete or truncated
- Users on the About page have no clear next action
- The photo + bio section looks unbalanced without the social/CTA section below

**Prevention:**
- Before removing the social links, plan what replaces them visually. Options:
  - A "Get in touch" section that links to email or contact form (differentiates from footer)
  - Move the resume download to a more prominent position within the bio section
  - Add a "Recent posts" or "Featured projects" section to give the page more substance
- The key principle: remove duplication but replace the visual weight and call-to-action purpose
- Do NOT just delete the section and call it done

**Detection:**
- After removing social buttons, view the About page on mobile -- does it feel like something is missing?
- Compare the visual balance before and after

**Phase relevance:** Phase 2 (Layout Consistency) -- after nav is settled, refine page content.

---

### Pitfall 10: Mobile Breakpoint Mismatch Between Header and Hamburger

**What goes wrong:** The desktop header is `hidden md:block` (shows at 768px+) and the hamburger menu is `md:hidden` (hides at 768px+). If these breakpoints don't match exactly, there's a gap where neither navigation is visible, or both are visible simultaneously.

**Why it happens:** The header and hamburger are in separate components. A developer might change one breakpoint without updating the other, or use `lg:` instead of `md:` for one.

**Consequences:**
- At exactly 768px, both menus flash or neither appears
- On certain tablets (iPad Mini in portrait is 768px), navigation is broken
- Users report "navigation disappeared" on specific devices

**Prevention:**
- Use the SAME Tailwind breakpoint (`md:` = 768px) consistently for both the show/hide toggle
- Consider extracting the breakpoint to a shared constant or CSS custom property
- Test at exactly 768px viewport width -- this is the transition point
- The current codebase correctly uses `md:hidden` / `hidden md:block` -- preserve this when refactoring

**Detection:**
- Resize browser to exactly 768px wide -- both nav systems should swap cleanly
- Use Chrome DevTools responsive mode and drag the width slider slowly through 760-780px

**Phase relevance:** Phase 1 (Navigation Overhaul) -- verify during implementation.

---

### Pitfall 11: Main Content Padding Not Updated After Nav Architecture Change

**What goes wrong:** The root layout currently has `<main className="flex-1 flex flex-col pt-0 md:pt-16 pb-20 md:pb-0">`. The `pb-20` is padding-bottom to clear the bottom-pinned mobile nav. The `pt-0` on mobile means no top padding because the header is `hidden` on mobile. When the bottom nav is removed and the header becomes visible on mobile (via hamburger button), both of these values become wrong.

**Why it happens:** The main content padding is coupled to the navigation layout. Changing navigation without updating main content padding is the most common integration mistake in this type of refactor.

**Consequences:**
- On mobile, content starts at the very top of the viewport, hidden behind the now-visible header
- With `pb-20` still present but no bottom nav, there's 5rem of wasted space at the bottom
- Every page appears broken on mobile until this is fixed

**Prevention:**
- When replacing bottom nav with header hamburger:
  - Change `pt-0` to `pt-16` (or whatever the header height is) for all breakpoints
  - Remove `pb-20` (or reduce to just safe-area padding if needed)
  - The result should be something like `pt-16 pb-0` or simply `pt-16`
- Update BOTH the `<main>` padding AND the footer padding in the same change
- Create a checklist: every component that references the nav bar's dimensions must be audited

**Detection:**
- On mobile, the first content element is obscured by the header
- There is unexplained whitespace at the bottom of every page

**Phase relevance:** Phase 1 (Navigation Overhaul) -- must be part of the same atomic change.

---

## Minor Pitfalls

Mistakes that cause annoyance but are quickly fixable.

### Pitfall 12: Z-Index Stacking Conflicts Between Header, Menu Overlay, and Content

**What goes wrong:** The header is `z-50`, the old mobile nav was `z-50`, and the new hamburger menu overlay will also need high z-index. Without a clear z-index strategy, elements compete and the overlay may appear behind the header or content pokes through.

**Prevention:**
- Establish a z-index scale:
  - `z-40`: Sticky elements within content (e.g., TOC sidebar)
  - `z-50`: Header / navigation bar
  - `z-60` (or `z-[60]`): Menu overlay backdrop
  - `z-70` (or `z-[70]`): Menu overlay content
- Document the scale in a comment or the design system
- The overlay should sit ABOVE the header, not at the same level

---

### Pitfall 13: Hamburger Icon Animation State Not Matching Menu State

**What goes wrong:** The hamburger icon animates to an X when the menu opens, but if the menu is closed via route change (usePathname effect) or Escape key rather than tapping the icon, the animation state gets out of sync. The icon shows X but the menu is closed, or vice versa.

**Prevention:**
- Drive the icon animation from the same `isOpen` state variable that controls the menu
- Never use CSS-only toggle state (`:checked` pseudo-class) -- always use React state
- The `useEffect` that closes on pathname change will trigger a re-render, which will update the icon if the icon reads from `isOpen`

---

### Pitfall 14: Neobrutalist Border on Hamburger Menu Inconsistent with Design System

**What goes wrong:** The hamburger button and menu panel are built without the project's neobrutalist styling (3px black borders, hard offset shadows). They look like a different app from the rest of the site.

**Prevention:**
- Apply the same border/shadow treatment to the hamburger button: `border-[3px] border-black shadow-brutal`
- Apply it to the menu panel as well
- Use the existing design tokens: `--shadow-brutal`, `--border-brutal`
- The menu overlay backdrop should NOT have brutal borders (it's a scrim/overlay, not a card)

---

### Pitfall 15: Duplicate `<main>` Tag on About Page

**What goes wrong:** The About page wraps its content in `<main className="flex-1 max-w-3xl mx-auto px-6 py-12">` -- but the root layout already wraps `{children}` in a `<main>` tag. This means the About page has nested `<main>` elements, which is invalid HTML and confuses screen readers.

**Prevention:**
- The About page (and only the About page) uses its own `<main>` tag. Change this to a `<div>` or `<section>`.
- Audit all pages for this issue before shipping layout changes. Currently Blog listing and Projects listing also use `<main>` tags -- these all need to be `<div>` or `<section>` since the root layout provides the `<main>`.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Nav Removal | Footer padding still references old bottom nav (Pitfall 7) | Update footer padding in same PR as nav removal |
| Nav Removal | Main content padding not updated (Pitfall 11) | Update `<main>` pt/pb values in same PR |
| Hamburger Build | Menu stays open on route change (Pitfall 3) | Wire usePathname effect from day one |
| Hamburger Build | iOS body scroll not locked (Pitfall 4) | Implement position:fixed scroll lock pattern |
| Hamburger Build | Missing accessibility (Pitfall 5) | Build aria-expanded, focus trap, escape-to-close from start |
| Viewport Fix | env() safe area inerts without viewport-fit (Pitfall 2) | Export viewport config in root layout |
| Layout Polish | Inconsistent max-widths across pages (Pitfall 6) | Establish and enforce content width convention |
| Layout Polish | About page feels empty after social removal (Pitfall 9) | Plan replacement content before removing |
| Layout Polish | Duplicate `<main>` tags (Pitfall 15) | Audit all pages for nested main elements |

---

## Integration Risk Summary

The highest-risk moment in this milestone is the **atomic swap**: removing the bottom-pinned `MobileNav`, adding the hamburger to the `Header`, and updating all coupled padding/spacing in `layout.tsx` and `footer.tsx` simultaneously. These changes span at least 3 files and must all land together or the site will be broken on mobile.

**Files that must change together (atomic):**
1. `src/components/layout/mobile-nav.tsx` -- remove or replace entirely
2. `src/components/layout/header.tsx` -- add hamburger button + menu overlay
3. `src/app/layout.tsx` -- update `<main>` padding, add viewport export, possibly remove MobileNav import
4. `src/components/layout/footer.tsx` -- remove bottom-nav-compensation padding

**Testing protocol after the swap:**
- [ ] Mobile: Header visible with hamburger icon
- [ ] Mobile: Menu opens, links work, menu closes on navigation
- [ ] Mobile: Background does not scroll when menu is open
- [ ] Mobile: Footer sits at natural page bottom, no excess padding
- [ ] Mobile: No content hidden behind header
- [ ] Desktop: No change in behavior (header + nav links unchanged)
- [ ] iPad (768px): Clean transition between hamburger and desktop nav
- [ ] iPhone with notch: Safe area padding works correctly (if viewport-fit=cover added)

---

## Sources

### Official Documentation (HIGH confidence)
- [WebKit: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [MDN: env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)
- [Next.js: generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport)
- [Next.js: usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname)
- [WebKit Bug 261185: svh/dvh units unexpectedly equal](https://bugs.webkit.org/show_bug.cgi?id=261185)

### Verified Community Sources (MEDIUM-HIGH confidence)
- [Opus.ing: Fixing iOS Toolbar Overlap with CSS Viewport Units](https://opus.ing/posts/fixing-ios-safaris-menu-bar-overlap-css-viewport-units)
- [PQINA: Prevent scrolling on iOS Safari 15](https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari)
- [Jay Freestone: Locking body scroll on iOS](https://www.jayfreestone.com/writing/locking-body-scroll-ios/)
- [Markus Oberlehner: Prevent body scrolling on iOS](https://markus.oberlehner.net/blog/simple-solution-to-prevent-body-scrolling-on-ios)
- [DEV.to: Your hamburger menu button is inaccessible](https://dev.to/savvasstephnds/your-hamburger-menu-button-is-inaccessible-here-s-how-to-fix-it-7n)
- [Erwin Hofman: 7 steps for accessible hamburger menus](https://www.erwinhofman.com/blog/build-web-accessible-hamburger-dropdown-menus/)
- [Ahmad Shadeed: New Viewport Units](https://ishadeed.com/article/new-viewport-units/)

### Community Sources (MEDIUM confidence)
- [GitHub dubinc/dub#2231: Mobile Menu Overlaps Footer on iOS Safari](https://github.com/dubinc/dub/issues/2231)
- [Next.js Discussion #16316: Burger menu page switching](https://github.com/vercel/next.js/discussions/16316)
- [dev-tips: Overlapping bottom nav despite 100vh](https://dev-tips.com/css/overlapping-bottom-navigation-bar-despite-100vh-in-ios-safari)
- [CSS-Tricks: The Notch and CSS](https://css-tricks.com/the-notch-and-css/)
