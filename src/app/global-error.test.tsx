import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GlobalError from './global-error'

vi.mock('./globals.css', () => ({}))

vi.mock('@/lib/fonts', () => ({
  norse: { variable: '--font-norse' },
  inter: { variable: '--font-inter' },
}))

describe('GlobalError boundary (root layout)', () => {
  it('renders content inside a full HTML shell', () => {
    const { container } = render(<GlobalError error={new Error('root fail')} reset={() => {}} />)
    expect(container.textContent).toContain('Something went wrong')
    expect(document.body).toBeInTheDocument()
  })

  it('renders a heading from the error classification strategy', () => {
    render(<GlobalError error={new Error('root fail')} reset={() => {}} />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('renders an escape link that navigates to /', () => {
    render(<GlobalError error={new Error('root fail')} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders a reset button that calls the reset callback', () => {
    const reset = vi.fn()
    render(<GlobalError error={new Error('root fail')} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('discriminates errors: service errors show service-specific heading', () => {
    render(<GlobalError error={new Error('Redis connection refused')} reset={() => {}} />)
    expect(screen.getByRole('heading', { name: /temporarily/i })).toBeInTheDocument()
  })
})
