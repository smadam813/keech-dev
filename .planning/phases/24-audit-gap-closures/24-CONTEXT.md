# Phase 24: Audit Gap Closures - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the three CONCERNS.md items that v1.8 left out of scope so the audit backlog is fully resolved:

- **GAP-01** — Draft posts (`draft: true`) at `/blog/[slug]` return 404 and are excluded from `generateStaticParams()`.
- **GAP-02** — A `test:e2e:dev` npm script runs Playwright against `npm run dev` instead of `npm run build && npm run start`.
- **GAP-03** — `CodeBlockEnhancer` handles `navigator.clipboard.writeText` rejection gracefully with a visible failure state, plus a unit test for the failure path.

This phase only fixes these three gaps. Other CONCERNS.md items (Velite pin, CSP unsafe-inline, dangerouslySetInnerHTML, etc.) are accepted trade-offs and remain out of scope per REQUIREMENTS.md.

</domain>

<decisions>
## Implementation Decisions

### GAP-01: Draft Guard
- **D-01:** Extract a `publishedPosts` helper (single source of truth) — new export in `src/lib/posts.ts` (or extend an existing lib file): `export const publishedPosts = posts.filter(p => !p.draft)`. Replace the three existing hand-rolled `.filter(p => !p.draft)` call sites in `src/app/blog/page.tsx`, `src/app/sitemap.ts`, and `src/app/feed.xml/route.ts`.
- **D-02:** In `src/app/blog/[slug]/page.tsx`, use `publishedPosts` for both `generateStaticParams()` and the slug lookup in `PostPage`. Draft slugs are excluded from prerender AND a defensive `notFound()` fires if a draft slug is somehow requested at runtime.
- **D-03:** Audit `generateMetadata()` in `[slug]/page.tsx` and any `opengraph-image.tsx` route under `src/app/blog/[slug]/` for draft handling. If a draft slug is requested, fall through to the 404 metadata path so OG previews don't leak draft content. (Once `notFound()` is called, Next.js routes to the 404 page — verify metadata/OG don't render before the guard.)
- **D-04:** Do NOT add a draft preview route, password gate, or admin UI. Draft preview is explicitly out of scope (REQUIREMENTS.md). Drafts stay invisible to the build output entirely.

### GAP-02: Dev-Server E2E Script
- **D-05:** Single `playwright.config.ts` with an env-var branch: `command: process.env.PW_DEV_SERVER === '1' ? 'npm run dev' : 'npm run build && npm run start'`. No second config file, no `cross-env` dependency.
- **D-06:** Add npm script `"test:e2e:dev": "PW_DEV_SERVER=1 playwright test"` alongside the existing `"test:e2e": "playwright test"`. Default `npm run test:e2e` behavior is unchanged.
- **D-07:** Keep `webServer.timeout: 120000` (120s) for both modes — Turbopack dev startup is well under 120s and there's no need for two timeouts.
- **D-08:** Keep `reuseExistingServer: !process.env.CI` unchanged. Local dev iteration where the user already has `npm run dev` running benefits from server reuse in both modes.

### GAP-03: Clipboard Failure Handling
- **D-09:** Wrap `navigator.clipboard.writeText(text)` in a `try/catch` inside the click handler in `src/components/blog/code-block-enhancer.tsx`. On reject, swap `button.innerHTML` to a new `xIcon` SVG constant and set `aria-label='Copy failed'`. Use the same 2000ms revert timer as the success path (single `setTimeout` runs after both branches via try/catch falling through to common revert).
- **D-10:** Add a new `xIcon` SVG constant in the same file, mirroring the existing `copyIcon` / `checkIcon` style (16×16, stroke-based, lucide X glyph).
- **D-11:** `console.error('Clipboard write failed:', err)` in the catch block — surfaces the failure for debugging without throwing an unhandled promise rejection.
- **D-12:** Set `button.setAttribute('aria-live', 'polite')` once at button creation time so screen readers re-announce when `aria-label` flips between Copy code → Copied! / Copy failed.
- **D-13:** Do NOT add a fallback to `document.execCommand('copy')` — explicitly out of scope (REQUIREMENTS.md). Modern HTTPS browsers support the Clipboard API; the failure state is sufficient.
- **D-14:** Do NOT guard for `navigator.clipboard === undefined`. Production runs over HTTPS via Vercel where the API is always present; the existing test mocks always inject it.

### Test Scope (GAP-03 unit tests)
- **D-15:** Add exactly **one** new test to `src/components/blog/code-block-enhancer.test.tsx` (total 6 tests). Scenario: mock `navigator.clipboard.writeText` to reject, click the button, assert (a) button innerHTML contains the X icon path, (b) `aria-label` becomes `'Copy failed'`, (c) after 2000ms (use `vi.useFakeTimers()` or `waitFor` with timeout) the button reverts to `copyIcon` + `'Copy code'`.
- **D-16:** In the new test, `vi.spyOn(console, 'error').mockImplementation(() => {})` — assert it was called with the rejection so the logging contract is documented; restore in `afterEach` (or rely on `vi.restoreAllMocks()`).
- **D-17:** Existing 5 tests remain untouched in scope/assertions. Only the new test is added.

### Claude's Discretion
- Exact filename for the `publishedPosts` helper (`src/lib/posts.ts` vs extending an existing lib file) — Claude picks based on existing structure during planning/execution.
- Whether to use `vi.useFakeTimers()` or `waitFor({ timeout: 2500 })` for the 2000ms revert assertion in the failure test — pick whichever is consistent with how the existing 5 tests handle async UI.
- Exact lucide X icon SVG path coordinates (lucide source has multiple X variants) — pick the one closest in stroke style to the existing copy/check icons.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/REQUIREMENTS.md` §v1.8.1 — GAP-01, GAP-02, GAP-03 acceptance criteria + Out of Scope table (draft preview UI, execCommand fallback)
- `.planning/ROADMAP.md` §Phase 24 — Success criteria 1-5 (must remain TRUE after execution)
- `.planning/codebase/CONCERNS.md` — Original concern descriptions and recommended fixes (Security: Draft posts, Clipboard failure; Performance: E2E build requirement)

### Source files touched
- `src/app/blog/[slug]/page.tsx` (lines 18-20 generateStaticParams, lines 47-53 PostPage notFound) — draft guard target
- `src/app/blog/page.tsx` (line 15) — existing draft filter call site to migrate to helper
- `src/app/sitemap.ts` — existing draft filter call site
- `src/app/feed.xml/route.ts` — existing draft filter call site
- `playwright.config.ts` (lines 24-29 webServer block) — env-var branch target
- `package.json` (scripts block) — add `test:e2e:dev`
- `src/components/blog/code-block-enhancer.tsx` (lines 49-61 click handler, lines 71-73 icon constants) — try/catch + xIcon + aria-live
- `src/components/blog/code-block-enhancer.test.tsx` — add 6th test

### Out-of-scope reference (do NOT touch in this phase)
- All other CONCERNS.md items (Velite pin, CSP unsafe-inline, dangerouslySetInnerHTML, DOM-mutation approach in CodeBlockEnhancer, Suspense fallbacks, x-forwarded-for, hardcoded setTimeout/glow constants, page/component test gaps, coverage thresholds, ESLint 10) — accepted trade-offs per REQUIREMENTS.md Out of Scope table.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`posts` from `@/.velite`** — Velite-compiled collection, already imported in 4 files. The `publishedPosts` helper wraps this.
- **Existing draft filter pattern** — `posts.filter(p => !p.draft)` already exists in 3 call sites; the helper consolidates them.
- **Existing test infrastructure** — `code-block-enhancer.test.tsx` already mocks `navigator.clipboard` via `Object.defineProperty(navigator, 'clipboard', ...)` in `beforeEach`. The new failure test reuses this setup with `mockRejectedValue` instead of `mockResolvedValue`.
- **Vitest globals** — `vitest.config.ts` enables `globals: true`, so `describe`/`it`/`expect`/`vi`/`beforeEach`/`afterEach` are available without imports.

### Established Patterns
- **Test file colocation** — `*.test.tsx` lives next to the source file. The new clipboard failure test goes into the existing `code-block-enhancer.test.tsx`, not a new file.
- **DOM-based imperative enhancement** — `CodeBlockEnhancer` is an outlier: it returns `null` and mutates DOM in `useEffect`. The fix preserves this pattern (the DOM mutation approach is an accepted trade-off per CONCERNS.md).
- **Icon constants at module bottom** — Existing `copyIcon` / `checkIcon` are exported as `const` strings at the bottom of `code-block-enhancer.tsx`. The new `xIcon` follows the same pattern.
- **Single Playwright config** — Project has one `playwright.config.ts`; adding a second would break the established convention.

### Integration Points
- The `publishedPosts` helper is consumed by 4 routes: blog listing page, sitemap, feed.xml, and the dynamic [slug] page (both `generateStaticParams` and `PostPage`).
- `package.json` scripts block currently has `test` and `test:e2e` — `test:e2e:dev` slots in next to them.
- The clipboard failure path is invoked only via the runtime click handler — no SSR/build path is affected.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly chose **symmetric UX** for clipboard failure (X icon mirrors check icon, same 2000ms timer) — keep the success and failure paths visually parallel during execution.
- The user explicitly preferred a **single env-var branch** over a separate Playwright config file — minimize file count, no `cross-env` dependency. WSL/Linux/macOS users will run `PW_DEV_SERVER=1 playwright test` directly. Windows users without WSL would need `set PW_DEV_SERVER=1 && ...` but this is a personal site and the author uses WSL — accepted trade-off.
- The user explicitly preferred **`publishedPosts` helper extraction** over leaving three hand-rolled filters in place — single source of truth is worth the small refactor.
- The user explicitly preferred **OG/metadata audit** over trusting `notFound()` alone — defense in depth on the draft guard is worth the small grep + fix.

</specifics>

<deferred>
## Deferred Ideas

- **`navigator.clipboard === undefined` guard** — declined as out of scope (D-14). Production HTTPS guarantees the API. If the site is ever served over HTTP locally and a copy button click throws, revisit then.
- **Lucide X variant choice** — left to Claude's discretion during execution.
- **Refactoring `CodeBlockEnhancer` away from DOM mutation** — accepted trade-off per CONCERNS.md; not in scope for this phase.

</deferred>

---

*Phase: 24-audit-gap-closures*
*Context gathered: 2026-04-11*
