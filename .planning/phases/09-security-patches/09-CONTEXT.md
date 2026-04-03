# Phase 9: Security & Patches - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden all attack surfaces and patch known vulnerabilities. This phase delivers: security headers on every response, MDX rendering wrapped in try-catch with branded fallback, npm audit clean, API input validation and rate limiting, dependency patch updates, and color validation script fix.

Requirements covered: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, CLN-01, CLN-03.

</domain>

<decisions>
## Implementation Decisions

### CSP Policy Scope
- **D-01:** Security headers configured via `next.config.ts` `headers()` export — not middleware, not vercel.json
- **D-02:** CSP strictness and enforcement mode at Claude's discretion — pick the right balance based on what the codebase actually loads (Google Fonts via next/font self-hosting, Upstash REST API, Vercel Analytics, `unsafe-eval` for MDX `new Function()`)
- **D-03:** All four required headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

### Rate Limiting
- **D-04:** Rate limit thresholds at Claude's discretion — pick sensible window and limit for a personal blog's view counter POST endpoint
- **D-05:** Whether to rate-limit GET endpoints at Claude's discretion — weigh complexity vs. risk for read-only endpoints
- **D-06:** Use `@upstash/ratelimit` with sliding window algorithm (new dependency)

### MDX Error Fallback
- **D-07:** Branded error with nav — full page layout preserved (header, footer), centered neobrutalist-styled message "This post couldn't be displayed" with a link back to /blog. No technical details exposed to visitors.
- **D-08:** Error logging approach at Claude's discretion — balance debuggability vs. information exposure

### Batch Endpoint Limits
- **D-09:** Maximum slug count for GET `/api/views?slugs=` at Claude's discretion — pick a sensible cap given current content volume (5 posts) and future growth

### API Input Validation
- **D-10:** Slug parameters validated against `^[a-z0-9-]+$` regex pattern per SEC-04
- **D-11:** Invalid slugs return 400 error

### Claude's Discretion
Claude has flexibility on: CSP directive details and enforcement mode, rate limit numbers, GET endpoint rate limiting, batch slug limit, and error logging strategy. These are implementation details where the right answer depends on what the codebase actually needs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security Concerns
- `.planning/codebase/CONCERNS.md` — Full audit of all security, quality, and performance concerns. Critical and moderate severity sections detail exact files, line numbers, and fix approaches for every issue in this phase.

### API Integration
- `.planning/codebase/INTEGRATIONS.md` — Redis client setup, API route structure, key schema, IP dedup flow, environment variables. Essential context for rate limiting and input validation work.

### Current Config
- `next.config.ts` — Currently minimal (images only). Security headers will be added here via `headers()` export.

### MDX Execution
- `src/components/blog/mdx-content.tsx` — The `new Function(code)` call that needs try-catch wrapping. Line 13.

### API Routes
- `src/app/api/views/[slug]/route.ts` — Single slug GET/POST handlers. Needs slug validation, rate limiting on POST.
- `src/app/api/views/route.ts` — Batch GET handler. Needs slug validation and count limit.

### Requirements
- `.planning/REQUIREMENTS.md` — SEC-01 through SEC-06, CLN-01, CLN-03 acceptance criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/redis.ts` — Redis client singleton via `Redis.fromEnv()`. Rate limiter can share this client.
- `src/lib/utils.ts` — `cn()` utility for combining Tailwind classes. Use for MDX fallback styling.
- Neobrutalist design tokens in `src/app/globals.css` — `--shadow-brutal`, `--border-brutal` for consistent fallback UI.

### Established Patterns
- API routes use `export const dynamic = 'force-dynamic'` and try-catch with `console.error('[views]')` prefix
- Error responses return `Response.json({ error: '...' }, { status: 500 })` — extend this pattern for 400/429
- Client components use `'use client'` directive only where needed
- All view counter failures are non-critical and fail silently on client side

### Integration Points
- `next.config.ts` — Add `headers()` async function alongside existing `images` config
- `src/components/blog/mdx-content.tsx` — Wrap `new Function()` + component rendering in try-catch
- `src/app/api/views/[slug]/route.ts` — Add slug validation and rate limiting to POST handler
- `src/app/api/views/route.ts` — Add slug validation and batch size limit
- `scripts/validate-colors.mjs` — Fix muted color hex value to match globals.css `#4A4A4A`
- `package.json` / `package-lock.json` — npm audit fix + patch/minor dependency updates

</code_context>

<specifics>
## Specific Ideas

- MDX fallback must use the branded neobrutalist style (bold borders, hard shadows) to feel like part of the site, not a generic error page
- The fallback includes a "Back to Blog" link, not just a dead-end message

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-security-patches*
*Context gathered: 2026-04-02*
