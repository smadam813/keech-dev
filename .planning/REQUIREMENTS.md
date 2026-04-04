# Requirements: keech.dev

**Defined:** 2026-04-03
**Core Value:** A polished, intentional developer portfolio — fast, visually distinctive, and well-crafted in every detail.

## v1.7 Requirements

Requirements for milestone v1.7 Address Additional Concerns. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: npm audit reports zero vulnerabilities after fix
- [x] **FOUND-02**: eslint-config-next version matches next@16.2.2
- [x] **FOUND-03**: Intentional `<a>` tags in error boundaries have eslint-disable comments with explanatory context
- [x] **FOUND-04**: Velite pinned to exact version 0.3.1 (no caret)
- [x] **FOUND-05**: Stale worktree directories removed, reclaiming ~3.6 GB disk space

### Middleware

- [x] **MID-01**: All security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) served from src/middleware.ts
- [x] **MID-02**: headers() function removed from next.config.ts
- [x] **MID-03**: Single Content-Security-Policy header per response (no duplication)

### MDX Migration

- [ ] **MDX-01**: Velite config uses s.markdown() instead of s.mdx() for content collections
- [ ] **MDX-02**: MDXContent renders HTML via dangerouslySetInnerHTML (no new Function)
- [ ] **MDX-03**: Code block copy button works via DOM-based approach after HTML rendering
- [ ] **MDX-04**: VoiceOver-compatible list elements (role="list") preserved via rehype plugin
- [ ] **MDX-05**: `unsafe-eval` removed from script-src in CSP

### Syntax Highlighting

- [ ] **SYN-01**: Shiki uses CSS-variables theme via createCssVariablesTheme()
- [ ] **SYN-02**: Token color variables defined in globals.css
- [ ] **SYN-03**: Code block background explicitly set in CSS (keepBackground: false)
- [ ] **SYN-04**: Visual parity with current github-dark-dimmed color scheme

### React Quality

- [ ] **RQ-01**: localStorage patterns in view-counter and listing-view-counts use useSyncExternalStore
- [ ] **RQ-02**: matchMedia pattern in use-hero-animation uses useSyncExternalStore
- [ ] **RQ-03**: Zero react-hooks/set-state-in-effect warnings from npm run lint
- [ ] **RQ-04**: Animation orchestration effects in use-hero-animation preserved with explanatory suppression comments

### Verification

- [ ] **VER-01**: All existing E2E tests pass with hardened CSP
- [ ] **VER-02**: next build output shows all pages as Static
- [ ] **VER-03**: Zero ESLint errors and zero warnings from npm run lint

## Future Requirements

Deferred beyond v1.7. Tracked but not in current roadmap.

### CSP Tightening

- **CSP-F01**: Remove `unsafe-inline` from style-src via transformerStyleToClass
- **CSP-F02**: CSP reporting endpoint (report-uri / report-to) for violation monitoring
- **CSP-F03**: Hash-based SRI via experimental.sri (blocked by Turbopack incompatibility)

### Testing

- **TEST-F01**: API route handler unit tests (request parsing, Redis interaction, response formatting)
- **TEST-F02**: OG image generation rendering verification

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nonce-based CSP | Incompatible with static generation — nonces require per-request dynamic rendering, destroying CDN caching |
| Remove `unsafe-inline` from script-src | Required for Next.js hydration scripts; only removable with nonces (see above) |
| Remove `unsafe-inline` from style-src | Marginal security gain for medium implementation effort; CSS injection risk minimal for author-controlled content |
| Replace Velite with @next/mdx | Massive scope creep; Velite works well, just need s.markdown() instead of s.mdx() |
| next-mdx-remote | Also uses new Function() internally; broken on Next.js 15.2+/16.x |
| @shikijs/transformers (transformerStyleToClass) | Only needed if removing unsafe-inline from style-src, which is deferred |
| Hash-based SRI (experimental.sri) | Webpack-only, incompatible with Turbopack (Next.js 16 default) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 14 | Complete |
| FOUND-02 | Phase 14 | Complete |
| FOUND-03 | Phase 14 | Complete |
| FOUND-04 | Phase 14 | Complete |
| FOUND-05 | Phase 14 | Complete |
| MID-01 | Phase 15 | Complete |
| MID-02 | Phase 15 | Complete |
| MID-03 | Phase 15 | Complete |
| MDX-01 | Phase 16 | Pending |
| MDX-02 | Phase 16 | Pending |
| MDX-03 | Phase 16 | Pending |
| MDX-04 | Phase 16 | Pending |
| MDX-05 | Phase 16 | Pending |
| SYN-01 | Phase 17 | Pending |
| SYN-02 | Phase 17 | Pending |
| SYN-03 | Phase 17 | Pending |
| SYN-04 | Phase 17 | Pending |
| RQ-01 | Phase 18 | Pending |
| RQ-02 | Phase 18 | Pending |
| RQ-03 | Phase 18 | Pending |
| RQ-04 | Phase 18 | Pending |
| VER-01 | Phase 19 | Pending |
| VER-02 | Phase 19 | Pending |
| VER-03 | Phase 19 | Pending |

**Coverage:**
- v1.7 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation*
