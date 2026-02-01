import { Metadata } from 'next'
import { Github, Linkedin, Download } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About | keech.dev',
  description: 'Learn about Adam Keech, a software developer passionate about building tools and exploring technology.',
}

const socialLinks = [
  { href: 'https://github.com/smadam813', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com/in/adam-keech', icon: Linkedin, label: 'LinkedIn' },
]

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Photo section */}
        <div className="shrink-0">
          <div className="w-48 h-48 border-[3px] border-black shadow-brutal overflow-hidden">
            {/* Replace with: <Image src="/images/headshot.jpg" alt="Adam Keech" fill className="object-cover" priority /> */}
            <div className="w-full h-full bg-muted/30 flex items-center justify-center">
              <span className="text-muted font-display text-lg">Photo</span>
            </div>
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

          {/* Social links section */}
          <div className="flex gap-4 mt-8">
            {socialLinks.map((link) => {
              const Icon = link.icon
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border-[3px] border-black bg-surface shadow-brutal
                             hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
                             transition-all duration-150"
                  aria-label={link.label}
                >
                  <Icon className="w-6 h-6" />
                </a>
              )
            })}
          </div>

          {/* Resume download section */}
          <div className="mt-6">
            {/* When resume.pdf exists, change to: <a href="/resume.pdf" download className="inline-flex items-center gap-2 ...">Download Resume</a> */}
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2
                         bg-muted/20 text-muted cursor-not-allowed opacity-60
                         font-medium"
            >
              <Download className="w-5 h-5" />
              Resume Coming Soon
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
