---
phase: 24
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/blog/code-block-enhancer.tsx
  - src/components/blog/code-block-enhancer.test.tsx
autonomous: true
requirements:
  - GAP-03
tags: [clipboard, error-handling, accessibility, vitest, dom-mutation]

must_haves:
  truths:
    - "When navigator.clipboard.writeText rejects, the button shows an X icon and aria-label becomes 'Copy failed'"
    - "When navigator.clipboard.writeText rejects, console.error is called with the rejection error"
    - "After 2000ms the button reverts to copyIcon and aria-label 'Copy code' (both success and failure paths)"
    - "The button has aria-live='polite' set once at creation time so screen readers announce label changes"
    - "The existing success path (writeText resolves) still works exactly as before"
    - "There are now exactly 6 tests in the test file (5 existing + 1 new)"
  artifacts:
    - path: "src/components/blog/code-block-enhancer.tsx"
      provides: "try/catch click handler with xIcon + aria-live"
      contains: "xIcon"
    - path: "src/components/blog/code-block-enhancer.test.tsx"
      provides: "6 tests including clipboard failure path"
      contains: "Copy failed"
  key_links:
    - from: "click handler catch block"
      to: "xIcon constant"
      via: "button.innerHTML = xIcon"
      pattern: "xIcon"
    - from: "click handler catch block"
      to: "console.error"
      via: "console.error('Clipboard write failed:', err)"
      pattern: "Clipboard write failed"
---

<objective>
Close GAP-03 by wrapping `navigator.clipboard.writeText` in a try/catch with a visible failure state (X icon + 'Copy failed' aria-label) and adding one unit test covering the rejection path. The success path stays unchanged. `aria-live='polite'` is added to the button at creation time for screen reader support.

Purpose: Currently a clipboard rejection produces an unhandled promise rejection with no visual feedback. After this change, users see a symmetric failure state (X icon, same 2s revert as success) and the error is logged for debugging.

Output: Edited `code-block-enhancer.tsx` (try/catch + xIcon + aria-live), edited `code-block-enhancer.test.tsx` (+1 test, total 6).
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
<!-- Current code-block-enhancer.tsx click handler (lines 49-61) -->
```typescript
button.addEventListener('click', async () => {
  const code = pre.querySelector('code')
  const text = code?.textContent || pre.textContent || ''
  if (text) {
    await navigator.clipboard.writeText(text)
    button.innerHTML = checkIcon
    button.setAttribute('aria-label', 'Copied!')
    setTimeout(() => {
      button.innerHTML = copyIcon
      button.setAttribute('aria-label', 'Copy code')
    }, 2000)
  }
})
```

<!-- Current icon constants (lines 71-73) -->
```typescript
const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`

const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
```

<!-- Current test file: 5 tests, beforeEach mocks clipboard with mockResolvedValue(undefined) -->
<!-- Test #3 uses waitFor to bridge async click → DOM assertion -->
<!-- afterEach clears document.body.innerHTML -->
```typescript
beforeEach(() => {
  document.body.innerHTML = `<div class="prose"><pre><code>const x = 1</code></pre></div>`
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  })
})
```
</interfaces>
</context>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser clipboard API → user feedback | Async operation that can reject for permission denial, insecure context, or browser bugs. Without handling, rejection surfaces as unhandled promise rejection with no user-facing feedback. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-24-03 | Repudiation / Denial of Service (minor) | `code-block-enhancer.tsx` click handler | mitigate | Wrap `writeText` in try/catch (D-09). Log rejection via `console.error` for debugging (D-11). Show `xIcon` + `'Copy failed'` aria-label so user knows the action did not succeed (D-09, D-10). Revert after 2000ms same as success path (D-09). Set `aria-live='polite'` on button once so screen readers announce the state change (D-12). Unit test asserts the failure path (D-15, D-16). |
</threat_model>

<tasks>

<task type="auto">
  <name>Task 1: Add xIcon, try/catch, aria-live to code-block-enhancer.tsx</name>
  <files>src/components/blog/code-block-enhancer.tsx</files>
  <read_first>
    - src/components/blog/code-block-enhancer.tsx (full file — 74 lines)
    - .planning/phases/24-audit-gap-closures/24-CONTEXT.md D-09, D-10, D-11, D-12
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Pattern 3 (symmetric success/failure) + Example 5
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Anti-Patterns (no re-throw, single setTimeout outside try/catch, no setTimeout duplication)
  </read_first>
  <action>
    Three changes to `src/components/blog/code-block-enhancer.tsx`. All changes are inside the existing component structure; no new imports needed.

    **Change 1: Add `aria-live='polite'` at button creation (D-12).**

    After line 46 (`button.setAttribute('aria-label', 'Copy code')`) add:
    ```typescript
    button.setAttribute('aria-live', 'polite')
    ```

    **Change 2: Rewrite click handler with try/catch (D-09, D-11).**

    Replace lines 49-61 (the entire `button.addEventListener('click', async () => { ... })` block) with:

    ```typescript
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

    Key structural points:
    - The `if (text)` wrapper becomes `if (!text) return` — early return keeps try/catch flat (RESEARCH.md notes this is preferred but both shapes work; early return is cleaner).
    - The `setTimeout` is OUTSIDE the try/catch but AFTER both branches. This is mandatory per D-09 ("single setTimeout runs after both branches"). Do NOT put setTimeout inside try AND catch (duplication). Do NOT put it inside try only (would not fire on failure).
    - Do NOT re-throw `err` after `console.error` (RESEARCH.md Anti-Pattern — the whole point is to handle the rejection).

    **Change 3: Add `xIcon` constant (D-10).**

    Add after the existing `checkIcon` constant (after line 73), matching the existing style exactly (16x16 rendered size, 24x24 viewBox, stroke-based, same SVG attributes):

    ```typescript
    const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
    ```

    This is lucide's canonical `x` icon with two crossing diagonal paths. It matches the `copyIcon` and `checkIcon` stroke style (width 2, linecap round, linejoin round).

    Do NOT modify anything else in the file — the component's structure (useEffect, enhanced ref, DOM querying, wrapper creation, button className) stays identical.
  </action>
  <verify>
    <automated>cd /home/smada/git/smadam813/keech-dev && npx vitest run src/components/blog/code-block-enhancer.test.tsx && npm run lint</automated>
  </verify>
  <acceptance_criteria>
    - `grep "aria-live" src/components/blog/code-block-enhancer.tsx` finds `setAttribute('aria-live', 'polite')`
    - `grep "xIcon" src/components/blog/code-block-enhancer.tsx` finds both the constant declaration and `button.innerHTML = xIcon`
    - `grep "Clipboard write failed" src/components/blog/code-block-enhancer.tsx` finds `console.error('Clipboard write failed:', err)`
    - `grep "Copy failed" src/components/blog/code-block-enhancer.tsx` finds `setAttribute('aria-label', 'Copy failed')`
    - `grep "catch (err)" src/components/blog/code-block-enhancer.tsx` finds the catch block
    - `grep -c "setTimeout" src/components/blog/code-block-enhancer.tsx` equals 1 (single setTimeout outside try/catch)
    - The existing 5 tests still pass: `npx vitest run src/components/blog/code-block-enhancer.test.tsx` exits 0
    - `npm run lint` exits 0
  </acceptance_criteria>
  <done>
    Click handler wraps `writeText` in try/catch. Failure shows xIcon + 'Copy failed'. Success still shows checkIcon + 'Copied!'. Both revert after 2000ms via single setTimeout. `aria-live='polite'` set on button at creation. `console.error` logs the rejection. No unhandled promise rejection possible.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add clipboard failure path unit test (6th test)</name>
  <files>src/components/blog/code-block-enhancer.test.tsx</files>
  <read_first>
    - src/components/blog/code-block-enhancer.test.tsx (full file — 62 lines, 5 existing tests)
    - src/components/blog/code-block-enhancer.tsx (the file just edited in Task 1 — to understand current click handler shape)
    - .planning/phases/24-audit-gap-closures/24-CONTEXT.md D-15, D-16, D-17
    - .planning/phases/24-audit-gap-closures/24-RESEARCH.md Pitfall 4 (waitFor instead of fake timers) + Pitfall 5 (mock leak between tests — use mockRejectedValueOnce) + Example 4
  </read_first>
  <behavior>
    - Test: when clipboard writeText rejects, button shows xIcon innerHTML and aria-label becomes 'Copy failed'
    - Test: console.error was called with 'Clipboard write failed:' and the rejection error
    - Test: after 2000ms revert, button shows copyIcon innerHTML and aria-label becomes 'Copy code'
  </behavior>
  <action>
    Add exactly ONE new `it(...)` block at the end of the `describe(...)` in `src/components/blog/code-block-enhancer.test.tsx` per D-15. This is the 6th test (D-17: existing 5 unchanged).

    Add the following test AFTER the last existing `it(...)` block (after line 61, before the closing `})` of the `describe`):

    ```typescript
    it('shows failure state when clipboard writeText rejects', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const rejection = new Error('Clipboard denied')
      ;(navigator.clipboard.writeText as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(rejection)

      render(<CodeBlockEnhancer />)
      const button = document.querySelector('button[aria-label="Copy code"]') as HTMLButtonElement
      expect(button).not.toBeNull()
      button.click()

      // Wait for the catch block to execute and update DOM
      await waitFor(() => {
        expect(button.getAttribute('aria-label')).toBe('Copy failed')
      })
      expect(button.innerHTML).toContain('M18 6 6 18')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Clipboard write failed:', rejection)

      // Wait for the 2000ms revert timer
      await waitFor(
        () => {
          expect(button.getAttribute('aria-label')).toBe('Copy code')
        },
        { timeout: 2500 }
      )
      expect(button.innerHTML).toContain('M4 16')

      consoleErrorSpy.mockRestore()
    })
    ```

    Key decisions per RESEARCH.md:
    - Uses `waitFor` (not `vi.useFakeTimers()`) — per Pitfall 4, fake timers don't flush Promise microtasks. `waitFor` handles both the async catch and the setTimeout revert. This matches the existing test #3 style.
    - Uses `mockRejectedValueOnce` (not `mockRejectedValue`) — per Pitfall 5, `Once` auto-resets after one call so the next test's `beforeEach` re-stubs cleanly.
    - Uses `vi.spyOn(console, 'error').mockImplementation(() => {})` per D-16. The spy prevents the error from printing to test output and lets us assert on the call.
    - Asserts `M18 6 6 18` substring to verify the xIcon path is present (lucide X canonical path from D-10).
    - Asserts `M4 16` substring to verify the copyIcon path is present after revert (existing copyIcon path contains `M4 16c-1.1 0-2-.9-2-2V4`).
    - `consoleErrorSpy.mockRestore()` at end per D-16 (restore can also be handled by `vi.restoreAllMocks()` in afterEach, but explicit restore matches the D-16 guidance and doesn't require modifying the shared afterEach).

    Do NOT modify any of the 5 existing tests (D-17). Do NOT add new `beforeEach` or `afterEach` blocks. Do NOT import anything new — `vi`, `render`, `waitFor`, and `CodeBlockEnhancer` are already imported at the top of the file.
  </action>
  <verify>
    <automated>cd /home/smada/git/smadam813/keech-dev && npx vitest run src/components/blog/code-block-enhancer.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "it(" src/components/blog/code-block-enhancer.test.tsx` equals 6 (5 existing + 1 new)
    - `grep "Copy failed" src/components/blog/code-block-enhancer.test.tsx` finds the assertion
    - `grep "mockRejectedValueOnce" src/components/blog/code-block-enhancer.test.tsx` finds the mock setup
    - `grep "consoleErrorSpy" src/components/blog/code-block-enhancer.test.tsx` finds the spy
    - `grep "Clipboard write failed" src/components/blog/code-block-enhancer.test.tsx` finds the assertion
    - `npx vitest run src/components/blog/code-block-enhancer.test.tsx` exits 0 with 6 tests passing
  </acceptance_criteria>
  <done>
    6th test added. It mocks `writeText` to reject, asserts the X icon and 'Copy failed' aria-label appear, asserts `console.error` was called with the rejection, and asserts the button reverts to copyIcon + 'Copy code' after 2000ms. All 6 tests pass. Existing 5 tests unchanged per D-17.
  </done>
</task>

</tasks>

<verification>
- `npx vitest run src/components/blog/code-block-enhancer.test.tsx` — 6 tests pass (5 existing + 1 new)
- `npx vitest run` — full unit suite green (no regressions anywhere)
- `npm run lint` — green
- `npm run build` — green (no build-time side effects from this change)
</verification>

<success_criteria>
- GAP-03 closed per ROADMAP.md Phase 24 success criteria 4 and 5:
  4. When `navigator.clipboard.writeText` rejects, the copy button shows a visible failure state (X icon, 'Copy failed' aria-label), logs to console.error, and reverts after 2000ms. No unhandled promise rejection.
  5. Unit tests cover the clipboard failure path — 6 total tests (5 existing + 1 new), all passing.
- Success path unchanged: resolving writeText still shows checkIcon + 'Copied!' + 2000ms revert
- `aria-live='polite'` on the button enables screen reader announcements for both success and failure
</success_criteria>

<output>
After completion, create `.planning/phases/24-audit-gap-closures/24-03-SUMMARY.md` following the summary template. Record the `waitFor` pattern for async DOM testing (not fake timers) as the established pattern for this file.
</output>
