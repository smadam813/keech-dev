import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NAV_RUNES, ELDER_FUTHARK } from '@/components/runes/rune-config'

export const metadata: Metadata = {
  title: 'About',
  description: 'Adam Keech is an engineering leader who writes about the craft of building software in a moment where the craft itself is shifting.',
}

export default function AboutPage() {
  return (
    <section className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <h1 className="page-title">
        <span aria-hidden="true" className="page-title__rune">{NAV_RUNES['/about'].char}</span>
        About
      </h1>

      <div className="about__grid">
        <div className="about__portrait">
          <Image
            src="/images/headshot.webp"
            alt="Adam Keech"
            fill
            sizes="(max-width: 760px) 70vw, 260px"
            className="object-cover"
            priority
          />
        </div>

        <div className="about__body">
          <p className="about__lede">
            I&apos;m an engineering leader who spends too much time in the
            terminal and not enough time asleep.
          </p>
          <p>
            I write about the craft of building software in a moment where the
            craft itself is shifting under our feet. Agents, AI-assisted review,
            spec-driven development, and what any of it means for the humans
            still doing the work.
          </p>
          <p>
            I currently lead platform and developer-experience teams. These
            days I tinker with all sorts of emerging concepts, and try to
            make sense of where the work is going.
          </p>

          <ul className="about__list">
            <li>
              <span aria-hidden="true" className="about__rune">{ELDER_FUTHARK.ansuz.char}</span>
              Writes here, roughly weekly.
            </li>
            <li>
              <span aria-hidden="true" className="about__rune">{ELDER_FUTHARK.kenaz.char}</span>
              Builds tooling for agent-driven PDLCs.
            </li>
            <li>
              <span aria-hidden="true" className="about__rune">{ELDER_FUTHARK.raidho.char}</span>
              Available for advisory work, selectively.
            </li>
          </ul>

          <div className="about__contact">
            <Link href="/feed.xml" className="btn btn--ghost">
              <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.sowilo.char}</span>
              RSS feed
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
