# Architecture Patterns

**Domain:** Mobile Navigation Overhaul + Layout Consistency (v1.1 Polish)
**Researched:** 2026-02-07
**Confidence:** HIGH (verified against existing codebase, official Next.js docs, and CSS specifications)

## Current Architecture Assessment

### What Exists Today

```
Root Layout (src/app/layout.tsx) - Server Component
├── <Header />          - Server Component, hidden md:block, fixed top
├── <main>              - flex-1 flex flex-col, pt-0 md:pt-16 pb-20 md:pb-0
│   └── {children}      - Page content
├── <Footer />          - Server Component, mt-auto, pb-[calc(6rem+env(safe-area-inset-bottom))]
└── <MobileNav />       - Client Component, fixed bottom-0, md:hidden
```

### Problems Identified

1. **MobileNav is a bottom tab bar** that overlaps with iOS Safari's collapsing bottom chrome. The Footer compensates with `pb-[calc(6rem+env(safe-area-inset-bottom))]`, but `env(safe-area-inset-bottom)` does not update dynamically when Safari's tab bar height changes.

2. **Redundant social links** exist in both Footer and About page (`socialLinks` array defined in both files).

3. **Inconsistent container patterns** across pages:
   - Home: `flex-1 flex items-center justify-center px-6 md:pb-16` (no container, no max-width)
   - Blog listing: `container mx-auto max-w-6xl px-6 py-8`
   - Projects listing: `container mx-auto max-w-5xl px-6 py-8`
   - About: `flex-1 max-w-3xl mx-auto px-6 py-12`
   - Blog post: `mx-auto max-w-6xl px-6 py-8` (no container class)
   - Project detail: `flex-1 container mx-auto max-w-3xl px-6 py-8`
   - 404: `min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6`

4. **No viewport-fit=cover** configured, so `env(safe-area-inset-bottom)` may return 0 on some iOS devices.

5. **Duplicate `<main>` tags**: The root layout wraps children in `<main>`, but Blog listing and Projects listing pages also wrap their content in `<main>`, creating nested `<main>` elements (invalid HTML semantics).

## Recommended Architecture

### New Navigation Model

Replace the bottom tab bar with a hamburger menu in the Header. This eliminates the iOS Safari bottom chrome overlap entirely because the navigation moves to the top of the viewport where there is no browser chrome interference.

```
Root Layout (src/app/layout.tsx) - Server Component
├── <Header />          - Server Component shell with Client island
│   ├── Logo link       - Server rendered
│   ├── Desktop nav     - Server rendered, hidden md:block (unchanged)
│   └── <MobileMenuButton /> - Client Component, md:hidden
│       └── <MobileMenu />   - Client Component, overlay/slide-in
├── <main>              - flex-1, consistent padding
│   └── {children}
└── <Footer />          - Server Component, simplified (no bottom tab bar compensation)
```

### Component Boundaries

| Component | File | Type | Responsibility | Communicates With |
|-----------|------|------|----------------|-------------------|
| **Header** | `layout/header.tsx` | Server | Logo, desktop nav links, renders MobileMenuButton slot | Layout |
| **MobileMenuButton** | `layout/mobile-menu-button.tsx` | Client | Hamburger toggle, open/close state, renders MobileMenu | Header |
| **MobileMenu** | `layout/mobile-menu.tsx` | Client | Full-screen overlay with nav links, closes on route change | MobileMenuButton |
| **Footer** | `layout/footer.tsx` | Server | Copyright, social links (simplified) | Layout |

### Data Flow

```
State Management (hamburger menu):
===================================

1. MobileMenuButton owns `isOpen` state via useState
2. MobileMenu renders conditionally based on isOpen
3. usePathname() + useEffect() auto-closes menu on navigation
4. Click-outside and Escape key close the menu
5. Body scroll lock when menu is open

     User taps hamburger
            |
            v
    +------------------+
    | MobileMenuButton | ← useState(isOpen)
    | 'use client'     |
    +------------------+
            |
            v (isOpen === true)
    +------------------+
    | MobileMenu       | ← Full-screen overlay
    | 'use client'     |
    +------------------+
            |
            v (user taps nav link)
    +------------------+
    | usePathname()    | ← Detects route change
    | useEffect()      | ← Sets isOpen = false
    +------------------+

No global state needed. useState in a single client component is sufficient.
```

## Integration Plan

### Files to CREATE (3 new files)

#### 1. `src/components/layout/mobile-menu-button.tsx` (Client Component)

**Purpose:** Hamburger icon toggle that controls the mobile menu overlay.

**Why a separate component:** Isolates the `'use client'` boundary. The Header can remain a Server Component (no JavaScript shipped for desktop users). Only mobile users pay the client component cost.

```typescript
// Responsibilities:
// - Render hamburger/X icon based on isOpen state
// - Toggle isOpen state on click
// - Pass isOpen + onClose to MobileMenu
// - ARIA attributes: aria-label, aria-expanded, aria-controls
```

#### 2. `src/components/layout/mobile-menu.tsx` (Client Component)

**Purpose:** Full-screen navigation overlay that appears when hamburger is toggled.

```typescript
// Responsibilities:
// - Full-viewport overlay with nav links
// - Close on route change (usePathname + useEffect)
// - Close on Escape key (useEffect + keydown listener)
// - Close on backdrop click
// - Trap focus within overlay when open (accessibility)
// - Prevent body scroll when open
// - Active link highlighting (usePathname)
// - Entry/exit animation (CSS transition or animate-fade-in-up)
```

#### 3. No third file needed. The viewport configuration goes into the existing layout.tsx.

### Files to MODIFY (4 existing files)

#### 1. `src/app/layout.tsx`

**Changes:**
- Add `viewport` export with `viewportFit: 'cover'` for proper safe-area-inset support
- Remove `<MobileNav />` from the body
- Remove `pb-20 md:pb-0` from `<main>` (no longer needed without bottom tab bar)
- Fix the duplicate `<main>` issue: change the wrapper to `<div>` or use semantic sectioning

```typescript
import type { Viewport } from 'next'

export const viewport: Viewport = {
  viewportFit: 'cover',
}
```

#### 2. `src/components/layout/header.tsx`

**Changes:**
- Import and render `<MobileMenuButton />` inside the header (visible on mobile, hidden on md+)
- Remove `hidden md:block` from the header element (header should always be visible now)
- Add `md:hidden` to the MobileMenuButton, keep `hidden md:flex` on the desktop nav
- The header remains a Server Component; only the MobileMenuButton child is a Client Component

#### 3. `src/components/layout/footer.tsx`

**Changes:**
- Remove the `pb-[calc(6rem+env(safe-area-inset-bottom))]` padding hack (no bottom tab bar to compensate for)
- Simplify to standard footer padding
- Keep social links (these are appropriate in the footer)

#### 4. Individual page files (layout normalization)

**Changes across 6 page files:**

| Page | Current Container | Normalized Container | Other Changes |
|------|-------------------|----------------------|---------------|
| `app/page.tsx` (Home) | No container | Keep as-is (hero is intentionally full-width centered) | None |
| `app/blog/page.tsx` | `<main>` wrapper | Change `<main>` to `<div>` or `<section>` (root layout already provides `<main>`) | None |
| `app/projects/page.tsx` | `<main>` wrapper | Change `<main>` to `<div>` or `<section>` | None |
| `app/about/page.tsx` | `<main>` wrapper | Change `<main>` to `<div>` or `<section>` | None |
| `app/blog/[slug]/page.tsx` | `<article>` | Keep `<article>` (semantically correct) | None |
| `app/projects/[slug]/page.tsx` | `<article>` | Keep `<article>` (semantically correct) | None |
| `app/not-found.tsx` | `<div>` | Keep as-is, remove dvh calc (layout handles full height) | None |

### Files to DELETE (1 file)

#### 1. `src/components/layout/mobile-nav.tsx`

**Why:** The bottom tab bar is being replaced entirely by the hamburger menu. No code from this file is reusable -- the navigation items array (`navItems`) should be extracted to a shared location or redefined in the new components.

### Shared Data Extraction

The `navItems` array is currently duplicated between `header.tsx` and `mobile-nav.tsx`. After the refactor, it will need to exist in `header.tsx` and the new `mobile-menu.tsx`. To avoid continued duplication:

**Option A (recommended):** Define `navItems` in `header.tsx` and pass it as a prop to `MobileMenuButton`, which passes it to `MobileMenu`. This keeps the data co-located with the primary navigation component and avoids a separate config file for 4 items.

**Option B:** Create `src/lib/navigation.ts` with the shared array. This is over-engineering for 4 static items but would be appropriate if navigation items grew or became dynamic.

## Patterns to Follow

### Pattern 1: Client Component Islands in Server Components

**What:** Keep the Header as a Server Component and embed the MobileMenuButton as a Client Component child.

**When:** Whenever a component needs interactivity but its parent is purely presentational.

**Why:** Desktop users ship zero JavaScript for the header. Mobile users only ship the hamburger toggle + overlay code.

```typescript
// header.tsx - Server Component (no 'use client')
import { MobileMenuButton } from './mobile-menu-button'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 ...">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">keech.dev</Link>

        {/* Desktop nav - server rendered, hidden on mobile */}
        <nav className="hidden md:flex gap-8">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>

        {/* Mobile hamburger - client component, hidden on desktop */}
        <MobileMenuButton navItems={navItems} />
      </div>
    </header>
  )
}
```

### Pattern 2: Auto-Close on Navigation

**What:** Use `usePathname()` in a `useEffect` to detect route changes and close the mobile menu.

**When:** Any overlay/modal that should dismiss on navigation.

**Why:** In the App Router, `router.events` does not exist. Watching `pathname` is the idiomatic replacement.

```typescript
// mobile-menu.tsx
'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function MobileMenu({ isOpen, onClose, navItems }) {
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // ...
}
```

### Pattern 3: Scroll Lock with Cleanup

**What:** Prevent background scrolling when the mobile menu overlay is open.

**When:** Any full-screen overlay.

**Why:** Without scroll lock, users can scroll the page behind the overlay, which is disorienting.

```typescript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => {
    document.body.style.overflow = ''
  }
}, [isOpen])
```

### Pattern 4: CSS Transitions Over JavaScript Animation

**What:** Use CSS transitions for the menu open/close animation rather than Framer Motion or JS-driven animation.

**When:** Simple slide/fade animations.

**Why:** Zero additional dependencies. The project already uses CSS animations (`animate-fade-in-up`). Consistency with existing patterns.

```typescript
// The overlay can use opacity + transform transitions
<div
  className={cn(
    'fixed inset-0 z-40 bg-background transition-opacity duration-200',
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  )}
>
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global State for Menu Toggle

**What:** Using React Context, Zustand, or any global store for the hamburger menu open/close state.

**Why bad:** The menu state is local to the header area. Global state adds complexity and makes the component harder to reason about. A simple `useState` in the parent client component is all that is needed.

**Instead:** `useState` in `MobileMenuButton`, passed as props to `MobileMenu`.

### Anti-Pattern 2: Rendering the Menu Conditionally with `{isOpen && <MobileMenu />}`

**What:** Conditionally mounting/unmounting the menu component.

**Why bad:** Prevents CSS transitions from running on close (component unmounts before the exit animation plays). Also causes layout shifts.

**Instead:** Always render `MobileMenu` but control visibility with CSS (`opacity`, `pointer-events-none`, `translate`). The component stays mounted but invisible/non-interactive when closed.

### Anti-Pattern 3: Using a Portal for the Mobile Menu

**What:** Rendering the mobile menu in a React portal to escape the header's stacking context.

**Why bad:** The header already has `z-50`. The menu overlay at `z-40` (behind header) or the menu contents at `z-50` (same level) works fine without portals. Portals add complexity and can break SSR.

**Instead:** Render the overlay as a sibling or child within the header's z-index context.

### Anti-Pattern 4: Separate Viewport Hack Libraries

**What:** Installing packages like `viewportify` or using JS-based viewport height calculations.

**Why bad:** The root problem (bottom tab bar overlapping iOS Safari chrome) is eliminated by moving navigation to the top. The `dvh` units already in use in `layout.tsx` (`min-h-dvh` on body) are sufficient. Adding a library for viewport units is unnecessary.

**Instead:** Use `min-h-dvh` (already in use), `viewport-fit: cover` via Next.js viewport export, and `env(safe-area-inset-bottom)` in Footer for notch devices.

## Build Order

The dependency graph for this milestone is straightforward because all changes revolve around the layout shell.

```
Step 1: Add viewport-fit=cover to layout.tsx
    |
    v
Step 2: Create mobile-menu-button.tsx + mobile-menu.tsx
    |
    v
Step 3: Modify header.tsx to integrate hamburger button
    |    (test: hamburger appears on mobile, desktop nav unchanged)
    |
    v
Step 4: Remove <MobileNav /> from layout.tsx, delete mobile-nav.tsx
    |    Remove pb-20 from main padding
    |    (test: no bottom tab bar, hamburger menu works)
    |
    v
Step 5: Simplify footer.tsx (remove bottom-bar compensation padding)
    |    (test: footer renders correctly without extra padding)
    |
    v
Step 6: Fix duplicate <main> tags across page files
    |    (test: HTML validation passes, no nested <main>)
    |
    v
Step 7: Normalize container patterns if desired
         (optional: cosmetic consistency)
```

**Why this order:**

- Step 1 is independent and has zero risk (just a meta tag).
- Steps 2-3 must happen before Step 4. The hamburger menu must exist and work before the bottom tab bar is removed, so there is never a state where mobile users have no navigation.
- Step 5 depends on Step 4 (footer padding only makes sense to change after the bottom bar is gone).
- Steps 6-7 are independent of the navigation changes and can happen any time, but logically follow the navigation work.

## Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| Hamburger button has accessible name | `aria-label="Open menu"` / `"Close menu"` based on state |
| Menu state is announced | `aria-expanded={isOpen}` on the button |
| Menu is keyboard navigable | `aria-controls="mobile-menu"` + `id="mobile-menu"` on the overlay |
| Escape key closes menu | `useEffect` with `keydown` listener |
| Focus management | Focus moves to first link when menu opens, returns to hamburger button when closed |
| Reduced motion | Respect `prefers-reduced-motion` for menu transitions (consistent with existing `motion-safe:` pattern) |

## Sources

### HIGH Confidence (Official Documentation + Codebase Verification)
- [Next.js generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) - viewportFit property for viewport-fit=cover
- [Next.js usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname) - Route change detection in App Router
- [MDN env()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) - Safe area inset CSS environment variables
- Codebase analysis of all 7 page files, 3 layout components, and root layout

### MEDIUM Confidence (Verified Patterns)
- [Next.js Discussion #46542](https://github.com/vercel/next.js/discussions/46542) - viewport-fit=cover support confirmed with viewportFit property
- [Samuel Kraft: Safari 15 Bottom Tab Bars](https://samuelkraft.com/blog/safari-15-bottom-tab-bars-web) - iOS Safari safe area patterns
- [Tailwind CSS Viewport Height Classes](https://tailwindcss.com/docs/height) - dvh/svh/lvh utility classes
- [Smashing Magazine: Bottom Navigation Pattern](https://www.smashingmagazine.com/2019/08/bottom-navigation-pattern-mobile-web-pages/) - UX research on navigation patterns

### LOW Confidence (Ecosystem Context)
- [Opus.ing: iOS Viewport Units](https://opus.ing/posts/fixing-ios-safaris-menu-bar-overlap-css-viewport-units) - Guidance to prefer svh over dvh for most layouts
- [Conflux: Tab Bar vs Hamburger](https://www.weareconflux.com/en/blog/tab-bar-vs-hamburger-menu/) - UX tradeoffs between navigation patterns
