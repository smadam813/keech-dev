# Technology Stack: v1.1 Polish & Consistency

**Project:** keech.dev
**Milestone:** v1.1 -- Mobile Navigation, iOS Viewport Fixes, Layout Normalization
**Researched:** 2026-02-07

## TL;DR: No New Dependencies Needed

This milestone requires **zero new packages**. Everything needed is already in the stack:
- `lucide-react` already has `Menu` and `X` icons for hamburger toggle
- Tailwind CSS v4 already ships `min-h-dvh`, `h-dvh`, `h-svh` utilities
- Next.js App Router already provides `usePathname` for auto-close on navigate
- CSS `env(safe-area-inset-bottom)` is already used (but needs `viewport-fit=cover` to actually work)
- React `useState`/`useEffect` handle all menu state needs

---

## Current Stack (No Changes)

### Core Framework
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | ^16.1.6 | App Router, SSR/SSG | Keep as-is |
| React | ^19.2.4 | UI rendering | Keep as-is |
| Tailwind CSS | ^4.1.18 | Styling, utilities | Keep as-is |
| Velite | ^0.3.1 | MDX content processing | Keep as-is |

### Supporting Libraries
| Library | Version | Purpose | Relevant to v1.1? |
|---------|---------|---------|-------------------|
| lucide-react | ^0.563.0 | Icons | YES -- `Menu` and `X` icons for hamburger |
| clsx | ^2.1.1 | Conditional classes | YES -- existing `cn()` utility |
| tailwind-merge | ^3.4.0 | Class deduplication | YES -- existing `cn()` utility |

---

## What Each Feature Needs

### 1. Hamburger Mobile Navigation

**Replaces:** Bottom-pinned tab bar (`mobile-nav.tsx`) with top-right hamburger menu.

**Stack requirements -- all already available:**

| Need | Solution | Already Installed? |
|------|----------|-------------------|
| Hamburger icon | `Menu` from `lucide-react` | YES |
| Close icon | `X` from `lucide-react` | YES |
| Menu state | React `useState` | YES (built-in) |
| Auto-close on navigate | `usePathname` from `next/navigation` | YES (already used in current mobile-nav) |
| Animated slide/fade | Tailwind CSS transition utilities | YES |
| Backdrop overlay | Tailwind CSS opacity + fixed positioning | YES |
| Scroll lock when open | `document.body.style.overflow = 'hidden'` | YES (vanilla JS) |
| Accessibility | `aria-expanded`, `aria-label`, focus trapping | YES (HTML attributes) |

**Architecture decision: Integrate into Header, not a separate component.**

The current architecture has `Header` (desktop only, `hidden md:block`) and `MobileNav` (mobile only, `md:hidden`). The hamburger button should live in the `Header` component, making it visible on mobile too. The `MobileNav` component gets replaced entirely -- its bottom-pinned tab bar approach is what we are removing.

**Why NOT use a library like `hamburger-react` or `@headlessui/react`:**
- `hamburger-react` adds a dependency for a simple icon swap (Menu to X) that is trivial with lucide-react icons and a boolean state
- `@headlessui/react` provides `Dialog`/`Menu` primitives but is overkill for a simple slide-out nav with 4 links
- The current project uses zero UI component libraries and benefits from that simplicity
- Scroll lock on mobile Safari can be handled with `overflow: hidden` on the body, which works well enough for a simple overlay -- the edge cases that `body-scroll-lock` handles (scrollable inner containers) do not apply here

**Icon transition approach:**

```tsx
// Simple conditional render -- no animation library needed
{isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
```

For a smooth animated transition between Menu and X, CSS `transition-transform` with rotation is sufficient. No Framer Motion or animation library needed.

### 2. iOS Safari Viewport Fixes

**Problem:** The current `mobile-nav.tsx` uses `env(safe-area-inset-bottom)` for bottom padding, and `layout.tsx` uses `min-h-dvh`. However, the project does NOT export a `viewport` configuration from the root layout, meaning `env(safe-area-inset-bottom)` may return `0` on iOS Safari because the default `viewport-fit` is `auto` (not `cover`).

**Fix -- one config addition, no packages:**

```typescript
// src/app/layout.tsx
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',  // This enables env(safe-area-inset-*) on iOS
}
```

**Why `viewport-fit: cover` matters:**
- Without it, iOS Safari does not report safe-area insets -- `env(safe-area-inset-bottom)` evaluates to `0`
- With it, content extends behind the home indicator bar, and the CSS env values become non-zero, allowing proper padding
- This is a Next.js App Router configuration, not a library

**Viewport unit usage:**
- The project already uses `min-h-dvh` on `<body>` (correct)
- The not-found page uses `min-h-[calc(100dvh-4rem)]` (correct)
- Tailwind v4 ships `h-dvh`, `min-h-dvh`, `h-svh`, `min-h-svh` as built-in utilities (confirmed via official docs)
- No changes needed to viewport unit strategy -- `dvh` is the right choice and is already in use

**Impact on hamburger menu (when nav moves from bottom to top):**
- Removing the bottom-fixed nav eliminates the primary iOS bottom-chrome collision issue
- Footer no longer needs the massive `pb-[calc(6rem+env(safe-area-inset-bottom))]` mobile padding hack
- The footer can use a simpler `pb-[env(safe-area-inset-bottom)]` or just standard padding
- Main content `pb-20 md:pb-0` padding (currently compensating for bottom nav) can be removed

### 3. Cross-Page Layout Normalization

**Problem identified from codebase audit:**

| Page | Container | Max Width | Issue |
|------|-----------|-----------|-------|
| Home | none | none | OK (centered hero) |
| Blog listing | `container mx-auto` | `max-w-6xl` (1152px) | Widest |
| Blog post | none | `max-w-6xl` (1152px) | Matches blog listing |
| Projects listing | `container mx-auto` | `max-w-5xl` (1024px) | Narrower than blog |
| Project detail | `container mx-auto` | `max-w-3xl` (768px) | Much narrower |
| About | none | `max-w-3xl` (768px) | Matches project detail |
| Header | none | `max-w-6xl` (1152px) | Widest |
| Footer | none | `max-w-5xl` (1024px) | Narrower than header |

**Stack requirement: None.** This is a Tailwind class normalization task, not a dependency issue. The fix is choosing a consistent `max-w-*` value and applying it uniformly.

**Recommended normalization strategy:**
- All listing pages (Blog, Projects): `max-w-5xl` -- wide enough for grid cards, not so wide they feel sparse
- All detail pages (Blog post, Project detail, About): `max-w-3xl` -- readable prose width
- Header and Footer: `max-w-5xl` -- matches listing page width for visual alignment
- Home: keep as-is (centered hero, no container needed)

This is purely CSS class changes. The `max-w-*` utilities are built into Tailwind.

---

## Explicitly NOT Adding

| Library | Why Not |
|---------|---------|
| `framer-motion` | Menu animation is a simple slide + opacity. Tailwind `transition-all` and `transform` cover it. Adding a 35KB+ library for one animation is not justified. |
| `@headlessui/react` | Provides accessible Dialog/Menu/Popover primitives. Useful for complex dropdowns with keyboard navigation. Overkill for a 4-link mobile nav with no submenus. |
| `hamburger-react` | Animated hamburger icon library. Lucide `Menu`/`X` with a CSS transition achieves the same visual with zero added weight. |
| `body-scroll-lock` | Handles scroll locking edge cases (iOS scrollable inner containers). Our menu overlay has no scrollable content -- `overflow: hidden` on body suffices. |
| `react-focus-lock` | Focus trapping library for modals. For a simple nav overlay, manual `tabIndex` management and `onKeyDown` escape handler are sufficient. |
| `@radix-ui/react-dialog` | Full accessible dialog primitive. Same rationale as headlessui -- complexity we don't need for 4 links. |

---

## Integration Points

### Where changes happen (files affected):

| File | Change | Reason |
|------|--------|--------|
| `src/app/layout.tsx` | Add `viewport` export with `viewportFit: 'cover'`; remove `pb-20 md:pb-0` from main; remove `<MobileNav />` | iOS fix + nav removal |
| `src/components/layout/header.tsx` | Convert to client component; add hamburger button, slide-out overlay, `usePathname` auto-close | New mobile nav |
| `src/components/layout/mobile-nav.tsx` | DELETE | Replaced by header hamburger |
| `src/components/layout/footer.tsx` | Simplify mobile padding (remove bottom-nav compensation) | No longer needs to avoid bottom nav |
| `src/app/blog/page.tsx` | Change `max-w-6xl` to `max-w-5xl` | Layout normalization |
| `src/app/blog/[slug]/page.tsx` | Change `max-w-6xl` to `max-w-5xl` (outer grid) | Layout normalization |
| `src/app/projects/page.tsx` | Already `max-w-5xl` -- no change | -- |
| `src/app/projects/[slug]/page.tsx` | Already `max-w-3xl` -- no change | -- |
| `src/app/about/page.tsx` | Already `max-w-3xl` -- no change | -- |
| `src/app/globals.css` | Possibly add menu animation keyframes (if not using Tailwind utilities alone) | Optional |

### What does NOT change:

- No package.json modifications
- No new npm installs
- No Velite configuration changes
- No content file changes
- No build pipeline changes

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Mobile nav pattern | Hamburger with slide-out overlay | Bottom sheet / drawer | Hamburger is universal UX, bottom sheet adds complexity |
| Icon transition | Swap Menu/X with opacity | Animated 3-bar morph to X | Adds CSS complexity for marginal visual gain |
| Scroll lock | `overflow: hidden` on body | `body-scroll-lock` library | No scrollable inner content in our overlay |
| Menu animation | Tailwind `transition-all` + `translate-x` | Framer Motion | 35KB for one animation is unjustified |
| Layout consistency | Standardize `max-w-*` classes | CSS custom property for container width | Tailwind utilities are clearer and already the project pattern |
| Viewport fix | Next.js `viewport` export | Manual `<meta>` tag | `viewport` export is the App Router standard |

---

## Confidence Assessment

| Claim | Confidence | Source |
|-------|------------|--------|
| `lucide-react` has `Menu` and `X` icons | HIGH | Official lucide.dev docs, already using lucide-react in project |
| Tailwind v4 ships `h-dvh`, `min-h-dvh` | HIGH | Official Tailwind CSS docs (tailwindcss.com/docs/height) |
| `usePathname` from `next/navigation` closes menu on route change | HIGH | Next.js docs + already used in current `mobile-nav.tsx` |
| `viewport-fit: cover` enables `env(safe-area-inset-*)` on iOS | HIGH | WebKit blog, MDN docs, multiple verified sources |
| Next.js `viewport` export supports `viewportFit` property | HIGH | Next.js generateViewport docs |
| `overflow: hidden` on body prevents scroll in mobile Safari | MEDIUM | Works for simple overlays; edge cases exist with deeply nested scrollable content but not applicable here |
| No new dependencies needed | HIGH | Verified every feature against existing package.json |

## Sources

- [Tailwind CSS v4 Height Utilities](https://tailwindcss.com/docs/height) -- confirmed `h-dvh`, `min-h-dvh`, `h-svh` built-in
- [Lucide Icons -- Menu](https://lucide.dev/icons/menu) -- hamburger menu icon
- [Next.js generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) -- `viewportFit: 'cover'` support
- [Next.js usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname) -- route change detection
- [WebKit: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) -- `viewport-fit=cover` and `env()` safe-area insets
- [MDN: env() CSS function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env) -- safe-area-inset-* reference
- [Understanding Mobile Viewport Units (svh, lvh, dvh)](https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a)
