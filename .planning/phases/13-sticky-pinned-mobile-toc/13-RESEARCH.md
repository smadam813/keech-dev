# Phase 13: Sticky/Pinned Mobile TOC - Research

**Researched:** 2026-04-03
**Domain:** CSS sticky positioning, mobile UX, accordion behavior
**Confidence:** HIGH

## Summary

This phase converts the existing `MobileToc` accordion from a static inline element to a sticky element that pins to the top of the viewport when scrolled past. The implementation is primarily CSS (`position: sticky; top: ...`) with one behavioral enhancement: auto-collapsing the TOC after a heading link is tapped.

The codebase already uses `position: sticky` for the desktop TOC (`sticky top-24` in `toc.tsx`), so the pattern is established. The header is `fixed top-0 z-50` with `h-16` (4rem height), meaning the sticky TOC must pin below it at `top: 4rem` (or `top-16` in Tailwind). No parent elements in the DOM ancestry have `overflow: hidden/auto/scroll` that would break sticky positioning -- verified by inspecting layout.tsx, the blog post page, and globals.css.

**Primary recommendation:** Add `sticky top-16 z-40` to the MobileToc outer container, add click handlers on TOC links to auto-collapse, and adjust `scroll-margin-top` on prose headings to account for the combined header + collapsed TOC height.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use CSS `position: sticky; top: 0` on the mobile TOC container so it pins to the top of the viewport when the user scrolls past its original position. Pure CSS -- no JavaScript scroll listeners or IntersectionObserver for the positioning itself.
- **D-02:** The sticky behavior applies only below the `lg` breakpoint (where the mobile TOC is visible). The desktop sidebar TOC already has `sticky top-24` and remains unchanged.
- **D-03:** When sticky, the TOC shows as a compact collapsed bar -- just the "Contents" toggle button. The full heading list only appears when the user taps to expand, same as current behavior.
- **D-04:** Add a subtle visual indicator (e.g., slight background opacity, bottom border shadow) when the TOC is in its sticky/pinned state to distinguish it from the inline position. Claude has discretion on the exact treatment.
- **D-05:** After the user taps a heading link in the expanded sticky TOC, the TOC auto-collapses. This prevents the expanded heading list from obscuring the content the user just navigated to.
- **D-06:** Smooth scroll to the target heading after collapse. Use native `scroll-behavior: smooth` or the existing scroll-margin-top pattern already in the codebase for heading anchors.
- **D-07:** No separate back-to-top floating button. The sticky TOC itself serves as the persistent navigation affordance.

### Claude's Discretion
- z-index value for sticky TOC (must be above content but below mobile menu overlay)
- Transition animation when toggling between inline and sticky states
- Whether to add a visual "pinned" indicator (e.g., reduced shadow or background change)
- scroll-margin-top adjustments for heading targets to account for the sticky TOC height

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

## Standard Stack

### Core
No new dependencies. This phase uses only existing CSS and React patterns already in the codebase.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | useState for toggle, onClick for auto-collapse | Already in use |
| Tailwind CSS v4 | 4.x | Sticky positioning, responsive breakpoints | Already in use |

### Supporting
None needed. No new libraries.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `position: sticky` | IntersectionObserver + fixed positioning | Overengineered; sticky does exactly what's needed with zero JS |
| Auto-collapse via onClick | Scroll event listener to detect navigation | Fragile, performance cost; direct click handler is simpler and reliable |

## Architecture Patterns

### Recommended Approach

The modification is contained to a single component file (`mobile-toc.tsx`) with a minor CSS adjustment in `globals.css`. No new files needed.

```
src/
  components/blog/
    mobile-toc.tsx    # PRIMARY: Add sticky classes, auto-collapse handler, pinned visual
  app/
    globals.css       # MINOR: Adjust scroll-margin-top for prose headings
    blog/[slug]/
      page.tsx        # VERIFY: No changes needed (no overflow ancestors to break sticky)
```

### Pattern 1: CSS Sticky with Fixed Header Offset

**What:** The header is `fixed top-0 z-50 h-16`. The sticky TOC must account for this.
**When to use:** Always -- the header is present on all pages.
**Implementation:**

The current MobileToc outer div is:
```tsx
<div className="lg:hidden mb-8">
```

It needs to become:
```tsx
<div className={cn(
  'lg:hidden mb-8',
  'sticky top-16 z-40 -mx-6 px-6 pt-2 pb-0',
)}>
```

Key details:
- `top-16` = `top: 4rem` -- sits directly below the fixed header (h-16 = 4rem)
- `z-40` -- above page content but below the header (`z-50`) and mobile menu overlay (which is a child of the z-50 header)
- `-mx-6 px-6` -- optional: extend the sticky background edge-to-edge to prevent content peeking through at the sides (the article has `px-6`)

### Pattern 2: Auto-Collapse on Link Click

**What:** When a heading link inside the expanded TOC is clicked, close the accordion before the browser scrolls to the anchor.
**When to use:** Only inside the mobile TOC (desktop TOC has no accordion).
**Implementation:**

The `TocList` component renders `<a href={entry.url}>` links. The MobileToc needs to intercept clicks on these links to call `setIsOpen(false)`. Two approaches:

**Approach A -- Event delegation (recommended):**
Add an `onClick` handler on the TOC content container that catches bubbled clicks from any `<a>` element:

```tsx
<div
  id="mobile-toc-content"
  onClick={(e) => {
    if ((e.target as HTMLElement).closest('a')) {
      setIsOpen(false)
    }
  }}
>
```

This avoids modifying `TocList` (shared with desktop) and handles any nesting depth.

**Approach B -- Callback prop to TocList:**
Pass `onLinkClick` prop to `TocList`. This requires changing the shared component interface, which is unnecessary for this use case.

**Recommendation: Approach A (event delegation).** Cleaner, no changes to shared `TocList` component.

### Pattern 3: Pinned State Visual Indicator

**What:** Distinguish the TOC when it's pinned vs. inline.
**When to use:** When the user has scrolled past the TOC's natural position.

Two options for detecting "pinned" state:

**Option 1 -- CSS-only with shadow (recommended):**
Always apply the sticky visual treatment (e.g., `shadow-brutal` or a bottom border). Since the TOC is at the top of the article content, when it's inline it looks normal; when pinned, the shadow provides visual grounding. No JS detection needed.

**Option 2 -- IntersectionObserver sentinel:**
Place a zero-height sentinel div at the TOC's original position. When the sentinel leaves the viewport, toggle a `isPinned` state. This enables precise visual transitions but adds complexity.

**Recommendation: Option 1 (always-applied shadow).** The CONTEXT.md says "subtle visual indicator" and gives Claude discretion. A bottom shadow (`shadow-[0_3px_0_0_#000]` or similar) applied always looks appropriate in both states and requires zero JavaScript. The neobrutalist style already uses bold shadows, so this fits naturally.

### Anti-Patterns to Avoid
- **Adding `overflow: hidden` to any ancestor:** This breaks `position: sticky`. The current DOM tree is clean -- do not introduce overflow properties on wrapper elements.
- **Using `position: fixed` instead of `sticky`:** Fixed positioning would require JS to detect when to toggle, and would remove the element from flow. Sticky is the correct tool.
- **Modifying the shared `TocList` component:** The desktop TOC reuses `TocList`. Auto-collapse logic should stay in `MobileToc` via event delegation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sticky positioning | JS scroll listener + fixed/absolute toggle | CSS `position: sticky` | Native browser feature, zero JS, handles edge cases automatically |
| Smooth scroll to anchor | Custom scroll animation | Native anchor behavior + `scroll-margin-top` | Already works in the codebase, browser-native performance |
| Pinned state detection | IntersectionObserver sentinel | Always-applied visual treatment | Simpler, no state management, works in all scenarios |

**Key insight:** This entire phase can be implemented with approximately 10-15 lines of changed/added code. CSS sticky does the heavy lifting. The only JS addition is a single click handler for auto-collapse.

## Common Pitfalls

### Pitfall 1: scroll-margin-top Not Accounting for Sticky TOC Height
**What goes wrong:** After tapping a heading link, the heading scrolls behind the sticky TOC, partially obscured.
**Why it happens:** Current `scroll-margin-top: 5rem` accounts for the fixed header (4rem) + 1rem breathing room. The collapsed sticky TOC adds ~48-56px (button height with padding and border), pushing the total clearance needed to ~9-10rem.
**How to avoid:** Update `.prose h2, .prose h3, .prose h4 { scroll-margin-top }` in globals.css to account for the combined height. Use a value like `8rem` or `9rem`. Measure the actual collapsed TOC height during implementation.
**Warning signs:** Heading text is partially hidden behind the sticky TOC after clicking a TOC link.

### Pitfall 2: Sticky TOC Background Transparency
**What goes wrong:** Page content scrolls visibly behind/through the sticky TOC, creating a messy layered appearance.
**Why it happens:** The current TOC inner div has `bg-surface` but the outer wrapper has no background. When sticky, content passes behind the outer wrapper's padding area.
**How to avoid:** Ensure the sticky container or its immediate child has an opaque background that covers the full width. The inner `bg-surface` box handles the TOC itself, but add `bg-background` to the sticky outer container to cover the gap.
**Warning signs:** Text or images visible through the TOC area when scrolling.

### Pitfall 3: Expanded TOC Height Overflow When Sticky
**What goes wrong:** A post with many headings has an expanded TOC that extends beyond the viewport when pinned at the top.
**Why it happens:** The current `max-h-[70vh]` and `max-h-[60vh]` on the expanded content are relative to viewport height, which is correct. But when sticky at the top, the available space is reduced by the header height.
**How to avoid:** The existing `max-h-[70vh]` with `overflow-auto` on the content region handles this adequately. The inner scroll container (`max-h-[60vh]`) prevents overflow. No change needed, but verify during testing.
**Warning signs:** Expanded TOC pushes below the fold or clips without scroll.

### Pitfall 4: Double Scroll on Expanded Sticky TOC
**What goes wrong:** On short viewports, the expanded sticky TOC takes most of the screen, and the page content behind it is scrollable, causing confusing dual-scroll behavior.
**Why it happens:** The expanded TOC uses `max-h-[60vh]` with `overflow-auto`, and the page body also scrolls.
**How to avoid:** This is inherent to the accordion approach and is acceptable. The auto-collapse after link click (D-05) mitigates the impact by ensuring the TOC doesn't stay expanded while reading. No additional action needed.

### Pitfall 5: mb-8 Creates Gap When Pinned
**What goes wrong:** The `mb-8` (margin-bottom: 2rem) on the sticky container creates a visible gap between the pinned TOC and the content below it.
**Why it happens:** `position: sticky` keeps the element in flow. The margin is fine when inline but may look odd when pinned at the top with a gap below.
**How to avoid:** The `mb-8` actually serves a purpose in both states -- it provides spacing between the TOC and the first content element. When pinned, it ensures content doesn't ride up against the TOC. Likely fine as-is, but verify visually.

## Code Examples

### Complete MobileToc Modification

```tsx
// Source: Derived from existing src/components/blog/mobile-toc.tsx
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TocList } from '@/components/blog/toc'
import type { TocEntry } from '@/components/blog/toc'

interface MobileTocProps {
  entries: TocEntry[]
}

export function MobileToc({ entries }: MobileTocProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className={cn(
      'lg:hidden mb-8',
      'sticky top-16 z-40 bg-background -mx-6 px-6 pt-2',
    )}>
      <div className={cn(
        'border-[3px] border-foreground bg-surface',
        'shadow-brutal',
      )}>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="mobile-toc-content"
          className={cn(
            'w-full flex items-center justify-between px-4 py-3',
            'font-display font-bold text-lg',
            'text-foreground hover:text-accent transition-colors',
          )}
        >
          <span>Contents</span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-accent transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>

        <div
          id="mobile-toc-content"
          role="region"
          aria-label="Table of contents"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) {
              setIsOpen(false)
            }
          }}
          className={cn(
            'overflow-hidden transition-[max-height] duration-200 ease-in-out',
            isOpen ? 'max-h-[70vh]' : 'max-h-0',
          )}
        >
          <div className="px-4 pb-4 overflow-auto max-h-[60vh]">
            <TocList entries={entries} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### scroll-margin-top Adjustment

```css
/* Source: src/app/globals.css -- update existing rule */
/* Current: scroll-margin-top: 5rem (header only) */
/* Updated: account for header (4rem) + sticky TOC (~3.5rem) + breathing room */
.prose h2,
.prose h3,
.prose h4 {
  scroll-margin-top: 9rem;
}
```

**Note:** The exact `scroll-margin-top` value should be tuned during implementation by measuring the actual collapsed TOC height. Start with `9rem` and adjust.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS scroll listeners for sticky | CSS `position: sticky` | Widely supported since ~2020 | Zero JS needed for positioning |
| Custom smooth scroll JS | `scroll-behavior: smooth` + `scroll-margin-top` | CSS spec, well-supported | Native performance, no library needed |

**Deprecated/outdated:**
- jQuery sticky plugins: Completely replaced by CSS `position: sticky`
- `position: -webkit-sticky` vendor prefix: No longer needed, sticky is unprefixed in all modern browsers

## Common Pitfalls

(See detailed pitfalls section above)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Playwright |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx playwright test` |

### Phase Requirements to Test Map

Since this phase has no formal requirement IDs, the behaviors to validate are derived from the CONTEXT.md decisions:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | TOC becomes sticky when scrolled past | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | Extends existing |
| D-03 | Collapsed bar visible when sticky | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | Extends existing |
| D-05 | Auto-collapse after heading link tap | E2E | `npx playwright test e2e/mobile-toc.spec.ts` | Extends existing |
| D-06 | Heading visible after scroll (not behind TOC) | E2E / manual | Manual visual check | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run` (unit tests unaffected but confirms no regressions)
- **Per wave merge:** `npx playwright test e2e/mobile-toc.spec.ts`
- **Phase gate:** Full Playwright suite green + manual mobile viewport check

### Wave 0 Gaps
- [ ] Extend `e2e/mobile-toc.spec.ts` with test for auto-collapse after heading link click
- [ ] Extend `e2e/mobile-toc.spec.ts` with test for sticky visibility after scroll (scroll down, verify TOC toggle still visible)

*(Existing test file covers expand/collapse and heading navigation -- new tests extend it)*

## Open Questions

1. **Exact scroll-margin-top value**
   - What we know: Current value is `5rem` (header 4rem + 1rem). Sticky TOC collapsed height is ~48-56px based on `py-3` + `text-lg` + `border-[3px]`.
   - What's unclear: Exact pixel height of collapsed TOC with all padding/border.
   - Recommendation: Start with `9rem`, measure during implementation, adjust. This is a tune-during-build value.

2. **Edge-to-edge sticky background**
   - What we know: The article has `px-6` padding. The sticky TOC needs to cover the full viewport width to prevent content bleeding through at the edges.
   - What's unclear: Whether `-mx-6 px-6` on the sticky wrapper or `bg-background` alone is sufficient.
   - Recommendation: Use `-mx-6 px-6 bg-background` on the sticky outer wrapper. Verify visually.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `mobile-toc.tsx`, `toc.tsx`, `page.tsx`, `layout.tsx`, `header.tsx`, `globals.css`
- CSS `position: sticky` is a well-established browser feature with universal support

### Secondary (MEDIUM confidence)
- scroll-margin-top value of `9rem` is an estimate pending measurement -- HIGH confidence in the approach, MEDIUM on the exact value

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure CSS + minimal React
- Architecture: HIGH -- pattern already exists in desktop TOC, single-file change
- Pitfalls: HIGH -- well-understood CSS sticky gotchas, verified no overflow ancestors in DOM

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- CSS features, no moving targets)
