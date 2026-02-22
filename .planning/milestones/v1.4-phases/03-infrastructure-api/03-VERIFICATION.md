---
phase: 03-infrastructure-api
verified: 2026-02-21T19:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Repeated POSTs from the same IP within 24h do not inflate the count beyond the first increment"
  gaps_remaining: []
  regressions: []
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
**Verified:** 2026-02-21T19:00:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (03-02-PLAN.md, commit 897040e)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/views/hello-world returns JSON with slug and incremented view count | VERIFIED | `route.ts` lines 44-45: `redis.incr()` runs on first visit, returns `{ slug, views: viewCount, deduplicated: false }`. |
| 2 | GET /api/views/hello-world returns current count without incrementing | VERIFIED | `route.ts` lines 17-18: `redis.get()` only, no INCR anywhere in GET path. Returns `{ slug, views }`. |
| 3 | Repeated POSTs from the same IP within 24h do not inflate the count beyond the first increment | VERIFIED | Two-step logic: `redis.set()` with `nx: true` runs first (line 40). On repeat visit `dedupResult` is not `'OK'`, execution falls to `else` branch (lines 46-50) which runs `redis.get()` only — no INCR executes. Pipeline is completely absent from the file. |
| 4 | No raw IP addresses are stored in Redis — only SHA-256 hashes | VERIFIED | `route.ts` lines 35-37: IP resolved from `x-forwarded-for`, immediately passed to `hashIP()` which returns `createHash('sha256').update(ip).digest('hex')`. `ipHash` (not `ip`) embedded in dedup key at line 40. |
| 5 | GET requests return fresh data on every call (force-dynamic prevents build-time caching) | VERIFIED | `route.ts` line 4: `export const dynamic = 'force-dynamic'` unchanged from initial verification. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/redis.ts` | Upstash Redis client singleton exporting `redis` | VERIFIED | 3 lines, imports `Redis` from `@upstash/redis`, exports `redis = Redis.fromEnv()`. Unchanged from initial verification. |
| `src/app/api/views/[slug]/route.ts` | GET and POST handlers with `force-dynamic`, two-step dedup | VERIFIED | 58 lines. Exports `dynamic`, `GET`, `POST`. Pipeline removed. Two-step SET NX + conditional INCR implemented. Both handlers wrapped in try/catch. |
| `@upstash/redis` in `package.json` | Dependency at `^1.36.2` | VERIFIED | `"@upstash/redis": "^1.36.2"` in package.json. Package installed at `node_modules/@upstash/redis`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/views/[slug]/route.ts` | `src/lib/redis.ts` | `import { redis }` | WIRED | Line 1: `import { redis } from '@/lib/redis'`. Used at lines 17, 40, 44, 48 — all four Redis calls reference the imported client. |
| `src/app/api/views/[slug]/route.ts` | `crypto` (Node.js) | `createHash('sha256')` | WIRED | Line 2: `import { createHash } from 'crypto'`. Used at line 7 inside `hashIP()`. `hashIP()` called at line 37. |
| `src/app/api/views/[slug]/route.ts` | `redis SET NX` then conditional `redis INCR` | Two-step: SET NX first, then conditional INCR | WIRED | Line 40: `redis.set(..., { ex: 86400, nx: true })`. Line 42: `if (dedupResult === 'OK')`. Line 44 (inside if): `redis.incr()`. Line 48 (else): `redis.get()`. No pipeline present anywhere in file. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 03-01-PLAN.md, 03-02-PLAN.md | Upstash Redis client configured via `Redis.fromEnv()` with Vercel Marketplace env vars | SATISFIED | `src/lib/redis.ts` unchanged: `export const redis = Redis.fromEnv()` importing from `@upstash/redis`. |
| INFRA-02 | 03-01-PLAN.md, 03-02-PLAN.md | POST `/api/views/[slug]` increments view count and returns new total | SATISFIED | POST handler: first visit runs `redis.incr()` and returns `{ slug, views: viewCount, deduplicated: false }`. Response shape confirmed at line 45. |
| INFRA-03 | 03-01-PLAN.md, 03-02-PLAN.md | GET `/api/views/[slug]` returns current view count without incrementing | SATISFIED | GET handler: `redis.get()` only (line 17). No INCR in GET path. GET handler unchanged from initial verification. |
| INFRA-04 | 03-01-PLAN.md, 03-02-PLAN.md | IP-based deduplication with SHA-256 hashing and 24h TTL prevents refresh spam | SATISFIED | SHA-256: line 7 confirmed. 24h TTL (`ex: 86400`) and NX: line 40 confirmed. Enforcement: `redis.incr()` only runs inside `if (dedupResult === 'OK')` branch (lines 42-44). Repeat visits fall to `else` branch — no increment occurs. Gap is closed. |
| INFRA-05 | 03-01-PLAN.md, 03-02-PLAN.md | Route handler uses `force-dynamic` to prevent build-time caching | SATISFIED | Line 4: `export const dynamic = 'force-dynamic'`. Unchanged. |

**Requirements summary:** 5/5 satisfied. INFRA-04 fully enforced at API layer after gap closure commit 897040e.

**Orphaned requirements check:** No requirements in REQUIREMENTS.md map to Phase 3 beyond INFRA-01 through INFRA-05. VIEW-*, UX-* requirements are explicitly mapped to Phases 4 and 5. No orphans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No TODOs, FIXMEs, placeholders, stub returns, or empty handlers found. |

### Re-verification: Gap Closure Validation

**Gap that was open:** INFRA-04 — `p.incr()` executed unconditionally in pipeline on every POST, inflating count regardless of dedup status.

**Fix applied (commit 897040e):** Replaced the `redis.pipeline()` block with a two-step approach:

1. `redis.set(dedup key, '1', { ex: 86400, nx: true })` — returns `'OK'` on first visit, `null` on repeat.
2. If `'OK'`: `redis.incr()` runs — count increments, `deduplicated: false` returned.
3. If not `'OK'`: `redis.get()` runs — current count returned without change, `deduplicated: true` returned.

**Evidence pipeline is gone:** `grep pipeline` on `route.ts` returns no matches. Direct file read confirms lines 39-50 show the two-step logic exclusively; no `p.` references anywhere in the file.

**TypeScript:** `npx tsc --noEmit` exits 0 — no type errors introduced by the rewrite.

**Regression checks:**

| Item | Previous Status | Current Status | Evidence |
|------|-----------------|----------------|----------|
| INFRA-01: Redis client import | VERIFIED | VERIFIED | `import { redis } from '@/lib/redis'` at line 1, unchanged |
| INFRA-02: POST increments on first visit | VERIFIED | VERIFIED | `redis.incr()` at line 44 inside `if (dedupResult === 'OK')` branch |
| INFRA-03: GET never increments | VERIFIED | VERIFIED | GET handler lines 10-26 unchanged; no INCR in GET path |
| INFRA-04: Dedup enforcement | FAILED | VERIFIED | Two-step conditional — INCR only runs on `'OK'` result |
| INFRA-05: force-dynamic | VERIFIED | VERIFIED | Line 4 unchanged |

### Human Verification Required

These items cannot be verified without a live Redis connection and running dev server. All automated checks pass — the human tests are for behavioral confirmation only.

#### 1. Repeat POST from Same IP Does Not Inflate Count

**Test:** Start dev server (`npm run dev` with `.env.local` configured with Upstash credentials). Run `curl -X POST http://localhost:3000/api/views/test-slug` twice in quick succession. Then `curl -X GET http://localhost:3000/api/views/test-slug`.
**Expected:** GET returns `{ "slug": "test-slug", "views": 1 }`. The second POST response should include `"deduplicated": true` and the count should not have moved.
**Why human:** Requires live Redis connection. Cannot verify SET NX behavior and the conditional branch without Redis executing the commands.

#### 2. Different IPs Both Increment

**Test:** `curl -X POST -H "x-forwarded-for: 1.2.3.4" http://localhost:3000/api/views/test-slug`, then `curl -X POST -H "x-forwarded-for: 5.6.7.8" http://localhost:3000/api/views/test-slug`, then GET.
**Expected:** GET returns `views: 2`. Two distinct IPs produce two distinct dedup keys (`dedup:test-slug:<hash-of-1.2.3.4>` and `dedup:test-slug:<hash-of-5.6.7.8>`), so both increment.
**Why human:** Requires live Redis to confirm distinct dedup keys are generated and both INCR calls execute.

### Gaps Summary

No gaps remain. All 5 truths verified. All 5 requirements satisfied. The single gap from initial verification (INFRA-04: unconditional INCR regardless of dedup status) was closed by commit 897040e, which replaced the pipeline approach with a two-step conditional structure that enforces deduplication at the server layer.

The phase goal is achieved: the view count API is independently testable via curl with GET and POST endpoints behaving correctly, IP-based deduplication with SHA-256 privacy enforced at the API layer, 24h TTL, and build-time cache prevention all confirmed by code review and TypeScript compilation.

---

_Verified: 2026-02-21T19:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — gap closure after 03-02-PLAN.md execution_
