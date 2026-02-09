# Pitfalls Research

**Domain:** Hero animation sync and CSS glow effects (Next.js Image + CSS animations)
**Researched:** 2026-02-08
**Confidence:** HIGH (verified against Next.js official docs, MDN, and community issue trackers)

## Critical Pitfalls

### Pitfall 1: onLoad Never Fires for Cached / bfcache-Restored Images

**What goes wrong:**
The `onLoad` callback on `next/image` does not fire when the browser serves the image from disk cache or restores the page from bfcache (back/forward cache). The hero text animation is gated on `onLoad`, so the title stays at `opacity: 0` forever -- the user sees a blank hero. This is the single most reported issue with animation-gated-on-onLoad patterns in Next.js (see [vercel/next.js#20368](https://github.com/vercel/next.js/issues/20368), [Discussion #18386](https://github.com/vercel/next.js/discussions/18386)).

**Why it happens:**
React binds the `onLoad` event handler after hydration. If the `<img>` element has already `complete === true` (cached image, bfcache restore, fast network on a preloaded asset), the native `load` event has already fired before React attaches its listener. The handler simply never runs. The `preload` prop on the current hero Image makes this more likely because the browser aggressively fetches the image during HTML parsing -- before React hydration.

**How to avoid:**
Use a **dual-path detection** pattern in a `useEffect`:

```typescript
const imgRef = useRef<HTMLImageElement>(null)
const [loaded, setLoaded] = useState(false)

// Path 1: onLoad fires for non-cached images
const handleLoad = () => setLoaded(true)

// Path 2: useEffect catches already-complete images
useEffect(() => {
  if (imgRef.current?.complete) setLoaded(true)
}, [])
```

Pass both `ref={imgRef}` and `onLoad={handleLoad}` to the Image component. The `useEffect` runs after mount and catches any image that completed before React attached listeners. This handles disk cache, bfcache, and preloaded-asset scenarios.

**Warning signs:**
- Hero text invisible after pressing the browser back button
- Hero text invisible on refresh (especially with fast local cache)
- Works perfectly in dev (slower loads) but breaks in production (fast CDN + cache)
- Lighthouse shows LCP painted but hero text never appears

**Phase to address:**
Phase 1 (Image load detection) -- this must be solved before any animation gating logic is added.

---

### Pitfall 2: Converting Hero to Client Component Breaks Static Optimization Unexpectedly

**What goes wrong:**
Adding `'use client'` to the hero to support `onLoad` and `useState` converts the entire hero component tree into a client component. If not done carefully, this pulls the static import of `heroImage` (which provides the `blurDataURL` at build time) into the client bundle, increasing JS payload. Worse, developers sometimes accidentally move metadata exports or other server-only logic into the client boundary.

**Why it happens:**
The `'use client'` directive marks the file and all its imports as part of the client module graph. The current hero is a server component that statically imports `heroImage` from `public/images/hero.webp` -- Velite/Next.js generates the blur placeholder at build time and embeds it in the module. When this file becomes a client component, the static import metadata (width, height, blurDataURL) still works, but the import chain now ships to the client. If other server-only utilities get imported into the same file, they will error or bloat the bundle.

**How to avoid:**
Keep the client boundary as narrow as possible. Two proven patterns:

1. **Thin client wrapper:** Create a `HeroClient` component that only handles the `onLoad` state and animation classes. The parent server component owns layout, the Image import, and the scrim overlay. Pass `heroImage` as a prop.

2. **Single-file with clean imports:** If keeping it in one file, ensure only browser-safe imports exist. The static image import is fine in a client component (Next.js handles it), but verify no server utilities leak in.

Verify the client bundle size before/after with `next build --debug` or the bundle analyzer.

**Warning signs:**
- Build warnings about server-only modules in client components
- Unexpected increase in client JS bundle size for the home page
- `metadata` export in the same file as `'use client'` (will silently fail -- metadata must be in a server component)

**Phase to address:**
Phase 1 (Component architecture) -- decide the client/server boundary before writing any animation code.

---

### Pitfall 3: Animation Plays Before Image Is Visible (Race Condition)

**What goes wrong:**
The CSS `fadeInUp` animation fires on component mount (via `.animate-on-load` class), but the actual image may not be decoded and painted yet. Users see the title text animate upward over a blank/blurred background, then the image pops in a moment later. During client-side navigation (Next.js soft nav), this race condition is worse because the component mounts, the animation plays immediately, but the image fetch hasn't even started.

**Why it happens:**
CSS `animation` triggers on element insertion into the DOM, which happens at mount time. The `placeholder="blur"` shows a low-res blurDataURL instantly, but the full image decode happens asynchronously. On slow connections or during client-side navigation, there is a visible gap between "animation complete" and "full image painted."

**How to avoid:**
Gate the animation on image load state, not on mount:

1. Start the text overlay with `opacity: 0` (no animation class applied).
2. When `loaded` state becomes `true` (from the dual-path detection in Pitfall 1), apply the animation class.
3. For `prefers-reduced-motion: reduce`, skip the animation entirely and render at `opacity: 1` immediately.

The blur placeholder provides an acceptable visual during the gap, so gating only the text animation (not the entire hero visibility) avoids a blank section.

**Warning signs:**
- Text animates in over a gray/blurred rectangle on throttled network in DevTools
- Animation looks fine on fast connections but janky on 3G simulation
- Client-side navigation (click Home in nav) shows text before image

**Phase to address:**
Phase 1 (Animation sync logic) -- core requirement of the milestone.

---

### Pitfall 4: Staggered CSS Glow Pulses Cause Mobile GPU Memory Exhaustion

**What goes wrong:**
Each CSS-animated glow overlay (radial gradient pseudo-element with pulsing opacity/scale) creates a separate GPU composite layer. With multiple rune-position glows pulsing on staggered `animation-delay` values, mobile browsers allocate excessive GPU memory. On constrained devices (older iPhones, budget Android), this causes frame drops, visual glitches, or in extreme cases browser tab crashes.

**Why it happens:**
Animated `opacity` and `transform` properties trigger GPU compositing -- which is normally good for performance. But each independently animated element becomes its own compositing layer, consuming texture memory proportional to its pixel area. Full-viewport radial gradient overlays are large-area layers. Three to five of them running simultaneously can consume 10-30MB of GPU memory on a mobile device.

**How to avoid:**
- **Limit to 3-4 glow layers maximum.** Each one is full- or near-full-viewport.
- **Use a single animated layer** with multiple radial gradients in one `background` property rather than multiple overlapping `<div>` elements. Multiple backgrounds on one element share a single composite layer.
- **Keep blur radius under 20px** for any `filter: blur()` or `box-shadow` glow effects -- GPU workload scales exponentially with blur radius.
- **Avoid `will-change` in CSS.** Only add it programmatically via JS immediately before animation starts, and remove it after. Permanent `will-change` in stylesheets forces the browser to maintain composite layers indefinitely.
- **Test on a real low-end device** (or Chrome DevTools > Rendering > "Emulate CSS media feature prefers-reduced-motion" + throttle CPU 4x).

**Warning signs:**
- Chrome DevTools > Layers panel shows 5+ composite layers for the hero section
- Chrome DevTools > Performance tab shows "Composite Layers" taking > 2ms per frame
- Mobile Safari shows visual artifacts (black rectangles, flickering)
- Android Chrome shows "Aw, Snap!" on budget devices

**Phase to address:**
Phase 2 (Glow effects implementation) -- validate composite layer count during development, not after.

---

### Pitfall 5: prefers-reduced-motion Handled Inconsistently Between CSS and JS

**What goes wrong:**
The existing CSS handles `prefers-reduced-motion: reduce` by removing animation with `!important`. But when JS state gates the animation (the new `loaded` state pattern), the JS path and CSS path can disagree. Example: CSS says "no animation, opacity: 1" but JS state says `loaded === false` so the element stays at `opacity: 0`. The user who prefers reduced motion sees nothing.

**Why it happens:**
Two independent systems (CSS media queries and React state) both influence visibility. The CSS `prefers-reduced-motion` rule sets `opacity: 1 !important`, which should override, but if the JS uses inline styles or a non-animation class like `opacity-0` (Tailwind utility), CSS specificity wars begin. The `!important` in the media query might win for the animation property but lose for an inline `style={{ opacity: 0 }}`.

**How to avoid:**
Detect the motion preference in JS as well (the existing `ScrollReveal` component already does this -- follow the same pattern):

```typescript
useEffect(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (mq.matches) setLoaded(true) // Skip waiting for image, show immediately
}, [])
```

This ensures the JS state and CSS state agree: reduced-motion users see content immediately without waiting for image load or animation.

**Warning signs:**
- Toggle "Reduce motion" in OS settings -- hero text should appear instantly, not be stuck invisible
- Automated accessibility tests (axe-core) won't catch this -- manual testing required
- The `ScrollReveal` component already handles this correctly; inconsistency between components is the signal

**Phase to address:**
Phase 1 (Animation sync logic) -- must be implemented alongside the load-gated animation, not as an afterthought.

---

### Pitfall 6: Radial Gradient Glow Shows Visible Color Banding

**What goes wrong:**
CSS `radial-gradient()` with a glow effect (transparent to colored to transparent) displays visible banding -- concentric rings of stepped color rather than a smooth gradient. This is especially noticeable on 8-bit displays (most consumer monitors) and when the gradient spans a large viewport area with subtle color transitions.

**Why it happens:**
8-bit-per-channel color depth gives only 256 steps per channel. A subtle glow that transitions from `rgba(79,191,191,0.0)` to `rgba(79,191,191,0.15)` over hundreds of pixels has fewer than 40 distinct color values to distribute across those pixels. The result is visible "stairstepping."

**How to avoid:**
- **Add a subtle noise texture overlay** (a tiny 100x100 PNG of barely-visible noise at ~2% opacity) to break up banding perceptually. This is the industry-standard solution used by film VFX.
- **Use multiple color stops** with intermediate opacity values to create smoother transitions.
- **Keep glow opacity modest** (peak around 0.1-0.2) -- higher contrast gradients band less visibly than ultra-subtle ones.
- **Test on a standard sRGB monitor**, not just a wide-gamut display (which may mask banding).

**Warning signs:**
- Visible concentric rings in the glow, especially on solid-color backgrounds
- More obvious on dark or uniform image regions
- Screenshot the hero and zoom 200% -- banding will be clearly visible if present

**Phase to address:**
Phase 2 (Glow effects implementation) -- address during initial CSS authoring, not as a polish step.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using inline `style` for glow gradients instead of CSS classes | Fast iteration, easy to tweak values | Bypasses Tailwind design system, no prefers-reduced-motion integration, harder to maintain | During prototyping only -- move to CSS classes before merge |
| Putting all animation logic in the hero component | Single file, easy to understand | Duplicates patterns already in `ScrollReveal`; if animation timing changes, two places to update | Never -- extract a shared hook (`useImageLoaded`) from the start |
| Skipping the `img.complete` check and relying solely on `onLoad` | Simpler code, works in dev | Breaks on cached images in production (Pitfall 1) | Never |
| Using `will-change: transform, opacity` permanently in CSS | Slightly smoother initial animation frame | Permanent GPU memory allocation for all hero layers, even when not animating | Never -- add/remove via JS around animation lifecycle |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Animating `background` (gradient) instead of `opacity` on glow layers | Dropped frames, janky pulse | Animate only `opacity` and `transform` on glow elements; keep gradient static | Immediately on 2x CPU throttle in DevTools |
| Large `filter: blur()` radius on glow pseudo-elements | GPU paint time > 16ms, stuttering on scroll | Keep blur under 20px; prefer `radial-gradient` for soft edges instead of blur filter | On any mobile device with blur > 30px |
| Multiple full-viewport composite layers | High GPU memory, mobile crashes | Combine multiple gradients into one element's `background` property | At 4-5+ animated layers on mobile (budget Android ~3 layers safe) |
| Not using `animation-fill-mode: forwards` on fade-in | Element flashes visible, then animates, then settles | Always pair opacity-0 initial state with `forwards` fill mode | Immediately visible as a flash on page load |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Glow pulse animation is too fast or too pronounced | Draws eye away from title text; can trigger vestibular discomfort | Keep pulse period >= 3 seconds, peak opacity change <= 0.1, and respect `prefers-reduced-motion` |
| Hero text animation plays every client-side navigation | Repetitive animation annoys returning visitors | Consider: animate only on first visit (sessionStorage flag) or only on full page load (not soft nav) |
| Animation blocks content visibility for too long | Users on slow connections see blank hero for seconds | Cap maximum wait time (e.g., 2-second timeout fallback that shows text even if image hasn't loaded) |
| Glow colors clash with hero image in certain regions | Visual noise instead of atmospheric enhancement | Position glows at known image regions (dark areas of the runic hero image), not arbitrary positions |

## "Looks Done But Isn't" Checklist

- [ ] **Image load detection:** Test with DevTools > Network > "Disable cache" OFF and navigate back to home via browser back button -- hero text must appear
- [ ] **prefers-reduced-motion:** Toggle OS setting -- all animations must stop, all content must be visible (not stuck at opacity: 0)
- [ ] **Client-side navigation:** Click a nav link away, then click Home -- animation and glows must work correctly (not stuck, not double-playing)
- [ ] **Mobile GPU memory:** Check Chrome DevTools > Layers panel -- hero should have <= 3 composite layers total for glow effects
- [ ] **Color banding:** Screenshot hero on an 8-bit sRGB monitor at 1080p, zoom to 200% -- gradient transitions should not show visible steps
- [ ] **Layout shift (CLS):** The animation must not cause any layout shift -- verify `opacity` and `transform` only, never `height`/`margin`/`padding` changes
- [ ] **Timeout fallback:** Throttle network to Slow 3G -- hero text must appear within 2-3 seconds regardless of image load state
- [ ] **Bundle size:** Compare `next build` output for home page JS before and after -- increase should be minimal (< 1KB gzipped for the client component conversion)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| onLoad never fires (Pitfall 1) | LOW | Add `useEffect` with `img.complete` check -- 5-line fix, no architecture change |
| Client component boundary too wide (Pitfall 2) | MEDIUM | Extract thin client wrapper, restructure imports -- may require splitting file |
| Animation race condition (Pitfall 3) | LOW | Gate animation class on `loaded` state instead of mount -- CSS class swap |
| GPU memory exhaustion (Pitfall 4) | MEDIUM | Consolidate multiple gradient divs into single `background` -- requires reworking glow markup |
| Motion preference inconsistency (Pitfall 5) | LOW | Add `matchMedia` check in `useEffect` -- mirrors existing `ScrollReveal` pattern |
| Gradient banding (Pitfall 6) | LOW | Add noise texture overlay and intermediate color stops -- CSS-only fix |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| onLoad never fires for cached images | Phase 1: Image load detection | Back-button test with cache enabled; `img.complete` check present in code |
| Client component boundary too wide | Phase 1: Component architecture | Bundle size delta < 1KB gzipped; no server-only imports in client file |
| Animation race condition | Phase 1: Animation sync | Throttled network test; animation gated on `loaded` state, not mount |
| GPU memory exhaustion on mobile | Phase 2: Glow implementation | Chrome Layers panel shows <= 3 hero composite layers |
| Motion preference inconsistency | Phase 1: Animation sync | OS reduced-motion toggle shows all content immediately |
| Gradient color banding | Phase 2: Glow implementation | 200% zoom screenshot on 8-bit display shows smooth gradients |

## Sources

- [Next.js Image Component docs (App Router)](https://nextjs.org/docs/app/api-reference/components/image) -- onLoad behavior, `'use client'` requirement, onLoadingComplete deprecation (HIGH confidence)
- [vercel/next.js#20368: onLoad event work incorrect](https://github.com/vercel/next.js/issues/20368) -- core issue with onLoad and cached images (HIGH confidence)
- [vercel/next.js Discussion #18386: ref, complete, loaded event](https://github.com/vercel/next.js/discussions/18386) -- `img.complete` workaround pattern (HIGH confidence)
- [vercel/next.js Discussion #54756: onLoad not triggering](https://github.com/vercel/next.js/discussions/54756) -- confirms issue persists in recent versions (MEDIUM confidence)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) -- media query behavior and accessibility requirements (HIGH confidence)
- [Smashing Magazine: CSS GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/) -- composite layer memory, mobile GPU constraints (HIGH confidence)
- [CSS-Tricks: box-shadow vs drop-shadow](https://css-tricks.com/breaking-css-box-shadow-vs-drop-shadow/) -- performance characteristics of shadow/glow approaches (MEDIUM confidence)
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) -- overuse pitfalls, memory implications (HIGH confidence)
- [MDN: animation-fill-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode) -- forwards fill mode for opacity animations (HIGH confidence)
- [Pope Tech: Accessible animation and movement](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) -- reduced-motion best practices (MEDIUM confidence)
- [Hoverify: CSS gradient performance](https://tryhoverify.com/blog/i-wish-i-had-known-this-sooner-about-css-gradient-performance/) -- gradient rendering cost, banding (MEDIUM confidence)
- [Back/Forward Cache Aware Next.js (Medium)](https://medium.com/better-dev-nextjs-react/back-forward-cache-aware-next-js-03535b6c5fcd) -- bfcache event behavior with Next.js (MEDIUM confidence)

---
*Pitfalls research for: Hero animation sync and CSS glow effects*
*Researched: 2026-02-08*
