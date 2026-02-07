# Phase 6: Layout Consistency - Research

**Researched:** 2026-02-07
**Domain:** CSS layout normalization (Tailwind CSS v4, semantic HTML, Next.js App Router)
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Listing pages (Blog index, Projects index): ~1280px max-width
- All pages must have breathing room from viewport edges on large screens (minimum side margins even on ultrawide)
- Same horizontal padding on mobile across all page types
- Comfortable top spacing (~48-64px) between header and page content
- Listing pages share identical spacing with each other; detail pages share identical spacing with each other; the two groups can differ from each other
- Listing pages: title only (no subtitle/description line), then content grid
- Detail pages: distinct hero section for title/metadata -- visually separate from body content
- Semantic HTML fix (one `<main>` per page)
- Home page is exempt from consistency rules
- If any page looks "off" compared to others, normalize it

### Claude's Discretion
- Detail/reading page max-width
- Bottom spacing amount
- Heading-to-content gap sizing
- Shared wrapper component vs consistent Tailwind classes
- About page categorization
- Exact spacing values within the "comfortable" range

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

## Summary

This phase addresses measurable layout inconsistencies across the site. The codebase currently has **five different max-width values** across six page types, **three nested `<main>` elements** (violating HTML semantics), and **inconsistent vertical spacing**. The screenshots confirm that on wide viewports, the "Blog" title and "Projects" title start at noticeably different horizontal positions because Blog uses `max-w-6xl` (1152px) while Projects uses `max-w-5xl` (1024px), and the header uses `max-w-6xl` (1152px) while the footer uses `max-w-5xl` (1024px).

The fix is straightforward: establish two max-width tiers (listing and detail), remove subtitle paragraphs from listing pages, replace `<main>` tags in page components with `<section>` or `<div>`, and apply uniform spacing tokens. No new dependencies are needed -- this is purely Tailwind class changes across existing components.

**Primary recommendation:** Standardize on `max-w-7xl` (1280px) for listing pages (matching the user's ~1280px requirement), `max-w-4xl` (896px) for detail/reading pages, and align header + footer to `max-w-7xl` so all containers share visible left edges on wide screens.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 | Utility-first CSS | Already in use; all layout changes are class-level |
| Next.js | 16 | App Router layout system | Root layout provides the single `<main>` wrapper |

### Supporting
No additional libraries needed. This phase is pure CSS/HTML restructuring.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline Tailwind classes on each page | Shared wrapper component | Component adds indirection but ensures consistency; classes are simpler and more transparent for a 6-page site |

**Installation:** No new packages required.

## Architecture Patterns

### Current State Audit

The codebase has these layout containers (all verified from source):

| Element | Location | max-width | Container? | Padding | Vertical |
|---------|----------|-----------|------------|---------|----------|
| Header inner | `header.tsx:93` | `max-w-6xl` (1152px) | No | `px-6` | `h-16` |
| Blog listing | `blog/page.tsx:19` | `max-w-6xl` (1152px) | Yes | `px-6` | `py-8` |
| Projects listing | `projects/page.tsx:21` | `max-w-5xl` (1024px) | Yes | `px-6` | `py-8` |
| Blog post | `blog/[slug]/page.tsx:64` | `max-w-6xl` (1152px) | No | `px-6` | `py-8` |
| Project detail | `projects/[slug]/page.tsx:51` | `max-w-3xl` (768px) | Yes | `px-6` | `py-8` |
| About page | `about/page.tsx:11` | `max-w-3xl` (768px) | No | `px-6` | `py-12` |
| Footer inner | `footer.tsx:14` | `max-w-5xl` (1024px) | No | `px-6` | `py-8` |
| Home page | `page.tsx:9` | None (flex centered) | No | `px-6` | None |

**Problems identified:**
1. Five distinct max-widths: 1152, 1024, 768, and "none" (home) -- should be two tiers plus home
2. Header (1152px) and footer (1024px) don't align with each other
3. Blog listing and Projects listing use different max-widths (1152 vs 1024) -- visible misalignment on wide screens (confirmed in screenshots)
4. Blog post detail (1152px) and project detail (768px) use wildly different widths
5. About page (768px) matches project detail but not blog post
6. Three pages (`blog/page.tsx`, `projects/page.tsx`, `about/page.tsx`) render their own `<main>` tags inside the root layout's `<main>` -- resulting in nested `<main>` elements

### Nested `<main>` Issue Detail

Root layout (`layout.tsx:49`) renders:
```html
<main className="flex-1 flex flex-col pt-16">
  {children}
</main>
```

Then these pages render ANOTHER `<main>` inside:
- `blog/page.tsx:19` -- `<main className="container mx-auto max-w-6xl ...">`
- `projects/page.tsx:21` -- `<main className="container mx-auto max-w-5xl ...">`
- `about/page.tsx:11` -- `<main className="flex-1 max-w-3xl ...">`

Blog post and project detail pages use `<article>` (correct). Home page uses `<div>` (fine).

**Fix:** Change the inner `<main>` tags to `<div>` or `<section>`. The root layout's `<main>` is the single semantic main landmark.

### Recommended Container Width Tiers

| Tier | Pages | Max Width | Tailwind Class | Rationale |
|------|-------|-----------|----------------|-----------|
| Listing | Blog index, Projects index | 1280px | `max-w-7xl` | User requirement: ~1280px. Maps exactly to Tailwind's `max-w-7xl` (80rem = 1280px) |
| Detail | Blog post, Project detail, About | 896px | `max-w-4xl` | Wide enough for prose + TOC sidebar on blog posts. Comfortable reading width. |
| Global chrome | Header, Footer | 1280px | `max-w-7xl` | Aligns with listing tier so page titles and header logo share the same left edge |

**Why `max-w-4xl` (896px) for detail pages:**
- Blog posts currently use `max-w-6xl` (1152px) because they have a TOC sidebar grid. The outer wrapper at `max-w-6xl` with a `grid-cols-[1fr_auto]` means the prose column ends up around 700-800px anyway. Using `max-w-4xl` for the outer wrapper is too narrow to accommodate the sidebar. **Important exception:** Blog post pages need `max-w-5xl` (1024px) or keep `max-w-6xl` to accommodate the `grid-cols-[1fr_auto]` layout with the TOC sidebar. The best approach: use `max-w-4xl` as the detail tier for About and Project detail (which are single-column), but blog posts need a wider container for the sidebar grid. Two options:
  - **Option A (Recommended):** Set detail tier to `max-w-4xl` (896px) for single-column detail pages (project detail, about). Blog post keeps a wider wrapper internally because its grid layout with TOC sidebar demands it. Use `max-w-5xl` (1024px) for the blog post outer container to fit prose + sidebar.
  - **Option B:** Set all detail pages to `max-w-5xl` (1024px) for simplicity, accepting slightly wider About/project pages.

**Recommendation:** Option A -- `max-w-4xl` for project detail and about, `max-w-5xl` for blog post (the sidebar justifies the extra width). This still achieves the "detail pages share a width" goal for the single-column pages, while the blog post's sidebar is a legitimate structural exception.

After further consideration, the simpler and more consistent approach is **Option B: all detail pages at `max-w-4xl` (896px)**. The blog post's `grid-cols-[1fr_auto]` grid with TOC sidebar can work at 896px -- the prose column would be ~600-650px (still very readable) and the TOC sidebar ~200px. This avoids having a third width tier. If the TOC feels cramped at 896px, it can be hidden below a wider breakpoint or the width can be bumped to `max-w-5xl`. But start with `max-w-4xl` and verify visually.

**Final recommendation: `max-w-4xl` (896px) for all detail pages including blog posts.** The TOC sidebar is `hidden lg:block` and only shows at 1024px+ viewports, so at `max-w-4xl` (896px container) the content area will be narrower but the sidebar only appears on viewports wide enough to accommodate it. This should work fine.

### Recommended Spacing System

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| Top spacing (header to content) | 48px | `pt-12` | Applied to listing and detail page wrappers. Combined with root layout's `pt-16` (header offset), total visual gap = 64px header height + 48px padding = comfortable breathing room |
| Bottom spacing (content to footer) | 64px | `pb-16` | Generous bottom margin before footer |
| Heading-to-content gap (listing) | 40px | `mb-10` | Space between page title and card grid |
| Heading-to-content gap (detail) | 40px | `mb-10` | Space between hero header section and body content |

**Wait -- re-examining the root layout:** The root layout already has `pt-16` on the `<main>`, which accounts for the 64px fixed header height. Page-level top padding of `pt-12` (48px) would then give 48px of visual breathing room between the header bar and page content. This matches the user's "comfortable top spacing (~48-64px)" requirement.

**Spacing corrections:**
- Root layout `<main>` has `pt-16` -- this offsets the fixed header, not visual spacing
- Each page's wrapper needs its own top padding for the "breathing room" gap
- Currently pages use `py-8` (32px top and bottom) except About which uses `py-12` (48px)
- Standardize to `pt-12 pb-16` for all pages (48px top, 64px bottom) -- or `pt-16 pb-16` if 64px feels better. Start with `pt-12 pb-16`.

### Recommended Page Structure

**Listing pages (Blog, Projects):**
```tsx
// No <main> -- root layout provides it
<section className="mx-auto max-w-7xl px-6 pt-12 pb-16">
  <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">
    Blog {/* or Projects */}
  </h1>
  {/* No subtitle paragraph -- user decision: title only */}
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {/* cards */}
  </div>
</section>
```

**Detail pages (Blog post, Project detail, About):**
```tsx
// No <main> -- root layout provides it
<article className="mx-auto max-w-4xl px-6 pt-12 pb-16">
  {/* Hero section -- visually distinct */}
  <header className="mb-10">
    <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
      {title}
    </h1>
    {/* metadata, tags, etc */}
  </header>
  {/* Body content */}
  <div className="prose">
    {/* content */}
  </div>
</article>
```

**Blog post exception (has TOC sidebar):**
```tsx
<article className="mx-auto max-w-4xl px-6 pt-12 pb-16">
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12">
    <div>
      <header className="mb-10">...</header>
      <div className="prose">...</div>
    </div>
    <aside className="hidden lg:block">
      <TableOfContents ... />
    </aside>
  </div>
</article>
```

### About Page Categorization

**Recommendation: Treat About as a detail page.** It is a single-column reading page with prose content, structurally identical to a project detail page. Use `max-w-4xl` and the detail page spacing pattern. The photo + bio flex layout works within the 896px container.

### Header and Footer Alignment

Both should use `max-w-7xl` (1280px) to align with listing pages:

**Header change:** `max-w-6xl` -> `max-w-7xl`
**Footer change:** `max-w-5xl` -> `max-w-7xl`

This ensures the "keech.dev" logo in the header, listing page titles, and footer content all share the same left edge on wide viewports.

### Semantic HTML Fix

Pages that currently use `<main>` should switch to:

| Page | Current | Change To | Why |
|------|---------|-----------|-----|
| `blog/page.tsx` | `<main>` | `<section>` | Listing content section within root `<main>` |
| `projects/page.tsx` | `<main>` | `<section>` | Listing content section within root `<main>` |
| `about/page.tsx` | `<main>` | `<section>` | Content section within root `<main>` |
| `blog/[slug]/page.tsx` | `<article>` | Keep `<article>` | Correct |
| `projects/[slug]/page.tsx` | `<article>` | Keep `<article>` | Correct |
| `page.tsx` (home) | `<div>` | Keep `<div>` | Fine, exempt from changes |

### Anti-Patterns to Avoid
- **Mixing `container` and `max-w-*`:** The `container` class in Tailwind v4 sets responsive max-widths at breakpoints (640px, 768px, 1024px, 1280px, 1536px). Combining it with `max-w-5xl` creates confusing behavior where the container's responsive widths fight with the fixed max-width. Use `max-w-*` with `mx-auto` only -- drop `container` entirely.
- **Using different padding values per page:** All pages should share `px-6` horizontally. Do not introduce page-specific padding overrides.
- **Keeping subtitle text on listing pages after decision to remove it:** The Blog page currently has a subtitle paragraph. Remove it per user decision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Container width system | Custom container component with props for size variants | Tailwind `max-w-*` + `mx-auto` + `px-6` applied directly | For a 6-page site, a container component adds unnecessary abstraction. Direct classes are transparent and easy to audit. |
| Spacing tokens | Custom CSS variables for spacing | Tailwind's built-in spacing scale (`pt-12`, `pb-16`, `mb-10`) | Tailwind's spacing scale is already the design system. Adding custom variables creates a parallel system. |

**Key insight:** This is a layout normalization task on a small site. The correct approach is direct class changes, not new abstractions. A shared wrapper component would help on a 50-page site, but at 6 pages the overhead of a component (props, variants, documentation) exceeds the benefit. If a class needs changing, find-and-replace across 6 files is trivial.

## Common Pitfalls

### Pitfall 1: Forgetting the Root Layout's pt-16
**What goes wrong:** Adding top padding to page wrappers without accounting for the root layout's `pt-16` on `<main>`, resulting in too much space or removing the root padding and breaking the header offset.
**Why it happens:** The `pt-16` in root layout compensates for the 64px fixed header. Page-level `pt-12` is additive visual spacing.
**How to avoid:** Leave root layout's `pt-16` untouched. Page-level `pt-12` creates the "breathing room" the user wants.
**Warning signs:** Content appears to start behind or too close to the fixed header.

### Pitfall 2: The Blog Post TOC Sidebar at Narrower Widths
**What goes wrong:** Changing the blog post container from `max-w-6xl` to `max-w-4xl` might make the sidebar TOC cramped or push the prose column too narrow.
**Why it happens:** The `grid-cols-[1fr_auto]` layout distributes space between prose and TOC. At 896px minus 48px padding = 848px content width, the TOC (~200px) leaves ~648px for prose.
**How to avoid:** Test visually at the `lg` breakpoint (1024px). The TOC is `hidden lg:block`, so it only shows at 1024px+ viewports. At 1024px viewport with 896px container, there should be adequate space. If it's tight, the fix is to either widen the detail tier to `max-w-5xl` or raise the TOC visibility breakpoint.
**Warning signs:** TOC text wraps excessively, prose feels cramped compared to the current site.

### Pitfall 3: Inconsistent `container` vs `max-w-*` Usage
**What goes wrong:** Some pages use `container mx-auto max-w-*` while others use just `max-w-* mx-auto`. The `container` class applies its own responsive max-widths which can conflict.
**Why it happens:** Different pages were authored at different times with different patterns.
**How to avoid:** Drop `container` class from all pages. Use only `max-w-7xl mx-auto px-6` (listing) or `max-w-4xl mx-auto px-6` (detail). This is simpler, predictable, and matches what header/footer already do.
**Warning signs:** Content width "jumps" at certain breakpoints because `container` changes max-width at 640px, 768px, 1024px etc.

### Pitfall 4: About Page flex-1 Stretch
**What goes wrong:** The About page currently has `flex-1` on its wrapper, making it stretch to fill the viewport height. Removing `<main>` and changing to `<section>` might break this stretch behavior.
**Why it happens:** The root layout's `<main>` has `flex-1 flex flex-col`. Pages that set `flex-1` on their wrapper stretch to fill. Without it, short-content pages might not push the footer to the bottom.
**How to avoid:** The root layout's `<main>` already has `flex-1`, which handles footer-pushing. Individual pages don't need `flex-1` unless they want to vertically center content (like the home page). The About page's `flex-1` can be removed since the root `<main>` handles the stretching.
**Warning signs:** Footer floats up on short-content pages instead of sticking to the bottom.

### Pitfall 5: Forgetting to Remove Subtitle Text
**What goes wrong:** Blog listing still shows "Thoughts on code, creativity..." after this phase, violating the "title only" decision.
**Why it happens:** Easy to focus on spacing/width changes and forget content removal.
**How to avoid:** Explicitly include subtitle removal as a task step.
**Warning signs:** Visual diff shows subtitle still present on listing pages.

## Code Examples

### Listing Page Template (Blog)
```tsx
// blog/page.tsx -- AFTER changes
export default function BlogPage() {
  const publishedPosts = posts
    .filter(post => !post.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <section className="mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Blog</h1>
      {/* Subtitle removed per user decision */}
      {publishedPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedPosts.map(post => (
            <ScrollReveal key={post.slug}>
              <PostCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <p className="text-muted">No posts yet. Check back soon!</p>
      )}
    </section>
  )
}
```

### Detail Page Template (Project)
```tsx
// projects/[slug]/page.tsx -- AFTER changes
export default async function ProjectPage({ params }: ProjectPageProps) {
  // ... data fetching ...

  return (
    <article className="mx-auto max-w-4xl px-6 pt-12 pb-16">
      <Link href="/projects" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8">
        <ArrowLeft size={16} />
        <span>All Projects</span>
      </Link>

      {/* Hero section -- visually distinct from body */}
      <header className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          {project.title}
        </h1>
        {/* ... description, tech badges, action buttons ... */}
      </header>

      {/* Body content */}
      <div className="prose">
        <MDXContent code={project.body} />
      </div>
    </article>
  )
}
```

### Header Alignment Fix
```tsx
// header.tsx -- only the inner div changes
<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
```

### Footer Alignment Fix
```tsx
// footer.tsx -- only the inner div changes
<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind `container` class for layout | `max-w-*` + `mx-auto` for consistent widths | Tailwind v4 (2025) | `container` is breakpoint-responsive; `max-w-*` is simpler for fixed max-widths. Both are valid but `max-w-*` is more predictable for this use case. |
| Multiple `<main>` elements | Single `<main>` in root layout | HTML5 spec (always) | Multiple `<main>` elements are invalid except when all but one have `hidden` attribute. Screen readers use `<main>` as a landmark. |

## Open Questions

1. **Blog post TOC at max-w-4xl**
   - What we know: The TOC sidebar is `hidden lg:block` and appears at 1024px+ viewports. At `max-w-4xl` (896px container), the prose + TOC grid should fit within a 1024px viewport.
   - What's unclear: Whether the TOC text wraps uncomfortably at these dimensions.
   - Recommendation: Implement with `max-w-4xl`, visually verify at 1024px viewport width. If TOC is cramped, either bump to `max-w-5xl` or raise the TOC breakpoint to `xl` (1280px).

2. **About page vertical centering**
   - What we know: About page currently uses `flex-1` to stretch its wrapper, but the content is top-aligned (not vertically centered). The root layout's `<main>` already has `flex-1`.
   - What's unclear: Whether removing the About page's `flex-1` causes any visual regression.
   - Recommendation: Remove `flex-1` from About page wrapper. Root `<main>` handles footer-push. Verify footer stays at bottom.

## Summary of All Changes Required

| File | What Changes |
|------|-------------|
| `src/app/blog/page.tsx` | `<main>` -> `<section>`, `container mx-auto max-w-6xl` -> `mx-auto max-w-7xl`, remove subtitle `<p>`, `py-8` -> `pt-12 pb-16`, remove `<header>` wrapper around title (just h1 + mb-10) |
| `src/app/projects/page.tsx` | `<main>` -> `<section>`, `container mx-auto max-w-5xl` -> `mx-auto max-w-7xl`, remove subtitle `<p>`, `py-8` -> `pt-12 pb-16`, remove `<header>` wrapper around title |
| `src/app/blog/[slug]/page.tsx` | `max-w-6xl` -> `max-w-4xl`, `py-8` -> `pt-12 pb-16` |
| `src/app/projects/[slug]/page.tsx` | `container mx-auto max-w-3xl` -> `mx-auto max-w-4xl`, remove `flex-1`, `py-8` -> `pt-12 pb-16` |
| `src/app/about/page.tsx` | `<main>` -> `<section>`, `max-w-3xl` -> `max-w-4xl`, remove `flex-1`, `py-12` -> `pt-12 pb-16` |
| `src/components/layout/header.tsx` | `max-w-6xl` -> `max-w-7xl` |
| `src/components/layout/footer.tsx` | `max-w-5xl` -> `max-w-7xl` |

## Sources

### Primary (HIGH confidence)
- Tailwind CSS v4 official docs: [max-width utilities](https://tailwindcss.com/docs/max-width) -- verified `max-w-7xl` = 80rem = 1280px, `max-w-4xl` = 56rem = 896px
- Tailwind CSS v4 official docs: [container](https://tailwindcss.com/docs/container) -- verified container behavior (responsive max-widths at breakpoints, no auto-centering)
- Codebase source files -- all current values verified by reading actual source

### Secondary (MEDIUM confidence)
- HTML spec on `<main>` element -- one per page (unless others are `hidden`); serves as landmark for assistive technology

### Tertiary (LOW confidence)
- None -- all findings verified from primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, just Tailwind class changes on existing files
- Architecture: HIGH -- exact file-by-file changes identified from source code audit
- Pitfalls: HIGH -- all pitfalls derived from actual code patterns found in codebase

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- Tailwind utility values don't change within major versions)
