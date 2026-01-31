# Domain Pitfalls

**Domain:** Next.js + MDX Personal Blog/Portfolio Site
**Project:** keech.dev
**Researched:** 2026-01-31
**Confidence:** MEDIUM-HIGH (verified via official docs, Vercel blog, and multiple sources)

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Missing mdx-components.tsx File

**What goes wrong:** MDX pages fail with cryptic error: "Error: createContext only works in Client Components." The actual cause is completely obscured by the error message.

**Why it happens:** The App Router requires a `mdx-components.tsx` file at the project root (parent of `app/`). This is easy to miss because the error message gives no hint about the missing file.

**Consequences:** Complete MDX rendering failure. Hours of debugging the wrong thing.

**Prevention:**
- Create `mdx-components.tsx` immediately when setting up MDX
- Follow official Next.js MDX guide step-by-step
- Use `create-next-app` with MDX template if available

**Detection:**
- Any "createContext" error when rendering MDX
- MDX pages that work in dev but fail mysteriously

**Phase relevance:** Foundation phase - must be correct from day one

**Sources:** [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx), [Alex Chan's Blog](https://www.alexchantastic.com/building-a-blog-with-next-and-mdx)

---

### Pitfall 2: Blank Lines in JSX Within MDX

**What goes wrong:** MDX explodes with hard-to-decipher parsing errors when you leave blank lines inside React components within MDX content.

**Why it happens:** MDX parser interprets blank lines as paragraph breaks, which breaks JSX parsing. The error messages are notoriously unhelpful.

**Consequences:** Content that looks correct fails to render. Frustrating debugging cycle.

**Prevention:**
- Never leave blank lines inside JSX tags in MDX
- Use `{\n}` for explicit newlines if needed
- Escape linebreaks with `\n\` to avoid double blank lines
- Lint MDX files before committing

**Detection:**
- Parsing errors on MDX files that "look fine"
- Errors mentioning unexpected tokens in JSX

**Phase relevance:** Content authoring - establish patterns early

**Sources:** [Josh Comeau's Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog/)

---

### Pitfall 3: Route Handlers Inside Server Components

**What goes wrong:** Developers create unnecessary API routes and fetch from them within Server Components, adding network hops and complexity where none is needed.

**Why it happens:** Habit from Pages Router or other frameworks. Developers don't realize Server Components can call async functions directly.

**Consequences:** Slower pages, unnecessary code, localhost URL hardcoding problems.

**Prevention:**
- Call database/API logic directly in Server Components
- Reserve Route Handlers for external webhooks or third-party integrations
- Use Server Actions for mutations from Client Components

**Detection:**
- `fetch('/api/...')` inside Server Components
- Hardcoded `localhost:3000` URLs
- Extra network calls in dev tools

**Phase relevance:** Architecture phase - set patterns correctly from start

**Sources:** [Vercel Blog: Common Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

---

### Pitfall 4: Neobrutalist Design Without WCAG Contrast Testing

**What goes wrong:** Bold neobrutalist color schemes fail accessibility contrast requirements. Bright yellows on whites, vibrant colors paired together look striking but are unreadable.

**Why it happens:** Neobrutalism emphasizes visual impact. Designers focus on "bold" without checking contrast ratios. The aesthetic can actively fight accessibility.

**Consequences:**
- Failed accessibility audits
- Unreadable text for users with visual impairments
- User fatigue from high-contrast elements everywhere
- Potential legal compliance issues

**Prevention:**
- Test all color pairs with contrast checker (min 4.5:1 for body text)
- Limit palette to 2-3 bold colors, not a rainbow
- Use black/white for text, save bold colors for accents
- Test with Coolors contrast checker or Chrome DevTools
- Check in grayscale to verify hierarchy

**Detection:**
- Lighthouse accessibility warnings
- Text that's hard to read in bright light
- Users mentioning eye strain

**Phase relevance:** Design system phase - must validate colors before building components

**Sources:** [NN/g: Neobrutalism](https://www.nngroup.com/articles/neobrutalism/), [WebAIM Contrast](https://webaim.org/articles/contrast/)

---

### Pitfall 5: next-mdx-remote Import Limitations

**What goes wrong:** You cannot use `import` or `export` statements inside MDX files when using `next-mdx-remote`. Every custom component must be passed through the components prop.

**Why it happens:** `next-mdx-remote` serializes MDX content, which doesn't support ES module syntax within the content itself.

**Consequences:**
- Monolithic component bundle passed to every MDX file
- Heavy lazy-loading requirements
- Can't define per-file variables or helpers
- Architecture becomes unwieldy as component library grows

**Prevention:**
- Evaluate if `@next/mdx` (official package) fits your needs better
- If using `next-mdx-remote`, plan component architecture upfront
- Create a clear component registry pattern
- Consider Velite or other alternatives for complex needs

**Detection:**
- Growing component prop becoming unwieldy
- Wanting to import one-off components in specific posts
- Lots of lazy-loading code

**Phase relevance:** Stack selection phase - choose MDX approach carefully

**Sources:** [MDXBlog: next-mdx-remote Limitations](https://www.mdxblog.io/blog/next-mdx-remote-limitations), [Josh Comeau's Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog/)

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

### Pitfall 6: LCP Images Without Priority/Preload

**What goes wrong:** Hero images and above-the-fold content load slowly because they're lazy-loaded by default.

**Why it happens:** Next.js Image component defaults to lazy loading for performance. But LCP images need immediate loading.

**Prevention:**
- Add `priority` (or `preload` in Next.js 16+) to LCP images
- Identify which image is LCP for each page type
- Only mark 1-2 images as priority per page
- Never lazy-load hero images

**Detection:**
- Lighthouse LCP warnings
- Visible image pop-in on page load
- Core Web Vitals failures

**Phase relevance:** Performance optimization phase

**Sources:** [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image), [DebugBear Guide](https://www.debugbear.com/blog/nextjs-image-optimization)

---

### Pitfall 7: Missing metadataBase for OG Images

**What goes wrong:** Social preview images show broken or localhost URLs. Warning: "metadata.metadataBase is not set for resolving social open graph or twitter images."

**Why it happens:** Relative URLs in metadata need a base URL. Without it, Next.js falls back to localhost.

**Prevention:**
```typescript
// app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://keech.dev'),
  // ... other metadata
}
```
- Use environment variable: `new URL(process.env.NEXT_PUBLIC_SITE_URL)`
- Set in root layout, not per-page

**Detection:**
- Console warnings about metadataBase
- Broken social previews when sharing links
- OG images showing localhost URLs

**Phase relevance:** SEO/metadata phase

**Sources:** [Next.js Metadata Guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images), [GitHub Discussion #57251](https://github.com/vercel/next.js/discussions/57251)

---

### Pitfall 8: Frontmatter Not Working Out of the Box

**What goes wrong:** Frontmatter YAML appears as raw text at the top of rendered MDX pages, or isn't accessible for metadata.

**Why it happens:** `@next/mdx` doesn't support frontmatter by default. You need additional configuration or packages.

**Prevention:**
- Use `gray-matter` package to parse frontmatter
- Or use exported metadata objects instead:
  ```mdx
  export const metadata = {
    title: 'My Post',
    date: '2026-01-31'
  }
  ```
- Configure remark-frontmatter plugin if using traditional YAML

**Detection:**
- YAML showing as text in rendered pages
- `metadata` undefined when trying to access frontmatter

**Phase relevance:** Content system setup phase

**Sources:** [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx)

---

### Pitfall 9: Suspense Boundary Placement

**What goes wrong:** Adding `<Suspense>` inside async Server Components doesn't work. Loading states never appear.

**Why it happens:** Suspense must wrap the async component from above, not from within.

**Prevention:**
- Place Suspense boundaries in parent components
- Create dedicated loading.tsx files for route segments
- Think of Suspense as a parent wrapper, not a child helper

**Detection:**
- Loading states not appearing
- Entire page blocking on slowest data fetch

**Phase relevance:** Data fetching patterns phase

**Sources:** [Vercel Blog: Common Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

---

### Pitfall 10: Framer Motion Without "use client"

**What goes wrong:** Motion components fail with Server Component errors. Animations don't work.

**Why it happens:** Framer Motion (now "Motion") uses React hooks internally, which only work in Client Components.

**Prevention:**
- Add `"use client"` to files using motion components
- Create dedicated animation wrapper components
- Import as `import * as motion from "motion/react-client"` for RSC compatibility
- Keep animation boundaries small - don't make entire pages client components

**Detection:**
- Hydration errors mentioning hooks
- "useState is not defined" type errors
- Animations working in dev but failing in production

**Phase relevance:** Interactive components phase

**Sources:** [Motion Docs](https://motion.dev/docs/react-motion-component)

---

### Pitfall 11: Case Sensitivity on Vercel Deployment

**What goes wrong:** Local dev works fine, but Vercel deployment fails with import errors or 404s.

**Why it happens:** Local development on Windows/macOS is case-insensitive. Vercel (Linux) is case-sensitive. `import Button from './button'` works locally but fails if file is `Button.tsx`.

**Prevention:**
- Match file names exactly in imports
- Use consistent naming conventions (PascalCase for components)
- Test with `git config core.ignorecase false`
- Review imports in CI before deploy

**Detection:**
- "Module not found" errors only on Vercel
- Works locally, fails in production

**Phase relevance:** Any phase - establish conventions early

**Sources:** [Medium: Deployment Issues](https://javascript.plainenglish.io/how-i-deployed-next-js-app-on-vercel-959abd5996db)

---

### Pitfall 12: Static Route Handler Caching

**What goes wrong:** GET Route Handlers return stale data until next deployment. Dynamic data appears frozen.

**Why it happens:** Route Handlers with GET are statically rendered by default, like pages.

**Prevention:**
- Add `export const dynamic = 'force-dynamic'` for dynamic data
- Or use `revalidate` for ISR-style caching
- Understand which routes need dynamic behavior

**Detection:**
- API responses not reflecting database changes
- Data only updating after redeploy

**Phase relevance:** API/data layer phase

**Sources:** [Vercel Blog: Common Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 13: Stale "Last Updated" Dates

**What goes wrong:** New blog posts have old dates because developers copy/paste from previous posts and forget to update frontmatter.

**Prevention:**
- Use post templates with placeholder dates
- Add pre-commit hook to validate dates
- Consider auto-generating dates from git history

**Sources:** [Josh Comeau's Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog/)

---

### Pitfall 14: Overusing Tailwind Utility Classes

**What goes wrong:** JSX becomes unreadable walls of class names. Maintenance nightmare.

**Prevention:**
- Extract common patterns to components
- Use `@apply` sparingly for repeated patterns
- Consider CVA (class-variance-authority) for component variants
- Keep utility classes for one-offs, components for repeated patterns

**Sources:** [FreeCodeCamp: Design System Guide](https://www.freecodecamp.org/news/how-a-design-system-in-next-js-with-tailwind-css-and-class-variance-authority/)

---

### Pitfall 15: Dynamic Class Name Construction

**What goes wrong:** Tailwind's JIT compiler can't find dynamically constructed class names, so styles are missing.

**Prevention:**
- Never concatenate class names: `bg-${color}-500` won't work
- Use complete class names in conditionals
- Safelist dynamic classes in config if unavoidable
- Prefer mapping objects: `const colors = { primary: 'bg-blue-500', ... }`

**Sources:** [Tailwind Troubleshooting](https://www.mindfulchase.com/explore/troubleshooting-tips/front-end-frameworks/troubleshooting-tailwind-css-build-errors,-missing-styles,-and-configuration-pitfalls-in-front-end-projects.html)

---

### Pitfall 16: RSS Feed Browser Download

**What goes wrong:** Browser downloads XML file instead of displaying it. Hard to verify feed is correct.

**Prevention:**
- Use W3C Feed Validator to check syntax
- Set correct Content-Type headers
- Test in RSS reader, not browser
- Add link to RSS in site header with proper `type="application/rss+xml"`

**Sources:** [DiDoesDigital: RSS in Next.js](https://didoesdigital.com/blog/nextjs-blog-09-rss/)

---

### Pitfall 17: Slug Changes Breaking Links

**What goes wrong:** When blog post slugs change (typo fix, better URL), old links break with 404s.

**Prevention:**
- Keep redirect table for changed slugs
- Use `next.config.js` redirects for permanent changes
- Consider using post IDs in addition to slugs
- Plan URL structure before launching

**Sources:** [TheLinuxCode: Dynamic Routes 2026](https://thelinuxcode.com/nextjs-dynamic-route-segments-in-the-app-router-2026-guide/)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Stack Selection | next-mdx-remote import limitations | Evaluate @next/mdx vs next-mdx-remote based on component needs |
| Design System | Neobrutalist contrast failures | Test every color pair before building components |
| Foundation | Missing mdx-components.tsx | Follow official setup guide exactly |
| Content System | Frontmatter not parsing | Choose frontmatter strategy upfront (YAML vs exports) |
| SEO/Metadata | Missing metadataBase | Set in root layout immediately |
| Performance | LCP image priority | Audit and mark hero images on each page type |
| Deployment | Case sensitivity | Establish naming conventions, test on Linux |
| Interactions | Framer Motion RSC issues | Create client component boundaries for animations |
| Content Authoring | Blank lines in JSX | Document MDX authoring rules |

---

## keech.dev Specific Risks

Given the project context (neobrutalist design, Norse accents, playful hover interactions):

1. **Neobrutalist + Accessibility**: The bold borders and chunky shadows are fine, but validate color contrast for ALL text. Norse design accents with intricate patterns may reduce readability.

2. **Playful Hover Interactions + Performance**: Keep Motion animations targeted. Don't animate every element. Use `will-change` carefully.

3. **Mixed-Content Blog**: Hardware projects likely need image galleries and embedded media. Plan for heavy image optimization and lazy loading.

4. **Custom Color Palette**: Extract colors from reference images early, then test contrast ratios before building ANY components.

---

## Sources

### Official Documentation (HIGH confidence)
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js Metadata Guide](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Motion Documentation](https://motion.dev/docs/react-motion-component)

### Vercel Blog (HIGH confidence)
- [Common Mistakes with Next.js App Router](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

### Community Sources (MEDIUM confidence)
- [Josh Comeau: How I Built My Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog/)
- [Alex Chan: Building a Blog with Next.js and MDX](https://www.alexchantastic.com/building-a-blog-with-next-and-mdx)
- [NN/g: Neobrutalism Definition and Best Practices](https://www.nngroup.com/articles/neobrutalism/)
- [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/)
- [MDXBlog: next-mdx-remote Limitations](https://www.mdxblog.io/blog/next-mdx-remote-limitations)
- [TheLinuxCode: Dynamic Routes 2026 Guide](https://thelinuxcode.com/nextjs-dynamic-route-segments-in-the-app-router-2026-guide/)
