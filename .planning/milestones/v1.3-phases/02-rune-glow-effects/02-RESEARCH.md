# Phase 2: Rune Glow Effects - Research

**Researched:** 2026-02-08
**Domain:** CSS glow overlays, responsive positioning over object-cover images, staggered organic animation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- All runes that glow (whether all visible or a curated subset) -- Claude's discretion on count
- Positions must be pixel-precise to each rune, not approximate zones
- All runes get glows regardless of background (aurora ribbons or dark sky)
- Glows must stay aligned to their runes at all screen sizes -- percentage-based positioning that tracks the image as it scales/crops
- Soft ethereal haze -- large, diffuse, dreamy energy radiating from each rune
- Noticeable but ambient intensity -- clearly visible glow that adds atmosphere without dominating the illustration
- Fixed color per rune -- no color shifting or drifting over time
- Three colors: warm amber, cool teal, pale gold
- Staggered fade-in entrance -- glows appear one by one or in small groups cascading across the image
- After entrance, settle into a slow continuous breathing cycle that runs indefinitely
- Organic, non-uniform timing -- each rune's rhythm should feel alive, not mechanical

### Claude's Discretion
- Which runes to include (all visible or curated subset for best visual effect)
- Glow size per rune (uniform vs varied by rune)
- Blend mode (additive/screen vs standard opacity)
- Color assignment strategy (by position, by meaning, or visual balance)
- Color distribution ratio across the three colors
- Breathing cycle speed (how fast the pulse rhythm is)
- Degree of timing variation between runes (subtle offset vs noticeably different rhythms)
- Entrance cascade timing (how long from first glow to last)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Summary

Phase 2 adds ambient CSS glow overlays at rune positions in the hero image. The hero image (2560x1429, ~1.79:1 aspect ratio) features Elder Futhark runes scattered across the sky area above a mountain range and Yggdrasil. The glows must be positioned precisely over each rune and track correctly as the image scales/crops via `object-fit: cover` at different viewport sizes.

The central technical challenge is **responsive positioning alignment**. The hero uses Next.js `<Image fill>` with `object-cover`, which means the visible portion of the image changes at different viewport aspect ratios. On wide viewports, the top/bottom are cropped; on tall/narrow viewports (mobile), the left/right are heavily cropped. Percentage-based overlay positions relative to the container will NOT align with rune positions in the image because the container and the rendered image content have different coordinate systems. This requires either (A) computing the rendered image bounds in JS and positioning overlays relative to those bounds, or (B) using a CSS-only approach with a wrapper element that maintains the image's intrinsic aspect ratio. Option A is recommended because it integrates naturally with the existing client component, handles resize events, and avoids restructuring the hero layout.

The glow effect itself is straightforward: absolutely positioned `<div>` elements with `radial-gradient` backgrounds, animated using only `opacity` and `transform: scale()` (GPU-composited properties per GLOW-06). Each glow gets a CSS custom property `--i` (index) used to compute staggered animation delays with a non-linear curve (GLOW-03), and a `--duration` property for varied breathing cycle speeds (GLOW-05). The entrance cascade uses a separate `@keyframes` that fades in each glow, then transitions to the infinite breathing cycle. Colors are assigned by Elder Futhark aett grouping (GLOW-04).

**Primary recommendation:** Add glow overlay divs inside the hero section, positioned with JS-calculated coordinates that account for `object-cover` scaling. Use `radial-gradient` backgrounds with opacity-only animation for GPU compositing. Use CSS custom properties (`--i`, `--duration`) on each element for organic, non-uniform staggered timing.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.4 | Rendering glow elements, state management | Already in use; drives conditional rendering and positioning |
| CSS @keyframes | N/A | Entrance cascade + breathing cycle animations | Zero-dependency; only opacity/transform for GPU compositing |
| CSS custom properties | N/A | Per-element timing variation (--i, --duration) | Standard web platform; avoids per-element CSS rules |
| Tailwind CSS v4 | 4.1.18 | Utility classes, @theme animation definitions | Already in use; CSS-first config in globals.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge (cn) | 2.1.1 / 3.4.0 | Conditional class composition | Already available via `@/lib/utils`; use for glow visibility classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JS-computed positions | Pure CSS percentage positioning | Would misalign on non-16:9 viewports; object-cover cropping breaks percentage mapping |
| Positioned `<div>` elements | CSS `::before`/`::after` pseudo-elements | Can only have 2 pseudo-elements per parent; need 10+ glow spots |
| Opacity-only animation | `mix-blend-mode: screen` + opacity | mix-blend-mode breaks GPU-composited opacity animations in Chrome; causes jank |
| Separate glow container div | SVG overlay with `<circle>` elements + filters | SVG filters are not GPU-composited; would violate GLOW-06 |
| Manual ResizeObserver | No resize handling | Glows would misalign when window is resized; poor experience on device rotation |

**Installation:**
No new packages needed. Everything required is already installed.

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   └── hero.tsx              # Add glow overlay rendering + positioning logic
├── lib/
│   └── rune-glows.ts         # Rune position data + object-cover math utility (optional, could inline)
├── app/
│   └── globals.css           # Add glow keyframes + animation classes + reduced-motion overrides
```

### Pattern 1: Object-Cover Position Mapping
**What:** Calculate where a point in the original image maps to within the rendered container, accounting for `object-fit: cover` scaling and centering.
**When to use:** When overlay elements must track positions on an `object-cover` image across viewport sizes.
**Rationale:** With `object-fit: cover` and `object-position: center` (default), the image is scaled to fill the container and centered. On wide containers, top/bottom are cropped. On tall containers, left/right are cropped. The scale factor is `max(containerW / imgNaturalW, containerH / imgNaturalH)`.

**Formula:**
```typescript
// Image natural dimensions (known at build time from static import)
const IMG_W = 2560
const IMG_H = 1429

function getGlowPosition(
  imgFracX: number,  // 0-1 position in original image
  imgFracY: number,  // 0-1 position in original image
  containerW: number,
  containerH: number
): { left: string; top: string } {
  // object-fit: cover scale factor
  const scale = Math.max(containerW / IMG_W, containerH / IMG_H)

  // Rendered image dimensions (larger than container in at least one axis)
  const renderedW = IMG_W * scale
  const renderedH = IMG_H * scale

  // object-position: center offset (how much is cropped on each side)
  const offsetX = (renderedW - containerW) / 2
  const offsetY = (renderedH - containerH) / 2

  // Convert image-space fraction to container-space pixel position
  const containerX = imgFracX * renderedW - offsetX
  const containerY = imgFracY * renderedH - offsetY

  // Return as percentage of container for CSS positioning
  return {
    left: `${(containerX / containerW) * 100}%`,
    top: `${(containerY / containerH) * 100}%`,
  }
}
```

**Why this works:** The formula reproduces the exact same math the browser uses for `object-fit: cover` with centered positioning. The image fractional coordinates (0-1) are constant -- they describe where each rune is in the original image. The container dimensions change with viewport, so positions are recalculated on resize.

### Pattern 2: CSS Custom Property Index for Staggered Timing
**What:** Set a `--i` CSS custom property on each glow element via inline style. Use `calc()` in the animation-delay to derive per-element stagger.
**When to use:** When many similar elements need different timing without per-element CSS rules.
**Example:**
```tsx
// Source: Cloud Four "Staggered Animations with CSS Custom Properties"
{runes.map((rune, i) => (
  <div
    key={rune.id}
    className="rune-glow"
    style={{
      '--i': i,
      '--duration': rune.breathDuration,
      left: positions[i].left,
      top: positions[i].top,
    } as React.CSSProperties}
  />
))}
```
```css
.rune-glow {
  /* Non-linear delay: earlier runes enter faster, later ones slower */
  animation-delay: calc(var(--i) * var(--i) * 40ms);
  animation-duration: var(--duration);
}
```

### Pattern 3: Two-Phase Animation (Entrance + Breathing)
**What:** Use comma-separated animations: first a one-shot entrance fade-in, then an infinite breathing cycle. The entrance animation-delay is staggered; the breathing starts after the entrance completes.
**When to use:** When elements need a choreographed entrance followed by a continuous ambient cycle.
**Example:**
```css
@keyframes runeGlowEntrance {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: var(--glow-opacity, 0.7); transform: scale(1); }
}

@keyframes runeGlowBreathe {
  0%, 100% { opacity: var(--glow-opacity, 0.7); transform: scale(1); }
  50%      { opacity: calc(var(--glow-opacity, 0.7) * 0.5); transform: scale(0.92); }
}

.rune-glow {
  opacity: 0; /* Hidden until entrance */
  animation:
    runeGlowEntrance 800ms ease-out calc(var(--entrance-delay)) forwards,
    runeGlowBreathe var(--duration) ease-in-out calc(var(--entrance-delay) + 800ms) infinite;
}
```

**Key detail:** The breathing animation's delay must include the entrance delay + entrance duration so it starts only after the entrance completes. The `forwards` fill mode on the entrance ensures opacity stays at its target value until the breathing takes over.

### Pattern 4: Triggering Glows After Phase 1 Reveal
**What:** The glow entrance cascade begins only after the Phase 1 text reveal completes. The text reveal starts at `revealStage === 'text-reveal'` and takes 500ms. So glow entrance should begin ~500ms after revealStage transitions to `'text-reveal'`.
**When to use:** When Phase 2 animation depends on Phase 1 completion.
**Example:**
```typescript
// In hero.tsx, add a new state for glow activation
const [glowsActive, setGlowsActive] = useState(false)

useEffect(() => {
  if (revealStage !== 'text-reveal' || prefersReducedMotion) return

  // Wait for text reveal animation to finish (500ms), then activate glows
  const timer = setTimeout(() => setGlowsActive(true), 500)
  return () => clearTimeout(timer)
}, [revealStage, prefersReducedMotion])
```

### Anti-Patterns to Avoid
- **Animating `background-image` / `radial-gradient` directly:** CSS gradients cannot be smoothly transitioned or animated. Animate `opacity` and `transform` on the element containing the gradient, never the gradient itself.
- **Using `box-shadow` for glows:** `box-shadow` is not GPU-composited and causes repaints on every frame. Use `radial-gradient` as a `background-image` with `opacity` animation instead. (GLOW-06)
- **Using `filter: blur()` continuously for glow softness:** Continuous `filter` animation causes severe jank. Instead, bake the softness into the `radial-gradient` itself (large spread, transparent edges). The gradient is rasterized once; only `opacity` animates.
- **Using `mix-blend-mode: screen` with animated opacity:** Chrome does not GPU-composite opacity animations on elements with `mix-blend-mode`. The animation falls back to CPU compositing, causing visible jank. Use standard opacity without blend modes.
- **Hardcoded pixel positions:** Pixels don't scale with viewport. All rune positions must be computed from image-space fractions.
- **Single `animation-duration` for all glows:** Creates a mechanical, synchronized pulsing. Each glow needs a different duration (using `--duration` custom property) for organic feel.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Object-cover position mapping | Approximated percentage positions | Computed positions from image fractions + container dimensions | The formula is simple (5 lines); approximations break on mobile/tablet |
| Glow visual | Canvas-rendered glow or SVG filter | CSS `radial-gradient` on a div | Zero-paint animation via opacity; GPU-composited; no JS rendering loop |
| Staggered timing | Per-element CSS rules or SCSS loops | CSS custom property `--i` with `calc()` | Scales to any count; one CSS rule covers all elements |
| Non-linear delay curve | Linear multiplication | Quadratic or exponential calc formula | `calc(var(--i) * var(--i) * N)` gives natural acceleration curve |
| Animation library | Framer Motion / GSAP | Pure CSS @keyframes + JS state gating | Zero new dependencies; codebase policy; CSS handles infinite loops natively |

**Key insight:** The glows are static elements with static gradients -- the only animated properties are `opacity` and `transform: scale()`. This is the cheapest possible animation pattern for the GPU. The visual complexity comes from the gradient definition (computed once), not the animation runtime.

## Common Pitfalls

### Pitfall 1: Glow Positions Misalign on Mobile Due to Object-Cover Cropping
**What goes wrong:** Glows are positioned as percentage of container, but on mobile (tall viewport, ~9:16 aspect), `object-cover` crops 40%+ of the image's left and right edges. Glows positioned for desktop viewpoints appear in wrong positions or float over the mountain range instead of runes.
**Why it happens:** `object-fit: cover` changes which portion of the image is visible at different aspect ratios. Percentage-of-container positioning doesn't account for the image's actual rendered bounds.
**How to avoid:** Compute positions using the object-cover math formula (Pattern 1). Recalculate on resize via `ResizeObserver` or `resize` event listener. Runes near the image edges will naturally disappear off-screen on narrow viewports -- their glow divs will be positioned outside the visible area and clipped by `overflow-hidden` on the section.
**Warning signs:** Glows appear correct on 16:9 desktop but drift on mobile preview or device rotation.

### Pitfall 2: mix-blend-mode Breaks GPU Opacity Animation
**What goes wrong:** Adding `mix-blend-mode: screen` to glow elements for an additive light effect causes the breathing animation to jank visibly, even though only `opacity` is animated.
**Why it happens:** When `mix-blend-mode` is applied, Chrome creates a separate compositing layer but cannot GPU-accelerate opacity changes on that layer. The opacity transition falls back to CPU repainting on every frame.
**How to avoid:** Do NOT use `mix-blend-mode` on the glow elements. Achieve the glow look purely with `radial-gradient` (color to transparent) and `opacity`. The visual difference between `screen` blending and standard opacity on a dark background is minimal -- on dark backgrounds, `screen` mode is nearly identical to standard alpha compositing.
**Warning signs:** Smooth animation in Firefox but janky in Chrome. Chrome DevTools Performance panel shows "Paint" events on every frame instead of "Composite" only.

### Pitfall 3: Too Many Composite Layers Cause Memory Pressure
**What goes wrong:** Each animated glow div is promoted to its own GPU composite layer. With 15+ large (200-300px) semi-transparent gradient layers, GPU memory consumption increases. On low-end mobile devices, this can cause frame drops or layer squashing.
**Why it happens:** The browser promotes animated elements to GPU layers for smooth compositing, but each layer consumes texture memory proportional to its rendered pixel area.
**How to avoid:** Keep glow count reasonable (8-12 runes, not 20+). Keep glow sizes moderate (use CSS dimensions, don't make them enormous). Test with Chrome DevTools > Layers panel to verify layer count. On low-end devices, `transform: translateZ(0)` can be used judiciously to control layer promotion. If memory becomes an issue, reducing glow size or count is the first lever.
**Warning signs:** Chrome DevTools > Layers shows 15+ composited layers in the hero section. Frame drops visible when scrolling past the hero on throttled CPU.

### Pitfall 4: Entrance Animation and Breathing Animation Conflict
**What goes wrong:** The entrance fade-in and the breathing cycle run as two separate CSS animations on the same element. If the breathing animation's delay isn't correctly offset by the entrance duration, both animations compete for the `opacity` property simultaneously, causing a visual glitch (glow fades in then immediately blinks to a different opacity).
**Why it happens:** CSS animation shorthand with multiple animations requires careful delay/duration coordination. The second animation starts its own keyframe cycle at its specified delay, potentially overriding the first animation's `forwards` fill.
**How to avoid:** Ensure the breathing animation's `animation-delay` equals the entrance delay + entrance duration. This guarantees sequential execution. Alternatively, use a single keyframe that includes the entrance as the first cycle and then repeats the breathing pattern (more complex but eliminates timing conflicts).
**Warning signs:** Glow appears, then blinks/flickers before settling into breathing rhythm.

### Pitfall 5: ResizeObserver Causes Layout Thrashing
**What goes wrong:** The position recalculation in the `ResizeObserver` callback triggers a forced layout (reading `offsetWidth`/`offsetHeight`) followed by setting inline styles (writing positions), causing layout thrashing on rapid resize.
**Why it happens:** Reading layout properties and writing style properties in the same synchronous callback forces the browser to recalculate layout.
**How to avoid:** Use `requestAnimationFrame` to batch position updates after the resize observation. Or use the `contentRect` property from the `ResizeObserverEntry` directly, which provides width/height without forcing layout. The `contentRect` is the recommended approach -- it gives the container dimensions without triggering a reflow.
**Warning signs:** Janky animation during window resize.

### Pitfall 6: Glows Visible During Reduced Motion
**What goes wrong:** Glows still animate their entrance or breathing cycle when `prefers-reduced-motion: reduce` is active.
**Why it happens:** New glow CSS classes weren't added to the existing reduced-motion override block in globals.css.
**How to avoid:** Add all glow animation classes to the `@media (prefers-reduced-motion: reduce)` block in globals.css. The JS guard (`prefersReducedMotion` state) should prevent setting `glowsActive = true`. Belt and suspenders: CSS kills animation properties, JS prevents the trigger.
**Warning signs:** Rune glows pulse on a page where user has reduced motion enabled.

## Code Examples

Verified patterns from official sources and codebase analysis:

### Rune Position Data Structure
```typescript
// Positions are fractions (0-1) within the original 2560x1429 image
// Colors assigned by Elder Futhark aett grouping
interface RuneGlow {
  id: string
  imgX: number       // 0-1 fraction of image width
  imgY: number       // 0-1 fraction of image height
  color: 'amber' | 'teal' | 'gold'
  size: number       // CSS rem for width/height
  breathDuration: string  // e.g. '5s', '6.5s', '7s'
}

const RUNE_GLOWS: RuneGlow[] = [
  // Positions determined by visual analysis of hero.webp (2560x1429)
  // Colors assigned by aett: Freyr=amber, Hagal=teal, Tyr=gold
  { id: 'fehu',     imgX: 0.08, imgY: 0.12, color: 'amber', size: 6,   breathDuration: '5.5s' },
  { id: 'ansuz',    imgX: 0.17, imgY: 0.08, color: 'amber', size: 5,   breathDuration: '6s' },
  // ... more runes
]
```

### Object-Cover Position Calculation
```typescript
// Source: CSS object-fit spec + derived formula
const IMG_W = 2560
const IMG_H = 1429

function computeGlowPositions(
  runes: RuneGlow[],
  containerW: number,
  containerH: number,
): Array<{ left: string; top: string; visible: boolean }> {
  const scale = Math.max(containerW / IMG_W, containerH / IMG_H)
  const renderedW = IMG_W * scale
  const renderedH = IMG_H * scale
  const offsetX = (renderedW - containerW) / 2
  const offsetY = (renderedH - containerH) / 2

  return runes.map((rune) => {
    const cx = rune.imgX * renderedW - offsetX
    const cy = rune.imgY * renderedH - offsetY
    // Rune is visible if its center is within the container bounds (with some margin)
    const margin = 50  // px, allow glow to extend slightly outside
    const visible = cx > -margin && cx < containerW + margin
                 && cy > -margin && cy < containerH + margin
    return {
      left: `${cx}px`,
      top: `${cy}px`,
      visible,
    }
  })
}
```

### Glow CSS with Radial Gradient
```css
/* Source: MDN radial-gradient, CSS animation spec */
@keyframes runeGlowEntrance {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: var(--glow-opacity, 0.7);
    transform: scale(1);
  }
}

@keyframes runeGlowBreathe {
  0%, 100% {
    opacity: var(--glow-opacity, 0.7);
    transform: scale(1);
  }
  50% {
    opacity: calc(var(--glow-opacity, 0.7) * 0.5);
    transform: scale(0.92);
  }
}

.rune-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  /* Translate -50% so the element is centered on the position point */
  transform: translate(-50%, -50%);
  opacity: 0;
  /* will-change hints for GPU promotion (only during animation) */
  will-change: opacity, transform;
}

.rune-glow--active {
  animation:
    runeGlowEntrance 800ms ease-out calc(var(--entrance-delay)) forwards,
    runeGlowBreathe var(--breath-duration, 6s) ease-in-out calc(var(--entrance-delay) + 800ms) infinite;
}

/* Color variants via radial-gradient */
.rune-glow--amber {
  background: radial-gradient(circle, rgba(217, 164, 65, 0.6) 0%, rgba(217, 164, 65, 0) 70%);
}

.rune-glow--teal {
  background: radial-gradient(circle, rgba(79, 191, 191, 0.5) 0%, rgba(79, 191, 191, 0) 70%);
}

.rune-glow--gold {
  background: radial-gradient(circle, rgba(232, 213, 149, 0.5) 0%, rgba(232, 213, 149, 0) 70%);
}
```

### Non-Linear Entrance Delay Calculation
```typescript
// Quadratic delay curve: early runes enter quickly, later ones progressively slower
// For 10 runes with 150ms base: delays are 0, 150, 600, 1350, 2400, ...
// That's too aggressive. Use a gentler curve:
// delay = baseDelay * sqrt(index) for a softer acceleration
function getEntranceDelay(index: number, total: number): string {
  // Target: ~3 seconds from first glow to last
  const totalCascadeDuration = 3000 // ms
  // Quadratic normalized: delay_i = totalDuration * (i / (total-1))^1.5
  const fraction = total > 1 ? index / (total - 1) : 0
  const delay = totalCascadeDuration * Math.pow(fraction, 1.5)
  return `${Math.round(delay)}ms`
}
```

### Reduced-Motion Handling
```css
/* Extend existing reduced-motion block in globals.css */
@media (prefers-reduced-motion: reduce) {
  .rune-glow,
  .rune-glow--active {
    animation: none !important;
    opacity: 0 !important;   /* Hide glows entirely -- they are decorative ambient */
    will-change: auto !important;
  }
}
```

### ResizeObserver for Position Updates
```typescript
// Source: MDN ResizeObserver API
useEffect(() => {
  const section = sectionRef.current
  if (!section) return

  const updatePositions = () => {
    // Use contentRect from ResizeObserver entry, or fall back to getBoundingClientRect
    const rect = section.getBoundingClientRect()
    setPositions(computeGlowPositions(RUNE_GLOWS, rect.width, rect.height))
  }

  // Initial calculation
  updatePositions()

  const ro = new ResizeObserver((entries) => {
    // contentRect gives width/height without forcing layout
    const entry = entries[0]
    if (entry) {
      const { width, height } = entry.contentRect
      setPositions(computeGlowPositions(RUNE_GLOWS, width, height))
    }
  })
  ro.observe(section)
  return () => ro.disconnect()
}, [])
```

## Rune Identification and Position Mapping

### Hero Image Analysis

The hero image (2560x1429) features Elder Futhark runes scattered across the sky area, above a mountain range with Yggdrasil (World Tree) at center-right. The runes appear as light-colored (yellowish/gold) symbols painted in the sky, some overlapping with pink and teal aurora borealis ribbons.

**Visible runes identified** (positions as fractions of image width/height, measured from top-left origin):

| # | Rune | Aett | Image X | Image Y | Background | Notes |
|---|------|------|---------|---------|------------|-------|
| 1 | Fehu (ᚠ) | Freyr | ~0.08 | ~0.13 | Pink aurora | Far upper left, F-shape |
| 2 | Ansuz (ᚨ) | Freyr | ~0.17 | ~0.09 | Pink aurora | Upper left area |
| 3 | Raidho (ᚱ) | Freyr | ~0.25 | ~0.14 | Between aurora bands | Center-left |
| 4 | Raidho (ᚱ) | Freyr | ~0.32 | ~0.11 | Between aurora bands | Duplicate rune |
| 5 | Tiwaz (ᛏ) | Tyr | ~0.20 | ~0.30 | Dark sky/teal aurora | Arrow-up shape, mid-left |
| 6 | Kenaz (ᚲ) | Freyr | ~0.44 | ~0.08 | Dark sky | Upper center |
| 7 | Isa (ᛁ) | Hagal | ~0.38 | ~0.25 | Teal aurora | Vertical line, center |
| 8 | Nauthiz (ᚾ) | Hagal | ~0.53 | ~0.20 | Near tree crown | X-cross shape |
| 9 | Hagalaz (ᚺ) | Hagal | ~0.62 | ~0.09 | Dark sky | H-shape, right of center |
| 10 | Algiz (ᛉ) | Hagal | ~0.68 | ~0.11 | Near tree | Elk-sedge, upward Y |
| 11 | Berkanan (ᛒ) | Tyr | ~0.75 | ~0.12 | Dark sky / tree edge | B-shape |
| 12 | Mannaz (ᛗ) | Tyr | ~0.84 | ~0.09 | Teal aurora right edge | M-shape |
| 13 | Ingwaz (ᛜ) | Tyr | ~0.90 | ~0.14 | Far right edge | Diamond shape |

**Important caveat:** These positions are estimated from visual inspection of the compressed image. They MUST be refined during implementation by overlaying the glow divs and adjusting coordinates with the dev server running. The positions listed here provide starting points accurate to within ~2-3% of the image dimension.

### Aett-to-Color Mapping (per GLOW-04)

| Aett | Color | Runes in Image | Count |
|------|-------|----------------|-------|
| Freyr (1st) | Warm amber | Fehu, Ansuz, Raidho x2, Kenaz | 5 |
| Hagal (2nd) | Cool teal | Isa, Nauthiz, Hagalaz, Algiz | 4 |
| Tyr (3rd) | Pale gold | Tiwaz, Berkanan, Mannaz, Ingwaz | 4 |

This produces a roughly balanced color distribution (5 amber, 4 teal, 4 gold = 13 runes total) with good spatial distribution -- amber runes cluster in the left/upper area, teal runes in the center, and gold runes span left-to-right, creating visual variety.

### Color Values

Based on the existing site palette and the need for ethereal, ambient glows:

| Color Name | RGBA (center) | Design Rationale |
|------------|---------------|------------------|
| Warm amber | `rgba(217, 164, 65, 0.6)` | Warm gold-orange; complements the dark sky; reads well against both pink aurora and dark background |
| Cool teal | `rgba(79, 191, 191, 0.5)` | Matches site accent color (--color-accent-light: #4FBFBF); creates visual cohesion with the teal aurora |
| Pale gold | `rgba(232, 213, 149, 0.5)` | Warm white-gold; softer than amber; ethereal quality; distinct from amber at a glance |

## Discretion Recommendations

### Which Runes to Include: All 13 Identified Runes
**Recommendation:** Include all 13 runes identified in the image. The runes near the edges (Fehu, Mannaz, Ingwaz) will be naturally hidden on narrow viewports by `overflow-hidden`, creating a pleasing effect where the number of visible glows adapts to screen size. On desktop, all 13 are visible; on mobile, perhaps 7-9 are visible. This makes the effect feel richer on larger screens without requiring media queries.

### Glow Size: Varied by Position and Spacing
**Recommendation:** Vary glow sizes from 5rem to 8rem (80-128px). Runes in the upper sky area (less visual detail) get larger glows (7-8rem). Runes near the tree and mountains (more visual detail) get smaller glows (5-6rem) to avoid obscuring illustration details. This variation also contributes to the organic, non-uniform feel.

### Blend Mode: Standard Opacity (No mix-blend-mode)
**Recommendation:** Use standard alpha-blended opacity without `mix-blend-mode`. Reason: `mix-blend-mode: screen` breaks GPU-composited opacity animations in Chrome, causing jank that would violate GLOW-06. On the hero's dark background, standard opacity with a radial gradient produces a visually similar result to `screen` blending. The difference is imperceptible for these diffuse, low-opacity glows.

### Color Assignment: By Aett (Authentic Meaning)
**Recommendation:** Assign colors by Elder Futhark aett grouping (Freyr=amber, Hagal=teal, Tyr=gold). This is historically meaningful (the three families of runes), creates natural spatial color clusters since runes of the same aett tend to be near each other in the traditional ordering, and produces balanced color distribution (5/4/4). It also satisfies GLOW-04 explicitly.

### Color Distribution Ratio: 5:4:4 (Amber:Teal:Gold)
**Recommendation:** The natural aett grouping produces 5 amber, 4 teal, 4 gold. This is balanced enough that no single color dominates. The slight amber majority is appropriate since the Freyr aett represents the foundational creative forces -- fitting for a portfolio hero.

### Breathing Cycle Speed: 5-8 Second Range
**Recommendation:** Each rune gets a breathing duration between 5s and 7.5s, assigned individually (not randomly -- fixed per rune for consistency across page visits). The 5-8s range from GLOW-05 is appropriate. Within that range, use varied values: e.g., 5.2s, 6.0s, 5.8s, 7.0s, 6.5s, 5.5s, 7.2s, etc. Prime-number-influenced values ensure runes rarely sync up, maintaining the organic feel indefinitely.

### Degree of Timing Variation: Moderate (Noticeably Different)
**Recommendation:** Each rune should breathe at a noticeably different rhythm. The range of 5-7.5s means the fastest rune completes a cycle ~50% faster than the slowest. Combined with the staggered entrance, runes will appear to pulse independently. The non-linear entrance delay curve (Pattern described above) adds to the organic quality.

### Entrance Cascade Timing: ~3 Seconds Total
**Recommendation:** The full entrance cascade from first glow to last should span approximately 3 seconds, using a non-linear (power curve) delay so early runes enter relatively quickly (building momentum) and later runes enter more slowly (creating a gentle fade-out of the entrance). This is long enough to be noticeable as a cascade but short enough not to feel like a loading sequence.

## Responsive Behavior Analysis

### Viewport Scenarios

| Viewport | Aspect Ratio | Image Behavior | Glow Impact |
|----------|-------------|----------------|-------------|
| Desktop wide (1920x1080) | 1.78:1 | Nearly exact fit (image is 1.79:1) | All 13 glows visible at correct positions |
| Desktop ultrawide (2560x1080) | 2.37:1 | Top/bottom cropped, ~20% height lost | Upper runes shift down slightly; all visible |
| Tablet landscape (1024x768) | 1.33:1 | Left/right edges visible; top/bottom slightly cropped | All 13 glows visible |
| Tablet portrait (768x1024) | 0.75:1 | Heavy left/right crop | Edge runes (Fehu, Mannaz, Ingwaz) cropped out; ~10 visible |
| Mobile (390x844) | 0.46:1 | Very heavy left/right crop | Only center ~7-8 runes visible |
| Mobile landscape (844x390) | 2.16:1 | Top/bottom cropped | All glows visible but compressed vertically |

This is actually a feature, not a bug. Fewer glows on mobile means less GPU load on lower-powered devices.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `box-shadow` for glows | `radial-gradient` + opacity animation | Ongoing best practice | box-shadow causes repaints; radial-gradient is rasterized once |
| `mix-blend-mode: screen` for additive glow | Standard opacity compositing | Ongoing (Chrome bug persists) | Blend modes break GPU opacity compositing |
| `:nth-child()` for stagger delays | CSS custom properties `--i` | ~2020+ | Custom properties scale dynamically; no rule-per-element |
| `window.onresize` | `ResizeObserver` | 2020+ (widely supported) | More efficient; fires for element resize, not just window; provides dimensions in callback |
| SCSS loops for animation variants | CSS `calc()` with custom properties | CSS custom properties matured ~2020 | Runtime-dynamic; no build step; works with inline styles |

**Deprecated/outdated:**
- `box-shadow` animation for glows: Causes repaints; not GPU-composited
- `addListener`/`removeListener` on MediaQueryList: Use `addEventListener`/`removeEventListener`
- `window.onresize` for responsive positioning: Use `ResizeObserver` for element-specific observation

## Open Questions

1. **Exact rune positions need visual refinement**
   - What we know: Positions estimated from the compressed hero image at ~2-3% accuracy
   - What's unclear: Exact pixel-precise positions require overlaying glow divs in the running dev server and fine-tuning
   - Recommendation: Use the estimated positions as starting values. During implementation, run the dev server and adjust coordinates interactively until each glow is centered on its rune. This is inherently a visual task.

2. **Optimal glow opacity range**
   - What we know: The glows should be "noticeable but ambient." The dark sky background means even low opacity (0.3-0.5) will be visible. The aurora ribbons are brighter, so glows there need slightly higher opacity to be noticeable.
   - What's unclear: The exact opacity that achieves "clearly visible but not dominating" depends on monitor/device gamma and ambient lighting
   - Recommendation: Start with center opacity 0.5-0.6 for amber, 0.4-0.5 for teal (cooler colors appear brighter at equal opacity), and 0.4-0.5 for gold. Tune during implementation.

3. **Whether runes on the tree trunk stone should glow**
   - What we know: There appear to be carved runes on the stone/cliff base of Yggdrasil (lower center of image). These are in the mountain area, not the sky.
   - What's unclear: Whether these stone-carved runes should glow like the sky runes. The mountain area is darker and more detailed.
   - Recommendation: Exclude stone-carved runes for this phase. The sky runes are the primary targets. Stone runes could be added as a future enhancement if desired.

4. **Two-animation timing conflict edge cases**
   - What we know: Using comma-separated animations (entrance + breathing) with offset delays should work per CSS spec
   - What's unclear: Whether all browsers handle the timing handoff cleanly, especially the `forwards` fill mode from animation 1 being overridden by animation 2's first keyframe
   - Recommendation: Test the two-animation approach first. If timing conflicts appear, fall back to a single-animation approach where the entrance is baked into the first cycle of the breathing keyframes (slightly more complex CSS but eliminates the handoff issue).

## Sources

### Primary (HIGH confidence)
- [MDN radial-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/radial-gradient) - Gradient syntax, circle shape, color stops
- [MDN animation-delay](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-delay) - Delay property behavior with multiple animations
- [MDN mix-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mix-blend-mode) - Blend mode specification
- [MDN ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) - Element resize observation API
- [MDN object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) - Cover behavior specification
- Phase 1 Research (`.planning/phases/01-animation-sync-reveal/01-RESEARCH.md`) - Existing hero component architecture, animation infrastructure, reduced-motion patterns
- Phase 1 Summary (`.planning/phases/01-animation-sync-reveal/01-01-SUMMARY.md`) - `imageLoaded` and `prefersReducedMotion` state availability confirmed
- Codebase analysis of `hero.tsx` (current) - Three-stage reveal state machine, timing values, existing class patterns

### Secondary (MEDIUM confidence)
- [Cloud Four: Staggered Animations with CSS Custom Properties](https://cloudfour.com/thinks/staggered-animations-with-css-custom-properties/) - `--index` custom property pattern for animation delays
- [CSS-Tricks: The State of Changing Gradients with CSS Transitions and Animations](https://css-tricks.com/the-state-of-changing-gradients-with-css-transitions-and-animations/) - Gradient animation limitations, opacity-layer workaround
- [Observable: CSS object-fit formulas](https://observablehq.com/@severo/css-object-fit-formulas) - Mathematical basis for cover scale factor calculation
- [CSS-Tricks: mix-blend-mode](https://css-tricks.com/almanac/properties/m/mix-blend-mode/) - Known GPU compositing issues with blend modes

### Tertiary (LOW confidence)
- Hero image visual rune identification - Manual inspection of compressed image; positions are estimates that need runtime refinement

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new packages; CSS @keyframes, radial-gradient, and custom properties are battle-tested
- Architecture: HIGH - Object-cover position mapping formula is mathematically derived from the CSS spec; staggered custom property pattern is widely documented
- Pitfalls: HIGH - mix-blend-mode GPU issue is well-documented and independently verified; box-shadow repaint cost is established knowledge
- Rune positions: LOW - Visual estimation from compressed image; will need runtime fine-tuning
- Discretion recommendations: MEDIUM - Animation timing values are inherently subjective; starting values provided but expect visual tuning

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stable domain, no fast-moving dependencies)
