import Link from 'next/link'
import { Github, Linkedin } from 'lucide-react'

const socialLinks = [
  { href: 'https://github.com/smadam813', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com/in/smadam813', icon: Linkedin, label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-8 pb-24 md:py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-sm">
          {new Date().getFullYear()} keech.dev
        </p>
        <div className="flex gap-6">
          {socialLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
                aria-label={link.label}
              >
                <Icon className="w-6 h-6" />
              </Link>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
