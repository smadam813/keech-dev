# Nocturnal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform keech.dev from the dusty-rose neobrutalist palette into the petrol-dark nocturnal aesthetic defined in `docs/superpowers/specs/2026-04-18-nocturnal-redesign-design.md`, while keeping the Norse/runic brand, routing structure, Velite content pipeline, and view-count system untouched.

**Architecture:** Rewrite the `@theme` tokens and component styles in CSS-first Tailwind v4 form. Mount a fixed, full-bleed `AmbientBackground` as the first `<body>` child behind the `<Header />` and page content. Add a tag-palette utility that hashes tag strings to six pastel hues. Retouch every card, chip, TOC, page title, and prose rule to read on a translucent dark surface with gold brutalist accents. Keep the MDX pipeline, rune config, routing, and Redis view counting exactly as they are.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4 (`@theme` directive, no `tailwind.config.js`), Velite MDX, Vitest + Playwright, Upstash Redis.

**Source of truth for any ambiguous detail:** the design spec in `docs/superpowers/specs/2026-04-18-nocturnal-redesign-design.md`.

## Execution status (2026-04-19)

Pre-work + Tasks 1–20 shipped on `re-design`. Stopped after Task 20 at user request. Remaining: Tasks 21–28 (project detail, prose, code blocks, footer + MDXFallback sweep, error/404/loading sweep, hero conditional check, unit-test verification, e2e smoke + final build).

Head commit after Task 20 fixes: `d93ebf1` (`fix(post): outer section not article, encode tag href, drop redundant toc sticky`).

Notable follow-ups that landed during execution:
- Task 9 added a `backdrop-filter` `@supports` fallback and extended the `inert` effect to cover `.site-header__brand` so focus cannot escape the open mobile-menu dialog (commit `ad5fe02`).
- Task 20 fixed a nested-`<article>` semantics issue, `encodeURIComponent` on tag hrefs, and removed a redundant `sticky top-24` on the TOC (commit `d93ebf1`).

Known deferred items:
- `.chip--sm` still uses `!important` to outrank Tailwind utilities (Task 8 review flag; plan-level choice).
- `--chip-bg/--chip-fg/--chip-border` custom properties set on every chip are not yet consumed by any CSS selector (Task 8 premature API surface; revisit when a `:hover` rule needs them).
- Hero still gets inset by `.site-main` padding on `/` between Task 4 and an eventual Hero bleed fix; Task 26 is the conditional visual check that would catch this if legibility fails.

---

## Pre-work: read and confirm baseline

- [x] **Step 0.1: Read the design spec end-to-end**

Read: `docs/superpowers/specs/2026-04-18-nocturnal-redesign-design.md`

- [x] **Step 0.2: Verify current branch**

Run:
```bash
git status
git rev-parse --abbrev-ref HEAD
```
Expected: clean working tree, branch is `re-design`.

- [x] **Step 0.3: Verify baseline build works**

Run:
```bash
npm run lint
npm run test -- --run
npm run build
```
Expected: all three succeed. If they don't, stop and fix before touching the redesign.

---

## Task 1: Tag palette utility

**Files:**
- Create: `src/lib/tag-palette.ts`
- Create: `src/lib/tag-palette.test.ts`

Pure function module. Hashes a tag string to one of six pastel hues, returns a stable `{ name, bg, fg, border }` per tag.

- [x] **Step 1.1: Write the failing test**

Write `src/lib/tag-palette.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { TAG_HUE_PALETTE, hashTag, paletteFor } from './tag-palette'

describe('tag-palette', () => {
  it('exposes six named hues in fixed order', () => {
    expect(TAG_HUE_PALETTE.map(h => h.name)).toEqual([
      'rose', 'mint', 'amber', 'lavender', 'teal', 'clay',
    ])
  })

  it('every hue has bg, fg, border strings', () => {
    for (const hue of TAG_HUE_PALETTE) {
      expect(hue.bg).toMatch(/^rgba\(/)
      expect(hue.fg).toMatch(/^#/)
      expect(hue.border).toMatch(/^rgba\(/)
    }
  })

  it('hashTag is deterministic', () => {
    expect(hashTag('react')).toBe(hashTag('react'))
    expect(hashTag('typescript')).toBe(hashTag('typescript'))
  })

  it('hashTag returns a non-negative integer', () => {
    for (const tag of ['', 'a', 'react', 'some-very-long-tag-string']) {
      const h = hashTag(tag)
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
    }
  })

  it('paletteFor returns same palette for same tag', () => {
    expect(paletteFor('react')).toBe(paletteFor('react'))
  })

  it('paletteFor returns one of the six hues', () => {
    const names = new Set(TAG_HUE_PALETTE.map(h => h.name))
    expect(names.has(paletteFor('react').name)).toBe(true)
    expect(names.has(paletteFor('').name)).toBe(true)
  })

  it('paletteFor distributes across hues for a spread of inputs', () => {
    const seen = new Set<string>()
    for (const t of ['react', 'typescript', 'css', 'next', 'mdx', 'norse', 'ai', 'redis']) {
      seen.add(paletteFor(t).name)
    }
    expect(seen.size).toBeGreaterThanOrEqual(3)
  })
})
```

- [x] **Step 1.2: Run the test, confirm it fails**

Run:
```bash
npx vitest run src/lib/tag-palette.test.ts
```
Expected: FAIL — `src/lib/tag-palette` does not exist.

- [x] **Step 1.3: Implement `src/lib/tag-palette.ts`**

Write `src/lib/tag-palette.ts`:

```ts
export interface TagHue {
  name: 'rose' | 'mint' | 'amber' | 'lavender' | 'teal' | 'clay'
  bg: string
  fg: string
  border: string
}

export const TAG_HUE_PALETTE = [
  { name: 'rose',     bg: 'rgba(228, 164, 172, 0.14)', fg: '#e4a4ac', border: 'rgba(228,164,172,0.30)' },
  { name: 'mint',     bg: 'rgba(141, 203, 188, 0.14)', fg: '#8dcbbc', border: 'rgba(141,203,188,0.30)' },
  { name: 'amber',    bg: 'rgba(224, 188, 121, 0.14)', fg: '#e0bc79', border: 'rgba(224,188,121,0.30)' },
  { name: 'lavender', bg: 'rgba(178, 167, 207, 0.14)', fg: '#b2a7cf', border: 'rgba(178,167,207,0.30)' },
  { name: 'teal',     bg: 'rgba(120, 188, 188, 0.14)', fg: '#78bcbc', border: 'rgba(120,188,188,0.30)' },
  { name: 'clay',     bg: 'rgba(207, 145, 125, 0.14)', fg: '#cf917d', border: 'rgba(207,145,125,0.30)' },
] as const satisfies readonly TagHue[]

export function hashTag(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function paletteFor(tag: string): TagHue {
  return TAG_HUE_PALETTE[hashTag(tag) % TAG_HUE_PALETTE.length]
}
```

- [x] **Step 1.4: Run the test, confirm it passes**

Run:
```bash
npx vitest run src/lib/tag-palette.test.ts
```
Expected: PASS.

- [x] **Step 1.5: Commit**

```bash
git add src/lib/tag-palette.ts src/lib/tag-palette.test.ts
git commit -m "feat(style): add per-tag hue palette utility"
```

---

## Task 2: Fonts — add JetBrains Mono

**Files:**
- Modify: `src/lib/fonts.ts`
- Modify: `src/app/layout.tsx`

Spec: add `jetBrainsMono` via `next/font/google`, expose `--font-mono`, wire into `<html>` className alongside `norse` and `inter`.

- [x] **Step 2.1: Update `src/lib/fonts.ts`**

Replace the whole file with:

```ts
import localFont from "next/font/local";
import { Inter, JetBrains_Mono } from "next/font/google";

export const norse = localFont({
  src: [
    {
      path: "../../public/fonts/Norse-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Norse-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Arial", "Helvetica Neue", "sans-serif"],
});

export const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
```

- [x] **Step 2.2: Wire the new font variable into `src/app/layout.tsx`**

Update the import and the `<html>` className.

Change:
```tsx
import { norse, inter } from "@/lib/fonts";
```
to:
```tsx
import { norse, inter, jetBrainsMono } from "@/lib/fonts";
```

Change:
```tsx
<html lang="en" className={`${norse.variable} ${inter.variable}`}>
```
to:
```tsx
<html lang="en" className={`${norse.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
```

- [x] **Step 2.3: Verify build**

Run:
```bash
npm run build
```
Expected: PASS. Next.js compiles a new JetBrains Mono font entry with no warnings.

- [x] **Step 2.4: Commit**

```bash
git add src/lib/fonts.ts src/app/layout.tsx
git commit -m "feat(style): load JetBrains Mono font as --font-mono"
```

---

## Task 3: Rewrite `@theme` tokens in globals.css

**Files:**
- Modify: `src/app/globals.css` (the `@theme` block only; rest stays until later tasks)

Swap the dusty-rose tokens for the petrol palette. Keep semantic names where possible so Tailwind utilities like `bg-background`, `text-foreground`, `text-accent` keep working through this transitional step.

- [x] **Step 3.1: Replace the `@theme` block**

In `src/app/globals.css`, replace the block that currently starts with `@theme {` and runs through the closing `}` (lines 3–25 in the baseline) with:

```css
@theme {
  /* ── Nocturnal petrol palette ─────────────────────────────────────── */
  --color-bg:          #122a32;
  --color-bg-deep:     #0d2128;
  --color-surface:     rgba(22, 46, 54, 0.68);
  --color-surface-hi:  rgba(28, 56, 64, 0.78);
  --color-surface-lo:  rgba(18, 38, 44, 0.55);

  --color-ink:         #e8ecec;
  --color-ink-dim:     #a5b5ba;
  --color-ink-fade:    #7a8e94;

  --color-hair:        rgba(232, 236, 236, 0.10);
  --color-hair-strong: rgba(232, 236, 236, 0.18);

  --color-accent:      #8dcbbc;   /* mint-teal */
  --color-accent-warm: #e4a4ac;   /* rose */
  --color-accent-gold: #e0bc79;   /* runic gold */

  /* ── Back-compat aliases so existing utility classes keep resolving ─ */
  --color-background:    var(--color-bg);
  --color-foreground:    var(--color-ink);
  --color-accent-hover:  var(--color-accent-gold);
  --color-accent-light:  var(--color-accent);
  --color-muted:         var(--color-ink-dim);

  /* ── Brutalist shadows / borders ──────────────────────────────────── */
  --shadow-brutal:       6px 6px 0 0 rgba(0, 0, 0, 0.55);
  --shadow-brutal-lg:    6px 6px 0 0 rgba(0, 0, 0, 0.55);
  --shadow-brutal-hover: 2px 2px 0 0 rgba(0, 0, 0, 0.55);
  --border-brutal:       2px;
  --border-brutal-lg:    2px;

  /* ── Radii / layout ───────────────────────────────────────────────── */
  --radius:    10px;
  --radius-sm: 6px;
  --page-max:  1200px;

  /* ── Animations ───────────────────────────────────────────────────── */
  --animate-fade-in-up: fadeInUp 0.5s ease-out forwards;
}
```

Leave the `@theme inline { --font-display ... --font-body ... }` block alone for now (it is updated in Task 4).

- [x] **Step 3.2: Verify build**

Run:
```bash
npm run build
```
Expected: PASS. The site is now very visually broken (dark tokens behind light surfaces), but nothing should fail to compile.

- [x] **Step 3.3: Commit**

```bash
git add src/app/globals.css
git commit -m "style(theme): switch design tokens to nocturnal petrol palette"
```

---

## Task 4: Base layer + font-mono variable + global chrome

**Files:**
- Modify: `src/app/globals.css` (the `@theme inline` block, `@layer base`, and a new `.prose code` block later)
- Modify: `src/app/layout.tsx` (main padding utility class)

Add `--font-mono` to the `@theme inline` block so `font-mono` Tailwind utilities pick up JetBrains Mono. Set the body background to the new bg token. Give `<main>` the page-max horizontal padding and `z-index: 1` so content floats above the ambient background that lands in Task 5.

- [x] **Step 4.1: Extend `@theme inline`**

In `src/app/globals.css`, replace the existing block:

```css
@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
}
```
with:
```css
@theme inline {
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);
}
```

- [x] **Step 4.2: Update the `@layer base` html + body rules**

In `src/app/globals.css`, replace the `html { ... }` rule inside `@layer base` with:

```css
html {
  @apply font-body text-foreground antialiased;
  background-color: var(--color-bg);
  color: var(--color-ink);
  overflow-y: scroll;
  overscroll-behavior: none;
}

body {
  background-color: transparent; /* ambient bg paints the canvas */
  color: var(--color-ink);
  min-height: 100dvh;
}
```

Keep the existing `h1`–`h6` rules and Norse typography tuning inside `@layer base` unchanged.

- [x] **Step 4.3: Add a `.site-main` utility**

Still inside `src/app/globals.css`, add a new block under `@layer components` (can go right after the `@keyframes` section but before the `.animate-fade-in-up` rule):

```css
@layer components {
  /* Page content sits above the ambient background and auto-gutters to --page-max.
     Hero bypasses this via its own full-bleed section. */
  .site-main {
    position: relative;
    z-index: 1;
    padding: 24px max(24px, calc((100vw - var(--page-max)) / 2)) 96px;
  }
}
```

- [x] **Step 4.4: Wire `site-main` on `<main>`**

In `src/app/layout.tsx`, change:
```tsx
<main className="flex-1 flex flex-col pt-16">
```
to:
```tsx
<main className="site-main flex-1 flex flex-col pt-16">
```

- [x] **Step 4.5: Verify build**

Run:
```bash
npm run build
```
Expected: PASS.

- [x] **Step 4.6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "style(layout): wire mono font var, dark html/body, site-main gutter"
```

---

## Task 5: AmbientBackground component + mount

**Files:**
- Create: `src/components/layout/ambient-background.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (add `.ambient-*` component rules)

Fixed full-bleed layered watermark: hero image, color wash, gradient wash, vignette, film grain. Server component. Mounts once as first child of `<body>`, sits at `z-index: 0`, `aria-hidden`, `pointer-events: none`.

- [x] **Step 5.1: Add ambient styles to `globals.css`**

Inside `@layer components` in `src/app/globals.css`, add:

```css
.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: var(--color-bg);
  overflow: hidden;
}

.ambient__art {
  position: absolute;
  inset: 0;
  background-image: url('/images/hero.webp');
  background-size: cover;
  background-position: center;
  filter: saturate(0.85);
}

.ambient__wash {
  position: absolute;
  inset: 0;
  background-color: rgba(14, 28, 33, 0.55);
  mix-blend-mode: multiply;
}

.ambient__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(20, 38, 45, 0.55) 0%,
    rgba(20, 38, 45, 0.35) 40%,
    rgba(18, 34, 40, 0.65) 100%
  );
}

.ambient__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 120% 80% at 50% 40%,
    transparent 0%,
    transparent 40%,
    rgba(10, 20, 24, 0.6) 100%
  );
}

.ambient__grain {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 160px 160px;
}
```

- [x] **Step 5.2: Create `src/components/layout/ambient-background.tsx`**

```tsx
// Fixed full-bleed watermark: hero art + color wash + gradient + vignette + grain.
// Purely decorative — aria-hidden, pointer-events none, z-index 0.
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="ambient">
      <div className="ambient__art" />
      <div className="ambient__wash" />
      <div className="ambient__gradient" />
      <div className="ambient__vignette" />
      <div className="ambient__grain" />
    </div>
  )
}
```

- [x] **Step 5.3: Mount it in `src/app/layout.tsx`**

Add the import alongside the others:
```tsx
import { AmbientBackground } from "@/components/layout/ambient-background";
```

Make `<AmbientBackground />` the very first child of `<body>`, before `<Header />`:

```tsx
<body className="min-h-dvh flex flex-col">
  <AmbientBackground />
  <Header />
  <main className="site-main flex-1 flex flex-col pt-16">
    {children}
  </main>
  <Footer />
  <Analytics />
</body>
```

- [x] **Step 5.4: Walkthrough**

Run:
```bash
npm run dev
```
Open `http://localhost:3000/blog`. Expected: hero image is visible behind the (still-broken) blog listing, with the color wash, gradient, vignette, and a faint grain. Scroll — ambient stays fixed. Stop the dev server (`Ctrl+C`).

- [x] **Step 5.5: Commit**

```bash
git add src/components/layout/ambient-background.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat(layout): add fixed ambient hero watermark behind all routes"
```

---

## Task 6: Rune glow alpha re-tune

**Files:**
- Modify: `src/app/globals.css` (the three `.rune-glow--*` rules)

Spec: inner alphas drop from `0.69` to `0.55` to compensate for the darker bg. `--glow-opacity: 0.5` stays. Hex values unchanged.

- [x] **Step 6.1: Update the three gradients**

In `src/app/globals.css`, replace the three existing `.rune-glow--amber / --teal / --gold` rules with:

```css
.rune-glow--amber {
  background: radial-gradient(circle, rgba(217, 164, 65, 0.55) 0%, rgba(217, 164, 65, 0) 70%);
  --glow-opacity: 0.5;
}

.rune-glow--teal {
  background: radial-gradient(circle, rgba(79, 191, 191, 0.55) 0%, rgba(79, 191, 191, 0) 70%);
  --glow-opacity: 0.5;
}

.rune-glow--gold {
  background: radial-gradient(circle, rgba(232, 213, 149, 0.55) 0%, rgba(232, 213, 149, 0) 70%);
  --glow-opacity: 0.5;
}
```

- [x] **Step 6.2: Commit**

```bash
git add src/app/globals.css
git commit -m "style(hero): drop rune-glow alpha from 0.69 to 0.55 for dark bg"
```

---

## Task 7: Shared utility classes — page-title, eyebrow, section-head, btn, tag-bar, grids

**Files:**
- Modify: `src/app/globals.css` (add a new `@layer components` block)

Adds the reusable visual primitives the page-level tasks consume later: page title, eyebrow pill, section head, button variants, tag bar, post-detail grid, about grid, home-below-hero wrapper, back-link style.

- [x] **Step 7.1: Append component rules**

Inside `@layer components` in `src/app/globals.css`, add (toward the bottom, before the prose section):

```css
/* ── Display helpers ─────────────────────────────────────────────── */
.display {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(80px, 14vw, 180px);
  line-height: 0.95;
  letter-spacing: -0.02em;
}

.page-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(42px, 6vw, 72px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--color-ink);
  margin: 0 0 20px;
}

.page-title__rune {
  display: inline-block;
  margin-right: 0.35em;
  font-size: 0.65em;
  color: var(--color-accent-gold);
  opacity: 0.75;
  vertical-align: baseline;
}

/* ── Eyebrow pill ───────────────────────────────────────────────── */
.eyebrow {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent-gold);
  background: var(--color-surface-lo);
  border: 1px solid var(--color-hair);
  border-radius: 999px;
  padding: 4px 12px;
}

/* ── Section head (baseline row: rune + title + more) ──────────── */
.section-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 40px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-hair);
}

.section-head__rune {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--color-accent-gold);
  line-height: 1;
}

.section-head__title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
  flex: 1;
}

.section-head__more {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-dim);
  transition: color 160ms ease;
}

.section-head__more:hover {
  color: var(--color-accent);
}

/* ── Buttons ────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  border: var(--border-brutal) solid var(--color-accent-gold);
  background: var(--color-surface-hi);
  color: var(--color-ink);
  box-shadow: var(--shadow-brutal);
  transition: transform 160ms ease, box-shadow 160ms ease, color 160ms ease, background 160ms ease;
  cursor: pointer;
}

.btn:hover {
  box-shadow: var(--shadow-brutal-hover);
  transform: translate(4px, 4px);
}

.btn--primary {
  background: var(--color-accent);
  color: var(--color-bg-deep);
}

.btn--ghost {
  background: transparent;
}

.btn__rune {
  color: var(--color-accent-gold);
  font-family: var(--font-display);
  font-weight: 700;
}

.btn--primary .btn__rune {
  color: var(--color-bg-deep);
}

/* ── Tag bar / filter wrapper ───────────────────────────────────── */
.tag-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 12px 0 20px;
}

.filter-status {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-ink-dim);
  margin: 0 0 20px;
}

/* ── Back link ──────────────────────────────────────────────────── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-dim);
  margin-bottom: 28px;
  transition: color 160ms ease;
}

.back-link:hover { color: var(--color-accent); }

/* ── Home below-hero layout ────────────────────────────────────── */
.home-below-hero {
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 48px 24px 24px;
}

.home-lede {
  font-family: var(--font-body);
  font-size: 19px;
  line-height: 1.6;
  color: var(--color-ink-dim);
  max-width: 640px;
  margin: 32px 0 0;
}

.home-ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 32px 0 56px;
}

/* ── Post / project detail grid ────────────────────────────────── */
.post-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 48px;
}

@media (max-width: 900px) {
  .post-detail__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.post-detail__main {
  border: var(--border-brutal) solid var(--color-accent-gold);
  border-radius: 4px;
  background: var(--color-surface-hi);
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow-brutal);
  padding: 40px 44px 36px;
  max-width: 740px;
}

.post-detail__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-ink-dim);
  margin: 14px 0 18px;
}

.post-detail__meta-sep {
  color: var(--color-accent-gold);
  font-family: var(--font-display);
  font-weight: 700;
}

.post-detail__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(32px, 4.5vw, 52px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--color-ink);
  margin: 0;
}

.post-detail__toc {
  position: sticky;
  top: 96px;
  align-self: start;
}

/* ── About grid ─────────────────────────────────────────────────── */
.about__grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}

@media (max-width: 760px) {
  .about__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.about__portrait {
  border: var(--border-brutal) solid var(--color-accent-gold);
  border-radius: 4px;
  background: var(--color-surface-hi);
  box-shadow: var(--shadow-brutal);
  overflow: hidden;
  aspect-ratio: 3 / 4;
  position: relative;
}

.about__lede {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.25;
  color: var(--color-ink);
  margin: 0 0 16px;
}

.about__list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}

.about__list li {
  position: relative;
  padding-left: 28px;
  margin-bottom: 10px;
  color: var(--color-ink);
  line-height: 1.6;
}

.about__list li::before {
  content: var(--rune, '\16A8');
  font-family: var(--font-display);
  color: var(--color-accent-gold);
  position: absolute;
  left: 0;
  opacity: 0.85;
}
```

- [x] **Step 7.2: Verify build**

Run:
```bash
npm run build
```
Expected: PASS.

- [x] **Step 7.3: Commit**

```bash
git add src/app/globals.css
git commit -m "style(globals): add page-title, eyebrow, section-head, btn, grid utilities"
```

---

## Task 8: FilterChip — per-tag hue + mono pill + variants

**Files:**
- Modify: `src/components/ui/filter-chip.tsx`
- Modify: `src/components/ui/filter-chip.test.tsx` (only if assertions fail)

Use `paletteFor(label)` to hash each tag to a hue. Keep the three modes (toggle / link / display). Add `chip--sm` and `chip--clear` variants. Preserve `aria-pressed`, `role=button`, and the count badge — the existing unit tests must keep passing untouched.

- [x] **Step 8.1: Replace `src/components/ui/filter-chip.tsx`**

```tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { paletteFor } from '@/lib/tag-palette'

interface FilterChipProps {
  label: string
  href?: string
  active?: boolean
  onToggle?: () => void
  count?: number
  className?: string
  variant?: 'default' | 'sm' | 'clear'
}

function chipStyle(label: string, active?: boolean, variant: FilterChipProps['variant'] = 'default') {
  const hue = paletteFor(label)
  const base = {
    '--chip-bg': hue.bg,
    '--chip-fg': hue.fg,
    '--chip-border': hue.border,
  } as React.CSSProperties

  if (active) {
    return {
      ...base,
      backgroundColor: hue.fg,
      color: 'var(--color-bg-deep)',
      borderColor: hue.fg,
    }
  }

  if (variant === 'clear') {
    return {
      backgroundColor: 'transparent',
      color: 'var(--color-ink-dim)',
      borderColor: 'var(--color-hair-strong)',
    }
  }

  return {
    ...base,
    backgroundColor: hue.bg,
    color: hue.fg,
    borderColor: hue.border,
  }
}

export function FilterChip({
  label, href, active, onToggle, count, className, variant = 'default',
}: FilterChipProps) {
  const sizeCls = variant === 'sm' ? 'chip--sm' : ''
  const baseCls = cn(
    'chip inline-flex items-center gap-1 rounded-full border font-mono font-medium',
    'px-3 py-1 text-xs uppercase tracking-[0.08em]',
    'transition-transform transition-colors duration-[160ms]',
    sizeCls,
    className,
  )

  const style = chipStyle(label, active, variant)

  if (onToggle) {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={cn(baseCls, 'hover:-translate-y-[1px] cursor-pointer')}
        style={style}
      >
        <span>{label}</span>
        {count !== undefined && <span className="opacity-60">({count})</span>}
      </button>
    )
  }

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseCls, 'hover:-translate-y-[1px]')}
        style={style}
      >
        {label}
      </Link>
    )
  }

  return (
    <span className={baseCls} style={style}>
      {label}
    </span>
  )
}
```

Also add this at the bottom of `src/app/globals.css` in `@layer components` to give the `.chip--sm` variant a smaller footprint:

```css
.chip--sm { padding: 2px 8px !important; font-size: 11px !important; }
```

- [x] **Step 8.2: Run existing unit tests**

Run:
```bash
npx vitest run src/components/ui/filter-chip.test.tsx
```
Expected: PASS — the existing tests assert roles, `aria-pressed`, count text, and `onToggle` firing; none of those changed.

If any assertion fails, fix the source (don't dilute the test). The one realistic failure mode is if the `(5)` count is wrapped differently — in this implementation it is still a direct child `<span>` so `getByText('(5)')` will keep matching.

- [x] **Step 8.3: Visual check via dev server**

Run:
```bash
npm run dev
```
Open `/blog`. Expected: tag chips render as small rounded pills in pastel hues (rose / mint / amber / lavender / teal / clay) on the dark background. Active chips fill with their hue and use near-black text. Stop the server.

- [x] **Step 8.4: Commit**

```bash
git add src/components/ui/filter-chip.tsx src/app/globals.css
git commit -m "feat(chip): per-tag pastel hue via paletteFor, pill shape, sm + clear variants"
```

---

## Task 9: Header — glassy backdrop + Othala wordmark + mobile menu

**Files:**
- Modify: `src/components/layout/header.tsx`
- Modify: `src/app/globals.css` (add `.site-header*` rules)

Glassy blurred shell that floats over the ambient bg. Desktop keeps nav-rune chars with the label. Mobile menu uses a dark translucent sheet, not the inverted scheme.

- [x] **Step 9.1: Add header rules to `globals.css`**

Inside `@layer components`:

```css
.site-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
  background-color: rgba(13, 33, 40, 0.72);
  border-bottom: 1px solid var(--color-hair);
}

.site-header__inner {
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-header__brand {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  color: var(--color-ink);
}

.site-header__brand-rune {
  font-size: 24px;
  color: var(--color-accent-gold);
}

.site-header__brand-dot {
  color: var(--color-accent);
}

.site-nav {
  display: none;
  gap: 28px;
}

@media (min-width: 768px) { .site-nav { display: flex; } }

.site-nav__link {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-dim);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  transition: background 160ms ease, color 160ms ease;
}

.site-nav__link:hover { background: var(--color-hair); color: var(--color-ink); }
.site-nav__link--active { color: var(--color-ink); }

.site-nav__rune {
  display: inline-block;
  margin-right: 6px;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-accent-gold);
  opacity: 0.8;
}

.site-hamburger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-hair-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-hi);
  color: var(--color-ink);
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.site-hamburger:hover { transform: translateY(-1px); }

@media (min-width: 768px) { .site-hamburger { display: none; } }

.site-mobile-menu {
  position: fixed;
  top: 64px; left: 0; right: 0;
  background: rgba(13, 33, 40, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--color-hair);
  border-bottom: 1px solid var(--color-hair);
  transition: opacity 200ms ease, visibility 200ms ease;
}

.site-mobile-menu__nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px 0;
}

.site-mobile-menu__link {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 28px;
  color: var(--color-ink);
}

.site-mobile-menu__link--active { color: var(--color-accent); }
```

- [x] **Step 9.2: Rewrite `src/components/layout/header.tsx`**

Replace the file content with:

```tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_RUNES, ELDER_FUTHARK } from '@/components/runes/rune-config'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const [menuPathname, setMenuPathname] = useState<string | null>(null)
  const pathname = usePathname()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const prevIsOpenRef = useRef(false)

  const isOpen = menuPathname !== null && menuPathname === pathname

  const isActive = useCallback(
    (href: string) =>
      pathname === href || (href !== '/' && pathname.startsWith(href)),
    [pathname]
  )

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  useEffect(() => {
    const main = document.querySelector('main')
    if (isOpen) main?.setAttribute('inert', '')
    else main?.removeAttribute('inert')
    return () => { main?.removeAttribute('inert') }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuPathname(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  useEffect(() => {
    if (prevIsOpenRef.current && !isOpen) buttonRef.current?.focus()
    prevIsOpenRef.current = isOpen
  }, [isOpen])

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="keech.dev home">
          <span aria-hidden="true" className="site-header__brand-rune">
            {ELDER_FUTHARK.othala.char}
          </span>
          <span>
            keech<span className="site-header__brand-dot">.dev</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'site-nav__link',
                isActive(item.href) && 'site-nav__link--active',
              )}
            >
              <span aria-hidden="true" className="site-nav__rune">
                {NAV_RUNES[item.href as keyof typeof NAV_RUNES]?.char}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMenuPathname(prev => prev === pathname ? null : pathname)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="site-hamburger"
        >
          {isOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'site-mobile-menu md:hidden',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
        )}
      >
        <nav className="site-mobile-menu__nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuPathname(null)}
              className={cn(
                'site-mobile-menu__link',
                isActive(item.href) && 'site-mobile-menu__link--active',
              )}
            >
              <span aria-hidden="true" className="site-nav__rune">
                {NAV_RUNES[item.href as keyof typeof NAV_RUNES]?.char}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
```

- [x] **Step 9.3: Run the existing mobile-menu e2e (optional but cheap)**

Run:
```bash
npx playwright test e2e/mobile-menu.spec.ts --reporter=line
```
Expected: PASS. The aria attributes, labels, and menu dialog role are preserved. If it's environment-failing for unrelated reasons (no browsers installed, etc.), note it and continue.

- [x] **Step 9.4: Commit**

```bash
git add src/components/layout/header.tsx src/app/globals.css
git commit -m "feat(header): glassy nocturnal shell with Othala wordmark"
```

---

## Task 10: PostCard — dark brutalist with gold border

**Files:**
- Modify: `src/components/blog/post-card.tsx`
- Modify: `src/app/globals.css` (add `.card*` rules)

Translucent dark surface, 2px gold border, 6px hard-offset shadow, collapse-on-hover motion. Jera rune separators in the meta row. Keep `PostCardViewCount`, `FilterChip`, `formatDate` wiring intact.

- [x] **Step 10.1: Add card rules to `globals.css`**

Inside `@layer components`:

```css
.card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: var(--border-brutal) solid var(--color-accent-gold);
  border-radius: 4px;
  background: var(--color-surface-hi);
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow-brutal);
  transition: transform 150ms ease, box-shadow 150ms ease;
  padding: 24px;
}

.card:hover {
  box-shadow: var(--shadow-brutal-hover);
  transform: translate(4px, 4px);
}

.card--img { padding: 0; overflow: hidden; }
.card--img .card__body { padding: 24px; display: flex; flex-direction: column; flex: 1; }

.card__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  line-height: 1.2;
  color: var(--color-ink);
  margin: 0 0 10px;
  transition: color 160ms ease;
}

.card:hover .card__title { color: var(--color-accent); }

.card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-ink-dim);
  margin-bottom: 14px;
}

.card__meta-sep {
  color: var(--color-accent-gold);
  font-family: var(--font-display);
  font-weight: 700;
}

.card__excerpt {
  color: var(--color-ink-dim);
  line-height: 1.6;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}
```

- [x] **Step 10.2: Rewrite `src/components/blog/post-card.tsx`**

```tsx
import Link from 'next/link'
import { FilterChip } from '@/components/ui/filter-chip'
import { POST_RUNES } from '@/components/runes/rune-config'
import { PostCardViewCount } from './listing-view-counts'
import { formatDate } from '@/lib/format'

interface PostCardProps {
  post: {
    title: string
    slug: string
    date: string
    description?: string
    excerpt: string
    tags: string[]
    readingTime: number
  }
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = formatDate(post.date)

  return (
    <Link href={`/blog/${post.slug}`} className="block h-full group">
      <article className="card">
        <header>
          <h2 className="card__title">{post.title}</h2>
          <div className="card__meta">
            <time dateTime={post.date}>{formattedDate}</time>
            <span aria-hidden="true" className="card__meta-sep">{POST_RUNES.separator.char}</span>
            <span>{post.readingTime} min read</span>
            <span aria-hidden="true" className="card__meta-sep">{POST_RUNES.separator.char}</span>
            <PostCardViewCount slug={post.slug} />
          </div>
        </header>

        <p className="card__excerpt">{post.description || post.excerpt}</p>

        {post.tags.length > 0 && (
          <div className="card__tags">
            {post.tags.map((tag) => (
              <FilterChip key={tag} label={tag} variant="sm" />
            ))}
          </div>
        )}
      </article>
    </Link>
  )
}
```

- [x] **Step 10.3: Build + dev walkthrough**

Run:
```bash
npm run build
```
Expected: PASS.

- [x] **Step 10.4: Commit**

```bash
git add src/components/blog/post-card.tsx src/app/globals.css
git commit -m "feat(post-card): dark brutalist surface with gold border + jera meta"
```

---

## Task 11: ProjectCard — dark brutalist + Kenaz badge + category eyebrow + stack overflow

**Files:**
- Modify: `src/components/projects/project-card.tsx`
- Modify: `src/app/globals.css` (append `.project-card*` rules)

Same Brutalist card frame as PostCard plus: optional `category` eyebrow, a Kenaz rune badge in the corner, first-6 stack entries with `+N` overflow, and a Live/Source/Read hover affordance row. Retain optional top image.

- [x] **Step 11.1: Append project-card rules to `globals.css`**

```css
.project-card { position: relative; overflow: hidden; padding: 0; }
.project-card__image {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  border-bottom: 1px solid var(--color-hair);
  overflow: hidden;
}
.project-card__body {
  display: flex;
  flex-direction: column;
  padding: 24px;
  flex: 1;
}
.project-card__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 22px;
  color: var(--color-accent-gold);
  opacity: 0.8;
  line-height: 1;
}
.project-card__eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent-gold);
  margin-bottom: 8px;
}
.project-card__stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 14px;
}
.project-card__stack-more {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-ink-fade);
  align-self: center;
}
.project-card__actions {
  display: flex;
  gap: 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-ink-dim);
}
.project-card__actions span { display: inline-flex; align-items: center; gap: 6px; }
.group:hover .project-card__actions { color: var(--color-accent); }
```

- [x] **Step 11.2: Rewrite `src/components/projects/project-card.tsx`**

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, BookOpen } from 'lucide-react'
import { GithubIcon } from '@/components/icons/brand-icons'
import { FilterChip } from '@/components/ui/filter-chip'
import { ELDER_FUTHARK } from '@/components/runes/rune-config'

interface ProjectCardProps {
  project: {
    title: string
    slug: string
    description: string
    stack: string[]
    github?: string
    demo?: string
    category?: 'side-project' | 'professional' | 'open-source'
    image?: { src: string }
  }
}

const CATEGORY_LABEL: Record<NonNullable<ProjectCardProps['project']['category']>, string> = {
  'side-project': 'Side project',
  'professional': 'Professional',
  'open-source':  'Open source',
}

export function ProjectCard({ project }: ProjectCardProps) {
  const shownStack = project.stack.slice(0, 6)
  const extraStack = project.stack.length - shownStack.length

  return (
    <Link href={`/projects/${project.slug}`} className="block group h-full">
      <article className={`card project-card ${project.image ? 'card--img' : ''}`}>
        <span aria-hidden="true" className="project-card__badge">
          {ELDER_FUTHARK.kenaz.char}
        </span>

        {project.image && (
          <div className="project-card__image">
            <Image
              src={project.image.src}
              alt={`${project.title} screenshot`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="project-card__body">
          {project.category && (
            <div className="project-card__eyebrow">
              {CATEGORY_LABEL[project.category]}
            </div>
          )}
          <header>
            <h2 className="card__title">{project.title}</h2>
          </header>

          <p className="card__excerpt">{project.description}</p>

          {shownStack.length > 0 && (
            <div className="project-card__stack">
              {shownStack.map((tech) => (
                <FilterChip key={tech} label={tech} variant="sm" />
              ))}
              {extraStack > 0 && (
                <span className="project-card__stack-more">+{extraStack}</span>
              )}
            </div>
          )}

          <div className="project-card__actions">
            {project.demo && (
              <span><ExternalLink size={14} /><span>Live</span></span>
            )}
            {project.github && (
              <span><GithubIcon size={14} /><span>Source</span></span>
            )}
            <span><BookOpen size={14} /><span>Read</span></span>
          </div>
        </div>
      </article>
    </Link>
  )
}
```

- [x] **Step 11.3: Build check**

Run:
```bash
npm run build
```
Expected: PASS.

- [x] **Step 11.4: Commit**

```bash
git add src/components/projects/project-card.tsx src/app/globals.css
git commit -m "feat(project-card): dark brutalist with kenaz badge, category eyebrow, action row"
```

---

## Task 12: LatestWriting section

**Files:**
- Create: `src/components/home/latest-writing.tsx`

Server component. Reads `posts` from `@/.velite`, filters out drafts, sorts by date desc, slices 3, renders a `.section-head` + 3-col `PostCard` grid.

- [x] **Step 12.1: Create the component**

```tsx
import Link from 'next/link'
import { posts } from '@/.velite'
import { PostCard } from '@/components/blog/post-card'
import { POST_RUNES } from '@/components/runes/rune-config'

export function LatestWriting() {
  const latest = [...posts]
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  if (latest.length === 0) return null

  return (
    <section className="mt-8">
      <div className="section-head">
        <span aria-hidden="true" className="section-head__rune">
          {POST_RUNES.separator.char}
        </span>
        <h2 className="section-head__title">Latest writing</h2>
        <Link href="/blog" className="section-head__more">All posts →</Link>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {latest.map(post => (
          <PostCard
            key={post.slug}
            post={{
              title: post.title,
              slug: post.slug,
              date: post.date,
              description: post.description,
              excerpt: post.excerpt,
              tags: post.tags,
              readingTime: post.readingTime,
            }}
          />
        ))}
      </div>
    </section>
  )
}
```

- [x] **Step 12.2: Commit**

```bash
git add src/components/home/latest-writing.tsx
git commit -m "feat(home): add LatestWriting server component"
```

---

## Task 13: Home page — hero + lede + CTAs + LatestWriting

**Files:**
- Modify: `src/app/page.tsx`

- [x] **Step 13.1: Rewrite**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/hero'
import { LatestWriting } from '@/components/home/latest-writing'
import { ELDER_FUTHARK } from '@/components/runes/rune-config'

export const metadata: Metadata = {
  description: 'Welcome to keech.dev - the personal portfolio and blog of Adam Keech, a software developer passionate about building tools and exploring technology.',
}

export default function Home() {
  return (
    <>
      <Hero />
      <section className="home-below-hero">
        <p className="home-lede">
          Notes on engineering, AI, and what it means to build software while
          the discipline itself is being rewritten.
        </p>
        <div className="home-ctas">
          <Link href="/blog" className="btn btn--primary">
            <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.ansuz.char}</span>
            Read the blog
          </Link>
          <Link href="/projects" className="btn btn--ghost">
            <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.kenaz.char}</span>
            See projects
          </Link>
        </div>
        <LatestWriting />
      </section>
    </>
  )
}
```

- [x] **Step 13.2: Build check**

Run:
```bash
npm run build
```
Expected: PASS. Home now has lede + CTAs + "Latest writing" below the hero.

- [x] **Step 13.3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): add lede, CTAs, and LatestWriting section below hero"
```

---

## Task 14: Blog listing page

**Files:**
- Modify: `src/app/blog/page.tsx`
- Modify: `src/components/blog/filtered-post-list.tsx` (update the empty-state and filter-status styles only)

Replace the `<h1>` with `.page-title` + Ansuz rune. Wrap the filter row in `.tag-bar`. Dark-theme the empty state.

- [x] **Step 14.1: Update `src/app/blog/page.tsx`**

```tsx
import { Suspense } from 'react'
import { FilteredPostList } from '@/components/blog/filtered-post-list'
import { publishedPosts } from '@/lib/posts'
import { BLOG_RUNES } from '@/components/runes/rune-config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical articles, tutorials, and thoughts on software development, web technologies, and the craft of building things.',
}

export default function BlogPage() {
  const sortedPosts = [...publishedPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const allTags = [...new Set(sortedPosts.flatMap(p => p.tags))].sort()

  return (
    <section className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <h1 className="page-title">
        <span aria-hidden="true" className="page-title__rune">{BLOG_RUNES.bullet.char}</span>
        Blog
      </h1>
      <p className="home-lede" style={{ marginTop: 0 }}>
        Writing on software, AI tooling, and the craft of building.
      </p>
      <Suspense>
        <FilteredPostList posts={sortedPosts} allTags={allTags} />
      </Suspense>
    </section>
  )
}
```

- [x] **Step 14.2: Update `src/components/blog/filtered-post-list.tsx` empty-state + status classes**

Replace the `isFiltering` paragraph and the empty-state block. Final file body (changes are only in the two identified regions):

```tsx
'use client'

import { useMemo } from 'react'
import { FilterBar } from '@/components/ui/filter-bar'
import { FilterChip } from '@/components/ui/filter-chip'
import { useFilteredList } from '@/hooks/use-filtered-list'
import { PostCard } from './post-card'
import { ListingViewCounts } from './listing-view-counts'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { cn } from '@/lib/utils'

interface FilteredPostListProps {
  posts: Array<{
    title: string
    slug: string
    date: string
    description?: string
    excerpt: string
    tags: string[]
    readingTime: number
  }>
  allTags: string[]
}

export function FilteredPostList({ posts, allTags }: FilteredPostListProps) {
  const {
    filteredItems: filteredPosts,
    activeFilters: activeTags,
    isFiltering,
    isPending,
    filterCounts: tagCounts,
    handleToggle,
    handleClear,
  } = useFilteredList({
    items: posts,
    allFilterValues: allTags,
    getItemValues: (post) => post.tags,
    paramName: 'tags',
  })

  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts])

  return (
    <ListingViewCounts slugs={allSlugs}>
      <div className="tag-bar">
        <FilterBar
          items={allTags}
          activeItems={activeTags}
          onToggle={handleToggle}
          onClear={handleClear}
          counts={tagCounts}
          renderChip={({ item, active, onToggle, count }) => (
            <FilterChip key={item} label={item} active={active} onToggle={onToggle} count={count} />
          )}
          label="Filter by tag"
        />
      </div>
      {isFiltering && (
        <p className="filter-status">
          Showing {filteredPosts.length} of {posts.length} posts
        </p>
      )}
      {filteredPosts.length > 0 ? (
        <div className={cn(
          'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
          'transition-opacity duration-200 filter-grid-fade',
          isPending ? 'opacity-0' : 'opacity-100'
        )}>
          {filteredPosts.map((post) =>
            isFiltering ? (
              <PostCard key={post.slug} post={post} />
            ) : (
              <ScrollReveal key={post.slug}>
                <PostCard post={post} />
              </ScrollReveal>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="filter-status" style={{ marginBottom: 16 }}>
            No posts match the selected tags.
          </p>
          <button type="button" onClick={handleClear} className="btn btn--ghost">
            Clear filters
          </button>
        </div>
      )}
    </ListingViewCounts>
  )
}
```

- [x] **Step 14.3: Commit**

```bash
git add src/app/blog/page.tsx src/components/blog/filtered-post-list.tsx
git commit -m "feat(blog): nocturnal listing page with page-title, tag-bar, dark empty state"
```

---

## Task 15: Projects listing page

**Files:**
- Modify: `src/app/projects/page.tsx`
- Modify: `src/components/projects/filtered-project-list.tsx` (empty-state/status only)

- [x] **Step 15.1: Update `src/app/projects/page.tsx`**

```tsx
import { Suspense } from 'react'
import { projects } from '@/.velite'
import { FilteredProjectList } from '@/components/projects/filtered-project-list'
import { NAV_RUNES } from '@/components/runes/rune-config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'A showcase of software projects, open source contributions, and side projects built by Adam Keech.',
}

export default function ProjectsPage() {
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  const allStack = [...new Set(sortedProjects.flatMap(p => p.stack))].sort()

  return (
    <section className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <h1 className="page-title">
        <span aria-hidden="true" className="page-title__rune">{NAV_RUNES['/projects'].char}</span>
        Projects
      </h1>
      <p className="home-lede" style={{ marginTop: 0 }}>
        Selected work — side projects, open-source bits, and things I ship when nobody asked.
      </p>
      <Suspense>
        <FilteredProjectList projects={sortedProjects} allStack={allStack} />
      </Suspense>
    </section>
  )
}
```

- [x] **Step 15.2: Update `src/components/projects/filtered-project-list.tsx`**

Replace the file with the same treatment applied to the blog list (tag-bar wrapper, `.filter-status`, `.btn--ghost` clear):

```tsx
'use client'

import { FilterBar } from '@/components/ui/filter-bar'
import { FilterChip } from '@/components/ui/filter-chip'
import { useFilteredList } from '@/hooks/use-filtered-list'
import { ProjectCard } from './project-card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { cn } from '@/lib/utils'

interface FilteredProjectListProps {
  projects: Array<{
    title: string
    slug: string
    description: string
    stack: string[]
    github?: string
    demo?: string
    category?: 'side-project' | 'professional' | 'open-source'
    image?: { src: string }
  }>
  allStack: string[]
}

export function FilteredProjectList({ projects, allStack }: FilteredProjectListProps) {
  const {
    filteredItems: filteredProjects,
    activeFilters: activeStack,
    isFiltering,
    isPending,
    filterCounts: stackCounts,
    handleToggle,
    handleClear,
  } = useFilteredList({
    items: projects,
    allFilterValues: allStack,
    getItemValues: (project) => project.stack,
    paramName: 'stack',
  })

  return (
    <>
      <div className="tag-bar">
        <FilterBar
          items={allStack}
          activeItems={activeStack}
          onToggle={handleToggle}
          onClear={handleClear}
          counts={stackCounts}
          renderChip={({ item, active, onToggle, count }) => (
            <FilterChip key={item} label={item} active={active} onToggle={onToggle} count={count} />
          )}
          label="Filter by technology"
        />
      </div>
      {isFiltering && (
        <p className="filter-status">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      )}
      {filteredProjects.length > 0 ? (
        <div className={cn(
          'grid gap-6 md:grid-cols-2',
          'transition-opacity duration-200 filter-grid-fade',
          isPending ? 'opacity-0' : 'opacity-100'
        )}>
          {filteredProjects.map((project) =>
            isFiltering ? (
              <ProjectCard key={project.slug} project={project} />
            ) : (
              <ScrollReveal key={project.slug}>
                <ProjectCard project={project} />
              </ScrollReveal>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="filter-status" style={{ marginBottom: 16 }}>
            No projects match the selected technologies.
          </p>
          <button type="button" onClick={handleClear} className="btn btn--ghost">
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
```

- [x] **Step 15.3: Commit**

```bash
git add src/app/projects/page.tsx src/components/projects/filtered-project-list.tsx
git commit -m "feat(projects): nocturnal listing with kenaz page-title and dark empty state"
```

---

## Task 16: FilterBar empty-state / clear-all restyle

**Files:**
- Modify: `src/components/ui/filter-bar.tsx`

The `Clear all` button inside FilterBar currently uses `bg-white border-black`. Replace with `.btn--ghost` so it reads on the dark bg.

- [x] **Step 16.1: Replace the button**

```tsx
{hasActive && (
  <button
    type="button"
    onClick={onClear}
    className="btn btn--ghost"
    style={{ padding: '4px 12px', fontSize: 11 }}
  >
    Clear all
  </button>
)}
```

- [x] **Step 16.2: Commit**

```bash
git add src/components/ui/filter-bar.tsx
git commit -m "style(filter-bar): dark clear-all button to match nocturnal palette"
```

---

## Task 17: About page

**Files:**
- Modify: `src/app/about/page.tsx`

- [x] **Step 17.1: Rewrite**

```tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NAV_RUNES, ELDER_FUTHARK } from '@/components/runes/rune-config'

export const metadata: Metadata = {
  title: 'About',
  description: 'Adam Keech builds for the web, leads engineering teams, and writes about AI tooling, developer experience, and what he learns along the way.',
}

export default function AboutPage() {
  return (
    <section className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <h1 className="page-title">
        <span aria-hidden="true" className="page-title__rune">{NAV_RUNES['/about'].char}</span>
        About
      </h1>

      <div className="about__grid">
        <div className="about__portrait">
          <Image
            src="/images/headshot.webp"
            alt="Adam Keech"
            fill
            sizes="(max-width: 760px) 70vw, 260px"
            className="object-cover"
            priority
          />
        </div>

        <div>
          <p className="about__lede">
            I build things, tinker, and sometimes write about what I learn along the way.
          </p>

          <div className="prose">
            <p>
              Right now that means leading engineering teams through the AI tooling
              transition and trying to figure out what actually works versus what just
              feels productive. I spend a lot of time with AI-assisted development, not
              because I think it solves everything, but because we are still figuring out
              where it fits. I want to write about my journey as we figure it out together.
            </p>

            <p>
              Outside of work, I chase side projects, read about Norse mythology, and
              play too many games. D&amp;D on the tabletop, Marvel Rivals, and World of
              Warcraft. This site is where all of that lives — projects, posts, and
              whatever I am currently exploring.
            </p>
          </div>

          <ul className="about__list" style={{ ['--rune' as string]: `"${ELDER_FUTHARK.ansuz.char}"` }}>
            <li>Writes about engineering, AI tooling, and what sticks.</li>
            <li style={{ ['--rune' as string]: `"${ELDER_FUTHARK.kenaz.char}"` }}>
              Builds side projects to learn in public.
            </li>
            <li style={{ ['--rune' as string]: `"${ELDER_FUTHARK.raidho.char}"` }}>
              Currently exploring the AI-assisted workflow space.
            </li>
          </ul>

          <div style={{ marginTop: 28 }}>
            <Link href="/feed.xml" className="btn btn--ghost">
              <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.sowilo.char}</span>
              Subscribe via RSS
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

Note: the `--rune` CSS var pattern above sets the `content` glyph per list item (via `.about__list li::before { content: var(--rune, '\16A8') }` from Task 7). The default Ansuz falls through for the first item.

- [x] **Step 17.2: Build check**

Run:
```bash
npm run build
```
Expected: PASS. Visit `/about` in dev.

- [x] **Step 17.3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat(about): mannaz page-title, portrait grid, rune bullets, rss button"
```

---

## Task 18: TOC palette tune

**Files:**
- Modify: `src/components/blog/toc.tsx`

Structure (prepended Introduction entry, sticky) is already correct. Retune colors only.

- [x] **Step 18.1: Update**

```tsx
export interface TocEntry {
  title: string
  url: string
  items: TocEntry[]
}

interface TocProps {
  entries: TocEntry[]
}

export function TableOfContents({ entries }: TocProps) {
  if (entries.length === 0) return null

  return (
    <nav
      className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto"
      style={{
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-ink-dim)',
      }}
    >
      <div
        className="mb-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-accent-gold)',
        }}
      >
        Contents
      </div>
      <TocList entries={[{ title: 'Introduction', url: '#', items: [] }, ...entries]} />
    </nav>
  )
}

export function TocList({ entries, depth = 0 }: { entries: TocEntry[]; depth?: number }) {
  return (
    <ul className={depth > 0 ? 'ml-4' : ''} style={{ listStyle: 'none', padding: 0 }}>
      {entries.map((entry) => (
        <li key={entry.url} className="my-1.5">
          <a
            href={entry.url}
            className="transition-colors"
            style={{ color: 'var(--color-ink-dim)', fontSize: 13, lineHeight: 1.5 }}
          >
            {entry.title}
          </a>
          {entry.items.length > 0 && <TocList entries={entry.items} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  )
}
```

- [x] **Step 18.2: Commit**

```bash
git add src/components/blog/toc.tsx
git commit -m "style(toc): mono tune for nocturnal palette"
```

---

## Task 19: MobileToc palette sweep

**Files:**
- Modify: `src/components/blog/mobile-toc.tsx`

The sticky mobile TOC currently uses `bg-background`, `bg-surface`, `border-foreground`, `shadow-brutal` — all now resolve to dark tokens through the back-compat aliases but the black border no longer reads. Swap to the gold-accent card language.

- [x] **Step 19.1: Update the card container**

Replace:
```tsx
<div className={cn(
  'border-[3px] border-foreground shadow-brutal bg-surface',
)}>
```
with:
```tsx
<div
  className="rounded-[4px]"
  style={{
    border: '2px solid var(--color-accent-gold)',
    background: 'var(--color-surface-hi)',
    boxShadow: 'var(--shadow-brutal)',
    backdropFilter: 'blur(6px)',
  }}
>
```

And replace the outer sticky wrapper (`bg-background`):
```tsx
'sticky top-16 z-40 bg-background -mx-6 px-6 pt-2',
```
with:
```tsx
'sticky top-16 z-40 -mx-6 px-6 pt-2',
```
and add `style={{ backgroundColor: 'rgba(13,33,40,0.88)', backdropFilter: 'blur(8px)' }}` to that outer `<div>`.

- [x] **Step 19.2: Commit**

```bash
git add src/components/blog/mobile-toc.tsx
git commit -m "style(mobile-toc): swap neobrutalist pink chrome for nocturnal glass card"
```

---

## Task 20: Post detail page

**Files:**
- Modify: `src/app/blog/[slug]/page.tsx`

Two-col grid with slab panel + sticky TOC. Norse title, mono meta row, linkable tag chips. `ViewCounter` and `MobileToc` stay.

- [x] **Step 20.1: Rewrite**

```tsx
import { publishedPosts } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { TableOfContents } from '@/components/blog/toc'
import { MobileToc } from '@/components/blog/mobile-toc'
import { FilterChip } from '@/components/ui/filter-chip'
import { ViewCounter } from '@/components/blog/view-counter'
import { POST_RUNES } from '@/components/runes/rune-config'
import { formatDate } from '@/lib/format'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return publishedPosts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)
  if (!post) return { title: 'Post Not Found' }

  const description = post.description || (post.excerpt?.slice(0, 160) ?? '')
  return {
    title: post.title,
    description,
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      publishedTime: post.date,
      tags: post.tags,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)
  if (!post) notFound()

  const formattedDate = formatDate(post.date)
  const formattedUpdated = post.updated ? formatDate(post.updated) : null

  return (
    <article className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <Link href="/blog" className="back-link">
        <ArrowLeft size={14} />
        <span>All blog posts</span>
      </Link>

      <MobileToc entries={post.toc} />

      <div className="post-detail__grid">
        <div>
          <article className="post-detail__main">
            <header>
              <h1 className="post-detail__title">{post.title}</h1>
              <div className="post-detail__meta">
                <time dateTime={post.date}>{formattedDate}</time>
                <span aria-hidden="true" className="post-detail__meta-sep">{POST_RUNES.separator.char}</span>
                <span>{post.readingTime} min read</span>
                <span aria-hidden="true" className="post-detail__meta-sep">{POST_RUNES.separator.char}</span>
                <ViewCounter slug={slug} />
                {formattedUpdated && (
                  <>
                    <span aria-hidden="true" className="post-detail__meta-sep">{POST_RUNES.separator.char}</span>
                    <span>Updated {formattedUpdated}</span>
                  </>
                )}
              </div>
              {post.tags.length > 0 && (
                <div className="tag-bar" style={{ marginTop: 4, marginBottom: 20 }}>
                  {post.tags.map((tag) => (
                    <FilterChip key={tag} label={tag} href={`/blog?tags=${tag}`} variant="sm" />
                  ))}
                </div>
              )}
            </header>

            <div className="prose">
              <MDXContent html={post.body} />
            </div>
          </article>
        </div>

        <aside className="post-detail__toc hidden lg:block">
          <TableOfContents entries={post.toc} />
        </aside>
      </div>
    </article>
  )
}
```

- [x] **Step 20.2: Build + view a post**

Run:
```bash
npm run build
```
Expected: PASS.

- [x] **Step 20.3: Commit**

```bash
git add src/app/blog/[slug]/page.tsx
git commit -m "feat(post): slab panel + sticky TOC + mono meta row for post detail"
```

---

## Task 21: Project detail page

**Files:**
- Modify: `src/app/projects/[slug]/page.tsx`

Same slab + sticky-TOC layout. Adds category eyebrow, italic Norse tagline, stack chips (all, no 6-cap), action buttons for demo/github.

- [ ] **Step 21.1: Rewrite**

```tsx
import { projects } from '@/.velite'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { FilterChip } from '@/components/ui/filter-chip'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { GithubIcon } from '@/components/icons/brand-icons'
import { ELDER_FUTHARK } from '@/components/runes/rune-config'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

const CATEGORY_LABEL = {
  'side-project': 'Side project',
  'professional': 'Professional',
  'open-source':  'Open source',
} as const

export async function generateStaticParams() {
  return projects.map(project => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)
  if (!project) return { title: 'Project Not Found' }

  const description = project.description.slice(0, 160)
  return {
    title: project.title,
    description,
    openGraph: {
      type: 'article',
      title: project.title,
      description,
      ...(project.image && { images: [{ url: project.image.src }] }),
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)
  if (!project) notFound()

  return (
    <article className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <Link href="/projects" className="back-link">
        <ArrowLeft size={14} />
        <span>All projects</span>
      </Link>

      <div className="post-detail__grid">
        <div>
          <article className="post-detail__main">
            {project.category && (
              <div
                className="project-card__eyebrow"
                style={{ marginBottom: 12 }}
              >
                {CATEGORY_LABEL[project.category]}
              </div>
            )}
            <h1 className="post-detail__title">{project.title}</h1>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 20,
                color: 'var(--color-ink-dim)',
                margin: '10px 0 20px',
              }}
            >
              {project.description}
            </p>

            {project.stack.length > 0 && (
              <div className="tag-bar" style={{ marginBottom: 20 }}>
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="chip chip--sm"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--color-hair-strong)',
                      background: 'var(--color-surface-lo)',
                      color: 'var(--color-ink-dim)',
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div className="home-ctas" style={{ margin: '16px 0 28px' }}>
              {project.demo && (
                <a href={project.demo} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                  <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.sowilo.char}</span>
                  <ExternalLink size={14} />
                  <span>Live demo</span>
                </a>
              )}
              {project.github && (
                <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                  <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.algiz.char}</span>
                  <GithubIcon size={14} />
                  <span>Source</span>
                </a>
              )}
            </div>

            {project.image && (
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  marginBottom: 24,
                  border: '1px solid var(--color-hair-strong)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={project.image.src}
                  alt={`${project.title} screenshot`}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover"
                />
              </div>
            )}

            {project.stack.length > 0 && <FilterChip label="" className="hidden" />}

            <div className="prose prose-projects">
              <MDXContent html={project.body} />
            </div>
          </article>
        </div>

        <aside className="post-detail__toc hidden lg:block" />
      </div>
    </article>
  )
}
```

Remove the `<FilterChip label="" className="hidden" />` placeholder line before committing — it was a drafting artifact. Final file should not contain that line.

- [ ] **Step 21.2: Remove the placeholder line**

Open the file in your editor and delete the one line:
```tsx
{project.stack.length > 0 && <FilterChip label="" className="hidden" />}
```
(If you already kept it out, skip.)

- [ ] **Step 21.3: Build**

Run:
```bash
npm run build
```
Expected: PASS.

- [ ] **Step 21.4: Commit**

```bash
git add src/app/projects/[slug]/page.tsx
git commit -m "feat(project): slab panel with category eyebrow, tagline, stack chips, actions"
```

---

## Task 22: Prose styles — dark rewrite

**Files:**
- Modify: `src/app/globals.css` (replace the entire `.prose` block)

Rewrites the prose subsystem for dark text, gold h2 underline, gold-accent blockquote, Ansuz list bullets in gold, image treatment for dark bg.

- [ ] **Step 22.1: Replace the existing `.prose` block**

In `src/app/globals.css`, find the `/* Prose Styles (Blog Typography) */` header and replace the entire `@layer components { .prose { ... } ... }` block (everything from `.prose {` opening through the closing `}` of the last media query) with:

```css
@layer components {
  .prose {
    color: var(--color-ink);
    font-size: 17px;
    line-height: 1.75;
  }

  .prose p {
    color: var(--color-ink);
    margin: 0 0 20px;
    text-wrap: pretty;
  }

  .prose strong { font-weight: 600; color: var(--color-ink); }
  .prose em     { color: var(--color-ink-dim); font-style: italic; }

  .prose a {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 160ms ease;
  }
  .prose a:hover { color: var(--color-accent-gold); }

  .prose h2 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    margin: 44px 0 18px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-accent-gold);
    color: var(--color-ink);
  }

  .prose h3 {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    margin: 32px 0 12px;
    color: var(--color-ink);
  }

  .prose h4 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    margin: 24px 0 10px;
    color: var(--color-ink);
  }

  .prose h2, .prose h3, .prose h4 {
    scroll-margin-top: 100px;
  }

  .prose blockquote {
    margin: 24px 0;
    padding: 16px 20px;
    border-left: 3px solid var(--color-accent-gold);
    background: var(--color-surface-lo);
    color: var(--color-ink-dim);
    font-style: italic;
    font-size: 18px;
    border-radius: 0 4px 4px 0;
  }
  .prose blockquote p:last-child { margin-bottom: 0; }

  .prose ul, .prose ol { margin: 0 0 20px; padding: 0 0 0 28px; }

  .prose ul { list-style: none; }
  .prose ul > li { position: relative; margin-bottom: 8px; color: var(--color-ink); }
  .prose ul > li::before {
    content: '\16A8';
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--color-accent-gold);
    position: absolute;
    left: -24px;
    opacity: 0.85;
  }

  .prose-projects ul > li::before { content: '\16B2'; }

  .prose ol { list-style-type: decimal; color: var(--color-ink); }
  .prose li { margin-bottom: 6px; }
  .prose li > ul, .prose li > ol { margin-top: 6px; margin-bottom: 0; }

  .prose hr { margin: 40px 0; border: none; border-top: 1px solid var(--color-hair); }

  .prose img {
    margin: 24px 0;
    border: 1px solid var(--color-hair-strong);
    border-radius: 6px;
    display: block;
    max-width: 100%;
    height: auto;
  }

  .prose table {
    width: 100%;
    margin: 24px 0;
    border-collapse: collapse;
    font-size: 15px;
  }
  .prose th, .prose td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--color-hair);
  }
  .prose th { font-weight: 600; color: var(--color-ink); background: var(--color-surface-lo); }
  .prose td { color: var(--color-ink-dim); }

  :not(pre) > code {
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--color-accent-gold);
    background: var(--color-surface-lo);
    border: 1px solid var(--color-hair-strong);
  }

  @media (max-width: 640px) {
    .prose { font-size: 16px; line-height: 1.65; }
    .prose h2 { font-size: 24px; margin-top: 36px; }
    .prose h3 { font-size: 20px; margin-top: 28px; }
  }
}
```

- [ ] **Step 22.2: Commit**

```bash
git add src/app/globals.css
git commit -m "style(prose): dark body typography with gold h2 rule and Ansuz bullets"
```

---

## Task 23: Code block chrome — gold accent + dark title bar

**Files:**
- Modify: `src/app/globals.css` (the `figure[data-rehype-pretty-code-figure]` and `[data-rehype-pretty-code-title]` rules)
- Modify: `src/components/blog/code-block-enhancer.tsx` (copy-button colors)

Spec: drop the 3px black border + shadow-brutal on the code figure. Add a 3px gold left accent bar on `--color-surface-lo`. Title bar gets gold fg on `--color-bg-deep` fill. Shiki `--shiki-*` tokens untouched.

- [ ] **Step 23.1: Update code-block styles**

In `src/app/globals.css`, replace:

```css
figure[data-rehype-pretty-code-figure] {
  @apply my-6 overflow-hidden rounded-lg;
  border: 3px solid var(--color-foreground);
  box-shadow: var(--shadow-brutal);
  position: relative;
}

[data-rehype-pretty-code-title] {
  @apply px-4 py-2 font-mono text-sm font-bold;
  background-color: var(--color-foreground);
  color: var(--color-background);
}
```
with:
```css
figure[data-rehype-pretty-code-figure] {
  @apply my-6 overflow-hidden;
  position: relative;
  border-radius: 6px;
  border-left: 3px solid var(--color-accent-gold);
  background: var(--color-surface-lo);
}

[data-rehype-pretty-code-title] {
  @apply px-4 py-2 font-mono text-sm font-bold;
  background-color: var(--color-bg-deep);
  color: var(--color-accent-gold);
  border-bottom: 1px solid var(--color-hair);
}
```

Also retune the inline code block:
```css
:not(pre) > code {
  @apply p-0.5 rounded font-mono text-sm;
  background-color: var(--color-surface);
  border: 1px solid var(--color-foreground);
}

/* Inline code processed by rehype-pretty-code */
span[data-rehype-pretty-code-figure] code {
  @apply p-0.5 rounded font-mono text-sm;
  background-color: rgba(0, 0, 0, 0.69) !important;
  border: 1px solid var(--color-foreground);
}
```
Delete both blocks — Task 22's prose rewrite already set `:not(pre) > code`. For the rehype-pretty-code inline span, replace with:
```css
span[data-rehype-pretty-code-figure] code {
  @apply p-0.5 rounded font-mono text-sm;
  background-color: var(--color-surface-lo) !important;
  border: 1px solid var(--color-hair-strong);
  color: var(--color-accent-gold);
}
```

- [ ] **Step 23.2: Update copy button colors**

In `src/components/blog/code-block-enhancer.tsx`, replace:

```ts
button.className = [
  'absolute right-2 top-2 p-2 rounded border-2 border-black bg-surface',
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity',
  'hover:bg-accent hover:text-background',
].join(' ')
```
with:
```ts
button.className = [
  'absolute right-2 top-2 p-2 rounded border opacity-0',
  'group-hover:opacity-100 focus-visible:opacity-100 transition-opacity',
].join(' ')
button.style.borderColor = 'var(--color-hair-strong)'
button.style.background = 'var(--color-surface-hi)'
button.style.color = 'var(--color-ink)'
```

- [ ] **Step 23.3: Build**

Run:
```bash
npm run build
```
Expected: PASS.

- [ ] **Step 23.4: Commit**

```bash
git add src/app/globals.css src/components/blog/code-block-enhancer.tsx
git commit -m "style(code): gold-accent code blocks and dark-tuned copy button"
```

---

## Task 24: Remaining chrome — Footer, MDXFallback color sweep

**Files:**
- Modify: `src/components/layout/footer.tsx`
- Modify: `src/components/blog/mdx-content.tsx`

Footer currently uses `bg-foreground text-background`. With the aliases, `foreground=ink (near-white)` and `background=bg (petrol)`, which inverts into a very light footer — wrong on this design. Swap to the subtle dark-panel language.

MDXFallback uses `bg-surface border-foreground shadow-brutal bg-accent text-white` — all reading oddly on the new palette.

- [ ] **Step 24.1: Rewrite `src/components/layout/footer.tsx`**

```tsx
import Link from 'next/link'
import { GithubIcon, LinkedinIcon } from '@/components/icons/brand-icons'

const socialLinks = [
  { href: 'https://github.com/smadam813', icon: GithubIcon, label: 'GitHub' },
  { href: 'https://linkedin.com/in/adam-keech', icon: LinkedinIcon, label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer
      className="mt-auto relative z-[1]"
      style={{
        borderTop: '1px solid var(--color-hair)',
        padding: '24px max(24px, calc((100vw - var(--page-max)) / 2))',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        background: 'rgba(13, 33, 40, 0.55)',
        backdropFilter: 'blur(6px)',
        color: 'var(--color-ink-dim)',
      }}
    >
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ maxWidth: 'var(--page-max)', margin: '0 auto' }}
      >
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em' }}>
          © {new Date().getFullYear()} keech.dev
        </p>
        <div className="flex gap-6">
          {socialLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="hover:-translate-y-0.5 motion-safe:transition-all motion-safe:duration-150"
                style={{ color: 'var(--color-ink-dim)' }}
              >
                <Icon className="w-5 h-5" />
              </Link>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 24.2: Rewrite MDXFallback in `src/components/blog/mdx-content.tsx`**

Replace the `MDXFallback` function with:

```tsx
function MDXFallback() {
  return (
    <div
      className="text-center my-8"
      style={{
        border: '2px solid var(--color-accent-gold)',
        background: 'var(--color-surface-hi)',
        boxShadow: 'var(--shadow-brutal)',
        padding: '32px',
        borderRadius: 4,
        color: 'var(--color-ink)',
      }}
    >
      <h2 className="font-display text-2xl mb-4">This post couldn&apos;t be displayed</h2>
      <p style={{ color: 'var(--color-ink-dim)' }} className="mb-6">
        Something went wrong while rendering this content.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
      <a href="/blog" className="btn btn--primary">
        Back to blog
      </a>
    </div>
  )
}
```

- [ ] **Step 24.3: Commit**

```bash
git add src/components/layout/footer.tsx src/components/blog/mdx-content.tsx
git commit -m "style(chrome): nocturnal footer + MDX fallback panel"
```

---

## Task 25: Error boundaries + not-found sweep

**Files:**
- Modify: `src/app/error.tsx`
- Modify: `src/app/global-error.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/loading.tsx`
- Modify: `src/app/blog/[slug]/error.tsx` (if it exists — check first)

Each of these uses the brutalist pink chrome. Because they may render when state is partially broken, keep them self-sufficient (no Tailwind class dependence where it matters) — but they should still read on the dark palette. These are small files; sweep any hard-coded color (`border-black`, `shadow-brutal`, `bg-surface`, `bg-accent text-white`, `text-foreground`) into the nocturnal vocabulary.

- [ ] **Step 25.1: Inspect each file and patch in place**

For each of the files above, open and verify:
- Hard-coded `border-[3px] border-black` → `border-2` with `borderColor: 'var(--color-accent-gold)'` inline style (or `.btn` class where appropriate).
- `bg-surface` → `backgroundColor: 'var(--color-surface-hi)'`.
- `bg-accent text-white` on a CTA → swap to `className="btn btn--primary"`.
- Any plain text color → allow default (inherits from body `--color-ink`).

Use the MDXFallback rewrite in Task 24 as a template for the visual shell.

Run:
```bash
ls src/app/blog/[slug]/error.tsx
```
If it exists, apply the same sweep.

- [ ] **Step 25.2: Build**

Run:
```bash
npm run build
```
Expected: PASS.

- [ ] **Step 25.3: Commit**

```bash
git add src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx src/app/loading.tsx src/app/blog/[slug]/error.tsx
git commit -m "style(errors): dark-palette sweep across error boundaries + loading + 404"
```

(If any of the listed files don't exist, drop them from the `git add` — the commit should only include files that changed.)

---

## Task 26: Hero text color + accent-light tweak

**Files:**
- Modify: `src/components/hero.tsx`

The hero currently reads `text-accent-light` on `.dev`. `--color-accent-light` now aliases to `--color-accent` (mint-teal). That is fine but the direct white title still pops on the darker rune-glow-dimmed hero. No code changes are required unless the result visually fails the walkthrough.

- [ ] **Step 26.1: Visual confirm — no code change expected**

Run:
```bash
npm run dev
```
Open `/`. Expected: hero title reads "keech" in white with ".dev" in mint-teal. The hero section already has its own dark gradient scrim so legibility is maintained. If the legibility is poor, add `opacity: 0.95` on the span wrapper or swap to `--color-accent-gold` — commit only if a change is actually needed.

Stop the dev server.

- [ ] **Step 26.2: (Conditional) Commit**

Only if a real change was made. Otherwise skip this commit.

---

## Task 27: Tests — verify no regressions

**Files:**
- (Read-only) `src/components/**/*.test.*`
- Modify only if assertions are broken.

The existing tests mostly assert structure/roles (FilterChip aria, MDXContent fallback behavior, scroll-reveal observer, view-counter fetch). None of them assert on color tokens by name. Verify.

- [ ] **Step 27.1: Run unit tests**

Run:
```bash
npm run test -- --run
```
Expected: PASS.

- [ ] **Step 27.2: If anything fails, patch the source (not the test)**

Read the failure output. If a test is asserting behavior that the redesign legitimately changed (e.g., a specific CSS class name), update the test to the new class name — but only after confirming the behavior itself (aria, role, visible text) hasn't regressed.

- [ ] **Step 27.3: Commit (only if tests were touched)**

```bash
git add <changed-test-files>
git commit -m "test: update assertions for nocturnal palette tokens"
```

---

## Task 28: End-to-end smoke

**Files:** none — verification only.

- [ ] **Step 28.1: Run Playwright smoke**

Run:
```bash
npx playwright test --reporter=line
```
Expected: PASS on all of `code-copy`, `mobile-menu`, `mobile-toc`, `view-count`. If an environment issue prevents browsers from launching, note it in the handoff but keep moving.

- [ ] **Step 28.2: Dev server walkthrough (manual)**

Run:
```bash
npm run dev
```
Walk each route and confirm:
- `/` — hero + lede + CTAs + Latest Writing cards, ambient visible on scroll.
- `/blog` — Ansuz page-title, pastel hue chips, 3-col cards on dark panels.
- `/projects` — Kenaz page-title, 2-col cards with Kenaz corner badge, category eyebrow, +N overflow, Live/Source/Read row.
- `/about` — Mannaz page-title, portrait framed with gold border, rune bullets, RSS button.
- `/blog/<any slug>` — slab panel with sticky TOC; mono meta row with Jera separators; tag chips link back to filtered listing.
- `/projects/<any slug>` — category eyebrow, Norse italic tagline, stack chips, Demo/Source buttons.
- Resize to <760px, <900px — layouts collapse per the grid media queries.
- Toggle `prefers-reduced-motion` in dev tools — rune glows and fade-in animations disable; card hover transitions remain (short enough to be safe).

Stop the dev server.

- [ ] **Step 28.3: Final build**

Run:
```bash
npm run lint
npm run build
```
Expected: both PASS with zero new warnings.

- [ ] **Step 28.4: Final commit only if sweep fixes were needed**

If the walkthrough surfaces any visual issues, fix them in focused follow-up commits before declaring done.

---

## Self-review checklist (run before handoff)

- [ ] Every spec section has a task:
  - Palette tokens → Task 3
  - Tag palette → Task 1
  - Fonts → Task 2
  - Type scale (page-title, eyebrow, section-head, display) → Task 7
  - Ambient background → Task 5
  - Brutalist card treatment → Task 10 (post) + Task 11 (project) + Task 7 (slab panels)
  - Rune glow re-tune → Task 6
  - Home page → Task 13 + Task 12 (LatestWriting)
  - Blog page → Task 14
  - Projects page → Task 15
  - About page → Task 17
  - Post detail → Task 20
  - Project detail → Task 21
  - Prose → Task 22
  - Code blocks → Task 23
  - Header → Task 9
  - Filter chip → Task 8
  - Filter bar / empty states → Task 14 + Task 15 + Task 16
  - TOC + MobileToc → Task 18 + Task 19
  - Footer / MDX fallback → Task 24
  - Error boundaries / 404 / loading → Task 25
  - Tests / build verification → Task 27 + Task 28
- [ ] No placeholder text ("TBD", "implement later", "add appropriate X") anywhere.
- [ ] Types / prop names are consistent: `FilterChip` exports `variant?: 'default' | 'sm' | 'clear'` and both listing pages + the two cards + the project-detail stack chips reference it only by those names.
- [ ] Rune imports come from existing `rune-config.ts` (`ELDER_FUTHARK`, `NAV_RUNES`, `POST_RUNES`, `BLOG_RUNES`, `PROJECT_RUNES`). No new rune mappings invented.
- [ ] MDX wiring uses the current `MDXContent` API: `<MDXContent html={post.body} />` and `<MDXContent html={project.body} />`. Spec's `code={post.code}` phrasing is an artifact — the live component reads `html`.

---

## Notes for the executing engineer

- `@theme` in Tailwind v4 emits CSS custom properties AND generates matching utility classes — `bg-background`, `text-foreground`, `text-accent` all keep resolving through the back-compat aliases in Task 3. That is intentional so the refactor can land incrementally without a big-bang sweep.
- Do not re-introduce `tailwind.config.js`. All tokens live in `globals.css`.
- Velite runs as a prebuild step. Don't touch `velite.config.ts` — content schemas and MDX pipeline are out of scope.
- All commits target branch `re-design`. Do not open a PR as part of executing this plan; per the user's memory, PRs target the `preview` branch, and that's a separate ship step.
- If Playwright can't launch browsers (missing `npx playwright install`), it's acceptable to skip e2e and note it in the handoff.
- When in doubt about an unspecified padding / spacing / color, defer to the design spec's own "open questions" clause: the prototype's `styles.css` is the source of truth.
