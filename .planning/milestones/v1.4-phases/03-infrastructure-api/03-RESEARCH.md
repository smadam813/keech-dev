# Phase 3: Infrastructure & API - Research

**Researched:** 2026-02-21
**Domain:** Serverless Redis view count API with IP deduplication
**Confidence:** HIGH

## Summary

This phase introduces the site's first backend integration: a view count API backed by Upstash Redis. The implementation is straightforward and well-supported by the ecosystem. `@upstash/redis` is the standard package for serverless Redis on Vercel, using HTTP/REST instead of persistent TCP connections (ideal for serverless). Next.js 16 App Router route handlers provide the API surface with `force-dynamic` to prevent build-time caching.

The key technical considerations are: (1) using `redis.pipeline()` to batch the dedup check + increment into a single HTTP round-trip, (2) IP resolution via `x-forwarded-for` header which Vercel sets to the client's public IP, (3) SHA-256 hashing via Node.js `crypto.createHash()` since the route handlers run in the Node.js runtime (not Edge), and (4) `export const dynamic = 'force-dynamic'` on the route file to ensure GET requests are never statically cached.

**Primary recommendation:** Use `@upstash/redis` v1.36.x with `Redis.fromEnv()`, a single route file at `src/app/api/views/[slug]/route.ts` exporting both GET and POST handlers, and `redis.pipeline()` for atomic-ish dedup+increment operations.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
No locked decisions -- all implementation choices delegated to Claude.

### Claude's Discretion
The user delegated all implementation decisions to Claude. The following areas were discussed and explicitly left to Claude's judgment:

**API response shape**
- JSON structure for GET and POST responses (minimal vs richer)
- Whether GET and POST share the same shape or POST includes extra fields (e.g., deduplicated flag)
- HTTP status code strategy for successful increments
- Whether to validate slugs against published posts

**Error behavior**
- Response when Redis is unreachable (status code and body shape)
- Logging/observability approach for errors
- Whether to add rate limiting beyond IP dedup
- Input validation level for slug format

**Redis key design**
- Key prefix/namespace strategy
- What to store in dedup keys (flag vs timestamp)
- Atomicity approach (individual commands vs pipeline/transaction)
- Redis client instantiation pattern (singleton vs per-request)

**IP resolution**
- Header resolution strategy for Vercel deployment
- Fallback behavior when no IP can be resolved
- Whether to salt the SHA-256 hash
- Local development experience (require Redis vs mock fallback)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Upstash Redis client configured via `Redis.fromEnv()` with Vercel Marketplace env vars | `@upstash/redis` v1.36.x provides `Redis.fromEnv()` which reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` -- these are auto-provisioned by Vercel Marketplace integration. See Standard Stack and Code Examples sections. |
| INFRA-02 | POST `/api/views/[slug]` increments view count and returns new total | Next.js 16 route handlers support `export async function POST()` with dynamic segments. `params` is a `Promise<{ slug: string }>`. Redis `incr` command returns the new total. See Architecture Patterns and Code Examples. |
| INFRA-03 | GET `/api/views/[slug]` returns current view count without incrementing | Same route file can export both GET and POST. Redis `get` returns the current value (or null for new slugs). See Code Examples. |
| INFRA-04 | IP-based deduplication with SHA-256 hashing and 24h TTL prevents refresh spam | Vercel provides `x-forwarded-for` header with client IP. Node.js `crypto.createHash('sha256')` for hashing. Redis `set` with `ex: 86400` (24h) for TTL on dedup keys. See Architecture Patterns and Common Pitfalls. |
| INFRA-05 | Route handler uses `force-dynamic` to prevent build-time caching | `export const dynamic = 'force-dynamic'` is a standard route segment config option in Next.js 16. Ensures route is rendered at request time, not build time. See Standard Stack section. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/redis` | 1.36.x | Serverless Redis client via HTTP/REST | The standard for Vercel + Redis. HTTP-based (no TCP), works in serverless without connection pooling. `Redis.fromEnv()` reads Vercel Marketplace env vars automatically. `@vercel/kv` is deprecated (Dec 2024) -- this is the replacement. |
| `next` (route handlers) | 16.1.x | API route surface | Already installed. App Router route handlers (`app/api/*/route.ts`) are the standard for API endpoints. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js `crypto` module | Built-in | SHA-256 hashing of IP addresses | Always -- for IP deduplication. Built into Node.js, zero dependencies. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@upstash/redis` | `@vercel/kv` | Deprecated since Dec 2024 -- project REQUIREMENTS.md explicitly excludes it |
| `@upstash/redis` | `ioredis` / `redis` | TCP-based, requires persistent connections -- incompatible with serverless |
| Node.js `crypto` | Web Crypto API (`crypto.subtle`) | Works in Edge runtime but async-only. Node.js `crypto.createHash()` is simpler and we use Node.js runtime |
| `force-dynamic` export | `headers()` usage | Calling `headers()` in a route handler also triggers dynamic rendering, but `force-dynamic` is more explicit and self-documenting |

**Installation:**
```bash
npm install @upstash/redis
```

No other packages needed. Node.js `crypto` is built-in.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── views/
│           └── [slug]/
│               └── route.ts      # GET + POST handlers, force-dynamic
└── lib/
    └── redis.ts                  # Redis client singleton
```

Two new files total. The Redis client lives in `src/lib/redis.ts` (alongside existing `utils.ts`, `fonts.ts`, `rune-glows.ts`). The route handler lives at the standard API route path.

### Pattern 1: Redis Client Singleton
**What:** Export a single Redis instance from `src/lib/redis.ts`, imported by route handlers.
**When to use:** Always. `@upstash/redis` is HTTP-based (stateless), so a module-level singleton is safe and idiomatic. Each request gets its own HTTP call to Upstash, not a persistent connection.
**Why not per-request:** No benefit -- HTTP client has no connection state to manage.

```typescript
// Source: Upstash official docs (https://upstash.com/docs/redis/howto/connectwithupstashredis)
import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()
```

### Pattern 2: Pipeline for Dedup + Increment
**What:** Use `redis.pipeline()` to batch the dedup-check SET and the view-count INCR into a single HTTP round-trip.
**When to use:** POST handler -- where we need to check/set dedup key AND increment the counter.
**Why pipeline:** Reduces 2-3 HTTP round-trips to 1. Upstash charges per command but the latency saving matters more for UX.

```typescript
// Source: Upstash Pipeline docs (https://upstash.com/docs/redis/sdks/ts/pipelining/pipeline-transaction)
const p = redis.pipeline()
p.set(`dedup:${slug}:${ipHash}`, '1', { ex: 86400, nx: true })
p.incr(`views:${slug}`)
const results = await p.exec()
```

**Important:** Pipelines are NOT atomic. Other commands can interleave. For this use case, that is acceptable -- worst case is a rare double-count, which is fine for a personal blog. If atomicity were critical, use `redis.multi()` (transactions) instead, but that adds complexity for negligible benefit here.

### Pattern 3: Route Handler with force-dynamic
**What:** Export `dynamic = 'force-dynamic'` plus GET and POST functions from a single route file.
**When to use:** This route file. Ensures GET responses are never cached at build time.

```typescript
// Source: Next.js 16 docs (https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  // ...
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  // ...
}
```

### Pattern 4: IP Resolution on Vercel
**What:** Read client IP from `x-forwarded-for` header, hash with SHA-256, use as dedup key.
**When to use:** POST handler for dedup.

```typescript
// Source: Vercel docs (https://vercel.com/docs/headers/request-headers)
// x-forwarded-for: The public IP address of the client that made the request.
// Vercel overwrites this header and does not forward external IPs (anti-spoofing).
const forwarded = request.headers.get('x-forwarded-for')
const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
```

**Note:** `x-forwarded-for` can contain comma-separated IPs if proxied. Take the first one. Vercel's anti-spoofing means the first value is always the real client IP on Vercel deployments. `x-real-ip` and `x-vercel-forwarded-for` are also available as identical alternatives, but `x-forwarded-for` is the most standard.

### Anti-Patterns to Avoid
- **Creating a new Redis instance per request:** Wastes time on initialization. The HTTP client is stateless -- singleton is correct.
- **Using `redis.multi()` when `redis.pipeline()` suffices:** Transactions add overhead. For a personal blog view counter, pipeline is sufficient.
- **Storing raw IP addresses in Redis:** Privacy violation. Always hash first.
- **Using Edge runtime for this route:** No benefit and adds constraints (cannot use `crypto.createHash()`). Node.js runtime is the default and correct choice.
- **Validating slugs against published posts:** Unnecessary for Phase 3. A POST to a non-existent slug just creates a harmless Redis key. Phase 4/5 will only display counts for real posts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Redis connection management | TCP connection pool, reconnect logic | `@upstash/redis` HTTP client | Serverless has no persistent connections. HTTP client handles this. |
| IP dedup storage | Custom in-memory dedup map | Redis SET with EX (TTL) and NX | Stateless serverless functions lose memory between invocations. Redis is the shared state. |
| Request batching | Sequential await for each Redis call | `redis.pipeline()` | Single HTTP round-trip vs multiple. Upstash pipeline API handles this. |
| Rate limiting | Custom counter logic | IP dedup with 24h TTL is sufficient | For a personal blog, IP dedup IS the rate limiting. No need for `@upstash/ratelimit`. |

**Key insight:** Every "stateful" concern (dedup tracking, view counts, rate limiting) must live in Redis because serverless functions are stateless. Don't try to maintain any state in the function itself.

## Common Pitfalls

### Pitfall 1: Build-Time Route Execution
**What goes wrong:** GET route handler executes during `next build`, calling Redis with no data, and caches an empty response forever.
**Why it happens:** Next.js 16 GET handlers are dynamic by default (changed in v15), but in some configurations with `generateStaticParams` or when no dynamic APIs are used, they can be prerendered.
**How to avoid:** Export `export const dynamic = 'force-dynamic'` at the top of the route file. This is INFRA-05.
**Warning signs:** `next build` output shows the API route as static (circle icon) instead of dynamic (lambda icon).

### Pitfall 2: Missing Environment Variables in Development
**What goes wrong:** `Redis.fromEnv()` throws at module load time because `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are not set.
**Why it happens:** Vercel Marketplace sets env vars in Vercel's dashboard, not in local `.env` files.
**How to avoid:** Add the two env vars to `.env.local` for development. Use `vercel env pull` to sync them, or copy from Upstash console.
**Warning signs:** Crash on `npm run dev` with "UPSTASH_REDIS_REST_URL is not defined" error.

### Pitfall 3: x-forwarded-for with Multiple IPs
**What goes wrong:** `x-forwarded-for` header contains "ip1, ip2, ip3" (comma-separated chain), and hashing the entire string creates different hashes for the same client behind different proxy chains.
**Why it happens:** Standard HTTP behavior appends proxy IPs to the header.
**How to avoid:** Split on comma, take the first value, trim whitespace.
**Warning signs:** Same user gets counted multiple times.

### Pitfall 4: Redis INCR on Non-Existent Keys
**What goes wrong:** Nothing, actually. This is a non-pitfall. Redis `INCR` on a non-existent key initializes it to 0 then increments to 1. This is the correct behavior for first views.
**Why it matters:** Don't add unnecessary "check if key exists" logic before incrementing. Trust Redis semantics.

### Pitfall 5: Forgetting NX on Dedup SET
**What goes wrong:** Every POST overwrites the dedup key's TTL, effectively making the 24h window slide instead of being fixed from first visit.
**Why it happens:** Using `SET key value EX 86400` without `NX` (only set if not exists).
**How to avoid:** Use `{ ex: 86400, nx: true }` in the SET options. If the key already exists, SET returns null and does NOT reset the TTL.
**Warning signs:** The dedup window never expires for repeat visitors.

### Pitfall 6: Pipeline Result Ordering
**What goes wrong:** Reading pipeline results in wrong order, misinterpreting which result corresponds to which command.
**Why it happens:** `pipeline.exec()` returns an array ordered by command insertion order. Easy to mix up.
**How to avoid:** Destructure with clear variable names: `const [dedupResult, viewCount] = results`.
**Warning signs:** Returning the dedup flag as the view count.

## Code Examples

Verified patterns from official sources:

### Redis Client Setup (`src/lib/redis.ts`)
```typescript
// Source: Upstash docs (https://upstash.com/docs/redis/howto/connectwithupstashredis)
import { Redis } from '@upstash/redis'

export const redis = Redis.fromEnv()
// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// Throws at module load if vars are missing
```

### SHA-256 IP Hashing
```typescript
// Source: Node.js crypto docs (https://nodejs.org/api/crypto.html)
import { createHash } from 'crypto'

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}
```

### GET Handler (Read Count)
```typescript
// Source: Next.js 16 route handler docs (https://nextjs.org/docs/app/api-reference/file-conventions/route)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const views = await redis.get<number>(`views:${slug}`) ?? 0
  return Response.json({ slug, views })
}
```

### POST Handler (Increment with Dedup)
```typescript
// Combines: Upstash pipeline docs + Vercel IP headers + Node.js crypto
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Resolve client IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
  const ipHash = hashIP(ip)

  // Pipeline: set dedup key (NX = only if not exists) + increment view count
  const p = redis.pipeline()
  p.set(`dedup:${slug}:${ipHash}`, '1', { ex: 86400, nx: true })
  p.incr(`views:${slug}`)
  const [dedupResult, viewCount] = await p.exec<[string | null, number]>()

  // dedupResult is 'OK' if key was set (new visitor), null if already existed
  const deduplicated = dedupResult === null

  return Response.json({ slug, views: viewCount, deduplicated })
}
```

### Error Handling Pattern
```typescript
// Wrap Redis operations in try/catch, return 500 on failure
try {
  const views = await redis.get<number>(`views:${slug}`) ?? 0
  return Response.json({ slug, views })
} catch (error) {
  console.error('[views] Redis error:', error)
  return Response.json(
    { error: 'Failed to fetch view count' },
    { status: 500 }
  )
}
```

### Environment Variables (`.env.local`)
```bash
# From Upstash Console or `vercel env pull`
UPSTASH_REDIS_REST_URL=https://us1-example.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your-token
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@vercel/kv` package | `@upstash/redis` directly | Dec 2024 | `@vercel/kv` deprecated for new projects. Direct Upstash SDK is the standard now. |
| `getServerSideProps` API routes | App Router route handlers | Next.js 13+ (2023) | Route handlers use Web Request/Response APIs, not Node.js req/res. |
| `context.params` (sync) | `context.params` (Promise) | Next.js 15+ (2024) | Params must be awaited: `const { slug } = await params`. |
| GET handlers cached by default | GET handlers dynamic by default | Next.js 15+ (2024) | `force-dynamic` is technically redundant in Next.js 15+, but explicit is better. |
| `cacheComponents` flag | Route segment config (`dynamic`) | Next.js 16 (2025) | Route segment config options will eventually be deprecated when `cacheComponents` is stable, but they work now. |

**Deprecated/outdated:**
- `@vercel/kv`: Deprecated Dec 2024. Use `@upstash/redis` directly.
- `NextApiRequest`/`NextApiResponse`: Pages Router pattern. Use Web API `Request`/`Response` instead.
- Sync `params` access: Must await params in Next.js 15+/16.

## Open Questions

1. **Pipeline dedup race condition**
   - What we know: Pipelines are not atomic. Two simultaneous requests from the same IP could both get `dedupResult = 'OK'` if they interleave before either SET completes.
   - What's unclear: Whether `redis.multi()` (transaction) would prevent this at Upstash's REST API level.
   - Recommendation: Accept the negligible risk. For a personal blog, an occasional double-count from concurrent requests is imperceptible. Using pipeline (not transaction) keeps the code simpler. If needed later, `redis.multi()` has the same API surface.

2. **Slug validation scope**
   - What we know: The API accepts any slug string. POSTing to `/api/views/nonexistent-post` creates a Redis key that is never displayed.
   - What's unclear: Whether orphan keys are a concern.
   - Recommendation: Don't validate slugs in Phase 3. The overhead of importing Velite posts into a route handler adds complexity. Orphan keys cost nothing in Redis. Phase 4/5 will only display counts for real slugs anyway.

3. **Local development without Redis**
   - What we know: `Redis.fromEnv()` throws if env vars are missing. Development requires either real Upstash credentials or a workaround.
   - What's unclear: Whether to provide a mock/fallback or just require real credentials.
   - Recommendation: Require real credentials. Upstash free tier provides 10,000 commands/day, more than enough for development. Document the `.env.local` setup. Avoiding mocks means the development experience matches production exactly.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - route handler conventions, caching, params, dynamic segments (doc version 16.1.6, last updated 2026-02-20)
- [Next.js 16 route.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/route) - function signatures, context params as Promise, RouteContext helper (doc version 16.1.6)
- [Next.js 16 Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) - `force-dynamic` option, all config values (doc version 16.1.6)
- [Vercel Request Headers](https://vercel.com/docs/headers/request-headers) - `x-forwarded-for` is the public client IP, Vercel overwrites it (anti-spoofing), `x-real-ip` is identical
- [Upstash Redis Connection](https://upstash.com/docs/redis/howto/connectwithupstashredis) - `Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [Upstash Pipeline & Transaction](https://upstash.com/docs/redis/sdks/ts/pipelining/pipeline-transaction) - `redis.pipeline()` and `redis.multi()` API, `exec()` returns ordered array
- [Upstash EXPIRE command](https://upstash.com/docs/redis/sdks/ts/commands/generic/expire) - `redis.expire(key, seconds)` returns 1 or 0
- [Upstash Vercel Integration](https://upstash.com/docs/redis/howto/vercelintegration) - Marketplace setup, env var provisioning

### Secondary (MEDIUM confidence)
- [Upstash Redis npm](https://www.npmjs.com/package/@upstash/redis) - Latest version 1.36.2, published Feb 2026
- [Upstash Pipeline blog post](https://upstash.com/blog/pipeline) - Pipeline is NOT atomic, commands can interleave
- [Node.js crypto module](https://nodejs.org/api/crypto.html) - `createHash('sha256').update(data).digest('hex')` pattern

### Tertiary (LOW confidence)
- None. All findings verified with official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs from both Next.js 16 and Upstash confirm all patterns. `@upstash/redis` is the documented standard for Vercel + Redis.
- Architecture: HIGH - Route handler patterns are directly from Next.js 16 docs (version 16.1.6). Pipeline API verified in Upstash docs.
- Pitfalls: HIGH - All pitfalls derived from verified behavior (params as Promise, force-dynamic semantics, SET NX behavior, pipeline ordering).

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable ecosystem, no fast-moving changes expected)
