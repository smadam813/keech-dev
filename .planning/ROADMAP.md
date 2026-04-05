# Roadmap: keech.dev

## Milestones

- ✅ **v1.3 Hero Polish** — Phases 1-2 (shipped 2026-02-09)
- ✅ **v1.4 Blog Stats** — Phases 3-5 (shipped 2026-02-22)
- ✅ **v1.5 Tag Filtering** — Phases 6-8 (shipped 2026-03-01)
- ✅ **v1.6 Address Concerns** — Phases 9-13 (shipped 2026-04-03)
- ✅ **v1.7 Address Additional Concerns** — Phases 14-19 (shipped 2026-04-05)
- 🚧 **v1.8 Validate & Address Concerns** — Phases 20-23 (in progress)

## Phases

<details>
<summary>✅ v1.3 Hero Polish (Phases 1-2) — SHIPPED 2026-02-09</summary>

- [x] Phase 1: Animation Sync & Reveal (1/1 plans) — completed 2026-02-08
- [x] Phase 2: Rune Glow Effects (1/1 plans) — completed 2026-02-08

See: `.planning/milestones/v1.3-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.4 Blog Stats (Phases 3-5) — SHIPPED 2026-02-22</summary>

- [x] Phase 3: Infrastructure & API (2/2 plans) — completed 2026-02-21
- [x] Phase 4: Post Page Integration (2/2 plans) — completed 2026-02-22
- [x] Phase 5: Listing & Polish (2/2 plans) — completed 2026-02-22

See: `.planning/milestones/v1.4-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.5 Tag Filtering (Phases 6-8) — SHIPPED 2026-03-01</summary>

- [x] Phase 6: Filter Components (1/1 plans) — completed 2026-02-27
- [x] Phase 7: Filtered Listing Integration (2/2 plans) — completed 2026-02-28
- [x] Phase 8: Counts and Transitions (1/1 plans) — completed 2026-03-01

See: `.planning/milestones/v1.5-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.6 Address Concerns (Phases 9-13) — SHIPPED 2026-04-03</summary>

- [x] Phase 9: Security & Patches (2/2 plans) — completed 2026-04-03
- [x] Phase 10: Resilience & Code Quality (4/4 plans) — completed 2026-04-03
- [x] Phase 11: SEO & Branding (3/3 plans) — completed 2026-04-03
- [x] Phase 12: Testing Infrastructure (3/3 plans) — completed 2026-04-03
- [x] Phase 13: Sticky/Pinned Mobile TOC (1/1 plans) — completed 2026-04-03

See: `.planning/milestones/v1.6-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.7 Address Additional Concerns (Phases 14-19) — SHIPPED 2026-04-05</summary>

- [x] Phase 14: Foundation Hardening (1/1 plans) — completed 2026-04-04
- [x] Phase 15: Middleware Infrastructure (1/1 plans) — completed 2026-04-04
- [x] Phase 16: MDX Migration (2/2 plans) — completed 2026-04-04
- [x] Phase 17: Syntax Highlighting Theme Migration (1/1 plans) — completed 2026-04-04
- [x] Phase 18: React 19 Lint Cleanup (3/3 plans) — completed 2026-04-05
- [x] Phase 19: Verification and Polish (1/1 plans) — completed 2026-04-05

See: `.planning/milestones/v1.7-ROADMAP.md` for full details.

</details>

### v1.8 Validate & Address Concerns (In Progress)

**Milestone Goal:** Resolve remaining concerns from the codebase audit — dead code, test hygiene, dependency updates, and test coverage gaps.

- [ ] **Phase 20: Dead Code & Test Hygiene** - Remove orphaned code, fix test co-location and tsconfig for accurate baselines
- [ ] **Phase 21: Dependency Upgrades** - Apply minor/patch and safe major dependency updates across the stack
- [ ] **Phase 22: TypeScript 6 Upgrade** - Upgrade to TypeScript 6.x with migration tooling and full validation
- [ ] **Phase 23: Test Coverage & Code Quality** - Fill test gaps for API routes, CodeBlockEnhancer, OG font; evaluate lint suppressions

## Phase Details

### Phase 20: Dead Code & Test Hygiene
**Goal**: The codebase has zero orphaned code, tests co-locate with their source files, and `tsc --noEmit` reports zero false errors
**Depends on**: Phase 19 (v1.7 complete)
**Requirements**: HYGN-01, HYGN-02, HYGN-03, HYGN-04
**Success Criteria** (what must be TRUE):
  1. CopyButton component and its test file are deleted; `npm run test` passes with exactly 132 tests (down from 135)
  2. lucide-react is removed from package.json if CopyButton was its only consumer (conditional — if other consumers exist, dependency stays and is noted)
  3. security-headers.test.ts has been relocated to src/proxy.test.ts with corrected import path and passes
  4. `npx tsc --noEmit` reports zero errors across the entire codebase including test files
**Plans:** 1 plan
Plans:
- [ ] 20-01-PLAN.md — Delete dead code, relocate test, fix tsconfig types and error.test.tsx shadowing

### Phase 21: Dependency Upgrades
**Goal**: All non-blocked dependencies are at their current stable versions with the content pipeline and site fully validated
**Depends on**: Phase 20
**Requirements**: DEPS-01, DEPS-02, DEPS-03, DEPS-04
**Success Criteria** (what must be TRUE):
  1. Minor/patch packages (tailwindcss, rehype-pretty-code patch, tailwind-merge, @upstash/redis, @types/node, @types/react) are updated and `npm run build && npm run test` passes
  2. shiki 4 and rehype-pretty-code 0.14.3 are installed together, `npm run velite` succeeds, and code blocks render with correct CSS-variables syntax highlighting
  3. lucide-react is at 1.x if it was not removed in Phase 20 (conditional on HYGN-02 outcome); if removed, DEPS-03 is marked N/A
  4. @vercel/analytics is at 2.x with no new CSP violations in the browser console
  5. `npm audit` reports zero vulnerabilities and `npm run lint` passes with zero errors/warnings
**Plans**: TBD

### Phase 22: TypeScript 6 Upgrade
**Goal**: The project compiles cleanly under TypeScript 6 with all tooling validated against the new compiler
**Depends on**: Phase 21
**Requirements**: DEPS-05
**Success Criteria** (what must be TRUE):
  1. TypeScript 6.x is installed and `npx tsc --noEmit` reports zero errors
  2. `npm run build` produces all-static pages with no compiler warnings
  3. `npm run test` and `npm run lint` pass with zero failures and zero warnings
**Plans**: TBD

### Phase 23: Test Coverage & Code Quality
**Goal**: The highest-value test gaps are filled and lint suppression decisions are documented
**Depends on**: Phase 22
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, QUAL-01
**Success Criteria** (what must be TRUE):
  1. Unit tests for GET /api/views (batch fetch) cover empty slugs, valid slugs, invalid format, batch limit exceeded, and Redis error scenarios
  2. Unit tests for GET/POST /api/views/[slug] cover fetch, increment, IP deduplication, rate limiting, and Redis error scenarios using NextRequest (not plain Request)
  3. CodeBlockEnhancer has unit tests covering copy button injection into pre elements and clipboard interaction
  4. An assertion test confirms the OG image font file exists at the expected path
  5. The 3 react-hooks/set-state-in-effect suppressions in use-hero-animation.ts and scroll-reveal.tsx are either refactored away or documented as intentional with rationale in a comment or decision log
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 20 → 21 → 22 → 23

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Animation Sync & Reveal | v1.3 | 1/1 | Complete | 2026-02-08 |
| 2. Rune Glow Effects | v1.3 | 1/1 | Complete | 2026-02-08 |
| 3. Infrastructure & API | v1.4 | 2/2 | Complete | 2026-02-21 |
| 4. Post Page Integration | v1.4 | 2/2 | Complete | 2026-02-22 |
| 5. Listing & Polish | v1.4 | 2/2 | Complete | 2026-02-22 |
| 6. Filter Components | v1.5 | 1/1 | Complete | 2026-02-27 |
| 7. Filtered Listing Integration | v1.5 | 2/2 | Complete | 2026-02-28 |
| 8. Counts and Transitions | v1.5 | 1/1 | Complete | 2026-03-01 |
| 9. Security & Patches | v1.6 | 2/2 | Complete | 2026-04-03 |
| 10. Resilience & Code Quality | v1.6 | 4/4 | Complete | 2026-04-03 |
| 11. SEO & Branding | v1.6 | 3/3 | Complete | 2026-04-03 |
| 12. Testing Infrastructure | v1.6 | 3/3 | Complete | 2026-04-03 |
| 13. Sticky/Pinned Mobile TOC | v1.6 | 1/1 | Complete | 2026-04-03 |
| 14. Foundation Hardening | v1.7 | 1/1 | Complete | 2026-04-04 |
| 15. Middleware Infrastructure | v1.7 | 1/1 | Complete | 2026-04-04 |
| 16. MDX Migration | v1.7 | 2/2 | Complete | 2026-04-04 |
| 17. Syntax Highlighting Theme Migration | v1.7 | 1/1 | Complete | 2026-04-04 |
| 18. React 19 Lint Cleanup | v1.7 | 3/3 | Complete | 2026-04-05 |
| 19. Verification and Polish | v1.7 | 1/1 | Complete | 2026-04-05 |
| 20. Dead Code & Test Hygiene | v1.8 | 0/1 | Not started | - |
| 21. Dependency Upgrades | v1.8 | 0/? | Not started | - |
| 22. TypeScript 6 Upgrade | v1.8 | 0/? | Not started | - |
| 23. Test Coverage & Code Quality | v1.8 | 0/? | Not started | - |
