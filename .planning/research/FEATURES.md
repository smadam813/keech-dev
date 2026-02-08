# Feature Research

**Domain:** Hero animation sync and ambient CSS glow effects for keech.dev
**Researched:** 2026-02-08
**Confidence:** MEDIUM -- grounded in codebase analysis and verified web techniques, but specific rune-position glow overlays are a novel design pattern without direct precedent

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must work correctly or the hero feels broken. Missing any of these creates a visible quality gap.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Image-load-synced text animation | Text animating before the background loads is a visible bug. Users see the headline floating on a blank/placeholder canvas, breaking the reveal moment. Currently broken during client-side navigation. | MEDIUM | Requires converting `hero.tsx` to a client component, using Next.js `Image` `onLoad` callback to gate the `animate-on-load` class. The `onLoad` event fires when the real image completes and the blur placeholder is removed. Must handle cached images (where onLoad may fire synchronously). |
| `prefers-reduced-motion` respect for all new animations | Users with vestibular disorders can be triggered by pulsing, scaling, and glowing animations. Existing codebase already respects this for fadeInUp -- any new glow/pulse animations must follow the same pattern. | LOW | Extend the existing `@media (prefers-reduced-motion: reduce)` block in `globals.css`. For glow effects, either disable animation entirely or replace with a static reduced-opacity glow. |
| Graceful degradation when image loads slowly | On slow connections, there must be a reasonable visual state between "placeholder" and "fully loaded." The blur placeholder from Next.js static import handles the image side. The text side needs to either be visible immediately (static) or wait without a jarring pop-in. | LOW | The blur placeholder already exists. The synced animation simply holds text at `opacity: 0` until onLoad fires, then plays fadeInUp. On slow connections, users see the blur placeholder with no text, then both resolve together. Acceptable UX. |
| No layout shift during animation | CLS (Cumulative Layout Shift) must be zero. Text appearing, glow layers fading in, and image loading must not push content around. | LOW | Current hero is `position: relative` with `fill` image and absolutely-positioned overlays. Glow layers should be absolutely positioned within the same container. No layout impact expected if implemented as overlay layers. |
| Animation plays only once per navigation | The reveal animation should fire when the user first arrives at the page. It should not replay on every re-render, tab switch, or scroll. Currently `animate-on-load` fires on component mount which is correct for SSR but replays on client-side nav. | LOW | Gate animation state in React state. Once the `onLoad` callback fires and animation completes, do not re-trigger. Use `animationend` event or a timeout to mark completion. |

### Differentiators (Competitive Advantage)

Features that elevate the hero from "functional" to "this person cares about craft." These are where the Norse identity comes alive.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Staggered rune-position glow pulse | Soft teal/aurora glow spots positioned over rune locations in the background image, pulsing with staggered timing. Creates an "alive" atmosphere like runes channeling energy. Ties directly into the Elder Futhark theme that permeates the site. | MEDIUM | Use absolutely-positioned pseudo-elements or dedicated divs with CSS `radial-gradient` or `box-shadow` glow. Animate `opacity` only (not box-shadow values) for 60fps performance. Use CSS custom property `--i` index for stagger delays via `calc()`. Position coordinates are fixed since the hero image is static. |
| Organic stagger timing (not linear) | Linear stagger (equal delay between each glow point) feels mechanical. An easing curve applied to the delay distribution -- some runes pulse almost together, others have longer gaps -- creates a breathing, organic feel. | LOW | Use non-linear index multipliers in `calc()`. For example, `animation-delay: calc(var(--i) * var(--i) * 0.15s)` creates accelerating gaps. Or hand-tune 5-7 delay values. Small effort, large perceptual difference. |
| Coordinated image-to-text reveal sequence | Instead of image and text appearing simultaneously, a deliberate reveal order: background crossfades from blur to sharp, then text fades up, then glow points pulse on. Creates a cinematic three-beat entrance. | MEDIUM | Sequence: (1) `onLoad` fires, image crossfade happens via Next.js placeholder removal, (2) after a short delay (200-400ms), trigger text fadeInUp, (3) after text animation completes (~600ms), start glow pulse sequence. Use CSS `animation-delay` chaining or a single state machine in the client component. |
| Subtle parallax on glow layer | Glow spots shift very slightly (5-10px) on mouse move or device tilt, creating depth separation between the static background and the glow overlay. Makes the runes feel like they exist on a separate plane. | MEDIUM | Use `mousemove` event with `transform: translate()` on the glow container. Apply a dampening factor (requestAnimationFrame + lerp) for smooth movement. Device tilt via DeviceOrientationEvent for mobile. Must be entirely optional (enhancement, not core). |
| Glow color variation by rune aett | Different aett groups (Freyr's, Hagal's, Tyr's) get slightly different glow hues -- warm amber for Freyr's, cool teal for Hagal's, pale gold for Tyr's. Adds visual depth and rewards users who notice the rune system. | LOW | Each glow point gets a CSS custom property `--glow-color` based on its aett. Use the existing `rune-config.ts` aett data. Three color values in the theme. Minimal code, meaningful design detail. |
| Slow ambient drift animation | After the initial pulse-in sequence completes, glow points enter a very slow continuous breathing cycle (4-8 second period). Not a sharp pulse, but a gentle opacity oscillation between 0.3 and 0.6. Background atmosphere, not attention-grabbing. | LOW | Single `@keyframes` with `animation-iteration-count: infinite` and `animation-timing-function: ease-in-out`. Long duration prevents it from feeling frenetic. The stagger delays persist into the infinite loop, so points breathe out of phase. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately NOT build. These would undermine the neobrutalist identity or create technical problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Canvas-based ambient glow (YouTube-style) | YouTube's ambient mode is visually impressive and well-known. Seems like the "real" way to do ambient glow. | Massively over-engineered for a static image. YouTube's technique exists because video frames change -- it samples live color data. For a static .webp hero, a canvas pipeline adds JS weight, complexity, and a new rendering layer for zero benefit over CSS. Also breaks SSR. | CSS radial-gradient or box-shadow on positioned elements. Same visual result, zero JS for the glow itself (only JS for animation triggering). |
| Particle system / floating rune particles | Animated rune characters drifting across the hero like snow or embers. Visually dramatic, thematically relevant. | Creates a "fantasy game landing page" feel that clashes with the neobrutalist identity. Neobrutalism is about bold, static, intentional placement -- not ambient particle noise. Also a significant performance and bundle size cost for a canvas-based particle system. | The staggered glow pulse achieves "alive" atmosphere through light rather than motion. Runes are anchored, not floating -- which aligns with their carved-in-stone cultural identity. |
| Framer Motion or GSAP animation library | Professional animation libraries offer fine-grained timeline control, spring physics, and gesture handling. | Adding 20-40KB (Framer Motion) or 25KB (GSAP) for a single hero animation is disproportionate. The existing codebase uses zero animation libraries -- only CSS keyframes and one IntersectionObserver. The hero animation sequence is simple enough for CSS + React state. Introducing a library here sets a precedent for library creep across the site. | CSS `@keyframes` with `animation-delay` chaining. For the parallax effect, vanilla JS with `requestAnimationFrame`. The entire feature set described above can be achieved with zero new dependencies. |
| Interactive rune hover effects on glow points | Hovering over a glow spot reveals the rune name/meaning as a tooltip. Makes the hero "interactive." | The hero image is a photograph with runes rendered into it -- the glow positions are approximate overlays, not precise clickable regions. Touch targets would be ambiguous. Adding hover state to decorative elements creates false affordance (users expect clicking does something). Also conflicts with the scrim overlay's `pointer-events-none`. | If rune interactivity is desired, build it as a separate "rune explorer" component on the /about page where runes can be properly displayed as distinct interactive elements with the existing `rune-config.ts` data. |
| Scroll-triggered hero animation | Hero animation plays as you scroll down, with parallax layers moving at different rates. | The hero is above-the-fold, full viewport height. Scroll-triggered animation means the hero sits static on initial load (wasting the first impression) and only comes alive as the user scrolls away from it. For below-fold content, scroll-trigger is great (the site already has `ScrollReveal`). For the hero, on-load is correct. | Keep the reveal sequence triggered by image load, not scroll. The hero's job is to make an immediate impression. |
| Dark mode / theme-variant glow colors | Supporting different glow palettes for light/dark mode. | The site explicitly has no dark mode -- the dusty rose / teal / black palette IS the brand. Building dark mode support for the glow system introduces conditional theming infrastructure for a single-theme site. The CLAUDE.md states this directly. | Single palette. The glow colors should be defined as CSS custom properties in `globals.css` alongside the existing theme tokens, but only one set of values. |

## Feature Dependencies

```
[Image load sync (fix bug)]
    +-- triggers --> [Text fadeInUp animation]
                        +-- triggers --> [Staggered glow pulse sequence]
                                             +-- enhances --> [Ambient drift animation (infinite loop)]

[prefers-reduced-motion support]
    +-- constrains --> [All animation features above]

[Rune position mapping]
    +-- required by --> [Staggered glow pulse]
    +-- required by --> [Glow color by aett]
    +-- enhances --> [Parallax on glow layer]

[Organic stagger timing]
    +-- enhances --> [Staggered glow pulse]
    +-- enhances --> [Ambient drift animation]
```

### Dependency Notes

- **Image load sync is the foundation:** Every other animation feature depends on knowing when the image is ready. This is also the bug fix. Must be implemented first.
- **Text animation requires image load sync:** The current text animation fires immediately on mount. Converting to onLoad-gated requires the sync mechanism to exist.
- **Glow pulse requires rune position mapping:** Glow spots need x/y coordinates mapped to where runes appear in the hero image. This is a data authoring step (examining the image, noting rune positions, encoding as CSS or config).
- **Aett-based glow color requires rune position mapping:** Each glow point must be associated with a specific rune to know its aett. The existing `rune-config.ts` has the aett data; the position mapping connects it to the hero image.
- **Parallax is fully independent and optional:** It enhances the glow layer but does not depend on or block anything else. Can be added or removed without affecting the core animation sequence.
- **`prefers-reduced-motion` constrains everything:** Every animation feature must degrade gracefully. This is not a "later" concern -- it must be built into each feature from the start.

## MVP Definition

### Launch With (v1)

Minimum viable implementation -- fixes the bug and delivers the core visual impact.

- [ ] **Image-load-synced text animation** -- Fixes the reported bug. Convert hero.tsx to client component, use onLoad to gate animation.
- [ ] **Coordinated reveal sequence** -- Image resolves, short pause, text fades up. Two-beat entrance using animation-delay.
- [ ] **`prefers-reduced-motion` for all new animations** -- Extend existing media query block. Non-negotiable accessibility baseline.

### Add After Validation (v1.x)

Features to add once the sync mechanism is proven stable.

- [ ] **Staggered rune-position glow pulse** -- Core visual enhancement. Requires identifying rune positions in the hero image and placing CSS glow overlays. Add when the onLoad sequencing is solid.
- [ ] **Organic stagger timing** -- Tune delay curve once glow points are placed and visible. Quick iteration on timing values.
- [ ] **Glow color variation by aett** -- Wire up rune-config.ts aett data to glow colors. Small addition once glow points exist.
- [ ] **Slow ambient drift animation** -- Add infinite breathing cycle after pulse-in sequence works. Last animation layer.

### Future Consideration (v2+)

Features to defer until the animation system is mature.

- [ ] **Subtle parallax on glow layer** -- Mouse/tilt-driven depth effect. Requires careful performance testing on mobile. Defer until core animations are finalized.
- [ ] **Responsive rune position mapping** -- Glow positions may need to shift at different breakpoints if the background image crops differently. Investigate after initial desktop implementation.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Image load sync (bug fix) | HIGH | MEDIUM | P1 |
| Coordinated reveal sequence | HIGH | LOW | P1 |
| `prefers-reduced-motion` support | HIGH | LOW | P1 |
| No layout shift | HIGH | LOW | P1 |
| Animation plays once | MEDIUM | LOW | P1 |
| Staggered rune glow pulse | HIGH | MEDIUM | P2 |
| Organic stagger timing | MEDIUM | LOW | P2 |
| Glow color by aett | MEDIUM | LOW | P2 |
| Ambient drift animation | MEDIUM | LOW | P2 |
| Parallax on glow layer | LOW | MEDIUM | P3 |
| Responsive rune positions | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- fixes the bug, establishes the animation foundation
- P2: Should have -- delivers the ambient glow visual identity
- P3: Nice to have -- polish effects to add after core is stable

## Competitor Feature Analysis

| Feature | Award-winning portfolio sites (Awwwards) | Dev portfolio norm | keech.dev approach |
|---------|------------------------------------------|--------------------|--------------------|
| Hero image reveal | Cinematic sequences with GSAP/Framer. Multi-second choreography. | Basic fade-in or no animation. | Lightweight CSS-only two-beat reveal (image then text). Achieves the "intentional" feel without library weight. |
| Ambient background effects | Canvas particle systems, WebGL shaders, video loops. | Static image or gradient. | CSS glow overlays. Matches the rune theme without over-engineering. Unique because the glow is thematically motivated (rune energy), not generic. |
| Scroll-driven hero | Parallax layers, scroll-triggered timeline. | Fixed background, content scrolls over. | No scroll dependency. Hero makes its impression on load. Scroll-reveal exists for below-fold content already. |
| Motion accessibility | Often missing entirely. | Rarely implemented. | First-class `prefers-reduced-motion` support on all animations. Differentiator by being responsible. |

## Sources

- [Next.js Image Component API (onLoad callback)](https://nextjs.org/docs/app/api-reference/components/image) -- HIGH confidence, official docs
- [Animating box-shadow with smooth performance (pseudo-element opacity technique)](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) -- HIGH confidence, verified technique
- [Staggered animations with CSS custom properties (Cloud Four)](https://cloudfour.com/thinks/staggered-animations-with-css-custom-properties/) -- HIGH confidence, verified technique
- [Recreating YouTube's ambient mode glow effect (Smashing Magazine)](https://www.smashingmagazine.com/2023/07/recreating-youtube-ambient-mode-glow-effect/) -- HIGH confidence, used to justify anti-feature decision
- [prefers-reduced-motion (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) -- HIGH confidence, official reference
- [CSS GPU animation best practices (Smashing Magazine)](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/) -- MEDIUM confidence, older but principles still valid
- [next/image onLoad double-fire issue (GitHub Discussion #24757)](https://github.com/vercel/next.js/discussions/24757) -- MEDIUM confidence, community discussion with verified workaround
- [Hero section animation best practices (various)](https://freefrontend.com/css-hero-sections/) -- LOW confidence, aggregator without primary sources
- [CSS glow effects compilation (TestMu AI)](https://www.testmu.ai/blog/glowing-effects-in-css/) -- LOW confidence, used for pattern survey only

---
*Feature research for: Hero animation sync and ambient CSS glow effects (keech.dev)*
*Researched: 2026-02-08*
