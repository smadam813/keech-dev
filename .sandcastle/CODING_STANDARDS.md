# Coding Standards

<!-- Loaded by the reviewer agent via @.sandcastle/CODING_STANDARDS.md.
     Rules below are enforceable during review (binary pass/fail), traceable
     to CLAUDE.md or to a real example in src/. Update both when patterns change. -->

## Style

- TypeScript strict mode is on. No `any`, no `@ts-ignore`. Use `@ts-expect-error` with a `--` reason if absolutely required.
- Named exports only. No `export default` for components, utilities, or hooks. Exception: Next.js convention files that require a default export (`app/**/page.tsx`, `app/**/layout.tsx`, `app/**/error.tsx`, `app/**/not-found.tsx`, `middleware.ts`).
- Components are plain function declarations with destructured props: `function PostCard({ post }: PostCardProps)`. Do not use `React.FC`.
- Component prop shapes use `interface`. Use `type` only for unions, intersections, or mapped types.
- File naming: kebab-case (`post-card.tsx`, `use-view-store.ts`). Components are PascalCase, hooks `useX`, utilities camelCase.
- Internal imports use the `@/` alias. No relative parent imports (`../../`). External imports come first, internal second.
- Type-only imports use the `type` keyword: `import type { SVGProps } from 'react'`.
- Tailwind v4 only. Inline `style={{}}` is permitted for CSS custom properties and `var(--token)` references; do not use it for hard-coded colors, spacing, or typography that have token equivalents.
- Use the `cn()` helper from `@/lib/utils` for conditional class composition. Do not concatenate class strings manually.
- Design tokens live in the `@theme` block of `src/app/globals.css`. Do not introduce a `tailwind.config.js`.
- Comments only when the WHY is non-obvious. No JSDoc for self-evident code. `eslint-disable` lines must include a `--` reason explaining why the rule is being suppressed.
- No emdashes (`—`) or emojis in user-facing content (blog posts, page copy, alt text).

## Testing

- Validator is `npm run test` (Vitest). `npx tsc --noEmit` reports false errors in test files because Vitest globals are not in `tsconfig`.
- Tests are co-located with source: `format.ts` → `format.test.ts` in the same directory. No `__tests__/` folders.
- Test names are sentence-style describing behavior: `it('formats ISO date to human-readable')`, not `it('formatDate')`.
- Mock Next.js APIs with `vi.mock('next/navigation', ...)`. Stub server APIs in e2e with Playwright `page.route()`.
- New utilities, hooks, and components with branching logic require tests. Pure presentational components (no conditionals) may skip.
- E2E tests live in `/e2e` as `*.spec.ts`. Do not put e2e under `src/`.
- Do not commit `.skip` / `.only` / `xfail` without a written cleanup condition in a comment on the same line.

## Architecture

- Server Components by default. Add `'use client'` only when the file uses hooks, browser APIs, or DOM event handlers.
- Single source of truth for published posts: import `publishedPosts` from `src/lib/posts.ts`. Do not re-implement `posts.filter(p => !p.draft)` inline — drafts must not leak via missed call sites.
- One-way dependency: `src/lib/` and `src/app/api/` must not import from `src/components/`. Components consume `lib/`, never the reverse.
- Non-critical UI fails silently. View counts, analytics, and similar fetches catch errors and fall back to cached or default values; do not surface fetch errors to the reader. (See `src/components/blog/view-counter.tsx`.)
- Error boundaries (`error.tsx`, `global-error.tsx`) use plain `<a>` tags, not `next/link`, because client-side routing may be broken in error states. Keep the existing `eslint-disable-next-line @next/next/no-html-link-for-pages` comments with their `--` reason.
- iOS scroll lock uses `position: fixed`, not `overflow: hidden`.
- Filter UI updates the URL via `window.history.replaceState` (see `src/components/ui/filtered-list.tsx`), not `router.push`. This avoids a server re-render on every keystroke.
- `localStorage` access goes through a `useSyncExternalStore` wrapper (see `src/hooks/use-view-store.ts`), not direct reads in render.
- No global state managers. No Zustand, Redux, or React Context for shared state. Use URL params, localStorage (via the wrapper), or local component state.
- MDX is rendered via `dangerouslySetInnerHTML` from Velite output to avoid Shiki transformer hydration mismatches. Do not replace with `@next/mdx` or `next-mdx-remote`.
- Velite runs as a prebuild step, not a webpack plugin (Turbopack does not support custom webpack plugins).
- API routes that mutate state (e.g., view-count POST) must use IP-based rate limiting and dedup before writing to Redis. See `src/app/api/views/[slug]/route.ts`.
