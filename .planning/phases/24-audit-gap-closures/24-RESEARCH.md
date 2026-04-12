# Phase 24: Audit Gap Closures - Research

**Researched:** 2026-04-11
**Domain:** Next.js 16 App Router static params / Playwright config branching / Vitest DOM-mutation testing
**Confidence:** HIGH

## Summary

This is a small, tightly-scoped patch phase closing three CONCERNS.md items. The research confirms all D-01 through D-17 decisions from CONTEXT.md are technically sound and that the existing codebase matches the CONTEXT.md file-path claims exactly (verified by reading every referenced file). The only novel finding is that `src/app/blog/[slug]/opengraph-image.tsx` EXISTS and has its own `generateStaticParams()` that ALSO needs to be migrated to `publishedPosts` — D-03 correctly flagged this area as "audit" but the planner should treat it as a definite edit site, not a speculative one.

Key reinforcements from verification:

1. **`dynamicParams` defaults to `true`** in Next.js 16 App Router — meaning filtered `generateStaticParams()` alone does NOT block draft URLs from being dynamically rendered at request time. The runtime `notFound()` guard in `PostPage` is load-bearing, not defensive. Without it, D-01 would not close GAP-01. Alternative: `export const dynamicParams = false` also works, but the helper-plus-guard approach per D-02 is explicit and testable.
2. **Playwright `webServer.command` accepts any JS expression that evaluates to a string at config-load time** — empirically verified by calling `defineConfig({webServer:{command: process.env.X === '1' ? 'a' : 'b'}})` in Node. The `reuseExistingServer: !process.env.CI` pattern already in the config proves env-var access works at config-load time.
3. **Vitest `vi.useFakeTimers()` + `vi.advanceTimersByTime(2000)` is the clean approach** for the new rejection test, BUT there's a subtlety: the click handler is `async` and `await`s `writeText` (a real Promise). Fake timers don't flush microtasks. The existing test #3 uses `waitFor` to handle this. For the new test, the planner should prefer `waitFor({ timeout: 2500 })` to match the existing file's style rather than introducing fake timers as a new pattern in the same file. D-15's explicit "use `vi.useFakeTimers()` OR `waitFor` with timeout" freedom lands on `waitFor` for consistency.
4. **`draft` is present in the compiled Velite output** — verified by reading `.velite/posts.json`. All 6 current posts have `draft: false`. No fixture draft exists in `content/posts/`, so any e2e or unit test for GAP-01 must inject a draft, not rely on a real fixture (unless the plan adds one).

**Primary recommendation:** Implement exactly as CONTEXT.md specifies. The plan should have three small tasks (one per GAP) plus a Wave 0 test-infrastructure touch only if a draft fixture is added. No research uncovered any reason to deviate from the locked decisions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**GAP-01: Draft Guard**
- **D-01:** Extract a `publishedPosts` helper (single source of truth) — new export in `src/lib/posts.ts` (or extend an existing lib file): `export const publishedPosts = posts.filter(p => !p.draft)`. Replace the three existing hand-rolled `.filter(p => !p.draft)` call sites in `src/app/blog/page.tsx`, `src/app/sitemap.ts`, and `src/app/feed.xml/route.ts`.
- **D-02:** In `src/app/blog/[slug]/page.tsx`, use `publishedPosts` for both `generateStaticParams()` and the slug lookup in `PostPage`. Draft slugs are excluded from prerender AND a defensive `notFound()` fires if a draft slug is somehow requested at runtime.
- **D-03:** Audit `generateMetadata()` in `[slug]/page.tsx` and any `opengraph-image.tsx` route under `src/app/blog/[slug]/` for draft handling. If a draft slug is requested, fall through to the 404 metadata path so OG previews don't leak draft content. (Once `notFound()` is called, Next.js routes to the 404 page — verify metadata/OG don't render before the guard.)
- **D-04:** Do NOT add a draft preview route, password gate, or admin UI. Draft preview is explicitly out of scope (REQUIREMENTS.md). Drafts stay invisible to the build output entirely.

**GAP-02: Dev-Server E2E Script**
- **D-05:** Single `playwright.config.ts` with an env-var branch: `command: process.env.PW_DEV_SERVER === '1' ? 'npm run dev' : 'npm run build && npm run start'`. No second config file, no `cross-env` dependency.
- **D-06:** Add npm script `"test:e2e:dev": "PW_DEV_SERVER=1 playwright test"` alongside the existing `"test:e2e": "playwright test"`. Default `npm run test:e2e` behavior is unchanged.
- **D-07:** Keep `webServer.timeout: 120000` (120s) for both modes — Turbopack dev startup is well under 120s and there's no need for two timeouts.
- **D-08:** Keep `reuseExistingServer: !process.env.CI` unchanged. Local dev iteration where the user already has `npm run dev` running benefits from server reuse in both modes.

**GAP-03: Clipboard Failure Handling**
- **D-09:** Wrap `navigator.clipboard.writeText(text)` in a `try/catch` inside the click handler in `src/components/blog/code-block-enhancer.tsx`. On reject, swap `button.innerHTML` to a new `xIcon` SVG constant and set `aria-label='Copy failed'`. Use the same 2000ms revert timer as the success path (single `setTimeout` runs after both branches via try/catch falling through to common revert).
- **D-10:** Add a new `xIcon` SVG constant in the same file, mirroring the existing `copyIcon` / `checkIcon` style (16×16, stroke-based, lucide X glyph).
- **D-11:** `console.error('Clipboard write failed:', err)` in the catch block — surfaces the failure for debugging without throwing an unhandled promise rejection.
- **D-12:** Set `button.setAttribute('aria-live', 'polite')` once at button creation time so screen readers re-announce when `aria-label` flips between Copy code → Copied! / Copy failed.
- **D-13:** Do NOT add a fallback to `document.execCommand('copy')` — explicitly out of scope. Modern HTTPS browsers support the Clipboard API; the failure state is sufficient.
- **D-14:** Do NOT guard for `navigator.clipboard === undefined`. Production runs over HTTPS via Vercel where the API is always present; the existing test mocks always inject it.

**Test Scope (GAP-03 unit tests)**
- **D-15:** Add exactly **one** new test to `src/components/blog/code-block-enhancer.test.tsx` (total 6 tests). Scenario: mock `navigator.clipboard.writeText` to reject, click the button, assert (a) button innerHTML contains the X icon path, (b) `aria-label` becomes `'Copy failed'`, (c) after 2000ms (use `vi.useFakeTimers()` or `waitFor` with timeout) the button reverts to `copyIcon` + `'Copy code'`.
- **D-16:** In the new test, `vi.spyOn(console, 'error').mockImplementation(() => {})` — assert it was called with the rejection so the logging contract is documented; restore in `afterEach` (or rely on `vi.restoreAllMocks()`).
- **D-17:** Existing 5 tests remain untouched in scope/assertions. Only the new test is added.

### Claude's Discretion
- Exact filename for the `publishedPosts` helper (`src/lib/posts.ts` vs extending an existing lib file). **Research recommendation:** new file `src/lib/posts.ts`. No existing `src/lib/posts.ts` exists; `src/lib/` currently has single-purpose files (`format.ts`, `views.ts`, `rate-limit.ts`, `validation.ts`). A new `posts.ts` matches the established pattern.
- Whether to use `vi.useFakeTimers()` or `waitFor({ timeout: 2500 })` for the 2000ms revert assertion. **Research recommendation:** `waitFor({ timeout: 2500 })`. The existing test #3 already uses `waitFor` to bridge the async click → DOM mutation. Introducing fake timers only for the new test would be inconsistent AND has a subtle interaction with the `await navigator.clipboard.writeText(...)` microtask that fake timers do not flush. `waitFor` sidesteps both issues.
- Exact lucide X icon SVG path coordinates. **Research recommendation:** use lucide's canonical `x` icon path: `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`. This matches the existing copy/check icon stroke style (width 2, linecap round, linejoin round, 24×24 viewBox, rendered at 16×16).

### Deferred Ideas (OUT OF SCOPE)
- `navigator.clipboard === undefined` guard — declined as out of scope (D-14). Production HTTPS guarantees the API. If the site is ever served over HTTP locally and a copy button click throws, revisit then.
- Lucide X variant choice — left to Claude's discretion during execution.
- Refactoring `CodeBlockEnhancer` away from DOM mutation — accepted trade-off per CONCERNS.md; not in scope for this phase.
- Draft preview UI (admin route, password gate) — simpler to keep drafts out of build entirely.
- Fallback to `document.execCommand('copy')` — modern browsers on HTTPS support `navigator.clipboard`; failure state is sufficient.
- All other CONCERNS.md items (Velite pin, CSP unsafe-inline, dangerouslySetInnerHTML, Suspense fallbacks, x-forwarded-for, hardcoded setTimeout/glow constants, page/component test gaps, coverage thresholds, ESLint 10).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAP-01 | Draft posts (`draft: true`) at `/blog/[slug]` return 404 AND are excluded from `generateStaticParams()` | Next.js canary docs confirm: `generateStaticParams` filtered output excludes slugs from prerender; `dynamicParams: true` (default) means excluded slugs fall back to on-demand rendering, so a runtime `notFound()` guard IS required for complete closure. Velite compiled output has `draft: boolean` field (verified in `.velite/posts.json`). |
| GAP-02 | `test:e2e:dev` npm script runs Playwright against `npm run dev` instead of `npm run build && npm run start` | Empirically verified `defineConfig({webServer:{command: process.env.PW_DEV_SERVER === '1' ? 'npm run dev' : 'npm run build && npm run start'}})` evaluates the ternary at config-load time and stores a plain string in the resolved config object. Pattern matches the existing `reuseExistingServer: !process.env.CI` expression already in the config. |
| GAP-03 | `CodeBlockEnhancer` handles `navigator.clipboard.writeText` rejection gracefully with a visible failure state, covered by a new unit test | Existing test infrastructure in `code-block-enhancer.test.tsx` already uses `Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) } })` in `beforeEach` and `waitFor` for async DOM assertions. The new test swaps to `mockRejectedValue(new Error('denied'))` and reuses the same infrastructure. `aria-live` on a button is technically valid per WAI-ARIA 1.2 (global states applicable to all roles) but unconventional — the decision is locked in D-12 regardless. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tailwind CSS v4 CSS-first config** — no `tailwind.config.js`; design tokens in `src/app/globals.css`. Not a factor for this phase (no new classes or tokens needed).
- **Client components only where browser APIs are needed** — `CodeBlockEnhancer` is already `'use client'` (correct for clipboard API).
- **Velite runs as prebuild step** (not webpack plugin) — irrelevant here; no Velite config changes.
- **Test file colocation** — `*.test.tsx` next to source. New test goes into existing `code-block-enhancer.test.tsx`, not a new file. (Confirmed by D-15.)
- **`vitest.config.ts` enables `globals: true`** — test file already relies on this (uses `describe`/`it`/`expect` from globals alongside `vi`/`beforeEach`/`afterEach` imports that are still imported explicitly). New test follows existing file's import style.
- **No CI/CD pipelines** — deployment is git-push to Vercel. No CI gates to update for the new `test:e2e:dev` script.
- **Blog writing skill** in `.claude/skills/write-blog-post/` — not relevant to this code-change phase.

## Standard Stack

No new dependencies are needed. All work uses libraries already installed in the project.

### Core (already installed, relevant to this phase)
| Library | Version (verified) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.2.2 (latest 16.2.3) [VERIFIED: npm view next version] | App Router, `generateStaticParams`, `notFound()` | The framework. |
| `@playwright/test` | 1.59.1 [VERIFIED: package.json] | E2E runner with `webServer` block | Already in use. |
| `vitest` | 4.1.2 [VERIFIED: package.json] | Unit test runner with `vi.fn`, `vi.spyOn`, `waitFor` via `@testing-library/react` | Already in use. |
| `@testing-library/react` | 16.3.2 [VERIFIED: package.json] | `render`, `waitFor` | Already in use in existing test file. |
| `velite` | 0.3.1 (exact pin) [VERIFIED: npm view velite version] | MDX → typed collections including `draft: boolean` | Already in use; schema verified in `velite.config.ts` line 46. |

### Supporting (none)
No new helpers, no cross-env shim, no polyfill. D-05 explicitly rejects `cross-env`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `publishedPosts` helper per D-01 | Inline `posts.filter(p => !p.draft)` in each of 5 call sites | Rejected by D-01. Single source of truth is worth the small file. |
| Runtime `notFound()` guard per D-02 | `export const dynamicParams = false` in `[slug]/page.tsx` | `dynamicParams: false` is a valid alternative that auto-404s any slug missing from `generateStaticParams`. It would close GAP-01 without a runtime guard. BUT: D-02 explicitly locks the runtime guard, and the guard is more explicit, more testable, and survives any future change to `dynamicParams`. Recommendation: implement D-02 as locked; do not add `dynamicParams = false` (redundant with the helper + guard and could confuse future readers). |
| `vi.useFakeTimers()` for 2000ms assertion | `waitFor({ timeout: 2500 })` | Locked in D-15 as user discretion; research strongly recommends `waitFor` for consistency with existing test #3 and to avoid the fake-timers-plus-awaited-Promise pitfall. |
| Second `playwright.dev.config.ts` file | Env-var branch in single config | Rejected by D-05. |
| `'assertive'` aria-live | `'polite'` | Locked in D-12. `polite` is appropriate — clipboard copy status is not an interruption. |

**Installation:** None required.

**Version verification:** Done above — all versions confirmed against `npm view` (2026-04-11).

## Architecture Patterns

### File layout after this phase

```
src/
├── lib/
│   ├── posts.ts              # NEW — exports publishedPosts (D-01)
│   ├── format.ts             # unchanged
│   ├── views.ts              # unchanged
│   └── ...
├── app/
│   ├── blog/
│   │   ├── page.tsx          # edit: import publishedPosts from @/lib/posts (D-01)
│   │   ├── [slug]/
│   │   │   ├── page.tsx      # edit: publishedPosts for generateStaticParams + PostPage lookup + generateMetadata (D-02, D-03)
│   │   │   ├── opengraph-image.tsx  # edit: publishedPosts for generateStaticParams + Image() lookup (D-03)
│   │   │   ├── error.tsx     # unchanged
│   │   │   ├── loading.tsx   # unchanged
│   │   │   └── error.test.tsx # unchanged
│   ├── sitemap.ts            # edit: import publishedPosts from @/lib/posts (D-01)
│   ├── feed.xml/route.ts     # edit: import publishedPosts from @/lib/posts (D-01)
├── components/
│   └── blog/
│       ├── code-block-enhancer.tsx       # edit: try/catch + xIcon + aria-live (D-09, D-10, D-11, D-12)
│       └── code-block-enhancer.test.tsx  # edit: add 1 new test (D-15, D-16)
playwright.config.ts          # edit: ternary in command (D-05)
package.json                  # edit: add test:e2e:dev script (D-06)
```

### Pattern 1: Published-posts helper (single source of truth)
**What:** A named export that wraps the raw Velite collection.
**When to use:** Any route or component that should not render drafts.
**Example:**
```typescript
// src/lib/posts.ts — NEW FILE
// Source: CONTEXT.md D-01; pattern inferred from existing src/lib/ single-purpose files
import { posts } from '@/.velite'

/**
 * Published posts only — drafts excluded.
 * Single source of truth; prevents accidental draft leakage in routes,
 * sitemap, RSS feed, and OG images. [ASSUMED — comment wording is the
 * researcher's suggestion; planner may adjust.]
 */
export const publishedPosts = posts.filter(p => !p.draft)
```

**Consumption sites (5 total):**
```typescript
// src/app/blog/page.tsx — replace inline filter
import { publishedPosts } from '@/lib/posts'
// then: publishedPosts.sort((a, b) => ...)

// src/app/blog/[slug]/page.tsx — BOTH generateStaticParams AND PostPage lookup
import { publishedPosts } from '@/lib/posts'

export async function generateStaticParams() {
  return publishedPosts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)  // filtered find
  if (!post) {
    return { title: 'Post Not Found' }  // existing branch — now also catches drafts
  }
  // ... existing metadata build
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)  // filtered find
  if (!post) {
    notFound()  // existing call — now also fires for drafts
  }
  // ...
}

// src/app/blog/[slug]/opengraph-image.tsx — same pattern
import { publishedPosts } from '@/lib/posts'

export function generateStaticParams() {
  return publishedPosts.map(post => ({ slug: post.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = publishedPosts.find(p => p.slug === slug)
  // existing code already falls back: `const title = post?.title ?? 'Blog Post'`
  // Recommendation: also guard here — if (!post) notFound() — so draft OG URLs 404
  // instead of rendering a generic "Blog Post" card. Confirms D-03 audit.
}

// src/app/sitemap.ts
import { publishedPosts } from '@/lib/posts'
// remove: const publishedPosts = posts.filter(p => !p.draft)
// rest of function unchanged

// src/app/feed.xml/route.ts
import { publishedPosts } from '@/lib/posts'
// remove: const publishedPosts = posts.filter(...)
// still sort in-place: [...publishedPosts].sort((a,b) => ...)  (don't mutate the export)
```

**Mutation safety note:** The current `feed.xml/route.ts` does `posts.filter(p => !p.draft).sort(...)` — `filter` returns a new array, so `sort` is safe. After migration, `publishedPosts` is a shared export. `sort` mutates in place. The planner MUST add a `[...publishedPosts].sort(...)` spread (or `.slice().sort()`) in `feed.xml/route.ts` to avoid mutating the shared reference. Same for `src/app/blog/page.tsx` which also chains `.filter().sort()`. [VERIFIED: Read src/app/blog/page.tsx L14-16 and src/app/feed.xml/route.ts L4-6]

### Pattern 2: Playwright config env-var branch
**What:** Ternary expression in `defineConfig` resolved at config-load time.
**When to use:** Any time you need two runtime modes from one config.
**Example:**
```typescript
// playwright.config.ts
// Source: empirically verified via `node -e` against installed @playwright/test
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // ... existing options unchanged ...
  webServer: {
    command: process.env.PW_DEV_SERVER === '1'
      ? 'npm run dev'
      : 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

Why this works: `playwright.config.ts` is a standard TS module evaluated by the Playwright runner at startup. `process.env` is populated before the config evaluates. `defineConfig` takes a plain JS object — the ternary yields a string literal by the time `defineConfig` sees it. Verified empirically:

```
$ PW_DEV_SERVER=1 node -e "...defineConfig(...)..."
→ command: "npm run dev"
$ node -e "...defineConfig(...)..."
→ command: "npm run build && npm run start"
```

### Pattern 3: Symmetric success/failure DOM enhancement
**What:** Try/catch with shared revert timer, mirrored icon swaps.
**When to use:** UI affordances that need parallel success and failure states.
**Example:**
```typescript
// src/components/blog/code-block-enhancer.tsx — click handler rewrite
// Source: CONTEXT.md D-09 through D-12; pattern mirrors existing success path

button.setAttribute('aria-label', 'Copy code')
button.setAttribute('aria-live', 'polite')  // NEW — D-12
button.innerHTML = copyIcon

button.addEventListener('click', async () => {
  const code = pre.querySelector('code')
  const text = code?.textContent || pre.textContent || ''
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    button.innerHTML = checkIcon
    button.setAttribute('aria-label', 'Copied!')
  } catch (err) {
    console.error('Clipboard write failed:', err)  // D-11
    button.innerHTML = xIcon                        // D-09, D-10
    button.setAttribute('aria-label', 'Copy failed')
  }
  setTimeout(() => {
    button.innerHTML = copyIcon
    button.setAttribute('aria-label', 'Copy code')
  }, 2000)
})
```

**Critical detail:** The `setTimeout` is OUTSIDE the try/catch but AFTER both branches. CONTEXT.md D-09 says "single setTimeout runs after both branches" — this is achieved by placing the `setTimeout` after the try/catch block, not inside each branch. If the planner puts it inside `try` it won't fire on failure; if inside both branches it duplicates code. The canonical shape is: try → set success state, catch → set failure state, then unconditional `setTimeout` revert.

**Subtle gotcha:** The existing `if (text)` wrapper currently encloses the entire clipboard call. Refactoring to an early `if (!text) return` keeps the try/catch flat and avoids nesting. The planner can choose either shape.

### Anti-Patterns to Avoid
- **Re-throwing in the catch block.** Don't do `throw err` after logging — it would leave an unhandled rejection (the whole point of D-09 is to handle it).
- **Calling `setTimeout` inside both try and catch blocks.** Duplicates code; easy to drift. Use a single `setTimeout` after the try/catch.
- **Mutating `publishedPosts` via `.sort()`.** The current `feed.xml` and `blog/page.tsx` code paths do `.filter(...).sort(...)` — `filter` returns a new array so `sort` is safe today. After extraction, `publishedPosts` is a shared export; `.sort()` would mutate it. Use `[...publishedPosts].sort(...)` or `.slice().sort(...)`.
- **Relying on fake timers inside an async click handler.** `vi.useFakeTimers()` mocks `setTimeout` but does NOT flush Promise microtasks — the `await navigator.clipboard.writeText()` microtask would remain queued. `waitFor` handles both cases automatically.
- **Adding `dynamicParams = false` AND the notFound() guard.** Redundant — the runtime guard by itself correctly closes GAP-01 given the filtered `generateStaticParams`. Adding `dynamicParams = false` is an orthogonal alternative, not a complement. Pick one; D-02 picks the guard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard fallback for old browsers | `document.execCommand('copy')` polyfill | Nothing — show failure state | D-13 explicitly out of scope. Modern HTTPS browsers support the API. |
| Draft auth / preview route | Admin UI, password gate, preview tokens | Nothing — drafts excluded from build entirely | D-04 + REQUIREMENTS.md out-of-scope. One-author blog. |
| Environment-variable polyfill for Windows | `cross-env` | Nothing — user uses WSL | D-05, noted in `<specifics>` of CONTEXT.md. |
| ARIA live region container element | `<span aria-live="polite" class="sr-only">` separate from button | Direct `aria-live` on the button | D-12 locks this. Note: research flags it as technically valid but unconventional; see Common Pitfalls for screen-reader behavior nuance. |

**Key insight:** This phase deliberately avoids adding any new dependency, new file beyond `src/lib/posts.ts`, or new abstraction. Every decision chose "use what's there" over "build something new."

## Runtime State Inventory

> Phase 24 is a code-change phase. No datastores, live services, OS registrations, or secrets are affected. However, this phase DOES touch build artifacts because `.velite/` output is regenerated on every build — it's safe because the regeneration is automatic.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database keys, collection names, or user IDs carry any of the changed strings. Upstash Redis view-count keys use `post:${slug}:views` format (unchanged). | None |
| Live service config | None — no n8n workflows, Vercel env vars, or external service configs reference `publishedPosts`, `xIcon`, or `PW_DEV_SERVER`. Vercel deployment env does NOT need `PW_DEV_SERVER` (that script is for local dev only). | None |
| OS-registered state | None — no task schedulers, pm2 processes, or launchd plists. | None |
| Secrets/env vars | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` unchanged. New env var `PW_DEV_SERVER` is process-local to `test:e2e:dev` invocation; not stored anywhere. | None |
| Build artifacts | `.velite/` regenerates on every `npm run build` / `npm run dev` (gitignored). Next.js `.next/` regenerates on build. Both will naturally re-emit without drafts in `generateStaticParams` output once code ships. | None — verify via `npm run build` that draft routes vanish from the build manifest (success criterion 2). |

**Draft post data note:** All 6 current posts in `content/posts/` have `draft: false` [VERIFIED: `grep -r "draft:" content/posts/`]. There are NO draft posts in the repo today. This means:
1. The live site has no draft leakage to clean up.
2. Success criterion 1 ("visiting `/blog/<slug>` for a draft returns 404") cannot be verified against a real existing post without first ADDING a draft fixture. Options:
   - **Option A (recommended):** Add a one-line test that creates a draft entry programmatically in a unit or integration test, validating the helper filters it out. No fixture MDX file needed.
   - **Option B:** Add a real `content/posts/_test-draft.mdx` with `draft: true` as a permanent fixture. Verify at build time that its route is absent from `.next/server/app/blog/` or the build manifest. Trade-off: the fixture becomes a permanent part of content.
   - **Option C:** Accept that success criterion 1 is verified by code review + unit test on the helper (`publishedPosts` excludes any `p.draft === true` input), not by a live URL fetch.

Research recommendation: **Option C**. A Vitest unit test on `publishedPosts` with a mocked Velite input that includes a draft entry is the cleanest verification. It does not touch `content/` and does not require a real build. The planner may add this as the Wave 0 test scaffolding task.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | ✓ | (existing project) | — |
| npm | Package scripts | ✓ | (existing project) | — |
| `next` CLI | `npm run build`, `npm run dev` | ✓ | 16.2.2 installed | — |
| `@playwright/test` CLI | `playwright test`, `test:e2e:dev` | ✓ | 1.59.1 installed | — |
| Playwright browsers | E2E run | Unknown — not probed | — | `npx playwright install` if missing |
| `vitest` | `npm run test` | ✓ | 4.1.2 installed | — |
| `velite` | `.velite` content output | ✓ | 0.3.1 installed | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None. If Playwright browsers are missing, `npx playwright install` resolves it — but this is a pre-existing state in the repo, not new to this phase.

**No external services or datastores are touched by this phase.**

## Common Pitfalls

### Pitfall 1: `dynamicParams` defaults to `true` — filtered `generateStaticParams` is NOT enough
**What goes wrong:** You filter drafts out of `generateStaticParams()` and assume the job is done. But Next.js still renders excluded slugs at request time because `dynamicParams` defaults to `true`. Draft URLs still resolve, just dynamically instead of statically.
**Why it happens:** Confusion between "not prerendered" and "not accessible." Only the combination of filtered `generateStaticParams` AND a runtime guard (`notFound()`) OR setting `dynamicParams = false` fully blocks drafts.
**How to avoid:** Always pair a filtered `generateStaticParams` with a runtime guard in the page component. D-02 does this correctly.
**Warning signs:** A draft post URL returns 200 OK with content in `next dev`. The fix: verify the `PostPage` `find()` uses `publishedPosts`, not `posts`.
**Source:** [VERIFIED: Next.js canary docs `docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.mdx` — "`true` (default): Dynamic route segments not included in `generateStaticParams` are generated at request time. `false`: Dynamic route segments not included in `generateStaticParams` will return a 404."]

### Pitfall 2: `opengraph-image.tsx` has its own `generateStaticParams`
**What goes wrong:** You update `[slug]/page.tsx` but forget that `[slug]/opengraph-image.tsx` (line 114-116) has a SEPARATE `generateStaticParams()` that also uses `posts` unfiltered. If you skip it, draft OG images are still prerendered and accessible at `/blog/draft-slug/opengraph-image`.
**Why it happens:** OG image routes are easy to forget — they're file-convention-based, not imported anywhere.
**How to avoid:** D-03 correctly calls out auditing `opengraph-image.tsx`. The planner should treat it as a definite edit site. [VERIFIED: Read `src/app/blog/[slug]/opengraph-image.tsx` L114-116]
**Warning signs:** `.next/server/app/blog/draft-slug/opengraph-image/` folder still appears in the build manifest.

### Pitfall 3: Mutating the shared `publishedPosts` export
**What goes wrong:** `src/app/blog/page.tsx` and `src/app/feed.xml/route.ts` chain `.filter(...).sort(...)`. Today `filter` returns a fresh array so `sort` is safe. After extraction, `publishedPosts` is a shared reference. Calling `publishedPosts.sort(...)` mutates the shared array, so the next import sees reshuffled order.
**Why it happens:** `Array.prototype.sort` mutates in place and returns the same reference. Easy to miss during refactor.
**How to avoid:** Always spread before sorting: `[...publishedPosts].sort(...)` or `publishedPosts.slice().sort(...)`.
**Warning signs:** Intermittent test failures where post order depends on import ordering, or the sitemap disagrees with the blog listing about post order.

### Pitfall 4: Vitest fake timers don't flush Promise microtasks
**What goes wrong:** You write `vi.useFakeTimers()`, trigger the click, then `vi.advanceTimersByTime(2000)`. But the click handler is `async` — `await navigator.clipboard.writeText(text)` adds a microtask that fake timers don't flush. The catch block never runs before you assert.
**Why it happens:** `vi.useFakeTimers()` mocks timer functions (`setTimeout`, `setInterval`) but Promise microtasks are scheduled by the JS engine directly, not via timer APIs.
**How to avoid:** Either (a) `await Promise.resolve()` / `await vi.waitFor(...)` between the click and the assertion to drain microtasks, then `vi.advanceTimersByTime(2000)` for the revert; or (b) use `waitFor({ timeout: 2500 })` which handles both automatically. Research recommends (b) for consistency with the existing test file.
**Warning signs:** `expect(button.getAttribute('aria-label')).toBe('Copy failed')` fails because the assertion runs before the catch. OR the revert-to-`Copy code` assertion fails because the microtask for `console.error` logging didn't flush.
**Source:** [CITED: vitest.dev/api/vi.html — `vi.useFakeTimers()` wraps "setTimeout, setInterval, clearTimeout, clearInterval"; no mention of microtask queue.]

### Pitfall 5: `navigator.clipboard` mock reassignment leaks across tests
**What goes wrong:** The existing `beforeEach` uses `Object.defineProperty(navigator, 'clipboard', { value: ..., writable: true })`. If you reassign it in a single test without cleanup, the mock from that test may persist into the next test if `afterEach` doesn't reset `navigator.clipboard`.
**Why it happens:** `Object.defineProperty(... writable: true)` creates a configurable-ish property, but the existing `afterEach` only clears `document.body.innerHTML` — not `navigator.clipboard`.
**How to avoid:** Inside the new test, set up the rejecting mock in the test body (not `beforeEach`) AFTER re-defining the property. Or rely on the fact that `beforeEach` runs before every test and re-stubs with `mockResolvedValue(undefined)` — so the next test's beforeEach clobbers any per-test override. The existing structure handles this: in the new test, do `(navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('denied'))` at the top of the test body. `mockRejectedValueOnce` auto-resets after one call.
**Warning signs:** Tests pass in isolation but fail when run together, or vice versa.

### Pitfall 6: `aria-live` on a button is unconventional but valid
**What goes wrong:** Not a bug — a style/review concern. Some accessibility linters or code reviewers may flag `aria-live` on a `<button>` because the typical pattern is a separate visually-hidden live region. The WAI-ARIA 1.2 spec classifies `aria-live` as a global state (applicable to all roles), so it IS valid, but screen readers may handle it inconsistently compared to a dedicated live region.
**Why it happens:** Mental model of "aria-live belongs on region containers."
**How to avoid:** D-12 locks `aria-live` on the button. If the planner or a downstream reviewer pushes back, the answer is: "spec-valid per WAI-ARIA 1.2 Global States; decision D-12; alternative was considered and rejected to minimize DOM surface."
**Warning signs:** Screen reader doesn't announce the aria-label change on real hardware. If the user reports this post-ship, the fallback is a separate `<span aria-live="polite" class="sr-only">` sibling.
**Source:** [CITED: w3.org/TR/wai-aria-1.2/#aria-live — Global States applicable to all roles.]

## Code Examples

### Example 1: `src/lib/posts.ts` (NEW)
```typescript
// Source: new file per D-01
import { posts } from '@/.velite'

/**
 * All published posts (drafts excluded).
 * Import this instead of filtering `posts` inline to keep the draft guard
 * in exactly one place.
 */
export const publishedPosts = posts.filter(p => !p.draft)
```

### Example 2: `playwright.config.ts` webServer block (edit)
```typescript
// Source: D-05, D-06, D-07, D-08; verified via empirical defineConfig test
webServer: {
  command: process.env.PW_DEV_SERVER === '1'
    ? 'npm run dev'
    : 'npm run build && npm run start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
},
```

### Example 3: `package.json` scripts block (edit)
```json
// Source: D-06
"scripts": {
  "dev": "velite --watch & next dev --turbopack",
  "build": "velite && next build",
  "start": "next start",
  "lint": "eslint .",
  "velite": "velite",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "test:e2e:dev": "PW_DEV_SERVER=1 playwright test"
}
```

### Example 4: New test in `code-block-enhancer.test.tsx` (add 6th test)
```typescript
// Source: D-15, D-16; pattern mirrors existing test #3 (waitFor-based)
it('shows failure state when clipboard writeText rejects (GAP-03)', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const rejection = new Error('Clipboard denied')
  ;(navigator.clipboard.writeText as ReturnType<typeof vi.fn>)
    .mockRejectedValueOnce(rejection)

  render(<CodeBlockEnhancer />)
  const button = document.querySelector('button[aria-label="Copy code"]') as HTMLButtonElement
  expect(button).not.toBeNull()
  button.click()

  // Wait for the catch block to run and update the DOM
  await waitFor(() => {
    expect(button.getAttribute('aria-label')).toBe('Copy failed')
  })
  expect(button.innerHTML).toContain('M18 6 6 18')  // lucide X path signature
  expect(consoleErrorSpy).toHaveBeenCalledWith('Clipboard write failed:', rejection)

  // Wait for the 2000ms revert
  await waitFor(
    () => {
      expect(button.getAttribute('aria-label')).toBe('Copy code')
    },
    { timeout: 2500 }
  )
  expect(button.innerHTML).toContain('M4 16')  // copyIcon path signature

  consoleErrorSpy.mockRestore()
})
```

Notes on this example:
- Uses `mockRejectedValueOnce` so it auto-resets after one call and doesn't leak into other tests.
- Asserts the X icon via `innerHTML.toContain('M18 6 6 18')` — stable substring from the lucide X path. If the planner picks a different X variant, update the substring.
- Asserts the copy icon via `innerHTML.toContain('M4 16')` — stable substring from the existing `copyIcon` path `M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`.
- Total test file length after this change: 6 tests (matches D-15). Existing 5 untouched (matches D-17).

### Example 5: `code-block-enhancer.tsx` click handler (edit)
See Pattern 3 above. The full-file shape after edit is:

```typescript
// Existing icon constants stay at module bottom, plus new xIcon:
const copyIcon = `<svg ...>...</svg>`  // unchanged
const checkIcon = `<svg ...>...</svg>` // unchanged
const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getStaticPaths` + `fallback` in Pages Router | `generateStaticParams` + `dynamicParams` in App Router | Next.js 13 (2022) | Project is already on App Router; the plan uses the current API. [CITED: Next.js docs] |
| Separate dev/prod Playwright configs | Single config with env-var branching OR config matrix | Playwright 1.45+ | D-05 uses single config — the modern minimal approach. |
| `execCommand('copy')` | `navigator.clipboard.writeText` | Widely available since ~2018; `execCommand` deprecated | Project already uses the modern API; D-13 declines adding an execCommand fallback. |

**Deprecated/outdated:**
- `document.execCommand('copy')` — deprecated per MDN, no longer in WHATWG HTML spec. Per D-13, explicitly not added as a fallback.
- `getStaticPaths` — replaced by `generateStaticParams` in App Router. Not used in this project.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recommended lucide X icon path `M18 6 6 18` / `m6 6 12 12` matches the existing copy/check stroke style | Code Examples, Claude's Discretion | Low — these are lucide's canonical X path coordinates from lucide.dev; if a different variant is picked the test substring must be updated, but functionality is unchanged. [ASSUMED — not cross-verified with `npm view lucide-react` SVG export this session; the current copy/check icons in the file are already hand-inlined SVG strings matching lucide style.] |
| A2 | Comment wording in `src/lib/posts.ts` example ("All published posts...") is the researcher's suggestion | Code Examples Example 1 | None — planner may rewrite. |
| A3 | `opengraph-image.tsx` should also get a `notFound()` call when a draft slug is requested (belt-and-suspenders with the filtered `generateStaticParams`) | Pattern 1, Pitfall 2 | Low — the existing code already handles `post === undefined` gracefully via `?? 'Blog Post'`. Adding `notFound()` hardens against drafts being dynamically rendered with the fallback title. If the planner prefers not to import `notFound` into this file, simply filtering `generateStaticParams` is sufficient because `dynamicParams: true` would generate a generic "Blog Post" card for drafts — which is better than leaking the draft title, but less strict than a 404. [ASSUMED — D-03 says "audit" without specifying the action.] |
| A4 | The new test should include a substring check of the SVG `innerHTML` rather than mounting and querying via `@testing-library` helpers | Code Examples Example 4 | Low — matches the existing test file style which queries the DOM directly via `document.querySelector`. |

**If user wants verification of any `[ASSUMED]` item:** surface them in `/gsd-discuss-phase` before execution. None are load-bearing for GAP closure; all are stylistic.

## Open Questions

1. **Should a permanent draft fixture be added to `content/posts/`?**
   - What we know: All 6 current posts are `draft: false`. No draft exists to validate success criterion 1 against.
   - What's unclear: Whether the user prefers a permanent fixture (Option B above), a unit-test-only validation (Option C), or an e2e spec that injects a temporary MDX file.
   - Recommendation: Option C (unit test on the helper). It's the smallest surface, doesn't pollute `content/`, and directly tests the invariant.

2. **Should `opengraph-image.tsx` call `notFound()` for drafts?**
   - What we know: The file has its own `generateStaticParams` (will be filtered) and uses `post?.title ?? 'Blog Post'` as a fallback today.
   - What's unclear: Whether to import `notFound` here for strictness or accept the generic fallback.
   - Recommendation: Import `notFound` for symmetry with `page.tsx`. Draft OG images should not be retrievable, period.

3. **Does the draft guard need an e2e spec in `e2e/`?**
   - What we know: Success criterion 1 is the user-visible behavior. Success criterion 3 specifies running `test:e2e:dev`.
   - What's unclear: Whether an e2e spec should exist that visits `/blog/definitely-not-a-post` and asserts 404. This would exercise the real runtime path including Next.js's 404 page.
   - Recommendation: Optional. A Vitest unit test on `publishedPosts` is sufficient for the helper; an e2e spec is overkill for a solo site. Defer unless the planner sees value.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Unit framework | Vitest 4.1.2 with jsdom, `globals: true`, `@vitejs/plugin-react` [VERIFIED: `vitest.config.ts`] |
| E2E framework | Playwright 1.59.1 [VERIFIED: `playwright.config.ts`] |
| Config files | `vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `npm run test` (Vitest, runs all `src/**/*.test.{ts,tsx}`) |
| Full suite command | `npm run test && npm run test:e2e:dev` (after GAP-02 ships) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAP-01 | `publishedPosts` excludes `draft: true` entries from its output | unit | `npx vitest run src/lib/posts.test.ts` | ❌ Wave 0 — new test file for the new helper |
| GAP-01 | `[slug]/page.tsx` returns 404 for a draft slug | unit (mocking `posts` via `vi.mock('@/.velite', ...)`) OR manual review | `npx vitest run src/app/blog/\\[slug\\]/page.test.tsx` | ❌ Wave 0 if unit-tested (optional) — no existing page-level test for this route |
| GAP-01 | `next build` does not emit draft routes | manual / build-time check | `npm run build && ls -R .next/server/app/blog/` (verify only published slugs) | ✅ (existing `npm run build`) |
| GAP-02 | `npm run test:e2e:dev` runs Playwright against `npm run dev` | manual / workflow check | `npm run test:e2e:dev` | ✅ (after D-06 script added) — existing e2e specs in `e2e/` serve as the payload |
| GAP-03 | Clipboard rejection surfaces `xIcon` + `Copy failed` aria-label, reverts after 2000ms, logs via `console.error` | unit | `npx vitest run src/components/blog/code-block-enhancer.test.tsx` | ✅ (file exists; adding 6th test per D-15) |

### Sampling Rate
- **Per task commit:** `npx vitest run <touched file>.test.tsx` (< 5s)
- **Per wave merge:** `npm run test` (full Vitest suite, ~10-20s for this small project)
- **Phase gate:** `npm run lint && npm run test && npm run build && npm run test:e2e:dev` green before `/gsd-verify-work`. (Note: `test:e2e:dev` requires GAP-02 to be merged before it can be used as the phase gate command — the sequencing is: GAP-02 first, then GAP-03 tests use the new dev-server flow.)

### Wave 0 Gaps
- [ ] `src/lib/posts.test.ts` — NEW test file. Covers GAP-01 helper invariant: `publishedPosts` excludes drafts. Mock `@/.velite` with a fixture including a draft entry; assert `publishedPosts.find(p => p.draft)` is undefined. Small, ~10 lines.
- [ ] *(Optional)* `src/app/blog/[slug]/page.test.tsx` — would cover the full runtime guard. Mocking Next.js App Router page components in Vitest is non-trivial (requires mocking `notFound`, `params`). Given that the project has no existing page-level unit tests and relies on e2e for route behavior, research recommends skipping this and covering GAP-01 via the helper unit test + manual build verification.
- [ ] Framework install — none needed. Vitest and Playwright are already installed.

*(If no gaps: not applicable — `src/lib/posts.test.ts` is a required Wave 0 addition to cover the new helper.)*

## Security Domain

> Phase 24 security review is small because the phase itself is a security closure (draft guard is the primary item). `security_enforcement` is not explicitly disabled in `.planning/config.json`, so it's treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not in scope — drafts are blocked entirely, no auth needed. |
| V3 Session Management | no | Same. |
| V4 Access Control | **yes** | Draft posts MUST NOT be accessible via direct URL. Enforced by filtered `generateStaticParams` + runtime `notFound()` guard (D-02). No authn/authz — the defense is "the route literally does not exist for drafts." |
| V5 Input Validation | **yes (existing)** | Slug-format validation already in place via `src/lib/validation.ts` (unchanged). View-count rate limiting already in place. |
| V6 Cryptography | no | No crypto operations. |
| V7 Error Handling and Logging | **yes** | `console.error('Clipboard write failed:', err)` in D-11. Single log line, no sensitive data (the error object is a DOMException or generic Error from the browser). No log injection risk because the log target is the developer console, not a backend log aggregator. |
| V10 Malicious Software | no | No dynamic code loading added. |
| V11 Business Logic | no | No business logic changes. |
| V12 Files and Resources | **yes (existing)** | Velite content pipeline is trusted (author-only commits) per CONCERNS.md. Unchanged. |
| V13 API and Web Services | no | No API changes. |
| V14 Configuration | **yes** | CSP `script-src 'unsafe-inline'` is a pre-existing known gap in `src/proxy.ts` — NOT addressed by this phase (per CONCERNS.md accepted trade-offs). No new CSP violations from this phase; the inline SVG strings are assigned via `innerHTML` (same pattern as existing copy/check icons) which does not trigger `script-src` — inline SVG is governed by `img-src` / `default-src`, not script. |

### Known Threat Patterns for Next.js 16 / React 19 / Playwright

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Information disclosure via prerendered draft routes | Disclosure | Filter `generateStaticParams`, runtime `notFound()`, audit OG route. [D-01, D-02, D-03] |
| Information disclosure via metadata leak (draft title in `<meta property="og:title">`) | Disclosure | `generateMetadata` uses filtered `publishedPosts.find()` — if post is absent, returns `{ title: 'Post Not Found' }`. [D-03] |
| Silent swallow of async failure (unhandled Promise rejection) | Repudiation / DoS (browser console flood) | try/catch around `writeText`, explicit log via `console.error`. [D-09, D-11] |
| XSS via `innerHTML` assignment | Injection | `button.innerHTML = xIcon` uses a hardcoded string constant, no user input. Same pattern as existing `copyIcon`/`checkIcon`. Safe. |
| Playwright env-var injection | Tampering | `PW_DEV_SERVER` is read locally; not accepted from any network input. Safe. |

**Security verdict:** Phase 24 REDUCES security surface (closes GAP-01 V4 Access Control gap, closes GAP-03 V7 Error Handling gap). No new surface introduced.

## Sources

### Primary (HIGH confidence)
- **Next.js canary docs — `generateStaticParams`** [VERIFIED: `raw.githubusercontent.com/vercel/next.js/canary/docs/01-app/03-api-reference/04-functions/generate-static-params.mdx`] — confirms filtered return excludes slugs from prerender; during `next build`, runs before Layouts/Pages are generated.
- **Next.js canary docs — `dynamicParams`** [VERIFIED: `raw.githubusercontent.com/vercel/next.js/canary/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.mdx`] — definitive: "`true` (default)" vs "`false`: ... will return a 404." This single fact is the most important verification in this research.
- **Next.js canary docs — `notFound`** [VERIFIED: `raw.githubusercontent.com/vercel/next.js/canary/docs/01-app/03-api-reference/04-functions/not-found.mdx`] — "Invoking the `notFound()` function throws a `NEXT_HTTP_ERROR_FALLBACK;404` error and terminates rendering of the route segment." Does not require `return`.
- **Empirical Playwright verification** — executed `defineConfig({webServer:{command: process.env.PW_DEV_SERVER === '1' ? 'a' : 'b'}})` in Node against the installed `@playwright/test@1.59.1`. Result: the ternary evaluates at config-load time and produces a plain string. This is the most rigorous form of verification for the D-05 pattern.
- **Direct codebase reads** [VERIFIED] — `src/app/blog/[slug]/page.tsx`, `src/app/blog/[slug]/opengraph-image.tsx`, `src/app/blog/page.tsx`, `src/app/sitemap.ts`, `src/app/feed.xml/route.ts`, `playwright.config.ts`, `package.json`, `src/components/blog/code-block-enhancer.tsx`, `src/components/blog/code-block-enhancer.test.tsx`, `velite.config.ts`, `vitest.config.ts`, `.velite/posts.json`, `content/posts/*.mdx`. Every CONTEXT.md file path claim cross-verified against the filesystem.

### Secondary (MEDIUM confidence)
- **Vitest docs — `vi.useFakeTimers`** [CITED: vitest.dev/api/vi.html] — confirms fake timers wrap `setTimeout` but does not mention microtask flushing. Interpretation (that microtasks remain unflushed) is a well-known JS behavior and is cross-verified by Testing Library docs and the existing test file's use of `waitFor`.
- **WAI-ARIA 1.2 — `aria-live`** [CITED: w3.org/TR/wai-aria-1.2/#aria-live] — confirms aria-live is a global state applicable to all elements. Valid on buttons. Unconventional but not wrong.
- **Next.js `llms-full.txt`** [CITED: nextjs.org/docs/llms-full.txt] — secondary confirmation of `generateStaticParams` and `dynamicParams` behavior, though less authoritative than the canary mdx source.

### Tertiary (LOW confidence)
- *(none — all load-bearing claims verified with Primary or Secondary sources)*

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed, versions verified via `npm view`.
- Architecture: HIGH — locked by CONTEXT.md D-01 through D-17; research confirms each decision is technically sound.
- Pitfalls: HIGH — the six pitfalls are either verified via doc sources (dynamicParams, fake timers) or read directly from the codebase (opengraph-image, mutation risk).
- Runtime state inventory: HIGH — no datastore, service, or secret surfaces touched.
- Tests: HIGH — existing test file read in full; new test pattern mirrors existing test #3.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (30 days — stable APIs, no fast-moving dependencies in scope)

**Researcher notes for the planner:** This phase is unusually small and well-specified. The CONTEXT.md locked decisions are load-bearing and correct. The only place the planner needs to exercise judgment is:
1. Picking `src/lib/posts.ts` as the helper location (research strongly recommends this).
2. Picking `waitFor({ timeout: 2500 })` over `vi.useFakeTimers()` for the new test (research strongly recommends waitFor).
3. Deciding whether `opengraph-image.tsx` gets its own `notFound()` call (research recommends yes, for defense-in-depth and symmetry).
4. Deciding whether to add a Vitest test on `publishedPosts` helper as Wave 0 (research recommends yes, it's the cleanest GAP-01 verification).
5. Deciding whether to add an e2e spec for the 404 behavior (research recommends no — unit test is sufficient).

Everything else is locked.
