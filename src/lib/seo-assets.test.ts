/**
 * Phase 11 SEO/Branding gap coverage.
 *
 * All tests use fs.readFileSync / fs.statSync to inspect source files and binary
 * assets directly — no Next.js runtime is needed. This avoids the jsdom
 * incompatibility with ImageResponse, @/.velite dynamic imports, etc.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd())

// ---------------------------------------------------------------------------
// Gap 1 — SEO-01: Favicon files exist with correct content
// ---------------------------------------------------------------------------
describe('SEO-01: favicon files exist with correct content', () => {
  it('icon.svg exists and contains the Othala rune path on dusty rose background with teal accent', () => {
    const svgPath = join(root, 'src/app/icon.svg')
    const svg = readFileSync(svgPath, 'utf-8')

    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox="0 0 32 32"')
    // dusty rose background fill
    expect(svg).toContain('#E8B4B8')
    // teal accent stroke on rune
    expect(svg).toContain('#2D8B8B')
    // rune drawn as <path>, not <text>
    expect(svg).toContain('<path')
  })

  it('icon.ico exists and has non-trivial file size (> 100 bytes)', () => {
    const stat = statSync(join(root, 'src/app/icon.ico'))
    expect(stat.size).toBeGreaterThan(100)
  })

  it('apple-icon.png exists and has non-trivial file size (> 500 bytes)', () => {
    const stat = statSync(join(root, 'src/app/apple-icon.png'))
    expect(stat.size).toBeGreaterThan(500)
  })
})

// ---------------------------------------------------------------------------
// Gap 2 — SEO-02: Site-level OG image module exports
// ---------------------------------------------------------------------------
describe('SEO-02: site-level opengraph-image.tsx exports default function, alt, size, contentType', () => {
  const ogSrc = readFileSync(join(root, 'src/app/opengraph-image.tsx'), 'utf-8')

  it('exports alt constant', () => {
    expect(ogSrc).toMatch(/export\s+const\s+alt\s*=/)
  })

  it('exports size constant with 1200x630 dimensions', () => {
    expect(ogSrc).toContain('export const size')
    expect(ogSrc).toContain('1200')
    expect(ogSrc).toContain('630')
  })

  it('exports contentType constant', () => {
    expect(ogSrc).toMatch(/export\s+const\s+contentType\s*=/)
  })

  it('exports a default async function (Image)', () => {
    // Must have a default export that is a function
    expect(ogSrc).toMatch(/export\s+default\s+async\s+function/)
  })

  it('uses ImageResponse from next/og', () => {
    expect(ogSrc).toContain("from 'next/og'")
    expect(ogSrc).toContain('ImageResponse')
  })

  it('uses Inter-Bold.ttf for Satori font rendering', () => {
    expect(ogSrc).toContain('Inter-Bold.ttf')
  })

  it('uses brand colors (dusty rose, surface, teal)', () => {
    expect(ogSrc).toContain('#E8B4B8')
    expect(ogSrc).toContain('#F5E6E8')
    expect(ogSrc).toContain('#2D8B8B')
  })
})

// ---------------------------------------------------------------------------
// Gap 3 — SEO-03: Per-post OG image module exports + imports posts
// ---------------------------------------------------------------------------
describe('SEO-03: per-post opengraph-image.tsx exports default + generateStaticParams, imports posts', () => {
  const postOgSrc = readFileSync(
    join(root, 'src/app/blog/[slug]/opengraph-image.tsx'),
    'utf-8'
  )

  it('imports posts from @/.velite', () => {
    expect(postOgSrc).toContain("from '@/.velite'")
    expect(postOgSrc).toContain('posts')
  })

  it('exports size constant with 1200x630 dimensions', () => {
    expect(postOgSrc).toContain('export const size')
    expect(postOgSrc).toContain('1200')
    expect(postOgSrc).toContain('630')
  })

  it('exports a default async Image function', () => {
    expect(postOgSrc).toMatch(/export\s+default\s+async\s+function/)
  })

  it('exports generateStaticParams', () => {
    expect(postOgSrc).toMatch(/export\s+(function|async\s+function)\s+generateStaticParams/)
  })

  it('looks up post title via post?.title', () => {
    expect(postOgSrc).toContain('post?.title')
  })
})

// ---------------------------------------------------------------------------
// Gap 4 — SEO-04: Sitemap uses content dates, no bare new Date()
// ---------------------------------------------------------------------------
describe('SEO-04: sitemap uses content dates, not bare new Date()', () => {
  const sitemapSrc = readFileSync(join(root, 'src/app/sitemap.ts'), 'utf-8')

  it('uses post.updated || post.date for blog routes', () => {
    expect(sitemapSrc).toContain('post.updated || post.date')
  })

  it('uses project.updated || project.date for project routes', () => {
    expect(sitemapSrc).toContain('project.updated || project.date')
  })

  it('derives latestPostDate from content', () => {
    expect(sitemapSrc).toContain('latestPostDate')
  })

  it('derives latestProjectDate from content', () => {
    expect(sitemapSrc).toContain('latestProjectDate')
  })

  it('has no bare lastModified: new Date() calls (no dynamic date for dynamic routes)', () => {
    // The only allowed new Date() patterns are:
    //   new Date(someValue)  — constructing from a value
    //   new Date('YYYY-MM-DD') — hardcoded past date (about page)
    //   new Date(0) — epoch sentinel for reduce
    // A bare `new Date()` (no args) used as a lastModified value would mean "now",
    // which is the smell we're eliminating.
    const bareNewDate = /lastModified:\s*new Date\(\s*\)/.test(sitemapSrc)
    expect(bareNewDate).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Gap 5 — SEO-05: RSS feed route exports GET, returns valid RSS 2.0
// ---------------------------------------------------------------------------
describe('SEO-05: RSS feed route is well-formed', () => {
  const feedSrc = readFileSync(join(root, 'src/app/feed.xml/route.ts'), 'utf-8')

  it('exports a GET function', () => {
    expect(feedSrc).toMatch(/export\s+(async\s+)?function\s+GET/)
  })

  it('produces RSS 2.0 root element', () => {
    expect(feedSrc).toContain('<rss version="2.0"')
  })

  it('includes Atom self-link for spec compliance', () => {
    expect(feedSrc).toContain('atom:link')
    expect(feedSrc).toContain('https://keech.dev/feed.xml')
    expect(feedSrc).toContain('rel="self"')
  })

  it('filters out draft posts', () => {
    expect(feedSrc).toContain('!p.draft')
  })

  it('returns Content-Type application/xml', () => {
    expect(feedSrc).toContain("'Content-Type': 'application/xml'")
  })
})

// ---------------------------------------------------------------------------
// Gap 6 — SEO-06: Project card and detail images have sizes attribute
// ---------------------------------------------------------------------------
describe('SEO-06: project images include sizes attribute for responsive loading', () => {
  it('project-card.tsx Image has a sizes prop', () => {
    const cardSrc = readFileSync(
      join(root, 'src/components/projects/project-card.tsx'),
      'utf-8'
    )
    expect(cardSrc).toContain('sizes=')
  })

  it('project-card.tsx sizes covers mobile, tablet, desktop breakpoints', () => {
    const cardSrc = readFileSync(
      join(root, 'src/components/projects/project-card.tsx'),
      'utf-8'
    )
    // Should reference vw values for at least two breakpoints
    expect(cardSrc).toContain('100vw')
    expect(cardSrc).toContain('50vw')
  })

  it('project detail page Image has a sizes prop', () => {
    const detailSrc = readFileSync(
      join(root, 'src/app/projects/[slug]/page.tsx'),
      'utf-8'
    )
    expect(detailSrc).toContain('sizes=')
  })
})

// ---------------------------------------------------------------------------
// Gap 7 — CLN-02: About page has no "Resume" text, no Download import
// ---------------------------------------------------------------------------
describe('CLN-02: about page has no resume placeholder or Download import', () => {
  const aboutSrc = readFileSync(join(root, 'src/app/about/page.tsx'), 'utf-8')

  it('does not contain "Resume" anywhere', () => {
    expect(aboutSrc).not.toContain('Resume')
  })

  it('does not import Download from lucide-react', () => {
    expect(aboutSrc).not.toContain('Download')
  })
})

// ---------------------------------------------------------------------------
// Gap 8 — SEC-01: CSP in proxy includes 'unsafe-inline' in script-src
// ---------------------------------------------------------------------------
describe("SEC-01: CSP script-src includes 'unsafe-inline'", () => {
  const middlewareSrc = readFileSync(join(root, 'src', 'proxy.ts'), 'utf-8')

  it("script-src directive contains 'unsafe-inline'", () => {
    // Locate the script-src line and verify unsafe-inline is present
    const scriptSrcLine = middlewareSrc
      .split('\n')
      .find(line => line.includes('script-src'))
    expect(scriptSrcLine).toBeDefined()
    expect(scriptSrcLine).toContain("'unsafe-inline'")
  })

  it('all other security headers remain intact (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)', () => {
    expect(middlewareSrc).toContain('X-Frame-Options')
    expect(middlewareSrc).toContain('X-Content-Type-Options')
    expect(middlewareSrc).toContain('Referrer-Policy')
  })
})
