# Coding Conventions

**Analysis Date:** 2026-04-05

## Naming Patterns

**Files:**
- React components: PascalCase component name in kebab-case file — `filter-chip.tsx`, `mdx-content.tsx`, `view-counter.tsx`
- Hooks: `use-` prefix in kebab-case — `use-filtered-list.ts`, `use-hero-animation.ts`
- Utilities/lib: kebab-case — `validation.ts`, `rate-limit.ts`, `rune-glows.ts`
- Route files follow Next.js App Router conventions: `page.tsx`, `route.ts`, `error.tsx`, `loading.tsx`
- Test files: co-located, same name with `.test.ts(x)` suffix — `filter-chip.test.tsx` next to `filter-chip.tsx`

**Functions (exported):**
- React components: PascalCase named exports — `export function FilterChip(...)`, `export function ViewCounter(...)`
- Hooks: camelCase with `use` prefix — `export function useFilteredList(...)`, `export function useMediaQuery(...)`
- Utility functions: camelCase — `export function formatDate(...)`, `export function validateSlug(...)`, `export function cn(...)`
- API route handlers: uppercase HTTP method names — `export async function GET(...)`, `export async function POST(...)`

**Variables:**
- camelCase throughout — `activeFilters`, `filteredItems`, `menuPathname`
- Boolean state: descriptive present-tense names — `isOpen`, `isFiltering`, `glowsActive`
- Refs: `camelCase` + `Ref` suffix — `imgRef`, `sectionRef`, `buttonRef`, `hasFired` (exception: refs used as flags)
- Constants (module-level): SCREAMING_SNAKE_CASE — `RUNE_GLOWS`, `SLUG_PATTERN`, `MAX_SLUG_LENGTH`, `POST_RUNES`, `NAV_RUNES`

**Types/Interfaces:**
- PascalCase interfaces with descriptive names — `FilterChipProps`, `PostPageProps`, `UseFilteredListOptions<T>`
- Generic type parameters: single uppercase letter — `T`
- Return type interfaces named as `[Hook]Result<T>` — `UseFilteredListResult<T>`

## Code Style

**Formatting:**
- No explicit Prettier config detected; formatting is enforced via ESLint (eslint-config-next)
- Single quotes for strings in TypeScript/TSX
- No trailing semicolons enforced via linter; files use semicolons consistently

**Linting:**
- Flat ESLint config at `eslint.config.mjs` — extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Three React 19 rules downgraded to `warn` (not errors): `react-hooks/set-state-in-effect`, `react-hooks/static-components`, `react-hooks/refs`
- Ignores: `.velite/`, `.claude/worktrees/`, `.next/`

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Target: ES2022; module resolution: bundler
- `noEmit: true` — TypeScript used for type checking only, not compilation
- Types for Vitest globals included in tsconfig: `"types": ["vitest/globals"]`
- Prefer explicit interface declarations over inline types for component props
- Use `type` imports where the import is type-only: `import type { Metadata } from 'next'`

## Import Organization

**Order (observed pattern):**
1. External packages — `import { posts } from '@/.velite'`, `import Link from 'next/link'`
2. Internal path aliases (`@/`) — `import { MDXContent } from '@/components/blog/mdx-content'`
3. Relative imports (rare) — only when within the same directory
4. Type-only imports last — `import type { Metadata } from 'next'`

**Path Aliases:**
- `@/*` → `./src/*` — use for all cross-directory imports
- `@/.velite` → `./.velite` — use only for content collection imports (`posts`, `projects`)
- Never use relative `../` paths to cross directory boundaries

## Component Model

**Server vs. Client split:**
- Server components are the default — no directive needed
- Add `'use client'` only when browser APIs are required: `useState`, `useEffect`, `useRef`, IntersectionObserver, clipboard, localStorage, keyboard events
- `'use client'` is the first line of the file, before any imports

**Component structure (client components):**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  // props...
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // hooks at top
  // derived state / memos
  // effects
  // handlers
  // return JSX
}
```

**Props pattern:**
- Destructure props inline in function signature
- Use interface (not type alias) for props objects
- Optional props marked with `?`
- `className?: string` included on composable UI components

## Styling

**Approach:** Tailwind CSS v4 utility classes only — no CSS modules, no inline style objects except for CSS custom properties (`style={{ '--var': value } as React.CSSProperties}`)

**Class merging:** Always use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) to combine classes conditionally — never string concatenation or template literals for class names

```typescript
// Correct
className={cn('base-class', isActive && 'active-class', className)}

// Wrong
className={`base-class ${isActive ? 'active-class' : ''}`}
```

**Design token usage:**
- Hard-coded pixel values only for neobrutalist specifics: `border-[3px]`, `translate-x-[2px]`
- Use semantic CSS variables from `src/app/globals.css`: `bg-background`, `text-foreground`, `text-muted`, `text-accent`, `bg-surface`
- Shadow utilities: `shadow-brutal`, `shadow-brutal-hover` (defined in globals.css)

**Reduced motion:**
- Always pair animation with `motion-safe:` Tailwind variant OR check `prefers-reduced-motion` via `useMediaQuery` hook
- Pattern: `motion-safe:transition-colors` for simple transitions; `useMediaQuery` + conditional logic for orchestrated animations

## Error Handling

**API routes:**
- Validate inputs before any async work (slug validation at top of handler)
- Wrap Redis/external calls in `try/catch`
- Return `Response.json({ error: 'message' }, { status: NNN })` with descriptive error message
- Log errors with context prefix: `console.error('[views] Redis error:', error)`
- Status codes: 400 for validation, 429 for rate limit, 500 for infrastructure errors

**Client components:**
- Non-critical UI failures (view counts, caching) fail silently — empty `catch` block with explanatory comment
- Example pattern from `src/components/blog/view-counter.tsx`:
```typescript
.catch(() => {
  // View count is non-critical UI — fail silently.
})
```

**Error boundaries:**
- Use plain `<a href="...">` (not `next/link`) in error boundary components — client-side routing may be broken
- Suppress lint false-positive with: `{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}`
- Error boundaries: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/blog/[slug]/error.tsx`

## Logging

**Pattern:** `console.error('[namespace] description:', error)` — square-bracket namespace prefix before the colon

**When to log:**
- API route errors before returning 500 responses
- Never log in client components for business logic (view counts fail silently)

## Comments

**When to comment:**
- Explain non-obvious algorithmic choices: "Power curve entrance delays with randomized order (Fisher-Yates shuffle)"
- Justify intentional lint suppressions inline with `eslint-disable-next-line` + reason after `--`
- Document why a pattern is used when it appears wrong: "Scroll lock (iOS Safari safe: position fixed approach)"
- Explain React hook patterns that look like violations: `// eslint-disable-next-line react-hooks/set-state-in-effect -- Sync with browser image cache`
- JSDoc is NOT used — plain inline comments only

**Comment style:**
- Single-line: `// lowercase comment, no period`
- Multi-line: standard `/* */` block, rare
- JSX comments: `{/* Descriptive label for section */}`

## Module Design

**Exports:**
- Named exports only — no default exports for utilities and hooks
- Default exports reserved for Next.js page/route files where the framework requires it (`export default function PostPage`)
- No barrel files (`index.ts`) — import from specific file paths

**Hook design:**
- Each hook has a single responsibility
- Hooks expose state and handlers as a flat object (not array tuple unless simple) — `return { filteredItems, activeFilters, handleToggle, handleClear }`
- Hooks that accept multiple options use an options object with a typed interface: `UseFilteredListOptions<T>`

## Accessibility Patterns

- Use `aria-hidden="true"` on decorative elements (rune characters, icons)
- Use `aria-label` on icon-only buttons: `aria-label="Copy code"`, `aria-label="Open navigation menu"`
- Use `aria-pressed` for toggle buttons
- Use `aria-expanded` + `aria-controls` for expandable panels
- Use `inert` attribute (not JavaScript focus traps) for background focus management
- Use `role="dialog"` + `aria-modal="true"` on overlay panels
- Use semantic `<time dateTime={...}>` for dates

---

*Convention analysis: 2026-04-05*
