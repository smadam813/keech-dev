---
phase: 03-infrastructure-api
verified: 2026-02-21T18:23:06Z
status: gaps_found
score: 4/5 must-haves verified
re_verification: false
gaps:
  - truth: "Repeated POSTs from the same IP within 24h do not inflate the count beyond the first increment"
    status: failed
    reason: "The pipeline unconditionally runs both SET(nx) and INCR. The dedup key tracks whether the IP is a repeat visitor, but INCR executes regardless. Every POST increments the counter — the deduplicated flag informs the caller, but enforcement is deferred to Phase 4 client code. The API itself does not prevent inflation."
    artifacts:
      - path: "src/app/api/views/[slug]/route.ts"
        issue: "Lines 39-42: p.incr() is added to pipeline unconditionally before exec(). dedupResult is only used to set the response flag, not to skip the increment."
    missing:
      - "Conditional INCR: only call p.incr() when dedupResult is not null (i.e., first visit), OR restructure as two-step: check dedup key first, only run INCR if dedup SET succeeds"
      - "Alternative approach: use a Lua script or redis.multi() with WATCH to make dedup+increment atomic, only incrementing when SET nx returns OK"
      - "Simplest fix: execute pipeline, then check dedupResult — if null (repeat), do not count the INCR result in the response and optionally issue a DECR to correct the already-executed increment"
human_verification:
  - test: "curl POST to same slug from same IP twice, verify count after second POST"
    expected: "After two POSTs from the same IP within 24h, GET returns views: 1 (not views: 2)"
    why_human: "Requires running dev server with real Redis credentials — cannot verify dedup behavior without live Redis"
  - test: "curl POST to same slug from different IPs (use --header overrides), verify both increment"
    expected: "Two POSTs from distinct IPs both increment: GET returns views: 2"
    why_human: "Requires running dev server and header spoofing — confirms dedup only applies per-IP, not globally"
---

# Phase 3: Infrastructure & API Verification Report

**Phase Goal:** A working view count API that can be tested independently via curl before any UI is touched
**Verified:** 2026-02-21T18:23:06Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/views/hello-world returns JSON with slug and incremented view count | VERIFIED | `route.ts` line 46: `return Response.json({ slug, views: viewCount, deduplicated })`. POST handler uses `p.incr()` and returns result. |
| 2 | GET /api/views/hello-world returns current count without incrementing | VERIFIED | `route.ts` lines 17-18: `const views = await redis.get<number>(...) ?? 0; return Response.json({ slug, views })`. No INCR in GET handler. |
| 3 | Repeated POSTs from the same IP within 24h do not inflate the count beyond the first increment | FAILED | `p.incr()` executes unconditionally in the pipeline (line 41). Every POST increments regardless of dedup status. The `deduplicated` flag only signals the caller — enforcement is not done at the API layer. The PLAN's own curl test confirms this: it shows `views: 2` after a repeat POST. |
| 4 | No raw IP addresses are stored in Redis — only SHA-256 hashes | VERIFIED | `route.ts` lines 35-37: IP resolved from `x-forwarded-for`, immediately passed to `hashIP()` which returns `createHash('sha256').update(ip).digest('hex')`. `ipHash` (not `ip`) is embedded in the dedup key at line 40. |
| 5 | GET requests return fresh data on every call (force-dynamic prevents build-time caching) | VERIFIED | `route.ts` line 4: `export const dynamic = 'force-dynamic'` at module level. |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/redis.ts` | Upstash Redis client singleton exporting `redis` | VERIFIED | File exists, 3 lines, imports `Redis` from `@upstash/redis`, exports `redis = Redis.fromEnv()`. Minimal and correct. |
| `src/app/api/views/[slug]/route.ts` | GET and POST route handlers with `force-dynamic` | VERIFIED | File exists, 54 lines, exports `dynamic`, `GET`, and `POST`. Substantive implementation with error handling in both handlers. |
| `@upstash/redis` in `package.json` | Dependency at `^1.36.2` | VERIFIED | `package.json` contains `"@upstash/redis": "^1.36.2"`. Installed at `node_modules/@upstash/redis@1.36.2` confirmed via `npm ls`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/views/[slug]/route.ts` | `src/lib/redis.ts` | `import { redis }` | WIRED | Line 1: `import { redis } from '@/lib/redis'`. `redis` used at lines 17, 39. |
| `src/app/api/views/[slug]/route.ts` | `crypto` (Node.js) | `createHash('sha256')` | WIRED | Line 2: `import { createHash } from 'crypto'`. Used at line 7 inside `hashIP()`. `hashIP()` called at line 37. |
| `src/app/api/views/[slug]/route.ts` | `redis pipeline` | `redis.pipeline()` for dedup+increment | WIRED | Lines 39-42: `redis.pipeline()` called, `p.set()` and `p.incr()` added, `p.exec()` awaited with typed result destructuring. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 03-01-PLAN.md | Upstash Redis client configured via `Redis.fromEnv()` with Vercel Marketplace env vars | SATISFIED | `src/lib/redis.ts` exports `redis = Redis.fromEnv()` importing from `@upstash/redis` (not deprecated `@vercel/kv`). |
| INFRA-02 | 03-01-PLAN.md | POST `/api/views/[slug]` increments view count and returns new total | SATISFIED | POST handler uses `p.incr('views:${slug}')` and returns `{ slug, views: viewCount, deduplicated }`. |
| INFRA-03 | 03-01-PLAN.md | GET `/api/views/[slug]` returns current view count without incrementing | SATISFIED | GET handler uses `redis.get()` only — no INCR anywhere in the GET path. Returns `{ slug, views }`. |
| INFRA-04 | 03-01-PLAN.md | IP-based deduplication with SHA-256 hashing and 24h TTL prevents refresh spam | PARTIAL | SHA-256 hashing: confirmed. 24h TTL (`ex: 86400`): confirmed. `nx: true` prevents TTL reset: confirmed. However, the dedup key's existence does NOT prevent INCR from running — the count inflates on every POST regardless of dedup status. "Prevents refresh spam" is not enforced at the API layer. |
| INFRA-05 | 03-01-PLAN.md | Route handler uses `force-dynamic` to prevent build-time caching | SATISFIED | `export const dynamic = 'force-dynamic'` at line 4 of `route.ts`. |

**Requirements summary:** 4/5 fully satisfied. INFRA-04 is partial — the privacy-safe hashing and TTL mechanics are correct, but the dedup key's presence does not suppress the INCR.

**Orphaned requirements check:** No requirements in REQUIREMENTS.md map to Phase 3 beyond INFRA-01 through INFRA-05. VIEW-*, UX-* requirements are explicitly mapped to Phases 4 and 5. No orphans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No TODOs, FIXMEs, placeholders, stub returns, or empty handlers found. |

### Human Verification Required

#### 1. Repeat POST from Same IP Does Not Inflate Count

**Test:** Start dev server (`npm run dev` with `.env.local` configured). Run `curl -X POST http://localhost:3000/api/views/test-slug` twice in quick succession. Then `curl -X GET http://localhost:3000/api/views/test-slug`.
**Expected (per success criterion #3):** GET returns `views: 1`
**Actual (per PLAN curl test section):** GET returns `views: 2` — the PLAN itself documents this behavior
**Why human:** Requires live Redis credentials and a running dev server. Cannot verify Redis pipeline behavior without execution.

#### 2. Different IPs Both Increment

**Test:** Run POST twice with different `x-forwarded-for` header values: `curl -X POST -H "x-forwarded-for: 1.2.3.4" ...` then `curl -X POST -H "x-forwarded-for: 5.6.7.8" ...`
**Expected:** GET returns `views: 2`
**Why human:** Requires live Redis and a dev server.

### Gaps Summary

One gap blocks full goal achievement: the dedup mechanism does not prevent view count inflation at the API layer.

**Root cause:** The pipeline batches SET(nx) and INCR unconditionally. This is a deliberate design choice documented in the PLAN — the PLAN's own curl test at line 216-218 explicitly states a repeat POST returns `views: 2` with `deduplicated: true`. The design intent is for Phase 4 client code to read the `deduplicated` flag and avoid calling POST on repeat visits within 24h.

**Conflict with success criterion #3:** The phase success criterion states "Repeated POSTs from the same IP within 24 hours do not inflate the count beyond the first increment." The implementation does not satisfy this — it inflates the count on every POST and defers enforcement to Phase 4.

**What needs to change:** The API must reject or ignore the increment for repeat visitors within 24h. Two viable approaches:

1. **Two-step with conditional INCR:** Execute `SET nx` first (not in pipeline). If it returns `'OK'`, run `INCR`. If null, skip INCR and return current count via `GET`. This adds a round-trip but enforces dedup at the API layer.

2. **Lua script (atomic):** Use `redis.eval()` with a Lua script that atomically checks the dedup key and conditionally increments. Single round-trip, truly atomic, but adds complexity.

3. **Post-hoc correction:** Keep the pipeline but add a conditional DECR when `dedupResult === null`. Simpler code but results in two operations for repeat visitors. Not recommended (race conditions on the correction).

**Impact on Phase 4:** If Phase 4 client code reliably calls POST only once per post per 24h (enforced client-side by checking `deduplicated` in the response or using localStorage), the count stays accurate in practice. The gap is whether the API provides the guarantee independently — which the success criterion requires.

---

_Verified: 2026-02-21T18:23:06Z_
_Verifier: Claude (gsd-verifier)_
