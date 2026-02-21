# Requirements: keech.dev

**Defined:** 2026-02-21
**Core Value:** A polished, intentional developer portfolio — fast, visually distinctive, and well-crafted in every detail.

## v1.4 Requirements

Requirements for Blog Stats milestone. Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: Upstash Redis client configured via `Redis.fromEnv()` with Vercel Marketplace env vars
- [ ] **INFRA-02**: POST `/api/views/[slug]` increments view count and returns new total
- [ ] **INFRA-03**: GET `/api/views/[slug]` returns current view count without incrementing
- [ ] **INFRA-04**: IP-based deduplication with SHA-256 hashing and 24h TTL prevents refresh spam
- [ ] **INFRA-05**: Route handler uses `force-dynamic` to prevent build-time caching

### View Display

- [ ] **VIEW-01**: View count displayed on individual blog post page alongside date and reading time
- [ ] **VIEW-02**: View count increments on post page visit via client component (fires after hydration)
- [ ] **VIEW-03**: View count displayed on blog listing post cards (GET-only, no increment)
- [ ] **VIEW-04**: Blog post pages remain statically generated (no static-to-dynamic regression)

### Polish

- [ ] **UX-01**: View count formatted with locale-aware number separators
- [ ] **UX-02**: Placeholder element always rendered to prevent CLS when count loads
- [ ] **UX-03**: Graceful degradation when API is unreachable (page renders without count, no error)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Analytics

- **ANLYT-01**: Sort blog posts by popularity toggle
- **ANLYT-02**: View count in Open Graph metadata

## Out of Scope

| Feature | Reason |
|---------|--------|
| Reading time implementation | Already implemented via Velite `s.metadata()` — displayed in post-card.tsx and [slug]/page.tsx |
| Admin analytics dashboard | Use Vercel Analytics instead — don't rebuild it |
| Engagement features (likes/reactions) | Separate milestone requiring session management |
| Real-time view counter (WebSocket) | Over-engineered for a personal blog with low traffic |
| OAuth/session-based dedup | IP hash with 24h TTL is sufficient for personal blog scale |
| `@vercel/kv` package | Deprecated for new projects as of Dec 2024 — use `@upstash/redis` directly |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 3 | Pending |
| INFRA-02 | Phase 3 | Pending |
| INFRA-03 | Phase 3 | Pending |
| INFRA-04 | Phase 3 | Pending |
| INFRA-05 | Phase 3 | Pending |
| VIEW-01 | Phase 4 | Pending |
| VIEW-02 | Phase 4 | Pending |
| VIEW-03 | Phase 5 | Pending |
| VIEW-04 | Phase 4 | Pending |
| UX-01 | Phase 5 | Pending |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 5 | Pending |

**Coverage:**
- v1.4 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after roadmap creation*
