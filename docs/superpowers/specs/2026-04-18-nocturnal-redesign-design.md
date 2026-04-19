# Nocturnal Redesign — Design Spec

**Date:** 2026-04-18
**Branch:** `re-design`
**Source:** Claude Design handoff bundle (`portfolio-site-keech-dev`) — HTML/CSS/JS prototype + chat transcript recovered from gzip archive at `/tmp/design-extract/portfolio-site-keech-dev/`
**Status:** Approved for implementation planning

## Intent

Transform the site from a dusty-rose neobrutalist palette into a moody nocturnal aesthetic while preserving the Norse/runic brand DNA. The hero illustration becomes a full-page ambient watermark behind every route; cards shift from white-on-pink to translucent dark panels; tag chips gain per-tag pastel hues drawn from the hero's aurora ribbons.

The design was iterated in a throwaway React/Babel prototype with four tweak axes. Locked-in shipped values:

- **Palette:** Petrol (dark teal/petrol-blue base)
- **Art intensity:** Bold (color wash at 55% opacity — art shows through more)
- **Card style:** Brutalist (2px gold border + 6px hard offset shadow on dark surface)
- **Display font:** Norse (existing `Norse-Regular.woff2` / `Norse-Bold.woff2`)

Alternate palettes, card styles, and display fonts from the prototype's Tweaks panel are explicitly out of scope — the site is single-theme per `CLAUDE.md`.

## Scope

### Added files

- `src/components/layout/ambient-background.tsx` — fixed full-bleed layered watermark (hero image + color wash + gradient + vignette + film grain). Mounted once in `src/app/layout.tsx` at `z-0`, `aria-hidden`, `pointer-events: none`.
- `src/lib/tag-palette.ts` — 6-color pastel palette (rose / mint / amber / lavender / teal / clay) + pure `paletteFor(tag: string)` hash returning stable `{ bg, fg, border }` per tag.
- `src/components/home/latest-writing.tsx` — server component, reads `posts` from Velite, renders 3 newest by date in a 3-column grid under a section head.

### Rewritten in place

- `src/app/globals.css` — `@theme` block rewritten; prose, chip, button, ambient, and card-surface styles added; brutal shadow recolored gold; unused palette/card/display variant selectors removed.
- `src/components/layout/header.tsx` — glassy backdrop-blur shell, Othala wordmark mark, mobile menu restyled.
- `src/components/blog/post-card.tsx` — Brutalist dark card treatment, new meta row with mono font + Jera rune separators.
- `src/components/projects/project-card.tsx` — same Brutalist treatment, Kenaz rune badge, category eyebrow, first-6 stack with +N overflow, Live/Source/Read hover affordance. Optional top image slot retained.
- `src/components/ui/filter-chip.tsx` — per-tag hashed hue via `paletteFor()`, pill shape, mono font, preserved three modes (toggle/link/display). Added `chip--sm` and `chip--clear` variants.
- `src/components/blog/toc.tsx` — palette-only tune; structure (prepended Introduction entry, no numbering, sticky) already matches the target design.
- `src/app/page.tsx` — `<Hero />` stays on top; below adds lede paragraph + CTAs (`<Link>` as `.btn--primary`/`.btn--ghost`) + `<LatestWriting />`.
- `src/app/blog/page.tsx` — `<h1 class="page-title">` with inline Ansuz rune, `tag-bar` wrapper, filter-status line, 3-col card grid.
- `src/app/projects/page.tsx` — Kenaz page-title + lede + 2-col grid.
- `src/app/about/page.tsx` — Mannaz page-title + 2-col portrait/body grid using the existing headshot image, Norse lede at 26px, Ansuz/Kenaz/Raidho bullets, RSS button.
- `src/app/blog/[slug]/page.tsx` — 2-col grid: slab panel + sticky TOC. Back link, Brutalist `post-detail__main`, Norse title, mono meta row, linkable tag chips.
- `src/app/projects/[slug]/page.tsx` — same slab + prose treatment, plus category eyebrow / italic tagline / stack chips / actions row.
- `src/lib/fonts.ts` — add `JetBrains_Mono` from `next/font/google`, export as `jetBrainsMono`, variable `--font-mono`.
- `src/app/layout.tsx` — add `jetBrainsMono.variable` to `<html>` className; mount `<AmbientBackground />` inside `<body>` as the very first child (before `<Header />`) so it sits behind the fixed header and all page content.

### Explicitly out of scope

- Tweaks panel and alternate palette/card/display variants — locked values only, no runtime switching.
- Routing behavior, App Router structure, and page data-fetching — unchanged.
- Velite schemas and content (MDX files) — unchanged.
- Redis view counting, sitemap, robots, OG image, RSS, error boundaries — unchanged except for color-reference sweeps.
- `<Hero />` component internals (image, positioned rune glows, reveal animation) — unchanged; only the three `.rune-glow--*` gradient opacities drop from `0.69` to `~0.55` to reduce glare on dark bg.
- Test infrastructure — existing tests updated if they assert removed color tokens; no new test harnesses.

## Design system

### Palette (Petrol)

CSS-first tokens in `@theme` block of `src/app/globals.css`:

```css
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

--shadow-brutal:       6px 6px 0 0 rgba(0, 0, 0, 0.55);
--shadow-brutal-hover: 2px 2px 0 0 rgba(0, 0, 0, 0.55);
--border-brutal:       2px;

--radius:    10px;
--radius-sm: 6px;
--page-max:  1200px;
```

Existing `--color-background`, `--color-foreground`, `--color-accent`, `--color-accent-hover`, `--color-accent-light`, `--color-surface`, `--color-muted` tokens are replaced (same names reused where semantically equivalent). The `main` element gets `position: relative; z-index: 1; padding: 24px max(24px, calc((100vw - var(--page-max)) / 2)) 96px;` so content sits above the ambient background and auto-gutters to the page-max width. (Exception: the existing `<Hero />` component manages its own full-bleed layout and bypasses this padding.)

### Tag palette

Six hue entries in `src/lib/tag-palette.ts`:

```ts
export const TAG_HUE_PALETTE = [
  { name: 'rose',     bg: 'rgba(228, 164, 172, 0.14)', fg: '#e4a4ac', border: 'rgba(228,164,172,0.30)' },
  { name: 'mint',     bg: 'rgba(141, 203, 188, 0.14)', fg: '#8dcbbc', border: 'rgba(141,203,188,0.30)' },
  { name: 'amber',    bg: 'rgba(224, 188, 121, 0.14)', fg: '#e0bc79', border: 'rgba(224,188,121,0.30)' },
  { name: 'lavender', bg: 'rgba(178, 167, 207, 0.14)', fg: '#b2a7cf', border: 'rgba(178,167,207,0.30)' },
  { name: 'teal',     bg: 'rgba(120, 188, 188, 0.14)', fg: '#78bcbc', border: 'rgba(120,188,188,0.30)' },
  { name: 'clay',     bg: 'rgba(207, 145, 125, 0.14)', fg: '#cf917d', border: 'rgba(207,145,125,0.30)' },
] as const;

export function hashTag(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function paletteFor(tag: string) {
  return TAG_HUE_PALETTE[hashTag(tag) % TAG_HUE_PALETTE.length];
}
```

### Fonts

`src/lib/fonts.ts`:

- `norse` (existing) — `next/font/local`, variable `--font-display`.
- `inter` (existing) — `next/font/google`, variable `--font-body`.
- `jetBrainsMono` (**new**) — `next/font/google`, subset `latin`, weights `400,500,600`, display `swap`, variable `--font-mono`.

`src/app/layout.tsx` adds `jetBrainsMono.variable` to the `<html>` className alongside the other two.

### Type scale

Unchanged base `h1`–`h6` rules (current letter-spacing + line-heights already match target). Added named classes:

- `.display` — `clamp(80px, 14vw, 180px)`, Norse 700, `letter-spacing: -0.02em`, `line-height: 0.95`, used nowhere by default but available (Hero keeps its own sizing; this class is a reserved escape hatch).
- `.page-title` — `clamp(42px, 6vw, 72px)`, Norse 700, inline rune marker sized at `0.65em` in `--color-accent-gold` at `opacity: 0.75`.
- `.eyebrow` — `12px` mono uppercase, `letter-spacing: 0.14em`, pill-shaped (`--surface-lo` fill, hair border, `border-radius: 999px`).
- `.section-head` — baseline flex row: Jera rune (gold 28px display) + title (Norse 28px) + right-aligned mono "more" button. Bottom `1px solid --color-hair`.

### Ambient background

Component: `AmbientBackground` in `src/components/layout/ambient-background.tsx`. Server component (no state needed). Renders one `<div aria-hidden="true">` fixed to `inset: 0`, `z-index: 0`, `pointer-events: none`, with `--color-bg` as its backgroundColor and five layered children:

1. Hero art layer — `<div>` with `background-image: url('/images/hero.webp')`, `background-size: cover`, `background-position: center`, `filter: saturate(0.85)`.
2. Color wash — `rgba(14,28,33,0.55)` solid fill with `mix-blend-mode: multiply` (bold intensity).
3. Gradient wash — `linear-gradient(180deg, rgba(20,38,45,0.55) 0%, rgba(20,38,45,0.35) 40%, rgba(18,34,40,0.65) 100%)`.
4. Vignette — `radial-gradient(ellipse 120% 80% at 50% 40%, transparent 0%, transparent 40%, rgba(10,20,24,0.6) 100%)`.
5. Film grain — inline SVG `feTurbulence` noise as data URI, `opacity: 0.06`, `mix-blend-mode: overlay`.

Mounted as the first child of `<body>` in `src/app/layout.tsx`. The existing `<main className="flex-1 flex flex-col pt-16">` sits above it at `z-index: 1` (new rule in `globals.css`).

Since `<Hero />` is `min-h-[calc(100svh-4rem)]` and opaque, the ambient is only visible on Home after scrolling past the hero; on Blog / Projects / About / detail pages it's immediately visible behind the content.

### Brutalist card treatment

Applied to both `PostCard` and `ProjectCard`, and to the `post-detail__main` / `project-detail__main` panels:

```css
border: 2px solid var(--color-accent-gold);
border-radius: 4px;
background: var(--color-surface-hi);
backdrop-filter: blur(6px);
box-shadow: 6px 6px 0 0 rgba(0, 0, 0, 0.55);
transition: transform 150ms, box-shadow 150ms;

/* hover (cards only) */
box-shadow: 2px 2px 0 0 rgba(0, 0, 0, 0.55);
transform: translate(4px, 4px);
```

Mirror of the current card motion language — the shadow collapses and the card "presses in" — recolored gold instead of black, on a translucent dark surface instead of opaque pink.

### Rune glow re-tune

In `src/app/globals.css`, the three `.rune-glow--amber / --teal / --gold` gradients keep their hex values (`rgba(217,164,65,*) / rgba(79,191,191,*) / rgba(232,213,149,*)`) but drop the inner alpha from `0.69` to `0.55` to compensate for the darker background. `--glow-opacity: 0.5` stays.

## Page specs

### Home (`src/app/page.tsx`)

```tsx
import { Hero } from '@/components/hero'
import { LatestWriting } from '@/components/home/latest-writing'
import Link from 'next/link'
import { ELDER_FUTHARK } from '@/components/runes/rune-config'

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
            <span aria-hidden>{ELDER_FUTHARK.ansuz.char}</span> Read the blog
          </Link>
          <Link href="/projects" className="btn btn--ghost">
            <span aria-hidden>{ELDER_FUTHARK.kenaz.char}</span> See projects
          </Link>
        </div>
        <LatestWriting />
      </section>
    </>
  )
}
```

`LatestWriting` imports `posts` from `@/.velite`, sorts by date desc, slices `0..3`, renders `<section>` with `.section-head` (Jera rune via `POST_RUNES.separator.char` + "Latest writing" + "All posts →" `<Link>` to `/blog`) and a 3-column `<PostCard>` grid.

Rune imports throughout the spec use the existing `rune-config.ts` exports: `ELDER_FUTHARK` for ad-hoc single-rune access, `NAV_RUNES` (already wired in Header), `POST_RUNES` (Jera separator — already used in current `PostCard`), `BLOG_RUNES`, `PROJECT_RUNES`. No new rune mappings are needed.

The `.home-below-hero`, `.home-lede`, `.home-ctas` class names are defined in `src/app/globals.css` — `.home-below-hero` inherits the main padding; `.home-lede` is Inter 19px `--color-ink-dim` `max-width: 640px` with `32px` top margin; `.home-ctas` is `display: flex; gap: 12px; flex-wrap: wrap; margin: 32px 0 56px`.

### Blog (`src/app/blog/page.tsx`)

- `<h1 class="page-title">` with Ansuz rune marker.
- `<div class="tag-bar">` wrapping the filter chips.
- Filter-status paragraph rendered only when filters active.
- 3-column grid of `<PostCard>` wired to the filtered list state.

Existing filter logic (`useFilteredList`, `FilteredPostList`) is preserved unchanged.

### Projects (`src/app/projects/page.tsx`)

- `<h1 class="page-title">` with Kenaz rune marker.
- Lede paragraph.
- 2-column grid of `<ProjectCard>`.

### About (`src/app/about/page.tsx`)

- `<h1 class="page-title">` with Mannaz rune marker.
- `.about__grid` (260px portrait / 1fr body, collapses at 760px).
- Portrait uses existing `public/images/headshot.webp`.
- Body: lede paragraph (Norse 26px), supporting paragraphs (Inter 16px/1.7), `.about__list` with Ansuz/Kenaz/Raidho runes.
- Bottom: RSS link as `.btn--ghost` with Sowilo rune prefix, href `/feed.xml`.

### Post detail (`src/app/blog/[slug]/page.tsx`)

- Back link: `<Link href="/blog">` with left arrow, mono uppercase.
- `.post-detail__grid` (`minmax(0, 1fr) 240px`, collapses at 900px).
- `<article class="post-detail__main">` — Brutalist panel, `max-width: 740px`, padding `40px 44px 36px`.
- Header block: Norse title (`clamp(32px, 4.5vw, 52px)`), mono meta row (formatted date + Jera + `readingTime` + Jera + views via existing `<ViewCounter>`), tag chips using `<FilterChip href={...}>` linking back to filtered blog.
- Body: `<MDXContent code={post.code} />` inside `<div class="prose">` wrapper; prose styles applied globally.
- Right `<aside class="post-detail__toc">` renders `<TableOfContents>` — sticky at `top: 96px`.

### Project detail (`src/app/projects/[slug]/page.tsx`)

- Back link.
- `.post-detail__grid` (same layout as post detail).
- `<article class="post-detail__main">`:
  - Category eyebrow (mono uppercase, gold) from frontmatter.
  - Norse title.
  - Italic tagline in Norse 20px (uses `description` from frontmatter).
  - Stack chips row (mono, `--hair-strong` border, `--surface-lo` fill, no 6-cap).
  - Actions row: `.btn--ghost` links for `demo` / `github` (Sowilo / Algiz rune prefixes).
  - `<div class="prose">` with `<MDXContent code={project.code} />`.
- Right `<aside>` renders TOC.

## Prose styling

Global rules in `globals.css` applied under `.prose` (MDX body wrapper):

```css
.prose              { color: var(--color-ink); font-size: 17px; line-height: 1.75; }
.prose p            { color: var(--color-ink); margin: 0 0 20px; text-wrap: pretty; }
.prose strong       { font-weight: 600; }
.prose em           { color: var(--color-ink-dim); font-style: italic; }

.prose h2 {
  font-family: var(--font-display);
  font-size: 28px; font-weight: 700;
  margin: 44px 0 18px; padding-bottom: 8px;
  border-bottom: 1px solid var(--color-accent-gold);
  scroll-margin-top: 100px;
}
.prose h3 {
  font-family: var(--font-display);
  font-size: 22px; font-weight: 700;
  margin: 32px 0 12px;
}
.prose blockquote {
  margin: 24px 0; padding: 16px 20px;
  border-left: 3px solid var(--color-accent-gold);
  background: var(--color-surface-lo);
  color: var(--color-ink-dim);
  font-style: italic; font-size: 18px;
  border-radius: 0 4px 4px 0;
}
.prose ul {
  list-style: none; margin: 0 0 20px; padding: 0 0 0 28px;
}
.prose ul li { position: relative; margin-bottom: 8px; color: var(--color-ink); }
.prose ul li::before {
  content: '\16A8';                      /* Ansuz */
  font-family: var(--font-display);
  color: var(--color-accent-gold);
  position: absolute; left: -24px;
  opacity: 0.85;
}
```

Code blocks (governed by existing `rehype-pretty-code` + `CodeBlockEnhancer`): the figure wrapper loses its 3px black border + shadow-brutal styling and gains a 3px gold left accent bar on `--color-surface-lo` fill. `--shiki-*` tokens stay untouched (github-dark-dimmed reads fine on petrol). The title bar gets `--color-accent-gold` fg on `--color-bg-deep` fill.

## Interactions / motion

- All hover transitions: `150–180ms ease`, respect `prefers-reduced-motion` (existing global `@media` rule in `globals.css` already covers the rune-glow + fade-in-up animations; new hover motions are CSS transitions which are motion-reduce compliant by default).
- Card hover: shadow collapses, card translates `(4px, 4px)` — same language as today.
- Nav link hover: `--color-hair` fill, `--color-ink` text, `160ms`.
- Filter chip hover: `translateY(-1px)`, bg warms 18% toward fg color via `color-mix`.
- Back-link hover: color shifts to `--color-accent`.
- Scroll locks + focus management in mobile header: unchanged.

## Error handling / edge cases

- **Ambient background on narrow viewports**: the hero image is 2446px wide; `background-size: cover` handles any aspect ratio, no special case needed.
- **Missing hero.webp** (shouldn't happen — file is committed): ambient would fall back to `--color-bg` solid fill. No error UI required.
- **Tag with empty string**: `paletteFor('')` returns index 0 (rose). Not visible in current data; no guard needed.
- **Filter chip with undefined count**: existing `FilterChip` already handles this via `count !== undefined` check — preserved.
- **MDX code block without language**: `[data-lang]:not([data-lang=""])::before` conditional already handles this.
- **Reduced motion**: the rune-glow, hero-text-reveal, and fade-in-up animations already have `@media (prefers-reduced-motion: reduce)` overrides. New hover CSS transitions are brief enough to be safe; the `motion-reduce-safe` utility class is already applied where long transitions exist.

## Testing

- **Unit tests** (`vitest`): existing tests that assert specific color tokens (e.g., `post-card.test.tsx` may reference `bg-surface` or `shadow-brutal`) get updated to the new token names / values. Tests that assert structural behavior (filter logic, rune position math, view-count caching) are untouched.
- **E2E tests** (`playwright`): existing specs hit routes and elements by role/text — no change unless a data-testid or aria-label is renamed. Spot-check after implementation.
- **Visual verification**: run `npm run dev` (Velite `--watch` + Next.js Turbopack) and walk all five routes (Home, Blog, Projects, About, post detail, project detail) on desktop (`>1200px`), tablet (`960px`), mobile (`640px`). Confirm reduced-motion with `prefers-reduced-motion` browser setting.
- **Build verification**: `npm run build` (Velite then Next.js) must succeed with zero new warnings.
- **Lint**: `npm run lint` must pass.
- **Type-check**: `npx tsc --noEmit` passes (test files show their known-expected false errors, unrelated).

## Open questions at implementation time

None — the design is fully specified. Any ambiguity surfacing during execution (e.g., exact `padding` of an unspecified element) defers to the prototype's `styles.css` as the source of truth.

## Deliverable

A single merge-ready state on the `re-design` branch containing every change above, ready to be promoted to `preview` per existing PR conventions (target `preview`, not `main`, per the user's memory).
