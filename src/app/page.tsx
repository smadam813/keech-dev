import type { Metadata } from 'next'
import Link from 'next/link'
import { LatestWriting } from '@/components/home/latest-writing'
import { NAV_RUNES } from '@/lib/runes'

export const metadata: Metadata = {
  description: 'Welcome to keech.dev - the personal portfolio and blog of Adam Keech, a software developer passionate about building tools and exploring technology.',
}

export default function Home() {
  return (
    <section className="home-below-hero">
      <p className="eyebrow">
        A notebook at the threshold of a new craft
      </p>
      <h1 className="display" style={{ marginTop: 20 }}>
        keech<span className="text-accent-light">.dev</span>
      </h1>
      <p className="home-lede">
        Notes on engineering, AI, and what it means to build software while
        the discipline itself is being rewritten.
      </p>
      <div className="home-ctas">
        <Link href="/blog" className="btn btn--primary">
          <span aria-hidden="true" className="btn__rune">{NAV_RUNES['/blog']}</span>
          Read the blog
        </Link>
        <Link href="/projects" className="btn btn--ghost">
          <span aria-hidden="true" className="btn__rune">{NAV_RUNES['/projects']}</span>
          See projects
        </Link>
      </div>
      <LatestWriting />
    </section>
  )
}
