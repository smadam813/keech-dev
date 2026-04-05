# Phase 15: Middleware Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 15-middleware-infrastructure
**Areas discussed:** Route matching, CSP directive preservation, Middleware structure
**Mode:** --auto (all decisions auto-selected as recommended defaults)

---

## Route Matching

| Option | Description | Selected |
|--------|-------------|----------|
| Match all routes with config matcher excluding static assets | Use Next.js `config.matcher` to skip `_next/static`, `_next/image`, `favicon.ico` | ✓ |
| Match all routes unconditionally | No matcher — middleware runs on every request including static assets | |
| Custom path-based logic in middleware | Check `request.nextUrl.pathname` inside the function | |

**User's choice:** [auto] Match all routes with config matcher excluding static assets
**Notes:** Next.js best practice. Avoids unnecessary middleware execution on static file requests.

---

## CSP Directive Preservation

| Option | Description | Selected |
|--------|-------------|----------|
| Exact same CSP values, byte-for-byte | Pure refactor — no policy changes | ✓ |
| Update CSP during migration | Combine with Phase 16 unsafe-eval removal | |

**User's choice:** [auto] Exact same CSP values, byte-for-byte
**Notes:** This is a refactor phase. CSP policy changes happen in Phase 16.

---

## Middleware Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single middleware function with NextResponse.next() | Minimal, self-contained, no abstractions | ✓ |
| Middleware with extracted header helper | Separate function for building headers | |
| Middleware chain pattern | Composable middleware for future extensibility | |

**User's choice:** [auto] Single middleware function with NextResponse.next()
**Notes:** Three requirements (MID-01, MID-02, MID-03) are simple enough for a single function. No need for abstraction.

---

## Claude's Discretion

- Matcher pattern syntax (array vs regex)
- CSP directive definition style (array.join vs string literal)
- Import style for Next.js middleware types

## Deferred Ideas

None — discussion stayed within phase scope.
