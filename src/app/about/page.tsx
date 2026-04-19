import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NAV_RUNES, ELDER_FUTHARK } from '@/components/runes/rune-config'

export const metadata: Metadata = {
  title: 'About',
  description: 'Adam Keech builds for the web, leads engineering teams, and writes about AI tooling, developer experience, and what he learns along the way.',
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

        <div>
          <p className="about__lede">
            I build things, tinker, and sometimes write about what I learn along the way.
          </p>

          <div className="prose">
            <p>
              Right now that means leading engineering teams through the AI tooling
              transition and trying to figure out what actually works versus what just
              feels productive. I spend a lot of time with AI-assisted development, not
              because I think it solves everything, but because we are still figuring out
              where it fits. I want to write about my journey as we figure it out together.
            </p>

            <p>
              Outside of work, I chase side projects, read about Norse mythology, and
              play too many games. D&amp;D on the tabletop, Marvel Rivals, and World of
              Warcraft. This site is where all of that lives — projects, posts, and
              whatever I am currently exploring.
            </p>
          </div>

          <ul className="about__list" style={{ ['--rune' as string]: `"${ELDER_FUTHARK.ansuz.char}"` }}>
            <li>Writes about engineering, AI tooling, and what sticks.</li>
            <li style={{ ['--rune' as string]: `"${ELDER_FUTHARK.kenaz.char}"` }}>
              Builds side projects to learn in public.
            </li>
            <li style={{ ['--rune' as string]: `"${ELDER_FUTHARK.raidho.char}"` }}>
              Currently exploring the AI-assisted workflow space.
            </li>
          </ul>

          <div style={{ marginTop: 28 }}>
            <Link href="/feed.xml" className="btn btn--ghost">
              <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.sowilo.char}</span>
              Subscribe via RSS
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
