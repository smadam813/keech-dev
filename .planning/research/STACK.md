# Stack Research

**Domain:** Security hardening, testing, SEO/branding for existing Next.js 16 portfolio/blog
**Researched:** 2026-04-02
**Confidence:** HIGH

## Recommended Stack Additions

These are NEW dependencies only. The existing stack (Next.js 16, React 19, Tailwind CSS v4, Velite, Upstash Redis, etc.) is validated and unchanged.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `vitest` | `^4.1.2` | Unit/integration test runner | Vitest 4 is the current stable. Fast, ESM-native, works with Next.js via `@vitejs/plugin-react`. Next.js official docs recommend Vitest over Jest for App Router projects. Requires Node.js >= 20. |
| `@playwright/test` | `^1.59.1` | E2E testing | The standard for E2E in 2026. Needed for testing mobile menu (`inert`), copy button, scroll reveal, and MDX rendering -- all browser-dependent behaviors that unit tests cannot cover. |
| `@upstash/ratelimit` | `^2.0.8` | API rate limiting | Already using `@upstash/redis` -- this is the companion library from the same team. Uses the existing Redis instance, no new infrastructure. Sliding window algorithm for smooth limiting. |
| `feed` | `^5.2.0` | RSS/Atom/JSON feed generation | TypeScript-native, generates RSS 2.0 + Atom 1.0 + JSON Feed from a single API. Lightweight (no dependencies). Preferred over the `rss` package which is older and less maintained. |

### Supporting Libraries (Testing)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vitejs/plugin-react` | `^4.x` | React JSX transform for Vitest | Required for Vitest to understand JSX in test files. |
| `@testing-library/react` | `^16.3.2` | Component test utilities | React 19 compatible as of v16+. Use for testing client components (view counter, filter bar, copy button). |
| `@testing-library/dom` | `^10.x` | DOM query utilities | Peer dependency of `@testing-library/react`. |
| `vite-tsconfig-paths` | `^5.x` | Path alias resolution in Vitest | Resolves `@/*` and `@/.velite` aliases in test files so imports match Next.js config. |
| `jsdom` | `^26.x` | Simulated browser environment | Test environment for Vitest. Lighter than `happy-dom`, more battle-tested. |

### No New Dependencies Required

These v1.6 features use built-in Next.js capabilities -- no packages to install:

| Feature | Implementation | Why No Package |
|---------|----------------|----------------|
| Security headers (CSP, X-Frame-Options, etc.) | `headers()` function in `next.config.ts` | Native Next.js config -- returns header arrays per route pattern. |
| Error boundaries | `error.tsx` and `loading.tsx` files | Next.js App Router file conventions. React error boundaries built into the framework. |
| OG image generation | `opengraph-image.tsx` using `ImageResponse` from `next/og` | Built into Next.js since v14. Uses Satori + resvg under the hood. No external package. |
| Favicon | Static files in `src/app/` or `public/` | Next.js Metadata API auto-detects `icon.tsx`, `favicon.ico`, `apple-icon.png`. |
| Sitemap fix | Modify existing `src/app/sitemap.ts` | Already implemented, just needs date logic correction. |
| Input validation | Regex validation in route handlers | Pure TypeScript, no validation library needed for simple slug patterns. |

## Installation

```bash
# Rate limiting (production dependency -- used in API routes)
npm install @upstash/ratelimit feed

# Testing (dev dependencies only)
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/dom vite-tsconfig-paths jsdom @playwright/test

# Playwright browsers (one-time setup, not in package.json)
npx playwright install --with-deps chromium
```

## Configuration Files to Create

### `vitest.config.mts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

Key points:
- `tsconfigPaths()` resolves `@/*` aliases matching `tsconfig.json`
- `globals: true` enables `describe`/`it`/`expect` without imports
- Async Server Components cannot be unit-tested with Vitest (use Playwright for those)

### `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
```

Key points:
- Single browser (Chromium) is sufficient for a personal site
- Builds production first, then tests against it -- catches build-time issues
- E2E tests live in `e2e/` directory, separate from unit tests in `src/`

### `package.json` script additions

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `vitest` | `jest` | Never for this project. Jest has poor ESM support and requires more config for Next.js App Router. Vitest is officially recommended by Next.js docs. |
| `@playwright/test` | `cypress` | If you need a visual test runner UI during development. But Cypress is heavier, slower, and less suited for CI. Playwright is the standard. |
| `feed` | `rss` | Never. The `rss` package is older, JavaScript-only (no TS types), and only generates RSS 2.0. `feed` generates RSS + Atom + JSON Feed with full TypeScript support. |
| `feed` | Hand-written XML | Only if you want zero dependencies. But `feed` handles XML escaping, date formatting, and spec compliance -- hand-writing RSS XML is error-prone. |
| `@upstash/ratelimit` | Custom rate limiting with raw Redis | Never. `@upstash/ratelimit` is purpose-built for the Upstash Redis SDK already in use. Reimplementing sliding window is unnecessary complexity. |
| `@testing-library/react` | `@testing-library/react` + `msw` | Add `msw` (Mock Service Worker) later if you need to mock API routes in integration tests. Not needed for v1.6 scope. |
| `jsdom` | `happy-dom` | If test speed becomes a bottleneck. `happy-dom` is faster but less spec-complete. Start with `jsdom` for correctness. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `helmet` / `next-safe` | These are Express middleware. Next.js uses `headers()` in config or middleware natively. Adding Express-style middleware to Next.js is an anti-pattern. | `next.config.ts` `headers()` function |
| `@vercel/og` (direct import) | Deprecated in favor of `next/og` which re-exports the same API. Importing `@vercel/og` directly adds an unnecessary dependency. | `import { ImageResponse } from 'next/og'` |
| `next-seo` | Redundant with Next.js Metadata API (available since v13.2). The built-in `metadata` export and `generateMetadata()` cover all SEO needs. | Next.js built-in Metadata API |
| `zod` (for slug validation) | Already a transitive dependency via Velite, but adding it as a direct dependency for simple regex slug validation is overkill. | Inline regex: `/^[a-z0-9-]+$/` |
| `jest` | Poor ESM support, requires `ts-jest` or `@swc/jest`, more configuration overhead. Next.js docs now recommend Vitest. | `vitest` |
| `next-mdx-remote` | Concerns doc mentions this as a long-term option for safer MDX execution. Do NOT add it in v1.6 -- it would require rearchitecting the content pipeline. The try-catch wrapper addresses the immediate risk. | Try-catch around `new Function()` + CSP headers |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `vitest@^4.1.2` | `vite@^6.0.0` (auto-installed as dependency) | Vitest brings its own Vite. Does not conflict with Next.js (which uses Turbopack). |
| `vitest@^4.1.2` | Node.js >= 20 | Hard requirement. Verify with `node --version`. |
| `@testing-library/react@^16.3.2` | `react@^19` | v16+ supports React 19. Earlier versions (v13-v15) only support React 18. |
| `@upstash/ratelimit@^2.0.8` | `@upstash/redis@^1.x` | Same team, designed to work together. Uses the existing Redis client instance. |
| `feed@^5.2.0` | Node.js >= 14 | No framework coupling. Pure data-in, XML/JSON-out. |
| `@playwright/test@^1.59.1` | Node.js >= 18 | Installs its own browser binaries. No conflict with project dependencies. |

## Integration Points

### Rate Limiting + Existing Redis

`@upstash/ratelimit` accepts the existing `Redis.fromEnv()` instance from `src/lib/redis.ts`. No new environment variables needed.

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
})
```

### OG Images + Existing Metadata

Next.js auto-discovers `opengraph-image.tsx` files and wires them into the metadata. No changes to existing `generateMetadata()` needed -- the framework merges them.

### RSS Feed + Existing Velite Collections

The `feed` package consumes the same `posts` collection from `@/.velite` that listing pages use. The route handler at `src/app/feed.xml/route.ts` imports posts and maps them to feed items.

### Security Headers + MDX Execution

CSP must include `'unsafe-eval'` in `script-src` because `new Function()` is eval. This is an acceptable tradeoff documented in the concerns -- removing it requires rearchitecting MDX execution (out of scope for v1.6).

## Sources

- [Next.js Testing with Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) -- official setup instructions (MEDIUM confidence, page had redirect issues but content verified via search results)
- [Vitest 4.0 Announcement](https://vitest.dev/blog/vitest-4) -- breaking changes and requirements (HIGH confidence)
- [Vitest Migration Guide](https://vitest.dev/guide/migration.html) -- v3 to v4 migration (HIGH confidence)
- [@upstash/ratelimit GitHub](https://github.com/upstash/ratelimit-js) -- API and examples (HIGH confidence)
- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) -- official documentation (HIGH confidence)
- [Next.js OG Image Generation](https://nextjs.org/docs/app/api-reference/functions/image-response) -- ImageResponse API (HIGH confidence)
- [Next.js opengraph-image Convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) -- file-based OG images (HIGH confidence)
- [feed npm package](https://github.com/jpmonette/feed) -- RSS/Atom/JSON feed generator (HIGH confidence)
- [@testing-library/react npm](https://www.npmjs.com/package/@testing-library/react) -- v16.3.2 with React 19 support (HIGH confidence)
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) -- v1.59 (HIGH confidence)

---
*Stack research for: v1.6 Address Concerns -- security hardening, testing, OG images, RSS, rate limiting*
*Researched: 2026-04-02*
