# Phase 3: Infrastructure & API - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

A standalone view count API backed by Upstash Redis. POST increments and returns count, GET returns count without incrementing. IP-based deduplication with SHA-256 hashing and 24h TTL. Testable independently via curl before any UI work. Route handlers use force-dynamic to prevent build-time caching.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The user wants Claude to make all technical decisions for this infrastructure phase, guided by the requirements (INFRA-01 through INFRA-05) and success criteria defined in the roadmap.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-infrastructure-api*
*Context gathered: 2026-02-21*
