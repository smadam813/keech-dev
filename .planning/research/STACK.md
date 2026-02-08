# Stack Research

**Domain:** Hero animation synchronization and CSS glow effects for Next.js portfolio site
**Researched:** 2026-02-08
**Confidence:** HIGH

## Recommended Stack

This milestone requires zero new dependencies. Everything is achievable with the existing stack (Next.js 16.1.6, React 19.2.4, Tailwind CSS v4.1.18) plus native CSS and browser APIs already available.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js `Image` `onLoad` callback | 16.1.6 (current) | Detect when hero background image is decoded and visible | Built-in prop, fires after placeholder removal, gives direct access to the underlying `<img>` element via `event.target`. **Confidence: HIGH** -- verified in official Next.js docs (Jan 2026). |
| React 19 `useState` + `onLoad` | 19.2.4 (current) | Track image-loaded state to conditionally trigger text animation | Simple boolean state flip. Avoids useEffect timing issues. The `onLoad` handler sets state, and a CSS class toggles based on that state. **Confidence: HIGH** -- standard React pattern. |
| CSS `@keyframes` + class toggle | Native CSS | Sync text fadeInUp animation with image readiness | Animation is defined but not applied until a `data-loaded` attribute or class is added. More reliable than `animation-play-state` because it avoids the "animation already running" edge case. **Confidence: HIGH** -- established pattern, universal browser support. |
| CSS `@property` | Native CSS | Animate custom properties for glow opacity and blur radius | Allows smooth interpolation of typed custom properties (e.g., `<number>`, `<color>`) that normally can't be transitioned. Enables animating `radial-gradient` stop positions and opacity values in keyframes. **Confidence: HIGH** -- Baseline since 2024, ~96% browser support per caniuse. |
| CSS pseudo-elements (`::before`/`::after`) | Native CSS | Position glow overlays at rune locations without extra DOM nodes | Absolute-positioned pseudo-elements with `radial-gradient` backgrounds. Animate only `opacity` and `transform` for GPU compositing. **Confidence: HIGH** -- universal support, established performance pattern. |
| Tailwind CSS v4 `@theme` directive | 4.1.18 (current) | Define animation tokens (durations, delays, easing) as design tokens | CSS-first config already in use. Add new `--animate-*` custom properties alongside existing `--animate-fade-in-up`. Keeps all timing values co-located. **Confidence: HIGH** -- already in use in codebase. |

### Supporting Libraries

No new libraries required. The entire feature set is achievable with native browser APIs and CSS.

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | -- | -- | This milestone introduces no new dependencies. All techniques use native CSS and existing React/Next.js APIs. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Chrome DevTools Performance panel | Profile animation frame rate | Record the hero load sequence. Look for dropped frames during glow animations. Target 60 FPS on mid-range mobile. |
| Chrome DevTools Animations panel | Inspect keyframe timing | Visualize staggered delays across rune glow elements. Verify animation-delay offsets. |
| `prefers-reduced-motion` testing | Accessibility validation | Toggle in DevTools > Rendering to verify all animations respect the media query. The codebase already has this pattern in `globals.css`. |

## Key Technical Decisions

### 1. Image Load Detection: `onLoad` prop (not ref, not IntersectionObserver)

**Use `onLoad` on the Next.js `<Image>` component.**

The hero component (`src/components/hero.tsx`) is currently a server component. Adding `onLoad` requires converting it to a client component (`'use client'`). This is acceptable because:

- The component already uses `placeholder="blur"` with a static import, so the blur data URL is generated at build time and embedded in the HTML. No SSR performance loss.
- The `onLoad` callback fires **after** the placeholder has been removed, meaning the real image is decoded and painted. This is the exact signal needed to trigger the text animation.
- The `ref` prop (available since v13.0.6) could provide access to `img.complete` for race-condition handling, but `onLoad` alone is sufficient here because the hero image uses `preload` (which triggers early `<link>` insertion in `<head>`) and `placeholder="blur"` (which ensures the blur is visible while loading).

**Pattern:**

```tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'
import heroImage from '../../public/images/hero.webp'

export function Hero() {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <section data-loaded={imageLoaded || undefined} className="...">
      <Image
        src={heroImage}
        onLoad={() => setImageLoaded(true)}
        // ... existing props
      />
      <div className="... hero-text">
        <h1>keech<span>.dev</span></h1>
      </div>
    </section>
  )
}
```

```css
.hero-text {
  opacity: 0;
  transform: translateY(20px);
}

[data-loaded] .hero-text {
  animation: fadeInUp 0.6s ease-out forwards;
}
```

**Why `data-loaded` attribute over a class:**
- Semantic: communicates state, not styling
- Works naturally with CSS attribute selectors
- Avoids collision with Tailwind utility classes

**Confidence: HIGH** -- `onLoad` is documented in official Next.js docs, fires after placeholder removal, requires client component (acceptable tradeoff for this use case).

### 2. Animation Trigger: Class/Attribute Toggle (not `animation-play-state`)

**Use a data attribute to conditionally apply the animation, rather than starting with `animation-play-state: paused` and toggling to `running`.**

Rationale:
- `animation-play-state: paused` still allocates the animation on the compositor. The animation "exists" but is frozen. When toggled to `running`, it resumes from where it was paused, which means if there's any delay between initial render and the toggle, the animation may appear to "skip" its beginning.
- The class/attribute toggle approach means the animation doesn't exist at all until the image loads. When the attribute appears, the animation starts fresh from `from {}`.
- This is the same pattern used by `scroll-reveal.tsx` in the existing codebase (class toggle between `opacity-0 translate-y-5` and `animate-fade-in-up`).

**Confidence: HIGH** -- matches existing codebase pattern, avoids known `animation-play-state` timing quirks.

### 3. Glow/Pulse Overlays: Pseudo-Elements with `opacity` + `transform` Animation

**Use absolutely-positioned `<div>` elements (one per rune glow location) with `radial-gradient` backgrounds, animating only `opacity` for the pulse effect.**

Architecture:
- Each glow point is a `<div>` with `position: absolute`, placed at known rune coordinates using `top`/`left` percentages.
- The glow itself is a `radial-gradient(circle, rgba(teal, 0.4) 0%, transparent 70%)` background.
- The pulse animation modulates `opacity` between 0.3 and 0.8 (or similar range) using `@keyframes`.
- Stagger the pulse across rune positions using `animation-delay` with a CSS custom property `--glow-index` set inline.

**Why pure `opacity` animation (not `box-shadow`, not `filter: blur`, not gradient animation):**

| Technique | GPU-Composited? | Repaint Cost | Verdict |
|-----------|----------------|--------------|---------|
| `opacity` animation | YES | None (compositor only) | **Use this** |
| `transform: scale()` animation | YES | None (compositor only) | Combine with opacity for "breathing" effect |
| `box-shadow` animation | NO | Full repaint per frame | **Avoid** -- CPU-bound, causes jank on mobile |
| `filter: blur()` animation | Partial | Texture re-rasterization | **Avoid** -- expensive, especially on multiple elements |
| `background-image` (gradient) animation | NO | Full repaint per frame | **Avoid** -- gradients aren't directly animatable without @property |

**Using `@property` for gradient animation (optional enhancement):**

If a more dynamic glow spread is desired (not just opacity pulsing), CSS `@property` allows animating a typed custom property used within a `radial-gradient`:

```css
@property --glow-spread {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 50%;
}

.rune-glow {
  background: radial-gradient(circle, rgba(79, 191, 191, 0.4) 0%, transparent var(--glow-spread));
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { --glow-spread: 50%; opacity: 0.3; }
  50% { --glow-spread: 70%; opacity: 0.7; }
}
```

This allows the glow radius to "breathe" in addition to fading. `@property` is Baseline 2024 (~96% global support). However, note that animating `--glow-spread` inside a gradient **does trigger repaints** (it changes the background-image computation). For 5-8 rune glows, this is acceptable on modern hardware but should be tested on mobile. The pure `opacity` approach is safer.

**Confidence: HIGH** for opacity-only approach. **MEDIUM** for @property gradient approach (works, but requires mobile performance testing).

### 4. Staggered Animation Delays: CSS Custom Properties (not sibling-index)

**Use inline `style` attributes to set a `--glow-index` custom property on each rune glow element, then compute `animation-delay` in CSS with `calc()`.**

```tsx
{runePositions.map((pos, i) => (
  <div
    key={i}
    className="rune-glow"
    style={{
      '--glow-index': i,
      top: pos.top,
      left: pos.left,
    } as React.CSSProperties}
  />
))}
```

```css
.rune-glow {
  animation: glowPulse 3s ease-in-out infinite;
  animation-delay: calc(var(--glow-index) * 0.4s);
}
```

**Why not CSS `sibling-index()`:** Only 70% browser support (no Firefox). Not production-ready.

**Why not `nth-child` with hardcoded delays:** The rune positions are data-driven (known coordinates on the hero image). Using `--glow-index` via inline style is cleaner than maintaining nth-child rules that must match element order.

**Confidence: HIGH** -- custom property stagger is a well-established pattern with universal browser support.

### 5. Reduced Motion: Extend Existing Pattern

The codebase already handles `prefers-reduced-motion` in `globals.css` (lines 89-101). Extend this:

```css
@media (prefers-reduced-motion: reduce) {
  .rune-glow {
    animation: none !important;
    opacity: 0.5 !important; /* Static glow, no pulse */
  }

  .hero-text {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

**Confidence: HIGH** -- extends existing accessibility pattern.

## Installation

```bash
# No new packages needed.
# This milestone uses only:
# - Next.js Image onLoad (built-in)
# - React useState (built-in)
# - CSS @keyframes, @property, custom properties (native CSS)
# - Tailwind CSS v4 @theme directive (already configured)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `onLoad` callback | `ref` + `img.complete` check in useEffect | If you need to detect already-cached images that loaded before React hydration. Not needed here because `placeholder="blur"` ensures a visible state during loading. |
| `onLoad` callback | `IntersectionObserver` | If the image is below the fold and you want to detect when it scrolls into view. Not applicable -- hero is above-fold. |
| Data attribute toggle | `animation-play-state: paused/running` | If you need to pause/resume an animation mid-flight (e.g., pause on hover). Not needed here -- animation should start fresh. |
| `opacity` animation for glow | `box-shadow` animation | Never for this use case. `box-shadow` triggers full repaints and will jank on mobile with multiple glow points. |
| `opacity` animation for glow | `filter: drop-shadow()` animation | Never for multiple elements. Each `filter` change re-rasterizes the compositing layer. |
| Inline `--glow-index` custom property | CSS `sibling-index()` | When Firefox ships support and you're targeting only modern browsers (currently 70% support, no Firefox). |
| CSS `@property` typed custom properties | JavaScript-driven animation (requestAnimationFrame) | If you need physics-based spring animations or complex choreography. Overkill for ambient pulse effects. |
| Pure CSS animations | Framer Motion / React Spring | If you need gesture-driven, spring-physics, or layout animations. Adds 30-50KB bundle weight for ambient glow effects that CSS handles natively. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Framer Motion / React Spring | Adds 30-50KB for ambient effects CSS handles natively. Overkill for opacity/transform pulses. These libraries are for interactive gesture animations and layout transitions. | CSS `@keyframes` with `opacity` and `transform` |
| `animation-play-state: paused` then toggle to `running` | Animation "exists" while paused, consuming compositor resources. If toggle timing drifts, animation appears to skip its beginning. Known edge case on Safari. | Conditionally apply animation via data attribute / class toggle |
| `box-shadow` animation | CPU-bound, triggers full repaint per frame. With 5-8 glow points animating simultaneously, this will cause visible jank on mobile devices. | `opacity` animation on pseudo-elements or positioned divs with `radial-gradient` background |
| `filter: blur()` animation on multiple elements | Each blur change re-rasterizes the element's compositing layer. Acceptable for one element, problematic for 5-8. | Static `radial-gradient` with animated `opacity` (gradient already provides the soft-edge "blur" look) |
| `@starting-style` for entry animation | Only relevant to CSS transitions, not `@keyframes` animations. The animation trigger here is state-driven (image loaded), not DOM entry. | Standard `@keyframes` with conditional class/attribute |
| CSS `sibling-index()` for stagger delays | No Firefox support (70% global coverage). Not production-ready for a public site. | Inline `--glow-index` custom property via `style` attribute |
| JavaScript `requestAnimationFrame` loop | Runs on main thread, blocks other JS. CSS animations run on the compositor thread. For simple pulse effects, JS offers no benefit and worse performance. | CSS `@keyframes` with `animation-iteration-count: infinite` |

## Stack Patterns by Variant

**If the hero image loads very fast (cached / local):**
- The `onLoad` fires almost synchronously after mount
- The text animation starts with no perceptible delay
- This is the happy path for repeat visitors and SPA navigation

**If the hero image loads slowly (cold load, slow network):**
- `placeholder="blur"` shows immediately (blur data is inlined in HTML)
- Text remains hidden (`opacity: 0`) until real image arrives
- When `onLoad` fires, text fades in on top of the now-visible image
- The glow pulse starts simultaneously (or with a short additional delay for sequence)

**If user prefers reduced motion:**
- All animations are suppressed via `@media (prefers-reduced-motion: reduce)`
- Text is visible immediately (`opacity: 1`)
- Glow overlays show at static 50% opacity (ambient presence without motion)

**If you later want more complex animation choreography:**
- Upgrade to Framer Motion `AnimatePresence` for exit animations
- Use `motion.div` with `variants` for orchestrated sequences
- This is a future consideration, not needed for ambient glow + synced fade-in

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.1.6 | `Image` `onLoad` prop | Available since Next.js 13. `preload` prop available since Next.js 16.0.0. `priority` deprecated in 16 (use `preload`). |
| next@16.1.6 | `Image` `ref` prop | Available since Next.js 13.0.6. Not needed for this approach but available as fallback. |
| react@19.2.4 | Ref cleanup callbacks | React 19 supports cleanup return from ref callbacks. Useful if later adding IntersectionObserver to rune glow elements. |
| tailwindcss@4.1.18 | `@theme` directive, `@property` | Tailwind v4 uses `@property` internally for its own custom properties. Custom `@property` rules in `globals.css` work alongside Tailwind's. |
| CSS `@property` | All major browsers | Baseline 2024. ~96% global support. Chrome 85+, Firefox 128+, Safari 15.4+. |
| CSS `@keyframes` | All browsers | Universal support. No concerns. |
| CSS custom properties in `calc()` | All major browsers | Baseline. ~97% global support. |

## Sources

- [Next.js Image Component API Reference (official docs)](https://nextjs.org/docs/app/api-reference/components/image) -- verified `onLoad`, `ref`, `preload`, `placeholder` props and their behavior. **HIGH confidence.**
- [TkDodo: Ref Callbacks, React 19 and the Compiler](https://tkdodo.eu/blog/ref-callbacks-react-19-and-the-compiler) -- verified React 19 ref cleanup callback pattern. **HIGH confidence.**
- [web.dev: @property baseline support](https://web.dev/blog/at-property-baseline) -- verified `@property` is Baseline 2024. **HIGH confidence.**
- [CSS-Tricks: Staggered Animations with CSS Custom Properties](https://cloudfour.com/thinks/staggered-animations-with-css-custom-properties/) -- verified inline custom property stagger pattern. **HIGH confidence.**
- [SitePoint: CSS Box Shadow Animation Performance](https://www.sitepoint.com/css-box-shadow-animation-performance/) -- verified box-shadow triggers full repaints. **HIGH confidence.**
- [Tobias Ahlin: Animate box-shadow with smooth performance](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) -- verified pseudo-element opacity technique for shadow-like effects. **HIGH confidence.**
- [web.dev: High-performance CSS animations](https://web.dev/articles/animations-guide) -- verified `opacity` and `transform` are compositor-only properties. **HIGH confidence.**
- [caniuse: sibling-count/sibling-index](https://caniuse.com/wf-sibling-count) -- verified 70% support, no Firefox. **HIGH confidence.**
- [Next.js GitHub Discussion #18386](https://github.com/vercel/next.js/discussions/18386) -- community patterns for image load detection. **MEDIUM confidence** (community discussion, not official docs).
- [MDN: animation-play-state](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-play-state) -- verified paused/running behavior. **HIGH confidence.**
- [MDN: @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style) -- verified it applies to transitions only, not keyframe animations. **HIGH confidence.**

---
*Stack research for: Hero animation synchronization and CSS glow effects*
*Researched: 2026-02-08*
