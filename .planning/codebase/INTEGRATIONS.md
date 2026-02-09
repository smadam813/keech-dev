# External Integrations

**Analysis Date:** 2026-02-08

## APIs & External Services

**Third-Party Links (Display Only):**
- GitHub - Social profile link in footer (`https://github.com/smadam813`)
  - No API integration; static link only

- LinkedIn - Social profile link in footer (`https://linkedin.com/in/adam-keech`)
  - No API integration; static link only

**No Active API Integrations:**
- Application does not integrate with external APIs
- No backend services (no user data, no authentication, no payment processing)
- No webhooks or real-time data fetching

## Data Storage

**Databases:**
- Not used - No database integration

**File Storage:**
- Local filesystem only - No cloud storage integration
  - MDX content files in `content/posts/` and `content/projects/`
  - Compiled output in `.velite/` directory
  - Static assets in `public/` directory

**Caching:**
- Built-in Next.js caching
- No external caching service (Redis, Memcached, etc.)

## Authentication & Identity

**Auth Provider:**
- Not used - No authentication system
- No user accounts or sessions
- Public-facing content only

**Email:**
- Not used - No email service integration

## Monitoring & Observability

**Error Tracking:**
- Not configured - No error monitoring service (Sentry, DataDog, etc.)

**Analytics:**
- Not detected - No analytics tracking (Google Analytics, Mixpanel, etc.)

**Logs:**
- Console logging only
- No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- Vercel - Production deployment
  - Automatic git-push-to-deploy (no CI pipeline configuration)
  - Edge functions not used
  - Environment variables not configured

**CI Pipeline:**
- Not used - No GitHub Actions, GitLab CI, or other pipeline
- Deployment is direct git push to repository (Vercel hook)

**Build Process:**
```
Velite compiles MDX → Next.js builds static app → Vercel deploys
```

## Environment Configuration

**Required env vars:**
- None - Application requires no environment variables
- No secrets needed for local development or production

**Configuration:**
- `next.config.ts` - Image quality optimization only
- `velite.config.ts` - Content collection schemas and output paths
- Metadata configured directly in `src/app/layout.tsx`

**Secrets location:**
- Not applicable - No secrets in use

## Webhooks & Callbacks

**Incoming:**
- None - Application has no API routes or webhook receivers

**Outgoing:**
- None - Application does not send webhooks

## Content Sources

**MDX Content:**
- Static MDX files committed to git repository
- Two collections defined via Velite:
  1. **Posts** (`content/posts/**/*.mdx`)
     - Fields: title, slug, date, description, tags, draft status, body
     - Compiled to `.velite/posts.json` at build time

  2. **Projects** (`content/projects/**/*.mdx`)
     - Fields: title, slug, description, date, stack, category, GitHub URL, demo URL, body
     - Compiled to `.velite/projects.json` at build time

- **Syntax Highlighting:**
  - Theme: github-dark-dimmed (via Shiki)
  - Default language: TypeScript (block and inline code)
  - No runtime theme switching

## Social & External Links

**Hardcoded Links in Footer** (`src/components/layout/footer.tsx`):
- GitHub: `https://github.com/smadam813`
- LinkedIn: `https://linkedin.com/in/adam-keech`

**Canonical URLs:**
- Base URL: `https://keech.dev`
- Open Graph: keech.dev website metadata
- Twitter Card: Summary with large image

## Font Sources

**External Fonts:**
- Google Fonts API - Inter typeface (body text)
- Local hosting - Norse custom fonts (WOFF2 format in `public/fonts/`)

## Search & Indexing

**Sitemap Generation:**
- `src/app/sitemap.ts` - Generates sitemap.xml for SEO
- Base URL: `https://keech.dev`

**Robots:**
- `src/app/robots.ts` - Configures robot indexing
- Sitemap: `https://keech.dev/sitemap.xml`

---

*Integration audit: 2026-02-08*
