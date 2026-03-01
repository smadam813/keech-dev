# Phase 6: Filter Components - Research

**Researched:** 2026-02-27
**Domain:** Interactive toggle chip components and reusable filter bar UI for neobrutalist design system
**Confidence:** HIGH

## Summary

Phase 6 is a UI component phase -- no new dependencies, no state management, no page-level changes. The scope is evolving two existing display-only components (`TagChip` and `TechBadge`) into polymorphic components that support both static display and interactive toggle modes, then composing them into a reusable `FilterBar` component.

The existing components share identical styling (`px-2 py-0.5 text-xs font-mono font-bold border-2 border-black bg-accent/10`) and render as `<span>` elements. The toggle variant must render as `<button>` with `aria-pressed`, gain neobrutalist press animation (translate + shadow), and provide clear active/inactive visual states using the site's teal accent palette. The filter bar wraps a row of interactive chips with a conditional "Clear all" button.

This phase explicitly does NOT wire components to listing pages, manage filter state, handle URL persistence, or modify page files. Those concerns belong to Phase 7. Phase 6 delivers the building blocks; Phase 7 assembles them.

**Primary recommendation:** Extend `TagChip` and `TechBadge` with optional `active` + `onToggle` props. When `onToggle` is provided, render as `<button type="button" aria-pressed={active}>`. Keep the existing `href` and display-only paths unchanged. Build a single `FilterBar` client component that renders either chip type.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tags on blog post cards remain static/display-only -- filter interaction only happens in the filter bar (FILT-03 is deferred to future requirements)

### Claude's Discretion
All visual and interaction design decisions for this phase are at Claude's discretion. The user trusts Claude to make choices that:
- Fit the neobrutalist visual identity (hard shadows, bold borders, dusty rose + teal palette)
- Match existing site patterns (shadow-brutal, border-2, accent colors)
- Provide clear visual distinction between active and inactive states
- Feel satisfying and responsive on click
- Work well with the existing TagChip and TechBadge component structure

Specific discretion areas:
- Active chip styling (color palette, fill vs outline, shadow behavior)
- Inactive chip styling (keep current bg-accent/10 or go transparent)
- Hover states for inactive chips
- Filter bar layout (wrapping rows vs horizontal scroll, sort order, chip flow)
- "Clear all" button placement and label
- Whether filter bar has a label or shows chips directly
- Press animation feel (depth, mode, speed)
- Whether chips have shadow-brutal at rest
- Whether TagChip and TechBadge look different as filter toggles
- Component architecture (single generic FilterBar vs separate per-page)
- Whether active chips show a checkmark icon or rely on color alone

### Deferred Ideas (OUT OF SCOPE)
- Clicking a tag on a blog post card to activate that filter (FILT-03) -- explicitly deferred to future requirements
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | User can see clear visual distinction between active (selected) and inactive filter chips | Neobrutalist active/inactive palette documented below (filled teal + depressed shadow vs transparent outline). Toggle button pattern with `aria-pressed` provides semantic distinction for assistive technology. |
| UX-05 | User can see filter chips press down on click with neobrutalist animation (translate + shadow reduction) | Press animation pattern documented with specific translate/shadow values matching existing codebase conventions (`shadow-brutal` -> `shadow-brutal-hover`, translate 2px). CSS `transition-all duration-150` matches existing card/button patterns. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.4 | Component rendering, props-based polymorphism | Already in project. Conditional rendering via props is the standard React pattern for polymorphic components. |
| Tailwind CSS v4 | 4.1.18 | All styling -- active/inactive states, press animations, transitions | Already in project. CSS-first config via `@theme` in `globals.css`. All design tokens are Tailwind utilities. |
| `cn()` (clsx + tailwind-merge) | clsx 2.1.1, twMerge 3.4.0 | Conditional class composition for active/inactive states | Already used in every component. Standard pattern: `cn(baseClasses, active && activeClasses, !active && inactiveClasses)`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | -- | -- | This phase creates UI components using only existing dependencies. Zero new packages. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending TagChip/TechBadge | Creating new `FilterChip` component | New component avoids prop bloat but duplicates styling. Extension is preferred because the design language must be unified -- a filter chip IS a tag chip in toggle mode. |
| CSS `transition-all` | Framer Motion AnimatePresence | Out of scope per CLAUDE.md. CSS transitions handle translate + shadow reduction with zero dependencies. |
| Inline Tailwind classes | CSS custom properties for active/inactive | Custom properties would require globals.css changes. Tailwind conditional classes via `cn()` are the established project pattern. |

**Installation:**
```bash
# No installation needed. Zero new dependencies.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    blog/
      tag-chip.tsx          # MODIFIED -- add toggle variant (active, onToggle props)
    projects/
      tech-badge.tsx        # MODIFIED -- add toggle variant (active, onToggle props)
    ui/
      filter-bar.tsx        # NEW -- 'use client', reusable filter bar with chips + clear button
```

### Pattern 1: Polymorphic Component via Props

**What:** A single component renders as different HTML elements based on which props are provided. When `onToggle` is passed, render as `<button>`. When `href` is passed, render as `<Link>`. When neither, render as `<span>`.

**When to use:** When the same visual element appears in different interactive contexts (display, navigation, toggle) and must maintain identical styling across all modes.

**Example (TagChip evolution):**
```typescript
interface TagChipProps {
  tag: string
  href?: string
  active?: boolean
  onToggle?: () => void
  className?: string
}

export function TagChip({ tag, href, active, onToggle, className }: TagChipProps) {
  const baseClasses = 'inline-block px-2 py-0.5 text-xs font-mono font-bold border-2 border-black'

  // Toggle button mode
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
            : 'bg-accent/10 shadow-brutal hover:bg-accent/20',
          className
        )}
      >
        {tag}
      </button>
    )
  }

  // Link mode (existing)
  if (href) {
    return (
      <Link href={href} className={cn(baseClasses, 'bg-accent/10', /* hover styles */, className)}>
        {tag}
      </Link>
    )
  }

  // Display-only mode (existing)
  return <span className={cn(baseClasses, 'bg-accent/10', className)}>{tag}</span>
}
```

**Key points:**
- `aria-pressed` is only present when `onToggle` is provided (toggle mode)
- The `<button>` gets `type="button"` to prevent accidental form submission
- Active state uses filled accent background; inactive uses the existing `bg-accent/10`
- The display-only and link paths remain identical to current behavior -- zero regression risk

### Pattern 2: Neobrutalist Press Animation via CSS State

**What:** Active (pressed) toggle chips translate down-right and reduce shadow, mimicking a physical button being depressed. This matches the existing card/button hover pattern but is applied as a persistent state rather than a hover effect.

**When to use:** For toggle buttons in the neobrutalist design system where active state should feel like a "held down" button.

**Example (active vs inactive chip states):**
```
INACTIVE chip (at rest):
  ┌─────────┐
  │   tag    │ ← border-2 border-black
  └─────────┘
  ░░░░░░░░░░░ ← shadow-brutal (4px 4px 0 0 #000)

  Background: bg-accent/10 (subtle teal tint)
  Text: text-foreground (black)

ACTIVE chip (pressed/depressed):
    ┌─────────┐
    │   tag    │ ← border-2 border-black
    └─────────┘
    ░░░░░░░░░░ ← shadow-brutal-hover (2px 2px 0 0 #000)

  Background: bg-accent text-white (filled teal)
  Position: translate-x-[2px] translate-y-[2px]
```

**CSS implementation:**
```
Inactive: shadow-brutal, no translate, bg-accent/10, text-foreground
Active:   shadow-brutal-hover, translate-x-[2px] translate-y-[2px], bg-accent, text-white
Hover on inactive: bg-accent/20 (subtle hover hint)
Transition: transition-all duration-150
```

**Rationale for these specific values:**
- `shadow-brutal` (4px) to `shadow-brutal-hover` (2px) = 2px shadow reduction, matching how cards behave on hover
- `translate-x-[2px] translate-y-[2px]` = 2px depression, same as card hover translate
- `duration-150` = same as existing card and button transitions
- Active chips stay depressed (not momentary press) -- this communicates persistent selected state

### Pattern 3: FilterBar as a Client Component Composition

**What:** A `'use client'` component that renders a row of interactive chips based on props. It does NOT own filter state -- it receives `items`, `activeItems`, and `onToggle` as props from a parent. The "Clear all" button calls an `onClear` callback.

**When to use:** When the filter bar UI needs to be reusable across blog (tags) and projects (stack) pages, with the parent component owning the filter state.

**Example:**
```typescript
'use client'

interface FilterBarProps {
  items: string[]
  activeItems: Set<string>
  onToggle: (item: string) => void
  onClear: () => void
  renderChip: (props: { item: string; active: boolean; onToggle: () => void }) => React.ReactNode
  label?: string
}

export function FilterBar({ items, activeItems, onToggle, onClear, renderChip, label }: FilterBarProps) {
  const hasActive = activeItems.size > 0

  return (
    <div role="group" aria-label={label || 'Filters'} className="mb-6">
      <div className="flex flex-wrap gap-2">
        {items.map(item => renderChip({
          item,
          active: activeItems.has(item),
          onToggle: () => onToggle(item),
        }))}
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-0.5 text-xs font-mono font-bold text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
```

**Key design decisions:**
- **`renderChip` prop:** Allows blog pages to pass `TagChip` and project pages to pass `TechBadge` without the FilterBar knowing about either. This keeps the FilterBar generic without premature abstraction.
- **`role="group"` + `aria-label`:** WAI-ARIA pattern for grouping related toggle buttons. The label describes purpose ("Filter by tag" / "Filter by technology").
- **"Clear all" inline at end:** Appears at the end of the chip row, only when filters are active. This placement is natural -- the user's eye follows the chip row and finds the clear action at the end.
- **No label text above chips:** The chips themselves are self-explanatory. A "Filter by tags:" label adds clutter for zero informational value when the context (blog listing page with tag chips) is obvious.
- **`flex-wrap`:** Wrapping rows rather than horizontal scroll. With 7 blog tags and 8 project stack items, the chips fit on a single row on desktop and wrap to 2 rows on mobile. Horizontal scroll requires scroll indicators and is harder to scan. At this tag count, wrapping is simpler and more accessible.

### Anti-Patterns to Avoid

- **Creating a new FilterChip component instead of extending TagChip/TechBadge:** Duplicates the visual styling and creates a maintenance burden. The chip design language should be unified -- a toggle chip IS a tag chip with interactive behavior.
- **Using checkbox inputs for filter toggles:** `<input type="checkbox">` has wrong semantics for a filter chip. Toggle buttons (`<button aria-pressed>`) are the correct WAI-ARIA pattern per the APG Button specification. Checkboxes imply a form submission workflow.
- **Adding `'use client'` to TagChip/TechBadge:** These components do not need the directive. They are used in both server (post detail pages) and client (filter bar) contexts. Components without `'use client'` work in both contexts. The `'use client'` boundary lives in `FilterBar`, not in the chip components.
- **Putting filter state inside FilterBar:** The FilterBar should be a controlled component (receives state via props, calls callbacks to change it). Owning state inside makes it impossible for Phase 7 to lift state to URL params or share it with the filtered listing.
- **Adding checkmark icons to active chips:** Color change (filled teal vs outlined) is sufficient distinction. Checkmarks add visual noise in small chips (text-xs) and fight the neobrutalist aesthetic which favors bold color over iconography.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle button semantics | Custom ARIA role management | Native `<button>` + `aria-pressed` | The browser provides focus management, keyboard handling (Space/Enter), and screen reader announcements for free with `<button>`. |
| Conditional class merging | String concatenation for active/inactive classes | `cn()` (clsx + tailwind-merge) | Already in the project. Handles conflicting Tailwind classes (e.g., `bg-accent/10` vs `bg-accent`) correctly via tailwind-merge. |
| Press animation | JavaScript-driven animation | CSS `transition-all` + translate + shadow | CSS transitions are hardware-accelerated and match the existing site pattern. Zero JS animation code needed. |

**Key insight:** This phase is CSS + HTML semantics. The interactive behavior (toggle, press animation) is entirely achievable with native HTML elements and CSS transitions. There is no need for animation libraries, state management libraries, or accessibility middleware.

## Common Pitfalls

### Pitfall 1: Regression on Post Detail Pages

**What goes wrong:** Adding `active` and `onToggle` props to `TagChip` causes TypeScript errors or unexpected behavior in existing usage sites (post cards, blog detail page, project detail page) where these props are not provided.

**Why it happens:** If the component conditionally changes behavior based on new props without proper defaults, existing call sites may render differently.

**How to avoid:**
- Make `active` and `onToggle` optional with no default behavior change. When both are undefined, the component renders exactly as before (as `<span>` or `<Link>`).
- The render path branches: `if (onToggle)` -> button mode, `else if (href)` -> link mode, `else` -> span mode. Existing call sites pass neither `onToggle` nor `active`, so they hit the original paths.
- Test by verifying: blog post detail page tags render as `<span>`, post card tags render as `<span>`, project detail page badges render as `<span>`. None should become `<button>`.

**Warning signs:** Tags on post detail pages suddenly look different (filled background, shadows) or become focusable/clickable.

### Pitfall 2: Missing Keyboard Support

**What goes wrong:** Chips look interactive but cannot be activated via keyboard. Tab skips over them, or Space/Enter do nothing.

**Why it happens:** Using `<div>` or `<span>` with `onClick` instead of `<button>`. Non-button elements do not receive keyboard focus or fire click events on Space/Enter by default.

**How to avoid:** Use `<button type="button">`. Native `<button>` elements get free keyboard support: focusable via Tab, activatable via Space and Enter. No additional JavaScript needed.

**Warning signs:** Cannot tab to filter chips. Pressing Space or Enter while focused on a chip does nothing.

### Pitfall 3: aria-pressed on Non-Toggle Elements

**What goes wrong:** `aria-pressed` is added to display-only chips (the `<span>` variant) or to the link variant, confusing screen readers. A span announcing "tag: ai, toggle button, not pressed" when it is not actually interactive is worse than no ARIA at all.

**Why it happens:** Applying `aria-pressed` unconditionally regardless of the render mode.

**How to avoid:** Only add `aria-pressed` when the component is in toggle mode (when `onToggle` is provided and the element is a `<button>`). The `if (onToggle)` branch is the only path that renders `aria-pressed`.

**Warning signs:** Screen reader announces "toggle button" on non-interactive tag chips in blog post headers.

### Pitfall 4: Shadow-Brutal Looking Wrong at Small Scale

**What goes wrong:** Adding `shadow-brutal` (4px offset) to small chips (`text-xs`, roughly 20-24px tall) makes the shadow disproportionately large. The chip looks like it is floating too high, and the depressed state animation (4px -> 2px) is too dramatic for the element size.

**Why it happens:** The `shadow-brutal` value was designed for larger elements (cards at 200+ px, buttons at 40+ px). Applying it to 24px-tall chips creates visual imbalance.

**How to avoid:** The recommended approach is to give inactive chips `shadow-brutal` (4px) and active chips `shadow-brutal-hover` (2px) with a 2px translate. This actually works well at small scale because:
- The 4px shadow on inactive creates an "elevated" feel that invites clicking
- The 2px translate + reduced shadow on active creates a satisfying "snap down"
- The relative proportion (4px shadow on 24px element = 17%) is bold, which is correct for neobrutalism

If testing reveals the shadow looks too heavy, a fallback is to use a smaller custom shadow (e.g., `2px 2px 0 0 #000` inactive, `1px 1px 0 0 #000` active) but start with the standard `shadow-brutal` values and evaluate visually.

**Warning signs:** Chips look like they are floating in space rather than sitting on the page. The active/inactive state transition looks jarring rather than satisfying.

### Pitfall 5: Tailwind-Merge Conflicts with Shadow Utilities

**What goes wrong:** When using `cn()` to merge base classes with conditional active/inactive classes, `tailwind-merge` may not correctly handle shadow utility merging. For example, `cn('shadow-brutal', active && 'shadow-brutal-hover')` might not strip `shadow-brutal` when `shadow-brutal-hover` is applied, because these are custom shadow values defined in `@theme`, not standard Tailwind shadow utilities.

**Why it happens:** `tailwind-merge` recognizes standard Tailwind `shadow-*` utilities but may not recognize custom `--shadow-brutal` and `--shadow-brutal-hover` as conflicting values if they are defined as custom theme tokens.

**How to avoid:**
- Test the `cn()` output explicitly: `cn('shadow-brutal', 'shadow-brutal-hover')` should produce only `shadow-brutal-hover`.
- If tailwind-merge does not strip the conflicting shadow, use conditional rendering: `active ? 'shadow-brutal-hover' : 'shadow-brutal'` instead of merging both.
- The safe pattern: `cn(baseClasses, active ? activeClasses : inactiveClasses)` where active and inactive classes are mutually exclusive strings, never both applied.

**Warning signs:** Both shadows render simultaneously (double shadow offset). Inspect element shows both `shadow-brutal` and `shadow-brutal-hover` in the class list.

### Pitfall 6: FilterBar Component Not Marked 'use client'

**What goes wrong:** The `FilterBar` component accepts `onToggle` and `onClear` callbacks (functions). If it is not marked `'use client'`, Next.js will try to serialize these functions across the server/client boundary, which fails with "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'."

**Why it happens:** The FilterBar does not directly use hooks (no `useState`, no `useEffect`), so a developer might assume it can be a server component. But it receives function props from a client parent, which means it must be in the client component tree.

**How to avoid:** Add `'use client'` to `filter-bar.tsx`. Even though the component itself does not use hooks, it receives and calls function props, which requires it to be a client component. (Alternatively, it can omit `'use client'` if it is only ever imported by client components -- but adding the directive is explicit and prevents confusion.)

**Warning signs:** Build error about functions not being serializable across the server/client boundary.

## Code Examples

### TagChip Evolution (Complete)

```typescript
// src/components/blog/tag-chip.tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagChipProps {
  tag: string
  href?: string
  active?: boolean
  onToggle?: () => void
  className?: string
}

export function TagChip({ tag, href, active, onToggle, className }: TagChipProps) {
  const baseClasses = 'inline-block px-2 py-0.5 text-xs font-mono font-bold border-2 border-black'

  // Toggle button mode (for filter bar)
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
            : 'bg-accent/10 shadow-brutal hover:bg-accent/20',
          className
        )}
      >
        {tag}
      </button>
    )
  }

  // Link mode (existing behavior)
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseClasses,
          'bg-accent/10',
          'hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150',
          className
        )}
      >
        {tag}
      </Link>
    )
  }

  // Display-only mode (existing behavior)
  return <span className={cn(baseClasses, 'bg-accent/10', className)}>{tag}</span>
}
```

### TechBadge Evolution (Complete)

```typescript
// src/components/projects/tech-badge.tsx
import { cn } from '@/lib/utils'

interface TechBadgeProps {
  tech: string
  active?: boolean
  onToggle?: () => void
  className?: string
}

export function TechBadge({ tech, active, onToggle, className }: TechBadgeProps) {
  const baseClasses = 'inline-block px-2 py-0.5 text-xs font-mono font-bold border-2 border-black'

  // Toggle button mode (for filter bar)
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
            : 'bg-accent/10 shadow-brutal hover:bg-accent/20',
          className
        )}
      >
        {tech}
      </button>
    )
  }

  // Display-only mode (existing behavior)
  return (
    <span className={cn(baseClasses, 'bg-accent/10', className)}>
      {tech}
    </span>
  )
}
```

### FilterBar Component (Complete)

```typescript
// src/components/ui/filter-bar.tsx
'use client'

import { type ReactNode } from 'react'

interface FilterBarProps {
  items: string[]
  activeItems: Set<string>
  onToggle: (item: string) => void
  onClear: () => void
  renderChip: (props: { item: string; active: boolean; onToggle: () => void }) => ReactNode
  label?: string
}

export function FilterBar({
  items,
  activeItems,
  onToggle,
  onClear,
  renderChip,
  label = 'Filters',
}: FilterBarProps) {
  const hasActive = activeItems.size > 0

  return (
    <div role="group" aria-label={label} className="mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {items.map((item) =>
          renderChip({
            item,
            active: activeItems.has(item),
            onToggle: () => onToggle(item),
          })
        )}
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-0.5 text-xs font-mono font-bold text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
```

### Usage Example (Phase 7 Preview -- NOT Part of Phase 6)

```typescript
// This shows how Phase 7 will consume the Phase 6 components.
// Phase 6 only creates the components. Phase 7 wires them to pages.

<FilterBar
  items={allTags}
  activeItems={activeTags}
  onToggle={handleToggle}
  onClear={() => setActiveTags(new Set())}
  renderChip={({ item, active, onToggle }) => (
    <TagChip key={item} tag={item} active={active} onToggle={onToggle} />
  )}
  label="Filter by tag"
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<span onClick>` for toggle chips | `<button aria-pressed>` for toggle chips | WAI-ARIA APG pattern, stable since ARIA 1.1 (2017) | Screen readers announce toggle state; keyboard support is free; no custom ARIA role management needed |
| `role="checkbox"` for filter toggles | `aria-pressed` on `<button>` | WAI-ARIA APG clarification | Toggle buttons (not checkboxes) are the correct pattern for filter chip toggles. Checkboxes imply form submission semantics. |
| JavaScript focus management for custom toggles | Native `<button>` element | Always was the correct approach | `<button>` gets Tab focus, Space/Enter activation, and click events with zero JavaScript. Custom elements require `tabindex`, `role`, `onKeyDown` handlers. |

**Deprecated/outdated:**
- Using `role="button"` on `<div>`/`<span>` for toggle behavior: Always use native `<button>` instead. The `role="button"` approach requires manual keyboard handling and focus management.
- CSS `active:` pseudo-class for persistent toggle state: `active:` only fires during the mousedown-to-mouseup interval. For persistent toggle state, use conditional classes based on component state.

## Open Questions

1. **Shadow scale at chip size**
   - What we know: The existing `shadow-brutal` (4px) was designed for cards and buttons that are 40+ px tall. Chips are ~24px tall.
   - What's unclear: Whether the 4px shadow looks proportionally correct on small chips.
   - Recommendation: Start with `shadow-brutal` (4px) for inactive chips. If it looks too heavy during implementation, define a `shadow-brutal-sm` value (e.g., `2px 2px 0 0 #000`) in globals.css. The planner should include a visual verification step.

2. **Tailwind-merge handling of custom shadow tokens**
   - What we know: `tailwind-merge` handles standard Tailwind `shadow-*` utilities correctly.
   - What's unclear: Whether custom `shadow-brutal` and `shadow-brutal-hover` values defined via `@theme` are recognized as conflicting by tailwind-merge.
   - Recommendation: Use mutually exclusive conditional classes (`active ? activeClasses : inactiveClasses`) rather than relying on merge behavior. Test explicitly during implementation.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection:** `src/components/blog/tag-chip.tsx`, `src/components/projects/tech-badge.tsx`, `src/components/blog/post-card.tsx`, `src/app/blog/[slug]/page.tsx`, `src/components/projects/project-card.tsx`, `src/app/projects/[slug]/page.tsx`, `src/app/globals.css`, `src/components/layout/header.tsx`, `src/components/ui/scroll-reveal.tsx` -- direct source code analysis of existing component patterns, styling conventions, and shadow/translate values.
- **WAI-ARIA APG: Button Pattern** (https://www.w3.org/WAI/ARIA/apg/patterns/button/) -- toggle button specification with `aria-pressed`, keyboard interaction requirements (Space/Enter), label stability requirement.
- **Project research (already completed):** `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/research/FEATURES.md`, `.planning/research/STACK.md` -- comprehensive analysis of filtering architecture, pitfalls, and stack decisions for v1.5 milestone.

### Secondary (MEDIUM confidence)
- **Neobrutalist design patterns** -- existing codebase establishes the visual vocabulary: `shadow-brutal` (4px 4px 0 0 #000), `shadow-brutal-hover` (2px 2px 0 0 #000), `border-2 border-black` / `border-[3px] border-black`, `bg-accent` (#2D8B8B), `hover:translate-x-[2px] hover:translate-y-[2px]` hover pattern. These conventions are derived from direct codebase inspection, not external references.

### Tertiary (LOW confidence)
- None. All findings are verified against codebase or official W3C specifications.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all existing libraries
- Architecture: HIGH -- polymorphic component pattern is well-established React, verified against existing codebase conventions
- Pitfalls: HIGH -- all pitfalls identified through codebase analysis (existing component usage sites, shadow values, class merging) and WAI-ARIA specifications

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable -- no moving parts, all based on existing codebase and W3C specs)
