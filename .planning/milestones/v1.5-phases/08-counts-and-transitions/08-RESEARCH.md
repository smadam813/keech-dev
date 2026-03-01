# Phase 8: Counts and Transitions - Research

**Researched:** 2026-03-01
**Domain:** CSS transitions, UI count badges, React state-derived display
**Confidence:** HIGH

## Summary

Phase 8 adds two categories of enhancements to the existing filter system: (1) quantitative feedback via count badges on chips and a result count display, and (2) smooth CSS opacity transitions when filter state changes the visible content. All four requirements are achievable with zero new dependencies -- the existing React state, Tailwind CSS v4, and established component patterns provide everything needed.

The count computation is trivial given the small content set (3 posts, 1 project). Both `FilteredPostList` and `FilteredProjectList` already have `filteredPosts`/`filteredProjects` arrays and `isFiltering` flags. Count badges require a new optional `count` prop on `TagChip` and `TechBadge`, and the `FilterBar` `renderChip` callback signature needs the count value threaded through. The fade transition requires a CSS opacity transition on the card grid container, toggled via a state change when the filtered set changes.

**Primary recommendation:** Implement counts as inline parenthetical text within each chip (e.g., `ai (3)`) using the existing `font-mono` style, and fade the grid container as a unit with a 200ms CSS opacity transition.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Must use CSS opacity transitions (no animation libraries -- zero-animation-library constraint)
- Must respect `prefers-reduced-motion` (skip or reduce animations when enabled)

### Claude's Discretion
- **Count badge design**: Full flexibility on visual style (inline parenthetical, superscript, pill, etc.), visibility behavior (always vs. only when filtering), zero-count treatment (dimmed, hidden, or normal), and whether the badge gets its own contrasting background
- **Count context (total vs filtered)**: Whether chip counts are static (total posts with that tag) or contextual (dynamically updating based on other active filters) -- choose what best serves the UX for a small content set
- **Result count display**: Placement (between filter bar and grid, or inline), visibility behavior (only when filtering, or always), exact phrasing
- **Fade transitions**: What fades (individual cards or whole grid), transition speed (cohesive with existing 150ms chip press), whether result count animates with grid or updates instantly

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BLOG-03 | Count badges on each tag chip showing how many posts match that tag | Count computation from `posts` array, `TagChip` `count` prop addition, `FilterBar` callback extension |
| BLOG-04 | Posts fade in/out smoothly when filters change (CSS opacity, respects reduced-motion) | CSS `transition: opacity` on grid container, `prefers-reduced-motion` media query in globals.css |
| PROJ-03 | Count badges on each stack chip showing how many projects match that stack item | Same pattern as BLOG-03 applied to `TechBadge` and `FilteredProjectList` |
| UX-04 | Result count ("Showing X of Y posts/projects") when filters are active | Derived from `filteredPosts.length` / `posts.length` and `isFiltering` flag already in state |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | State management for counts and transition triggers | Already in project |
| Tailwind CSS | v4 | Utility classes for transitions, opacity, layout | Already in project, CSS-first config |
| Next.js | 16 | App Router, client components | Already in project |

### Supporting
No new libraries needed. Everything is built with existing project dependencies.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS opacity transition | Framer Motion / React Spring | Explicitly out of scope (zero-animation-library constraint). CSS transitions are more than sufficient for opacity fades |
| Inline count text | Separate pill/badge component | Over-engineered for a parenthetical number; adds component complexity without visual benefit in neobrutalist aesthetic |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Changes
```
src/
├── components/
│   ├── blog/
│   │   ├── tag-chip.tsx           # Add optional `count` prop
│   │   └── filtered-post-list.tsx # Add count computation, result count, grid fade
│   ├── projects/
│   │   ├── tech-badge.tsx         # Add optional `count` prop
│   │   └── filtered-project-list.tsx # Add count computation, result count, grid fade
│   └── ui/
│       └── filter-bar.tsx         # Extend renderChip callback with `count` prop
└── app/
    └── globals.css                # Add fade transition utility, reduced-motion rule
```

### Pattern 1: Optional Count Prop on Chip Components

**What:** Add an optional `count?: number` prop to `TagChip` and `TechBadge`. When provided, render it as inline parenthetical text after the tag/tech name. When omitted, render exactly as before (preserving backward compatibility for post detail and project detail pages).

**When to use:** Whenever a chip is rendered inside a filter bar context where counts are meaningful.

**Example:**
```typescript
// TagChip with optional count
interface TagChipProps {
  tag: string
  href?: string
  active?: boolean
  onToggle?: () => void
  count?: number
  className?: string
}

export function TagChip({ tag, href, active, onToggle, count, className }: TagChipProps) {
  // In toggle button mode, render count inline
  if (onToggle) {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={cn(/* existing classes */)}
      >
        {tag}
        {count !== undefined && (
          <span className="ml-1 opacity-60">({count})</span>
        )}
      </button>
    )
  }
  // Link and display modes unchanged
  // ...
}
```

### Pattern 2: Count Computation in List Components

**What:** Compute per-tag/per-stack counts inside `FilteredPostList` and `FilteredProjectList` using `useMemo`. The decision is whether counts are static (total posts with tag X regardless of other active filters) or contextual (how many currently visible posts have tag X).

**Recommendation: Use static counts (total posts with each tag).** Rationale for a small content set:
1. With only 3 posts and 7 unique tags, contextual counts would create confusing rapid changes (e.g., selecting "ai" immediately drops most other tag counts to 1-2, which feels noisy rather than informative)
2. Static counts answer the more useful question: "How popular is this tag overall?"
3. Contextual counts are more valuable when content sets are large enough (50+) that users need guidance on which secondary filters will yield results vs. empty sets. With 3 posts this is unnecessary.
4. Static counts can be computed once and memoized without recalculation on every filter change.

**Example:**
```typescript
// Inside FilteredPostList
const tagCounts = useMemo(() => {
  const counts: Record<string, number> = {}
  for (const tag of allTags) {
    counts[tag] = posts.filter((p) => p.tags.includes(tag)).length
  }
  return counts
}, [posts, allTags])
```

### Pattern 3: Extended renderChip Callback

**What:** Add `count` to the `renderChip` callback props in `FilterBar`. The list components pass count data when calling `renderChip`.

**Example:**
```typescript
// FilterBar interface update
interface FilterBarProps {
  items: string[]
  activeItems: Set<string>
  onToggle: (item: string) => void
  onClear: () => void
  renderChip: (props: {
    item: string
    active: boolean
    onToggle: () => void
    count?: number       // NEW
  }) => ReactNode
  counts?: Record<string, number>  // NEW
  label?: string
}

// FilterBar rendering update
{items.map((item) =>
  renderChip({
    item,
    active: activeItems.has(item),
    onToggle: () => onToggle(item),
    count: counts?.[item],     // Thread count through
  })
)}
```

### Pattern 4: Result Count Display

**What:** A simple conditional text element between the filter bar and the grid that shows "Showing X of Y posts" when filters are active. Updates instantly (no fade) because the count is pure state, and fading a number change looks odd.

**Recommendation:** Show only when `isFiltering` is true. Place between `FilterBar` and the grid `<div>`. Use `font-mono text-sm text-muted` styling consistent with the neobrutalist chip aesthetic.

**Example:**
```typescript
{isFiltering && (
  <p className="text-sm font-mono text-muted mb-4">
    Showing {filteredPosts.length} of {posts.length} posts
  </p>
)}
```

### Pattern 5: CSS Opacity Fade on Grid

**What:** Wrap the card grid in a container with a CSS `transition: opacity` property. When filter state changes, briefly reduce opacity to 0 then restore to 1. This creates a smooth "dissolve" effect.

**Implementation approach:** Use a `useEffect` + state toggle pattern. When `filteredPosts` changes (detected by a key derived from the filtered slugs), set a `fading` state to true, then after a short delay set it back to false. The CSS transition handles the visual interpolation.

**Important consideration:** The fade should be a quick flash (150-200ms down, 150-200ms up) that signals "the content changed" without making the UI feel slow. Total cycle should be under 400ms.

**Example:**
```typescript
// In FilteredPostList
const [isTransitioning, setIsTransitioning] = useState(false)
const filteredKey = filteredPosts.map(p => p.slug).join(',')

useEffect(() => {
  if (!isFiltering) return  // No fade when showing all
  setIsTransitioning(true)
  const timer = setTimeout(() => setIsTransitioning(false), 150)
  return () => clearTimeout(timer)
}, [filteredKey])

// JSX
<div
  className={cn(
    'grid gap-6 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200',
    isTransitioning ? 'opacity-0' : 'opacity-100'
  )}
>
  {/* cards */}
</div>
```

### Pattern 6: Respecting prefers-reduced-motion

**What:** The fade transition must be skipped when the user has enabled reduced motion. Two approaches exist in the codebase:

1. **CSS-only approach (globals.css):** Add a `@media (prefers-reduced-motion: reduce)` rule that sets `transition: none !important` on the grid container. This is the cleanest approach since it requires no JS and the existing globals.css already has a reduced-motion section.

2. **JS approach (like ScrollReveal):** Check `window.matchMedia('(prefers-reduced-motion: reduce)')` in useEffect and skip the fade state toggle.

**Recommendation:** Use the CSS-only approach. The fade is purely a CSS transition, so the reduced-motion media query in CSS is sufficient and simpler. The JS approach would add unnecessary complexity since the transition timing is CSS-driven anyway.

**Example (globals.css addition):**
```css
@media (prefers-reduced-motion: reduce) {
  /* ...existing rules... */

  .filter-grid-fade {
    transition: none !important;
  }
}
```

### Anti-Patterns to Avoid
- **JavaScript-driven animation frames:** Do not use `requestAnimationFrame` loops for opacity. CSS transitions handle this natively with GPU acceleration.
- **Animating individual cards independently:** With 3 posts and 2 columns, staggered card animations would look stuttery and over-designed. Fading the grid as a unit is cleaner.
- **useLayoutEffect for transitions:** `useLayoutEffect` is for preventing visual flicker on initial paint. Transition state changes should use `useEffect` to allow the browser to paint the current state before transitioning.
- **Heavy re-renders from count computation:** Do not compute counts on every render. Wrap in `useMemo` with `[posts, allTags]` dependencies (which are stable props from the server page).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Opacity transitions | Custom JS animation loop | CSS `transition: opacity` | Browser-optimized, GPU-accelerated, one line |
| Reduced motion detection | Custom matchMedia listener + state | `@media (prefers-reduced-motion: reduce)` in CSS | Declarative, no JS needed for CSS-only transitions |
| Class merging | String concatenation | `cn()` (clsx + tailwind-merge) | Already established in project, handles conflicts |

**Key insight:** This phase adds zero new technology. Every feature is a composition of existing React state, CSS properties, and Tailwind utilities already in use throughout the codebase.

## Common Pitfalls

### Pitfall 1: Fade Triggers on Initial Render
**What goes wrong:** The grid fades in on page load because the `useEffect` runs on mount and sets `isTransitioning`.
**Why it happens:** `useEffect` fires after initial render, and the dependency (`filteredKey`) has a value from the start.
**How to avoid:** Guard with an `isFiltering` check -- only fade when filters are active. On initial load with no URL params, `isFiltering` is false so no fade occurs. If URL has pre-set filters on load, the content should appear immediately (skip the initial transition by tracking whether it's the first render via a ref).
**Warning signs:** Page loads with a flash of invisible content before cards appear.

### Pitfall 2: Breaking TagChip/TechBadge on Detail Pages
**What goes wrong:** Adding a required `count` prop causes TypeScript errors on post/project detail pages where chips are display-only.
**Why it happens:** Detail pages render `<TagChip tag={tag} />` without `onToggle` or `count`.
**How to avoid:** Make `count` optional (`count?: number`). Only render the count when the prop is provided AND the component is in toggle mode (`onToggle` is defined).
**Warning signs:** TypeScript compilation errors in `src/app/blog/[slug]/page.tsx` or `src/app/projects/[slug]/page.tsx`.

### Pitfall 3: Transition Fires Before Content Updates
**What goes wrong:** The grid fades out, the content changes while invisible, then fades back in. But if the state update and the fade happen in the same render cycle, the user might see the old content fade in before the new content appears.
**Why it happens:** React batches state updates, so `setIsTransitioning(true)` and the filter change happen simultaneously.
**How to avoid:** Since the filter change and the `filteredKey` effect are naturally sequenced (filter changes re-compute `filteredPosts` which changes `filteredKey` which triggers the effect), React's rendering order handles this correctly. The transition effect fires after the new filtered content is rendered. The fade-out-then-in approach (opacity 0 then back to 1) works because by the time opacity returns to 1, the new content is already in the DOM.
**Warning signs:** Old content visible during fade-in phase.

### Pitfall 4: Result Count Flickers During Transition
**What goes wrong:** The "Showing X of Y" text updates before the grid fade completes, creating a jarring desync.
**Why it happens:** The result count updates on the same state change as the filter toggle, which is immediate.
**How to avoid:** Let the result count update instantly. This is actually correct behavior -- the user clicked a filter, the count feedback is immediate, and the grid smoothly transitions. Trying to delay the count to match the fade adds complexity and makes the UI feel slower.
**Warning signs:** None -- instant count updates are the correct UX.

### Pitfall 5: Reduced Motion Incorrectly Applied
**What goes wrong:** The CSS `transition: none` rule is too broad and removes chip press animations too.
**Why it happens:** Using a generic selector that matches all transitions.
**How to avoid:** Scope the reduced-motion override specifically to the grid fade transition class (e.g., `.filter-grid-fade`), not all transitions. The existing chip `transition-all duration-150` should remain functional even in reduced-motion mode (it's a press feedback, not a motion animation -- though this is a gray area, most implementations keep micro-interactions).
**Warning signs:** Chips lose their press animation when reduced motion is enabled.

## Code Examples

### Complete TagChip with Count Prop
```typescript
// Source: existing src/components/blog/tag-chip.tsx + count extension
interface TagChipProps {
  tag: string
  href?: string
  active?: boolean
  onToggle?: () => void
  count?: number
  className?: string
}

export function TagChip({ tag, href, active, onToggle, count, className }: TagChipProps) {
  const baseClasses = 'inline-block px-2 py-0.5 text-xs font-mono font-bold border-2 border-black'

  if (onToggle) {
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={cn(
          baseClasses,
          'transition-all duration-150 cursor-pointer',
          active
            ? 'bg-accent text-white shadow-brutal-hover translate-x-[2px] translate-y-[2px]'
            : 'bg-accent/10 shadow-brutal hover:bg-accent/20 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-hover',
          className
        )}
      >
        {tag}
        {count !== undefined && (
          <span className="ml-1 opacity-60">({count})</span>
        )}
      </button>
    )
  }

  // Link and display modes unchanged (no count displayed)
  if (href) {
    return (
      <Link href={href} className={cn(baseClasses, 'bg-accent/10', 'hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150', className)}>
        {tag}
      </Link>
    )
  }

  return <span className={cn(baseClasses, 'bg-accent/10', className)}>{tag}</span>
}
```

### Count Computation and Result Count in FilteredPostList
```typescript
// Source: existing src/components/blog/filtered-post-list.tsx + enhancements

// Count computation (inside component body)
const tagCounts = useMemo(() => {
  const counts: Record<string, number> = {}
  for (const tag of allTags) {
    counts[tag] = posts.filter((p) => p.tags.includes(tag)).length
  }
  return counts
}, [posts, allTags])

// Result count JSX (between FilterBar and grid)
{isFiltering && (
  <p className="text-sm font-mono text-muted mb-4">
    Showing {filteredPosts.length} of {posts.length} posts
  </p>
)}
```

### Grid Fade Transition
```typescript
// Fade state management
const [isTransitioning, setIsTransitioning] = useState(false)
const prevFilteredRef = useRef(filteredPosts)

useEffect(() => {
  // Skip fade on initial render or when not filtering
  if (!isFiltering) {
    prevFilteredRef.current = filteredPosts
    return
  }
  // Only fade when the filtered set actually changes
  if (prevFilteredRef.current !== filteredPosts) {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 150)
    prevFilteredRef.current = filteredPosts
    return () => clearTimeout(timer)
  }
}, [filteredPosts, isFiltering])

// Grid JSX with transition class
<div
  className={cn(
    'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
    'transition-opacity duration-200 filter-grid-fade',
    isTransitioning ? 'opacity-0' : 'opacity-100'
  )}
>
  {filteredPosts.map((post) => (
    <PostCard key={post.slug} post={post} />
  ))}
</div>
```

### globals.css Addition
```css
/* In the existing @media (prefers-reduced-motion: reduce) block */
.filter-grid-fade {
  transition: none !important;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS animation libraries for fade | CSS `transition: opacity` | Always available | Zero-dependency, GPU-accelerated |
| JS matchMedia for reduced motion | CSS `@media (prefers-reduced-motion)` | CSS Level 5 (2020+) | Declarative, no JS state needed for CSS transitions |
| Complex count badge components | Inline parenthetical text | N/A (design choice) | Simpler markup, consistent with neobrutalist "content over chrome" |

**Deprecated/outdated:**
- None relevant. CSS transitions and `prefers-reduced-motion` are stable, well-supported standards.

## Open Questions

1. **Fade direction: out-then-in vs. crossfade**
   - What we know: The simplest approach is toggling opacity (0 then 1) with a CSS transition. This creates a brief flash where content disappears then reappears with new items.
   - What's unclear: Whether a pure opacity toggle looks smooth enough, or if the brief invisible state is jarring.
   - Recommendation: Implement the simple toggle first. With 200ms total cycle time, the invisible period is barely perceptible. If it feels rough during implementation, consider increasing to 300ms or using a two-phase approach (fade out old, swap content, fade in new) via a short timeout chain.

2. **Count visibility when not filtering**
   - What we know: Counts could be always visible or appear only when filtering is active.
   - What's unclear: Which looks better with the neobrutalist aesthetic -- always showing `ai (3)` adds information density, but with only 3 posts and small numbers the counts may look like noise.
   - Recommendation: Show counts always (not just when filtering). They serve as at-a-glance metadata even before the user starts filtering. The small content set means the numbers are easy to scan. If the visual noise is too much during implementation, conditionally showing only when filtering is a trivial guard.

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `src/components/blog/tag-chip.tsx`, `src/components/projects/tech-badge.tsx`, `src/components/ui/filter-bar.tsx`, `src/components/blog/filtered-post-list.tsx`, `src/components/projects/filtered-project-list.tsx`, `src/components/ui/scroll-reveal.tsx`, `src/app/globals.css`
- CONTEXT.md (08-CONTEXT.md) -- user decisions and code context from discuss phase
- CLAUDE.md -- project architecture, animation patterns, styling conventions

### Secondary (MEDIUM confidence)
- CSS `transition` property and `prefers-reduced-motion` media query are stable web standards with universal browser support. No version-specific concerns.

### Tertiary (LOW confidence)
- None. All recommendations are based on codebase analysis and established CSS/React patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all existing project tech
- Architecture: HIGH - Patterns are direct extensions of existing code (optional props, useMemo, CSS transitions)
- Pitfalls: HIGH - Identified from codebase analysis (backward compatibility, initial render, reduced motion scoping)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable patterns, no fast-moving dependencies)
