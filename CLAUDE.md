# CLAUDE.md

## Environment

No CI/CD — deployment is git-push to Vercel.

Required env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (view counting via Upstash Redis).

`npx tsc --noEmit` shows false errors in test files because Vitest globals aren't in tsconfig — use `npm run test` to validate.

## Architecture

Personal portfolio/blog at keech.dev. Next.js 16 App Router, React 19, Tailwind CSS v4, Velite for MDX content.

### Content Pipeline

MDX in `content/posts/` and `content/projects/` is compiled by Velite into `.velite/` (gitignored). Velite runs as a separate prebuild step (not a webpack plugin) because Turbopack doesn't support custom webpack plugins.

Compiled MDX is executed via `new Function()` in `MDXContent` to avoid Shiki transformer hydration issues.

### Visual Identity

**Nocturnal petrol** — dark-only palette with no light mode; the palette is the brand. Tailwind v4 uses CSS-first configuration (no `tailwind.config.js`); design tokens live in `src/app/globals.css`.

Elder Futhark runes are a brand element, not decoration. Each nav route maps to a rune (Othala → Home, Ansuz → Blog, Kenaz → Projects, Mannaz → About). Ambient rune glows use non-round breath durations (5.0s–7.5s) to prevent visual synchronization.

### Design Decisions

- View counts are non-critical UI — all fetches fail silently
- Error boundaries use plain `<a>` tags (not `next/link`) because client-side routing may be broken in error states
- iOS scroll lock uses `position: fixed` (not `overflow: hidden`)

## Blog Writing Skill

`.claude/skills/write-blog-post/` orchestrates blog post creation. Writing principles in `.claude/skills/write-blog-post/writing-guide.md` — specificity over abstraction, frontload value, conversational tone, no emdashes or emojis.
