import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlogPostError from './error'

describe('BlogPostError boundary', () => {
  it('renders a heading from the error classification strategy', () => {
    render(<BlogPostError error={new Error('mdx fail')} reset={() => {}} />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('renders an escape link that navigates to /blog', () => {
    render(<BlogPostError error={new Error('mdx fail')} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /back to blog/i })
    expect(link).toHaveAttribute('href', '/blog')
  })

  it('renders a reset button that calls the reset callback for unknown errors', () => {
    const reset = vi.fn()
    render(<BlogPostError error={new Error('generic crash')} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('does not link to / — escape is always to /blog for blog post errors', () => {
    render(<BlogPostError error={new Error('mdx fail')} reset={() => {}} />)
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/blog')
    })
  })

  it('discriminates errors: content errors show content-specific heading', () => {
    render(<BlogPostError error={new Error('MDX compilation failed')} reset={() => {}} />)
    expect(screen.getByRole('heading', { name: /content/i })).toBeInTheDocument()
  })

  it('discriminates errors: content errors hide retry button (content is broken, retrying will not help)', () => {
    render(<BlogPostError error={new Error('MDX compilation failed')} reset={() => {}} />)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })
})
