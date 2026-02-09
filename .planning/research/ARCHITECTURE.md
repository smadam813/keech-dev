# Architecture Research

**Domain:** Next.js hero component with image-synced animations and CSS glow effects
**Researched:** 2026-02-08
**Confidence:** HIGH

## System Overview

```
Hero Section Component Architecture
====================================

Server Layer (RSC)                      Client Layer ('use client')
+----------------------------+          +----------------------------+
| page.tsx                   |          | HeroClient                 |
| - exports metadata         |          | - owns imageLoaded state   |
| - renders <HeroClient />  |          | - owns Image + onLoad      |
+----------------------------+          | - passes state to children |
                                        +-------+----------+---------+
                                                |          |
                                        +-------v--+  +----v---------+
                                        | GlowText |  | CSS Layers   |
                                        | (child)  |  | (scrim, glow)|
                                        +----------+  +--------------+

CSS Layer (globals.css)
+-----------------------------------------------------------+
| @keyframes heroFadeIn     — text entrance after load      |
| @keyframes glowPulse     — glow cycle after entrance      |
| .hero-loaded .hero-text   — animation trigger via class   |
| .hero-glow                — text-shadow glow overlay      |
+-----------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Render Mode | Why |
|-----------|----------------|-------------|-----|
| `page.tsx` | Route entry, metadata export | Server | Metadata must be server-side; no interactive logic |
| `HeroClient` | Image load detection, animation orchestration | Client (`'use client'`) | `onLoad` callback requires client component |
| Next.js `<Image>` | Image rendering, blur placeholder | Inside client boundary | `onLoad` prop needs function serialization |
| Scrim overlay | WCAG AA contrast gradient | Pure CSS child | No interactivity; just a `<div>` with background |
| Glow text | Animated heading with glow effect | DOM child of HeroClient | CSS-only; animation triggered by parent class |
| `globals.css` | Keyframes, glow definitions, reduced-motion | Build-time CSS | No runtime JS needed for animation definitions |

## Recommended Component Structure

The hero currently lives at `src/components/hero.tsx` as a server component. Converting it to a client component is the correct approach because the entire component's purpose is interactive (image load detection triggers animation). Unlike the rest of the site where server components wrap small client islands, this hero is a single cohesive interactive unit.

```
src/
  components/
    hero.tsx              # 'use client' — renamed from server to client
  app/
    page.tsx              # Server component — renders <Hero />
    globals.css           # Keyframes + glow classes added here
```

### Structure Rationale

- **Single file, not split:** The hero has no server-side data fetching, no async operations, and no heavy imports that would benefit from staying in RSC. The static image import works in client components. Splitting into a server wrapper + client child adds complexity with zero benefit here.
- **CSS in globals.css:** Glow keyframes and animation classes belong alongside the existing `fadeInUp` and `.animate-on-load` definitions. Tailwind CSS v4's `@theme` directive handles design tokens; keyframes stay in the global stylesheet per established project convention.

## Architectural Patterns

### Pattern 1: Image Load State as Animation Gate

**What:** Use React state (`imageLoaded`) set by the `<Image onLoad>` callback to gate CSS animations. The component renders with content hidden (opacity: 0), then applies a CSS class when the image is confirmed loaded.

**When to use:** When animation timing must sync with image readiness, not just component mount.

**Trade-offs:**
- Pro: Animations never fire before content is visually ready
- Pro: Works with Next.js `placeholder="blur"` — the blur shows immediately, then the real image loads, then `onLoad` fires, then your custom animation begins
- Con: Requires `'use client'` (already needed for `onLoad`)

**Example:**
```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import heroImage from '../../public/images/hero.webp'

export function Hero() {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <section className={`hero-container ${imageLoaded ? 'hero-loaded' : ''}`}>
      <Image
        src={heroImage}
        alt=""
        fill
        sizes="100vw"
        placeholder="blur"
        className="object-cover"
        quality={80}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Scrim — always present, no state dependency */}
      <div className="scrim" />

      {/* Text — CSS animation triggered by .hero-loaded on parent */}
      <div className="hero-text">
        <h1>keech<span>.dev</span></h1>
      </div>
    </section>
  )
}
```

### Pattern 2: CSS Class Cascade for Animation Sequencing

**What:** Instead of JavaScript timers or animation libraries, use a parent class (`.hero-loaded`) that triggers child animations via CSS descendant selectors with `animation-delay`. This chains entrance animation followed by glow loop.

**When to use:** When you need sequenced animations but want zero JS animation runtime overhead.

**Trade-offs:**
- Pro: Single state toggle in JS; all timing lives in CSS
- Pro: `prefers-reduced-motion` handled in one CSS block
- Pro: No animation library dependency (project currently has none)
- Con: Complex sequences harder to debug than JS orchestration
- Con: CSS `animation-delay` is less flexible than JS Promise chains

**Example (globals.css):**
```css
/* Text starts hidden */
.hero-text {
  opacity: 0;
}

/* When image loads, parent gets .hero-loaded, triggering text entrance */
.hero-loaded .hero-text {
  animation: heroFadeIn 0.6s ease-out forwards;
}

/* Glow begins after entrance completes (0.6s delay matches entrance duration) */
.hero-loaded .hero-glow {
  animation:
    heroFadeIn 0.6s ease-out forwards,
    glowPulse 3s ease-in-out 0.6s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hero-text,
  .hero-loaded .hero-text,
  .hero-loaded .hero-glow {
    animation: none !important;
    opacity: 1 !important;
  }
}
```

### Pattern 3: CSS-Only Glow via `text-shadow` Stacking

**What:** Layer multiple `text-shadow` values at increasing blur radii to simulate a light diffusion glow around text. Animate between glow states using keyframes for a pulsing or breathing effect.

**When to use:** When you want a glow overlay without extra DOM elements, pseudo-elements, or JavaScript.

**Trade-offs:**
- Pro: Single CSS property, no extra markup
- Pro: Color inherits from design tokens (use `var(--color-accent)`)
- Con: `text-shadow` is not GPU-composited — it triggers paint, not just composite. For a single hero heading this is negligible, but it would be problematic in a list of 100 items
- Con: Cannot clip or mask the glow independently from the text

**Performance note:** `text-shadow` animation triggers repaint on each frame. For a single `<h1>` on a static page, this is well within budget. Adding `will-change: text-shadow` is unnecessary here and would waste compositor memory. The glow animation should use a slow cycle (3-4s) to minimize paint frequency.

## Data Flow

### Image Load to Animation Trigger

```
[Page Load]
    |
    v
[Next.js Image renders with placeholder="blur"]
    |  (blur placeholder visible immediately)
    v
[Browser decodes full image, replaces blur]
    |
    v
[onLoad fires] --> [setImageLoaded(true)]
    |
    v
[React re-renders: className adds 'hero-loaded']
    |
    v
[CSS descendant selector activates]
    |
    +---> [.hero-text: heroFadeIn 0.6s]
    |         |
    |         v (after 0.6s)
    |
    +---> [.hero-glow: glowPulse 3s infinite, delayed 0.6s]
```

### Key Data Flows

1. **Image load signal:** `onLoad` callback -> `useState` -> className toggle. One-directional, one-time. No event bus or context needed.
2. **Animation sequencing:** CSS `animation-delay` chains entrance and glow. No JavaScript involved after the class toggle.
3. **Reduced motion bypass:** CSS `@media (prefers-reduced-motion: reduce)` overrides both animations with `animation: none` and `opacity: 1`. This follows the established pattern in `globals.css` lines 89-101.

## Anti-Patterns

### Anti-Pattern 1: Splitting Hero into Server Wrapper + Client Island

**What people do:** Create `hero-server.tsx` (server component) that wraps `hero-client.tsx` (client component) to "keep the server component boundary."

**Why it's wrong:** The hero has no server-side data fetching, no database queries, no heavy npm imports that benefit from exclusion from the client bundle. The static image import (`import heroImage from '...'`) works identically in both server and client components. The split adds a file, a component boundary, and props threading for zero measurable benefit.

**Do this instead:** Make the single `hero.tsx` a client component. The project already has 5 client components (will become 6). This is consistent with the project's principle of using `'use client'` when there is a specific browser API need.

### Anti-Pattern 2: Using JavaScript for Animation Timing

**What people do:** Use `setTimeout`, `requestAnimationFrame`, or an animation library (Framer Motion, GSAP) to orchestrate the entrance-then-glow sequence.

**Why it's wrong:** Adds runtime JS for what CSS handles natively. Framer Motion alone is ~30KB gzipped. The project has zero animation libraries and the existing `fadeInUp` pattern proves CSS keyframes are the established convention.

**Do this instead:** Use CSS `animation-delay` to sequence animations. One JS state toggle (`imageLoaded`), everything else in CSS.

### Anti-Pattern 3: Using `onLoadingComplete` Instead of `onLoad`

**What people do:** Reference older Next.js examples that use `onLoadingComplete`.

**Why it's wrong:** `onLoadingComplete` was deprecated in Next.js 14. The project runs Next.js 16.1.6.

**Do this instead:** Use `onLoad`. It fires once the image is completely loaded and the placeholder has been removed. If you observe double-firing (from the invisible placeholder), guard with a check on `e.target.srcset` — though with static imports and `placeholder="blur"`, this is typically not an issue.

### Anti-Pattern 4: Heavy Glow with `box-shadow` or Pseudo-Element Blur

**What people do:** Use `box-shadow` on a pseudo-element with a large blur radius, or `filter: blur()` on a duplicated text element, to create the glow.

**Why it's wrong:** Both approaches trigger layout and/or composite layer creation far heavier than `text-shadow`. A blurred pseudo-element creates an entirely separate compositing layer with its own paint surface.

**Do this instead:** Use stacked `text-shadow` values. For a single heading, this is the most lightweight approach. The glow color should use `var(--color-accent-light, #4FBFBF)` to match the existing `.dev` accent.

## Build Order (Dependencies)

The following build order reflects what depends on what:

```
Phase 1: CSS Foundation (no component changes needed)
  |  Add @keyframes heroFadeIn, @keyframes glowPulse to globals.css
  |  Add .hero-text, .hero-loaded, .hero-glow classes
  |  Add prefers-reduced-motion overrides for new classes
  |  --> Can be tested in browser DevTools by manually toggling classes
  |
Phase 2: Client Component Conversion
  |  Add 'use client' to hero.tsx
  |  Add useState for imageLoaded
  |  Add onLoad handler to <Image>
  |  Wire className to include 'hero-loaded' when imageLoaded is true
  |  --> Entrance animation now syncs with image load
  |
Phase 3: Glow Effect
  |  Add .hero-glow class to heading element
  |  Tune text-shadow values and glow animation timing
  |  --> Glow pulses after entrance completes
  |
Phase 4: Polish
     Adjust timing curves, glow intensity, animation durations
     Verify prefers-reduced-motion behavior
     Test on mobile (glow may need reduced intensity for performance)
```

**Why this order:**
- Phase 1 is pure CSS, zero risk to existing functionality, independently testable
- Phase 2 is the only breaking change (server -> client), isolated to one file
- Phase 3 depends on Phase 2 (glow timing chains from entrance animation)
- Phase 4 is tuning; cannot happen until the mechanism exists

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `page.tsx` -> `Hero` | Direct import, no props | Page just renders `<Hero />`; metadata stays in page |
| `Hero` -> CSS | Class names on DOM elements | `.hero-loaded` class is the sole JS-to-CSS bridge |
| `globals.css` -> `Hero` | `@theme` design tokens via CSS vars | Glow color uses `var(--color-accent-light)` from existing palette |
| `Hero` -> `layout.tsx` | None (already works via children slot) | No layout changes needed |

### External Services

None. The hero is fully static — no API calls, no data fetching, no third-party scripts.

## Scaling Considerations

Not applicable in the traditional sense (this is a static portfolio site), but relevant for **CSS animation performance at device scale:**

| Device Class | Consideration |
|-------------|---------------|
| Desktop | No concerns. Single `text-shadow` animation on one heading is negligible. |
| Mobile (modern) | Fine. `text-shadow` repaint cost on a single element is within budget. |
| Mobile (low-end) | If glow animation causes jank, reduce to 2 `text-shadow` layers instead of 3-4, or increase cycle duration to 5s. |
| `prefers-reduced-motion` | All animations disabled. Content shows immediately at full opacity. |

## Sources

- [Next.js Image Component API Reference](https://nextjs.org/docs/app/api-reference/components/image) — `onLoad` prop documentation, client component requirement (HIGH confidence)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — component boundary rules, children slot pattern (HIGH confidence)
- [Animation Performance: Browser Under the Hood (Viget)](https://www.viget.com/articles/animation-performance-101-browser-under-the-hood) — GPU compositing, paint vs composite layer costs (MEDIUM confidence)
- [W3Schools: CSS Glowing Text](https://www.w3schools.com/howto/howto_css_glowing_text.asp) — `text-shadow` stacking technique (HIGH confidence)
- Existing codebase analysis: `hero.tsx`, `scroll-reveal.tsx`, `header.tsx`, `globals.css` (HIGH confidence — direct inspection)

---
*Architecture research for: Next.js hero animation sync and CSS glow effects*
*Researched: 2026-02-08*
