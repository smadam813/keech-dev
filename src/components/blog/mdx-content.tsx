import { CodeBlockEnhancer } from './code-block-enhancer'

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

export function MDXContent({ html }: MDXContentProps) {
  if (!html) {
    return <MDXFallback />
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <CodeBlockEnhancer />
    </>
  )
}
