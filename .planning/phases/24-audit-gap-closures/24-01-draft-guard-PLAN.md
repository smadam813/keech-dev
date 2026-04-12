---
phase: 24
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/posts.ts
  - src/lib/posts.test.ts
  - src/app/blog/[slug]/page.tsx
  - src/app/blog/[slug]/opengraph-image.tsx
  - src/app/blog/page.tsx
  - src/app/sitemap.ts
  - src/app/feed.xml/route.ts
autonomous: true
requirements:
  - GAP-01
tags: [nextjs, app-router, static-params, draft-guard, security]

must_haves:
  truths:
    - "publishedPosts helper exists at src/lib/posts.ts and filters out drafts"
    - "All 5 call sites import publishedPosts instead of filtering posts inline"
    - "generateStaticParams in [slug]/page.tsx maps over publishedPosts"
    - "PostPage slug lookup in [slug]/page.tsx uses publishedPosts.find (so drafts trigger notFound)"
    - "generateMetadata in [slug]/page.tsx uses publishedPosts.find (so draft metadata never leaks)"
    - "generateStaticParams in [slug]/opengraph-image.tsx maps over publishedPosts"
    - "Image() in [slug]/opengraph-image.tsx uses publishedPosts.find (draft OG never rendered)"
    - "No caller mutates the shared publishedPosts reference via .sort() — sort call sites spread first"
    - "npm run build completes successfully with only published slugs prerendered"
  artifacts:
    - path: "src/lib/posts.ts"
      provides: "publishedPosts named export that filters drafts"
      contains: "export const publishedPosts"
    - path: "src/lib/posts.test.ts"
      provides: "Unit test proving publishedPosts excludes draft entries"
      contains: "publishedPosts"
    - path: "src/app/blog/[slug]/page.tsx"
      provides: "Slug page using publishedPosts for params + find"
      contains: "publishedPosts"
    - path: "src/app/blog/[slug]/opengraph-image.tsx"
      provides: "OG image route using publishedPosts for params + find"
      contains: "publishedPosts"
    - path: "src/app/blog/page.tsx"
      provides: "Blog listing using publishedPosts (spread before sort)"
      contains: "publishedPosts"
    - path: "src/app/sitemap.ts"
      provides: "Sitemap using publishedPosts from helper"
      contains: "publishedPosts"
    - path: "src/app/feed.xml/route.ts"
      provides: "RSS route using publishedPosts (spread before sort)"
      contains: "publishedPosts"
  key_links:
    - from: "src/app/blog/[slug]/page.tsx"
      to: "src/lib/posts.ts"
      via: "import { publishedPosts } from '@/lib/posts'"
      pattern: "import.*publishedPosts.*from.*@/lib/posts"
    - from: "src/app/blog/[slug]/opengraph-image.tsx"
      to: "src/lib/posts.ts"
      via: "import { publishedPosts } from '@/lib/posts'"
      pattern: "import.*publishedPosts.*from.*@/lib/posts"
    - from: "src/lib/posts.ts"
      to: "@/.velite posts collection"
      via: "filter on p.draft"
      pattern: "posts\\.filter\\(.*draft"
---

<objective>
Close GAP-01 by extracting a `publishedPosts` helper (single source of truth for draft filtering) and wiring it through every route that renders post content: blog listing, RSS feed, sitemap, dynamic [slug] page (both `generateStaticParams` and `PostPage`), and `[slug]/opengraph-image.tsx` (which has its own `generateStaticParams` at lines 114-116). Drafts are excluded from prerender AND a runtime `notFound()` guard fires if a draft slug is requested, so `dynamicParams: true` (Next.js default) does not leak drafts.

Purpose: Eliminate hand-rolled `.filter(p => !p.draft)` duplication in 3 call sites and close the two silent leaks (slug page lookup + OG image route) that CONCERNS.md flagged. This is a security-adjacent fix — draft posts are information that must not be exposed via direct URL access.

Output: `src/lib/posts.ts` + test, 5 edited call sites, verified build with no draft routes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/24-audit-gap-closures/24-CONTEXT.md
@.planning/phases/24-audit-gap-closures/24-RESEARCH.md
@.planning/phases/24-audit-gap-closures/24-VALIDATION.md
@./CLAUDE.md

<interfaces>
<!-- Velite posts collection shape (from velite.config.ts + runtime verification) -->
<!-- Executor: use these types directly — no codebase exploration needed -->

From @/.velite (generated):
```typescript
// Each post entry includes (minimum) these fields:
interface Post {
  slug: string
  title: string
  date: string
  draft: boolean        // <-- the field we filter on
  description?: string
  tags: string[]
  body: string
  toc: TocEntry[]
  readingTime: number
  updated?: string
  excerpt?: string
}
export const posts: Post[]
```

From src/app/blog/[slug]/page.tsx (pre-edit):
```typescript
// generateStaticParams currently: posts.map(post => ({ slug: post.slug }))
// generateMetadata currently: posts.find(p => p.slug === slug) — no draft filter
// PostPage currently: posts.find(p => p.slug === slug) — no draft filter
```

From src/app/blog/[slug]/opengraph-image.tsx (pre-edit, line 114-116):
```typescript
export function generateStaticParams() {
  return posts.map(post => ({ slug: post.slug }))
}
// Image() at line 13: const post = posts.find(p => p.slug === slug)
// Line 19: const title = post?.title ?? 'Blog Post'  — fallback still runs for drafts today
```

From src/app/blog/page.tsx (pre-edit, lines 13-16):
```typescript
const publishedPosts = posts
  .filter(post => !post.draft)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
```

From src/app/sitemap.ts (pre-edit, line 7):
```typescript
const publishedPosts = posts.filter(p => !p.draft)
```

From src/app/feed.xml/route.ts (pre-edit, lines 4-6):
```typescript
const publishedPosts = posts
  .filter(p => !p.draft)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
```
</interfaces>
</context>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Velite content collection → rendered routes | Untrusted authoring state (`draft: true`) crosses into HTTP-accessible routes. A missing filter at any site exposes unpublished content via direct URL. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-24-01 | Information Disclosure | `src/app/blog/[slug]/page.tsx` (generateStaticParams + generateMetadata + PostPage) and `src/app/blog/[slug]/opengraph-image.tsx` | mitigate | (1) Extract `publishedPosts` helper in `src/lib/posts.ts` as single source of truth (D-01). (2) `generateStaticParams` in both files maps over `publishedPosts` (D-02, D-03) so draft slugs are not prerendered. (3) `PostPage` and `generateMetadata` use `publishedPosts.find(...)` so if `dynamicParams: true` (Next.js default) dynamically renders a draft URL, the lookup returns `undefined` and `notFound()` fires (D-02). (4) `opengraph-image.tsx` `Image()` uses `publishedPosts.find(...)` and falls through to `notFound()` (or existing `?? 'Blog Post'` fallback hardened to `notFound()`) so draft OG cards never render (D-03). (5) Unit test in `src/lib/posts.test.ts` proves the helper filters drafts. (6) `npm run build` verification ensures no draft routes appear in `.next/server/app/blog/`. |
| T-24-01b | Information Disclosure | `src/app/sitemap.ts`, `src/app/feed.xml/route.ts`, `src/app/blog/page.tsx` | mitigate | Migrate all three to import `publishedPosts` from `@/lib/posts`. Prevents regression where one call site forgets the filter. Spread before `.sort()` so the shared reference is not mutated (Pitfall 3 from RESEARCH.md). |
</threat_model>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create publishedPosts helper + Wave 0 unit test</name>
  <files>src/lib/posts.ts, src/lib/posts.test.ts</files>
  <read_first>
    - src/lib/format.ts (reference single-purpose lib file style)
    - src/lib/views.ts (reference single-purpose lib file style)
    - velite.config.ts (confirm `draft: boolean` is in the schema and Post type)
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Pattern 1 + Example 1
    - .planning/phases/24-audit-gap-closures/24-CONTEXT.md D-01
  </read_first>
  <behavior>
    - Test 1: `publishedPosts` excludes any entry with `draft: true` from a mocked Velite input
    - Test 2: `publishedPosts` includes all entries with `draft: false` from the mocked input
    - Test 3: `publishedPosts.find(p => p.draft)` returns `undefined` (redundant assertion for the security contract)
  </behavior>
  <action>
    Create two NEW files per D-01 (no existing `src/lib/posts.ts`; research confirmed `src/lib/` uses single-purpose files — new file is the correct pattern).

    **File 1: `src/lib/posts.ts`** — exact content:

    ```typescript
    import { posts } from '@/.velite'

    /**
     * All published posts (drafts excluded).
     * Single source of truth for the draft guard — import this instead of
     * filtering `posts` inline so drafts cannot leak via missed call sites.
     * See .planning/phases/24-audit-gap-closures/24-CONTEXT.md D-01.
     */
    export const publishedPosts = posts.filter(p => !p.draft)
    ```

    **File 2: `src/lib/posts.test.ts`** — Wave 0 unit test. `vitest.config.ts` has `globals: true` but the existing test style in this repo (see `src/components/blog/code-block-enhancer.test.tsx` line 1) imports from `vitest` explicitly. Match that pattern.

    Mock `@/.velite` via `vi.mock` with a fixture containing both draft and non-draft entries, then import `publishedPosts` AFTER the mock (top-level `vi.mock` is hoisted by Vitest). Exact content:

    ```typescript
    import { describe, it, expect, vi } from 'vitest'

    vi.mock('@/.velite', () => ({
      posts: [
        { slug: 'published-one', title: 'Published One', draft: false },
        { slug: 'draft-one',     title: 'Draft One',     draft: true  },
        { slug: 'published-two', title: 'Published Two', draft: false },
        { slug: 'draft-two',     title: 'Draft Two',     draft: true  },
      ],
    }))

    // Import AFTER the mock so the helper sees the mocked posts
    import { publishedPosts } from './posts'

    describe('publishedPosts (GAP-01)', () => {
      it('excludes all entries with draft: true', () => {
        expect(publishedPosts.find(p => p.draft === true)).toBeUndefined()
      })

      it('includes all entries with draft: false', () => {
        const slugs = publishedPosts.map(p => p.slug)
        expect(slugs).toContain('published-one')
        expect(slugs).toContain('published-two')
        expect(slugs).not.toContain('draft-one')
        expect(slugs).not.toContain('draft-two')
      })

      it('returns exactly 2 published entries from the 4-entry fixture', () => {
        expect(publishedPosts).toHaveLength(2)
      })
    })
    ```

    Run `npx vitest run src/lib/posts.test.ts` — all 3 tests must pass.
  </action>
  <verify>
    <automated>cd /home/smada/git/smadam813/keech-dev && npx vitest run src/lib/posts.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - File `src/lib/posts.ts` exists and contains `export const publishedPosts`
    - File `src/lib/posts.ts` contains `posts.filter(p => !p.draft)`
    - File `src/lib/posts.test.ts` exists and contains `vi.mock('@/.velite'`
    - File `src/lib/posts.test.ts` contains 3 `it(` blocks
    - `npx vitest run src/lib/posts.test.ts` exits 0 with 3 tests passing
  </acceptance_criteria>
  <done>
    `publishedPosts` helper exports a draft-filtered array from the Velite collection. Unit test with a mocked fixture proves it excludes drafts. Test passes locally.
  </done>
</task>

<task type="auto">
  <name>Task 2: Migrate sitemap, feed.xml, and blog listing to publishedPosts helper</name>
  <files>src/app/sitemap.ts, src/app/feed.xml/route.ts, src/app/blog/page.tsx</files>
  <read_first>
    - src/app/sitemap.ts (current state — line 7 inline filter)
    - src/app/feed.xml/route.ts (current state — lines 4-6 filter+sort chain)
    - src/app/blog/page.tsx (current state — lines 13-16 filter+sort chain)
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Pitfall 3 (mutation safety — MANDATORY)
    - src/lib/posts.ts (just created in Task 1)
  </read_first>
  <action>
    Replace inline `posts.filter(p => !p.draft)` call sites with `publishedPosts` imported from `@/lib/posts`. **Critical (Pitfall 3 from RESEARCH.md):** `publishedPosts` is a shared module-level export. `Array.prototype.sort()` mutates in place. Call sites that sort MUST spread first — `[...publishedPosts].sort(...)` — otherwise the shared reference is reshuffled and downstream importers see wrong order.

    **File 1: `src/app/sitemap.ts`** — no sort, safe to use directly. Replace the current line 7:

    Before:
    ```typescript
    import { posts, projects } from '@/.velite'
    // ...
    const publishedPosts = posts.filter(p => !p.draft)
    ```

    After:
    ```typescript
    import { projects } from '@/.velite'
    import { publishedPosts } from '@/lib/posts'
    // ...
    // (remove the inline const publishedPosts = ... line entirely)
    ```

    Keep `projects` imported from `@/.velite` (this plan does not touch projects). Rest of the file unchanged.

    **File 2: `src/app/feed.xml/route.ts`** — HAS a chained `.sort()`, MUST spread. Replace entire GET body's top:

    Before (lines 1-7):
    ```typescript
    import { posts } from '@/.velite'

    export function GET() {
      const publishedPosts = posts
        .filter(p => !p.draft)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    ```

    After:
    ```typescript
    import { publishedPosts } from '@/lib/posts'

    export function GET() {
      const sortedPosts = [...publishedPosts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    ```

    Then rename every reference to `publishedPosts` below the GET signature to `sortedPosts` (there are two usages: the `lastBuildDate` template and the `.map(...)` over items). Do NOT leave the name `publishedPosts` referring to the local sorted array — that shadows the import and is confusing.

    **File 3: `src/app/blog/page.tsx`** — HAS a chained `.sort()`, MUST spread. Replace entire function body top:

    Before (lines 1-18):
    ```typescript
    import { Suspense } from 'react'
    import { posts } from '@/.velite'
    import { FilteredPostList } from '@/components/blog/filtered-post-list'
    // ...
    export default function BlogPage() {
      // Filter out drafts and sort by date (newest first)
      const publishedPosts = posts
        .filter(post => !post.draft)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const allTags = [...new Set(publishedPosts.flatMap(p => p.tags))].sort()
    ```

    After:
    ```typescript
    import { Suspense } from 'react'
    import { FilteredPostList } from '@/components/blog/filtered-post-list'
    import { publishedPosts } from '@/lib/posts'
    // ...
    export default function BlogPage() {
      // Sort by date (newest first) — spread first so we don't mutate the shared export
      const sortedPosts = [...publishedPosts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      const allTags = [...new Set(sortedPosts.flatMap(p => p.tags))].sort()
    ```

    Then update the `<FilteredPostList posts={publishedPosts} ...>` prop to `<FilteredPostList posts={sortedPosts} ...>`. Leave everything else (metadata, Suspense wrapper, heading) untouched.

    Do NOT change any other logic (sort direction, filter criteria beyond draft, or return shape).
  </action>
  <verify>
    <automated>cd /home/smada/git/smadam813/keech-dev && npx vitest run && npm run lint</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "from '@/lib/posts'" src/app/sitemap.ts` equals 1
    - `grep -c "from '@/lib/posts'" src/app/feed.xml/route.ts` equals 1
    - `grep -c "from '@/lib/posts'" src/app/blog/page.tsx` equals 1
    - `grep "posts\.filter(p => !p\.draft)" src/app/sitemap.ts` finds nothing
    - `grep "posts\.filter(.*draft)" src/app/feed.xml/route.ts` finds nothing
    - `grep "posts\.filter(.*draft)" src/app/blog/page.tsx` finds nothing
    - `grep "\[\.\.\.publishedPosts\]\.sort" src/app/feed.xml/route.ts` finds the spread
    - `grep "\[\.\.\.publishedPosts\]\.sort" src/app/blog/page.tsx` finds the spread
    - `npx vitest run` exits 0 (no regressions in other test files)
    - `npm run lint` exits 0 (no unused-import errors from removing `posts` imports)
  </acceptance_criteria>
  <done>
    All 3 legacy call sites import `publishedPosts` from `@/lib/posts`. Sort sites spread before sorting so the shared export is not mutated. Lint and existing tests stay green.
  </done>
</task>

<task type="auto">
  <name>Task 3: Migrate [slug]/page.tsx and [slug]/opengraph-image.tsx to publishedPosts (close GAP-01)</name>
  <files>src/app/blog/[slug]/page.tsx, src/app/blog/[slug]/opengraph-image.tsx</files>
  <read_first>
    - src/app/blog/[slug]/page.tsx (current state — lines 1, 18-20, 22-45, 47-53 all use unfiltered `posts`)
    - src/app/blog/[slug]/opengraph-image.tsx (current state — line 4 import, line 13 find, lines 114-116 generateStaticParams)
    - .planning/phases/24-audit-gap-closures/24-CONTEXT.md D-02 and D-03
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Pitfall 1 (dynamicParams defaults to true — the runtime guard is LOAD-BEARING, not defensive)
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Pitfall 2 (opengraph-image has its own generateStaticParams — it's a definite edit site)
    - src/lib/posts.ts (created in Task 1)
  </read_first>
  <action>
    This is the GAP-01 core fix. Close the two silent leaks that v1.8 missed: the dynamic `[slug]/page.tsx` route AND the `[slug]/opengraph-image.tsx` route. Both have their own `generateStaticParams()` that currently map unfiltered `posts`, and both use unfiltered `posts.find(...)` so a draft slug rendered dynamically (because `dynamicParams: true` is the Next.js 16 default) would still resolve.

    **Critical from RESEARCH.md Pitfall 1:** Filtered `generateStaticParams` ALONE does not close GAP-01. `dynamicParams: true` (default) means Next.js will dynamically render any slug not in `generateStaticParams`. The runtime guard (`notFound()` when `publishedPosts.find` returns undefined) is required.

    **File 1: `src/app/blog/[slug]/page.tsx`**

    Change the import on line 1 from `import { posts } from '@/.velite'` to `import { publishedPosts } from '@/lib/posts'`. Then change all three usages of `posts` (lines 19, 24, 49) to `publishedPosts`. Specifically:

    - Line 19: `return posts.map(post => ({ slug: post.slug }))` → `return publishedPosts.map(post => ({ slug: post.slug }))`
    - Line 24: `const post = posts.find(p => p.slug === slug)` (inside `generateMetadata`) → `const post = publishedPosts.find(p => p.slug === slug)` (D-03 — prevents draft metadata leakage)
    - Line 49: `const post = posts.find(p => p.slug === slug)` (inside `PostPage`) → `const post = publishedPosts.find(p => p.slug === slug)` (D-02 — the load-bearing runtime guard)

    Do NOT touch anything else in this file. The `if (!post) notFound()` at line 51 already exists and continues to work — it now also fires for drafts. The `if (!post) return { title: 'Post Not Found' }` at line 26 already exists and now also catches drafts in metadata. Do NOT add `export const dynamicParams = false` (RESEARCH.md Anti-Pattern — redundant with the guard and could confuse future readers).

    **File 2: `src/app/blog/[slug]/opengraph-image.tsx`**

    Change the import on line 4 from `import { posts } from '@/.velite'` to `import { publishedPosts } from '@/lib/posts'`. Then:

    - Line 13 (inside `Image()`): `const post = posts.find(p => p.slug === slug)` → `const post = publishedPosts.find(p => p.slug === slug)`
    - Line 115 (inside `generateStaticParams()`): `return posts.map(post => ({ slug: post.slug }))` → `return publishedPosts.map(post => ({ slug: post.slug }))`

    Then HARDEN the draft leak per D-03 and RESEARCH.md A3: currently line 19 is `const title = post?.title ?? 'Blog Post'` — if a draft slug is dynamically rendered, the OG card shows a generic "Blog Post" title instead of 404'ing. Add a `notFound()` guard immediately after the `find`:

    ```typescript
    import { notFound } from 'next/navigation'
    // ... existing imports ...
    import { publishedPosts } from '@/lib/posts'

    export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
      const { slug } = await params
      const post = publishedPosts.find(p => p.slug === slug)
      if (!post) {
        notFound()
      }
      // ... rest unchanged (but the `?? 'Blog Post'` fallback is now dead code;
      // leave it since TypeScript narrowing after notFound() is correct)
      // ...
    }
    ```

    The `?? 'Blog Post'` fallback at line 19 becomes unreachable after the guard. You may leave it as defensive code OR simplify to `const title = post.title` and `const date = post.date ? formatDate(post.date) : ''`. Prefer the simplified version for clarity — TypeScript will narrow `post` to non-null after `notFound()`.

    Do NOT remove the `alt`, `size`, `contentType` exports. Do NOT touch the ImageResponse JSX (the visual card rendering).
  </action>
  <verify>
    <automated>cd /home/smada/git/smadam813/keech-dev && npx vitest run && npm run lint && npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "from '@/lib/posts'" src/app/blog/\[slug\]/page.tsx` equals 1
    - `grep -c "from '@/lib/posts'" src/app/blog/\[slug\]/opengraph-image.tsx` equals 1
    - `grep "posts.find" src/app/blog/\[slug\]/page.tsx` finds `publishedPosts.find` only (no bare `posts.find`)
    - `grep "posts.find" src/app/blog/\[slug\]/opengraph-image.tsx` finds `publishedPosts.find` only
    - `grep "posts.map(post" src/app/blog/\[slug\]/page.tsx` finds `publishedPosts.map` only
    - `grep "posts.map(post" src/app/blog/\[slug\]/opengraph-image.tsx` finds `publishedPosts.map` only
    - `grep "notFound()" src/app/blog/\[slug\]/opengraph-image.tsx` finds the new guard
    - `grep "dynamicParams" src/app/blog/\[slug\]/page.tsx` finds nothing (we are NOT using this escape hatch)
    - `npm run build` exits 0
    - `npx vitest run` exits 0
    - `npm run lint` exits 0
  </acceptance_criteria>
  <done>
    Both `[slug]/page.tsx` and `[slug]/opengraph-image.tsx` import `publishedPosts`. All `generateStaticParams`, `generateMetadata`, `PostPage`, and `Image` lookups go through the filtered helper. `opengraph-image.tsx` has an explicit `notFound()` guard so draft OG cards never render. `npm run build` succeeds and only prerenders published slugs (all 6 current posts are non-draft, so the build output should be unchanged — verification is that the code path doesn't crash and the helper is wired through every site).
  </done>
</task>

</tasks>

<verification>
- `npx vitest run src/lib/posts.test.ts` — new helper test passes (3 tests green)
- `npx vitest run` — full unit suite green (no regression in existing tests)
- `npm run lint` — no unused-import errors from removed `posts` imports
- `npm run build` — succeeds, prerenders exactly the 6 non-draft slugs (all current posts are published; this verifies wiring, not a real draft exclusion since no draft fixture exists)
- Manual spot-check: `grep -rn "posts.filter(.*draft)" src/app/` returns nothing (all sites migrated to helper)
- Manual spot-check: `grep -rn "from '@/\.velite'" src/app/blog/\[slug\]/` returns `opengraph-image.tsx` only if it still imports the `posts`-adjacent types (it should NOT — both files should import from `@/lib/posts` for post data)
</verification>

<success_criteria>
- GAP-01 closed per ROADMAP.md Phase 24 success criteria 1 and 2:
  1. A draft slug requested at `/blog/<draft-slug>` returns the 404 page (runtime guard fires because `publishedPosts.find` returns `undefined`)
  2. `next build` output excludes draft slugs from `generateStaticParams()` in both `[slug]/page.tsx` and `[slug]/opengraph-image.tsx`
- Single source of truth: exactly one place (`src/lib/posts.ts`) defines what "published" means; 5 consumers import from it
- No mutation of the shared export: both `feed.xml/route.ts` and `blog/page.tsx` spread before sorting
- Zero regressions: existing 5 code-block tests, existing post page rendering, existing sitemap, existing RSS feed all work as before for non-draft posts
</success_criteria>

<output>
After completion, create `.planning/phases/24-audit-gap-closures/24-01-SUMMARY.md` following the summary template in `$HOME/.claude/get-shit-done/templates/summary.md`. Note the migration pattern (helper + 5 consumers) and record the mutation-safety spread as a gotcha worth remembering for future `publishedPosts`-style shared exports.
</output>
