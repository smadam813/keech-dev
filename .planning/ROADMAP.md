# Roadmap: keech.dev

## Milestones

- ✅ **v1.3 Hero Polish** — Phases 1-2 (shipped 2026-02-09)
- 🚧 **v1.4 Blog Stats** — Phases 3-5 (in progress)

## Phases

<details>
<summary>✅ v1.3 Hero Polish (Phases 1-2) — SHIPPED 2026-02-09</summary>

- [x] Phase 1: Animation Sync & Reveal (1/1 plans) — completed 2026-02-08
- [x] Phase 2: Rune Glow Effects (1/1 plans) — completed 2026-02-08

See: `.planning/milestones/v1.3-ROADMAP.md` for full details.

</details>

### 🚧 v1.4 Blog Stats (In Progress)

**Milestone Goal:** Add public view counts to blog posts — the site's first backend integration.

- [x] **Phase 3: Infrastructure & API** - Redis client, route handlers, and IP deduplication
- [ ] **Phase 4: Post Page Integration** - View counter on individual blog posts with static generation preserved
- [ ] **Phase 5: Listing & Polish** - View counts on blog listing, number formatting, and graceful degradation

## Phase Details

### Phase 3: Infrastructure & API
**Goal**: A working view count API that can be tested independently via curl before any UI is touched
**Depends on**: Nothing (first phase of v1.4)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. `curl -X POST /api/views/hello-world` returns a JSON response with an incremented view count
  2. `curl -X GET /api/views/hello-world` returns the current count without incrementing it
  3. Repeated POSTs from the same IP within 24 hours do not inflate the count beyond the first increment
  4. No raw IP addresses are stored in Redis (only SHA-256 hashes)
  5. GET requests return fresh data on every call (not cached at build time)
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Redis client, view count API with GET/POST handlers and IP deduplication
- [x] 03-02-PLAN.md — Fix INFRA-04 dedup enforcement: conditional INCR only on first visit (gap closure)

### Phase 4: Post Page Integration
**Goal**: Visitors see a live view count on every blog post, and the page remains statically generated
**Depends on**: Phase 3
**Requirements**: VIEW-01, VIEW-02, VIEW-04, UX-02
**Success Criteria** (what must be TRUE):
  1. Each blog post page displays a view count alongside the date and reading time
  2. Visiting a blog post increments its view count (visible on reload)
  3. Blog post pages are still listed in the Next.js build output as static (no dynamic regression)
  4. A placeholder element is always present in the HTML before the view count loads, preventing layout shift
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Listing & Polish
**Goal**: View counts appear on the blog listing page and the entire feature handles edge cases gracefully
**Depends on**: Phase 4
**Requirements**: VIEW-03, UX-01, UX-03
**Success Criteria** (what must be TRUE):
  1. Each post card on the /blog listing page shows its view count without incrementing it
  2. View counts display with locale-aware formatting (e.g., "1,234" not "1234")
  3. If the API is unreachable (network error, Redis down), blog pages still render fully without errors — the view count simply does not appear
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 3 -> 4 -> 5

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Animation Sync & Reveal | v1.3 | 1/1 | Complete | 2026-02-08 |
| 2. Rune Glow Effects | v1.3 | 1/1 | Complete | 2026-02-08 |
| 3. Infrastructure & API | v1.4 | 2/2 | Complete | 2026-02-21 |
| 4. Post Page Integration | v1.4 | 0/? | Not started | - |
| 5. Listing & Polish | v1.4 | 0/? | Not started | - |
