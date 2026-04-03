import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlogPostError from './error'

describe('BlogPostError boundary', () => {
  it('renders a branded error heading for blog post failures', () => {
    render(<BlogPostError error={new Error('mdx fail')} reset={() => {}} />)
    expect(
      screen.getByRole('heading', { name: /this post couldn't be displayed/i })
    ).toBeInTheDocument()
  })

  it('renders an escape link that navigates to /blog', () => {
    render(<BlogPostError error={new Error('mdx fail')} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /back to blog/i })
    expect(link).toHaveAttribute('href', '/blog')
  })

  it('renders a reset button that calls the reset callback', () => {
    const reset = vi.fn()
    render(<BlogPostError error={new Error('mdx fail')} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('does not link to / — escape is always to /blog for blog post errors', () => {
    render(<BlogPostError error={new Error('mdx fail')} reset={() => {}} />)
    const links = screen.getAllByRole('link')
    // All escape links in this boundary should point to /blog
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/blog')
    })
  })
})
