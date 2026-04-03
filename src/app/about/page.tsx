import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'About',
  description: 'Adam Keech builds for the web, leads engineering teams, and writes about AI tooling, developer experience, and what he learns along the way.',
}

export default function AboutPage() {
  return (
    <section className="w-full mx-auto max-w-4xl px-6 pt-12 pb-16">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Photo section */}
        <div className="shrink-0 self-center md:self-start">
          <div className="relative w-48 aspect-[3/4] md:w-56 border-[3px] border-black shadow-brutal overflow-hidden">
            <Image
              src="/images/headshot.webp"
              alt="Adam Keech"
              width={384}
              height={512}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        {/* Bio section */}
        <div className="flex-1">
          <h1 className="font-display text-4xl font-bold mb-6">About</h1>

          <div className="prose">
            <p>
              I build things, tinker, and sometimes write about what I learn along the way.
            </p>

            <p>
              Right now that means leading engineering teams through the AI tooling
              transition and trying to figure out what actually works versus what just
              feels productive. I spend a lot of time with AI-assisted development, not
              because I think it solves everything, but because I think we are still
              figuring out where it fits. I want to write about my journey as we figure it out together.
            </p>

            <p>
              Outside of work, I chase side projects, read about Norse
              mythology, and play too many games. D&amp;D on the tabletop, Marvel
              Rivals, and World of Warcraft. This site is where all of that lives, from projects and posts
              to whatever I am currently exploring.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
