# Phase 9: Security & Patches - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 09-security-patches
**Areas discussed:** CSP policy scope, Rate limit thresholds, MDX error fallback UX, Batch endpoint limits

---

## CSP Policy Scope

### Q1: How strict should the CSP be beyond the basics?

| Option | Description | Selected |
|--------|-------------|----------|
| Tight lockdown | Lock everything down: default-src 'self', explicit allowlists for img-src, font-src, style-src, connect-src, frame-ancestors 'none'. Only open what's proven needed. | |
| Moderate lockdown | Set the required 4 headers with a CSP that's permissive on img/font/style but strict on scripts and frames. | |
| You decide | Claude picks the right balance based on what the codebase actually loads. | ✓ |

**User's choice:** You decide
**Notes:** User trusts Claude to audit what the codebase loads and set appropriate directives.

### Q2: Should the CSP be report-only initially or enforced from day one?

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce immediately | Set Content-Security-Policy header directly. Small, fully controlled site — easy to validate. | |
| Report-only first | Use Content-Security-Policy-Report-Only for a deployment cycle. | |
| You decide | Claude picks based on risk assessment. | ✓ |

**User's choice:** You decide
**Notes:** None.

### Q3: Where should security headers be configured?

| Option | Description | Selected |
|--------|-------------|----------|
| next.config.ts headers() | Add headers() export. Works with static generation, no middleware needed. | ✓ |
| Next.js middleware | Create src/middleware.ts. More flexible but adds runtime overhead. | |
| Vercel config (vercel.json) | Platform-specific, won't apply in local dev. | |

**User's choice:** next.config.ts headers()
**Notes:** Matches the approach suggested in the CONCERNS.md audit.

---

## Rate Limit Thresholds

### Q1: What rate limit window and threshold for the view counter POST endpoint?

| Option | Description | Selected |
|--------|-------------|----------|
| 10 req / 60s sliding | Generous for legitimate users, tight enough to block scripts. | |
| 5 req / 60s sliding | Stricter — could affect power readers. | |
| You decide | Claude picks a sensible threshold. | ✓ |

**User's choice:** You decide
**Notes:** None.

### Q2: Should rate limiting also apply to GET endpoints?

| Option | Description | Selected |
|--------|-------------|----------|
| POST only | Only rate-limit the increment endpoint. GETs are read-only and less abusable. | |
| Both GET and POST | Rate-limit all view counter endpoints. | |
| You decide | Claude picks based on risk/complexity trade-off. | ✓ |

**User's choice:** You decide
**Notes:** None.

---

## MDX Error Fallback UX

### Q1: What should visitors see when a blog post has malformed MDX?

| Option | Description | Selected |
|--------|-------------|----------|
| Branded error with nav | Full page layout preserved. Centered neobrutalist message with link back to /blog. | ✓ |
| Inline error block | Keep blog post layout (title, date, sidebar) but replace article body with error message. | |
| You decide | Claude picks based on component structure. | |

**User's choice:** Branded error with nav
**Notes:** User selected the preview showing full-page branded fallback with "This post couldn't be displayed" and "Back to Blog" link.

### Q2: Should the MDX error be logged to console for debugging?

| Option | Description | Selected |
|--------|-------------|----------|
| Console.error in dev only | Log error locally, silent in production. | |
| Always log to console | console.error in all environments. | |
| You decide | Claude picks the right logging approach. | ✓ |

**User's choice:** You decide
**Notes:** None.

---

## Batch Endpoint Limits

### Q1: What maximum slug count should the batch endpoint enforce?

| Option | Description | Selected |
|--------|-------------|----------|
| 50 slugs max | Generous ceiling, handles 10x growth. Returns 400 if exceeded. | |
| 20 slugs max | Tighter cap, more conservative on Redis mget() calls. | |
| You decide | Claude picks a sensible limit. | ✓ |

**User's choice:** You decide
**Notes:** None.

---

## Claude's Discretion

- CSP directive details and enforcement mode (report-only vs enforce)
- Rate limit window size and request threshold
- Whether GET endpoints need rate limiting
- Batch slug count maximum
- MDX error logging strategy (dev-only vs always)

## Deferred Ideas

None — discussion stayed within phase scope.
