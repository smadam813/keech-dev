# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Runner:**
- No test framework is configured
- No Jest, Vitest, or other test runner installed
- No test-related dependencies in `package.json`

**Assertion Library:**
- Not applicable -- no testing framework

**Run Commands:**
```bash
npm run lint      # ESLint (primary automated quality gate)
npm run build     # TypeScript + Velite schema validation (build-time checks)
npm run velite    # Velite content compilation alone (useful for debugging content)
```

No `test` script exists in `package.json`. Available scripts are: `dev`, `build`, `start`, `lint`, `velite`.

## Test File Organization

**Location:**
- No test files exist in the codebase
- No `*.test.*` or `*.spec.*` files found anywhere in `src/`

**Naming:**
- Not applicable -- no test files exist

**Structure:**
- `.gitignore` includes `/coverage` entry, suggesting test coverage was considered but not implemented

## Quality Assurance Strategy

This project relies on a **multi-layer build-time validation** strategy instead of automated tests. Each layer catches different categories of errors.

### Layer 1: TypeScript Strict Mode

**Config:** `tsconfig.json` with `"strict": true`

**What it catches:**
- Type mismatches in component props
- Missing required properties
- Null/undefined access without checks
- Incorrect function signatures
- Import path errors (via path aliases `@/*` and `@/.velite`)

**Key settings in `tsconfig.json`:**
- `target: "ES2022"` -- modern JS features
- `strict: true` -- enables all strict checks
- `noEmit: true` -- type checking only (Next.js handles compilation)
- `moduleResolution: "bundler"` -- Next.js/Turbopack compatible

### Layer 2: ESLint

**Config:** `eslint.config.mjs` (ESLint v9 flat config)

**What it catches:**
- React hooks rule violations (deps arrays, conditional hooks)
- Next.js-specific issues (Image component usage, Link usage, metadata patterns)
- TypeScript-specific linting (unused variables, any types)
- Accessibility issues via `jsx-a11y` (included in `next/core-web-vitals`)

**Run:** `npm run lint` (calls `next lint`)

**Extends:**
- `next/core-web-vitals` -- React, React Hooks, jsx-a11y, Next.js best practices
- `next/typescript` -- TypeScript-specific rules

### Layer 3: Velite Content Schema Validation

**Config:** `velite.config.ts` with Zod schemas

**What it catches:**
- Missing required frontmatter fields in MDX files
- Invalid data types (e.g., non-ISO date strings)
- String length violations (`title: s.string().max(99)`, `description: s.string().max(300)`)
- Invalid enum values for `category` field
- Invalid slug formats
- Missing MDX body content

**Run:** Automatically during `npm run build` (first step: `velite && next build`). Also runnable standalone via `npm run velite`.

**Post frontmatter schema (required/optional):**
- Required: `title`, `slug`, `date`
- Optional: `updated`, `description`, `tags`, `draft`
- Auto-generated: `toc`, `metadata` (reading time), `excerpt`, `body` (compiled MDX)

**Project frontmatter schema (required/optional):**
- Required: `title`, `slug`, `description`, `date`
- Optional: `updated`, `featured`, `stack`, `github`, `demo`, `category`, `image`

### Layer 4: Next.js Build

**What it catches:**
- Server/client component boundary violations
- Invalid `generateStaticParams()` output
- Invalid metadata exports
- Import errors from generated `.velite/` content
- Invalid `route.ts` handler signatures
- Hydration mismatches (in dev mode)

**Run:** Second step of `npm run build` (`next build`)

### Layer 5: Validation Scripts

**Script:** `scripts/validate-colors.mjs`

**What it does:** Computes WCAG 2.1 contrast ratios for all palette color pairs and reports PASS/FAIL against the 4.5:1 AA threshold.

**Run:** `node scripts/validate-colors.mjs` (manual, not part of build pipeline)

**Covers:** The core palette from `src/app/globals.css`: background (#E8B4B8), foreground (#000000), accent (#2D8B8B), surface (#F5E6E8), muted (#666666)

## Deployment Pipeline

**No CI/CD configured:**
- No `.github/workflows/` directory
- No GitHub Actions, CircleCI, or other CI configuration
- Deployment is git-push to Vercel

**Vercel Build Process:**
1. `npm run build` executes: `velite && next build`
2. Velite compiles MDX content with schema validation
3. Next.js builds with TypeScript checking
4. If either step fails, deployment is blocked

**This means:**
- Velite schema validation runs on every deploy
- TypeScript errors block deployment
- ESLint is NOT automatically run during Vercel build (must be run manually or added to build script)

## Mocking

**Framework:** Not applicable -- no mocking framework installed

## Fixtures and Factories

**Test Data:** Not applicable -- no test files exist

**Content fixtures:** MDX files in `content/posts/` and `content/projects/` serve as implicit integration test fixtures -- if Velite can compile them, the schema is valid.

## Coverage

**Requirements:** Not enforced -- no testing framework configured

**No coverage tooling installed.** The `.gitignore` includes `/coverage` which suggests coverage was anticipated but not yet implemented.

## Test Types

**Unit Tests:**
- Not configured
- Candidates if added:
  - `src/lib/utils.ts` -- `cn()` class merging behavior
  - `src/lib/views.ts` -- `formatViewCount()` pluralization
  - `src/lib/rune-glows.ts` -- `computeGlowPositions()` math with various container dimensions
  - `src/app/api/views/[slug]/route.ts` -- `hashIP()` function

**Integration Tests:**
- Not configured
- Candidates if added:
  - API routes (`src/app/api/views/route.ts`, `src/app/api/views/[slug]/route.ts`) -- Redis interaction, deduplication logic
  - MDX rendering pipeline -- `MDXContent` component with `new Function()` execution
  - Content pipeline -- Velite compilation with edge-case frontmatter

**E2E Tests:**
- Not configured
- No Playwright, Cypress, or similar framework installed
- Candidates if added:
  - Blog post page rendering (content, metadata, TOC)
  - Tag filtering with URL state persistence
  - Mobile menu toggle, keyboard navigation, focus management
  - View count display and increment

## What Is Validated vs. What Is Not

**Validated (build-time):**
- All TypeScript types and interfaces
- All MDX frontmatter against Zod schemas
- Import paths and module resolution
- React hooks rules and Next.js patterns (ESLint)
- Accessibility attributes (jsx-a11y via ESLint)

**NOT validated (no runtime tests):**
- Component rendering correctness
- Conditional rendering logic (draft filtering, tag filtering, empty states)
- Browser API interactions (IntersectionObserver, ResizeObserver, localStorage, clipboard)
- Animation sequencing and reduced-motion behavior
- API route behavior (Redis operations, IP deduplication, error responses)
- View count caching (localStorage read-through cache)
- URL state management (search params for filters)
- Focus management and keyboard navigation
- Mobile menu scroll lock behavior
- SEO metadata generation correctness (`generateMetadata()`)
- Static params generation (`generateStaticParams()`)
- Date formatting logic (repeated in multiple components)
- `MDXContent` runtime code execution safety

## Common Patterns (for future test implementation)

**If a test framework were added, follow these patterns:**

**Utility function tests:**
```typescript
// Example structure for src/lib/utils.test.ts
describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })
  it('resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end')
  })
})
```

**API route tests:**
```typescript
// Example structure for src/app/api/views/route.test.ts
describe('GET /api/views', () => {
  it('returns empty counts for no slugs', async () => {
    const req = new Request('http://localhost/api/views?slugs=')
    const res = await GET(req)
    expect(await res.json()).toEqual({ counts: {} })
  })
  it('returns counts for valid slugs', async () => {
    // Mock redis.mget
    const req = new Request('http://localhost/api/views?slugs=post-1,post-2')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})
```

**Recommended framework:** Vitest (aligns with Vite ecosystem, fast, TypeScript-native, compatible with Next.js via `@vitejs/plugin-react`)

---

*Testing analysis: 2026-03-22*
