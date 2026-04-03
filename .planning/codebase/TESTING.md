# Testing Patterns

**Analysis Date:** 2026-04-03

## Test Framework

**Unit/Component Runner:**
- Vitest 4.1.2
- Config: `vitest.config.ts`
- Environment: jsdom
- Setup file: `vitest.setup.ts` (imports `@testing-library/jest-dom/vitest`)

**E2E Runner:**
- Playwright 1.59.1
- Config: `playwright.config.ts`
- Projects: `desktop-chromium` (Desktop Chrome), `mobile-chromium` (Pixel 5)
- Web server: builds and starts app on `localhost:3000`

**Assertion Libraries:**
- Vitest built-in (`expect`, `describe`, `it`)
- `@testing-library/jest-dom` for DOM matchers (`toBeInTheDocument`, `toHaveAttribute`)
- `@testing-library/react` for render/screen/fireEvent
- Playwright built-in assertions (`expect(locator).toBeVisible()`)

**Run Commands:**
```bash
npm run test          # vitest run (all unit/component tests)
npm run test:e2e      # playwright test (all E2E specs)
```

## Test File Organization

**Unit/Component Tests:**
- Co-located with source files as `{module}.test.ts` or `{module}.test.tsx`
- Pattern: `src/lib/format.test.ts` tests `src/lib/format.ts`
- Pattern: `src/components/blog/copy-button.test.tsx` tests `src/components/blog/copy-button.tsx`

**E2E Tests:**
- Separate `e2e/` directory at project root
- Named as `{feature}.spec.ts`

**Current test files (17 unit/component + 4 E2E):**

Unit/component:
- `src/lib/format.test.ts` -- date formatting
- `src/lib/validation.test.ts` -- slug validation
- `src/lib/views.test.ts` -- view count formatting and localStorage cache
- `src/lib/rune-glows.test.ts` -- glow position computation
- `src/lib/rate-limit.test.ts` -- rate limiter configuration
- `src/lib/security-headers.test.ts` -- security headers in next.config
- `src/lib/seo-assets.test.ts` -- favicon, OG images, sitemap, RSS feed, project images
- `src/hooks/use-hero-animation.test.ts` -- hero animation state machine
- `src/hooks/use-filtered-list.test.ts` -- filter hook with URL sync
- `src/hooks/use-glow-positions.test.ts` -- ResizeObserver-driven glow positioning
- `src/components/blog/copy-button.test.tsx` -- keyboard accessibility, a11y
- `src/components/blog/mdx-content.test.tsx` -- malformed MDX fallback rendering
- `src/components/ui/filter-chip.test.tsx` -- toggle/link/display modes
- `src/app/error.test.tsx` -- global error boundary
- `src/app/global-error.test.tsx` -- root layout error boundary
- `src/app/loading.test.tsx` -- all loading skeleton components
- `src/app/blog/[slug]/error.test.tsx` -- blog post error boundary

E2E:
- `e2e/mobile-menu.spec.ts` -- mobile menu open/close, escape, navigation
- `e2e/code-copy.spec.ts` -- code block copy button interaction
- `e2e/mobile-toc.spec.ts` -- mobile table of contents expand/collapse, sticky, auto-collapse
- `e2e/view-count.spec.ts` -- view count display on blog post

## Vitest Configuration

**File:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

**Key details:**
- `tsconfigPaths()` enables `@/*` and `@/.velite` path aliases in tests
- `react()` plugin enables JSX/TSX in test files
- `globals: true` makes `describe`, `it`, `expect` available without imports (but tests still explicitly import them)
- jsdom environment provides `document`, `localStorage`, `navigator`, `window`

**Setup file:** `vitest.setup.ts`
```typescript
import '@testing-library/jest-dom/vitest'
```
This adds DOM matchers like `toBeInTheDocument()`, `toHaveAttribute()`, `toHaveClass()`.

## Playwright Configuration

**File:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

**Key details:**
- Tests run against a production build (not dev server)
- Single worker to avoid port conflicts
- 2-minute timeout for build + start
- Reuses existing server locally (set `reuseExistingServer: !process.env.CI`)
- Mobile tests use `test.use({ ...devices['Pixel 5'] })` at the top of the spec file

## Test Structure

**Unit Test Pattern:**
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('formats ISO date to human-readable', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024')
  })

  it('handles edge case', () => {
    expect(formatDate('2024-02-29')).toBe('February 29, 2024')
  })
})
```

**Component Test Pattern:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CopyButton } from './copy-button'

describe('CopyButton', () => {
  it('has an accessible label for screen readers', () => {
    render(<CopyButton getText={() => 'code'} />)
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
  })
})
```

**Hook Test Pattern:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { useHeroAnimation } from './use-hero-animation'

describe('useHeroAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts in loading stage', () => {
    const { result } = renderHook(() => {
      const imgRef = useRef<HTMLImageElement | null>(null)
      return useHeroAnimation({ imgRef })
    })
    expect(result.current.revealStage).toBe('loading')
  })

  it('transitions after image load', async () => {
    const { result } = renderHook(() => {
      const imgRef = useRef<HTMLImageElement | null>(null)
      return useHeroAnimation({ imgRef })
    })
    act(() => { result.current.handleLoad() })
    await act(async () => { vi.advanceTimersByTime(600) })
    expect(result.current.revealStage).toBe('text-reveal')
  })
})
```

**E2E Test Pattern:**
```typescript
import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['Pixel 5'] })  // For mobile-specific tests

test.describe('feature name', () => {
  test('user interaction flow', async ({ page }) => {
    await page.goto('/')
    const element = page.getByRole('button', { name: /label/i })
    await element.click()
    await expect(element).toHaveAttribute('aria-expanded', 'true')
  })
})
```

## Mocking

**Framework:** Vitest `vi` module

**Module Mocks (`vi.mock`):**
```typescript
// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet, toString: mockSearchParamsToString }),
  usePathname: () => '/blog',
}))

// Mock next/link as plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, className }) => <a href={href} className={className}>{children}</a>,
}))

// Mock internal modules
vi.mock('@/lib/redis', () => ({ redis: {} }))
vi.mock('./code-block', () => ({
  CodeBlock: ({ children }) => <pre>{children}</pre>,
}))
```

**Global Stubs (`vi.stubGlobal`):**
```typescript
// Browser APIs not available in jsdom
vi.stubGlobal('matchMedia', vi.fn((query) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})))

vi.stubGlobal('ResizeObserver', MockResizeObserverClass)
vi.stubGlobal('history', { replaceState: vi.fn() })
```

**Clipboard Mock:**
```typescript
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
})
```

**Timer Mocks:**
```typescript
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

// Advance timers in act() for React state updates
await act(async () => { vi.advanceTimersByTime(600) })
```

**Module Reset for Re-import:**
```typescript
beforeEach(() => { vi.resetModules() })
// Then dynamic import:
const { viewsRateLimit } = await import('./rate-limit')
```

**What to Mock:**
- `next/navigation` hooks (`useSearchParams`, `usePathname`)
- `next/link` component (renders as plain `<a>` in jsdom)
- Browser APIs: `matchMedia`, `ResizeObserver`, `navigator.clipboard`, `window.history`
- Redis/external services: `@/lib/redis`, `@upstash/ratelimit`
- Client components with browser-only deps when testing parents: `./code-block`

**What NOT to Mock:**
- The module under test itself
- Pure utility functions (test real implementation)
- React rendering (use @testing-library/react)
- CSS classes (inspect via `className` property)

## File-Based Assertion Pattern

The `src/lib/seo-assets.test.ts` file uses a distinctive pattern: reading source files with `fs.readFileSync` and asserting on their contents. This avoids needing a Next.js runtime for testing ImageResponse, dynamic imports, etc.

```typescript
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd())

it('icon.svg contains the Othala rune path', () => {
  const svg = readFileSync(join(root, 'src/app/icon.svg'), 'utf-8')
  expect(svg).toContain('<path')
  expect(svg).toContain('#E8B4B8')
})

it('exports generateStaticParams', () => {
  const src = readFileSync(join(root, 'src/app/blog/[slug]/opengraph-image.tsx'), 'utf-8')
  expect(src).toMatch(/export\s+(function|async\s+function)\s+generateStaticParams/)
})
```

**Use this pattern when:**
- Testing Next.js features that require the full runtime (ImageResponse, route handlers)
- Verifying source-level contracts (exports, imports, content strings)
- Checking binary asset existence and size

## E2E Patterns

**Navigation via listing pages:**
```typescript
// Navigate to blog listing, then click into a post (avoids hardcoded slugs)
await page.goto('/blog')
const firstPost = page.locator('a[href^="/blog/"]').first()
await firstPost.click()
await page.waitForURL(/\/blog\/.+/)
```

**Graceful skip for content-dependent tests:**
```typescript
if (await tocToggle.count() === 0) {
  test.skip(true, 'No TOC on this blog post')
  return
}
```

**API route interception:**
```typescript
await page.route('**/api/views/**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ views: 42 }),
  })
})
```

**Mobile viewport setup:**
```typescript
import { devices } from '@playwright/test'
test.use({ ...devices['Pixel 5'] })
```

**Clipboard permissions:**
```typescript
test('copies code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  // ...
})
```

## Test Naming Convention

**Unit tests:** `describe('functionName', () => { it('verb phrase describing behavior', ...) })`
- Examples: `it('formats ISO date to human-readable')`, `it('rejects a slug with special characters')`

**Component tests:** `describe('ComponentName', () => { ... })` or `describe('ComponentName mode (context)', () => { ... })`
- Examples: `describe('CopyButton keyboard accessibility (A11Y-01)')`, `describe('FilterChip toggle mode')`

**Traceability tags:** Some describe blocks include requirement IDs in parentheses:
- `(A11Y-01)`, `(SEC-01)`, `(SEC-02)`, `(SEC-06)`, `(SEO-01)` through `(SEO-06)`, `(CLN-02)`
- These trace back to concern/gap IDs from planning documents

**E2E tests:** `test.describe('feature name', () => { test('user action and expected result', ...) })`
- Examples: `test('toggles open and closed')`, `test('copies code and shows copied state')`

## Coverage

**Requirements:** No coverage thresholds enforced
**Coverage tooling:** Vitest supports it but no `--coverage` script is configured
**`.gitignore`** includes `/coverage` entry (ready for when coverage is added)

## Test Types

**Unit Tests:**
- Pure functions: `format.ts`, `validation.ts`, `views.ts`, `rune-glows.ts`
- Configuration verification: `rate-limit.test.ts`, `security-headers.test.ts`
- Asset/source verification: `seo-assets.test.ts`

**Component Tests:**
- Render + assert on DOM: `copy-button.test.tsx`, `filter-chip.test.tsx`, `mdx-content.test.tsx`
- Error boundaries: `error.test.tsx`, `global-error.test.tsx`, `blog/[slug]/error.test.tsx`
- Loading skeletons: `loading.test.tsx`

**Hook Tests:**
- State machine behavior: `use-hero-animation.test.ts`
- Filter logic with URL sync: `use-filtered-list.test.ts`
- ResizeObserver integration: `use-glow-positions.test.ts`

**E2E Tests:**
- Interactive flows: mobile menu, code copy, mobile TOC
- API-dependent rendering: view counts (with route interception)
- Cross-device: mobile tests use Pixel 5 viewport

## Additional Quality Layers

**Layer 1: TypeScript Strict Mode** (`tsconfig.json` with `strict: true`)
- Catches type mismatches, null access, import errors

**Layer 2: ESLint** (`eslint.config.mjs`)
- React hooks rules, Next.js patterns, jsx-a11y accessibility

**Layer 3: Velite Schema Validation** (`velite.config.ts`)
- Validates all MDX frontmatter against Zod schemas at build time
- Run standalone: `npm run velite`

**Layer 4: Next.js Build**
- Server/client boundary violations, invalid metadata, hydration issues

**Deployment:** Git-push to Vercel runs `velite && next build`. No CI pipeline -- tests must be run manually before push.

---

*Testing analysis: 2026-04-03*
