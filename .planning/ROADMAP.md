# Roadmap: keech.dev

## Milestones

- ✅ **v1.3 Hero Polish** — Phases 1-2 (shipped 2026-02-09)
- ✅ **v1.4 Blog Stats** — Phases 3-5 (shipped 2026-02-22)
- ✅ **v1.5 Tag Filtering** — Phases 6-8 (shipped 2026-03-01)
- ✅ **v1.6 Address Concerns** — Phases 9-13 (shipped 2026-04-03)
- ✅ **v1.7 Address Additional Concerns** — Phases 14-19 (shipped 2026-04-05)
- ✅ **v1.8 Validate & Address Concerns** — Phases 20-23 (shipped 2026-04-06)
- 🚧 **v1.8.1 Address Missed Concerns** — Phase 24 (in progress)

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

<details>
<summary>✅ v1.8 Validate & Address Concerns (Phases 20-23) — SHIPPED 2026-04-06</summary>

- [x] Phase 20: Dead Code & Test Hygiene (1/1 plans) — completed 2026-04-05
- [x] Phase 21: Dependency Upgrades (4/4 plans) — completed 2026-04-05
- [x] Phase 22: TypeScript 6 Upgrade (1/1 plans) — completed 2026-04-05
- [x] Phase 23: Test Coverage & Code Quality (2/2 plans) — completed 2026-04-06

See: `.planning/milestones/v1.8-ROADMAP.md` for full details.

</details>

### v1.8.1 Address Missed Concerns (in progress)

- [ ] **Phase 24: Audit Gap Closures** — Close the three CONCERNS.md items missed by v1.8 (draft guard, dev-server E2E script, clipboard failure handling)

## Phase Details

### Phase 24: Audit Gap Closures
**Goal**: Close the three CONCERNS.md items that were out of scope during v1.8 so the audit backlog is fully resolved
**Depends on**: v1.8 (shipped)
**Requirements**: GAP-01, GAP-02, GAP-03
**Success Criteria** (what must be TRUE):
  1. Visiting `/blog/<slug>` for a post with `draft: true` in frontmatter returns the site's 404 page instead of rendering the draft content
  2. `next build` output does not include any draft-slug routes — `generateStaticParams()` filters them out so drafts are not prerendered
  3. Running `npm run test:e2e:dev` executes the Playwright suite against `npm run dev` (no `next build` required), enabling fast local E2E iteration
  4. When `navigator.clipboard.writeText` rejects, the code-block copy button surfaces a visible failure state (no unhandled promise rejection, no silent swallow) and the existing success path still works
  5. Unit tests cover the clipboard failure path in `CodeBlockEnhancer` (new scenario added alongside the existing 5), keeping DOM-mutation test coverage complete
**Plans**: 3 plans
Plans:
- [ ] 24-01-draft-guard-PLAN.md — Extract publishedPosts helper and wire through all 5 call sites (GAP-01)
- [ ] 24-02-dev-e2e-script-PLAN.md — Add env-var ternary to Playwright config and test:e2e:dev script (GAP-02)
- [ ] 24-03-clipboard-failure-PLAN.md — Add try/catch + xIcon + aria-live to clipboard handler and failure test (GAP-03)

## Progress

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
| 20. Dead Code & Test Hygiene | v1.8 | 1/1 | Complete | 2026-04-05 |
| 21. Dependency Upgrades | v1.8 | 4/4 | Complete | 2026-04-05 |
| 22. TypeScript 6 Upgrade | v1.8 | 1/1 | Complete | 2026-04-05 |
| 23. Test Coverage & Code Quality | v1.8 | 2/2 | Complete | 2026-04-06 |
| 24. Audit Gap Closures | v1.8.1 | 0/3 | Not started | — |
