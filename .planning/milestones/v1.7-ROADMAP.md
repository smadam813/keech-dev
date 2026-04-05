# Roadmap: keech.dev

## Milestones

- ✅ **v1.3 Hero Polish** — Phases 1-2 (shipped 2026-02-09)
- ✅ **v1.4 Blog Stats** — Phases 3-5 (shipped 2026-02-22)
- ✅ **v1.5 Tag Filtering** — Phases 6-8 (shipped 2026-03-01)
- ✅ **v1.6 Address Concerns** — Phases 9-13 (shipped 2026-04-03)
- 🚧 **v1.7 Address Additional Concerns** — Phases 14-19 (in progress)

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

### v1.7 Address Additional Concerns (In Progress)

**Milestone Goal:** Harden CSP by eliminating `unsafe-eval`, centralize security via middleware, migrate syntax highlighting to CSS-variables theme, and clean up remaining lint/dependency/React quality concerns.

- [x] **Phase 14: Foundation Hardening** - Clean dependency tree, lock Velite, reduce lint noise before migrations (completed 2026-04-04)
- [x] **Phase 15: Middleware Infrastructure** - Centralize all security headers in src/middleware.ts (completed 2026-04-04)
- [x] **Phase 16: MDX Migration** - Switch to s.markdown() and remove unsafe-eval from CSP (completed 2026-04-04)
- [x] **Phase 17: Syntax Highlighting Theme Migration** - Move token colors to CSS variables in globals.css (completed 2026-04-04)
- [x] **Phase 18: React 19 Lint Cleanup** - Migrate localStorage/matchMedia patterns to useSyncExternalStore (completed 2026-04-05)
- [x] **Phase 19: Verification and Polish** - End-to-end validation of hardened CSP and zero lint issues (completed 2026-04-05)

## Phase Details

### Phase 14: Foundation Hardening
**Goal**: Dependencies are clean, Velite is locked, and lint noise is eliminated before any migration work begins
**Depends on**: Nothing (first phase of v1.7)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. `npm audit` reports zero vulnerabilities
  2. `npm run lint` produces no errors related to eslint-config-next version mismatch
  3. Error boundary `<a>` tags have eslint-disable comments with explanatory context (no unexplained suppressions)
  4. `package.json` shows Velite pinned to exact `0.3.1` (no caret prefix)
  5. Stale worktree directories no longer exist on disk
**Plans:** 1/1 plans complete
Plans:
- [x] 14-01-PLAN.md -- Fix audit vulnerabilities, pin Velite, bump eslint-config-next, verify lint comments, clean worktrees

### Phase 15: Middleware Infrastructure
**Goal**: All security headers are served from a single middleware file, with no duplication from next.config.ts
**Depends on**: Phase 14
**Requirements**: MID-01, MID-02, MID-03
**Success Criteria** (what must be TRUE):
  1. Browser DevTools Network tab shows CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers on every page response
  2. `next.config.ts` contains no `headers()` function
  3. Only one Content-Security-Policy header appears per response (no duplication)
**Plans**: TBD

### Phase 16: MDX Migration
**Goal**: Blog posts and projects render from compiled HTML instead of runtime JavaScript execution, enabling unsafe-eval removal from CSP
**Depends on**: Phase 15
**Requirements**: MDX-01, MDX-02, MDX-03, MDX-04, MDX-05
**Success Criteria** (what must be TRUE):
  1. All blog posts and project pages render correctly with full content visible
  2. Code block copy button works on every code block across all posts
  3. VoiceOver announces list elements correctly (role="list" preserved)
  4. Browser console shows no CSP violations with `unsafe-eval` removed from script-src
  5. MDXContent component no longer uses `new Function()` anywhere in the codebase
**Plans:** 2/2 plans complete
Plans:
- [x] 16-01-PLAN.md -- Switch to s.markdown(), rewrite MDXContent, DOM-based copy buttons, remove unsafe-eval from CSP

### Phase 17: Syntax Highlighting Theme Migration
**Goal**: Syntax highlighting colors are defined as CSS variables in globals.css, consistent with the site's CSS-first design token approach
**Depends on**: Phase 16
**Requirements**: SYN-01, SYN-02, SYN-03, SYN-04
**Success Criteria** (what must be TRUE):
  1. Code blocks display syntax-highlighted code with colors sourced from CSS variables (not hardcoded hex in Shiki config)
  2. Token color variables are defined in `globals.css` alongside other design tokens
  3. Code block background is explicitly set in CSS (not inherited from page background)
  4. Code blocks are visually consistent with the current github-dark-dimmed appearance (no jarring color regressions)
**Plans:** 1/1 plans complete
Plans:
- [x] 17-01-PLAN.md -- Switch to createCssVariablesTheme(), define --shiki-* token variables in globals.css

### Phase 18: React 19 Lint Cleanup
**Goal**: All localStorage and matchMedia patterns use idiomatic React 19 APIs, eliminating set-state-in-effect warnings while preserving animation orchestration
**Depends on**: Phase 14
**Requirements**: RQ-01, RQ-02, RQ-03, RQ-04
**Success Criteria** (what must be TRUE):
  1. View counter and listing view counts display correctly on first visit and return visits (localStorage cache working via useSyncExternalStore)
  2. Hero animation respects prefers-reduced-motion changes without page reload
  3. `npm run lint` produces zero `react-hooks/set-state-in-effect` warnings
  4. Hero animation reveal sequence still plays correctly (orchestration effects preserved with explanatory suppression comments)
**Plans:** 3/3 plans complete
Plans:
- [x] 18-01-PLAN.md -- Create useViewStore and useMediaQuery shared hooks
- [x] 18-02-PLAN.md -- Consumer migration and zero lint warnings
- [x] 18-03-PLAN.md -- Fix filter transition flash with useTransition (gap closure)

### Phase 19: Verification and Polish
**Goal**: The entire site passes end-to-end validation under the hardened CSP with zero lint issues and full static generation preserved
**Depends on**: Phase 16, Phase 17, Phase 18
**Requirements**: VER-01, VER-02, VER-03
**Success Criteria** (what must be TRUE):
  1. All existing Playwright E2E tests pass (mobile menu, code copy, view counts, mobile TOC)
  2. `next build` output shows every page as Static (no dynamic rendering introduced)
  3. `npm run lint` reports zero errors and zero warnings
**Plans:** 1/1 plans complete
Plans:
- [x] 19-01-PLAN.md -- Run lint, build, unit tests, and E2E validation; fix any failures

## Progress

**Execution Order:**
Phases execute in numeric order: 14 → 15 → 16 → 17 → 18 → 19
(Phase 18 depends only on Phase 14 and can run after Phase 14, but is sequenced here for cleaner commit history separating security work from quality work.)

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
| 14. Foundation Hardening | v1.7 | 1/1 | Complete    | 2026-04-04 |
| 15. Middleware Infrastructure | v1.7 | 1/1 | Complete    | 2026-04-04 |
| 16. MDX Migration | v1.7 | 2/2 | Complete    | 2026-04-04 |
| 17. Syntax Highlighting Theme Migration | v1.7 | 1/1 | Complete    | 2026-04-04 |
| 18. React 19 Lint Cleanup | v1.7 | 3/3 | Complete   | 2026-04-05 |
| 19. Verification and Polish | v1.7 | 1/1 | Complete    | 2026-04-05 |
