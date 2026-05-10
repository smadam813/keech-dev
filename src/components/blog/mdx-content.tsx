'use client'

import type { MouseEvent } from 'react'

interface MDXContentProps {
  html: string
}

function MDXFallback() {
  return (
    <div
      className="text-center my-8"
      style={{
        border: '2px solid var(--color-accent-gold)',
        background: 'var(--color-surface-hi)',
        boxShadow: 'var(--shadow-brutal)',
        padding: '32px',
        borderRadius: 4,
        color: 'var(--color-ink)',
      }}
    >
      <h2 className="font-display text-2xl mb-4">This post couldn&apos;t be displayed</h2>
      <p style={{ color: 'var(--color-ink-dim)' }} className="mb-6">
        Something went wrong while rendering this content.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain <a> intentional: client-side routing may be broken in error state */}
      <a href="/blog" className="btn btn--primary">
        Back to blog
      </a>
    </div>
  )
}

async function handleCopyClick(button: HTMLButtonElement) {
  const figure = button.closest('.code-block')
  if (!figure) return

  const code = figure.querySelector('pre code')
  const text = code?.textContent || figure.querySelector('pre')?.textContent || ''
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    button.dataset.state = 'success'
    button.setAttribute('aria-label', 'Copied!')
  } catch (err) {
    console.error('Clipboard write failed:', err)
    button.dataset.state = 'error'
    button.setAttribute('aria-label', 'Copy failed')
  }

  setTimeout(() => {
    button.dataset.state = 'idle'
    button.setAttribute('aria-label', 'Copy code')
  }, 2000)
}

function handleClick(e: MouseEvent<HTMLDivElement>) {
  const target = e.target as HTMLElement
  const button = target.closest('.code-block__copy') as HTMLButtonElement | null
  if (!button) return
  handleCopyClick(button)
}

export function MDXContent({ html }: MDXContentProps) {
  if (!html) {
    return <MDXFallback />
  }

  return (
    <div onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
  )
}
