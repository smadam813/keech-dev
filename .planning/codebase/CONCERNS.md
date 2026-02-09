# Codebase Concerns

**Analysis Date:** 2026-02-08

## Fragile Areas

**MDX Runtime Compilation:**
- Files: `src/components/blog/mdx-content.tsx`
- Why fragile: The component uses `new Function(code)` to execute compiled MDX code at runtime. This executes arbitrary JavaScript without a sandbox and bypasses Next.js build-time safety checks. If MDX content sources become untrusted or a build step is compromised, this becomes an XSS vulnerability.
- Safe modification: Avoid user-generated MDX content. Keep Velite-compiled content as the sole source. If MDX code handling changes, validate that content always originates from controlled `content/` directory.
- Test coverage: No test coverage for MDX execution. No validation of code parameter origin.

**Copy Button Error Handling:**
- Files: `src/components/blog/copy-button.tsx`
- Why fragile: The `handleCopy` function calls `navigator.clipboard.writeText()` without error handling. In older browsers, private browsing modes, or security-restricted contexts, this API may fail silently with a rejected promise. Users see no feedback when copy fails.
- Safe modification: Wrap clipboard operation in try-catch. Provide fallback (e.g., select-and-copy or explicit error message).
- Test coverage: No error cases tested. No fallback mechanism.

**Header Mobile Menu Accessibility:**
- Files: `src/components/layout/header.tsx`
- Why fragile: Focus management uses direct DOM manipulation with `.setAttribute('inert', '')`. The `inert` attribute support varies across browsers. On older browsers or when JS fails, users can still interact with main content while menu is open.
- Safe modification: Test `inert` attribute browser support. Consider additional ARIA attributes as fallback (e.g., `aria-hidden` with tabindex management).
- Test coverage: No accessibility testing. No graceful degradation tested.

**Scroll Lock Implementation:**
- Files: `src/components/layout/header.tsx` (lines 34-53)
- Why fragile: Scroll lock uses `document.body.style.position = 'fixed'` with manual scroll restoration. This approach can conflict with other scroll libraries, doesn't account for viewport-relative positioning of fixed elements, and may cause layout shift on platforms with scrollbars.
- Safe modification: Consider using overflow-hidden on body with margin-right adjustment for scrollbar width, or use a dedicated scroll-lock library.
- Test coverage: No tests for scroll lock behavior on different devices/viewport sizes.

## Error Handling

**Unhandled Promise Rejection:**
- Problem: Copy button promise is not caught, only awaited
- Files: `src/components/blog/copy-button.tsx` (line 18)
- Risk: Clipboard API rejection (permission denied, unsupported) silently fails with no user feedback
- Improvement path: Add try-catch block with user-facing error notification

**Missing Error Boundaries:**
- Problem: No React error boundaries in layout or page components
- Files: `src/app/layout.tsx`, all page components under `src/app/`
- Risk: Client-side errors in children crash entire page instead of graceful degradation
- Improvement path: Add error.tsx files per Next.js error boundary pattern, or wrap dynamic components with error boundary

**MDX Execution Errors:**
- Problem: `new Function(code)` execution in `MDXContent` has no try-catch
- Files: `src/components/blog/mdx-content.tsx` (lines 12-14)
- Risk: Malformed MDX code or rehype plugin failures crash the page
- Improvement path: Wrap function execution in try-catch with fallback UI

## Security Considerations

**Client-Side MDX Execution (XSS Risk):**
- Risk: `new Function(code)` executes arbitrary JavaScript. While current content is trusted (committed to repo), the pattern is inherently risky.
- Files: `src/components/blog/mdx-content.tsx`
- Current mitigation: Velite pre-compiles MDX, content is version-controlled
- Recommendations:
  - Document this risk in codebase comments
  - Add CSP headers if deployed (restrict eval via policy)
  - Consider moving to `next-mdx-remote` or similar with built-in sandboxing for future flexibility
  - If content ever becomes user-generated, this pattern is unsafe

**Clipboard API Permission Handling:**
- Risk: `navigator.clipboard.writeText()` may fail due to permissions or browser restrictions
- Files: `src/components/blog/copy-button.tsx`
- Current mitigation: None
- Recommendations: Add error handling and user feedback for denied/unavailable clipboard access

## Performance Bottlenecks

**Header Re-renders:**
- Problem: Multiple useEffect hooks on header (5 separate effects) monitoring `isOpen` state
- Files: `src/components/layout/header.tsx` (lines 30-90)
- Cause: Each dependency triggers its own effect. Scroll lock, focus management, event listeners, and cleanup all separate.
- Improvement path: Consider combining related effects or using custom hook to reduce re-render noise. Profile to confirm impact.

**ProjectCard Image Loading:**
- Problem: Images use `fill` layout with `object-cover`, but no explicit `sizes` prop on Image component
- Files: `src/components/projects/project-card.tsx` (lines 32-37)
- Cause: Without `sizes`, Next.js Image may serve suboptimal image widths, or generate excessive variants
- Improvement path: Add `sizes` prop matching responsive breakpoints (e.g., `sizes="(max-width: 768px) 100vw, 50vw"`)

**Velite Build Step Dependency:**
- Problem: Build process requires sequential execution: `velite && next build`
- Files: `package.json` (line 8), `velite.config.ts`
- Cause: Velite is a separate prebuild step (not webpack plugin due to Turbopack limitation)
- Scaling limitation: As content grows, Velite rebuild time may become noticeable. No incremental builds observed.
- Improvement path: Monitor build times. Investigate Velite's watch mode cache behavior. Consider content pagination if 100+ posts added.

## Missing Critical Features

**No Offline Support:**
- Problem: No service worker or offline fallback
- Blocks: App becomes non-functional without network (progressive enhancement not implemented)
- Impact: Blog content is static, could benefit from offline caching

**No Sitemap Auto-Update:**
- Problem: `src/app/sitemap.ts` is hardcoded, doesn't reference Velite collections
- Files: `src/app/sitemap.ts`
- Impact: Adding new blog posts or projects requires manual sitemap update; easy to forget

**No RSS Feed:**
- Problem: Blog posts have no RSS feed endpoint
- Impact: Subscribers can't follow content updates via standard mechanisms

**No Search:**
- Problem: Blog and projects pages have no search/filter capability
- Impact: Users must scroll through all content to find specific posts or projects

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Any component behavior, utility functions, formatting functions
- Files: All files under `src/`
- Risk: Refactoring is risky without tests. Bug fixes may introduce regressions.
- Priority: High (even 20% coverage of critical paths would help)

**No Integration Tests:**
- What's not tested: Blog post rendering with actual MDX, static generation, dynamic routes
- Files: `src/app/blog/[slug]/page.tsx`, `src/app/projects/[slug]/page.tsx`
- Risk: Broken links, missing metadata, or malformed content only caught at runtime or manual testing
- Priority: High

**No E2E Tests:**
- What's not tested: Page navigation, mobile menu interactions, copy button, scroll reveal animations
- Risk: UI regressions, accessibility issues, or mobile-specific bugs reach production
- Priority: Medium (static content reduces risk, but mobile menu behavior should be tested)

**No Accessibility Audit:**
- What's not tested: Screen reader compatibility, keyboard navigation, color contrast, focus management
- Files: `src/components/layout/header.tsx` (mobile menu), `src/components/blog/mdx-content.tsx` (code blocks)
- Risk: Users with disabilities may encounter barriers. Rune decorations (esp. custom fonts) may not be properly labeled.
- Priority: High (accessibility is correctness, not optional)

## Dependencies at Risk

**Velite Pre-Release:**
- Risk: `velite@0.3.1` is still pre-release (0.x.x), API may be unstable
- Impact: Major version bump could require config rewrites
- Migration plan: Lock version in package.json; monitor GitHub for stability updates before upgrading

**Shiki Code Highlighting:**
- Risk: `shiki@3.22.0` is heavy (large bundle), used only for build-time code highlighting
- Impact: No runtime code highlighting, but Shiki bundles languages and themes
- Mitigation: Already handled at build time, not shipped to client. OK.

**Lucide React Icons:**
- Risk: `lucide-react@0.563.0` is solid but each icon is imported as separate component
- Impact: Tree-shaking works, but if many icons added, consider impact
- Current state: Only 4 icons used (Menu, X, Copy, Check, Github, ExternalLink). Low concern.

## Technical Debt

**No API Routes or Backend:**
- Debt: Fully static site with no dynamic functionality
- Impact: All interactivity is client-side (copy button, menu toggle, scroll animations). Content is immutable at runtime.
- Payoff if addressed: Could enable comments, forms, analytics beyond Vercel analytics
- Recommendation: Acceptable for a portfolio site. Only address if new features require it.

**CSS-First Tailwind Config:**
- Debt: All design tokens in `globals.css` via `@theme` directive instead of traditional `tailwind.config.js`
- Impact: Non-standard setup. May confuse team members familiar with classic Tailwind. IDE autocomplete may not work.
- Payoff if addressed: Simpler config, but trades familiarity for brevity
- Recommendation: Document well. OK for solo developer, consider reverting if team grows.

**Rune Config as Hard-Coded Values:**
- Debt: `src/components/runes/rune-config.ts` is 251 lines of static data
- Impact: No database, hard to add new pages without modifying config
- Payoff if addressed: Extract to JSON file or data layer for easier maintenance
- Recommendation: OK for current scale. Only refactor if patterns change frequently.

**Manual Date Formatting:**
- Debt: `src/app/blog/[slug]/page.tsx` and `src/app/projects/[slug]/page.tsx` duplicate Intl.DateTimeFormat logic
- Impact: Inconsistent formatting if one file is updated and the other isn't
- Payoff if addressed: Create shared utility function
- Recommendation: Extract to `src/lib/format-date.ts` for DRY principle

## Scaling Limits

**Content Build Time:**
- Current capacity: 2 MDX files (minimal test case)
- Limit: Velite build time likely remains <100ms for 50-100 posts. Unknown beyond that.
- Scaling path: Monitor build time as content grows. Profile Velite config if slowdown occurs. Consider splitting collections.

**Memory Usage:**
- Current capacity: All collections loaded into memory at build time
- Limit: With 1000+ posts, Velite memory usage may spike
- Scaling path: Implement pagination or lazy-load collections. Use Velite's filtering early in transform pipeline.

**Client Bundle Size:**
- Current capacity: Small (static site, minimal JS)
- Limit: Adding many interactive features or large dependencies could impact perceived performance
- Scaling path: Use next/dynamic for route-based code splitting. Audit bundle size regularly.

---

*Concerns audit: 2026-02-08*
