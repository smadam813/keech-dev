# Requirements: keech.dev

**Defined:** 2026-04-05
**Core Value:** A polished, intentional developer portfolio — fast, visually distinctive, and well-crafted in every detail.

## v1.8 Requirements

Requirements for v1.8 Validate & Address Concerns. Each maps to roadmap phases.

### Dead Code & Test Hygiene

- [ ] **HYGN-01**: Remove orphaned CopyButton component (src/components/blog/copy-button.tsx) and its test file
- [ ] **HYGN-02**: Remove lucide-react dependency if CopyButton was its only consumer
- [ ] **HYGN-03**: Relocate security-headers.test.ts to src/proxy.test.ts with corrected import path
- [ ] **HYGN-04**: Add `vitest/globals` to tsconfig compilerOptions.types to resolve false tsc errors in test files

### Dependency Updates

- [ ] **DEPS-01**: Apply minor/patch updates (tailwindcss, rehype-pretty-code, tailwind-merge, @upstash/redis, @types/node, @types/react)
- [ ] **DEPS-02**: Upgrade shiki 3→4 together with rehype-pretty-code, validate CSS-variables theme
- [ ] **DEPS-03**: Upgrade lucide-react to 1.x (if not removed by HYGN-02)
- [ ] **DEPS-04**: Upgrade @vercel/analytics to 2.x, verify no CSP domain changes needed
- [ ] **DEPS-05**: Upgrade TypeScript to 6.x, run ts5to6 migration tool, validate with tsc --noEmit

### Test Coverage

- [ ] **TEST-01**: Unit tests for GET /api/views (batch fetch) route handler with mocked Redis
- [ ] **TEST-02**: Unit tests for GET/POST /api/views/[slug] route handler (fetch, increment, dedup, rate limit)
- [ ] **TEST-03**: Unit tests for CodeBlockEnhancer DOM mutation (copy button injection, clipboard interaction)
- [ ] **TEST-04**: Assertion test that OG image font file exists at expected path

### Code Quality

- [ ] **QUAL-01**: Evaluate 3 react-hooks/set-state-in-effect suppressions (use-hero-animation.ts lines 34/45, scroll-reveal.tsx line 18) and refactor if cleaner alternative exists

## Future Requirements

### Deferred from v1.8

- **ESLint 10 upgrade** — blocked by eslint-config-next peer dependency conflicts
- **CSP unsafe-inline removal for styles** — requires nonce-based CSP (incompatible with static generation)
- **OG image font loading via fetch** — awaiting Turbopack support

## Out of Scope

| Feature | Reason |
|---------|--------|
| ESLint 9→10 upgrade | Blocked — eslint-config-next has unresolved peer dependency conflicts |
| Nonce-based CSP | Incompatible with static generation; requires dynamic rendering |
| Remove unsafe-inline from style-src | Requires nonce-based CSP (see above) |
| API route integration tests (with real Redis) | Unit tests with mocked Redis sufficient for personal site |
| Visual regression testing | High maintenance, low value for personal site |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HYGN-01 | Phase 20 | Pending |
| HYGN-02 | Phase 20 | Pending |
| HYGN-03 | Phase 20 | Pending |
| HYGN-04 | Phase 20 | Pending |
| DEPS-01 | Phase 21 | Pending |
| DEPS-02 | Phase 21 | Pending |
| DEPS-03 | Phase 21 | Pending |
| DEPS-04 | Phase 21 | Pending |
| DEPS-05 | Phase 22 | Pending |
| TEST-01 | Phase 23 | Pending |
| TEST-02 | Phase 23 | Pending |
| TEST-03 | Phase 23 | Pending |
| TEST-04 | Phase 23 | Pending |
| QUAL-01 | Phase 23 | Pending |

**Coverage:**
- v1.8 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
