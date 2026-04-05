# Phase 21: Dependency Upgrades - Context

**Gathered:** 2026-04-05 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply minor/patch and safe major dependency updates across the stack. All non-blocked dependencies reach their current stable versions with the content pipeline and site fully validated. TypeScript 6 is a separate phase (Phase 22).

</domain>

<decisions>
## Implementation Decisions

### Upgrade Ordering
- **D-01:** Risk-tiered batches: minor/patch updates first (DEPS-01), then major versions one-at-a-time (DEPS-02 shiki/rehype-pretty-code, DEPS-03 lucide-react, DEPS-04 @vercel/analytics)
- **D-02:** Each batch is validated before proceeding to the next — a failure in batch N blocks batch N+1

### Shiki 4 Migration
- **D-03:** Upgrade shiki 3→4 and rehype-pretty-code to 0.14.3 as a coupled pair in a single commit — these have a tight version dependency
- **D-04:** Validate CSS-variables theme works after upgrade — the `createCssVariablesTheme()` API and `--shiki-*` token variables in `globals.css` must produce identical syntax highlighting output
- **D-05:** If shiki 4 changes the `createCssVariablesTheme` API, adapt `velite.config.ts` rehype-pretty-code options accordingly

### Validation Strategy
- **D-06:** Full pipeline validation after each batch: `npm run build && npm run test && npm run lint && npm audit`
- **D-07:** Visual spot-check of code blocks after shiki 4 upgrade (CSS-variables theme is the highest-risk change)

### Conditional Dependencies
- **D-08:** DEPS-03 is active — Phase 20 confirmed lucide-react has 6 consumers and stays in the project. Upgrade to 1.x.
- **D-09:** DEPS-05 (TypeScript 6) is explicitly out of scope — handled in Phase 22

### Claude's Discretion
- Exact npm commands and flags for each upgrade batch
- Whether to use `npm update` vs manual `npm install package@version`
- Order of major upgrades within the major-version batch (DEPS-02/03/04)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Dependency Updates — DEPS-01 through DEPS-04 (DEPS-05 is Phase 22)

### Upgrade targets
- `package.json` — Current dependency versions (source of truth for what needs upgrading)
- `package-lock.json` — Lock file that must be regenerated after upgrades

### Content pipeline
- `velite.config.ts` — rehype-pretty-code configuration with `createCssVariablesTheme` from shiki
- `src/app/globals.css` — `--shiki-*` CSS custom properties for syntax highlighting token colors

### Security
- `src/proxy.ts` — CSP header definitions (relevant for @vercel/analytics 2.x domain changes)

### Prior phase context
- `.planning/phases/20-dead-code-test-hygiene/20-CONTEXT.md` — D-02: lucide-react stays (6 consumers)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No new components needed — this phase only updates dependency versions

### Established Patterns
- Velite uses `createCssVariablesTheme()` from shiki with `keepBackground: false` — this is the primary integration point for the shiki 4 upgrade
- CSP in `src/proxy.ts` allows `va.vercel-scripts.com` for @vercel/analytics — may need updating if analytics 2.x changes domains
- lucide-react icons imported individually across 6 source files (header, footer, mobile-toc, project-card, blog/[slug]/page, projects/[slug]/page)

### Integration Points
- `velite.config.ts` — rehype-pretty-code plugin config references shiki APIs directly
- `src/app/globals.css` — 14 `--shiki-*` CSS variables must match shiki 4's CSS-variables theme token names
- `src/proxy.ts` — CSP `script-src` and `connect-src` directives for analytics
- `src/app/layout.tsx` — @vercel/analytics component import

</code_context>

<specifics>
## Specific Ideas

No specific requirements — upgrade targets and validation criteria are fully defined in REQUIREMENTS.md and ROADMAP.md success criteria.

</specifics>

<deferred>
## Deferred Ideas

- TypeScript 6 upgrade — Phase 22
- ESLint 10 upgrade — blocked by eslint-config-next peer deps (noted in STATE.md)

</deferred>

---

*Phase: 21-dependency-upgrades*
*Context gathered: 2026-04-05*
