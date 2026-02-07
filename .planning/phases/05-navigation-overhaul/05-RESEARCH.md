# Phase 5: Navigation Overhaul - Research

**Researched:** 2026-02-07
**Domain:** Mobile navigation UX, iOS Safari viewport, accessibility (focus trapping, scroll locking)
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Menu animation direction: slide down from header (locked)
- Hamburger placement: right side of header (locked)
- Footer content: keep as-is, no changes (locked)

### Claude's Discretion
The user granted broad discretion across most visual and interaction decisions:
- Overlay background appearance
- Link layout in menu
- Whether to include social icons or keep links-only
- Hamburger icon style
- Open/close animation (hamburger to X)
- Header visibility while menu open
- Active link styling in mobile menu
- Desktop nav active state
- Menu close timing on link tap
- Same-page tap behavior
- Footer position after bottom nav removal
- Safe-area padding values
- Hamburger vs desktop nav breakpoint

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

## Summary

This phase replaces the existing bottom-pinned `<MobileNav>` component with a hamburger menu integrated into the `<Header>`. The current setup has two separate navigation components: a desktop header (`hidden md:block`) and a mobile bottom bar (`md:hidden`). The new architecture unifies them into a single header component that shows desktop nav links at `md:` breakpoint and a hamburger button below it. The mobile menu slides down from the header as a full-screen overlay.

The critical technical challenges are: (1) iOS Safari scroll locking, which requires more than just `overflow: hidden` on the body, (2) accessible focus management using the HTML `inert` attribute on background content, and (3) proper `viewport-fit: cover` configuration in Next.js 16 to enable `env(safe-area-inset-*)` CSS functions. The current footer has a `pb-[calc(6rem+env(safe-area-inset-bottom))]` hack to account for the bottom nav height -- this must be cleaned up.

No new npm dependencies are needed. The project already has `lucide-react` (with `Menu` and `X` icons), Tailwind CSS v4, and React 19. Everything can be built with existing tools.

**Primary recommendation:** Build a single unified header component with responsive hamburger/desktop modes, use the `inert` attribute for focus management, and use `position: fixed` with scroll position preservation for iOS Safari scroll locking.

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.1.6 | App Router, `usePathname` for route detection, `viewport` export | Already in project |
| React | ^19.2.4 | `useState`, `useEffect`, `useRef`, `useCallback` hooks | Already in project |
| lucide-react | ^0.563.0 | `Menu` and `X` icons for hamburger toggle | Already in project |
| Tailwind CSS | ^4.1.18 | All styling, responsive breakpoints, transitions | Already in project |
| clsx + tailwind-merge | via `cn()` | Conditional class composition | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | No new dependencies required | - |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML `inert` attribute | Manual JS focus trapping | `inert` is simpler, natively supported Safari 15.5+, no edge cases |
| Custom scroll lock | `body-scroll-lock` npm package | Package is unmaintained since 2021, custom solution is ~15 lines |
| CSS hamburger animation | Lucide icon swap (Menu/X) | CSS spans give smoother animation but add complexity; icon swap is simpler and fits neobrutalist style |

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Current File Structure (what changes)
```
src/
├── app/
│   └── layout.tsx              # MODIFY: add viewport export, update main padding, remove MobileNav
├── components/
│   └── layout/
│       ├── header.tsx          # MODIFY: add hamburger button, mobile menu overlay, make responsive
│       ├── mobile-nav.tsx      # DELETE: replaced by header hamburger menu
│       └── footer.tsx          # MODIFY: remove bottom-nav padding hack
└── app/
    ├── about/page.tsx          # MODIFY: remove social link buttons (ABUT-04)
    └── globals.css             # MODIFY: add menu overlay and scroll-lock styles
```

### Pattern 1: Unified Responsive Header
**What:** Single `<Header>` component handles both desktop nav (inline links) and mobile nav (hamburger + overlay). No separate MobileNav component.
**When to use:** When desktop and mobile share the same nav items and the mobile version is a toggle overlay.
**Example:**
```typescript
// header.tsx becomes a 'use client' component
'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // NAV-06: Auto-close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // ... render desktop nav + mobile hamburger + overlay
}
```

### Pattern 2: iOS-Safe Scroll Locking
**What:** When the menu opens, lock background scroll by setting `overflow: hidden` on `<html>` and `<body>`, combined with `position: fixed` on the body to prevent iOS Safari rubber-banding. Preserve and restore scroll position.
**When to use:** Any full-screen overlay or modal on iOS Safari.
**Example:**
```typescript
// Inside the Header component
useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
  } else {
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)
  }

  return () => {
    // Cleanup on unmount
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
  }
}, [isOpen])
```

### Pattern 3: Focus Management with `inert`
**What:** Instead of manual JavaScript focus trapping (querying focusable elements, intercepting Tab), use the HTML `inert` attribute on `<main>` and `<footer>` to make background content unfocusable and invisible to assistive technology.
**When to use:** When the menu overlay is open.
**Example:**
```typescript
// In layout.tsx, pass a ref or use data attributes
// The Header component sets inert on sibling elements when menu is open

useEffect(() => {
  const main = document.querySelector('main')
  const footer = document.querySelector('footer')
  if (isOpen) {
    main?.setAttribute('inert', '')
    footer?.setAttribute('inert', '')
  } else {
    main?.removeAttribute('inert')
    footer?.removeAttribute('inert')
  }
}, [isOpen])
```

### Pattern 4: Next.js Viewport Export
**What:** Export a `viewport` constant from `layout.tsx` to set `viewport-fit: cover` in the meta tag, enabling `env(safe-area-inset-*)` CSS functions.
**When to use:** Required for proper safe-area support on iOS notch/Dynamic Island devices.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-viewport
import type { Viewport } from 'next'

export const viewport: Viewport = {
  viewportFit: 'cover',
}
```

### Anti-Patterns to Avoid
- **Two separate nav components:** Having a desktop Header and mobile MobileNav with duplicated nav items is fragile. Use one component with responsive behavior.
- **`overflow: hidden` alone for scroll lock:** Does not work on iOS Safari. The body still scrolls via touch. Must use `position: fixed` approach.
- **Manual focus trapping with Tab key interception:** Complex, error-prone, and misses edge cases. The `inert` attribute handles all of this natively.
- **Using `100vh` for menu height on mobile:** iOS Safari's `100vh` includes the URL bar area. Use `100dvh` (dynamic viewport height) or `position: fixed` with `inset: 0`.
- **Forgetting to restore scroll position:** When removing `position: fixed` from body, the page jumps to top unless scroll position is saved and restored.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trapping | Custom Tab key interceptor with querySelectorAll for focusable elements | HTML `inert` attribute on background elements | Native browser behavior, handles all edge cases (shadow DOM, dynamically added elements, screen readers), zero JS |
| Scroll locking | Simple `overflow: hidden` on body | `position: fixed` + scroll position save/restore | `overflow: hidden` does not work on iOS Safari for touch scrolling |
| Hamburger icon | Custom SVG with animated paths | `lucide-react` `Menu` and `X` components | Already in the project, consistent with existing icon usage |
| Route change detection | Custom history listener or MutationObserver | `usePathname()` from `next/navigation` in a `useEffect` | Official Next.js API, works with App Router client-side navigation |
| Safe-area insets | Manual padding calculations | `env(safe-area-inset-bottom)` with `viewport-fit: cover` | Browser-native, updates automatically with device orientation changes |

**Key insight:** The biggest mistake would be building a custom JavaScript focus trap. The `inert` attribute (supported Safari 15.5+, all browsers since April 2023) does everything a focus trap does with zero JavaScript -- it makes elements unfocusable, removes them from the accessibility tree, and prevents click events. This is the correct modern approach.

## Common Pitfalls

### Pitfall 1: iOS Safari Body Scroll Bleed-Through
**What goes wrong:** Setting `overflow: hidden` on body does not prevent scrolling on iOS Safari. Users can still scroll the page behind the open menu by touching and dragging.
**Why it happens:** iOS Safari handles touch scrolling at a lower level than CSS overflow. The WebKit bug (153852) has been open since 2016.
**How to avoid:** Use `position: fixed` on the body when the menu is open. Save `window.scrollY` before fixing, set `body.style.top = -scrollY`, and restore after closing.
**Warning signs:** Background content visibly scrolling while the menu overlay is open on an iPhone.

### Pitfall 2: Scroll Position Jump on Menu Close
**What goes wrong:** When removing `position: fixed` from the body, the page jumps to the top instead of staying at the user's previous scroll position.
**Why it happens:** `position: fixed` takes the body out of flow. When removed, scroll position resets to 0.
**How to avoid:** Before adding `position: fixed`, save `window.scrollY`. Store it in `body.style.top` as a negative value. On close, parse that value and call `window.scrollTo(0, savedScrollY)`.
**Warning signs:** Page always scrolled to top after closing the menu.

### Pitfall 3: Missing viewport-fit: cover
**What goes wrong:** `env(safe-area-inset-bottom)` returns `0` on all devices, so footer and menu have no safe-area padding.
**Why it happens:** The `env()` CSS functions only work when the viewport meta tag includes `viewport-fit=cover`. Without it, the browser assumes a non-edge-to-edge layout.
**How to avoid:** Export `viewport: { viewportFit: 'cover' }` from `layout.tsx`. This is currently missing from the project.
**Warning signs:** Footer content overlapping with the iPhone home indicator or Dynamic Island area.

### Pitfall 4: Forgetting to Clean Up Scroll Lock on Unmount
**What goes wrong:** If the component unmounts while the menu is open (e.g., during a full page navigation), the body stays fixed and the page is stuck.
**Why it happens:** React `useEffect` cleanup only runs if the component unmounts, but the styles applied to `document.body` persist.
**How to avoid:** Always include cleanup in the `useEffect` return function that removes all body style overrides.
**Warning signs:** Page stuck at a fixed position after navigating away with the menu open.

### Pitfall 5: Desktop Nav Padding Not Updated
**What goes wrong:** The current layout has `pb-20 md:pb-0` on `<main>` to account for the bottom nav bar height. After removing the bottom nav, mobile pages have 5rem of empty space at the bottom.
**Why it happens:** The padding was added to prevent the bottom nav from covering content.
**How to avoid:** Remove `pb-20` from the main element. Mobile should have `pt-16` (header height) and `pb-0` just like desktop, since the hamburger menu is now in the header.
**Warning signs:** Large empty gap at the bottom of mobile pages.

### Pitfall 6: Header z-index Conflict with Menu Overlay
**What goes wrong:** The menu overlay appears behind the header or behind other positioned elements.
**Why it happens:** Multiple `z-50` elements competing. The overlay needs to be above page content but the header should remain visible above the overlay (since the close button is in the header).
**How to avoid:** Ensure the overlay is a child of or sibling to the header with correct stacking. Since the menu slides down from the header, make the overlay a child of the header component so the header naturally sits above it.
**Warning signs:** Hamburger X button not clickable when menu is open.

## Code Examples

Verified patterns from official sources:

### Next.js Viewport Export (VIEW-01)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-viewport
// In src/app/layout.tsx
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  // ... existing metadata stays the same
}
```

### Auto-Close Menu on Route Change (NAV-06)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/use-pathname
'use client'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])
  // ...
}
```

### Hamburger Button with Accessibility (NAV-04, NAV-08)
```tsx
// Using lucide-react icons already in the project
import { Menu, X } from 'lucide-react'

<button
  onClick={() => setIsOpen(!isOpen)}
  className="md:hidden p-2"
  aria-expanded={isOpen}
  aria-controls="mobile-menu"
  aria-label={isOpen ? 'Close menu' : 'Open menu'}
>
  {isOpen ? (
    <X className="w-6 h-6" strokeWidth={2.5} />
  ) : (
    <Menu className="w-6 h-6" strokeWidth={2.5} />
  )}
</button>
```

### Active Page Detection (NAV-07)
```typescript
// Same logic as existing MobileNav, applied to menu overlay links
const isActive = pathname === item.href ||
  (item.href !== '/' && pathname.startsWith(item.href))
```

### Focus Management with inert (NAV-09)
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert
// In the Header component
useEffect(() => {
  const main = document.querySelector('main')
  const footer = document.querySelector('footer')

  if (isOpen) {
    main?.setAttribute('inert', '')
    footer?.setAttribute('inert', '')
  } else {
    main?.removeAttribute('inert')
    footer?.removeAttribute('inert')
  }

  return () => {
    main?.removeAttribute('inert')
    footer?.removeAttribute('inert')
  }
}, [isOpen])
```

### iOS-Safe Scroll Lock (NAV-10)
```typescript
// Source: https://www.jayfreestone.com/writing/locking-body-scroll-ios/
useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
  } else {
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)
  }

  return () => {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
  }
}, [isOpen])
```

### Footer Safe-Area Fix (VIEW-02, VIEW-03)
```tsx
// BEFORE (current -- has bottom nav padding hack):
<footer className="bg-foreground text-background pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:py-8 mt-auto">

// AFTER (clean -- only safe-area for notch devices):
<footer className="bg-foreground text-background py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] mt-auto">
```

### Layout Main Padding Fix (VIEW-02)
```tsx
// BEFORE (current -- has bottom nav padding):
<main className="flex-1 flex flex-col pt-0 md:pt-16 pb-20 md:pb-0">

// AFTER (header visible on all viewports):
<main className="flex-1 flex flex-col pt-16">
```

### Menu Overlay Structure (NAV-05)
```tsx
// Slide-down from header, neobrutalist styling
<div
  id="mobile-menu"
  role="dialog"
  aria-modal="true"
  aria-label="Navigation menu"
  className={cn(
    'fixed inset-0 top-16 z-40 md:hidden',
    'bg-background border-t-[3px] border-foreground',
    'transition-transform duration-300 ease-in-out',
    isOpen ? 'translate-y-0' : '-translate-y-full'
  )}
>
  <nav className="flex flex-col items-center justify-center h-full gap-8">
    {navItems.map((item) => {
      const isActive = pathname === item.href ||
        (item.href !== '/' && pathname.startsWith(item.href))
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'font-display text-3xl font-bold',
            'hover:text-accent transition-colors',
            isActive && 'text-accent'
          )}
        >
          {item.label}
        </Link>
      )
    })}
  </nav>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual JS focus trapping (Tab key interception) | HTML `inert` attribute on background content | Safari 15.5 (March 2022), Baseline April 2023 | Zero JS for focus management, handles all edge cases |
| `overflow: hidden` for scroll lock | `position: fixed` + scroll position save/restore | Ongoing (iOS Safari bug since 2016) | Required for iOS Safari, adds ~15 lines of JS |
| `100vh` for full-screen overlays | `100dvh` or `position: fixed; inset: 0` | Safari 15.4 (March 2022) | Dynamic viewport units account for iOS Safari chrome |
| Separate viewport meta tag | Next.js `viewport` export from layout.tsx | Next.js 14+ | Type-safe, co-located with metadata |
| `body-scroll-lock` npm package | Custom ~15 line useEffect | Package unmaintained since 2021 | No dependency risk, simpler code |

**Deprecated/outdated:**
- `body-scroll-lock` npm package: Last published 2019, archived. Do not use.
- `react-focus-trap` / `focus-trap-react`: Still maintained but unnecessary when `inert` has full browser support.
- Separate `<MobileNav>` component pattern: Duplicates nav items, creates maintenance burden.

## Open Questions

1. **Hamburger icon animation preference: swap vs CSS transform**
   - What we know: Lucide `Menu`/`X` icon swap is simple (3 lines). CSS span-based hamburger with transform animation is smoother but adds ~30 lines of CSS.
   - What's unclear: Whether the icon swap feels "good enough" for the neobrutalist aesthetic or if the animated transition is worth the added complexity.
   - Recommendation: Use Lucide icon swap. Neobrutalist design is intentionally abrupt and direct -- a clean icon swap fits the aesthetic better than a smooth animation. If the user wants animation later, it can be added without structural changes.

2. **Menu overlay transition when hidden**
   - What we know: CSS `translate-y` keeps the element in the DOM but off-screen. `display: none` removes it entirely.
   - What's unclear: Whether keeping the overlay in the DOM (but translated off-screen) causes any performance or accessibility issues.
   - Recommendation: Use `translate-y` combined with `visibility: hidden` (or conditional rendering) so screen readers don't read the hidden menu links. When `inert` is on background elements and the menu is hidden, also set `aria-hidden="true"` on the menu or conditionally render it.

3. **Escape key handler scope**
   - What we know: NAV-09 requires Escape to close the menu. Standard approach is a `keydown` event listener on `document`.
   - What's unclear: Whether Escape should also work when focus is on the hamburger button itself (before the menu opens).
   - Recommendation: Add Escape listener when menu is open, remove when closed. Focus the first link when menu opens, and return focus to hamburger button when menu closes.

## Sources

### Primary (HIGH confidence)
- [Next.js generateViewport docs](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) - viewport export API, `viewportFit: 'cover'`
- [Next.js usePathname docs](https://nextjs.org/docs/app/api-reference/functions/use-pathname) - route change detection
- [MDN: HTML inert attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) - focus management, Baseline April 2023
- [Can I Use: inert](https://caniuse.com/mdn-html_global_attributes_inert) - Safari 15.5+, 94.46% global support
- [Can I Use: overscroll-behavior](https://caniuse.com/css-overscroll-behavior) - Safari 16+, full support
- [MDN: overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) - Baseline since September 2022
- Codebase: `src/components/layout/header.tsx`, `mobile-nav.tsx`, `footer.tsx`, `src/app/layout.tsx` - current implementation

### Secondary (MEDIUM confidence)
- [Jay Freestone: Locking body scroll on iOS](https://www.jayfreestone.com/writing/locking-body-scroll-ios/) - position:fixed scroll lock pattern
- [PQINA: Prevent scrolling on iOS Safari](https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari) - alternative scroll lock with innerHeight sync
- [Next.js GitHub Discussion #46542](https://github.com/vercel/next.js/discussions/46542) - viewport-fit support confirmed in Next.js
- [WebKit Bug 153852](https://bugs.webkit.org/show_bug.cgi?id=153852) - iOS Safari overflow:hidden bug (still open)
- [Lucide: Menu icon](https://lucide.dev/icons/menu), [X icon](https://lucide.dev/icons/x) - icon availability confirmed

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already in project, no new installs needed
- Architecture: HIGH - patterns verified against official docs (Next.js viewport, MDN inert, iOS scroll lock)
- Pitfalls: HIGH - iOS Safari scroll issue is extremely well-documented with verified solutions; inert browser support confirmed via Can I Use
- Code examples: HIGH - derived from official documentation and verified codebase patterns

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, no fast-moving APIs)
