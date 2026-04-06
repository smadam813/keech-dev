# Phase 23: Test Coverage & Code Quality - Research

**Researched:** 2026-04-05
**Domain:** Vitest unit testing for Next.js 16 API routes, DOM-mutating client components, and file-based assertions
**Confidence:** HIGH

## Summary

This phase adds unit tests for the two API view-count routes, the CodeBlockEnhancer DOM mutation component, and an OG font file assertion, then documents the 3 existing lint suppressions as intentional. All work is pure test authoring -- no production source changes.

The codebase has a mature Vitest 4.1.2 setup with jsdom, established mocking patterns for Redis and browser APIs, and 132 passing tests across 18 files. The new tests follow existing conventions exactly: `vi.mock` for module-level dependencies (redis, rate-limit), `vi.stubGlobal` / `Object.defineProperty` for browser APIs (clipboard), and `fs.existsSync` for file-based assertions in the existing `seo-assets.test.ts`.

**Primary recommendation:** Write 3 new test files and extend 1 existing file, following the patterns already established in the codebase. Mock redis and rate-limit modules; construct Request/NextRequest objects directly to call exported GET/POST handlers.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Test API route handlers by importing GET/POST functions directly and calling them with constructed Request/NextRequest objects -- no HTTP server or supertest needed
- D-02: Mock `@/lib/redis` module with `vi.mock` to control Redis responses (success, error, null values) without a real Redis connection
- D-03: Mock `@/lib/rate-limit` module to control rate limiting behavior (success/failure) in POST handler tests
- D-04: Use `NextRequest` from `next/server` (not plain `Request`) for the `[slug]` route handler tests, per success criteria SC-2
- D-05: For the `params` argument in `[slug]` route handlers, pass `{ params: Promise.resolve({ slug }) }` to match the Next.js 16 async params pattern already in the source
- D-06: Test CodeBlockEnhancer by rendering it within a jsdom environment that has a `.prose` container with `<pre><code>` elements pre-existing in the DOM
- D-07: Assert that after the effect runs: (a) each `<pre>` is wrapped in a `div.group.relative`, (b) a copy button with `aria-label="Copy code"` is injected, (c) clicking the button calls `navigator.clipboard.writeText` with the code text content
- D-08: Mock `navigator.clipboard` using the established pattern (`Object.defineProperty(navigator, 'clipboard', ...)`)
- D-09: Add a test in `src/lib/seo-assets.test.ts` (existing file) that asserts the OG image font file exists at the expected path using `fs.existsSync`
- D-10: The 3 `react-hooks/set-state-in-effect` suppressions are intentional and stay as-is -- already have explanatory inline comments from Phase 18
- D-11: Document the rationale in CONTEXT.md as the decision log entry required by QUAL-01

### Claude's Discretion
- Test file naming and internal structure (describe/it grouping)
- Exact number of test cases per scenario as long as success criteria coverage is met
- Whether to add the OG font test as a new describe block or extend an existing one in seo-assets.test.ts

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Unit tests for GET /api/views (batch fetch) route handler with mocked Redis | Route source analyzed, mock patterns documented, test scenarios identified |
| TEST-02 | Unit tests for GET/POST /api/views/[slug] route handler (fetch, increment, dedup, rate limit) | Route source analyzed, NextRequest construction pattern verified, async params pattern confirmed |
| TEST-03 | Unit tests for CodeBlockEnhancer DOM mutation (copy button injection, clipboard interaction) | Component source analyzed, jsdom DOM setup pattern documented, clipboard mock pattern confirmed |
| TEST-04 | Assertion test that OG image font file exists at expected path | Font path verified (`src/assets/fonts/Inter-Bold.ttf`, 326KB), existing seo-assets.test.ts pattern documented |
| QUAL-01 | Evaluate 3 react-hooks/set-state-in-effect suppressions | All 3 suppressions inspected, confirmed intentional with inline comments, D-10/D-11 document rationale |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.2 | Test runner | Already installed and configured [VERIFIED: npm ls] |
| @testing-library/react | 16.3.2 | Component rendering | Already installed, used for CodeBlockEnhancer test [VERIFIED: npm ls] |
| @testing-library/jest-dom | 6.9.1 | DOM matchers | Already in vitest.setup.ts [VERIFIED: npm ls] |
| next | 16.2.2 | NextRequest import | Already installed, provides `next/server` [VERIFIED: npm ls] |

### Supporting
No additional libraries needed. All dependencies are already installed.

**Installation:**
```bash
# No installation needed -- all dependencies present
```

## Architecture Patterns

### New Test File Locations
```
src/
├── app/api/views/
│   ├── route.ts                    # Source (TEST-01)
│   ├── route.test.ts               # NEW (TEST-01)
│   └── [slug]/
│       ├── route.ts                # Source (TEST-02)
│       └── route.test.ts           # NEW (TEST-02)
├── components/blog/
│   ├── code-block-enhancer.tsx     # Source (TEST-03)
│   └── code-block-enhancer.test.tsx # NEW (TEST-03)
└── lib/
    └── seo-assets.test.ts          # EXTEND (TEST-04)
```

### Pattern 1: Route Handler Unit Testing (D-01)
**What:** Import GET/POST directly, construct Request objects, call handler, assert on Response.json()
**When to use:** All API route tests in this phase
**Example:**
```typescript
// Source: codebase pattern from route source + CONTEXT.md D-01
import { GET } from './route'

it('returns empty counts for empty slugs param', async () => {
  const request = new Request('http://localhost/api/views?slugs=')
  const response = await GET(request)
  const data = await response.json()
  expect(data).toEqual({ counts: {} })
})
```

### Pattern 2: NextRequest with Async Params (D-04, D-05)
**What:** Use NextRequest from `next/server` for [slug] route tests, pass params as Promise
**When to use:** TEST-02 tests
**Example:**
```typescript
// Source: CONTEXT.md D-04/D-05, route source lines 12-16
import { NextRequest } from 'next/server'
import { GET } from './route'

it('returns view count for valid slug', async () => {
  mockRedisGet.mockResolvedValue(42)
  const request = new NextRequest('http://localhost/api/views/test-post')
  const response = await GET(request, { params: Promise.resolve({ slug: 'test-post' }) })
  const data = await response.json()
  expect(data).toEqual({ slug: 'test-post', views: 42 })
})
```

### Pattern 3: Redis Module Mock (D-02)
**What:** Mock `@/lib/redis` to control all Redis operations
**When to use:** TEST-01 and TEST-02
**Example:**
```typescript
// Source: established pattern from rate-limit.test.ts line 4
const mockMget = vi.fn()
const mockGet = vi.fn()
const mockSet = vi.fn()
const mockIncr = vi.fn()

vi.mock('@/lib/redis', () => ({
  redis: {
    mget: (...args: unknown[]) => mockMget(...args),
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
    incr: (...args: unknown[]) => mockIncr(...args),
  },
}))
```

### Pattern 4: Rate Limit Module Mock (D-03)
**What:** Mock `@/lib/rate-limit` to control rate limiting pass/fail
**When to use:** TEST-02 POST handler tests
**Example:**
```typescript
// Source: CONTEXT.md D-03
const mockRateLimit = vi.fn()

vi.mock('@/lib/rate-limit', () => ({
  viewsRateLimit: {
    limit: (...args: unknown[]) => mockRateLimit(...args),
  },
}))
```

### Pattern 5: CodeBlockEnhancer DOM Test (D-06, D-07, D-08)
**What:** Set up DOM with `.prose > pre > code` structure, render component, assert mutations
**When to use:** TEST-03
**Example:**
```typescript
// Source: CONTEXT.md D-06/D-07/D-08, established clipboard mock pattern from TESTING.md
import { render, act } from '@testing-library/react'
import { CodeBlockEnhancer } from './code-block-enhancer'

beforeEach(() => {
  // Set up DOM with prose container containing pre>code
  document.body.innerHTML = `
    <div class="prose">
      <pre><code>const x = 1</code></pre>
    </div>
  `
  // Mock clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  })
})

it('wraps pre elements in group relative div', () => {
  render(<CodeBlockEnhancer />)
  const wrapper = document.querySelector('.prose .group.relative')
  expect(wrapper).not.toBeNull()
  expect(wrapper?.querySelector('pre')).not.toBeNull()
})
```

### Pattern 6: File-Based Assertion (D-09)
**What:** Use `existsSync` to verify font file exists at expected path
**When to use:** TEST-04
**Example:**
```typescript
// Source: seo-assets.test.ts existing pattern (lines 1-13)
import { existsSync } from 'node:fs'
import { join } from 'node:path'

it('Inter-Bold.ttf font file exists for OG image generation', () => {
  const fontPath = join(process.cwd(), 'src/assets/fonts/Inter-Bold.ttf')
  expect(existsSync(fontPath)).toBe(true)
})
```

### Anti-Patterns to Avoid
- **Starting an HTTP server for route tests:** The handlers are plain async functions -- call them directly (D-01)
- **Using plain `Request` for [slug] tests:** Must use `NextRequest` from `next/server` per SC-2 (D-04)
- **Passing `{ params: { slug } }` without Promise:** Next.js 16 uses async params -- must wrap in `Promise.resolve()` (D-05)
- **Rendering CodeBlockEnhancer without pre-existing DOM:** The component queries `document.querySelector('.prose')` -- DOM must exist before render (D-06)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP test server | Express/Fastify test server | Direct function import | Route handlers are plain async functions, no server needed |
| Redis test instance | Docker Redis for tests | `vi.mock('@/lib/redis')` | Unit tests should be fast and isolated |
| Clipboard polyfill | Custom clipboard implementation | `Object.defineProperty(navigator, 'clipboard', ...)` | Established pattern in codebase |

## Common Pitfalls

### Pitfall 1: Response.json() is Async
**What goes wrong:** Forgetting to await `response.json()` -- test passes with unresolved Promise
**Why it happens:** `Response.json()` returns a Promise
**How to avoid:** Always `const data = await response.json()` before assertions
**Warning signs:** Tests pass but assertions seem to match anything

### Pitfall 2: CodeBlockEnhancer Enhanced Guard
**What goes wrong:** Component only runs DOM mutations once (line 18-19: `if (enhanced.current) return`)
**Why it happens:** `useRef(false)` guard prevents re-enhancement
**How to avoid:** Each test case should freshly render the component; clean up `document.body.innerHTML` in `beforeEach`
**Warning signs:** Second render in same test produces no mutations

### Pitfall 3: vi.mock Hoisting
**What goes wrong:** Mock variables not available in `vi.mock` factory because `vi.mock` is hoisted above variable declarations
**Why it happens:** Vitest hoists `vi.mock()` calls to top of file
**How to avoid:** Declare mock functions before `vi.mock()` calls, or use `vi.fn()` inline in the factory. The codebase already handles this correctly in rate-limit.test.ts
**Warning signs:** "Cannot access 'mockFn' before initialization" error

### Pitfall 4: POST Route Reads x-forwarded-for Header
**What goes wrong:** Forgetting to set the header, causing IP to default to '127.0.0.1'
**Why it happens:** The POST handler reads `request.headers.get('x-forwarded-for')` (line 44)
**How to avoid:** Set the header in NextRequest construction: `new NextRequest(url, { headers: { 'x-forwarded-for': '1.2.3.4' } })`
**Warning signs:** Dedup key always uses same IP hash

### Pitfall 5: CodeBlockEnhancer Click Handler is Async
**What goes wrong:** Clipboard assertion fails because click handler uses `await navigator.clipboard.writeText()`
**Why it happens:** The click event handler is async (line 49)
**How to avoid:** After firing click, use `await vi.waitFor()` or `await act(async () => ...)` to flush microtasks
**Warning signs:** `navigator.clipboard.writeText` not called despite button click

## Code Examples

### TEST-01: Batch Views Route Test Scenarios
```typescript
// Scenarios to cover per success criteria SC-1:
// 1. Empty slugs param -> { counts: {} }
// 2. Valid slugs -> { counts: { slug1: N, slug2: M } }
// 3. Invalid slug format -> 400 error
// 4. Batch limit exceeded (>20) -> 400 error
// 5. Redis error -> 500 error
```

### TEST-02: Single Slug Route Test Scenarios
```typescript
// GET scenarios per success criteria SC-2:
// 1. Valid slug fetch -> { slug, views: N }
// 2. Invalid slug -> 400
// 3. Redis error -> 500
// 4. Null redis value -> views: 0

// POST scenarios per success criteria SC-2:
// 1. First visit (dedup key set OK) -> increment, deduplicated: false
// 2. Repeat visit (dedup key exists) -> no increment, deduplicated: true
// 3. Rate limited -> 429
// 4. Invalid slug -> 400
// 5. Redis error -> 500
```

### TEST-03: CodeBlockEnhancer Scenarios
```typescript
// Per success criteria SC-3 / D-07:
// 1. Pre elements wrapped in div.group.relative
// 2. Copy button with aria-label="Copy code" injected
// 3. Click copies code text via navigator.clipboard.writeText
// 4. No prose container -> no mutations (graceful no-op)
// 5. Already wrapped pre -> skipped (no double-wrapping)
```

### TEST-04: OG Font File Assertion
```typescript
// Per success criteria SC-4 / D-09:
// Font path: src/assets/fonts/Inter-Bold.ttf
// Already verified to exist (326KB) [VERIFIED: ls -la]
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Batch views route handler (5 scenarios) | unit | `npx vitest run src/app/api/views/route.test.ts` | Wave 0 |
| TEST-02 | Single slug route handler (9 scenarios) | unit | `npx vitest run src/app/api/views/\\[slug\\]/route.test.ts` | Wave 0 |
| TEST-03 | CodeBlockEnhancer DOM mutations (5 scenarios) | unit | `npx vitest run src/components/blog/code-block-enhancer.test.tsx` | Wave 0 |
| TEST-04 | OG font file exists | unit | `npx vitest run src/lib/seo-assets.test.ts` | Extends existing |
| QUAL-01 | Lint suppressions documented | manual-only | N/A -- verified by reading CONTEXT.md D-10/D-11 | N/A |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run lint`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/views/route.test.ts` -- covers TEST-01
- [ ] `src/app/api/views/[slug]/route.test.ts` -- covers TEST-02
- [ ] `src/components/blog/code-block-enhancer.test.tsx` -- covers TEST-03

No new framework install needed. Vitest, Testing Library, and jsdom are all configured.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `NextRequest` can be constructed in jsdom with `new NextRequest(url, init)` without errors | Architecture Patterns | Would need to mock NextRequest or use plain Request with type casting |
| A2 | CodeBlockEnhancer's `useEffect` fires synchronously enough after `render()` that DOM mutations are observable without explicit `waitFor` | Architecture Patterns | May need `act()` wrapper or `waitFor` to flush effects |

## Open Questions

1. **NextRequest in jsdom**
   - What we know: NextRequest extends the Web API Request. jsdom provides a basic Request implementation. Next.js 16.2.2 is installed.
   - What's unclear: Whether NextRequest constructor works cleanly in Vitest jsdom without the full Next.js server runtime.
   - Recommendation: Try it first (likely works); if not, use plain `Request` with a type assertion for GET tests and only use `NextRequest` where its specific APIs are needed. The source code types `request: Request` for GET anyway -- only POST reads headers which plain Request also supports. However, D-04 explicitly requires NextRequest for [slug] tests.

2. **CodeBlockEnhancer effect timing**
   - What we know: `useEffect` with empty deps array runs after paint in real browser, but @testing-library/react's `render` wraps in `act()` which flushes effects.
   - What's unclear: Whether DOM mutations from the effect are visible immediately after `render()` returns.
   - Recommendation: If mutations aren't visible after `render()`, wrap assertions in `waitFor()` from Testing Library.

## Sources

### Primary (HIGH confidence)
- Codebase source files: `src/app/api/views/route.ts`, `src/app/api/views/[slug]/route.ts`, `src/components/blog/code-block-enhancer.tsx` -- direct analysis
- Existing test files: `src/lib/seo-assets.test.ts`, `src/lib/rate-limit.test.ts` -- pattern reference
- `.planning/codebase/TESTING.md` -- comprehensive testing conventions
- `npm ls` output -- verified all dependency versions

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions D-01 through D-11 -- user-locked implementation strategy

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified via npm ls
- Architecture: HIGH -- all patterns derived from existing codebase tests
- Pitfalls: HIGH -- identified from direct source code analysis

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable -- no dependency changes expected)
