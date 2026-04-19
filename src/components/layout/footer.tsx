import Link from 'next/link'
import { GithubIcon, LinkedinIcon } from '@/components/icons/brand-icons'

const socialLinks = [
  { href: 'https://github.com/smadam813', icon: GithubIcon, label: 'GitHub' },
  { href: 'https://linkedin.com/in/adam-keech', icon: LinkedinIcon, label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer
      className="mt-auto relative z-[1]"
      style={{
        borderTop: '1px solid var(--color-hair)',
        padding: '24px max(24px, calc((100vw - var(--page-max)) / 2))',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        background: 'rgba(13, 33, 40, 0.55)',
        backdropFilter: 'blur(6px)',
        color: 'var(--color-ink-dim)',
      }}
    >
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ maxWidth: 'var(--page-max)', margin: '0 auto' }}
      >
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em' }}>
          © {new Date().getFullYear()} keech.dev
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
                aria-label={link.label}
                className="hover:-translate-y-0.5 motion-safe:transition-all motion-safe:duration-150"
                style={{ color: 'var(--color-ink-dim)' }}
              >
                <Icon className="w-5 h-5" />
              </Link>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
