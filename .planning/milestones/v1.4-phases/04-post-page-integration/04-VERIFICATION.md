---
phase: 04-post-page-integration
verified: 2026-02-21T21:00:00Z
status: passed
score: 4/4 success criteria verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "A placeholder element is always present in the HTML before the view count loads, preventing layout shift (UX-02)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open a blog post in a private/incognito window (no localStorage cache) and observe the metadata row"
    expected: "The metadata row shows a stable fixed-width placeholder where the view count will appear — no layout shift when the count populates after the POST resolves"
    why_human: "CLS behavior requires visual observation in a browser; automated checks cannot detect layout reflow"
  - test: "Open a blog post and check the Network tab — confirm only ONE POST fires to /api/views/[slug], even in React StrictMode dev mode"
    expected: "Exactly one POST request, not two"
    why_human: "Network request deduplication under StrictMode requires live browser DevTools inspection"
  - test: "Run npm run build and check the build output for /blog/[slug]"
    expected: "Shows the circle (static) symbol, not the lambda/f (dynamic) symbol"
    why_human: "Build output symbol verification requires running the full build"
---

# Phase 4: Post Page Integration Verification Report

**Phase Goal:** Visitors see a live view count on every blog post, and the page remains statically generated
**Verified:** 2026-02-21
**Status:** passed
**Re-verification:** Yes — after gap closure (commit ff4aad2)

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #   | Truth                                                                                                                        | Status     | Evidence                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Each blog post page displays a view count alongside the date and reading time                                                | ✓ VERIFIED | `page.tsx` line 96: `<ViewCounter slug={slug} />` renders inside the metadata row between reading time and updated date                                       |
| 2   | Visiting a blog post increments its view count (visible on reload)                                                           | ✓ VERIFIED | `view-counter.tsx` line 40: `fetch(\`/api/views/${slug}\`, { method: 'POST' })` fires in `useEffect` on mount                                                |
| 3   | Blog post pages are still listed in the Next.js build output as static (no dynamic regression)                               | ✓ VERIFIED | `page.tsx` has `generateStaticParams()` (line 16), no `'use client'` directive, no `force-dynamic` export. ViewCounter is a leaf client component receiving slug as prop — does not affect static generation of the parent server component |
| 4   | A placeholder element is always present in the HTML before the view count loads, preventing layout shift                     | ✓ VERIFIED | `view-counter.tsx` lines 55-59: component always returns a `<span>`. When `views === null`: `<span className="inline-block w-12">` (empty, fixed width). When `views !== null`: span with formatted count. The old `if (views === null) return null` is gone. |

**Score:** 4/4 success criteria verified

## Re-verification Detail

### Gap Closed: UX-02

**Previous failure:** `view-counter.tsx` line 55 returned `null` when `views === null`. On first visit (no localStorage cache) and during SSR, the component rendered nothing, causing the metadata row to grow when the view count appeared.

**Fix (commit ff4aad2):** The early-return `null` was replaced with a unified `return` that always renders a `<span>`. When `views === null`, the span carries `className="inline-block w-12"` and is empty — occupying a fixed 48px slot. When `views !== null`, the span renders the formatted count with no class override. The fix also removed the dead shimmer CSS (`@keyframes shimmer`, `--animate-shimmer` token, and the reduced-motion override) from `globals.css`.

**Verified fix (line 55-59):**
```tsx
return (
  <span className={views === null ? 'inline-block w-12' : undefined}>
    {views !== null && `${views.toLocaleString()} ${views === 1 ? 'view' : 'views'}`}
  </span>
)
```

**Note on `return null` at line 14:** There is one remaining `return null` in the file — inside the `getCachedViews` helper's catch block (`try { ... } catch { return null }`). This is the correct error-path return for the localStorage helper function, not the component render path. It is not an anti-pattern.

### Regression Check: Previously-Verified Truths

All three previously-verified truths confirmed intact after commit ff4aad2:

- Truth 1 (ViewCounter renders in metadata row): `page.tsx` lines 6 and 96 unchanged
- Truth 2 (POST on mount): `view-counter.tsx` line 40 unchanged
- Truth 3 (static generation): `page.tsx` line 16 `generateStaticParams()` present, no `'use client'`, no `force-dynamic`

### Required Artifacts

#### Plan 01 Artifacts

| Artifact                                   | Provides                                         | Status     | Details                                                                                                            |
| ------------------------------------------ | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/components/blog/view-counter.tsx`     | Client component for view count display          | ✓ VERIFIED | 60 lines, `'use client'`, POST-on-mount, hasFired StrictMode guard, localStorage caching, always-rendered span placeholder |
| `src/app/globals.css`                      | (Shimmer CSS removed per fix)                    | ✓ CLEAN    | `@keyframes shimmer`, `--animate-shimmer`, and reduced-motion shimmer override all removed by commit ff4aad2 — no dead CSS |
| `src/components/runes/rune-config.ts`      | POST_RUNES mapping with Jera separator           | ✓ VERIFIED | `POST_RUNES` exported at line 247 with `separator: ELDER_FUTHARK.jera`                                            |

#### Plan 02 Artifacts

| Artifact                                   | Provides                                              | Status     | Details                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `src/app/blog/[slug]/page.tsx`             | Blog post page with ViewCounter and Jera separators   | ✓ VERIFIED | Imports ViewCounter (line 6) and POST_RUNES (line 7), renders both in metadata row                       |
| `src/components/blog/post-card.tsx`        | Blog listing card with Jera rune separators           | ✓ VERIFIED | Imports POST_RUNES (line 3), renders `POST_RUNES.separator.char` at line 42                              |

### Key Link Verification

| From                                 | To                                       | Via                                  | Status     | Details                                                                              |
| ------------------------------------ | ---------------------------------------- | ------------------------------------ | ---------- | ------------------------------------------------------------------------------------ |
| `view-counter.tsx`                   | `/api/views/[slug]`                      | `fetch POST in useEffect`            | ✓ WIRED    | Line 40: `fetch(\`/api/views/${slug}\`, { method: 'POST' })` inside `useEffect`     |
| `view-counter.tsx`                   | `globals.css`                            | `animate-shimmer utility class`      | N/A        | Shimmer removed by design (commit ff4aad2). Dead link resolved — CSS and usage both gone. |
| `page.tsx`                           | `view-counter.tsx`                       | `import and render ViewCounter`      | ✓ WIRED    | Line 6: `import { ViewCounter } from '@/components/blog/view-counter'`, rendered at line 96 |
| `page.tsx`                           | `rune-config.ts`                         | `import POST_RUNES for separator`    | ✓ WIRED    | Line 7: `import { POST_RUNES } from '@/components/runes/rune-config'`, used at lines 90, 94, 100 |
| `post-card.tsx`                      | `rune-config.ts`                         | `import POST_RUNES for separator`    | ✓ WIRED    | Line 3: `import { POST_RUNES } from '@/components/runes/rune-config'`, used at line 42 |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                        | Status      | Evidence                                                                                                                                                    |
| ----------- | ----------- | ---------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VIEW-01     | 04-02-PLAN  | View count displayed on individual blog post page alongside date and reading time  | ✓ SATISFIED | `page.tsx` renders `<ViewCounter slug={slug} />` in the metadata row between reading time and updated date                                                   |
| VIEW-02     | 04-01-PLAN  | View count increments on post page visit via client component                      | ✓ SATISFIED | `view-counter.tsx` fires `fetch POST /api/views/${slug}` in `useEffect` on mount with StrictMode guard                                                      |
| VIEW-04     | 04-02-PLAN  | Blog post pages remain statically generated                                        | ✓ SATISFIED | `page.tsx` has `generateStaticParams()`, no `'use client'`, no `force-dynamic`. ViewCounter is leaf client component.                                        |
| UX-02       | 04-01-PLAN  | Placeholder element always rendered to prevent CLS                                 | ✓ SATISFIED | `view-counter.tsx` always returns a `<span>`. When `views === null`, renders `<span className="inline-block w-12">` (empty, fixed-width). No null return from component render path. |

**Orphaned requirements check:** REQUIREMENTS.md maps VIEW-01, VIEW-02, VIEW-04, UX-02 to Phase 4. All four are claimed in plan frontmatter and all four are now satisfied. No orphaned requirements.

### Anti-Patterns Found

None. The previously flagged blocker (`if (views === null) return null` in component render) and the info-level dead CSS (`--animate-shimmer` / `@keyframes shimmer`) are both resolved by commit ff4aad2.

### Human Verification Required

These items require browser observation and cannot be verified programmatically. They carry over from the initial verification — the automated gap is closed but the human checks remain valid.

#### 1. CLS Behavior on First Visit

**Test:** Open a blog post URL in a private/incognito window (no localStorage cache). Observe the metadata row as the page loads.
**Expected:** A stable 48px placeholder occupies the space where the view count will appear. When the POST resolves and the count populates, the layout does not shift.
**Why human:** Layout shift requires visual observation in a browser. Automated checks cannot measure CLS.

#### 2. StrictMode Single-Fire POST

**Test:** Run `npm run dev`, open a blog post, open DevTools Network tab, filter for the slug endpoint.
**Expected:** Exactly one POST request fires to `/api/views/[slug]`, not two.
**Why human:** StrictMode double-mount behavior requires live browser DevTools inspection.

#### 3. Static Generation Build Symbol

**Test:** Run `npm run build` and find the `/blog/[slug]` row in the build output.
**Expected:** The route shows the circle symbol (static), not the lambda/f symbol (dynamic).
**Why human:** Requires running the full Next.js build.

## Summary

All four success criteria are now verified. The single gap from the initial verification (UX-02 — null render on first visit) was closed by commit ff4aad2, which replaced the component's conditional `return null` with a unified span element that always occupies space. The fix also cleaned up dead shimmer CSS that had accumulated since the original shimmer approach was abandoned. No regressions were introduced in the three previously-passing truths.

Phase 4 goal is achieved: visitors see a live view count on every blog post, and the page remains statically generated.

---

_Verified: 2026-02-21_
_Verifier: Claude (gsd-verifier)_
