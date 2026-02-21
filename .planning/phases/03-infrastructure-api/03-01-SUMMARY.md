---
phase: 03-infrastructure-api
plan: 01
subsystem: api
tags: [upstash, redis, next-api, view-count, ip-dedup, sha256]

# Dependency graph
requires: []
provides:
  - "Redis client singleton at src/lib/redis.ts"
  - "View count GET/POST API at /api/views/[slug]"
  - "IP-based deduplication with SHA-256 hashing and 24h TTL"
affects: [04-post-page-integration, 05-listing-polish]

# Tech tracking
tech-stack:
  added: ["@upstash/redis@1.36.2"]
  patterns: ["Redis.fromEnv() singleton", "redis.pipeline() for batched operations", "force-dynamic route segment config", "SHA-256 IP hashing for privacy-safe dedup"]

key-files:
  created:
    - src/lib/redis.ts
    - src/app/api/views/[slug]/route.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used @upstash/redis (not deprecated @vercel/kv) with Redis.fromEnv() singleton"
  - "Pipeline (not transaction) for dedup+increment -- negligible race risk, simpler code"
  - "POST returns { slug, views, deduplicated } to let Phase 4 client know repeat visits"
  - "No slug validation against published posts -- harmless orphan keys"
  - "Fallback IP 127.0.0.1 when x-forwarded-for missing (local dev)"

patterns-established:
  - "API route handlers: src/app/api/{resource}/[param]/route.ts"
  - "Redis client import: import { redis } from '@/lib/redis'"
  - "Error handling: try/catch with console.error('[context]') and 500 JSON response"
  - "Redis key prefixes: views: for counters, dedup: for IP dedup keys"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05]

# Metrics
duration: 2min
completed: 2026-02-21
---

# Phase 3 Plan 1: View Count API Summary

**Redis-backed view count API with GET/POST handlers, IP dedup via SHA-256 hashing, and pipeline-batched Redis operations using @upstash/redis**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-21T18:16:37Z
- **Completed:** 2026-02-21T18:18:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed @upstash/redis@1.36.2 and created Redis client singleton with Redis.fromEnv()
- Created view count API at /api/views/[slug] with GET (read count) and POST (increment with dedup)
- IP-based deduplication using SHA-256 hashing with 24h TTL -- no raw IPs stored in Redis
- Pipeline batches dedup SET (NX) + INCR into single HTTP round-trip
- force-dynamic prevents build-time caching of API responses

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @upstash/redis and create Redis client singleton** - `e44cfc9` (feat)
2. **Task 2: Create view count route handler with GET, POST, and IP deduplication** - `23a2dab` (feat)

## Files Created/Modified
- `src/lib/redis.ts` - Redis client singleton exporting `redis` via `Redis.fromEnv()`
- `src/app/api/views/[slug]/route.ts` - View count GET and POST route handlers with IP dedup
- `package.json` - Added @upstash/redis dependency
- `package-lock.json` - Updated lockfile

## Decisions Made
- Used `@upstash/redis` (not deprecated `@vercel/kv`) with `Redis.fromEnv()` singleton -- HTTP-based, no connection pooling needed
- Pipeline (not transaction) for dedup+increment -- negligible race condition risk for personal blog, simpler code
- POST response includes `deduplicated` boolean field so Phase 4 client code can distinguish repeat visits
- No slug validation against published posts -- orphan Redis keys are harmless, Phase 4/5 only displays counts for real slugs
- Fallback IP `127.0.0.1` when `x-forwarded-for` header is missing (local dev scenario)
- Error responses use `{ error: string }` shape with HTTP 500 status

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered
- ESLint (`npm run lint` / `next lint`) fails due to pre-existing configuration issue (circular structure in eslint config with Next.js 16). This is a pre-existing tooling issue unrelated to our changes. TypeScript type checking (`tsc --noEmit`) passes cleanly.

## User Setup Required

**External services require manual configuration.** The view count API requires Upstash Redis credentials:

1. **Create Upstash Redis database:** Vercel Dashboard > Storage tab > Create Database > Upstash Redis (recommended), or create directly at upstash.com
2. **Add environment variables to `.env.local`:**
   - `UPSTASH_REDIS_REST_URL` - REST URL from Upstash console or Vercel dashboard
   - `UPSTASH_REDIS_REST_TOKEN` - REST token from same location
3. **Verify:** Run `npm run dev` and test with:
   - `curl -X POST http://localhost:3000/api/views/test-slug`
   - `curl -X GET http://localhost:3000/api/views/test-slug`

Alternatively, run `vercel env pull` if using Vercel Marketplace integration.

## Next Phase Readiness
- View count API is complete and testable via curl once Redis credentials are configured
- Phase 4 can import `{ redis }` from `@/lib/redis` and call the API from client components
- API response shapes are stable: GET returns `{ slug, views }`, POST returns `{ slug, views, deduplicated }`
- No blockers for Phase 4

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 03-infrastructure-api*
*Completed: 2026-02-21*
