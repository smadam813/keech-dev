# Requirements: keech.dev

**Defined:** 2026-04-11
**Core Value:** A polished, intentional developer portfolio — fast, visually distinctive, and well-crafted in every detail.

## v1.8.1 Requirements

Requirements for v1.8.1 Address Missed Concerns. Closes the three CONCERNS.md items that were not in v1.8's scope but are genuinely worth acting on for a solo-maintained personal site. Each maps to roadmap phases.

### Audit Gap Closures

- [ ] **GAP-01**: Draft posts (`draft: true` in frontmatter) at `/blog/[slug]` return 404 instead of rendering, and `generateStaticParams()` excludes draft slugs from the build output so draft pages are not statically generated
- [ ] **GAP-02**: A `test:e2e:dev` npm script runs Playwright against `npm run dev` instead of `npm run build && npm run start`, removing the full-build requirement for local E2E iteration
- [ ] **GAP-03**: The code-block copy button (`CodeBlockEnhancer`) handles `navigator.clipboard.writeText` rejection gracefully — no unhandled promise rejection, and the button surfaces a visible failure state when the clipboard write fails

## Future Requirements

### Deferred from v1.8.1

(None — v1.8.1 is a focused patch milestone, no deferrals.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Other items in CONCERNS.md (Velite pin, dangerouslySetInnerHTML, DOM mutation in CodeBlockEnhancer, Suspense fallback hygiene, CSP unsafe-inline, x-forwarded-for, hardcoded setTimeout/glow constants, page/component test coverage gaps, coverage threshold, ESLint 10) | Accepted trade-offs, theoretical fragility, or already addressed in v1.7/v1.8. Reviewed and confirmed not worth acting on for a solo-maintained personal site. |
| Draft preview UI (admin route, password gate) | Simpler to keep drafts out of build entirely than build a preview surface for a one-author blog |
| Fallback to `document.execCommand('copy')` | Modern browsers on HTTPS support `navigator.clipboard`; failure state is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAP-01 | TBD | Pending |
| GAP-02 | TBD | Pending |
| GAP-03 | TBD | Pending |

---

*Last updated: 2026-04-11 — v1.8.1 milestone defined*
