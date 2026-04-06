# External Integrations

**Analysis Date:** 2026-04-05

## APIs & External Services

**View Counting:**
- Upstash Redis - Key-value store for blog post view counts and IP deduplication
  - SDK/Client: `@upstash/redis` (REST-based, no persistent TCP connection)
  - Rate limiting: `@upstash/ratelimit` — sliding window 10 req/60s per IP on POST
  - Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (consumed via `Redis.fromEnv()` in `src/lib/redis.ts`)
  - Key schema: `views:{slug}` (integer count), `dedup:{slug}:{ipHash}` (24h TTL, NX-set for deduplication)

**Analytics:**
- Vercel Analytics - Page view analytics injected as `<Analytics />` component in `src/app/layout.tsx`
  - SDK/Client: `@vercel/analytics/next`
  - Auth: Automatically configured by Vercel platform; no env var required
  - No server-side calls — client-side only

## Data Storage

**Databases:**
- Upstash Redis (serverless Redis over HTTP REST API)
  - Connection: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  - Client: `Redis.fromEnv()` from `@upstash/redis` in `src/lib/redis.ts`
  - Used for: view counts + IP deduplication only; non-critical (all fetches fail silently)

**Content Storage:**
- Local filesystem — MDX files in `content/posts/` and `content/projects/` compiled at build time by Velite into `.velite/` (gitignored, regenerated each build)

**File Storage:**
- Local filesystem only — no cloud file/object storage
- Project images processed by Velite into `public/static/` at build time

**Caching:**
- localStorage (browser) — read-through cache for view counts to prevent flash on repeat visits; implemented in client components `ListingViewCounts` and `ViewCounter`
- No server-side caching layer beyond Vercel edge/CDN

## Authentication & Identity

**Auth Provider:**
- None — no user authentication system; site is fully public read-only

## Fonts

**Google Fonts:**
- Inter — loaded via `next/font/google` in `src/lib/fonts.ts`; subsets: latin; weights: 400, 500, 600, 700
- Fetched at build time by Next.js and self-hosted in production (no runtime Google Fonts request)

**Local Fonts:**
- Norse (custom WOFF2) — `public/fonts/Norse-Regular.woff2`, `public/fonts/Norse-Bold.woff2`; loaded via `next/font/local` in `src/lib/fonts.ts`

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry or equivalent

**Logs:**
- `console.error('[views] Redis error:', error)` in both API route handlers (`src/app/api/views/route.ts`, `src/app/api/views/[slug]/route.ts`); surfaced in Vercel function logs

**Analytics:**
- Vercel Analytics (client-side, see above)

## CI/CD & Deployment

**Hosting:**
- Vercel — git push to deploy; no explicit CI/CD pipeline configuration

**CI Pipeline:**
- None — no GitHub Actions, CircleCI, or equivalent

**Build Process:**
- Vercel invokes `npm run build` which runs `velite && next build` sequentially

## SEO & Content Discovery

**Sitemap:**
- Auto-generated at `src/app/sitemap.ts` using Next.js `MetadataRoute.Sitemap`; includes static routes plus all published posts and projects; base URL `https://keech.dev`

**RSS Feed:**
- Route at `src/app/feed.xml/route.ts`; returns XML with 1-hour cache headers; lists all published posts sorted by date

**robots.ts:**
- Next.js robots metadata at `src/app/robots.ts`

**Open Graph Image:**
- Dynamic OG image generated at build time via `src/app/opengraph-image.tsx` using `next/og` `ImageResponse`; renders branded card with Inter-Bold font embedded from `src/assets/fonts/Inter-Bold.ttf`; size 1200×630

## Webhooks & Callbacks

**Incoming:**
- None — no webhook endpoints

**Outgoing:**
- None

## API Routes Summary

| Route | Method | Purpose |
|---|---|---|
| `/api/views` | GET | Batch fetch view counts; query param `?slugs=a,b,c` (max 20) |
| `/api/views/[slug]` | GET | Single post view count |
| `/api/views/[slug]` | POST | Increment view count with IP deduplication (SHA-256 hash, 24h TTL) + rate limiting |

## Environment Configuration

**Required env vars (runtime):**
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis auth token

**Secrets location:**
- `.env.local` (gitignored); also configured in Vercel project environment variables for production

---

*Integration audit: 2026-04-05*
