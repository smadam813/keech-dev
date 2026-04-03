---
phase: 11-seo-branding
plan: "02"
subsystem: seo-feeds-images
tags: [sitemap, rss, responsive-images, cleanup]
dependency_graph:
  requires: []
  provides: [rss-feed, accurate-sitemap, responsive-project-images]
  affects: [src/app/sitemap.ts, src/app/feed.xml/route.ts, src/app/layout.tsx, src/components/projects/project-card.tsx, src/app/projects/[slug]/page.tsx, src/app/about/page.tsx]
tech_stack:
  added: []
  patterns: [rss-2.0-route-handler, content-derived-sitemap-dates, responsive-image-sizes]
key_files:
  created:
    - src/app/feed.xml/route.ts
  modified:
    - src/app/sitemap.ts
    - src/app/layout.tsx
    - src/components/projects/project-card.tsx
    - src/app/projects/[slug]/page.tsx
    - src/app/about/page.tsx
decisions:
  - "Used content-derived dates for all sitemap entries instead of new Date()"
  - "Hardcoded about page date to 2026-02-01 since about content rarely changes"
  - "RSS feed uses RSS 2.0 with Atom self-link for maximum reader compatibility"
metrics:
  duration: "~1min"
  completed: "2026-04-03"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 11 Plan 02: Sitemap Date Fix, RSS Feed, Project Image Sizes, Resume Cleanup Summary

Accurate sitemap dates from Velite content, RSS 2.0 feed at /feed.xml with auto-discovery, responsive sizes on project images, and resume placeholder removal.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Fix sitemap dates and create RSS feed with discovery link | 3ffee62 | Replaced bare `new Date()` with content dates, created RSS route handler, added `alternates` metadata |
| 2 | Add project image sizes attributes and remove resume placeholder | 1beb968 | Added `sizes` to project card/detail images, removed disabled resume button and unused import |

## Key Changes

### Sitemap Date Fix (SEO-04)
- Static routes now derive dates from latest content (`latestPostDate`, `latestProjectDate`, `latestContentDate`)
- Blog routes use `post.updated || post.date` (prefers updated date)
- Project routes use `project.updated || project.date` (prefers updated date)
- Zero bare `new Date()` calls remaining in sitemap

### RSS Feed (SEO-05)
- New route handler at `src/app/feed.xml/route.ts` serving RSS 2.0 XML
- Filters out draft posts, sorts by date descending
- Includes Atom self-link for spec compliance
- Cache-Control header: 1 hour public cache
- Auto-discovery via `alternates.types` in root layout metadata

### Responsive Project Images (SEO-06)
- Project card: `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` matching 1/2/3 column grid
- Project detail: `sizes="(max-width: 1200px) 100vw, 1200px"` matching max-w container

### Resume Placeholder Removal (CLN-02)
- Removed entire disabled button block and comment from about page
- Removed unused `Download` import from lucide-react

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm run build` passes successfully
- Sitemap contains zero bare `new Date()` calls
- RSS feed route registered at `/feed.xml` (visible in build output as dynamic route)
- Project images include `sizes` attribute
- About page contains no "Resume" or "Download" references

## Known Stubs

None.
