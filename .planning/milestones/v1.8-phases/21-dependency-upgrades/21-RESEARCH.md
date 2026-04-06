# Phase 21: Dependency Upgrades - Research

**Researched:** 2026-04-05
**Domain:** npm dependency management, shiki syntax highlighting, Vercel analytics, lucide icon library
**Confidence:** HIGH

## Summary

Phase 21 upgrades all non-blocked dependencies to current stable versions in risk-tiered batches. The minor/patch batch (DEPS-01) is low-risk and straightforward. The shiki 3-to-4 upgrade (DEPS-02) is minimal -- v4 only drops Node 18 support and removes four deprecated APIs, none of which this project uses; the `createCssVariablesTheme` API is unchanged. The @vercel/analytics 1-to-2 upgrade (DEPS-04) is also low-risk -- the `@vercel/analytics/next` import path is preserved and the script domain (`va.vercel-scripts.com`) appears unchanged.

The **highest-risk item is DEPS-03 (lucide-react 0.x to 1.x)**. Lucide v1 removed all brand icons, and this project imports `Github` (3 files) and `Linkedin` (1 file). These icons no longer exist in lucide-react 1.x. The upgrade requires replacing these two brand icon imports with inline SVG components or a separate icon source like `simple-icons`.

**Primary recommendation:** Execute DEPS-01 (minor/patch) first, then DEPS-02 (shiki 4 + rehype-pretty-code), then DEPS-04 (@vercel/analytics 2.x), and finally DEPS-03 (lucide-react 1.x) last since it requires code changes beyond a version bump.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Risk-tiered batches: minor/patch updates first (DEPS-01), then major versions one-at-a-time (DEPS-02 shiki/rehype-pretty-code, DEPS-03 lucide-react, DEPS-04 @vercel/analytics)
- **D-02:** Each batch is validated before proceeding to the next -- a failure in batch N blocks batch N+1
- **D-03:** Upgrade shiki 3->4 and rehype-pretty-code to 0.14.3 as a coupled pair in a single commit
- **D-04:** Validate CSS-variables theme works after upgrade -- the `createCssVariablesTheme()` API and `--shiki-*` token variables in `globals.css` must produce identical syntax highlighting output
- **D-05:** If shiki 4 changes the `createCssVariablesTheme` API, adapt `velite.config.ts` rehype-pretty-code options accordingly
- **D-06:** Full pipeline validation after each batch: `npm run build && npm run test && npm run lint && npm audit`
- **D-07:** Visual spot-check of code blocks after shiki 4 upgrade (CSS-variables theme is the highest-risk change)
- **D-08:** DEPS-03 is active -- Phase 20 confirmed lucide-react has 6 consumers and stays in the project. Upgrade to 1.x.
- **D-09:** DEPS-05 (TypeScript 6) is explicitly out of scope -- handled in Phase 22

### Claude's Discretion
- Exact npm commands and flags for each upgrade batch
- Whether to use `npm update` vs manual `npm install package@version`
- Order of major upgrades within the major-version batch (DEPS-02/03/04)

### Deferred Ideas (OUT OF SCOPE)
- TypeScript 6 upgrade -- Phase 22
- ESLint 10 upgrade -- blocked by eslint-config-next peer deps (noted in STATE.md)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPS-01 | Apply minor/patch updates (tailwindcss, rehype-pretty-code, tailwind-merge, @upstash/redis, @types/node, @types/react) | Version delta table below; all are safe semver-range bumps |
| DEPS-02 | Upgrade shiki 3->4 together with rehype-pretty-code, validate CSS-variables theme | shiki 4 breaking changes verified minimal; createCssVariablesTheme unchanged; rehype-pretty-code 0.14.3 peers with shiki 4 |
| DEPS-03 | Upgrade lucide-react to 1.x (if not removed by HYGN-02) | CRITICAL: brand icons (Github, Linkedin) removed in v1; requires SVG replacements in 4 files |
| DEPS-04 | Upgrade @vercel/analytics to 2.x, verify no CSP domain changes needed | Import path `@vercel/analytics/next` preserved; license change only significant breaking change; CSP domain likely unchanged |
</phase_requirements>

## Standard Stack

No new libraries are introduced. This phase upgrades existing dependencies.

### Upgrade Targets

| Package | Current | Target | Type | Risk |
|---------|---------|--------|------|------|
| tailwindcss | 4.1.18 | 4.2.2 | minor | LOW |
| @tailwindcss/postcss | 4.1.18 | (matches tailwindcss) | minor | LOW |
| tailwind-merge | 3.4.0 | 3.5.0 | minor | LOW |
| @upstash/redis | 1.36.2 | 1.37.0 | minor | LOW |
| @types/node | 25.1.0 | 25.5.2 | minor | LOW |
| @types/react | 19.2.10 | 19.2.14 | patch | LOW |
| rehype-pretty-code | 0.14.1 | 0.14.3 | patch | LOW |
| shiki | 3.22.0 | 4.0.2 | **MAJOR** | LOW-MEDIUM |
| lucide-react | 0.563.0 | 1.7.0 | **MAJOR** | **HIGH** |
| @vercel/analytics | 1.6.1 | 2.0.1 | **MAJOR** | LOW |

[VERIFIED: npm registry -- all target versions confirmed 2026-04-05]

**Installation commands by batch:**

Batch 1 (minor/patch -- DEPS-01):
```bash
npm install tailwindcss@^4.2.2 @tailwindcss/postcss@^4.2.2 tailwind-merge@^3.5.0 @upstash/redis@^1.37.0 rehype-pretty-code@^0.14.3
npm install -D @types/node@^25.5.2 @types/react@^19.2.14
```

Batch 2 (shiki 4 -- DEPS-02):
```bash
npm install shiki@^4.0.2
```
Note: rehype-pretty-code 0.14.3 (installed in Batch 1) already has `"shiki": "^1.0.0 || ^2.0.0 || ^3.0.0 || ^4.0.0"` as a peer dep. [VERIFIED: npm registry]

Batch 3 (@vercel/analytics -- DEPS-04):
```bash
npm install @vercel/analytics@^2.0.1
```

Batch 4 (lucide-react -- DEPS-03):
```bash
npm install lucide-react@^1.7.0
```
This batch requires code changes -- see Architecture Patterns below.

## Architecture Patterns

### Pattern 1: Brand Icon Replacement for lucide-react 1.x

**What:** Lucide v1 removed all brand icons (Github, Linkedin, etc.) [VERIFIED: lucide.dev/icons/github returns 404, lucide.dev/icons/linkedin returns 404]

**Impact on this project -- 4 files, 2 icons:**

| Icon | Files | Import |
|------|-------|--------|
| `Github` | `src/components/layout/footer.tsx`, `src/components/projects/project-card.tsx`, `src/app/projects/[slug]/page.tsx` | `import { Github } from 'lucide-react'` |
| `Linkedin` | `src/components/layout/footer.tsx` | `import { Linkedin } from 'lucide-react'` |

**Non-brand icons (safe, no changes needed):** `Menu`, `X`, `ChevronDown`, `ArrowLeft`, `ExternalLink` [VERIFIED: lucide.dev/icons/x, menu, chevron-down, arrow-left, external-link all exist]

**Recommended approach:** Create inline SVG icon components for Github and Linkedin in a shared file (e.g., `src/components/icons/brand-icons.tsx`). These are simple, well-known SVG paths. This avoids adding a new dependency (simple-icons) for just 2 icons.

```typescript
// src/components/icons/brand-icons.tsx
import type { SVGProps } from 'react'

export function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={24}
      height={24}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width={24}
      height={24}
      aria-hidden="true"
      {...props}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
```

**Then update imports in 4 files:**
- `src/components/layout/footer.tsx`: Replace `import { Github, Linkedin } from 'lucide-react'` with `import { GithubIcon, LinkedinIcon } from '@/components/icons/brand-icons'`
- `src/components/projects/project-card.tsx`: Replace `Github` with `GithubIcon`
- `src/app/projects/[slug]/page.tsx`: Replace `Github` with `GithubIcon`
- Adjust JSX usage: `<Github />` becomes `<GithubIcon />` etc.

Note: lucide-react icons accept `className` and `size` props. The SVG replacements should accept standard SVG props and use `width`/`height` for sizing, or accept a `size` prop for compatibility. Check exact usage in each file.

### Pattern 2: Shiki 4 Upgrade (Minimal Changes)

**What:** shiki 4.0 breaking changes are minimal for this project. [VERIFIED: shiki.style/blog/v4]

**Removed deprecated APIs (none used by this project):**
1. `CreatedBundledHighlighterOptions` -> `CreateBundledHighlighterOptions` (type name typo fix)
2. `createdBundledHighlighter` -> `createBundledHighlighter` (function name typo fix)
3. TwoslashFloatingVue `theme` -> `themes` option
4. CSS class `twoslash-query-presisted` -> `twoslash-query-persisted` (typo fix)

**This project uses:** `createCssVariablesTheme` from shiki -- NOT deprecated, NOT changed. [CITED: shiki.style/blog/v4 -- not mentioned in removed APIs list]

**Node.js requirement:** shiki 4 requires Node >= 20. Project runs Node 22.21.0. [VERIFIED: `node --version`]

**Expected outcome:** Version bump only, zero code changes in `velite.config.ts`.

### Pattern 3: @vercel/analytics 2.x Upgrade

**What:** Minimal breaking changes. [CITED: github.com/vercel/analytics/releases]

**Changes:**
- License: MPL-2.0 -> MIT (no code impact)
- `endpoint` option renamed to `eventEndpoint`/`viewEndpoint` (project doesn't use custom endpoints)
- Import path `@vercel/analytics/next` still exists in 2.x exports [VERIFIED: `npm view @vercel/analytics@2.0.1 exports`]

**CSP consideration:** The project CSP allows `va.vercel-scripts.com` in both `script-src` and `connect-src` (in `src/proxy.ts`). The @vercel/analytics 2.x release notes do not mention domain changes. After upgrade, verify no new CSP violations in browser console. [ASSUMED -- domain unchanged based on absence of mention in release notes]

**Expected outcome:** Version bump only, zero code changes. Verify CSP in browser.

### Anti-Patterns to Avoid

- **Upgrading all majors at once:** If something breaks, you cannot isolate the cause. One major upgrade per commit.
- **Using `npm update` for major versions:** `npm update` respects semver ranges in package.json and will NOT cross major boundaries. Use explicit `npm install package@version` for major upgrades.
- **Forgetting to update package.json ranges:** After major upgrades, ensure the `^` range in package.json reflects the new major (e.g., `"shiki": "^4.0.2"` not `"shiki": "^3.22.0"`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Brand icon SVGs | Complex icon component system | Simple inline SVG components | Only 2 icons needed; adding simple-icons for 2 SVGs is overkill |
| Syntax highlighting theme | Custom shiki transformer | `createCssVariablesTheme` (unchanged in v4) | Already works, no migration needed |

## Common Pitfalls

### Pitfall 1: lucide-react Brand Icon Removal
**What goes wrong:** `npm install lucide-react@^1.7.0` succeeds, but the build immediately fails with "Module not found" errors for `Github` and `Linkedin` imports.
**Why it happens:** Lucide v1 removed all brand icons (Github, Linkedin, Twitter, Facebook, Instagram, etc.) due to trademark concerns. [VERIFIED: lucide.dev/icons/github returns 404]
**How to avoid:** Create SVG replacement components BEFORE or AT THE SAME TIME as the version bump. Never bump the version alone.
**Warning signs:** Any import of brand-related icon names from lucide-react.

### Pitfall 2: tailwindcss and @tailwindcss/postcss Version Mismatch
**What goes wrong:** Tailwind CSS v4 requires `@tailwindcss/postcss` at the matching version. Upgrading one without the other causes build failures.
**Why it happens:** These packages are tightly coupled in v4's architecture.
**How to avoid:** Always upgrade both in the same command: `npm install tailwindcss@^4.2.2 @tailwindcss/postcss@^4.2.2`
**Warning signs:** PostCSS build errors after a partial Tailwind upgrade.

### Pitfall 3: Shiki CSS Variable Token Names
**What goes wrong:** After upgrading shiki, syntax highlighting loses colors or uses wrong colors.
**Why it happens:** If shiki changes its CSS variable token names between versions, the `--shiki-*` variables in `globals.css` would stop matching.
**How to avoid:** After the shiki 4 upgrade, run `npm run velite` and inspect generated HTML for `--shiki-*` variable references. Compare with the 14 variables defined in `globals.css` (lines 235-248). [VERIFIED: shiki 4 does NOT change CSS variable names for the css-variables theme]
**Warning signs:** Code blocks rendering with no syntax colors (all one color).

### Pitfall 4: @vercel/analytics CSP Violation
**What goes wrong:** After upgrading analytics, the browser console shows CSP violations and analytics stop reporting.
**Why it happens:** If the new version loads scripts from a different domain not in the CSP allowlist.
**How to avoid:** After upgrade, open the site in a browser and check the console for CSP `script-src` or `connect-src` violations. If a new domain appears, update `src/proxy.ts`.
**Warning signs:** Analytics data stops appearing in Vercel dashboard.

### Pitfall 5: lucide-react aria-hidden Default Change
**What goes wrong:** After upgrading lucide-react, icons that were previously announced by screen readers become silent.
**Why it happens:** Lucide v1 sets `aria-hidden="true"` by default on all icons. [VERIFIED: lucide.dev/guide/version-1]
**How to avoid:** Review icon usage. If any icons are used as the sole content of interactive elements (links, buttons), ensure the parent element has an `aria-label`. In this project, icons in the footer links and project cards are alongside text, so this is likely fine. The mobile menu button uses `Menu`/`X` icons -- check if the button has an `aria-label`.
**Warning signs:** Accessibility audit failures for interactive elements with no accessible name.

## Code Examples

### Current shiki Configuration (velite.config.ts) -- No Changes Needed
```typescript
// Source: velite.config.ts lines 1-17
import { createCssVariablesTheme } from 'shiki'

const codeTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {}
})
```
This API is unchanged in shiki 4. [CITED: shiki.style/blog/v4]

### Current Analytics Import (layout.tsx) -- No Changes Needed
```typescript
// Source: src/app/layout.tsx lines 2, 59
import { Analytics } from '@vercel/analytics/next';
// ...
<Analytics />
```
The `@vercel/analytics/next` export path exists in 2.x. [VERIFIED: npm view exports]

### Current CSP (proxy.ts) -- Verify After DEPS-04
```typescript
// Source: src/proxy.ts lines 5-6, 9
"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
"connect-src 'self' https://va.vercel-scripts.com",
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run build && npm run test && npm run lint && npm audit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPS-01 | Minor/patch deps updated, build passes | smoke | `npm run build && npm run test` | N/A (build validation) |
| DEPS-02 | shiki 4 + rehype-pretty-code, velite succeeds, code blocks render | smoke + manual | `npm run velite && npm run build && npm run test` | N/A (build + visual) |
| DEPS-03 | lucide-react 1.x, build passes, icons render | smoke + manual | `npm run build && npm run test` | N/A (build + visual) |
| DEPS-04 | @vercel/analytics 2.x, no CSP violations | smoke + manual | `npm run build && npm run test` | N/A (build + browser check) |

### Sampling Rate
- **Per task commit:** `npm run build && npm run test && npm run lint`
- **Per wave merge:** Full suite + `npm audit`
- **Phase gate:** `npm run build && npm run test && npm run lint && npm audit` all pass with zero errors

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. This phase validates via build success and manual spot-checks, not new test files.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | no | -- |
| V5 Input Validation | no | -- (no new inputs) |
| V6 Cryptography | no | -- |

### Known Threat Patterns for Dependency Upgrades

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply chain compromise in new package version | Tampering | `npm audit` after each batch; verify package integrity via lock file |
| CSP bypass from analytics domain change | Information Disclosure | Browser console check for CSP violations after DEPS-04 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | @vercel/analytics 2.x does not change the script domain from `va.vercel-scripts.com` | Architecture Patterns / Pattern 3 | CSP would block analytics; fix is adding the new domain to proxy.ts |
| A2 | Github/Linkedin SVG paths used in brand-icons.tsx are correct | Architecture Patterns / Pattern 1 | Icons render incorrectly; fix is updating the SVG path data |

## Open Questions

1. **lucide-react icon sizing compatibility**
   - What we know: lucide-react icons accept `size` prop and `className`. Our SVG replacements accept standard SVG props.
   - What's unclear: Whether the existing icon usages pass `size`, `className`, `strokeWidth`, or other lucide-specific props that need matching.
   - Recommendation: Inspect all 6 icon usage sites before writing the replacement components to match the prop interface.

2. **@vercel/analytics 2.x CSP domains**
   - What we know: Release notes don't mention domain changes. Current CSP allows `va.vercel-scripts.com`.
   - What's unclear: Whether 2.x uses additional or different domains.
   - Recommendation: After upgrade, test in browser and check network tab + console for CSP violations.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js >= 20 | shiki 4 | Yes | 22.21.0 | -- |
| npm | all upgrades | Yes | (bundled with Node) | -- |

No missing dependencies.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| shiki 3.x | shiki 4.x (Node 20+, typo fixes) | 2026 | Minimal -- drop-in for this project |
| lucide-react 0.x (with brand icons) | lucide-react 1.x (brand icons removed) | 2025 | Must replace Github/Linkedin with inline SVGs |
| @vercel/analytics 1.x (MPL-2.0) | @vercel/analytics 2.x (MIT, split endpoints) | 2026 | No code changes needed |

## Sources

### Primary (HIGH confidence)
- npm registry -- all package versions, peer dependencies, and exports verified via `npm view`
- shiki.style/blog/v4 -- shiki 4 breaking changes (Node 20 req, 4 deprecated API removals)
- shiki.style/guide/migrate -- migration guide confirming minimal v3->v4 changes
- lucide.dev/icons/github (404), lucide.dev/icons/linkedin (404) -- brand icon removal confirmed
- lucide.dev/guide/version-1 -- brand icons removed, aria-hidden default

### Secondary (MEDIUM confidence)
- github.com/vercel/analytics/releases -- @vercel/analytics 2.0 changelog (license change, endpoint rename)

### Tertiary (LOW confidence)
- @vercel/analytics CSP domain unchanged -- inferred from absence of mention in release notes (A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry
- Architecture: HIGH for DEPS-01/02/04, MEDIUM for DEPS-03 (brand icon SVG paths are assumed)
- Pitfalls: HIGH -- brand icon removal confirmed via 404 on lucide.dev

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days -- stable ecosystem)
