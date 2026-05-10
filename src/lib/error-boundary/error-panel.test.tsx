import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorPanel } from './error-panel'

describe('ErrorPanel', () => {
  const defaultProps = {
    error: new Error('test error'),
    reset: vi.fn(),
    navigateTo: { href: '/', label: 'Go Home' },
  }

  it('renders a heading based on error classification', () => {
    render(<ErrorPanel {...defaultProps} />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('renders a message based on error classification', () => {
    render(<ErrorPanel {...defaultProps} error={new Error('generic')} />)
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })

  it('renders a content-specific heading for content errors', () => {
    render(<ErrorPanel {...defaultProps} error={new Error('MDX compilation failed')} />)
    expect(screen.getByRole('heading', { name: /content/i })).toBeInTheDocument()
  })

  it('renders a service-specific heading for service errors', () => {
    render(<ErrorPanel {...defaultProps} error={new Error('Redis connection refused')} />)
    expect(screen.getByRole('heading', { name: /temporarily/i })).toBeInTheDocument()
  })

  it('shows retry button for retryable errors (unknown)', () => {
    render(<ErrorPanel {...defaultProps} error={new Error('generic crash')} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('shows retry button for retryable errors (service)', () => {
    render(<ErrorPanel {...defaultProps} error={new Error('Redis down')} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('hides retry button for non-retryable errors (content)', () => {
    render(<ErrorPanel {...defaultProps} error={new Error('MDX parse error')} />)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('calls reset when retry button is clicked', () => {
    const reset = vi.fn()
    render(<ErrorPanel {...defaultProps} reset={reset} error={new Error('generic')} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('renders navigation link with correct href and label', () => {
    render(<ErrorPanel {...defaultProps} navigateTo={{ href: '/blog', label: 'Back to Blog' }} />)
    const link = screen.getByRole('link', { name: /back to blog/i })
    expect(link).toHaveAttribute('href', '/blog')
  })

  it('uses plain <a> tag for navigation (not next/link)', () => {
    render(<ErrorPanel {...defaultProps} />)
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link.tagName.toLowerCase()).toBe('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('logs the error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('boom')
    render(<ErrorPanel {...defaultProps} error={error} />)
    expect(consoleSpy).toHaveBeenCalledWith(error)
    consoleSpy.mockRestore()
  })

  it('applies header-offset height by default', () => {
    const { container } = render(<ErrorPanel {...defaultProps} />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('min-h-[calc(100dvh-4rem)]')
  })

  it('applies full viewport height when fullViewport is true', () => {
    const { container } = render(<ErrorPanel {...defaultProps} fullViewport />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('min-h-dvh')
    expect(wrapper.className).not.toContain('calc')
  })
})
