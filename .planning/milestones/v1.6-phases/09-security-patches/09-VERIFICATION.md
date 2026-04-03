---
phase: 09-security-patches
verified: 2026-04-02T00:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Confirm security headers are served on live responses"
    expected: "curl -I https://keech.dev/ returns Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers"
    why_human: "Headers are configured at the Next.js layer — cannot hit a live server in this environment to confirm they appear in actual HTTP responses"
  - test: "Confirm MDX fallback renders correctly in browser"
    expected: "A post with deliberately broken MDX code shows the neobrutalist fallback card with 'This post couldn't be displayed' and 'Back to Blog' link — no white screen"
    why_human: "Client-side rendering behavior requires a browser; can only verify the try-catch structure exists, not that the fallback visually renders as intended"
---

# Phase 9: Security & Patches Verification Report

**Phase Goal:** Harden all attack surfaces and patch known vulnerabilities
**Verified:** 2026-04-02
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every page response includes Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers | ✓ VERIFIED | `next.config.ts` exports `async headers()` with `source: '/(.*)'` catch-all and all four headers present |
| 2 | A blog post with malformed MDX renders a branded fallback message instead of a white screen | ✓ VERIFIED | `mdx-content.tsx` has try-catch wrapping both `new Function()` and `<Component>` render; `MDXFallback()` component present with neobrutalist styling |
| 3 | `npm audit` reports zero vulnerabilities | ✓ VERIFIED | `npm audit` output: "found 0 vulnerabilities"; Next.js resolved at 16.2.2 in lock file |
| 4 | Hitting the view counter API with an invalid slug returns a 400 error | ✓ VERIFIED | Both GET and POST in `views/[slug]/route.ts` call `validateSlug()` and return `{ error: 'Invalid slug' }` with `status: 400` |
| 5 | Batch view endpoint rejects requests with more than 20 slugs | ✓ VERIFIED | `views/route.ts` calls `validateSlugs(slugs)` which enforces `MAX_BATCH_SLUGS = 20`; returns 400 on excess |
| 6 | Rapid-fire POST requests to the view counter are rejected after 10 requests per 60 seconds | ✓ VERIFIED | POST handler calls `viewsRateLimit.limit(ip)` using `slidingWindow(10, '60 s')`; returns `status: 429` on failure |
| 7 | Color validation script uses correct muted hex from globals.css | ✓ VERIFIED | `scripts/validate-colors.mjs` line 6: `muted: '#4A4A4A'`; script executes cleanly (`node scripts/validate-colors.mjs` exits 0) |
| 8 | `@upstash/ratelimit` is installed and available | ✓ VERIFIED | `package.json` lists `"@upstash/ratelimit": "^2.0.8"` in dependencies |
| 9 | CLN-01: Dependencies updated to latest patch/minor versions | ✓ VERIFIED | `npm audit` shows 0 vulnerabilities; Next.js bumped from 16.1.6 to 16.2.2 in lock file |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Purpose | Status | Details |
|----------|---------|--------|---------|
| `next.config.ts` | Security headers via `headers()` export | ✓ VERIFIED | All four headers present; `source: '/(.*)'` applies to all routes; CSP includes `unsafe-eval`, `va.vercel-scripts.com`, `unsafe-inline` |
| `scripts/validate-colors.mjs` | Corrected muted color hex | ✓ VERIFIED | Contains `muted: '#4A4A4A'`; does not contain `#666666`; runs without error |
| `src/lib/validation.ts` | Slug validation utilities | ✓ VERIFIED | Exports `validateSlug` and `validateSlugs`; pattern `^[a-z0-9-]+$`; `MAX_BATCH_SLUGS = 20`; `MAX_SLUG_LENGTH = 100` |
| `src/lib/rate-limit.ts` | Rate limiter instance | ✓ VERIFIED | Exports `viewsRateLimit`; `slidingWindow(10, '60 s')`; `prefix: 'ratelimit:views'`; imports from `@/lib/redis` |
| `src/components/blog/mdx-content.tsx` | MDX error boundary with branded fallback | ✓ VERIFIED | `try { ... } catch (error)` wraps both `useMDXComponent(code)` and `<Component>`; `MDXFallback()` present; "This post couldn't be displayed" message; `href="/blog"` link; uses `shadow-brutal`, `border-foreground`, `bg-accent` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `next.config.ts` | All HTTP responses | `async headers()` with `source: '/(.*)'` | ✓ WIRED | Function is exported as part of `nextConfig`; catch-all source pattern confirmed |
| `src/app/api/views/[slug]/route.ts` | `src/lib/rate-limit.ts` | `import { viewsRateLimit }` | ✓ WIRED | Import on line 3; `viewsRateLimit.limit(ip)` called in POST handler before dedup logic |
| `src/app/api/views/[slug]/route.ts` | `src/lib/validation.ts` | `import { validateSlug }` | ✓ WIRED | Import on line 2; called in both GET (line 18) and POST (line 40) handlers |
| `src/app/api/views/route.ts` | `src/lib/validation.ts` | `import { validateSlugs }` | ✓ WIRED | Import on line 2; `validateSlugs(slugs)` called after empty check (line 15) |
| `src/components/blog/mdx-content.tsx` | Fallback UI | `try-catch` around `new Function()` + component render | ✓ WIRED | `useMDXComponent(code)` and `<Component>` both inside try block; `MDXFallback` returned on catch |

---

### Data-Flow Trace (Level 4)

Not applicable to this phase. Phase 9 produces utility modules, configuration, and API hardening — no new components that render dynamic data from a data source. The `MDXFallback` component is a static fallback (intentionally no data source). The API routes were pre-existing and their Redis data flows are unchanged.

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `npm audit` zero vulnerabilities | `npm audit 2>&1 \| tail -5` | "found 0 vulnerabilities" | ✓ PASS |
| Color script runs cleanly | `node scripts/validate-colors.mjs` | Exit 0; contrast report printed | ✓ PASS |
| `validateSlug` rejects empty string | Logic trace: `slug.length > 0` fails | Returns `false` | ✓ PASS |
| `validateSlug` rejects SQL injection pattern `'; DROP TABLE--` | Logic trace: `SLUG_PATTERN.test()` fails on `'` and space chars | Returns `false` | ✓ PASS |
| `validateSlugs` enforces 20-slug cap | Logic trace: `slugs.length > MAX_BATCH_SLUGS` (20) returns `{ valid: false }` | Returns 400 | ✓ PASS |
| Rate limit returns 429 on excess | Logic trace: `viewsRateLimit.limit(ip)` → `{ success: false }` → `Response.json(..., { status: 429 })` | 429 returned | ✓ PASS (static analysis) |
| All 5 commits exist in git log | `git log --oneline 5cbab31 8b8cd9c ef4cd1e 68c1b0f a0d65fe` | All 5 returned | ✓ PASS |
| `npm run lint` (CLN-01 hygiene) | `npm run lint` | Broken — `next lint` CLI removed in Next.js 16.2 | ⚠️ WARNING |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 09-01-PLAN.md | Site serves CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy on all routes | ✓ SATISFIED | `next.config.ts` `headers()` with `source: '/(.*)'`; all four header keys confirmed in file |
| SEC-02 | 09-02-PLAN.md | MDX rendering wrapped in try-catch with user-friendly fallback UI | ✓ SATISFIED | `mdx-content.tsx` try-catch wraps both render stages; `MDXFallback` component with branded message and navigation |
| SEC-03 | 09-01-PLAN.md | All npm audit vulnerabilities resolved | ✓ SATISFIED | `npm audit` output: "found 0 vulnerabilities"; Next.js at 16.2.2 (was 16.1.6) |
| SEC-04 | 09-02-PLAN.md | View counter slug validated against `^[a-z0-9-]+$` | ✓ SATISFIED | `validation.ts` exports `validateSlug` with exact pattern; both GET and POST in `[slug]/route.ts` call it |
| SEC-05 | 09-02-PLAN.md | Batch view endpoint enforces maximum slug count | ✓ SATISFIED | `validateSlugs` enforces `MAX_BATCH_SLUGS = 20`; `route.ts` calls it before Redis query |
| SEC-06 | 09-02-PLAN.md | View counter POST rate-limited via @upstash/ratelimit sliding window | ✓ SATISFIED | `rate-limit.ts` uses `slidingWindow(10, '60 s')`; POST handler calls `viewsRateLimit.limit(ip)` |
| CLN-01 | 09-01-PLAN.md | Dependencies updated to latest patch/minor versions | ✓ SATISFIED | `npm audit` zero vulnerabilities; Next.js bumped in lock file; `@upstash/ratelimit` installed |
| CLN-03 | 09-01-PLAN.md | Color validation script palette matches actual `globals.css` values | ✓ SATISFIED | `validate-colors.mjs` has `muted: '#4A4A4A'`; no `#666666` remains; script runs to completion |

**Orphaned requirements check:** REQUIREMENTS.md maps SEC-01 through SEC-06, CLN-01, CLN-03 to Phase 9 — all 8 are claimed in the two plan files. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `next.config.ts` | 5 | `'unsafe-eval'` in CSP script-src | ℹ️ Info | Required for MDX `new Function()` execution — accepted trade-off, tracked as DEP-03 for future removal |
| `next.config.ts` | 7 | `'unsafe-inline'` in CSP style-src | ℹ️ Info | Required for rehype-pretty-code inline syntax highlighting — accepted trade-off |
| `package.json` | 10 | `"lint": "next lint"` | ⚠️ Warning | `next lint` CLI was removed in Next.js 16.2.2; the lint script is broken. `npm run lint` now outputs an error. This was noted in 09-01-SUMMARY.md as deferred. |

No stubs, placeholder comments, or hollow implementations found in any phase-modified file.

---

### Human Verification Required

#### 1. Live HTTP Header Inspection

**Test:** `curl -I https://keech.dev/` on production (or `curl -I http://localhost:3000/` after `npm run dev`)
**Expected:** Response headers include `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
**Why human:** Cannot run the Next.js dev server or hit production from this environment

#### 2. MDX Fallback Rendering

**Test:** Temporarily introduce a syntax error in any `.mdx` post file (e.g., an unclosed JSX tag) and visit that post in the browser
**Expected:** The page renders the neobrutalist fallback card ("This post couldn't be displayed") with a working "Back to Blog" link — no white screen, no raw error, no stack trace visible to the user
**Why human:** Client-side React rendering and visual appearance require a browser; the try-catch structure is verified but visual rendering and the actual fallback appearance need a human check

---

### Gaps Summary

No gaps found. All 9 must-haves are verified across both plans.

**Known deferred item (not a gap):** The `npm run lint` script is broken after the Next.js 16.2.2 upgrade because that version removed the `next lint` CLI command. The project has an `eslint.config.mjs` in the root, but direct `npx eslint` also fails due to config compatibility issues with the new ESLint flat config format. This was documented in 09-01-SUMMARY.md and is explicitly out of scope for this security-hardening phase. It should be addressed in Phase 10 or as a standalone fix.

---

_Verified: 2026-04-02_
_Verifier: Claude (gsd-verifier)_
