# Phase 24: Audit Gap Closures - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 24-audit-gap-closures
**Areas discussed:** Draft guard scope, E2E dev-script approach, Clipboard failure UX, Test scope for new clipboard path

---

## Gray Area Selection

**Question:** Which areas do you want to discuss for Phase 24 (Audit Gap Closures)?

| Option | Description | Selected |
|--------|-------------|----------|
| Draft guard scope | Centralize draft filter or leave as defense-in-depth? | ✓ |
| E2E dev-script approach | env var, separate config, or CLI override? | ✓ |
| Clipboard failure UX | Visual + a11y treatment on writeText reject | ✓ |
| Test scope for new clipboard path | Failure only, or also missing clipboard API? | ✓ |

**User's choice:** All four areas.

---

## Draft Guard Scope

### Q1: How should the draft filter be applied across the codebase?

| Option | Description | Selected |
|--------|-------------|----------|
| Extract `publishedPosts` helper | New helper, replace 3 inline filters + use in [slug] page | ✓ |
| Minimal change — just fix [slug] | Local fix only, leave 3 inline filters | |
| Both — helper + keep existing as defense-in-depth | Helper used in [slug] only, don't refactor others | |

**User's choice:** Extract `publishedPosts` helper (Recommended).

### Q2: Should drafts also be excluded from blog OG image / metadata routes?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, audit and exclude | Check opengraph-image.tsx and generateMetadata for draft handling | ✓ |
| No, the notFound() guard is sufficient | Trust the framework's 404 routing | |

**User's choice:** Yes, audit and exclude (Recommended).

---

## E2E Dev-Script Approach

### Q1: How should `test:e2e:dev` be wired into Playwright?

| Option | Description | Selected |
|--------|-------------|----------|
| Env var switch in single config | `PW_DEV_SERVER=1` branches webServer.command in playwright.config.ts | ✓ |
| Separate `playwright.dev.config.ts` | Second config file extending the base | |
| Inline command via cross-env | Same as env var but Windows-safe | |

**User's choice:** Env var switch in single config (Recommended).

**Selected preview:**
```ts
// playwright.config.ts
webServer: {
  command: process.env.PW_DEV_SERVER === '1'
    ? 'npm run dev'
    : 'npm run build && npm run start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
}

// package.json
"test:e2e": "playwright test",
"test:e2e:dev": "PW_DEV_SERVER=1 playwright test"
```

### Q2: Should the dev-server e2e variant adjust webServer timeout?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 120s timeout for both | Turbopack startup is well under 120s | ✓ |
| Bump dev mode to 180s | Conservative for cold-start variance | |

**User's choice:** Keep 120s timeout for both (Recommended).

---

## Clipboard Failure UX

### Q1: What should the copy button show when `navigator.clipboard.writeText` rejects?

| Option | Description | Selected |
|--------|-------------|----------|
| X icon + 'Copy failed' aria for 2s | Symmetric to success path; new xIcon constant; console.error | ✓ |
| Reuse copy icon, only swap aria-label | Minimal visual change, aria-only | |
| Red border flash + aria-label | Visually loud, breaks neobrutalist palette | |

**User's choice:** X icon + 'Copy failed' aria for 2s (Recommended).

**Selected preview:**
```ts
button.addEventListener('click', async () => {
  const code = pre.querySelector('code')
  const text = code?.textContent || pre.textContent || ''
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    button.innerHTML = checkIcon
    button.setAttribute('aria-label', 'Copied!')
  } catch (err) {
    console.error('Clipboard write failed:', err)
    button.innerHTML = xIcon
    button.setAttribute('aria-label', 'Copy failed')
  }
  setTimeout(() => {
    button.innerHTML = copyIcon
    button.setAttribute('aria-label', 'Copy code')
  }, 2000)
})
```

### Q2: Should the failure state use `aria-live='polite'` for assistive tech announcement?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add aria-live='polite' to button | Screen readers re-announce on aria-label change | ✓ |
| No, aria-label change is enough | Skip explicit live region | |

**User's choice:** Yes, add aria-live='polite' to button (Recommended).

---

## Test Scope for New Clipboard Path

### Q1: What test coverage should the new clipboard failure path have?

| Option | Description | Selected |
|--------|-------------|----------|
| Just the rejection scenario | 1 new test, total 6, no production guard for missing clipboard | ✓ |
| Rejection + missing clipboard API | 2 new tests, total 7, requires production guard | |
| Rejection + revert timing assertion | 1 new test + extend existing for 2s revert | |

**User's choice:** Just the rejection scenario (Recommended).

### Q2: Should the failure test also assert `console.error` was called?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, spy on console.error | Document logging contract, silence test output | ✓ |
| No, just assert visible state | Skip implementation details | |

**User's choice:** Yes, spy on console.error (Recommended).

---

## Wrap-up

**Question:** Anything else to clarify, or ready for context?

**User's choice:** Ready for context.

---

## Claude's Discretion

- Exact filename for `publishedPosts` helper (`src/lib/posts.ts` vs extending an existing lib file)
- Whether to use `vi.useFakeTimers()` or `waitFor({ timeout: 2500 })` for the 2000ms revert assertion
- Exact lucide X icon SVG path (multiple variants exist)

## Deferred Ideas

- `navigator.clipboard === undefined` runtime guard (declined per D-14)
- Refactoring CodeBlockEnhancer away from DOM mutation (accepted trade-off per CONCERNS.md)
