---
status: resolved
phase: 11-seo-branding
source: [11-VERIFICATION.md]
started: 2026-04-03T04:30:00Z
updated: 2026-04-03T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Othala rune favicon in browser tab
expected: Open localhost after npm run dev. Teal diamond-with-legs rune on dusty rose background in browser tab.
result: pass

### 2. Site-level OG image renders correctly
expected: Visit /opengraph-image after build. 1200x630 neobrutalist card with "keech.dev" title, black offset shadow, teal accent bar.
result: pass

### 3. Per-post OG image renders correctly
expected: Visit /blog/[any-slug]/opengraph-image. Post title with responsive font size, date, "keech.dev" teal branding.
result: issue
reported: "I unfortunately am no longer seeing blog posts when running the server locally."
severity: blocker

### 4. RSS auto-discovery in page source
expected: View source at /. Link rel="alternate" type="application/rss+xml" in head.
result: issue
reported: "RSS link tag is present, but visiting /feed.xml returns a 404 error page."
severity: major

### 5. Homepage logo visible
expected: keech.dev logo visible on the homepage.
result: issue
reported: "keech.dev logo was no longer on the homepage."
severity: blocker

### 6. Projects page content renders
expected: Projects page displays project cards with content.
result: issue
reported: "Projects page is also affected by the same issue that Blog is."
severity: blocker

## Summary

total: 6
passed: 2
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Blog posts render on /blog and per-post OG images are accessible"
  status: resolved
  reason: "User reported: blog posts not showing locally. CSP blocks inline scripts needed for Suspense hydration."
  severity: blocker
  test: 3
  root_cause: "CSP script-src 'self' 'unsafe-eval' in next.config.ts blocks all inline scripts. Next.js App Router emits inline scripts for RSC flight data and hydration. Blog uses useSearchParams() forcing Suspense boundary — content never hydrates."
  artifacts:
    - path: "next.config.ts"
      issue: "CSP script-src missing 'unsafe-inline' or nonce-based approach"
    - path: "src/hooks/use-filtered-list.ts"
      issue: "useSearchParams() forces Suspense, making page fully dependent on client JS"
  missing:
    - "Add 'unsafe-inline' to script-src or implement nonce-based CSP"
  debug_session: ".planning/debug/blog-posts-not-showing.md"

- truth: "RSS feed accessible at /feed.xml"
  status: resolved
  reason: "User reported: visiting /feed.xml returns 404. Feed only exists on v1.6-address-concerns branch, not deployed."
  severity: major
  test: 4
  root_cause: "src/app/feed.xml/route.ts exists and works correctly, but only on v1.6-address-concerns branch — not yet merged to main/preview. The route works on local production build (next start). User tested against deployed site."
  artifacts:
    - path: "src/app/feed.xml/route.ts"
      issue: "Code is correct but not deployed — branch not merged"
  missing:
    - "Merge v1.6-address-concerns to main — no code fix needed"
  debug_session: ".planning/debug/feed-xml-404.md"

- truth: "Homepage logo and client-interactive content renders correctly"
  status: resolved
  reason: "User reported: keech.dev logo no longer on homepage, Projects page also broken. Same CSP root cause as blog."
  severity: blocker
  test: 5
  root_cause: "Same CSP issue as test 3 — inline scripts blocked, preventing client-side hydration across all pages (home, blog, projects)."
  artifacts:
    - path: "next.config.ts"
      issue: "CSP script-src missing 'unsafe-inline' or nonce-based approach"
  missing:
    - "Fix CSP in next.config.ts (same fix as test 3)"
  debug_session: ".planning/debug/blog-posts-not-showing.md"
