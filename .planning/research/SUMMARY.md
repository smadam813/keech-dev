# Project Research Summary

**Project:** Hero Animation Synchronization and CSS Glow Effects
**Domain:** Next.js portfolio site hero section enhancement
**Researched:** 2026-02-08
**Confidence:** HIGH

## Executive Summary

This milestone involves fixing a visual bug where the hero text animation plays before the background image loads, and enhancing the hero with ambient CSS glow effects positioned at rune locations in the background image. The research reveals this is achievable with zero new dependencies — the entire feature set uses native Next.js Image callbacks, React state, and CSS animations already in the project's stack.

The recommended approach converts the hero component to a client component using the Next.js Image `onLoad` callback with a dual-path detection pattern (callback + useEffect with `img.complete` check) to handle cached images. CSS keyframes with class-gated animations sequence the reveal, while positioned divs with radial-gradient backgrounds create the glow effect. Performance is maintained by animating only GPU-composited properties (`opacity`, `transform`) and limiting composite layers to 3-4 maximum.

The primary risk is the well-documented Next.js `onLoad` cached-image pitfall where the callback never fires for disk-cached or bfcache-restored images. This is mitigated with the dual-path pattern. Secondary risks include mobile GPU memory exhaustion from multiple composite layers (mitigated by consolidating gradients) and prefers-reduced-motion inconsistency between CSS and JS (mitigated by detecting motion preference in both systems). All risks have proven solutions with HIGH confidence.

## Key Findings

### Recommended Stack

This milestone requires zero new dependencies. The existing stack (Next.js 16.1.6, React 19.2.4, Tailwind CSS v4.1.18) provides everything needed through native browser APIs and CSS features.

**Core technologies:**
- **Next.js Image `onLoad` callback** — detects when hero background image is fully loaded and placeholder removed. Built-in prop, no library needed. Requires client component.
- **React `useState` + dual-path detection** — tracks image-loaded state via `onLoad` callback AND `useEffect` checking `img.complete` to catch already-cached images. Prevents the critical pitfall where onLoad never fires.
- **CSS `@keyframes` with class toggle** — animation triggered by data attribute (`data-loaded`) when image state becomes true. More reliable than `animation-play-state` which can skip frames.
- **CSS `@property` typed custom properties** — enables animating radial-gradient spread for breathing glow effect. Baseline 2024, 96% browser support. Optional enhancement; pure opacity animation is safer baseline.
- **CSS pseudo-elements or positioned divs with `opacity` animation** — GPU-composited glow overlays. Box-shadow and filter:blur are explicitly avoided due to repaint costs.
- **Tailwind CSS v4 `@theme` directive** — design tokens for animation timing already in use. Add glow-specific timing values alongside existing tokens.

**Critical version notes:**
- `onLoadingComplete` deprecated in Next.js 14 — use `onLoad` instead
- Image `preload` prop available since Next.js 16, replaces deprecated `priority`
- CSS `@property` baseline since 2024 across all major browsers

### Expected Features

**Must have (table stakes — fixes bug):**
- **Image-load-synced text animation** — text animation must not play before background loads. Currently broken during client-side navigation. Requires converting hero to client component with onLoad-gated animation.
- **prefers-reduced-motion support** — users with vestibular disorders need all animations disabled. Extend existing pattern in globals.css (lines 89-101). All content must be visible immediately at opacity: 1.
- **Graceful slow-load degradation** — blur placeholder handles image side; text stays at opacity: 0 until onLoad fires. Acceptable UX on slow connections.
- **Zero layout shift** — glow layers absolutely positioned, no CLS.
- **Animation plays once per navigation** — gate on state, not mount.

**Should have (competitive advantage — core visual identity):**
- **Staggered rune-position glow pulse** — teal/aurora glow spots positioned over rune locations with staggered timing. Uses radial-gradient backgrounds, animates opacity only for 60fps. Position coordinates are fixed since hero image is static.
- **Organic stagger timing** — non-linear delay distribution (quadratic index or hand-tuned values) creates breathing rhythm instead of mechanical linear stagger.
- **Coordinated reveal sequence** — three-beat entrance: image crossfade → text fadeInUp → glow pulse sequence. Uses CSS animation-delay chaining.
- **Glow color variation by aett** — different rune groups (Freyr's/Hagal's/Tyr's aett) get slightly different glow hues. Wire existing rune-config.ts aett data to CSS custom properties.
- **Slow ambient drift animation** — after initial pulse, continuous 4-8 second breathing cycle at low amplitude (opacity 0.3-0.6 oscillation). Stagger delays persist into infinite loop.

**Defer (v2+ or anti-features):**
- **Canvas-based ambient glow** — massively over-engineered for static image. YouTube-style ambient mode exists for live video color sampling. CSS radial-gradient achieves same visual for zero bundle cost.
- **Particle system** — creates "fantasy game" feel that clashes with neobrutalist identity. Runes are carved/anchored, not floating.
- **Framer Motion / GSAP** — 20-40KB for single hero animation is disproportionate. Existing codebase uses zero animation libraries; CSS keyframes are established pattern.
- **Interactive rune hover effects** — hero image runes are photographic, not precise clickable regions. False affordance.
- **Scroll-triggered hero** — hero is above-fold, full viewport. Scroll-trigger wastes first impression. Keep on-load reveal.
- **Dark mode glow variants** — site explicitly has no dark mode. Single palette is the brand.

### Architecture Approach

The hero component (currently a server component at `src/components/hero.tsx`) must become a client component to support the `onLoad` callback. This is the correct approach — the entire component's purpose is interactive (image load detection triggers animation), making it a single cohesive client unit rather than a server wrapper with client island.

**Major components:**
1. **HeroClient component** — owns `imageLoaded` state, renders Next.js Image with onLoad callback + ref for dual-path detection, passes state to children via data attribute on parent element. Single file, not split.
2. **CSS animation layer in globals.css** — keyframes for heroFadeIn (text entrance) and glowPulse (ambient breathing). Triggered by `.hero-loaded` descendant selectors with animation-delay chaining. All timing in CSS, not JS.
3. **Glow overlay elements** — positioned divs (one per rune location) with radial-gradient backgrounds. Animate only opacity and transform (GPU-composited). Stagger delays via inline `--glow-index` custom property with calc().
4. **Scrim overlay** — WCAG AA contrast gradient, pure CSS child, no state dependency.
5. **Reduced motion bypass** — CSS media query disables animations and sets opacity: 1. JS also checks matchMedia to set loaded: true immediately for motion-sensitive users, ensuring JS and CSS state agree.

**Key patterns:**
- Image load state as animation gate (onLoad callback + useEffect with img.complete check)
- CSS class cascade for animation sequencing (parent data attribute triggers child animations)
- CSS-only glow via text-shadow stacking or radial-gradient positioned divs
- Inline custom property for stagger delays (`--glow-index` set in JSX, used in calc() for animation-delay)

**Build order:**
1. CSS foundation (keyframes, classes) — independently testable
2. Client component conversion (hero.tsx) — isolated breaking change
3. Glow effect implementation — depends on phase 2
4. Timing polish — depends on mechanism existing

### Critical Pitfalls

1. **onLoad never fires for cached/bfcache-restored images** — the most reported issue with this pattern. React binds onLoad after hydration; if img.complete is already true (cached, preloaded), the native load event fired before the listener attached. SOLUTION: Dual-path detection with `useEffect(() => { if (imgRef.current?.complete) setLoaded(true) }, [])` alongside onLoad callback. Use both ref and onLoad on Image component.

2. **Converting hero to client component breaks static optimization unexpectedly** — `'use client'` directive pulls entire import chain into client module graph. Static image import still works but increases bundle. Worse if server-only utilities accidentally imported. SOLUTION: Keep client boundary narrow, verify bundle size delta < 1KB gzipped with `next build --debug`. Metadata exports must stay in server components (page.tsx), not hero component.

3. **Animation plays before image is visible (race condition)** — CSS animation triggers on mount, but full image decode happens asynchronously. Especially visible during client-side navigation when animation completes before image fetch starts. SOLUTION: Gate animation on loaded state, not mount. Start with opacity: 0, apply animation class only when loaded becomes true.

4. **Staggered CSS glow pulses cause mobile GPU memory exhaustion** — each animated glow layer (opacity/transform on large viewport area) creates separate composite layer consuming GPU texture memory. 5+ layers can exhaust budget on mobile. SOLUTION: Limit to 3-4 glow layers max. Use single element with multiple radial gradients in one background property rather than multiple divs. Avoid will-change in CSS (add/remove via JS only around animation).

5. **prefers-reduced-motion handled inconsistently between CSS and JS** — CSS media query says "opacity: 1 !important" but JS state says "loaded: false" so content stuck invisible. SOLUTION: Detect motion preference in JS as well (ScrollReveal already does this): `const mq = window.matchMedia('(prefers-reduced-motion: reduce'); if (mq.matches) setLoaded(true)` to skip waiting for image.

6. **Radial gradient glow shows visible color banding** — 8-bit color depth gives only 256 steps per channel. Subtle glow over large area creates concentric ring "stairstepping." SOLUTION: Add subtle noise texture overlay (~2% opacity, tiny PNG), use multiple intermediate color stops, keep glow opacity modest (peak 0.1-0.2).

## Implications for Roadmap

Based on combined research, this milestone naturally breaks into two phases with clear dependency chain and risk distribution.

### Phase 1: Image Load Sync & Animation Foundation

**Rationale:** Fixes the reported bug and establishes the animation infrastructure that Phase 2 depends on. All critical pitfalls (onLoad cache issue, client boundary, race condition, motion preference) must be solved here before visual enhancements. This phase delivers immediate value (bug fix) and validates the core mechanism.

**Delivers:**
- Working image-load-synced text animation
- Hero component converted to client component with dual-path load detection
- CSS keyframes foundation in globals.css
- prefers-reduced-motion support in both CSS and JS
- Coordinated reveal sequence (image → text fadeInUp)

**Addresses features:**
- Image-load-synced text animation (table stakes)
- prefers-reduced-motion respect (table stakes)
- Graceful slow-load degradation (table stakes)
- Zero layout shift (table stakes)
- Animation plays once (table stakes)
- Coordinated reveal sequence (competitive advantage)

**Avoids pitfalls:**
- Pitfall 1: onLoad cached image issue (dual-path detection pattern)
- Pitfall 2: Client component boundary bloat (verify bundle size)
- Pitfall 3: Animation race condition (load-gated animation)
- Pitfall 5: Motion preference inconsistency (JS + CSS detection)

**Implementation notes:**
- Start with CSS keyframes in globals.css (can test by manually toggling classes)
- Convert hero.tsx to client component with useState and dual-path onLoad
- Wire className to include 'hero-loaded' when imageLoaded true
- Verify with back-button test (cache enabled), throttled network test, reduced-motion toggle

### Phase 2: Rune Glow Effects

**Rationale:** Builds on proven animation foundation from Phase 1. Adds the ambient visual identity (staggered rune glow pulse) that differentiates the hero. Depends on image load state and CSS animation infrastructure being stable. Isolated risk: mobile GPU performance (composite layers).

**Delivers:**
- Staggered rune-position glow pulse overlay
- Organic stagger timing (non-linear delay curve)
- Glow color variation by aett (wire rune-config.ts)
- Slow ambient drift animation (infinite breathing cycle)

**Addresses features:**
- Staggered rune-position glow pulse (competitive advantage)
- Organic stagger timing (competitive advantage)
- Glow color variation by aett (competitive advantage)
- Slow ambient drift animation (competitive advantage)

**Avoids pitfalls:**
- Pitfall 4: GPU memory exhaustion (limit to 3-4 layers, combine gradients)
- Pitfall 6: Gradient banding (noise texture, intermediate stops)

**Implementation notes:**
- Identify rune positions in hero image, encode as coordinates
- Create positioned divs with radial-gradient backgrounds
- Animate opacity only (not background, not box-shadow)
- Use inline `--glow-index` custom property for stagger calc()
- Wire aett data from rune-config.ts to --glow-color custom properties
- Test composite layer count in Chrome DevTools Layers panel (must be <= 3-4)
- Screenshot at 200% zoom on 8-bit display to check for banding

### Phase Ordering Rationale

- **Phase 1 first because:** The image load sync mechanism is the foundation. Glow effects depend on the loaded state and CSS animation infrastructure. The critical pitfalls (onLoad cache, client boundary, race condition) all live in Phase 1 — solving them early reduces risk.
- **Phase 2 second because:** It's purely additive visual enhancement. If glow effects have performance issues on mobile, they can be tuned or reduced without affecting the bug fix delivered in Phase 1. The architecture supports progressive enhancement (glow layers are optional overlay children).
- **No Phase 3 needed:** The "future consideration" features (parallax, responsive rune positions) are explicitly deferred to v2+. This milestone has a tight, achievable scope.

**Dependency chain:**
```
[Phase 1: Image Load Sync]
    |
    +-- provides --> imageLoaded state
    +-- provides --> .hero-loaded class trigger
    +-- provides --> CSS keyframes foundation
    +-- provides --> reduced-motion detection
    |
    v
[Phase 2: Rune Glow Effects]
    |
    +-- depends on --> imageLoaded state (when to start glow sequence)
    +-- depends on --> CSS animation infrastructure (keyframes, delays)
    +-- depends on --> reduced-motion overrides (extend existing pattern)
```

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Well-documented Next.js Image API, established React state patterns, CSS animations are foundational. All sources are HIGH confidence (official docs, verified community solutions). No additional research needed during planning.
- **Phase 2:** CSS gradient performance and GPU compositing are well-understood. Rune position mapping is data authoring (examining image, encoding coordinates), not research. No additional research needed.

**Validation during implementation:**
- Phase 1: Verify dual-path onLoad pattern with real caching behavior (back-button test mandatory)
- Phase 2: Profile composite layers on real mobile device (Chrome remote debugging or physical test device)

**No research-phase calls needed.** All patterns are verified and confidence is HIGH across all research areas.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All techniques use native Next.js/React/CSS APIs with official documentation. No new dependencies, no version conflicts, no experimental features. CSS @property is Baseline 2024 with 96% support. |
| Features | MEDIUM-HIGH | Table stakes features are grounded in established UX patterns (motion accessibility, progressive enhancement). Competitive features (rune glow) are novel design but built with proven techniques. Anti-features are clearly justified. |
| Architecture | HIGH | Component structure follows existing project patterns (6th client component, CSS in globals.css, Tailwind @theme tokens). Build order has clear dependency chain. All patterns verified in codebase inspection. |
| Pitfalls | HIGH | All critical pitfalls have verified community solutions with GitHub issue references. Recovery strategies are LOW-MEDIUM cost. Pitfall-to-phase mapping ensures prevention during correct phase. |

**Overall confidence:** HIGH

The entire feature set is achievable with zero new dependencies using well-documented browser APIs and CSS features. The onLoad cached-image pitfall is well-known with a proven solution. Performance constraints (GPU layers, text-shadow repaint) have clear limits and fallbacks. All sources are official docs or HIGH-confidence community discussions.

### Gaps to Address

**Rune position mapping:** Research assumes rune locations in the hero image are known or easily identifiable. During Phase 2 planning, the actual coordinates must be determined by examining `/public/images/hero.webp`. If rune positions are ambiguous or the image changes, the glow positions would need recalibration. **Resolution:** Document glow coordinates alongside the image asset; if hero image is updated, glow positions must be reviewed.

**Mobile GPU performance threshold:** Research cites 3-4 composite layers as safe for mobile, but this is device-class dependent. Budget Android devices may struggle at 3 layers; flagship devices handle 5+. **Resolution:** Test on real low-end device (or 4x CPU throttle in DevTools). If performance issues, Phase 2 can reduce to 2-3 glow points or use single-element multi-gradient approach.

**Glow visual intensity tuning:** Research provides ranges (opacity 0.3-0.6, blur radius < 20px, cycle 3-8 seconds) but optimal values depend on actual hero image aesthetics and brand feel. **Resolution:** This is polish, not a gap. Start with research-recommended ranges, iterate based on visual review. No technical blocker.

**Responsive glow positions:** If hero image crops differently at mobile breakpoints (aspect ratio change), glow positions may need breakpoint-specific values. **Resolution:** Explicitly deferred to v2+ as "future consideration." Phase 2 targets desktop/tablet; mobile positions can be adjusted post-launch if needed.

## Sources

### Primary (HIGH confidence)
- [Next.js Image Component API Reference](https://nextjs.org/docs/app/api-reference/components/image) — onLoad, ref, preload, placeholder props and client component requirement
- [vercel/next.js#20368](https://github.com/vercel/next.js/issues/20368) — onLoad event work incorrect (cached image pitfall)
- [vercel/next.js Discussion #18386](https://github.com/vercel/next.js/discussions/18386) — img.complete workaround pattern
- [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — typed custom properties, browser support
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — accessibility requirements
- [web.dev: High-performance CSS animations](https://web.dev/articles/animations-guide) — GPU-composited properties (opacity, transform)
- [TkDodo: Ref Callbacks, React 19 and the Compiler](https://tkdodo.eu/blog/ref-callbacks-react-19-and-the-compiler) — React 19 ref cleanup pattern
- Codebase inspection: `hero.tsx`, `scroll-reveal.tsx`, `globals.css`, `rune-config.ts`

### Secondary (MEDIUM confidence)
- [Smashing Magazine: GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/) — composite layer memory, mobile constraints (2016 but principles valid)
- [Cloud Four: Staggered Animations with CSS Custom Properties](https://cloudfour.com/thinks/staggered-animations-with-css-custom-properties/) — inline custom property stagger pattern
- [Tobias Ahlin: Animate box-shadow with smooth performance](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) — pseudo-element opacity technique
- [Smashing Magazine: YouTube ambient mode glow effect](https://www.smashingmagazine.com/2023/07/recreating-youtube-ambient-mode-glow-effect/) — canvas approach (cited to justify anti-feature decision)
- [vercel/next.js Discussion #54756](https://github.com/vercel/next.js/discussions/54756) — confirms onLoad issue persists in recent versions
- [Medium: Back/Forward Cache Aware Next.js](https://medium.com/better-dev-nextjs-react/back-forward-cache-aware-next-js-03535b6c5fcd) — bfcache event behavior

### Tertiary (LOW confidence)
- [Free Frontend: CSS Hero Sections](https://freefrontend.com/css-hero-sections/) — pattern survey (aggregator, no primary sources)
- [TestMu AI: Glowing Effects in CSS](https://www.testmu.ai/blog/glowing-effects-in-css/) — technique compilation (used for pattern survey only)

---
*Research completed: 2026-02-08*
*Ready for roadmap: yes*
