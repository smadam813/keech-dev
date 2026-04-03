import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MDXContent } from './mdx-content'

// CodeBlock is a client component that uses clipboard APIs not available in jsdom
vi.mock('./code-block', () => ({
  CodeBlock: ({ children }: { children: React.ReactNode }) => <pre>{children}</pre>,
}))

describe('MDXContent fallback on malformed content (SEC-02)', () => {
  it('renders the branded fallback when given completely invalid code', () => {
    // Arrange: code that will throw when passed through new Function()
    const invalidCode = 'this is not valid javascript }{{'

    // Act
    render(<MDXContent code={invalidCode} />)

    // Assert: branded fallback message is visible
    expect(screen.getByText(/this post couldn/i)).toBeInTheDocument()
  })

  it('renders a Back to Blog link in the fallback', () => {
    const invalidCode = 'throw new Error("simulated MDX render failure")'

    render(<MDXContent code={invalidCode} />)

    const link = screen.getByRole('link', { name: /back to blog/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/blog')
  })

  it('does not expose error details in the fallback UI', () => {
    const invalidCode = 'throw new Error("secret internal error details")'

    render(<MDXContent code={invalidCode} />)

    expect(screen.queryByText(/secret internal error details/i)).not.toBeInTheDocument()
  })
})
