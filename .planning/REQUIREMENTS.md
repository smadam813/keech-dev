# Requirements: keech.dev

**Defined:** 2026-04-02
**Core Value:** A polished, intentional developer portfolio — fast, visually distinctive, and well-crafted in every detail.

## v1.6 Requirements

Requirements for v1.6 Address Concerns. Each maps to roadmap phases.

### Security

- [ ] **SEC-01**: Site serves Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers on all routes
- [ ] **SEC-02**: MDX rendering wrapped in try-catch with user-friendly fallback UI instead of white screen
- [ ] **SEC-03**: All npm audit vulnerabilities resolved (Next.js patched to latest)
- [ ] **SEC-04**: View counter slug parameters validated against regex pattern (`^[a-z0-9-]+$`)
- [ ] **SEC-05**: Batch view endpoint enforces maximum slug count limit
- [ ] **SEC-06**: View counter POST endpoint rate-limited via @upstash/ratelimit sliding window

### Error Resilience

- [ ] **ERR-01**: Global error boundary (`error.tsx`) catches runtime errors with branded error page
- [ ] **ERR-02**: Global error boundary (`global-error.tsx`) catches root layout errors with full HTML shell
- [ ] **ERR-03**: Blog post error boundary (`blog/[slug]/error.tsx`) shows MDX-specific error message
- [ ] **ERR-04**: Loading states (`loading.tsx`) provide skeleton UI during route transitions

### Code Quality

- [x] **QUAL-01**: localStorage cache helpers extracted to single location in `src/lib/views.ts`
- [x] **QUAL-02**: Date formatting extracted to shared `formatDate()` utility
- [ ] **QUAL-03**: Filtered list logic extracted to shared `useFilteredList` hook
- [ ] **QUAL-04**: TagChip and TechBadge toggle mode unified into shared component
- [ ] **QUAL-05**: Hero component refactored — animation orchestration and glow positioning extracted to custom hooks

### SEO & Branding

- [ ] **SEO-01**: Favicon (.ico + .svg) and apple-touch-icon present in browser tabs and mobile bookmarks
- [ ] **SEO-02**: Default OG image renders branded card for site-level social shares
- [ ] **SEO-03**: Per-post OG images render blog post title with neobrutalist branding
- [ ] **SEO-04**: Sitemap uses actual content dates instead of `new Date()` for static and project routes
- [ ] **SEO-05**: RSS feed available at `/feed.xml` with all published blog posts
- [ ] **SEO-06**: Project card and detail images include `sizes` attribute for optimal responsive loading

### Accessibility

- [ ] **A11Y-01**: Code block copy button visible on keyboard focus (`focus-visible:opacity-100`)
- [ ] **A11Y-02**: MDX list elements include `role="list"` for Safari VoiceOver compatibility
- [ ] **A11Y-03**: Mobile/tablet users can navigate blog post sections via collapsible table of contents

### Testing

- [ ] **TEST-01**: Vitest configured with path aliases, jsdom, and React Testing Library
- [ ] **TEST-02**: Unit tests cover date formatting, view count helpers, and rune glow position calculations
- [ ] **TEST-03**: Playwright configured for E2E testing
- [ ] **TEST-04**: E2E tests cover mobile menu toggle, code copy button, and view count increment

### Cleanup

- [ ] **CLN-01**: Dependencies updated to latest patch/minor versions (excluding major bumps)
- [ ] **CLN-02**: Resume placeholder button replaced with actionable alternative or removed
- [ ] **CLN-03**: Color validation script palette matches actual `globals.css` values

## Future Requirements

Deferred to separate milestones. Tracked but not in current roadmap.

### Major Dependency Upgrades

- **DEP-01**: Migrate @vercel/analytics from v1 to v2
- **DEP-02**: Migrate Shiki from v3 to v4
- **DEP-03**: Remove CSP `unsafe-eval` by rearchitecting MDX execution pipeline

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| CSP without `unsafe-eval` | Requires replacing `new Function()` MDX execution — content pipeline rewrite out of scope for hardening milestone |
| Nonce-based CSP via middleware | Incompatible with static generation; overkill for site with no user-generated content |
| Comprehensive E2E test suite | Diminishing returns for personal portfolio; targeted tests only |
| @vercel/analytics v2 migration | Major version with breaking changes; compound risk with 20+ other concerns |
| Shiki v4 migration | Major version requiring Node.js 20+; separate milestone |
| Visual regression testing | High maintenance, low value for a personal site |
| Resume PDF upload | Content creation, not a code concern |
| Color validation script rebuild | Fix the hex value; do not over-engineer a manual dev tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 9 | Pending |
| SEC-02 | Phase 9 | Pending |
| SEC-03 | Phase 9 | Pending |
| SEC-04 | Phase 9 | Pending |
| SEC-05 | Phase 9 | Pending |
| SEC-06 | Phase 9 | Pending |
| ERR-01 | Phase 10 | Pending |
| ERR-02 | Phase 10 | Pending |
| ERR-03 | Phase 10 | Pending |
| ERR-04 | Phase 10 | Pending |
| QUAL-01 | Phase 10 | Complete |
| QUAL-02 | Phase 10 | Complete |
| QUAL-03 | Phase 10 | Pending |
| QUAL-04 | Phase 10 | Pending |
| QUAL-05 | Phase 10 | Pending |
| SEO-01 | Phase 11 | Pending |
| SEO-02 | Phase 11 | Pending |
| SEO-03 | Phase 11 | Pending |
| SEO-04 | Phase 11 | Pending |
| SEO-05 | Phase 11 | Pending |
| SEO-06 | Phase 11 | Pending |
| A11Y-01 | Phase 10 | Pending |
| A11Y-02 | Phase 10 | Pending |
| A11Y-03 | Phase 12 | Pending |
| TEST-01 | Phase 12 | Pending |
| TEST-02 | Phase 12 | Pending |
| TEST-03 | Phase 12 | Pending |
| TEST-04 | Phase 12 | Pending |
| CLN-01 | Phase 9 | Pending |
| CLN-02 | Phase 11 | Pending |
| CLN-03 | Phase 9 | Pending |

**Coverage:**
- v1.6 requirements: 31 total
- Mapped to phases: 31/31
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
