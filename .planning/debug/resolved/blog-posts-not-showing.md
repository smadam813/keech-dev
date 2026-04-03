---
status: resolved
trigger: "Investigate why blog posts are no longer showing when running the Next.js dev server locally"
created: 2026-04-03T04:44:00Z
updated: 2026-04-03T04:50:00Z
---

## Current Focus

hypothesis: CSP script-src directive blocks inline scripts required for React hydration
test: Confirmed - 26 inline scripts on /blog page, CSP lacks 'unsafe-inline' for script-src
expecting: N/A - confirmed
next_action: Report diagnosis

## Symptoms

expected: Blog listing page shows post cards when visiting /blog in the browser
actual: Blog heading ("Blog") renders but no post cards appear below it
errors: Browser console likely shows CSP violations for inline scripts
reproduction: Run `npm run dev`, visit http://localhost:3000/blog in browser
started: After phase 9 (CSP addition) + phase 10 (useSearchParams refactor)

## Eliminated

- hypothesis: Velite compilation failure
  evidence: `npm run velite` succeeds in 687ms, .velite/posts.json contains all 5 posts with draft=false
  timestamp: 2026-04-03T04:44:00Z

- hypothesis: Draft filtering removes all posts
  evidence: All 5 posts have draft=false in posts.json
  timestamp: 2026-04-03T04:44:00Z

- hypothesis: Blog page code has a bug
  evidence: blog/page.tsx correctly filters and passes posts to FilteredPostList. `npm run build` succeeds and generates all 5 blog post pages.
  timestamp: 2026-04-03T04:45:00Z

- hypothesis: Phase 11 code changes broke blog
  evidence: Phase 11 only added OG images, RSS feed, favicons, sitemap fixes. No changes to blog page, velite config, or next config.
  timestamp: 2026-04-03T04:45:00Z

## Evidence

- timestamp: 2026-04-03T04:44:00Z
  checked: .velite/ directory and posts.json
  found: All 5 posts compiled with draft=false, valid data
  implication: Content pipeline is working correctly

- timestamp: 2026-04-03T04:45:00Z
  checked: npm run build
  found: Build succeeds, all 5 blog posts statically generated, blog listing page generates
  implication: Code is structurally correct

- timestamp: 2026-04-03T04:46:00Z
  checked: Server-rendered HTML for /blog
  found: Blog heading renders in HTML, but post list area contains only Suspense placeholder `<!--$?--><template id="B:0"></template><!--/$-->`
  implication: FilteredPostList is inside Suspense boundary (because useSearchParams), so posts only render via client-side JavaScript

- timestamp: 2026-04-03T04:47:00Z
  checked: RSC flight data in inline scripts
  found: All 5 post titles and data ARE present in inline <script> tags in the page HTML
  implication: Server correctly serializes post data for client hydration

- timestamp: 2026-04-03T04:48:00Z
  checked: Response headers for /blog
  found: CSP header: `script-src 'self' 'unsafe-eval' https://va.vercel-scripts.com` - missing 'unsafe-inline'
  implication: All 26 inline scripts on the page are blocked by CSP

- timestamp: 2026-04-03T04:48:30Z
  checked: next.config.ts CSP definition
  found: Added in commit 8b8cd9c (phase 9, feat(09-01)). Never included 'unsafe-inline' for script-src.
  implication: CSP has been blocking inline scripts since phase 9

- timestamp: 2026-04-03T04:49:00Z
  checked: Phase 10 refactoring
  found: Phase 10 introduced useFilteredList hook with useSearchParams(), requiring Suspense boundary. Before phase 10, blog posts rendered server-side.
  implication: Phase 10 made blog listing dependent on client-side JavaScript that phase 9's CSP blocks

## Resolution

root_cause: The Content-Security-Policy in next.config.ts has `script-src 'self' 'unsafe-eval'` which blocks inline `<script>` tags. Next.js App Router (especially with Turbopack in dev mode) relies heavily on inline scripts for React Server Component flight data and hydration bootstrapping. The blog listing page is uniquely affected because `useSearchParams()` in the `useFilteredList` hook forces the `FilteredPostList` component into a `<Suspense>` boundary, meaning it renders NOTHING server-side and depends entirely on client-side JavaScript hydration to display posts. With inline scripts blocked by CSP, the hydration never runs and the Suspense boundary never resolves.

fix: 
verification: 
files_changed: [next.config.ts]
