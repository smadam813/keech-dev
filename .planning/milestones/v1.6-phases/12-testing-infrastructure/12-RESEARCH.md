# Phase 12: Testing Infrastructure - Research

**Researched:** 2026-04-03
**Domain:** Vitest unit testing, Playwright E2E testing, accessible mobile TOC component
**Confidence:** HIGH

## Summary

This phase introduces automated testing to a codebase that currently has zero test infrastructure -- no test runner, no test files, no test dependencies. The work splits into three distinct domains: (1) Vitest for unit testing pure functions and helpers, (2) Playwright for E2E browser testing of interactive behaviors, and (3) a mobile-accessible collapsible table of contents component.

All three target functions (`formatDate`, view count helpers, `computeGlowPositions`) are pure or nearly pure, making them straightforward Vitest targets. The E2E targets (mobile menu toggle, code block copy, view count increment) all involve browser APIs that cannot be meaningfully unit tested -- Playwright is the right tool. The mobile TOC is a UI component that reuses the existing `TocEntry` type and `TocList` rendering pattern.

**Primary recommendation:** Use Vitest 4.x with `vite-tsconfig-paths` for path alias resolution, Playwright 1.59 with Chromium-only and `next build && next start` as the webServer command, and a simple client-side accordion component for the mobile TOC.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Mobile TOC presented as an expandable accordion at the top of blog post content -- positioned between the back-navigation link and the post body. Simple, no z-index/positioning complexity.
- **D-02:** Appears on screens below `lg` breakpoint (< 1024px) where the existing sidebar TOC is hidden. Desktop sidebar TOC remains unchanged.
- **D-03:** Collapsed by default -- user taps to expand. Does not push content down on initial page load.
- **D-04:** Neobrutalist styling -- bold border (`border-[3px] border-foreground`), hard shadow (`shadow-brutal`), teal accent on the toggle button. Consistent with site identity.
- **D-05:** Test files co-located with source files (e.g., `src/lib/format.test.ts` next to `src/lib/format.ts`). Easier to find and maintain.
- **D-06:** `vitest.config.ts` at project root with `resolve.alias` mirroring tsconfig path aliases (`@/*` -> `./src/*`, `@/.velite` -> `./.velite`).
- **D-07:** jsdom environment for tests that touch DOM APIs. Default `node` environment for pure function tests.
- **D-08:** Chromium only -- sufficient for a personal portfolio, fastest execution.
- **D-09:** Tests run against built app (`next build` + `next start`) -- tests the production artifact, not dev mode.
- **D-10:** E2E test files in `e2e/` directory at project root (Playwright convention).
- **D-11:** Unit tests target only the required functions: `formatDate()`, view count helpers, and `computeGlowPositions()`. No gold-plating.
- **D-12:** E2E tests target only the required behaviors: mobile menu toggle, code block copy button, and view count increment.
- **D-13:** Add `test` and `test:e2e` scripts to `package.json`.

### Claude's Discretion
- Exact Vitest/Playwright config options
- Test assertion style
- Mobile TOC animation (CSS transition vs. instant toggle)
- TOC toggle button text/icon
- Whether to add React Testing Library for mobile TOC component test or cover it via E2E only

### Deferred Ideas (OUT OF SCOPE)
- ESLint migration (Next.js 16.2.2 removed `next lint` CLI)
- CI/CD pipeline (GitHub Actions for running tests on push)
- Visual regression testing
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| A11Y-03 | Mobile/tablet users can navigate blog post sections via collapsible table of contents | Mobile TOC component design, TocEntry reuse pattern, accordion accessibility pattern |
| TEST-01 | Vitest configured with path aliases, jsdom, and React Testing Library | Vitest 4.x config with vite-tsconfig-paths, jsdom, RTL packages |
| TEST-02 | Unit tests cover date formatting, view count helpers, and rune glow position calculations | Analysis of all three target functions with edge cases identified |
| TEST-03 | Playwright configured for E2E testing | Playwright 1.59 config with Chromium-only, webServer targeting production build |
| TEST-04 | E2E tests cover mobile menu toggle, code copy button, and view count increment | Analysis of interactive behaviors, selectors, and test strategies |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.2 | Unit test runner | Official Next.js recommendation, TypeScript-native, fast, Vite-compatible |
| @playwright/test | 1.59.1 | E2E test framework | Official Next.js recommendation, built-in assertions, auto-wait |
| jsdom | 29.0.1 | DOM environment for Vitest | Standard for testing DOM-touching code without a browser |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | 6.0.1 | React JSX transform for Vitest | Required if testing React components with Vitest |
| vite-tsconfig-paths | 6.1.1 | Resolve tsconfig path aliases in Vitest | Required -- project uses `@/*` and `@/.velite` aliases |
| @testing-library/react | 16.3.2 | React component testing utilities | Only if testing mobile TOC component via Vitest (discretionary) |
| @testing-library/jest-dom | 6.9.1 | Custom DOM matchers (toBeVisible, toHaveAttribute) | Pairs with RTL for readable assertions |
| @testing-library/dom | (peer dep) | DOM testing utilities | Peer dependency of @testing-library/react |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Co-located tests | `__tests__/` directory | CONTEXT.md locked D-05: co-located |
| Chromium + Firefox + WebKit | Chromium only | CONTEXT.md locked D-08: Chromium only |
| Dev server for E2E | Production build | CONTEXT.md locked D-09: production build |

**Installation:**
```bash
npm install -D vitest jsdom @vitejs/plugin-react vite-tsconfig-paths @testing-library/react @testing-library/jest-dom @playwright/test
npx playwright install chromium
```

## Architecture Patterns

### Recommended Project Structure
```
keech-dev/
├── vitest.config.ts           # Vitest config with path aliases
├── playwright.config.ts       # Playwright config, Chromium only
├── e2e/                       # E2E test files (D-10)
│   ├── mobile-menu.spec.ts
│   ├── code-copy.spec.ts
│   └── view-count.spec.ts
├── src/
│   ├── lib/
│   │   ├── format.ts
│   │   ├── format.test.ts         # Co-located unit test (D-05)
│   │   ├── views.ts
│   │   ├── views.test.ts          # Co-located unit test
│   │   ├── rune-glows.ts
│   │   └── rune-glows.test.ts     # Co-located unit test
│   └── components/
│       └── blog/
│           ├── toc.tsx            # Existing server TOC
│           └── mobile-toc.tsx     # New client component (A11Y-03)
```

### Pattern 1: Vitest Config with Path Aliases
**What:** vitest.config.ts that mirrors tsconfig paths using vite-tsconfig-paths plugin
**When to use:** Always -- this project relies on `@/*` path aliases everywhere
**Example:**
```typescript
// Source: Next.js official docs + vite-tsconfig-paths docs
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

### Pattern 2: Playwright Config for Production Build
**What:** Playwright runs against `next start` (production build)
**When to use:** D-09 requires production artifact testing
**Example:**
```typescript
// Source: Next.js official Playwright guide
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

### Pattern 3: Collapsible Accordion (Mobile TOC)
**What:** Client component with toggle state, CSS transition for expand/collapse
**When to use:** A11Y-03 mobile TOC requirement
**Example:**
```typescript
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Reuses TocEntry type and TocList from existing toc.tsx
// Toggle state, aria-expanded, aria-controls for accessibility
// CSS transition on max-height for smooth expand/collapse
// Visible only below lg breakpoint (lg:hidden)
```

### Anti-Patterns to Avoid
- **Testing implementation details:** Test what functions return, not how they compute it. `computeGlowPositions` tests should verify output positions, not internal scale/offset math.
- **Mocking localStorage globally:** The `views.ts` helpers already wrap localStorage in try/catch. Test with real jsdom localStorage, not mocks.
- **Using `page.waitForTimeout()` in E2E:** Use Playwright's built-in auto-wait and `expect(locator).toBeVisible()` instead of arbitrary sleeps.
- **Testing SSR components with Vitest:** Async server components are not supported in Vitest. All three unit test targets are pure functions, so this is not an issue here.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path alias resolution in Vitest | Manual `resolve.alias` config | `vite-tsconfig-paths` plugin | Reads tsconfig.json directly, stays in sync with project aliases |
| DOM assertions | Custom assertion helpers | `@testing-library/jest-dom` | `toBeVisible()`, `toHaveAttribute()`, `toHaveTextContent()` battle-tested |
| Mobile viewport E2E | Manual `page.setViewportSize()` | Playwright `devices['Pixel 5']` preset | Includes correct viewport, userAgent, deviceScaleFactor |
| Waiting for elements in E2E | `setTimeout` / polling loops | Playwright auto-wait + `expect(locator)` | Built-in retrying assertions handle timing automatically |

## Common Pitfalls

### Pitfall 1: Vitest Environment Mismatch
**What goes wrong:** Tests for `formatViewCount()` (pure function) fail because jsdom adds unexpected browser globals, or tests for `getCachedViews()` fail because localStorage is not available in node environment.
**Why it happens:** Vitest defaults to `node` environment. localStorage is only available in `jsdom`.
**How to avoid:** Use per-file environment annotations: add `// @vitest-environment jsdom` at the top of `views.test.ts` that needs localStorage. Keep `format.test.ts` and `rune-glows.test.ts` in default `node` environment since they are pure functions.
**Warning signs:** `ReferenceError: localStorage is not defined`

### Pitfall 2: Playwright webServer Timeout
**What goes wrong:** `npm run build && npm run start` takes too long and Playwright gives up waiting.
**Why it happens:** Next.js build can take 30-60+ seconds. Default Playwright webServer timeout is 60s.
**How to avoid:** Set `webServer.timeout: 120000` (2 minutes). Also consider `reuseExistingServer: true` for local development to avoid rebuilding every test run.
**Warning signs:** "Timed out waiting for server" error before tests start.

### Pitfall 3: E2E View Count Test Flakiness
**What goes wrong:** View count E2E test fails because Redis is not available in the test environment, or the dedup key from a previous run blocks the increment.
**Why it happens:** The view counter POST endpoint requires Upstash Redis and has IP-based dedup with 24h TTL.
**How to avoid:** The test should verify the fetch fires and the DOM updates -- not the exact count value. Assert that the view count element becomes visible and contains a number. If Redis is unavailable, the component fails silently (by design), so test the success path only when env vars are present, or use `page.route()` to intercept the API call and return a mock response.
**Warning signs:** Test passes locally (with env vars) but fails in other environments.

### Pitfall 4: Mobile Menu E2E -- Viewport Must Be Mobile
**What goes wrong:** Test clicks the hamburger button but it does not exist because the test runs in desktop viewport.
**Why it happens:** The hamburger button has `md:hidden` class -- it only renders below 768px width.
**How to avoid:** Use a mobile device preset in the Playwright project config (e.g., `devices['Pixel 5']` with 393x851 viewport), or create a separate mobile project for mobile-specific tests.
**Warning signs:** `locator.click: Error: strict mode violation, no element found`

### Pitfall 5: Copy Button Requires Clipboard Permission
**What goes wrong:** `navigator.clipboard.writeText()` throws because Playwright's Chromium context does not grant clipboard permission by default.
**Why it happens:** Clipboard API requires explicit permission in automated browser contexts.
**How to avoid:** Grant clipboard permission in the test's browser context: `context.grantPermissions(['clipboard-read', 'clipboard-write'])` or use `page.evaluate` to read clipboard after the action.
**Warning signs:** `NotAllowedError: Write permission denied`

### Pitfall 6: Accordion Accessibility -- Missing ARIA
**What goes wrong:** Screen readers do not announce the TOC toggle state or the expanded content.
**Why it happens:** Forgetting `aria-expanded` on the toggle button or `aria-controls` linking to the content panel.
**How to avoid:** Follow the WAI-ARIA disclosure pattern: button with `aria-expanded={isOpen}` and `aria-controls="mobile-toc-content"`, content panel with `id="mobile-toc-content"`.
**Warning signs:** Manual screen reader testing shows no state change announcement.

## Code Examples

### Unit Test: formatDate()
```typescript
// src/lib/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('formats ISO date string to human-readable format', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024')
  })

  it('formats date with time component', () => {
    expect(formatDate('2024-06-01T12:00:00Z')).toBe('June 1, 2024')
  })

  it('handles end-of-year dates', () => {
    expect(formatDate('2024-12-31')).toBe('December 31, 2024')
  })
})
```

### Unit Test: view count helpers
```typescript
// src/lib/views.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { formatViewCount, getCachedViews, setCachedViews } from './views'

describe('formatViewCount', () => {
  it('pluralizes correctly for 0', () => {
    expect(formatViewCount(0)).toBe('0 views')
  })

  it('uses singular for 1', () => {
    expect(formatViewCount(1)).toBe('1 view')
  })

  it('formats large numbers with locale separators', () => {
    expect(formatViewCount(1234)).toBe('1,234 views')
  })
})

describe('getCachedViews / setCachedViews', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no cached value', () => {
    expect(getCachedViews('test-slug')).toBeNull()
  })

  it('round-trips a value through cache', () => {
    setCachedViews('test-slug', 42)
    expect(getCachedViews('test-slug')).toBe(42)
  })
})
```

### Unit Test: computeGlowPositions()
```typescript
// src/lib/rune-glows.test.ts
import { describe, it, expect } from 'vitest'
import { computeGlowPositions, RUNE_GLOWS } from './rune-glows'

describe('computeGlowPositions', () => {
  it('returns positions for all runes', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 1920, 1080)
    expect(positions).toHaveLength(RUNE_GLOWS.length)
  })

  it('marks all runes visible in a large container', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 2560, 1429)
    expect(positions.every((p) => p.visible)).toBe(true)
  })

  it('handles zero-dimension container gracefully', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 0, 0)
    expect(positions).toHaveLength(RUNE_GLOWS.length)
  })

  it('returns string pixel values for left and top', () => {
    const positions = computeGlowPositions(RUNE_GLOWS, 1920, 1080)
    expect(positions[0].left).toMatch(/^-?\d+(\.\d+)?px$/)
    expect(positions[0].top).toMatch(/^-?\d+(\.\d+)?px$/)
  })
})
```

### E2E Test: Mobile Menu Toggle
```typescript
// e2e/mobile-menu.spec.ts
import { test, expect } from '@playwright/test'

test.describe('mobile menu', () => {
  test.use({ ...require('@playwright/test').devices['Pixel 5'] })

  test('toggles open and closed', async ({ page }) => {
    await page.goto('/')
    const menuButton = page.getByRole('button', { name: /navigation menu/i })
    const menu = page.locator('#mobile-menu')

    // Menu starts closed
    await expect(menu).not.toBeVisible()

    // Open menu
    await menuButton.click()
    await expect(menu).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    // Close menu
    await menuButton.click()
    await expect(menu).not.toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
```

### E2E Test: Code Block Copy
```typescript
// e2e/code-copy.spec.ts
import { test, expect } from '@playwright/test'

test('code block copy button copies text to clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  // Navigate to a blog post that has code blocks
  await page.goto('/blog') // find a post with code
  // ... navigate to specific post

  const codeBlock = page.locator('[data-rehype-pretty-code-figure]').first()
  await codeBlock.hover()

  const copyButton = codeBlock.getByRole('button', { name: 'Copy code' })
  await copyButton.click()

  await expect(copyButton).toHaveAttribute('aria-label', 'Copied!')
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + ts-jest | Vitest (native TypeScript, ESM) | 2023-2024 | Faster, no ts-jest transform needed, Vite plugin ecosystem |
| Cypress for E2E | Playwright | 2023-2024 | Faster execution, built-in auto-wait, multi-browser, better CI |
| Manual `resolve.alias` in vitest config | `vite-tsconfig-paths` plugin | Ongoing | Single source of truth for path aliases in tsconfig.json |
| `@testing-library/react` render + act | Vitest + RTL (globals mode) | Vitest 1.x+ | No manual act() wrapping needed for most cases |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + Playwright 1.59.1 |
| Config file | `vitest.config.ts` + `playwright.config.ts` (Wave 0 creates both) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Vitest configured and runs | smoke | `npx vitest run` | Wave 0 |
| TEST-02 | formatDate edge cases | unit | `npx vitest run src/lib/format.test.ts` | Wave 0 |
| TEST-02 | formatViewCount + cache helpers | unit | `npx vitest run src/lib/views.test.ts` | Wave 0 |
| TEST-02 | computeGlowPositions math | unit | `npx vitest run src/lib/rune-glows.test.ts` | Wave 0 |
| TEST-03 | Playwright configured and runs | smoke | `npx playwright test --list` | Wave 0 |
| TEST-04 | Mobile menu toggle | e2e | `npx playwright test e2e/mobile-menu.spec.ts` | Wave 0 |
| TEST-04 | Code copy button | e2e | `npx playwright test e2e/code-copy.spec.ts` | Wave 0 |
| TEST-04 | View count increment | e2e | `npx playwright test e2e/view-count.spec.ts` | Wave 0 |
| A11Y-03 | Mobile TOC navigable | e2e | `npx playwright test` (mobile project) | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run` (< 5s for 3 test files)
- **Per wave merge:** `npx vitest run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- framework config at project root
- [ ] `vitest.setup.ts` -- setup file for @testing-library/jest-dom matchers
- [ ] `playwright.config.ts` -- E2E config at project root
- [ ] `src/lib/format.test.ts` -- formatDate unit tests
- [ ] `src/lib/views.test.ts` -- view count helper unit tests
- [ ] `src/lib/rune-glows.test.ts` -- computeGlowPositions unit tests
- [ ] `e2e/mobile-menu.spec.ts` -- mobile menu toggle E2E
- [ ] `e2e/code-copy.spec.ts` -- code copy button E2E
- [ ] `e2e/view-count.spec.ts` -- view count increment E2E
- [ ] Install all dev dependencies (vitest, playwright, RTL, jsdom, etc.)
- [ ] `npx playwright install chromium` -- browser binary

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest + Playwright | Yes | 22.21.0 | -- |
| npm | Package installation | Yes | 11.6.2 | -- |
| Chromium (via Playwright) | E2E tests | No (install needed) | -- | `npx playwright install chromium` |
| Upstash Redis | View count E2E | Depends on env vars | -- | Mock API response via `page.route()` |

**Missing dependencies with no fallback:**
- None -- all can be installed as part of the phase.

**Missing dependencies with fallback:**
- Upstash Redis for view count E2E: Use `page.route()` to intercept `/api/views/*` and return mock response if env vars are absent. This makes the E2E test work without a live Redis connection.

## Open Questions

1. **React Testing Library for mobile TOC?**
   - What we know: The mobile TOC is a client component with toggle state. It could be tested via Vitest + RTL or via Playwright E2E.
   - What's unclear: Whether RTL adds enough value over E2E-only coverage for a simple accordion.
   - Recommendation: Cover via E2E (Playwright mobile project) since the behavior is purely interactive (click to expand/collapse). RTL is installed anyway for TEST-01 requirement, but no separate component test is needed for the TOC.

2. **E2E test blog post target**
   - What we know: Code copy and view count E2E tests need a specific blog post URL to navigate to. The post must have code blocks.
   - What's unclear: Which specific post slug to hardcode, or whether to discover dynamically.
   - Recommendation: Navigate to `/blog`, click the first post, and find a code block. If no posts have code blocks, the test should be skipped gracefully. Alternatively, use a known slug from the existing content.

## Sources

### Primary (HIGH confidence)
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) - Official configuration reference (updated March 2026)
- [Next.js Playwright Guide](https://nextjs.org/docs/app/guides/testing/playwright) - Official E2E setup (updated March 2026)
- [vite-tsconfig-paths npm](https://www.npmjs.com/package/vite-tsconfig-paths) - Path alias plugin docs
- npm registry version checks (vitest 4.1.2, @playwright/test 1.59.1, jsdom 29.0.1, etc.)

### Secondary (MEDIUM confidence)
- [Strapi Next.js Testing Guide](https://strapi.io/blog/nextjs-testing-guide-unit-and-e2e-tests-with-vitest-and-playwright) - Community patterns for Vitest + Playwright together
- [Vitest Configuration Docs](https://vitest.dev/config/) - Official Vitest config reference

### Tertiary (LOW confidence)
- None -- all findings verified against official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified against npm registry with current versions
- Architecture: HIGH - Patterns align with official Next.js testing guides and locked CONTEXT.md decisions
- Pitfalls: HIGH - Based on known behavior of Playwright clipboard API, jsdom localStorage, and Next.js build times

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable ecosystem, no major releases expected)
