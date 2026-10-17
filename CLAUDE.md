# CLAUDE.md

## Commands

- `npm run velite` regenerates `.velite/` from `content/`. It is gitignored and imported as `@/.velite`, so on a fresh clone run it before `tsc`, `vitest`, or `next build`. `npm run build` runs it once and `npm run dev` runs it once, then `velite --watch` alongside Next; nothing else does.
- `npx tsc --noEmit` is the typecheck. There is no `typecheck` script.
- `npm run lint` runs ESLint. Three React 19 hook rules (`set-state-in-effect`, `static-components`, `refs`) are intentionally warnings, not errors. Do not "fix" the patterns they flag.
- `npm run test` runs Vitest (jsdom). Tests are colocated `*.test.ts(x)` under `src/` and `lib/`. Single file: `npx vitest run src/lib/runes.test.ts`.
- `npm run test:e2e` runs Playwright against a full `build && start` (slow). `npm run test:e2e:dev` is broken on Windows: npm runs scripts under cmd.exe and its `PW_DEV_SERVER=1` prefix is POSIX. Run `PW_DEV_SERVER=1 npx playwright test` in Bash, or `$env:PW_DEV_SERVER='1'; npx playwright test` in PowerShell. E2E mocks `/api/views`, so Redis isn't needed.
- `/verify` runs velite, tsc, lint, and unit tests in the right order.
- Node 22 is required (`.nvmrc`); `concurrently` in `npm run dev` does not run on Node 20.

## Environment

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`, read implicitly by `Redis.fromEnv()`. Without them the `/api/views` routes log `[views] Redis error:` and view counts silently fail; everything else, including `npm run build`, works. See `.env.example`.

## Branch flow

- Feature branch -> merge into `preview` (Vercel preview deploy) -> PR from `preview` to `main` (production). Do not PR feature branches straight to `main`.
- CI (`.github/workflows/ci.yml`) runs velite, lint, tsc, unit tests, and build on pushes and PRs to `preview` and `main`. It needs no secrets. Run `/verify` locally before pushing; Vercel also builds on push.
- Commit prefixes in use: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `content:`.

## Code style

- No semicolons, single quotes, 2-space indent. Only LF line endings are enforced (`.gitattributes`); there is no formatter, and a few files (`src/lib/utils.ts`, `src/lib/fonts.ts`, `src/app/layout.tsx`, root configs) use double quotes and semicolons. Match the file you're in; don't reformat it.
- Tailwind v4, CSS-first. All design tokens live in `@theme` in `src/app/globals.css`. There is deliberately no `tailwind.config.js`; do not add one.
- Components use semantic BEM-style classes defined in `globals.css` under `@layer components` (e.g. `site-header__inner`, `ambient__wash`), not long inline utility strings. Use `cn()` from `@/lib/utils` for conditional classes. Inline `style={{ ... var(--color-*) }}` for one-off token values is an established pattern, not a violation.
- Server Components by default. Add `'use client'` only for state, effects, or browser APIs.
- `@/*` maps to `src/*`, so `@/lib` is `src/lib`. The root `lib/` (rehype plugins only) is not aliased; import it relatively.

## Gotchas

- `README.md`'s design section describes the old palette and is stale. `globals.css` is the source of truth for colors and tokens.
- The old palette (`#E8B4B8`, `#2D8B8B`) is still hardcoded in `scripts/validate-colors.mjs`, `src/app/icon.svg`, and both `opengraph-image.tsx` files. `src/lib/seo-assets.test.ts` asserts the old colors in `icon.svg`, so updating the favicon means updating that test.
- `ErrorPanel` (`src/lib/error-boundary/error-panel.tsx`, used by every `error.tsx` and `global-error.tsx`) and `MDXFallback` (`src/components/blog/mdx-content.tsx`) use plain `<a>` with an eslint-disable instead of `next/link` because client routing may be dead. Do not convert them to `Link`.
- Content frontmatter schemas are in `velite.config.ts`. Posts live in `content/posts/**/*.mdx`, projects in `content/projects/**/*.mdx`. `/new-post` scaffolds a valid post.
- Despite the `.mdx` extension, bodies are `s.markdown()`, compiled to an HTML string and rendered via `dangerouslySetInnerHTML`. JSX, imports, and custom components don't work in content; add behavior through rehype plugins in `velite.config.ts` (e.g. root `lib/rehype-copy-button.ts`).
- Import `publishedPosts` from `@/lib/posts` (drafts filtered), never `posts` from `@/.velite` directly.
- Middleware is `src/proxy.ts` (Next 16 name). It sets a strict CSP (`img-src 'self' data:`, one external script host), so any external image, script, or font is blocked until its host is added there.
