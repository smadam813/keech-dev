# Phase 15: Middleware Infrastructure - Research

**Researched:** 2026-04-03
**Domain:** Next.js 16 proxy/middleware, security headers
**Confidence:** HIGH

## Summary

Phase 15 moves security headers from the `next.config.ts` `headers()` function into a dedicated request-interception file. The implementation is a mechanical refactor -- header values remain byte-for-byte identical.

**Critical discovery:** Next.js 16 has deprecated `middleware.ts` in favor of `proxy.ts`. The file convention is renamed, the exported function is renamed from `middleware` to `proxy`, and the runtime is Node.js (not Edge). The CONTEXT.md refers to `src/middleware.ts` because this was the established convention prior to Next.js 16, but the correct file for this project (Next.js 16.2.2) is `src/proxy.ts` with an exported `proxy` function. Using the deprecated `middleware.ts` still works but will be removed in a future version.

**Primary recommendation:** Create `src/proxy.ts` (not `src/middleware.ts`) using the `proxy` function convention, with `NextResponse.next()` and `response.headers.set()` for each security header. Use `config.matcher` with a negative lookahead regex to exclude static assets.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Next.js `config.matcher` export to exclude static assets (`_next/static`, `_next/image`, `favicon.ico`) from middleware execution. All other routes get security headers.
- **D-02:** CSP directives must be byte-for-byte identical to current `next.config.ts` values. This is a refactor -- no policy changes. Phase 16 handles `unsafe-eval` removal.
- **D-03:** Single `proxy()` function using `NextResponse.next()` with headers set via `response.headers.set()`. No abstraction layers, no helper functions -- the file should be self-contained and obvious.
- **D-04:** Remove the entire `async headers()` function and the `cspHeader` const from `next.config.ts`. Only `images` config remains. Verify no duplication by checking only one CSP header appears per response.

### Claude's Discretion
- Exact matcher pattern syntax (array of path patterns vs single regex)
- Whether to define CSP directives as an array joined by `'; '` (current pattern) or as a single string
- Import style for Next.js proxy types

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MID-01 | All security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) served from src/proxy.ts | proxy.ts API verified -- use `response.headers.set()` on `NextResponse.next()` return value |
| MID-02 | headers() function removed from next.config.ts | Straightforward deletion; only `images` config remains |
| MID-03 | Single Content-Security-Policy header per response (no duplication) | Verified: when headers() is removed from next.config.ts and proxy.ts sets the header, only one CSP header will appear |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Test commands:** `npm run test` (Vitest), `npm run test:e2e` (Playwright), `npm run lint` (ESLint)
- **Build command:** `npm run build` (velite && next build)
- **No CI/CD** -- deployment is git-push to Vercel
- **Path alias:** `@/*` maps to `./src/*`
- **Error boundaries** use plain `<a>` tags intentionally (not next/link)
- **Security headers currently defined** in `next.config.ts` lines 3-31
- **Existing unit test** at `src/lib/security-headers.test.ts` tests the `next.config.ts` headers() function directly -- this test must be rewritten for the new proxy.ts pattern

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.2 | Framework -- proxy.ts file convention | Already installed; proxy.ts is the Next.js 16 standard |
| next/server | (bundled) | `NextRequest`, `NextResponse` types | Official API for request interception |

### Supporting
No additional libraries needed. This phase uses only built-in Next.js APIs.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `proxy.ts` (recommended) | `middleware.ts` (deprecated) | middleware.ts still works in 16.2.2 but is deprecated and will be removed. Use proxy.ts for forward-compatibility. |

## Architecture Patterns

### File Location
```
src/
  proxy.ts          # NEW -- security headers (auto-discovered by Next.js)
next.config.ts      # MODIFIED -- headers() function removed
```

### Pattern: proxy.ts with Security Headers

**What:** A single `proxy.ts` file at the project root's `src/` directory that intercepts all non-static requests and appends security headers to the response.

**When to use:** When security headers need to be applied uniformly across all routes.

**Important naming change:** Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function from `middleware` to `proxy`. The CONTEXT.md references `middleware.ts` because this decision was made before the rename was identified. The implementation MUST use `proxy.ts` to follow the current Next.js 16 convention.

**Example:**
```typescript
// src/proxy.ts
// Source: Next.js 16 docs (https://nextjs.org/blog/next-16#proxyts-formerly-middlewarets)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://va.vercel-scripts.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

export default function proxy(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Pattern: Cleaned next.config.ts

**What:** After removing headers(), only the images config remains.

**Example:**
```typescript
// next.config.ts (after cleanup)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 80],
  },
};

export default nextConfig;
```

### Anti-Patterns to Avoid
- **Using both proxy.ts AND next.config.ts headers():** This causes duplicate headers. The whole point of this phase is to have ONE source of truth.
- **Creating middleware.ts instead of proxy.ts:** Deprecated in Next.js 16. Will work but generates deprecation warnings and will be removed in a future version.
- **Adding abstraction layers:** D-03 explicitly says no helper functions. The file should be self-contained and obvious.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request interception | Custom server or express middleware | `proxy.ts` | Built-in Next.js convention, auto-discovered, works on Vercel Edge |
| Response header manipulation | Manual response wrapping | `NextResponse.next()` + `.headers.set()` | Standard API, handles cloning correctly |
| Route exclusion | Conditional checks inside proxy function | `config.matcher` with negative lookahead | Static analysis at build time, more performant |

## Common Pitfalls

### Pitfall 1: Duplicate CSP Headers
**What goes wrong:** Both proxy.ts and next.config.ts set CSP, resulting in two Content-Security-Policy headers per response. Browsers may reject the stricter of the two or behave unpredictably.
**Why it happens:** Forgetting to remove `headers()` from next.config.ts after adding proxy.ts.
**How to avoid:** MID-02 explicitly requires removing the headers() function. Verify with browser DevTools or `curl -I` that only one CSP header appears.
**Warning signs:** Two CSP headers visible in Network tab response headers.

### Pitfall 2: Using middleware.ts Instead of proxy.ts
**What goes wrong:** Code works but uses deprecated API. Future Next.js upgrades will break.
**Why it happens:** Most existing tutorials and Stack Overflow answers reference middleware.ts. The rename happened in Next.js 16 (October 2025).
**How to avoid:** Use `proxy.ts` with `export default function proxy()`. The codemod is `npx @next/codemod@canary middleware-to-proxy .` if needed.
**Warning signs:** Deprecation warning in Next.js console output.

### Pitfall 3: Missing config.matcher Causes Performance Issues
**What goes wrong:** Without a matcher, proxy runs on every request including static files, images, fonts, and JS bundles. This inflates Edge function invocations on Vercel and adds latency.
**Why it happens:** config.matcher is optional -- proxy works without it but runs on everything.
**How to avoid:** Always export a `config` with `matcher` that excludes `_next/static`, `_next/image`, and `favicon.ico`.
**Warning signs:** Unexpectedly high Vercel Edge function usage.

### Pitfall 4: Existing Unit Test Breaks
**What goes wrong:** `src/lib/security-headers.test.ts` imports `nextConfig.headers` and calls it directly. After removing headers() from next.config.ts, this test will fail.
**Why it happens:** The test was written to validate the config-based approach.
**How to avoid:** Rewrite the test to import from proxy.ts and validate the headers are set correctly, OR delete the unit test and rely on E2E verification (the headers are ultimately verified by browser/curl).
**Warning signs:** `npm run test` fails after removing headers() from next.config.ts.

### Pitfall 5: API Routes Interference
**What goes wrong:** Proxy adds security headers to API routes, which may conflict with API-specific headers or CORS.
**Why it happens:** The matcher pattern matches API routes too.
**How to avoid:** This is actually fine for this project -- the current `headers()` in next.config.ts uses `/(.*)`which also matches API routes. The proxy matcher should maintain the same behavior. The existing rate-limiting on API routes is handled inside the route handlers, not in headers config.
**Warning signs:** None expected -- maintaining existing behavior.

## Code Examples

### Current Header Values (Source of Truth)
```typescript
// From next.config.ts lines 3-13 -- these values MUST be preserved exactly
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://va.vercel-scripts.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// Headers applied (lines 24-27):
// Content-Security-Policy: [cspHeader above]
// X-Frame-Options: DENY
// X-Content-Type-Options: nosniff
// Referrer-Policy: strict-origin-when-cross-origin
```

### Recommended Matcher Pattern
```typescript
// Single negative lookahead regex -- clean and standard
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

This matches D-01's requirement to exclude `_next/static`, `_next/image`, and `favicon.ico`. All other routes (including `/api/*`) receive security headers, matching the current `/(.*)`behavior.

### Verifying No Duplication (curl)
```bash
# After implementation, verify only one CSP header:
curl -s -I http://localhost:3000 | grep -i content-security-policy
# Should show exactly ONE line
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `middleware()` export | `proxy.ts` with `proxy()` export | Next.js 16 (Oct 2025) | File and function renamed; Node.js runtime (not Edge) |
| `next.config.ts headers()` for static headers | `proxy.ts` for all headers | Next.js 12+ (middleware available) | Per-request control, no config-level limitations |

**Deprecated/outdated:**
- `middleware.ts`: Deprecated in Next.js 16, will be removed in a future version. Still functional in 16.2.2.
- `skipMiddlewareUrlNormalize`: Renamed to `skipProxyUrlNormalize` in Next.js 16.

## Discretion Recommendations

These are areas where CONTEXT.md gave Claude discretion:

### Matcher syntax: Single negative lookahead regex (RECOMMENDED)
Use a single regex string in an array: `['/((?!_next/static|_next/image|favicon.ico).*)']`. This is the pattern shown in Next.js official docs and is the most common approach. An array of individual path patterns would require listing every route explicitly, which is fragile.

### CSP definition style: Array joined by `'; '` (RECOMMENDED)
Preserve the current array-of-directives pattern from next.config.ts. It is more readable than a single long string and makes Phase 16's `unsafe-eval` removal a clean single-line deletion.

### Import style: Named imports from `next/server` (RECOMMENDED)
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
```
This follows the pattern shown in Next.js official documentation. Type-only import for `NextRequest` since it is only used in the function signature.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Playwright |
| Config file | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test && npm run test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MID-01 | Security headers served from proxy.ts | unit | `npx vitest run src/lib/security-headers.test.ts` | Exists but must be rewritten |
| MID-02 | headers() removed from next.config.ts | unit | `npx vitest run src/lib/security-headers.test.ts` | Exists but must be rewritten |
| MID-03 | Single CSP header per response | manual | `curl -s -I http://localhost:3000 \| grep -ci content-security-policy` returns 1 | N/A -- manual verification or E2E |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run build`
- **Phase gate:** Full suite green including `npm run test:e2e` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/security-headers.test.ts` -- must be rewritten to test proxy.ts instead of next.config.ts headers()
- [ ] Consider adding a test that imports proxy.ts and verifies all four headers are set on the response

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- Confirms proxy.ts replaces middleware.ts, deprecation notice, API examples
- [Renaming Middleware to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy) -- Official migration guide, codemod command
- `next.config.ts` (local file) -- Current header values that must be preserved

### Secondary (MEDIUM confidence)
- [Next.js proxy.ts file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) -- Referenced but page did not render via WebFetch; confirmed API via blog post and search results
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) -- Referenced for header-setting patterns
- [Clerk: Skip Middleware for Static Files](https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files) -- Matcher pattern verification

### Tertiary (LOW confidence)
None -- all findings verified with official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using only built-in Next.js APIs, verified against 16.2.2
- Architecture: HIGH -- simple file creation + config cleanup, well-documented pattern
- Pitfalls: HIGH -- identified from direct code analysis (existing test, config duplication risk)
- proxy.ts vs middleware.ts: HIGH -- confirmed by official Next.js 16 blog post and migration docs

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- Next.js 16 is released, proxy.ts convention is established)
