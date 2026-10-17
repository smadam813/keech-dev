---
name: verify
description: Run the full pre-push check sequence for keech.dev in the correct order (velite, tsc, eslint, vitest) and report what failed. Use before pushing, after finishing a change, or when the user asks to verify/check the build.
---

Run these from the repo root, in this order. If velite fails, stop: every later step depends on it. Otherwise run steps 2-4 even if one fails, so independent failures all show up in one pass.

1. `npm run velite` regenerates `.velite/`. Skipping this on a fresh clone makes every later step fail with unresolved `@/.velite` imports.
2. `npx tsc --noEmit`
3. `npm run lint`. Warnings from `react-hooks/set-state-in-effect`, `react-hooks/static-components`, and `react-hooks/refs` are expected and intentional. Only errors count as failures.
4. `npm run test`

If the change touched routing, layouts, metadata, `generateStaticParams`, the server/client boundary, `next.config`, or dependencies, also run `npm run build` as step 5. CI and Vercel both build, and these failures only show up there.

Do not run Playwright here. It needs a full production build and is opt-in via `npm run test:e2e` or `npm run test:e2e:dev`. Mention it if the change touched routing, layout, navigation, or anything under `e2e/`.

Report format:

- One line per step: pass or fail.
- For a failure, include the relevant error output in a fenced code block and the file:line it points at.
- Fix failures caused by your own change, then rerun the failed steps. Do not "fix" pre-existing warnings that the lint config downgrades on purpose.
