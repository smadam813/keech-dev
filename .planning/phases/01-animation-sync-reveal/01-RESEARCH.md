# Phase 1: Animation Sync & Reveal - Research

**Researched:** 2026-02-08
**Domain:** CSS animation choreography, image load detection, reduced-motion accessibility
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two-beat sequence: background image resolves first, brief pause, then text fades up
- Text enters via fade-up (opacity + upward slide)
- Only two elements in the sequence: background image and "keech.dev" text -- no other hero elements animate
- Overall vibe: balanced -- not cinematic-slow, not snappy-fast (~800ms-1.2s total sequence)
- No visible indicator when animations are skipped -- silently skip, clean UX

### Claude's Discretion
- Background reveal technique (blur-to-sharp vs opacity fade vs other)
- Pause duration between the two beats
- Pre-load state appearance
- Layout shift prevention approach
- Slow connection / loading indicator handling
- Cached visit behavior (animate or skip)
- Text easing curve and overshoot
- Text travel distance
- Reduced-motion detection scope (CSS only vs CSS + JS)
- Reduced-motion presentation (instant vs simplified fade)
- Live reduced-motion toggle response

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Summary

The hero component (`src/components/hero.tsx`) is currently a **server component** that renders a Next.js `<Image>` with `placeholder="blur"` and a text overlay with the CSS class `animate-on-load`. The bug is that the text animation fires immediately via CSS (`animation: fadeInUp 0.6s ease-out forwards`) regardless of whether the background image has loaded. On slow connections, users see the text animate over the bare blur placeholder or dusty-rose background.

The fix requires converting the hero to a **client component** with load-gated state management. The Next.js Image component (v16.1.6) renders a bare `<img>` element (no wrapper div), forwards refs directly to it, and fires `onLoad` after `img.decode()` resolves. The blur placeholder is implemented as an inline `background-image` style (a tiny base64 SVG) on the same `<img>` element, removed when `blurComplete` transitions to `true`. This means we cannot use Next.js's built-in blur placeholder as the "blur" beat of the reveal -- it disappears instantly once the image loads. We need our own CSS-driven blur-to-sharp transition overlaying or replacing that behavior.

**Primary recommendation:** Convert hero to a `'use client'` component. Use a `ref` + `onLoad` dual-path pattern to detect image readiness (handles both fresh loads and cached/bfcache scenarios). Drive a two-step CSS transition sequence via state: (1) remove a CSS `filter: blur()` overlay on the background with a smooth transition, (2) after a brief delay, trigger the text fade-up animation via a CSS class toggle. Respect `prefers-reduced-motion` with both CSS media queries (existing pattern) and a JS `matchMedia` listener (needed for Phase 2's JS-driven glow animations and live toggle support).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Image | 16.1.6 | Image optimization, static import blur placeholder | Already in use; renders bare `<img>`, forwards ref, fires onLoad after decode |
| React 19 | 19.2.4 | State management, refs, effects | Already in use; callback ref cleanup in React 19 simplifies patterns |
| CSS transitions | N/A | Blur-to-sharp + fade-up animation | Zero-library codebase precedent; CSS transitions are GPU-composited |
| Tailwind CSS v4 | 4.1.18 | Utility classes, custom properties | Already in use; CSS-first config in globals.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge (cn) | 2.1.1 / 3.4.0 | Conditional class composition | Already available via `@/lib/utils`; use for animation state classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS transitions | Framer Motion / GSAP | 20-40KB bundle for a single hero animation; explicitly out of scope per REQUIREMENTS.md |
| Manual ref + onLoad | React Suspense for images | Not yet stable for this use case; adds complexity for a single image |
| CSS filter: blur() transition | Opacity crossfade between two layers | Simpler but doesn't match the "blur-to-sharp" requirement; less visually polished |

**Installation:**
No new packages needed. Everything required is already installed.

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   └── hero.tsx              # Convert to 'use client', add load-gating + reveal logic
├── app/
│   ├── page.tsx              # No changes needed (already just renders <Hero />)
│   └── globals.css           # Add new keyframes + animation classes for reveal sequence
```

No new files needed. The changes are contained to `hero.tsx` (logic) and `globals.css` (animation CSS).

### Pattern 1: Dual-Path Image Load Detection
**What:** Detect image readiness via both `onLoad` callback and `img.complete` property check, covering fresh loads and cached/bfcache restores.
**When to use:** When animation timing depends on image availability and the page may be restored from browser cache.
**Example:**
```typescript
// Source: MDN HTMLImageElement.complete + Next.js Image onLoad docs
const imgRef = useRef<HTMLImageElement>(null)
const [imageLoaded, setImageLoaded] = useState(false)

// Path 1: onLoad fires for fresh loads (after img.decode())
const handleLoad = useCallback(() => {
  setImageLoaded(true)
}, [])

// Path 2: Check img.complete on mount for cached/bfcache images
useEffect(() => {
  if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
    setImageLoaded(true)
  }
}, [])
```

**Why dual-path:** When an image is already cached, `onLoad` may fire synchronously before React hydration, causing the event to be missed. The `img.complete` check in `useEffect` catches this case. For bfcache restores, the entire DOM snapshot (including `img.complete = true`) is preserved in memory, so the `useEffect` path handles this too. The `naturalWidth > 0` guard ensures we don't treat broken images as loaded.

### Pattern 2: CSS-Driven Two-Beat Reveal Sequence
**What:** Use state-driven CSS classes to choreograph the blur-to-sharp background transition followed by the text fade-up.
**When to use:** When animation sequencing depends on runtime conditions (image load) but the animations themselves are pure CSS.
**Example:**
```typescript
// State drives CSS class application
const [revealStage, setRevealStage] = useState<'loading' | 'bg-reveal' | 'text-reveal'>('loading')

useEffect(() => {
  if (!imageLoaded) return

  // Beat 1: Background blur-to-sharp (start immediately)
  setRevealStage('bg-reveal')

  // Beat 2: Text fade-up (after background transition + pause)
  const timer = setTimeout(() => {
    setRevealStage('text-reveal')
  }, 550) // ~350ms blur transition + ~200ms pause

  return () => clearTimeout(timer)
}, [imageLoaded])
```

### Pattern 3: Reduced-Motion with CSS + JS Dual Detection
**What:** Use CSS `@media (prefers-reduced-motion: reduce)` for CSS animations AND a JS `matchMedia` listener for JavaScript-driven timing logic.
**When to use:** When the component has both CSS animations and JS-driven sequencing (setTimeout delays). Also needed for Phase 2's glow effects.
**Example:**
```typescript
// Source: web.dev/articles/prefers-reduced-motion
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

useEffect(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  setPrefersReducedMotion(mq.matches)

  const handler = () => setPrefersReducedMotion(mq.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}, [])
```

**Live toggle behavior:** When reduced motion is enabled mid-session, CSS animations are instantly killed by the existing `@media` block in `globals.css`. The JS listener updates state, which causes React to skip the setTimeout delay and show everything immediately. When reduced motion is disabled mid-session, the page is already in its final state, so nothing re-animates (which is correct -- RVEAL-02 says the reveal plays once per navigation).

### Pattern 4: Once-Per-Navigation Guard (RVEAL-02)
**What:** Ensure the reveal sequence plays only once per navigation to the home page, not on re-renders or tab switches.
**When to use:** When animation should not replay on React re-renders, visibility changes, or HMR in development.
**Example:**
```typescript
// useRef persists across re-renders but resets on navigation (component unmount/remount)
const hasPlayedRef = useRef(false)

useEffect(() => {
  if (!imageLoaded || hasPlayedRef.current) return
  hasPlayedRef.current = true
  // ... trigger reveal sequence
}, [imageLoaded])
```

**Why useRef, not useState:** A ref doesn't trigger re-renders. The guard only needs to prevent replay -- it doesn't need to update the UI. On client-side navigation away and back, React unmounts and remounts the component, resetting the ref to `false`, which allows the animation to play again on the new navigation.

### Anti-Patterns to Avoid
- **Animating `filter: blur()` continuously:** Only use blur as a one-time transition (blur-to-sharp). Continuous blur animation causes severe performance issues, especially on Firefox and Safari. The Chrome DevTools blog explicitly warns against this. A single transition from ~10-15px to 0 is fine.
- **Using `onLoadingComplete` instead of `onLoad`:** The `onLoadingComplete` prop is deprecated in Next.js 14+. Use `onLoad` instead.
- **Using `priority` instead of `preload`:** The `priority` prop is deprecated in Next.js 16. The current hero already correctly uses `preload` (which inserts a `<link>` preload in `<head>`).
- **Relying solely on `onLoad` for cached images:** If the image is already in browser cache, `onLoad` may fire before React hydration completes, causing the event to be swallowed. Always combine with an `img.complete` check in `useEffect`.
- **Using `will-change` on the blur element permanently:** Apply `will-change: filter` only during the transition, then remove it. Permanent `will-change` wastes GPU memory.
- **Causing layout shift with `transform: scale()`:** The blur-up technique sometimes uses `scale(1.1)` to hide blur edges. With `fill` layout and `overflow-hidden` already on the hero section, this is unnecessary and could cause CLS if not handled carefully.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image load detection | Custom image preloader / promise wrapper | `onLoad` callback + `img.complete` check on Next.js Image | Next.js Image already wraps `img.decode()` in its onLoad; dual-path covers all cache scenarios |
| Blur placeholder | Custom low-res image overlay with CSS blur | Next.js `placeholder="blur"` for the pre-load state + CSS `filter: blur()` for the reveal transition | Static import auto-generates blurDataURL; we add our own CSS blur layer for the animated reveal |
| Animation sequencing | requestAnimationFrame chains or WAAPI orchestration | CSS transitions + a single setTimeout | Two-beat sequence is simple enough that a timeout between state changes is clearer than a full orchestrator |
| Reduced-motion detection | Custom OS preference polling | `window.matchMedia('(prefers-reduced-motion: reduce)')` + CSS media query | Standard web platform API; matches existing codebase pattern in `scroll-reveal.tsx` |

**Key insight:** The codebase has zero animation dependencies and the requirements explicitly exclude Framer Motion / GSAP. This phase adds zero new npm dependencies. Everything is achievable with CSS transitions, a `useState` + `useEffect` pattern, and standard web APIs.

## Common Pitfalls

### Pitfall 1: onLoad Not Firing for Cached Images
**What goes wrong:** Image is in browser HTTP cache. Browser loads it synchronously. React hasn't attached the event listener yet. `onLoad` never fires. Image loads but text animation never plays.
**Why it happens:** React hydration is asynchronous. For very fast loads (cached images), the native `load` event can fire before React attaches the synthetic event handler.
**How to avoid:** Always check `imgRef.current.complete` in a `useEffect` that runs after mount. If the image is already complete, set state immediately.
**Warning signs:** Animation works on first visit but breaks on page refresh or repeat visits.

### Pitfall 2: Next.js Blur Placeholder Conflicts with Custom Blur
**What goes wrong:** Next.js `placeholder="blur"` applies an inline `background-image` style with a blurry SVG. When the image loads, Next.js removes this instantly (no transition). If we also add our own CSS `filter: blur()`, we get a double-blur initially and then an awkward pop when the background-image is removed.
**Why it happens:** Two independent blur systems fighting for control of the visual state.
**How to avoid:** Two options: (A) Keep `placeholder="blur"` for the pre-load state (shows something immediately) and add CSS `filter: blur()` only on the real image for the reveal transition -- the background-image blur disappears when the real image paints, and our filter blur transitions smoothly to 0. (B) Remove `placeholder="blur"` entirely and manage the full visual state ourselves. Option A is recommended because it gives users something to see instantly while the image loads, with no flash of empty space.
**Warning signs:** Brief flash of a sharper-than-expected image between placeholder removal and blur transition start.

### Pitfall 3: Layout Shift from Animation Properties
**What goes wrong:** CLS > 0 during the reveal sequence. Lighthouse/PageSpeed flags the hero section.
**Why it happens:** Using properties that affect layout (width, height, top, left, padding, margin) in the animation, or using `transform: scale()` on an element that doesn't have `overflow: hidden`.
**How to avoid:** Only animate `filter`, `opacity`, and `transform: translateY()`. The hero section already has `overflow-hidden`. The `<Image fill>` pattern already reserves full viewport space. Don't change any sizing properties.
**Warning signs:** Content below the hero jumping during animation. Lighthouse CLS > 0.

### Pitfall 4: Safari GPU Promotion for filter: blur()
**What goes wrong:** Blur transition is janky on Safari (macOS/iOS).
**Why it happens:** Safari doesn't auto-promote `filter` animations to GPU compositing like Chrome does. Without a hint, Safari uses the CPU for blur rendering.
**How to avoid:** Add `transform: translateZ(0)` or `will-change: filter` to the blurred element before the transition starts. Remove `will-change` after transition completes.
**Warning signs:** Smooth in Chrome, stuttery in Safari.

### Pitfall 5: Reveal Replaying on Tab Switch or React Re-render
**What goes wrong:** User switches tabs and comes back. The reveal replays. Or a parent re-render causes the hero to re-animate.
**Why it happens:** Component re-renders reset state if not guarded. `visibilitychange` events can trigger effects.
**How to avoid:** Use a `useRef` guard (`hasPlayedRef`) that persists across re-renders but resets on unmount (new navigation). Don't use `useState` for the guard because that triggers re-renders.
**Warning signs:** Animation plays multiple times per page visit.

### Pitfall 6: BFCache Restore Shows Intermediate Animation State
**What goes wrong:** User navigates away, then presses back. The page is restored from bfcache in its current DOM state, which might be mid-animation (blur partially resolved, text partially faded).
**Why it happens:** bfcache preserves the entire DOM snapshot including inline styles and animation states. If the snapshot was captured mid-transition, it restores mid-transition.
**How to avoid:** The `useRef` guard + `img.complete` check pattern handles this naturally. When restored from bfcache, the component's state is preserved (imageLoaded = true, hasPlayed = true), so no re-animation occurs. The CSS transitions are already in their final state because bfcache captures the completed state. If needed, add a `pageshow` event listener as a safety net.
**Warning signs:** Partial blur or partial fade visible when pressing browser back button.

## Code Examples

Verified patterns from official sources:

### Next.js Image with ref and onLoad (Client Component)
```typescript
// Source: Next.js docs (nextjs.org/docs/app/api-reference/components/image)
// Next.js 16 Image renders a bare <img>, forwards ref directly
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import heroImage from '../../public/images/hero.webp'

export function Hero() {
  const imgRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Cached/bfcache path: check on mount
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [])

  return (
    <Image
      ref={imgRef}
      src={heroImage}
      onLoad={handleLoad}
      placeholder="blur"
      // ... other props
    />
  )
}
```

### CSS Blur-to-Sharp Transition with Safari GPU Hint
```css
/* Source: MDN filter docs, Chrome DevTools blog on animated blur */
/* Apply to the hero section or an overlay wrapping the image */
.hero-bg {
  filter: blur(12px);
  transform: translateZ(0); /* Safari GPU promotion */
  transition: filter 350ms ease-out;
}

.hero-bg--revealed {
  filter: blur(0px);
}
```

### Text Fade-Up Animation (New Keyframe)
```css
/* Source: Existing codebase pattern (globals.css fadeInUp) */
@keyframes heroTextReveal {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-text--hidden {
  opacity: 0;
}

.hero-text--reveal {
  animation: heroTextReveal 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

### Reduced-Motion JS Detection with Live Toggle
```typescript
// Source: web.dev/articles/prefers-reduced-motion
useEffect(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  setPrefersReducedMotion(mq.matches)

  const handler = () => setPrefersReducedMotion(mq.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}, [])
```

### Reduced-Motion CSS (Extend Existing Block)
```css
/* Source: Existing codebase (globals.css lines 90-101) */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up,
  .animate-on-load,
  .hero-text--reveal {           /* NEW */
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .hero-bg {                     /* NEW */
    filter: none !important;
    transition: none !important;
  }

  .motion-reduce-safe {
    transition: none !important;
  }
}
```

## Discretion Recommendations

Based on the research, here are recommendations for each area marked as Claude's discretion:

### Background Reveal Technique: CSS `filter: blur()` Transition
**Recommendation:** Use `filter: blur(12px)` transitioning to `blur(0)` over 350ms with `ease-out`. This produces a clean "resolve from blur" effect that matches the requirement wording exactly ("background resolves from blur"). The 12px blur radius is well under the 20px performance threshold, and a single one-time transition (not continuous animation) is performant even on mobile. Add `transform: translateZ(0)` for Safari GPU compositing.

**Why not opacity fade:** Opacity fade looks like a "pop in" rather than a "resolve." The blur-to-sharp approach feels more like a camera focusing, which better matches the "polished and intentional" feel requested.

### Pause Duration Between Beats: 250ms
**Recommendation:** 250ms pause between background reveal completion and text fade-up start. This is within the 200-400ms range specified in RVEAL-01, and feels like a natural breath between the two beats without being sluggish. With 350ms for the blur transition and 250ms pause and 500ms for the text animation, the total is 1100ms, which is within the ~800ms-1.2s target.

### Pre-Load State Appearance: Next.js Blur Placeholder
**Recommendation:** Keep `placeholder="blur"` on the Next.js Image component. This auto-generates a tiny blurDataURL from the static import and shows it instantly as an inline background-image. On top of this, apply our own CSS `filter: blur(12px)` to the whole hero section. The result: users see a blurry version of the hero image immediately (zero empty/blank state), and when the real image loads, the blur smoothly resolves. The Next.js blur placeholder disappears silently under the real image before our CSS blur transition begins.

### Layout Shift Prevention: Existing Architecture Already Handles It
**Recommendation:** The current hero uses `min-h-[calc(100svh-4rem)]` with `<Image fill>` inside a relative container with `overflow-hidden`. This already reserves the full viewport height minus the header. No additional CLS prevention is needed as long as we only animate `filter`, `opacity`, and `transform` (none of which cause layout). Verify with Lighthouse after implementation.

### Slow Connection Handling: No Special Loading Indicator
**Recommendation:** On slow connections, users see the Next.js blur placeholder (a blurry version of the hero image) for longer. This looks intentional, not broken. No spinner, progress bar, or timeout fallback is needed. If the image takes more than ~5 seconds, the blur placeholder gracefully holds the space. The text remains hidden (opacity: 0) until the image loads, which prevents the "text over bare background" bug.

### Cached Visit Behavior: Always Animate
**Recommendation:** Always play the reveal sequence on navigation to the home page, even for cached images. For cached images, the `img.complete` check fires immediately on mount, so the blur-to-sharp transition starts almost instantly. The entire sequence completes in ~1.1 seconds which is fast enough that it doesn't feel like a delay on repeat visits. This matches RVEAL-02 ("plays once per navigation to Home") and feels more polished than skipping the animation entirely. The animation is short enough that it enhances rather than annoys.

### Text Easing Curve: `cubic-bezier(0.22, 1, 0.36, 1)` (Custom Ease-Out)
**Recommendation:** This is a slightly exaggerated ease-out curve (similar to "ease-out-expo" but gentler). The text decelerates smoothly into its final position with a confident landing. This matches the neobrutalist personality -- bold entrance, decisive stop. No overshoot (ease-out-back) since the neobrutalist style is angular and deliberate, not bouncy.

### Text Travel Distance: 24px
**Recommendation:** 24px translateY distance for the fade-up. At the hero's font sizes (text-6xl to text-9xl, roughly 60-128px), a 24px travel is noticeable but not dramatic. It's slightly more than the existing `animate-on-load` (which uses 20px) to give the hero text a bit more presence, but stays proportional. On mobile where the text is smaller (text-6xl = ~60px), 24px is about 40% of the font size, which reads well.

### Reduced-Motion Detection Scope: CSS + JS Dual Detection
**Recommendation:** Use both CSS `@media (prefers-reduced-motion: reduce)` AND a JavaScript `matchMedia` listener. The CSS media query handles all CSS animations (existing behavior, zero effort). The JS listener is needed because:
1. The reveal sequencing uses `setTimeout` (JS timing), which CSS media queries can't control
2. Phase 2 will add JS-driven glow animations that need the same JS-level detection
3. The existing `scroll-reveal.tsx` component already uses this exact JS pattern, so it's consistent

### Reduced-Motion Presentation: Instant -- Everything Visible Immediately
**Recommendation:** When `prefers-reduced-motion: reduce` is active, skip all animation. Show the background image without blur, show the text without fade-up. Everything is visible immediately at full opacity. No simplified animation (like a faster fade) because the spec says "minimize movement... preferably to the point where all non-essential movement is removed." A hero reveal is non-essential movement.

### Live Reduced-Motion Toggle Response: Respect Immediately
**Recommendation:** If a user enables reduced motion mid-session:
- CSS `@media` block instantly kills any in-flight CSS animations/transitions (browser handles this natively)
- JS `matchMedia` 'change' listener updates `prefersReducedMotion` state, which causes React to re-render with everything in its final visible state
- If the reveal hasn't played yet, skip it entirely and show everything
- If the reveal has already completed, no change needed (content is already visible)
- If the reveal is mid-sequence (rare edge case), the CSS media query kills the transitions immediately and the JS state update ensures the next render shows everything

This matches the existing `scroll-reveal.tsx` pattern.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `onLoadingComplete` prop | `onLoad` prop | Next.js 14 (2023) | `onLoadingComplete` deprecated; `onLoad` fires after `img.decode()` |
| `priority` prop | `preload` prop | Next.js 16 (2025) | `priority` deprecated for clarity; hero.tsx already uses `preload` |
| Wrapper `<div>` around `<img>` | Bare `<img>` element | Next.js 13+ | Image component renders bare `<img>`, forwards ref directly |
| CSS `@media prefers-reduced-motion` only | CSS + JS `matchMedia` with `addEventListener('change')` | Ongoing best practice | JS detection needed for programmatic animation timing |
| `addListener` / `removeListener` on MediaQueryList | `addEventListener` / `removeEventListener` | 2020+ | Old methods deprecated; modern pattern uses standard event listeners |

**Deprecated/outdated:**
- `onLoadingComplete`: Removed in favor of `onLoad` (Next.js 14+)
- `priority` prop: Replaced by `preload` prop (Next.js 16)
- `MediaQueryList.addListener()`: Replaced by `addEventListener('change', handler)` (standardized)

## Open Questions

1. **Next.js Image ref type in v16**
   - What we know: Docs say ref is forwarded to the `<img>` element. Source code confirms `forwardRef` with `useMergedRef`.
   - What's unclear: Whether `useRef<HTMLImageElement>` is the correct TypeScript type or if Next.js exports a custom ref type.
   - Recommendation: Use `useRef<HTMLImageElement>(null)` and verify during implementation. If TypeScript complains, check `@types/react` for the correct Image ref type.

2. **Exact blur placeholder removal timing vs onLoad timing**
   - What we know: Next.js removes the blur placeholder (`blurComplete = true`) inside the onLoad handler after `img.decode()`. Our `onLoad` callback fires at the same time.
   - What's unclear: Whether the blur placeholder removal is visually perceptible as a "pop" before our CSS blur transition can compensate.
   - Recommendation: Implement with CSS `filter: blur(12px)` on the section-level container (not the image itself) so the blur persists even after Next.js removes its placeholder. Test visually and adjust if needed.

3. **bfcache behavior with Next.js App Router client-side navigation**
   - What we know: Browser bfcache preserves entire DOM + JS state. `pageshow` event with `persisted=true` detects restoration. Next.js App Router uses its own soft navigation that may bypass bfcache.
   - What's unclear: Whether pressing browser back button to the home page triggers a bfcache restore or a Next.js client-side re-navigation (which would remount the component).
   - Recommendation: The `hasPlayedRef` + `img.complete` dual-path pattern handles both cases correctly. If bfcache restores, state is preserved (animation won't replay). If Next.js re-navigates, component remounts and animation plays fresh. Success criterion #2 is satisfied either way. Test with real browser back button during implementation.

## Sources

### Primary (HIGH confidence)
- [Next.js Image Component docs](https://nextjs.org/docs/app/api-reference/components/image) - onLoad, placeholder, preload, ref props
- [Next.js Image component source (GitHub)](https://github.com/vercel/next.js/blob/canary/packages/next/src/client/image-component.tsx) - Confirmed ref forwarding, bare `<img>` rendering
- [Next.js get-img-props source (GitHub)](https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/get-img-props.ts) - Confirmed blur placeholder as inline background-image SVG
- [MDN HTMLImageElement.complete](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) - complete property for cached image detection
- [MDN HTMLImageElement.decode()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode) - decode() method behavior
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) - Media feature specification
- [web.dev prefers-reduced-motion article](https://web.dev/articles/prefers-reduced-motion) - JS matchMedia pattern, live toggle, dual CSS+JS approach
- [web.dev bfcache article](https://web.dev/articles/bfcache) - DOM state preservation, pageshow event pattern

### Secondary (MEDIUM confidence)
- [Chrome DevTools blog: Animating a blur](https://developer.chrome.com/blog/animated-blur) - Performance implications of animated blur (applies to continuous animation, not one-time transitions)
- [web.dev CLS optimization](https://web.dev/articles/optimize-cls) - Only animate transform/opacity/filter for zero CLS
- [Michael Uloth: translateZ trick](https://michaeluloth.com/css-translate-z/) - Safari GPU promotion for filter animations

### Tertiary (LOW confidence)
- [Next.js Discussion #39029](https://github.com/vercel/next.js/discussions/39029) - Community patterns for blur placeholder animation (inconsistent solutions, no official recommendation)
- [meje.dev: Blur images onLoad](https://www.meje.dev/blog/nextjs-image-blur-on-load) - Community technique for state-driven blur (basic pattern verified against official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages; all patterns use existing dependencies and web platform APIs
- Architecture: HIGH - Client component conversion is straightforward; dual-path load detection is well-documented; CSS transitions for filter/opacity/transform are standard
- Pitfalls: HIGH - Cached image onLoad race condition is well-known; Safari GPU promotion is documented; CLS prevention with transform-only animations is established practice
- Discretion recommendations: MEDIUM - Timing values (350ms blur, 250ms pause, 500ms text) and easing curves are subjective; will need visual tuning during implementation

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stable domain, no fast-moving dependencies)
