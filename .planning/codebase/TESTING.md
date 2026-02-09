# Testing Patterns

**Analysis Date:** 2026-02-08

## Test Framework

**Runner:**
- Not configured
- No test framework installed (Jest, Vitest, or other)

**Assertion Library:**
- Not applicable — no testing framework

**Run Commands:**
- No test commands defined in `package.json`
- Available commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run start`, `npm run velite`

## Test File Organization

**Location:**
- No test files found in codebase
- No `*.test.*` or `*.spec.*` files present

**Naming:**
- Not applicable — testing not configured

**Structure:**
- Not applicable — testing not configured

## Test Structure

**Suite Organization:**
- Not applicable — no testing framework configured

**Patterns:**
- Not applicable — no test examples to reference

## Mocking

**Framework:**
- Not applicable — no mocking framework installed

**Patterns:**
- Not applicable — no tests to provide patterns

**What to Mock:**
- Not applicable

**What NOT to Mock:**
- Not applicable

## Fixtures and Factories

**Test Data:**
- Not applicable — no testing framework

**Location:**
- Not applicable

## Coverage

**Requirements:**
- Not enforced — no testing framework configured
- No coverage threshold defined
- No coverage tooling installed

**View Coverage:**
- Not applicable — no test suite to measure

## Test Types

**Unit Tests:**
- Not configured
- Utility functions (`cn()` in `src/lib/utils.ts`) could be candidates for unit testing if framework were added
- Config constants (`ELDER_FUTHARK` in `src/components/runes/rune-config.ts`) could validate structure

**Integration Tests:**
- Not configured
- Content pipeline (Velite → MDX compilation → runtime rendering) could benefit from integration tests:
  - MDX compilation validates frontmatter/Zod schemas (build-time validation)
  - Runtime MDX execution in `MDXContent` component uses `new Function()` — could test code execution safety

**E2E Tests:**
- Not configured
- No E2E testing framework installed (Playwright, Cypress, etc.)
- Manual testing is current approach (GitHub push → Vercel deployment)

## Current Testing Approach

**Build-Time Validation:**
- TypeScript strict mode (`strict: true` in `tsconfig.json`) catches type errors
- Velite schema validation during build: all MDX frontmatter must match Zod schema defined in `velite.config.ts`
- ESLint enforces code quality rules during development and CI

**Runtime Validation:**
- No runtime assertions or validation logic in components
- Components trust props are correctly typed and shaped
- Next.js `notFound()` handles missing routes (defensive but not "tested")

**No Error Boundary:**
- No React error boundaries implemented
- MDX compilation errors would surface as build failures, not runtime crashes

## Recommendations for Testing Implementation

If testing were to be added, this project would benefit from:

1. **Unit Tests for Utilities:**
   - `src/lib/utils.ts` → `cn()` function (Tailwind merge logic)
   - Date formatting logic in `src/app/blog/[slug]/page.tsx` and `src/components/blog/post-card.tsx`

2. **Integration Tests for Content Pipeline:**
   - Velite MDX compilation with various frontmatter edge cases
   - `MDXContent` component with different MDX code samples

3. **Component Snapshot/Regression Tests:**
   - Card components (`PostCard`, `ProjectCard`) with various data shapes
   - Header navigation state transitions (open/close menu, active link detection)

4. **E2E Tests for Key User Flows:**
   - Navigation to blog post and rendering
   - Mobile menu toggle and keyboard interactions
   - Static generation verification (all pages should be pre-rendered)

## Testing Gaps

**No Tests For:**
- Component rendering correctness
- Edge cases in date formatting and filtering logic
- Menu accessibility features (focus trap, inert attribute, keyboard handlers)
- Code block copy functionality (requires DOM interaction)
- Scroll reveal intersection observer behavior
- SEO metadata generation
- Static site generation (`generateStaticParams()`)
- Content draft filtering logic

## Tooling Note

The project uses:
- **TypeScript** for static type checking (primary form of validation)
- **ESLint** for code quality (enforced during `npm run lint`)
- **Velite** for build-time content validation (schema enforcement)

These provide guardrails, but no behavioral test coverage exists.

---

*Testing analysis: 2026-02-08*
