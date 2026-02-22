# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** A polished, intentional developer portfolio — fast, visually distinctive, and well-crafted in every detail.
**Current focus:** Phase 5: Listing Polish

## Current Position

Phase: 5 of 5 (Listing Polish)
Plan: 2/2 complete
Status: Phase 5 Complete -- All milestone phases done
Last activity: 2026-02-22 — Completed 05-02 Blog Listing View Counts

Progress: [████████████████████] 100% (milestone phases 3/3)

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: ~5 min
- Total execution time: ~1h 21min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-animation-sync-reveal | 1 | ~15min | ~15min |
| 02-rune-glow-effects | 1 | ~45min | ~45min |
| 03-infrastructure-api | 2 | ~3min | ~1.5min |
| 04-post-page-integration | 2 | ~6min | ~3min |
| 05-listing-polish | 2 | ~4min | ~2min |
| quick-1 through quick-8 | 8 | ~14min | ~2min |

*Updated after each plan completion*
| Phase 05 P01 | 1min | 2 tasks | 3 files |
| Phase 05 P02 | 3min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- Reading time is already implemented via Velite `s.metadata()` — zero new work required
- Use `@upstash/redis` (not deprecated `@vercel/kv`) with `Redis.fromEnv()`
- IP deduplication uses SHA-256 hashing with 24h TTL — never store raw IPs
- View count fires from client component `useEffect` to avoid static-to-dynamic regression
- Replaced pipeline with two-step SET NX + conditional INCR for correctness over ~1-2ms latency
- Dedup enforced at API layer -- repeat POSTs skip INCR entirely instead of always incrementing
- POST returns `{ slug, views, deduplicated }` so Phase 4 client knows repeat visits
- No slug validation against published posts -- harmless orphan keys
- Redis key prefixes: `views:` for counters, `dedup:` for IP dedup keys
- Shimmer uses opacity pulse (not gradient sweep) matching neobrutalist hard-edge aesthetic
- ViewCounter uses useRef guard for StrictMode double-mount protection
- Silent error handling on view count fetch failure; shimmer stays visible
- [Phase 04]: Replaced shimmer placeholder with localStorage caching for flicker-free view count display
- [Phase 04]: useLayoutEffect reads cached count before paint to prevent hydration mismatch
- [Phase 05]: Extracted formatViewCount() to src/lib/views.ts for shared use between ViewCounter and listing cards
- [Phase 05]: Batch endpoint uses redis.mget() for single round-trip retrieval of all view counts
- [Phase 05]: Render-prop pattern keeps PostCard server-renderable while ListingViewCounts owns client boundary
- [Phase 05]: useLayoutEffect reads localStorage cache before paint for instant listing view count display

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Sync rune glow fade-in timing to start simultaneously | 2026-02-09 | b02b015 | [1-sync-rune-glow-fade-in-timing-to-start-s](./quick/1-sync-rune-glow-fade-in-timing-to-start-s/) |
| 2 | Address npm audit vulnerabilities (remove colorable, rewrite validate-colors) | 2026-02-09 | c39de54 | [2-address-npm-audit-vulnerabilities](./quick/2-address-npm-audit-vulnerabilities/) |
| 3 | Randomized rune glow entrance order (power curve, shuffled per load) | 2026-02-09 | fb14daf | [3-revert-sequential-rune-glow-fade-in-and-](./quick/3-revert-sequential-rune-glow-fade-in-and-/) |
| 4 | Wider blog post layout (max-w-6xl) + anchor scroll offset for headings | 2026-02-12 | 89337c6 | [4-improve-blog-post-readability-wider-cont](./quick/4-improve-blog-post-readability-wider-cont/) |
| 5 | Create /write-blog-post Claude Code skill with writing guide and example | 2026-02-15 | 0957511 | [5-create-claude-code-skill-for-writing-blo](./quick/5-create-claude-code-skill-for-writing-blo/) |
| 6 | Blog post h2/h3 headings with teal accent bottom borders | 2026-02-15 | bd99416 | [6-improve-blog-post-section-headers-to-be-](./quick/6-improve-blog-post-section-headers-to-be-/) |
| 7 | Increased blog post heading sizes for stronger visual hierarchy | 2026-02-15 | 328ee62 | [7-improve-visibility-of-blog-post-section-](./quick/7-improve-visibility-of-blog-post-section-/) |
| 8 | Back-to-blog navigation link on blog post pages | 2026-02-16 | a9f1ed9 | [8-add-back-to-blog-navigation-link-on-blog](./quick/8-add-back-to-blog-navigation-link-on-blog/) |

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 05-02-PLAN.md (Blog Listing View Counts) -- Phase 5 complete, all milestone phases done
Resume file: N/A -- all plans complete
