# Coding Conventions

**Analysis Date:** 2026-02-08

## Naming Patterns

**Files:**
- Components: `kebab-case.tsx` (e.g., `post-card.tsx`, `copy-button.tsx`, `scroll-reveal.tsx`)
- Utilities and configs: `camelCase.ts` or `kebab-case.ts` (e.g., `fonts.ts`, `utils.ts`, `rune-config.ts`)
- Page routes: Dynamic segments in square brackets (e.g., `[slug]/page.tsx`)

**Functions:**
- camelCase for all functions and React components: `getCodeText()`, `handleCopy()`, `useMDXComponent()`, `TableOfContents()`
- Prefix callback handlers with `handle`: `handleCopy`, `handleKeyDown`
- Prefix hook utilities with `use`: `useMDXComponent`, `useCallback`, `useEffect`

**Variables:**
- camelCase for all variables and constants: `isOpen`, `pathname`, `publishedPosts`, `formattedDate`
- CONSTANT_CASE for truly immutable config objects: `ELDER_FUTHARK`, `NAV_RUNES`, `BLOG_RUNES`, `PROJECT_RUNES`, `DIVIDER_RUNES`, `TEXTURE_RUNES`

**Types:**
- PascalCase for interfaces and types: `PostCardProps`, `CopyButtonProps`, `MDXContentProps`, `ScrollRevealProps`, `TocEntry`
- Interface names describe the prop shape: `[ComponentName]Props` for component prop types
- Generic property names in interfaces are descriptive: `children`, `className`, `getText`, `entries`

## Code Style

**Formatting:**
- No Prettier config file — relies on default Next.js/ESLint defaults
- Single quotes for strings (observed throughout codebase)
- 2-space indentation
- Template literals used for dynamic string interpolation

**Linting:**
- ESLint extends `next/core-web-vitals` and `next/typescript` (flat config in `eslint.config.mjs`)
- ESLint v9.39.2 with flat config format (not legacy `.eslintrc.js`)
- No explicit Prettier config — formatting is handled through editor defaults
- TypeScript strict mode enabled (`strict: true` in `tsconfig.json`)

## Import Organization

**Order:**
1. External packages (React, Next.js ecosystem): `import { useState } from 'react'`, `import Link from 'next/link'`
2. Built-in Node modules (if used): none observed in this codebase
3. Path aliases (`@/*`): `import { cn } from '@/lib/utils'`, `import { posts } from '@/.velite'`
4. Type imports: `import type { Metadata }`, `import type { ReactNode }`

**Path Aliases:**
- `@/*` → `./src/*` (main source directory)
- `@/.velite` → `./.velite` (generated content collections from Velite)

**Type Imports:**
- Use `import type { ... }` when importing only types: `import type { ComponentPropsWithoutRef }`, `import type { MDXComponents }`
- Inline `type` keyword in destructuring when needed: `type PreProps = ComponentPropsWithoutRef<'pre'>`

## Error Handling

**Patterns:**
- `notFound()` from Next.js for missing resources: used in `src/app/blog/[slug]/page.tsx` when post not found
- Guard clauses at component entry point: `if (!post) { notFound() }`
- Conditional rendering for optional data: `post.updated ? ... : null`, `post.tags.length > 0 ? ... : null`
- Optional chaining for safe property access: `post.description || (post.excerpt?.slice(0, 160) ?? '')`
- Nullish coalescing (`??`) preferred over logical OR (`||`) for falsy checks: `post.excerpt?.slice(0, 160) ?? ''`

**No try/catch observed:**
- Minimal error handling — no API routes, no external services, no database
- Content compilation errors (Velite/MDX) would be build-time failures, not runtime

## Logging

**Framework:** `console` not used in production code

**Patterns:**
- No debug logging in the codebase
- Development-only concerns logged during build phase (Velite compilation)
- No structured logging library

## Comments

**When to Comment:**
- Architecture decisions and non-obvious implementations
- File headers for modules with complex responsibilities: `// Elder Futhark Rune Configuration` in `rune-config.ts`
- Inline comments explaining `why`, not `what`

**JSDoc/TSDoc:**
- Documented at module/function level where business logic is non-obvious
- Example in `rune-config.ts`: detailed interface comments explaining rune structure
- Comments above config constants: `// Runes chosen for symbolic association with each site section.`

**Real Examples:**
```typescript
// From src/components/runes/rune-config.ts
/**
 * All 24 Elder Futhark runes, keyed by lowercase Proto-Germanic name.
 * Ordered within each aett (Freyr's, Hagal's, Tyr's).
 */
export const ELDER_FUTHARK = { ... }

// From src/components/layout/header.tsx
// Auto-close on route change
// Scroll lock (iOS Safari safe: position fixed approach)
// Focus management via inert attribute on main content
```

## Function Design

**Size:**
- Functions are concise — most under 50 lines
- Extracted utilities (`cn`, `useMDXComponent`) are single-responsibility
- Complex components split into smaller sub-components: `TableOfContents` → `TocList`

**Parameters:**
- Prefer object destructuring for component props: `({ children, className })`
- Use rest parameters sparingly: `{ children, ...props }` only when passing through to DOM elements
- Type props explicitly with interfaces: `interface [Component]Props { ... }`

**Return Values:**
- Early returns for guard clauses: `if (!post) { return null }`, `if (entries.length === 0) { return null }`
- Conditional rendering inside return: `{condition ? <Element /> : null}`
- Ternary operators for simple conditionals, not control flow logic

## Module Design

**Exports:**
- Named exports for components and utilities: `export function ComponentName()`, `export const CONSTANT`
- Single default export only in Next.js page/layout files
- Type exports using `import type`: `import type { PostCardProps }`

**Barrel Files:**
- No barrel files (index.ts) in this codebase
- Direct imports from specific files: `from '@/components/blog/post-card'` not `from '@/components/blog'`
- Component groupings by directory: `src/components/blog/`, `src/components/projects/`, `src/components/layout/`, `src/components/ui/`

**Module Organization:**
- `src/lib/` — utilities and helpers (`utils.ts`, `fonts.ts`)
- `src/components/` — all React components organized by feature/section
- `src/app/` — Next.js App Router pages and layouts
- `public/` — static assets (fonts, images)

## React & Component Patterns

**Server/Client Components:**
- Default to Server Components — only 6 components use `'use client'` directive:
  - `copy-button.tsx` — needs `useState`
  - `code-block.tsx` — needs `useRef`, `useCallback`
  - `scroll-reveal.tsx` — needs `useEffect`, `IntersectionObserver`
  - `mdx-content.tsx` — needs runtime code execution
  - `header.tsx` — needs mobile menu state and keyboard handling

**Props Pattern:**
- Typed props with interfaces: `interface ComponentProps { ... }`
- Spread `...props` only when passing through to DOM: `<pre {...props}>`
- Avoid prop drilling — use composition or constants (`NAV_RUNES` passed directly)

**Conditional Rendering:**
- Early null return for empty states
- Inline ternary for simple conditions
- `className={cn(...)}` pattern for conditional Tailwind classes

## Accessibility

**ARIA Attributes:**
- `aria-label` on interactive elements: buttons with icons
- `aria-expanded`, `aria-controls` on menu toggles
- `aria-modal`, `aria-label`, `role="dialog"` on modal overlays
- `aria-hidden="true"` on decorative elements (icons, dividers)
- `dateTime` attribute on time elements

**Focus Management:**
- `inert` attribute on non-interactive elements when menu is open
- Focus restoration with `useRef`: return focus to trigger button on menu close
- Keyboard event handlers: escape key closes menus

**Motion Preferences:**
- Respects `prefers-reduced-motion` media query: `ScrollReveal` component skips animation setup
- Conditional `motion-safe:transition-colors` class in header navigation

---

*Convention analysis: 2026-02-08*
