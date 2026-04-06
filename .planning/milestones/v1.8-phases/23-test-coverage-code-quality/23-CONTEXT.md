# Phase 23: Test Coverage & Code Quality - Context

**Gathered:** 2026-04-05 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fill the highest-value test gaps for API routes, CodeBlockEnhancer, and OG font file, then evaluate the 3 remaining lint suppressions. No new features, no refactoring beyond what QUAL-01 requires.

</domain>

<decisions>
## Implementation Decisions

### Route Handler Test Strategy
- **D-01:** Test API route handlers by importing GET/POST functions directly and calling them with constructed Request/NextRequest objects — no HTTP server or supertest needed
- **D-02:** Mock `@/lib/redis` module with `vi.mock` to control Redis responses (success, error, null values) without a real Redis connection
- **D-03:** Mock `@/lib/rate-limit` module to control rate limiting behavior (success/failure) in POST handler tests
- **D-04:** Use `NextRequest` from `next/server` (not plain `Request`) for the `[slug]` route handler tests, per success criteria SC-2
- **D-05:** For the `params` argument in `[slug]` route handlers, pass `{ params: Promise.resolve({ slug }) }` to match the Next.js 16 async params pattern already in the source

### CodeBlockEnhancer Test Strategy
- **D-06:** Test CodeBlockEnhancer by rendering it within a jsdom environment that has a `.prose` container with `<pre><code>` elements pre-existing in the DOM
- **D-07:** Assert that after the effect runs: (a) each `<pre>` is wrapped in a `div.group.relative`, (b) a copy button with `aria-label="Copy code"` is injected, (c) clicking the button calls `navigator.clipboard.writeText` with the code text content
- **D-08:** Mock `navigator.clipboard` using the established pattern (`Object.defineProperty(navigator, 'clipboard', ...)`)

### OG Font Assertion
- **D-09:** Add a test in `src/lib/seo-assets.test.ts` (existing file) that asserts the OG image font file exists at the expected path using `fs.existsSync` — matches the established file-based assertion pattern already in that test file

### Lint Suppression Resolution (QUAL-01)
- **D-10:** The 3 `react-hooks/set-state-in-effect` suppressions (use-hero-animation.ts lines 34/45, scroll-reveal.tsx line 18) are intentional and stay as-is — they already have explanatory inline comments from Phase 18 D-08
- **D-11:** Document the rationale in this CONTEXT.md as the decision log entry required by QUAL-01: these are synchronous state updates that read external DOM properties (imgRef.current.complete, prefers-reduced-motion) on mount — the alternative (useLayoutEffect or derived state) would add complexity without fixing a real bug

### Claude's Discretion
- Test file naming and internal structure (describe/it grouping)
- Exact number of test cases per scenario as long as success criteria coverage is met
- Whether to add the OG font test as a new describe block or extend an existing one in seo-assets.test.ts

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Route Source Files
- `src/app/api/views/route.ts` — GET batch fetch handler (TEST-01 target)
- `src/app/api/views/[slug]/route.ts` — GET/POST single slug handler with dedup and rate limit (TEST-02 target)
- `src/lib/redis.ts` — Redis client (mock target)
- `src/lib/validation.ts` — validateSlug/validateSlugs (used by routes)
- `src/lib/rate-limit.ts` — viewsRateLimit (mock target for POST tests)

### CodeBlockEnhancer Source
- `src/components/blog/code-block-enhancer.tsx` — DOM mutation component (TEST-03 target)

### Existing Test Patterns
- `.planning/codebase/TESTING.md` — Full testing conventions, mocking patterns, file-based assertion pattern
- `src/lib/seo-assets.test.ts` — File-based assertion pattern reference (TEST-04 will extend this file)
- `src/lib/rate-limit.test.ts` — Rate limiter mock pattern reference

### Lint Suppression Source
- `src/hooks/use-hero-animation.ts` lines 34, 45 — Two set-state-in-effect suppressions (QUAL-01 target)
- `src/components/ui/scroll-reveal.tsx` line 18 — One set-state-in-effect suppression (QUAL-01 target)

### Requirements
- `.planning/REQUIREMENTS.md` — TEST-01 through TEST-04, QUAL-01 definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/seo-assets.test.ts` — Established file-based assertion pattern using `fs.readFileSync` and `statSync`; OG font test (D-09) extends this naturally
- `src/lib/rate-limit.test.ts` — Pattern for mocking `@upstash/ratelimit` and testing rate limiter config
- `src/lib/validation.test.ts` — Existing tests for `validateSlug`/`validateSlugs` functions used by API routes

### Established Patterns
- `vi.mock('module')` for module-level mocks (redis, next/navigation, rate-limit)
- `vi.stubGlobal()` for browser APIs (matchMedia, ResizeObserver, clipboard)
- `renderHook` + `act` for hook tests; `render` + `screen` for component tests
- File-based assertions via `fs.readFileSync`/`fs.existsSync` for static asset checks
- Tests co-located with source as `{module}.test.ts(x)`

### Integration Points
- New test files: `src/app/api/views/route.test.ts`, `src/app/api/views/[slug]/route.test.ts`, `src/components/blog/code-block-enhancer.test.tsx`
- Extended test file: `src/lib/seo-assets.test.ts` (add OG font assertion)
- No changes to source code except QUAL-01 evaluation (which results in no code changes per D-10/D-11)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the established testing patterns.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

</deferred>

---

*Phase: 23-test-coverage-code-quality*
*Context gathered: 2026-04-05*
