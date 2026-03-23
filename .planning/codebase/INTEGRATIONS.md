# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

### Upstash Redis - View Counting

Blog post view tracking via serverless Redis. Non-critical UI feature -- all calls fail silently.

- **SDK:** `@upstash/redis` 1.36.2
- **Client:** `src/lib/redis.ts`
  ```typescript
  import { Redis } from '@upstash/redis'
  export const redis = Redis.fromEnv()
  ```
- **Auth:** Reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from environment (via `Redis.fromEnv()`)

**API Routes:**

| Route | Method | Purpose | File |
|-------|--------|---------|------|
| `/api/views?slugs=a,b` | GET | Batch fetch view counts for listing pages | `src/app/api/views/route.ts` |
| `/api/views/[slug]` | GET | Fetch single post view count | `src/app/api/views/[slug]/route.ts` |
| `/api/views/[slug]` | POST | Increment view count (with IP dedup) | `src/app/api/views/[slug]/route.ts` |

Both routes use `export const dynamic = 'force-dynamic'` to disable caching.

**Redis Key Schema:**
- `views:{slug}` - Integer view count per post (no TTL, persists indefinitely)
- `dedup:{slug}:{ipHash}` - IP deduplication flag (24h TTL via `ex: 86400`)

**IP Deduplication:**
- IP extracted from `x-forwarded-for` header (falls back to `127.0.0.1`)
- Hashed with SHA-256 before storage (privacy-preserving)
- Uses Redis `SET ... NX` (set-if-not-exists) for atomic dedup check
- Implementation in `src/app/api/views/[slug]/route.ts`:
  ```typescript
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
  const ipHash = hashIP(ip)
  const dedupResult = await redis.set(`dedup:${slug}:${ipHash}`, '1', { ex: 86400, nx: true })
  ```

**Client-Side Components:**
- `src/components/blog/view-counter.tsx` - Single post page: POSTs to increment, uses localStorage cache
- `src/components/blog/listing-view-counts.tsx` - Blog listing: GETs batch counts via React Context, uses localStorage cache
- `src/lib/views.ts` - `formatViewCount()` utility for display formatting

**Caching Strategy:**
- localStorage serves as a read-through cache (`views:{slug}` key)
- `useLayoutEffect` reads cached value before paint to prevent flash on repeat visits
- API response updates both state and cache
- All fetch errors are caught and silently ignored (non-critical feature)

### Vercel Analytics - Web Analytics

Automatic page view and web vital tracking.

- **SDK:** `@vercel/analytics` 1.6.1
- **Integration point:** `src/app/layout.tsx`
  ```typescript
  import { Analytics } from '@vercel/analytics/next';
  // In root layout JSX:
  <Analytics />
  ```
- **Auth:** No env vars required -- auto-configured on Vercel platform
- **Config:** Zero-config, just the component inclusion in root layout

### Google Fonts - Inter

- **Integration:** Via `next/font/google` (built into Next.js)
- **File:** `src/lib/fonts.ts`
- **No API key required** -- Next.js handles font fetching and self-hosting at build time

## Data Storage

**Databases:**
- Upstash Redis (serverless, REST-over-HTTP)
  - Connection: `UPSTASH_REDIS_REST_URL` env var
  - Auth: `UPSTASH_REDIS_REST_TOKEN` env var
  - Client: `@upstash/redis` SDK with REST transport (HTTP-based, no persistent connections)
  - Used exclusively for view counting (not session storage, not caching)

**File Storage:**
- Local filesystem only (static assets in `public/`)
- Velite outputs processed images to `public/static/` with content-hashed filenames (pattern: `[name]-[hash:6].[ext]`)

**Caching:**
- No server-side cache service
- Client-side: localStorage for view counts (browser-only)
- Next.js static generation provides build-time caching for all content pages

## Authentication & Identity

- No authentication system
- No user accounts or sessions
- Public-facing read-only site
- API routes are unauthenticated (view counting is open, dedup is IP-based only)

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, etc.)
- API route errors logged via `console.error` with `[views]` prefix

**Logs:**
- `console.error` in API routes only
- Pattern: `console.error('[views] Redis error:', error)`
- No structured logging framework

**Analytics:**
- Vercel Web Analytics (automatic via `<Analytics />` component in `src/app/layout.tsx`)
- No custom event tracking

## CI/CD & Deployment

**Hosting:**
- Vercel
  - Project: `keech-dev` (project ID in `.vercel/project.json`)
  - Build command: `velite && next build` (from `package.json` scripts)

**CI Pipeline:**
- None -- no GitHub Actions, no `.github/workflows/`
- Deployment triggered by git push to Vercel-connected repository
- Vercel runs `npm install` then `npm run build` on every push

**Deploy Flow:**
1. Push to GitHub (`smadam813/keech-dev`)
2. Vercel detects push, clones repo
3. Runs `npm install` then `npm run build` (`velite && next build`)
4. Deploys `.next/` output as serverless functions + static assets

## Environment Configuration

**Required env vars:**

| Variable | Service | Used In | Purpose |
|----------|---------|---------|---------|
| `UPSTASH_REDIS_REST_URL` | Upstash | `src/lib/redis.ts` | Redis REST API endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | `src/lib/redis.ts` | Redis authentication token |

**Automatically provided (Vercel):**
- Vercel Analytics config (no env vars needed)
- `x-forwarded-for` header (provided by Vercel edge for IP dedup)

**Secrets location:**
- `.env.local` for local development (gitignored)
- Vercel dashboard environment variables for production

**No other env vars detected.** The site has no feature flags, no third-party API keys beyond Upstash, and no build-time environment configuration.

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## SEO Integration

**Sitemap:**
- Dynamic generation via `src/app/sitemap.ts`
- Includes static routes (`/`, `/about`, `/blog`, `/projects`) and all posts/projects from Velite collections
- Base URL: `https://keech.dev`

**Robots:**
- Generated via `src/app/robots.ts`
- Allows all crawlers, references sitemap at `https://keech.dev/sitemap.xml`

**OpenGraph / Twitter Cards:**
- Metadata configured in `src/app/layout.tsx` via Next.js `Metadata` export
- Site-level defaults with `%s | keech.dev` title template

## Integration Patterns

**Pattern: Fail-Silent Non-Critical UI**
Used for all view counting integration. API failures never break the page:
- Client components catch all fetch errors silently
- localStorage provides fallback display values
- API routes return 500 with error JSON but never throw unhandled

**Pattern: REST-over-HTTP Database Access**
Upstash Redis uses HTTP REST transport (`@upstash/redis`), not TCP connections. This is compatible with serverless/edge runtimes and requires no connection pooling.

**Pattern: Build-Time Content Integration**
Velite processes MDX at build time, not runtime. Content collections are imported as static data:
```typescript
import { posts, projects } from '@/.velite'
```
No runtime content fetching, no CMS API calls, no database queries for content.

---

*Integration audit: 2026-03-22*
