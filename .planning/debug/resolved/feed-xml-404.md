---
status: resolved
trigger: "Investigate why /feed.xml returns a 404 error on the keech.dev Next.js site"
created: 2026-04-03T00:00:00Z
updated: 2026-04-03T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED -- feed.xml route exists only on v1.6-address-concerns branch, not merged to main/preview (production)
test: git show main:src/app/feed.xml/route.ts
expecting: File not found on main
next_action: Report root cause

## Symptoms

expected: Visiting /feed.xml should return RSS XML content
actual: /feed.xml returns 404
errors: 404 Not Found
reproduction: Visit https://keech.dev/feed.xml
started: After phase 11 (seo-branding) added RSS feed feature

## Eliminated

## Evidence

- timestamp: 2026-04-03T00:01:00Z
  checked: File existence at src/app/feed.xml/route.ts
  found: Route handler EXISTS with correct Next.js App Router convention (directory named feed.xml with route.ts inside)
  implication: The file structure is correct for a route handler

- timestamp: 2026-04-03T00:02:00Z
  checked: next build output
  found: Build succeeds, /feed.xml listed as dynamic route (f symbol)
  implication: Next.js recognizes the route -- it compiles and registers correctly

- timestamp: 2026-04-03T00:03:00Z
  checked: layout.tsx RSS link tag
  found: alternates.types includes 'application/rss+xml' pointing to https://keech.dev/feed.xml
  implication: The auto-discovery link is correctly configured

- timestamp: 2026-04-03T00:04:00Z
  checked: next.config.ts
  found: No rewrites, redirects, or route blocking. CSP headers apply to all routes but shouldn't cause 404.
  implication: Config does not interfere with the route

- timestamp: 2026-04-03T00:05:00Z
  checked: Production build and local serve (next build && next start)
  found: Route returns HTTP 200 with valid RSS XML content locally
  implication: The route handler code is correct and functional

- timestamp: 2026-04-03T00:06:00Z
  checked: git show main:src/app/feed.xml/route.ts
  found: "fatal: path exists on disk, but not in 'main'" -- file does NOT exist on main branch
  implication: The route was never deployed to production

- timestamp: 2026-04-03T00:07:00Z
  checked: git show preview:src/app/feed.xml/route.ts
  found: Same result -- file does NOT exist on preview branch either
  implication: Neither production nor preview deployments have this route

- timestamp: 2026-04-03T00:08:00Z
  checked: git log --oneline --follow -- src/app/feed.xml/route.ts
  found: Introduced in commit f164801 (feat(11-02): fix sitemap dates, add RSS feed with auto-discovery) which is only on v1.6-address-concerns
  implication: Phase 11 work has not been merged to any deployed branch

- timestamp: 2026-04-03T00:09:00Z
  checked: git show main:src/app/layout.tsx for RSS link tag
  found: The alternates.types RSS entry is also NOT on main
  implication: If testing on keech.dev production, neither the link tag nor the route exist -- the user may be testing on a Vercel preview deployment of v1.6-address-concerns where the link tag IS present but the route somehow fails, OR they tested locally

## Resolution

root_cause: The feed.xml route handler (src/app/feed.xml/route.ts) and the RSS auto-discovery link tag (in layout.tsx) were added in commit f164801 on the v1.6-address-concerns branch. This branch has NOT been merged to main or preview -- the two branches that Vercel deploys. The route code itself is correct and works perfectly when built and served locally. The 404 occurs because the code simply does not exist on the deployed branch.
fix: Merge v1.6-address-concerns (or at minimum the phase-11 commits) into main to deploy the RSS feed to production.
verification: Locally verified -- next build succeeds, next start serves /feed.xml with HTTP 200 and valid RSS XML content.
files_changed: []
