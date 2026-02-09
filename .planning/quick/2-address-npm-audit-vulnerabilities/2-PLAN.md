---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/validate-colors.mjs
  - package.json
  - package-lock.json
autonomous: true
must_haves:
  truths:
    - "npm audit reports 0 vulnerabilities"
    - "npm run build completes successfully"
    - "node scripts/validate-colors.mjs produces correct WCAG contrast report with no external deps"
  artifacts:
    - path: "scripts/validate-colors.mjs"
      provides: "Standalone WCAG AA contrast validation using inline math"
      contains: "relativeLuminance"
    - path: "package.json"
      provides: "Clean devDependencies without colorable"
  key_links: []
---

<objective>
Eliminate all 12 npm audit vulnerabilities by removing `colorable` (source of 11 vulns via transitive deps: lodash, cheerio, get-css, request, form-data, qs, tough-cookie, postcss, cssstats, color-string, color) and running `npm audit fix` for the remaining fixable issue.

Purpose: Ship a clean dependency tree with zero known vulnerabilities.
Output: Updated package.json, package-lock.json, and a rewritten validate-colors.mjs script.
</objective>

<execution_context>
@/home/smada/.claude/get-shit-done/workflows/execute-plan.md
@/home/smada/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/validate-colors.mjs
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove colorable and rewrite validate-colors.mjs with inline WCAG contrast calculation</name>
  <files>scripts/validate-colors.mjs, package.json, package-lock.json</files>
  <action>
1. Run `npm uninstall colorable` to remove the devDependency and update package-lock.json.

2. Rewrite `scripts/validate-colors.mjs` to calculate WCAG contrast ratios using inline math (no external dependencies). The script must:

   - Define the same palette object currently in the script:
     ```
     background: '#E8B4B8', foreground: '#000000', accent: '#2D8B8B',
     surface: '#F5E6E8', muted: '#666666'
     ```
   - Implement `hexToRgb(hex)` — parse a 6-digit hex string to {r, g, b} (0-255).
   - Implement `relativeLuminance(r, g, b)` — per WCAG 2.1 spec:
     Convert each channel: `c = val / 255; sRGB = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4`
     Return `0.2126 * R + 0.7152 * G + 0.0722 * B`
   - Implement `contrastRatio(hex1, hex2)` — `(L1 + 0.05) / (L2 + 0.05)` where L1 >= L2.
   - Iterate all unique pairs from the palette, compute contrast, print the same style report:
     ```
     Color Contrast Report (WCAG AA = 4.5:1 minimum)

     background vs foreground: 14.72 [PASS]
     background vs accent: 3.21 [FAIL]
     ...
     ```
   - Exit with same behavior: print warning if any pair fails, success message if all pass.

3. Run `node scripts/validate-colors.mjs` to verify the rewritten script works and produces output.

4. Run `npm audit fix` to address remaining fixable vulnerabilities (color-string, form-data, qs, tough-cookie — all become moot once colorable is removed, but run it to catch anything else).

5. Run `npm audit` to confirm 0 vulnerabilities.
  </action>
  <verify>
- `npm audit` reports "found 0 vulnerabilities"
- `node scripts/validate-colors.mjs` runs without errors and prints a contrast report
- `grep -c colorable package.json` returns 0
  </verify>
  <done>colorable removed from devDependencies, validate-colors.mjs works with zero external deps, npm audit clean.</done>
</task>

<task type="auto">
  <name>Task 2: Verify build integrity</name>
  <files></files>
  <action>
Run `npm run build` to confirm the dependency changes have not broken the build pipeline. Velite content compilation and Next.js static generation must both succeed. No files are modified in this task — it is a verification step.

If build fails, diagnose and fix (most likely cause would be an accidental removal of a needed dependency, which should not happen since colorable is only used in the standalone script).
  </action>
  <verify>
- `npm run build` exits with code 0
- Build output shows successful static page generation
  </verify>
  <done>Full build passes, confirming no regressions from dependency cleanup.</done>
</task>

</tasks>

<verification>
- `npm audit` shows 0 vulnerabilities
- `node scripts/validate-colors.mjs` produces correct contrast report
- `npm run build` succeeds
- `colorable` does not appear in package.json
</verification>

<success_criteria>
All 12 npm audit vulnerabilities eliminated. Build passes. Color validation script works standalone with no external dependencies.
</success_criteria>

<output>
After completion, create `.planning/quick/2-address-npm-audit-vulnerabilities/2-SUMMARY.md`
</output>
