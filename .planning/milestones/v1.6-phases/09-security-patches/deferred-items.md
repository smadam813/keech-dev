# Deferred Items - Phase 09 Security Patches

## From Plan 01

1. **ESLint/next lint broken after Next.js 16.2 upgrade**
   - `next lint` CLI command removed in Next.js 16.2
   - `npx eslint` fails due to eslintrc compatibility with new Next.js version
   - Requires: ESLint config migration and updating `npm run lint` script in package.json
   - Severity: Low (build passes, lint is supplementary)
   - Discovered during: Task 1 verification
