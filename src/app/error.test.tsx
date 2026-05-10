import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from './error'

describe('Error boundary (app)', () => {
  it('renders a heading from the error classification strategy', () => {
    render(<ErrorPage error={new Error('boom')} reset={() => {}} />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('renders an escape link that navigates to /', () => {
    render(<ErrorPage error={new Error('boom')} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders a reset button that calls the reset callback', () => {
    const reset = vi.fn()
    render(<ErrorPage error={new Error('boom')} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('uses plain <a> tag for the escape href (not Next.js Link)', () => {
    render(<ErrorPage error={new Error('boom')} reset={() => {}} />)
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link.tagName.toLowerCase()).toBe('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('discriminates errors: content errors show content-specific heading', () => {
    render(<ErrorPage error={new Error('MDX compilation failed')} reset={() => {}} />)
    expect(screen.getByRole('heading', { name: /content/i })).toBeInTheDocument()
  })

  it('discriminates errors: service errors show service-specific heading', () => {
    render(<ErrorPage error={new Error('Redis connection refused')} reset={() => {}} />)
    expect(screen.getByRole('heading', { name: /temporarily/i })).toBeInTheDocument()
  })
})
