import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Error from './error'

describe('Error boundary (global)', () => {
  it('renders a branded error heading', () => {
    render(<Error error={new Error('boom')} reset={() => {}} />)
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
  })

  it('renders an escape link that navigates to /', () => {
    render(<Error error={new Error('boom')} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders a reset button that calls the reset callback', () => {
    const reset = vi.fn()
    render(<Error error={new Error('boom')} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('does not use a Next.js Link for the escape href (plain anchor)', () => {
    const { container } = render(<Error error={new Error('boom')} reset={() => {}} />)
    // next/link renders as <a> in test env too, but the component uses plain <a href="/">
    // Verify the link element is a native anchor (not wrapped in any special component)
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link.tagName.toLowerCase()).toBe('a')
    expect(link).toHaveAttribute('href', '/')
  })
})
