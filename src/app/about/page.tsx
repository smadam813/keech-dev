import { Metadata } from 'next'
import Image from 'next/image'
import { Download } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Adam Keech, a software developer passionate about building tools and exploring technology. Discover his background, interests, and the story behind keech.dev.',
}

export default function AboutPage() {
  return (
    <section className="w-full mx-auto max-w-4xl px-6 pt-12 pb-16">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Photo section */}
        <div className="shrink-0">
          <div className="relative w-48 h-48 border-[3px] border-black shadow-brutal overflow-hidden">
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
              Adam Keech is a software developer passionate about building tools that make
              complex problems more approachable. With a focus on web technologies and
              developer experience, he enjoys crafting solutions that are both functional
              and thoughtfully designed.
            </p>

            <p>
              He believes in the power of open source and continuous learning, constantly
              exploring new technologies and approaches. When not coding, you might find
              him diving into side projects, reading about Norse mythology, or tinkering
              with hardware builds.
            </p>

            <p>
              This site serves as his digital home, a place to share projects, thoughts,
              and experiments with the wider community.
            </p>
          </div>

          {/* Resume download section */}
          <div className="mt-6">
            {/* When resume.pdf exists, change to: <a href="/resume.pdf" download className="inline-flex items-center gap-2 ...">Download Resume</a> */}
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2
                         border-[3px] border-black bg-muted/20 text-muted
                         cursor-not-allowed opacity-60 font-medium"
            >
              <Download className="w-5 h-5" />
              Resume Coming Soon
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
