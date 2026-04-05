# Phase 15: Middleware Infrastructure - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Move all security headers from `next.config.ts` `headers()` function into a new `src/middleware.ts` file. Pure refactor — no header values change, no new capabilities added. The CSP policy itself is modified in Phase 16 (unsafe-eval removal), not here.

</domain>

<decisions>
## Implementation Decisions

### Route matching
- **D-01:** Use Next.js `config.matcher` export to exclude static assets (`_next/static`, `_next/image`, `favicon.ico`) from middleware execution. All other routes get security headers.

### CSP directive preservation
- **D-02:** CSP directives must be byte-for-byte identical to current `next.config.ts` values. This is a refactor — no policy changes. Phase 16 handles `unsafe-eval` removal.

### Middleware structure
- **D-03:** Single `middleware()` function using `NextResponse.next()` with headers set via `response.headers.set()`. No abstraction layers, no helper functions — the file should be self-contained and obvious.

### next.config.ts cleanup
- **D-04:** Remove the entire `async headers()` function and the `cspHeader` const from `next.config.ts`. Only `images` config remains. Verify no duplication by checking only one CSP header appears per response.

### Claude's Discretion
- Exact matcher pattern syntax (array of path patterns vs single regex)
- Whether to define CSP directives as an array joined by `'; '` (current pattern) or as a single string
- Import style for Next.js middleware types

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current implementation
- `next.config.ts` — Current location of all security headers (lines 3–31); the source of truth for header values that must be preserved exactly
- `src/app/globals.css` — CSS-first config; no middleware interaction but confirms no inline style injection

### Concerns documentation
- `.planning/codebase/CONCERNS.md` — Documents the motivation for middleware migration (headers() in next.config.ts is config-level, middleware gives per-request control)

### Requirements
- `.planning/REQUIREMENTS.md` §Middleware — MID-01, MID-02, MID-03 define the three acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No `src/middleware.ts` exists — this is a new file
- `next.config.ts` CSP construction pattern (array of directives joined by `'; '`) is clean and worth preserving in the new location

### Established Patterns
- Next.js 16 App Router project with Turbopack
- Security headers already proven working via `next.config.ts` — E2E tests validate they're present
- API routes at `src/app/api/views/` use rate limiting via `@upstash/ratelimit` — middleware should not interfere with these

### Integration Points
- `next.config.ts` — remove `headers()` function and `cspHeader` const
- `src/middleware.ts` — new file, Next.js auto-discovers middleware at this path
- E2E tests — existing tests verify security headers are present; they should pass unchanged after migration
- Vercel deployment — middleware runs at the edge by default on Vercel

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a mechanical move of headers from config to middleware. The existing CSP directives and header values are the specification.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-middleware-infrastructure*
*Context gathered: 2026-04-03*
