# CLAUDE.md

## Commands

- `npm run velite` regenerates `.velite/` from `content/`. It is gitignored and imported as `@/.velite`, so on a fresh clone run it before `tsc`, `vitest`, or `next build`. `npm run build` runs it automatically; nothing else does.
- `npx tsc --noEmit` is the typecheck. There is no `typecheck` script.
- `npm run lint` runs ESLint. Three React 19 hook rules (`set-state-in-effect`, `static-components`, `refs`) are intentionally warnings, not errors. Do not "fix" the patterns they flag.
- `npm run test` runs Vitest (jsdom). Tests are colocated `*.test.ts(x)` under `src/` and `lib/`. Single file: `npx vitest run src/lib/runes.test.ts`.
- `npm run test:e2e` runs Playwright against a full `build && start` (slow). `npm run test:e2e:dev` runs against the dev server; it sets `PW_DEV_SERVER=1` with POSIX syntax, so in PowerShell set `$env:PW_DEV_SERVER='1'` first and run `npx playwright test`.
- `/verify` runs velite, tsc, lint, and unit tests in the right order.

## Environment

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`, read implicitly by `Redis.fromEnv()`. Without them the `/api/views` routes log `[views] Redis error:` and view counts silently fail; everything else, including `npm run build`, works. See `.env.example`.

## Branch flow

- Feature branch -> merge into `preview` (Vercel preview deploy) -> PR from `preview` to `main` (production). Do not PR feature branches straight to `main`.
- CI (`.github/workflows/ci.yml`) runs velite, lint, tsc, unit tests, and build on pushes and PRs to `preview` and `main`. It needs no secrets. Run `/verify` locally before pushing; Vercel also builds on push.
- Commit prefixes in use: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `content:`.

## Code style

- No semicolons, single quotes, 2-space indent, LF line endings (enforced by `.gitattributes`).
- Tailwind v4, CSS-first. All design tokens live in `@theme` in `src/app/globals.css`. There is deliberately no `tailwind.config.js`; do not add one.
- Components use semantic BEM-style classes defined in `globals.css` under `@layer components` (e.g. `site-header__inner`, `ambient__wash`), not long inline utility strings. Use `cn()` from `@/lib/utils` for conditional classes.
- Server Components by default. Add `'use client'` only for state, effects, or browser APIs.

## Gotchas

- `README.md`'s design section describes the old palette and is stale. `globals.css` is the source of truth for colors and tokens.
- `scripts/validate-colors.mjs` hardcodes the old palette. Update it before trusting its output.
- Error states (`error.tsx`, `global-error.tsx`, `MDXFallback`, `ErrorPanel`) use plain `<a>` instead of `next/link` because client routing may be dead. Do not convert them to `Link`.
- Content frontmatter schemas are in `velite.config.ts`. Posts live in `content/posts/*.mdx`, projects in `content/projects/*.mdx`. `/new-post` scaffolds a valid post.
