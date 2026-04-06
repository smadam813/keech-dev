# Testing Patterns

**Analysis Date:** 2026-04-05

## Test Framework

**Unit/Integration Runner:**
- Vitest 4.x
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals enabled (`globals: true`) — `describe`, `it`, `expect`, `vi`, `beforeEach`, etc. available without imports (but files still import explicitly from `vitest` for clarity)

**Assertion Library:**
- Vitest built-in + `@testing-library/jest-dom` (matchers like `toBeInTheDocument`, `toHaveAttribute`, `toHaveBeenCalledOnce`)
- Setup file: `vitest.setup.ts` — single line: `import '@testing-library/jest-dom/vitest'`

**Component Rendering:**
- `@testing-library/react` v16 — `render`, `screen`, `fireEvent`, `waitFor`, `renderHook`, `act`

**E2E Runner:**
- Playwright 1.59
- Config: `playwright.config.ts`
- Two browser projects: `desktop-chromium` (Desktop Chrome) and `mobile-chromium` (Pixel 5)
- Serial workers (`workers: 1`), no retries
- Web server: builds and starts production app before tests

**Run Commands:**
```bash
npm run test           # Vitest run (all unit tests once)
npx vitest             # Vitest watch mode
npm run test:e2e       # Playwright e2e (builds prod first)
```

## Test File Organization

**Unit tests:**
- Co-located with source files in `src/`
- Pattern: `[filename].test.ts` or `[filename].test.tsx`
- Examples: `src/lib/format.test.ts`, `src/components/ui/filter-chip.test.tsx`, `src/hooks/use-media-query.test.ts`
- Include pattern in `vitest.config.ts`: `src/**/*.test.{ts,tsx}`

**E2E tests:**
- Separate directory: `e2e/`
- Pattern: `[feature].spec.ts`
- Examples: `e2e/mobile-menu.spec.ts`, `e2e/code-copy.spec.ts`, `e2e/view-count.spec.ts`, `e2e/mobile-toc.spec.ts`

**Directory layout:**
```
src/
  lib/
    format.ts
    format.test.ts          # co-located
  hooks/
    use-filtered-list.ts
    use-filtered-list.test.ts
  components/
    ui/
      filter-chip.tsx
      filter-chip.test.tsx
  app/
    api/views/
      route.ts
      route.test.ts
e2e/
  mobile-menu.spec.ts
  code-copy.spec.ts
```

## Test Structure

**Suite organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('ModuleName', () => {
  beforeEach(() => {
    // setup
  })

  afterEach(() => {
    vi.unstubAllGlobals()  // always clean up stubs
  })

  it('does the thing when condition', () => {
    // arrange
    // act
    // assert
  })
})
```

**Nested describes for logical grouping:**
```typescript
describe('FilterChip', () => {
  describe('toggle mode (onToggle provided)', () => {
    it('renders a button with the label', () => { ... })
    it('calls onToggle when clicked', () => { ... })
  })

  describe('link mode (href provided, no onToggle)', () => {
    it('renders an anchor link', () => { ... })
  })
})
```

**Test ID annotations:**
- Some test suites include a requirement ID in the describe label: `describe('GET /api/views/[slug] (TEST-02)', ...)`
- These map to milestone requirement tracking — preserve this pattern when adding tests for documented requirements

**Patterns:**
- `beforeEach` for mock resets: `mockGet.mockReset()` — always reset mocks between tests
- `afterEach` for global cleanup: `vi.unstubAllGlobals()` — never leave globals stubbed
- `beforeEach(() => { vi.useFakeTimers() })` + `afterEach(() => { vi.useRealTimers() })` for timer-dependent tests

## Mocking

**Framework:** `vi` from Vitest

**Module mocking (hoisted):**
```typescript
// Module mock must appear before the import of the module under test
const mockGet = vi.fn()
vi.mock('@/lib/redis', () => ({
  redis: { get: (...args: unknown[]) => mockGet(...args) },
}))

// Then import the module under test AFTER the mock
import { GET } from './route'
```

**Important:** `vi.mock()` is hoisted — declare mock functions with `const` before `vi.mock()`, then import the tested module after. This is the established pattern in all API route tests.

**Global stubs:**
```typescript
// Stub browser globals not available in jsdom
vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})))

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  // ...
})

// Always clean up
afterEach(() => {
  vi.unstubAllGlobals()
})
```

**Class mocks (for constructors like ResizeObserver):**
```typescript
class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    resizeObserverCallback = cb  // capture for later firing
  }
  observe = observeSpy
  disconnect = disconnectSpy
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)
```

**Next.js-specific mocks:**
```typescript
// next/link — mock as plain <a> for jsdom compatibility
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

// next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet, toString: mockSearchParamsToString }),
  usePathname: () => '/blog',
}))
```

**What to mock:**
- External services: Redis (`@/lib/redis`), rate limiter (`@/lib/rate-limit`), Upstash SDK (`@upstash/ratelimit`)
- Browser globals not in jsdom: `matchMedia`, `localStorage`, `ResizeObserver`, `history`
- Next.js client-side modules in unit tests: `next/link`, `next/navigation`
- Client components that use DOM APIs unavailable in jsdom (e.g., `CodeBlockEnhancer` mocked in `mdx-content.test.tsx`)

**What NOT to mock:**
- Pure utility functions — test them directly (`formatDate`, `validateSlug`, `cn`)
- The module under test itself
- Standard Web APIs that jsdom provides (`fetch`, `Request`, `Response`, `URL`)

## Fixtures and Factories

**Test data:** Defined inline at the top of test files as `const` arrays/objects

```typescript
// From use-filtered-list.test.ts
type TestItem = { id: string; tags: string[] }

const items: TestItem[] = [
  { id: 'a', tags: ['react', 'typescript'] },
  { id: 'b', tags: ['react', 'css'] },
]
```

**Helper factories:** Defined as functions within the test file when multiple tests share setup:
```typescript
function makeOptions(paramValue: string | null = null) {
  mockGet.mockReturnValue(paramValue)
  return { items, allFilterValues, getItemValues: (item: TestItem) => item.tags, paramName: 'tags' }
}
```

**Location:** No separate fixtures directory — all test data is co-located in the test file.

## Static Asset / Source File Tests

The `src/lib/seo-assets.test.ts` pattern tests that source files and binary assets exist and contain expected content — using `fs.readFileSync`/`fs.statSync` directly. Use this approach when:
- Testing that a file exports specific constants or patterns (OG image config)
- Testing binary asset presence (favicon, font files)
- Avoiding jsdom incompatibilities with complex Next.js modules (ImageResponse, dynamic imports)

```typescript
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd())

it('exports alt constant', () => {
  const ogSrc = readFileSync(join(root, 'src/app/opengraph-image.tsx'), 'utf-8')
  expect(ogSrc).toMatch(/export\s+const\s+alt\s*=/)
})
```

## Coverage

**Requirements:** No coverage threshold enforced in `vitest.config.ts`

**View coverage:**
```bash
npx vitest --coverage
```

## Test Types

**Unit tests (`src/**/*.test.{ts,tsx}`):**
- Pure functions: `src/lib/format.test.ts`, `src/lib/validation.test.ts`, `src/lib/rune-glows.test.ts`
- React hooks: `src/hooks/use-*.test.ts` — use `renderHook` + `act` from `@testing-library/react`
- React components: `src/components/**/*.test.tsx` — use `render` + `screen` from `@testing-library/react`
- API route handlers: `src/app/api/**/*.test.ts` — instantiate `NextRequest`/`Request`, call handlers directly, assert on `Response`
- Middleware/proxy: `src/proxy.test.ts` — call function directly, assert on response headers

**E2E tests (`e2e/*.spec.ts`):**
- User flows against a real production build
- Playwright `page` fixture for navigation and interaction
- `page.route()` used to mock API responses when real services (Redis) are unavailable: see `e2e/view-count.spec.ts`
- Device-level `test.use()` to override viewport: `test.use({ ...devices['Pixel 5'] })`
- Graceful skip when content is not available: `test.skip(true, 'reason')`

## Common Patterns

**Async API route testing:**
```typescript
const request = new NextRequest('http://localhost/api/views/test-post', {
  method: 'POST',
  headers: { 'x-forwarded-for': '1.2.3.4' },
})
const response = await POST(request, makeParams('test-post'))
const data = await response.json()

expect(response.status).toBe(200)
expect(data).toEqual({ slug: 'test-post', views: 1, deduplicated: false })
```

**Hook with fake timers:**
```typescript
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

it('transitions after delay', async () => {
  const { result } = renderHook(() => useHeroAnimation({ imgRef }))

  act(() => { result.current.handleLoad() })

  await act(async () => { vi.advanceTimersByTime(600) })

  expect(result.current.revealStage).toBe('text-reveal')
})
```

**Component with fireEvent:**
```typescript
it('calls handler when clicked', () => {
  const handleToggle = vi.fn()
  render(<FilterChip label="react" onToggle={handleToggle} />)
  fireEvent.click(screen.getByRole('button'))
  expect(handleToggle).toHaveBeenCalledOnce()
})
```

**Error path testing:**
```typescript
it('returns 500 on Redis error', async () => {
  mockGet.mockRejectedValue(new Error('Connection refused'))
  const response = await GET(request, makeParams('test-post'))
  const data = await response.json()
  expect(response.status).toBe(500)
  expect(data).toEqual({ error: 'Failed to fetch view count' })
})
```

**E2E with API interception:**
```typescript
await page.route('**/api/views/**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ views: 42 }),
  })
})
```

**Dynamic import with module reset (for config tests):**
```typescript
beforeEach(() => {
  vi.resetModules()
  mockConstructor.mockClear()
})

it('is configured with sliding window', async () => {
  const { Ratelimit } = await import('@upstash/ratelimit')
  await import('./rate-limit')
  expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(10, '60 s')
})
```

---

*Testing analysis: 2026-04-05*
