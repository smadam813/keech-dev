# Stack Research

**Domain:** Blog stats -- view count tracking and reading time display for Next.js portfolio blog
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

This milestone requires exactly **one new dependency**: `@upstash/redis` for view count persistence. Reading time is already computed by Velite's `s.metadata()` and already displayed in the UI -- no stack changes needed for that feature. The site's first API route (Next.js Route Handler) will be added for view count increment/fetch, but that requires no new packages since Route Handlers are built into Next.js App Router.

**Critical context:** Vercel KV (`@vercel/kv`) has been **sunset**. It was a whitelabeled Upstash Redis product. The replacement is direct Upstash Redis integration via the Vercel Marketplace, using `@upstash/redis`. Do not use `@vercel/kv` for new projects.

## Recommended Stack

### New Dependencies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@upstash/redis` | ^1.36.2 | HTTP-based Redis client for view count storage | The only connectionless (HTTP/REST) Redis client designed for serverless. No TCP connections to manage. Works in Vercel serverless functions and Edge Runtime. Uses `fetch()` under the hood. Upstash is Vercel's recommended Redis provider (Vercel Marketplace integration). Free tier covers 500K commands/month -- more than sufficient for a personal blog. **Confidence: HIGH** -- verified via Upstash official docs, npm registry, and Vercel docs. |

### Existing Stack (No Changes Needed)

| Technology | Version | Role in This Milestone | Notes |
|------------|---------|----------------------|-------|
| Next.js App Router | 16.1.6 | Route Handlers for `/api/views` endpoint | Route Handlers (`route.ts` in `app/api/`) use Web standard Request/Response APIs. Already built into Next.js. No new package needed. |
| Velite `s.metadata()` | 0.3.1 | Reading time calculation at build time | Already configured in `velite.config.ts`. Returns `{ readingTime: number, wordCount: number }`. Already transformed to `post.readingTime` and displayed as `"{n} min read"` in both `post-card.tsx` and `[slug]/page.tsx`. **Reading time is done. No work needed.** |
| React 19 | 19.2.4 | Client component for view count reporter | A small `'use client'` component will fire a POST to the view count API on mount. Standard `useEffect` pattern. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | -- | -- | This milestone requires only `@upstash/redis`. No rate limiting library, no analytics library, no additional utilities. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Upstash Console | Inspect Redis keys, monitor usage | Free at console.upstash.com. See stored view counts, debug key patterns. |
| `.env.local` | Local development credentials | Store `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for local dev. Add `.env*.local` to `.gitignore` (Next.js default). |

## Key Technical Decisions

### 1. Upstash Redis via `@upstash/redis` (not `@vercel/kv`, not `ioredis`)

**Use `@upstash/redis` directly.**

- `@vercel/kv` is **sunset**. Vercel removed its docs, stopped offering Vercel KV for new projects, and recommends Upstash Redis via the Vercel Marketplace instead. Using `@vercel/kv` for a new project would be building on a deprecated foundation.
- `@upstash/redis` is HTTP/REST-based (uses `fetch()`), meaning zero connection management. No connection pooling, no connection timeouts, no cold-start connection overhead. Each Redis command is a single HTTP request.
- `ioredis` requires a persistent TCP connection, which is incompatible with serverless functions that spin up/down. It also requires `REDIS_URL` with a TCP connection string, not available from Upstash's REST API.

**Client initialization pattern:**

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()
// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// from process.env automatically
```

**Confidence: HIGH** -- verified via Upstash official docs, Vercel storage deprecation notices, and npm registry.

### 2. Environment Variables: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

The Vercel Marketplace Upstash integration auto-provisions these two env vars when you install it:

| Variable | Source | Scope |
|----------|--------|-------|
| `UPSTASH_REDIS_REST_URL` | Auto-set by Vercel Marketplace integration | All Vercel environments |
| `UPSTASH_REDIS_REST_TOKEN` | Auto-set by Vercel Marketplace integration | All Vercel environments |

For local development, copy these from the Upstash Console or Vercel dashboard into `.env.local`.

`Redis.fromEnv()` reads exactly these variable names. No custom configuration needed.

**Confidence: HIGH** -- verified via Upstash Vercel integration docs.

### 3. Route Handler for View Counts (not Server Action)

**Use a Next.js Route Handler (`app/api/views/[slug]/route.ts`), not a Server Action.**

Rationale:
- View count increment is a fire-and-forget POST from a client component. It does not need form binding or React transition integration.
- A Route Handler gives explicit HTTP method control (GET for fetching count, POST for incrementing).
- The view count API could potentially be called from outside the React tree (e.g., og:image generators, external tools) -- Route Handlers are standard HTTP endpoints.
- Server Actions are better suited for mutations triggered from React forms/components that need built-in optimistic updates. A view counter is not a form.

**Confidence: HIGH** -- Route Handlers are the established pattern for this use case across Next.js community.

### 4. Reading Time: Already Done

The Velite config already has this pipeline fully working:

```typescript
// velite.config.ts (existing)
metadata: s.metadata(),  // Computes { readingTime: number, wordCount: number }
// ...
.transform(data => ({
  ...data,
  readingTime: data.metadata.readingTime  // Surfaces it as top-level field
}))
```

Both `src/app/blog/[slug]/page.tsx` (line 88) and `src/components/blog/post-card.tsx` (line 41) already display `{post.readingTime} min read`. This feature is complete. The milestone work for reading time is limited to verifying the display looks correct in context with view counts alongside it.

**Confidence: HIGH** -- verified by reading the codebase directly.

### 5. Redis Key Pattern: `pageviews:posts:{slug}`

Use a namespaced key pattern for view counts:

```
pageviews:posts:{slug}
```

Redis commands needed:
- `INCR pageviews:posts:{slug}` -- atomically increment on page view
- `GET pageviews:posts:{slug}` -- fetch count for display
- `MGET pageviews:posts:slug1 pageviews:posts:slug2 ...` -- batch fetch for blog listing page

All three are single Redis commands (one HTTP request each). `MGET` is important for the blog listing page to avoid N+1 requests.

**Confidence: HIGH** -- standard Redis pattern for counters.

### 6. View Count Deduplication: IP Hash with TTL (Optional)

The Upstash blog tutorial demonstrates deduplication via hashed IP + NX + EX:

```typescript
const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
const hash = await sha256(ip)
const dedupKey = `deduplicate:${hash}:${slug}`

const isNew = await redis.set(dedupKey, true, { nx: true, ex: 86400 })
if (!isNew) return NextResponse.json({ counted: false }, { status: 202 })

await redis.incr(`pageviews:posts:${slug}`)
```

This prevents the same visitor from inflating counts within 24 hours. For a personal blog, this is a nice-to-have, not a requirement. A simpler v1 without deduplication is viable.

**Confidence: MEDIUM** -- pattern is well-documented but adds complexity. Recommend implementing in the same phase since it is only a few extra lines.

## Installation

```bash
# Single new dependency
npm install @upstash/redis
```

```bash
# Vercel Marketplace setup (one-time, in Vercel dashboard)
# 1. Go to vercel.com/marketplace/upstash
# 2. Install integration
# 3. Create a Redis database (free tier)
# 4. Env vars auto-provisioned: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

```bash
# Local development
# Create .env.local with credentials from Upstash Console
echo "UPSTASH_REDIS_REST_URL=https://your-db.upstash.io" >> .env.local
echo "UPSTASH_REDIS_REST_TOKEN=your-token-here" >> .env.local
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@upstash/redis` (REST/HTTP) | `ioredis` (TCP) | When running in a long-lived server (not serverless). Offers full Redis protocol, Lua scripting, pub/sub. Not compatible with Vercel serverless or Edge Runtime. |
| `@upstash/redis` | `@vercel/kv` | **Never for new projects.** Vercel KV is sunset. `@vercel/kv` was a thin wrapper around `@upstash/redis` anyway. |
| `@upstash/redis` | Vercel Postgres / Supabase | When you need relational data, joins, or complex queries. Massive overkill for a single counter per blog post. Adds connection pooling complexity. |
| `@upstash/redis` | Local JSON file / filesystem | Never in serverless. Serverless functions have ephemeral filesystems. Data would be lost on every cold start. |
| `@upstash/redis` | Third-party analytics (Plausible, Umami) | When you want full analytics (referrers, geography, sessions). Heavier integration, often requires a separate service/self-host. For just a public view counter, Redis is simpler and cheaper. |
| Route Handler | Server Action | When the mutation is tightly coupled to a React form with optimistic UI. View counters are fire-and-forget, not form-driven. |
| Route Handler | Edge Middleware | When you need to run on every request before routing. Middleware is for auth, redirects, rewrites -- not for counting page views. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@vercel/kv` | **Sunset.** Vercel removed docs, stopped new provisioning. Building on deprecated infrastructure. | `@upstash/redis` directly |
| `ioredis` / `redis` (node-redis) | TCP-based. Incompatible with serverless cold starts. Connection management overhead. Not Edge Runtime compatible. | `@upstash/redis` (HTTP/REST, connectionless) |
| `reading-time` npm package | Unnecessary. Velite's `s.metadata()` already computes `readingTime` at build time. Adding another package duplicates existing functionality. | Velite `s.metadata().readingTime` (already in use) |
| `@upstash/ratelimit` | Over-engineered for a personal blog view counter. Adds another dependency for a problem that barely exists at this traffic level. If needed later, simple IP dedup with `SET NX EX` covers it. | Manual `SET key NX EX 86400` pattern |
| Framer Motion / any animation lib for count display | The codebase has a zero-animation-library constraint. A view count number does not need entrance animations. | Static render or CSS transition if counter updates |
| Database (Postgres, MongoDB, etc.) | Massive overkill. A view counter is a single integer per slug. Redis `INCR` is purpose-built for atomic counters. A database adds connection pooling, migrations, ORM, and 10x complexity for a simpler problem. | Redis `INCR` via `@upstash/redis` |

## Stack Patterns by Variant

**For the blog post page (individual post):**
- Server component fetches view count via `redis.get()` at request time
- A tiny `'use client'` component fires `POST /api/views/[slug]` on mount to increment
- `revalidate` or `dynamic = 'force-dynamic'` on the page to ensure fresh counts (or use ISR with short revalidation)

**For the blog listing page (all posts):**
- Use `redis.mget()` to batch-fetch all view counts in a single Redis command
- This avoids N+1 requests (one per post)
- The listing page needs to become dynamic (or use ISR) to show current counts

**For static generation compatibility:**
- The site currently uses `generateStaticParams()` for full static generation
- Adding view counts means post pages must fetch data at request time
- Use `export const dynamic = 'force-dynamic'` or `export const revalidate = 60` (ISR) on the blog post page
- The blog listing page similarly needs ISR or dynamic rendering

**For local development without Redis:**
- Guard Redis calls with a fallback: if env vars are missing, return 0 for view count
- This keeps `npm run dev` working without Redis credentials

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@upstash/redis@^1.36.2` | Next.js 16.1.6 | Uses standard `fetch()`. Works in Node.js runtime and Edge Runtime. No Next.js version constraints. |
| `@upstash/redis@^1.36.2` | Vercel Serverless + Edge | Designed specifically for these environments. HTTP-based, no TCP. |
| `@upstash/redis@^1.36.2` | TypeScript 5.9.3 | Full TypeScript support. All Redis commands are typed. |
| Next.js Route Handlers | Next.js 13+ (App Router) | Stable since Next.js 13. Uses Web standard `Request`/`Response`. `app/api/views/[slug]/route.ts` pattern. |
| Velite `s.metadata()` | Velite 0.3.1 | Already configured and working. Returns `{ readingTime: number, wordCount: number }`. |

## Upstash Free Tier Limits

| Resource | Free Tier Limit | Adequate? |
|----------|----------------|-----------|
| Commands/month | 500,000 | YES -- a personal blog with even 1,000 daily visitors would use ~60K commands/month (view + increment per visit, plus listing page fetches) |
| Data size | 256 MB | YES -- view counts are integers. Even 10,000 blog posts would use < 1 MB |
| Databases | 10 | YES -- only 1 needed |
| Regions | 1 (single region) | YES -- sufficient for a personal blog. Multi-region available on paid plans. |

## Integration Points

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/redis.ts` | Redis client singleton. `Redis.fromEnv()` with graceful fallback if env vars missing. |
| `src/app/api/views/[slug]/route.ts` | Route Handler. GET returns count, POST increments count. |
| `src/components/blog/view-counter.tsx` | `'use client'` component. Fires POST on mount, optionally displays count. |
| `.env.local` | Local dev credentials (gitignored by Next.js default). |

### Existing Files to Modify

| File | Change |
|------|--------|
| `src/app/blog/[slug]/page.tsx` | Add view count display in header metadata. Add `ViewCounter` client component. May need `dynamic` or `revalidate` export. |
| `src/app/blog/page.tsx` | Batch-fetch view counts with `redis.mget()`. Display on post cards. May need `dynamic` or `revalidate` export. |
| `src/components/blog/post-card.tsx` | Add optional `views` prop to display count. |
| `.gitignore` | Verify `.env*.local` is already gitignored (Next.js default -- likely already present). |

### No Changes Needed

| File | Why |
|------|-----|
| `velite.config.ts` | Reading time already configured and working |
| `next.config.ts` | No config changes needed for Route Handlers or Upstash |
| `package.json` scripts | No script changes. `npm run build` still works (Velite then Next.js). |
| `globals.css` | View counts are text, not animations. Standard Tailwind classes suffice. |

## Sources

- [Upstash Redis TypeScript SDK -- Get Started](https://upstash.com/docs/redis/sdks/ts/getstarted) -- verified `Redis.fromEnv()`, env var names, installation. **HIGH confidence.**
- [Upstash Vercel Integration docs](https://upstash.com/docs/redis/howto/vercelintegration) -- verified auto-provisioned env vars, setup flow. **HIGH confidence.**
- [Upstash Blog: Adding a View Counter to Next.js](https://upstash.com/blog/nextjs13-approuter-view-counter) -- verified IP dedup pattern with SET NX EX, INCR pattern, client component reporter. **HIGH confidence.**
- [Vercel Storage docs -- Redis on Vercel](https://vercel.com/docs/redis) -- confirmed Vercel KV sunset, Upstash Marketplace replacement. **HIGH confidence.**
- [Vercel Storage GitHub Issue #829](https://github.com/vercel/storage/issues/829) -- confirmed Vercel KV documentation removal and deprecation. **HIGH confidence.**
- [npm: @upstash/redis](https://www.npmjs.com/package/@upstash/redis) -- verified latest version 1.36.2 (published Feb 2026). **HIGH confidence.**
- [Next.js Route Handlers docs](https://nextjs.org/docs/app/getting-started/route-handlers) -- verified Web standard Request/Response API, supported methods. **HIGH confidence.**
- [Velite Schemas docs](https://velite.js.org/guide/velite-schemas) -- verified `s.metadata()` returns `{ readingTime: number, wordCount: number }`. **HIGH confidence.**
- [Upstash Pricing](https://upstash.com/docs/redis/overall/pricing) -- verified free tier: 500K commands/month, 256MB, 10 databases. **HIGH confidence.**

---
*Stack research for: Blog stats -- view count tracking and reading time for keech.dev*
*Researched: 2026-02-21*
