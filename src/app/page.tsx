import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/hero'
import { LatestWriting } from '@/components/home/latest-writing'
import { ELDER_FUTHARK } from '@/components/runes/rune-config'

export const metadata: Metadata = {
  description: 'Welcome to keech.dev - the personal portfolio and blog of Adam Keech, a software developer passionate about building tools and exploring technology.',
}

export default function Home() {
  return (
    <>
      <Hero />
      <section className="home-below-hero">
        <p className="home-lede">
          Notes on engineering, AI, and what it means to build software while
          the discipline itself is being rewritten.
        </p>
        <div className="home-ctas">
          <Link href="/blog" className="btn btn--primary">
            <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.ansuz.char}</span>
            Read the blog
          </Link>
          <Link href="/projects" className="btn btn--ghost">
            <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.kenaz.char}</span>
            See projects
          </Link>
        </div>
        <LatestWriting />
      </section>
    </>
  )
}
