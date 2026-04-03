# Phase 9: Security & Patches - Research

**Researched:** 2026-04-02
**Domain:** Next.js security hardening, API input validation, rate limiting, dependency patching
**Confidence:** HIGH

## Summary

Phase 9 hardens the keech.dev portfolio against known vulnerabilities across five areas: security headers via `next.config.ts`, MDX rendering error handling, npm dependency patches, API input validation, and rate limiting. The codebase is a statically-generated Next.js 16 site with two API routes for view counting via Upstash Redis -- making this a well-bounded hardening effort with no authentication system, no user-generated content, and no server-side sessions to complicate the picture.

The primary technical challenge is crafting a Content-Security-Policy that accommodates `unsafe-eval` (required by the `new Function()` MDX execution pattern) and Vercel Analytics' injected script (loaded from `va.vercel-scripts.com`). All other work items -- input validation, rate limiting with `@upstash/ratelimit`, MDX try-catch wrapping, and `npm audit fix` -- are straightforward applications of well-documented patterns.

**Primary recommendation:** Work through the items in dependency order: (1) `npm audit fix` first since it upgrades Next.js and eliminates known CVEs, (2) security headers since they are config-only, (3) API validation and rate limiting together since they modify the same files, (4) MDX error fallback, (5) validate-colors script fix as a trivial cleanup.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Security headers configured via `next.config.ts` `headers()` export -- not middleware, not vercel.json
- D-02: CSP strictness and enforcement mode at Claude's discretion
- D-03: All four required headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- D-04: Rate limit thresholds at Claude's discretion
- D-05: Whether to rate-limit GET endpoints at Claude's discretion
- D-06: Use `@upstash/ratelimit` with sliding window algorithm (new dependency)
- D-07: Branded error with nav -- full page layout preserved (header, footer), centered neobrutalist-styled message with link back to /blog. No technical details exposed.
- D-08: Error logging approach at Claude's discretion
- D-09: Maximum slug count for batch endpoint at Claude's discretion
- D-10: Slug parameters validated against `^[a-z0-9-]+$` regex pattern
- D-11: Invalid slugs return 400 error

### Claude's Discretion
CSP directive details and enforcement mode, rate limit numbers, GET endpoint rate limiting, batch slug limit, and error logging strategy.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Site serves CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy on all routes | Next.js `headers()` config with `source: '/(.*)'` catch-all pattern |
| SEC-02 | MDX rendering wrapped in try-catch with user-friendly fallback UI | Wrap `new Function()` + component call in try-catch inside `MDXContent` component |
| SEC-03 | All npm audit vulnerabilities resolved | `npm audit fix` resolves all 4 current vulnerabilities (next, flatted, picomatch, brace-expansion) |
| SEC-04 | View counter slug parameters validated against `^[a-z0-9-]+$` | Regex validation at top of GET/POST handlers, return 400 on mismatch |
| SEC-05 | Batch view endpoint enforces maximum slug count limit | Add count check after splitting slugs param in batch route |
| SEC-06 | View counter POST rate-limited via @upstash/ratelimit sliding window | `@upstash/ratelimit` 2.0.8 with `Ratelimit.slidingWindow()` sharing existing Redis client |
| CLN-01 | Dependencies updated to latest patch/minor versions | `npm audit fix` handles security-critical updates; manual `npm update` for remaining patch/minor bumps |
| CLN-03 | Color validation script palette matches actual globals.css values | Change `muted: '#666666'` to `muted: '#4A4A4A'` in `scripts/validate-colors.mjs` line 6 |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Current Version | Latest | Purpose | Notes |
|---------|----------------|--------|---------|-------|
| next | 16.1.6 | 16.2.2 | Framework | `npm audit fix` upgrades to 16.2.2, resolves CSRF + cache + smuggling CVEs |
| @upstash/redis | 1.36.2 | 1.37.0 | Redis client | Patch update available, non-breaking |

### New Dependency
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @upstash/ratelimit | 2.0.8 | Sliding window rate limiting | Official Upstash companion to @upstash/redis. Same REST-over-HTTP transport. Only dependency is `@upstash/core-analytics`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @upstash/ratelimit | Manual Redis INCR + EXPIRE | Hand-rolling misses edge cases (window boundaries, atomic operations). Library is 1 dependency, battle-tested. |
| next.config.ts headers() | Middleware | Middleware breaks static generation for pages. Config headers work with all rendering modes. User decision D-01 locks this. |

**Installation:**
```bash
npm install @upstash/ratelimit
```

**Version verification:** Confirmed via `npm view` on 2026-04-02:
- `@upstash/ratelimit`: 2.0.8
- `next` latest: 16.2.2
- `@upstash/redis` latest: 1.37.0

## Architecture Patterns

### Security Headers via next.config.ts

The `headers()` async function in `next.config.ts` returns an array of route-header mappings. The `source: '/(.*)'` pattern matches all routes.

```typescript
// Source: Next.js docs + web search verification
const nextConfig: NextConfig = {
  images: {
    qualities: [75, 80],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}
```

### CSP Directive Requirements

Based on what the site actually loads at runtime:

| Resource | CSP Directive | Required Value | Reason |
|----------|--------------|----------------|--------|
| Self-hosted JS bundles | `script-src` | `'self'` | Next.js bundles |
| MDX `new Function()` | `script-src` | `'unsafe-eval'` | Runtime code execution -- cannot be removed without rearchitecting MDX pipeline (deferred: DEP-03) |
| Vercel Analytics script | `script-src` | `https://va.vercel-scripts.com` | Analytics v1 injects script from this domain |
| Self-hosted CSS/fonts | `style-src` | `'self'` | Tailwind CSS output, font declarations |
| Inline styles (Tailwind) | `style-src` | `'unsafe-inline'` | Tailwind v4 may inject inline styles via PostCSS |
| Self-hosted images | `img-src` | `'self'` | Next.js Image component, static assets |
| Image data URIs | `img-src` | `data:` | Next.js Image blur placeholders use data URIs |
| Upstash Redis REST | `connect-src` | `'self'` | API routes run server-side, not browser-side -- no connect-src needed for Upstash |
| Vercel Analytics beacon | `connect-src` | `https://va.vercel-scripts.com` | Analytics sends data back to this domain |
| Self origin frames | `frame-ancestors` | `'none'` | Prevent clickjacking (complements X-Frame-Options) |

**Recommended CSP (enforcement mode):**
```
default-src 'self'; script-src 'self' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://va.vercel-scripts.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

**Key trade-off:** `unsafe-eval` is required and accepted per project scope. Removal is tracked as future requirement DEP-03.

### Rate Limiting Pattern

```typescript
// Source: @upstash/ratelimit GitHub README
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'ratelimit:views',
})

// In POST handler:
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
const { success } = await ratelimit.limit(ip)
if (!success) {
  return Response.json({ error: 'Too many requests' }, { status: 429 })
}
```

**Recommended thresholds:** 10 requests per 60 seconds per IP for POST. This is generous for a personal blog (a real visitor triggers 1 POST per page load), but catches automated hammering. The sliding window smooths burst edges.

**GET endpoints:** Skip rate limiting. Read-only endpoints hitting Redis are cheap, and the blog listing page legitimately fetches on every navigation. Rate limiting GETs adds complexity with minimal security benefit for a personal blog.

### Input Validation Pattern

```typescript
const SLUG_PATTERN = /^[a-z0-9-]+$/

function validateSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && slug.length <= 100
}

// In handler:
if (!validateSlug(slug)) {
  return Response.json({ error: 'Invalid slug' }, { status: 400 })
}
```

**Batch endpoint:** Validate each slug individually AND cap the array length. Recommended limit: 20 slugs (current content is 5 posts, leaves room for 4x growth without code changes).

### MDX Error Fallback Pattern

The `MDXContent` component wraps `new Function()` and component rendering. The fallback should be a server component-compatible error state within the existing page layout (header/footer preserved by the page layout, not the component).

```typescript
// Wrap in try-catch, return fallback JSX on error
export function MDXContent({ code, components = {} }: MDXContentProps) {
  try {
    const Component = useMDXComponent(code)
    return <Component components={{ ...defaultComponents, ...components }} />
  } catch (error) {
    console.error('[mdx] Failed to render content:', error)
    return (
      <div className="border-[3px] border-foreground bg-surface p-8 shadow-brutal text-center">
        <h2 className="font-display text-2xl mb-4">This post couldn't be displayed</h2>
        <p className="text-muted mb-6">Something went wrong rendering this content.</p>
        <a href="/blog" className="...neobrutalist link styles...">Back to Blog</a>
      </div>
    )
  }
}
```

**Logging:** `console.error` with `[mdx]` prefix -- consistent with existing `[views]` pattern. The error object is logged server-side only (no technical details in the UI per D-07).

### Anti-Patterns to Avoid
- **CSP via `<meta>` tag:** Does not support `frame-ancestors` or `report-uri`. HTTP header is strictly better.
- **Nonce-based CSP with static generation:** Nonces require per-request generation in middleware. Incompatible with `generateStaticParams()` pages. Explicitly out of scope.
- **Rate limiting in middleware:** Would apply to all routes including static assets. Overkill. Apply in the specific API route handler only.
- **Validating slugs against `generateStaticParams()`:** Adds a Velite import dependency to API routes. Regex validation is sufficient -- a slug that passes regex but has no views simply returns 0.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sliding window rate limiting | Manual Redis INCR + EXPIRE with window math | `@upstash/ratelimit` | Atomic operations across window boundaries are tricky. Library handles Lua scripting internally. |
| CSP header construction | String concatenation of directives | Template literal with clear directive-per-line formatting | CSP strings are error-prone. Format for readability but no library needed for static CSP. |

## Common Pitfalls

### Pitfall 1: CSP Blocks Vercel Analytics
**What goes wrong:** Deploying CSP without allowlisting `va.vercel-scripts.com` silently breaks analytics -- no console errors visible to visitors, just missing data.
**Why it happens:** Vercel Analytics injects a script from an external domain. Easy to miss if you only test locally (analytics doesn't load locally).
**How to avoid:** Include `https://va.vercel-scripts.com` in both `script-src` and `connect-src`. Test on Vercel preview deployment, not just local dev.
**Warning signs:** Analytics dashboard shows zero traffic after deploy.

### Pitfall 2: CSP Breaks MDX Code Highlighting
**What goes wrong:** Shiki/rehype-pretty-code generates inline styles on code blocks. A CSP without `unsafe-inline` in `style-src` strips all syntax highlighting.
**Why it happens:** rehype-pretty-code applies `style="color: ..."` attributes to `<span>` elements inside code blocks.
**How to avoid:** Include `'unsafe-inline'` in `style-src`. This is standard for sites using CSS-in-JS or code highlighters.
**Warning signs:** Code blocks render as monochrome text.

### Pitfall 3: Rate Limiter Created Inside Handler
**What goes wrong:** Creating a new `Ratelimit` instance on every request defeats the internal caching optimization.
**Why it happens:** Natural instinct to keep instances local to functions.
**How to avoid:** Declare the `Ratelimit` instance at module scope (outside the handler function). The instance caches rate limit state as long as the serverless function is warm.
**Warning signs:** Higher Redis command count than expected in Upstash dashboard.

### Pitfall 4: npm audit fix Introduces Breaking Changes
**What goes wrong:** `npm audit fix` upgrades Next.js from 16.1.6 to 16.2.2. If this is a minor version with breaking changes to page routing or build output, the site could break.
**Why it happens:** Semver minor versions can introduce new features with subtle behavior changes.
**How to avoid:** Run `npm audit fix`, then immediately `npm run build` to verify the site builds. Check the Next.js 16.2 changelog for any App Router breaking changes.
**Warning signs:** Build errors or runtime routing changes after upgrade.

### Pitfall 5: MDX Try-Catch Doesn't Catch Render Errors
**What goes wrong:** The `new Function()` call succeeds but the returned component throws during React rendering. A try-catch around `new Function()` alone won't catch this.
**Why it happens:** React component rendering is asynchronous from the perspective of try-catch. However, since `MDXContent` is a client component calling `Component` synchronously in JSX return, the try-catch must wrap both the function creation AND the component call.
**How to avoid:** The try-catch must encompass the entire function body including the JSX return. For render-time errors in the MDX output, a React error boundary at the blog post page level (Phase 10 ERR-03) provides the second safety net.
**Warning signs:** White screen on a post with broken MDX despite having the try-catch.

## Code Examples

### Security Headers in next.config.ts
```typescript
// File: next.config.ts
import type { NextConfig } from 'next'

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://va.vercel-scripts.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 80],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
```

### Slug Validation Helper
```typescript
// Shared validation utility for API routes
const SLUG_PATTERN = /^[a-z0-9-]+$/
const MAX_SLUG_LENGTH = 100
const MAX_BATCH_SLUGS = 20

export function validateSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug)
}

export function validateSlugs(slugs: string[]): { valid: boolean; error?: string } {
  if (slugs.length > MAX_BATCH_SLUGS) {
    return { valid: false, error: `Maximum ${MAX_BATCH_SLUGS} slugs per request` }
  }
  const invalid = slugs.find(s => !validateSlug(s))
  if (invalid) {
    return { valid: false, error: 'Invalid slug parameter' }
  }
  return { valid: true }
}
```

### Rate Limiter Setup
```typescript
// File: src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

export const viewsRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'ratelimit:views',
})
```

### MDX Content with Error Handling
```typescript
// File: src/components/blog/mdx-content.tsx
export function MDXContent({ code, components = {} }: MDXContentProps) {
  try {
    const Component = useMDXComponent(code)
    return <Component components={{ ...defaultComponents, ...components }} />
  } catch (error) {
    console.error('[mdx] Failed to render content:', error)
    return <MDXFallback />
  }
}

function MDXFallback() {
  return (
    <div className="border-[3px] border-foreground bg-surface p-8 shadow-brutal text-center my-8">
      <h2 className="font-display text-2xl mb-4">This post couldn&apos;t be displayed</h2>
      <p className="text-muted mb-6">Something went wrong while rendering this content.</p>
      <a
        href="/blog"
        className="inline-block border-[3px] border-foreground bg-accent text-white px-6 py-2 font-semibold shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        Back to Blog
      </a>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSP via `<meta>` tag | CSP via HTTP header | Long-standing best practice | HTTP header supports `frame-ancestors`, loads before HTML parsing |
| Manual Redis rate limiting | `@upstash/ratelimit` library | Library available since 2022 | Handles atomic window operations, caching, analytics |
| Nonce-based CSP | Static CSP with `unsafe-eval` | N/A for this project | Nonces incompatible with static generation; static CSP is the correct approach here |

**Deprecated/outdated:**
- `X-XSS-Protection`: Removed from modern browsers. Do not add -- it can introduce vulnerabilities in older browsers.
- `Expect-CT`: Deprecated. Certificate Transparency is now enforced by default.

## Open Questions

1. **Vercel Analytics connect-src exact domain**
   - What we know: The script loads from `va.vercel-scripts.com` and likely beacons back to the same domain
   - What's unclear: Whether `vitals.vercel-insights.com` or another domain is also needed for v1 analytics
   - Recommendation: Deploy with `https://va.vercel-scripts.com` in both script-src and connect-src. If analytics breaks on preview deploy, check browser console for blocked connect-src requests and add the domain.

2. **Next.js 16.2 changelog impact**
   - What we know: `npm audit fix` upgrades from 16.1.6 to 16.2.2, resolving 5 CVEs
   - What's unclear: Whether 16.2 introduces any App Router behavior changes
   - Recommendation: Run `npm run build` immediately after `npm audit fix`. If build passes, the upgrade is safe.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + runtime | Assumed (existing project builds) | -- | -- |
| npm | Package management | Assumed | -- | -- |
| Upstash Redis | Rate limiting + views | Existing (env vars configured) | -- | -- |

No new external dependencies beyond the `@upstash/ratelimit` npm package. All work modifies existing files or adds config to `next.config.ts`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (TEST-01 is Phase 12) |
| Config file | none -- see Wave 0 |
| Quick run command | `npm run build` (validates compilation) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | Security headers on all responses | manual | Deploy to preview, `curl -I` to check headers | N/A |
| SEC-02 | MDX fallback renders on error | manual | Temporarily break MDX code, verify fallback renders | N/A |
| SEC-03 | Zero npm audit vulnerabilities | smoke | `npm audit` | N/A |
| SEC-04 | Invalid slug returns 400 | manual | `curl -X POST /api/views/"><script>` returns 400 | N/A |
| SEC-05 | Batch slug count capped | manual | `curl /api/views?slugs=a,b,c,...(21 slugs)` returns 400 | N/A |
| SEC-06 | Rate limiting rejects after threshold | manual | Rapid-fire `curl -X POST` 11+ times in 60s | N/A |
| CLN-01 | Dependencies updated | smoke | `npm audit` reports 0 vulnerabilities | N/A |
| CLN-03 | Color script fixed | smoke | `node scripts/validate-colors.mjs` runs with correct values | N/A |

### Sampling Rate
- **Per task commit:** `npm run build && npm run lint`
- **Per wave merge:** Full build + lint + `npm audit`
- **Phase gate:** Full build green, `npm audit` clean, manual header verification via `curl -I`

### Wave 0 Gaps
- No test framework exists (by design -- testing is Phase 12)
- All validation for this phase is build verification + manual curl commands
- The build itself serves as a smoke test: if CSP headers are malformed or code changes break compilation, `npm run build` fails

## Sources

### Primary (HIGH confidence)
- Project source files: `next.config.ts`, `src/components/blog/mdx-content.tsx`, `src/app/api/views/[slug]/route.ts`, `src/app/api/views/route.ts` -- direct code inspection
- `npm audit` output -- verified 4 vulnerabilities, all fixable via `npm audit fix`
- `npm view` version checks -- @upstash/ratelimit 2.0.8, next 16.2.2, @upstash/redis 1.37.0
- [Upstash ratelimit-js GitHub](https://github.com/upstash/ratelimit-js) -- API shape, sliding window usage

### Secondary (MEDIUM confidence)
- [Vercel Security Headers docs](https://vercel.com/docs/headers/security-headers) -- CSP best practices
- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) -- headers() pattern with `source: '/(.*)'`
- [Upstash rate limiting blog](https://upstash.com/blog/nextjs-ratelimiting) -- Next.js integration patterns
- Web search results for `va.vercel-scripts.com` CSP domain -- Vercel Analytics script-src requirement

### Tertiary (LOW confidence)
- Vercel Analytics exact connect-src domains -- needs verification on preview deploy

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries verified via npm registry, existing @upstash/redis already in use
- Architecture: HIGH - next.config.ts headers() is documented Next.js API, rate limiting follows official Upstash patterns
- Pitfalls: HIGH - based on direct code inspection of CSP requirements (Shiki inline styles, Vercel Analytics external script, MDX unsafe-eval)
- CSP directives: MEDIUM - Vercel Analytics domains need verification on preview deploy

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (30 days -- stable domain, no fast-moving dependencies)
