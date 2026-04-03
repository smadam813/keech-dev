import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterChip } from './filter-chip'

// Mock next/link so it renders as a plain anchor in jsdom
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe('FilterChip', () => {
  describe('toggle mode (onToggle provided)', () => {
    it('renders a button with the label', () => {
      render(<FilterChip label="react" onToggle={() => {}} />)
      expect(screen.getByRole('button', { name: /react/i })).toBeInTheDocument()
    })

    it('sets aria-pressed to false when not active', () => {
      render(<FilterChip label="react" onToggle={() => {}} active={false} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    })

    it('sets aria-pressed to true when active', () => {
      render(<FilterChip label="react" onToggle={() => {}} active={true} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    })

    it('calls onToggle when clicked', () => {
      const handleToggle = vi.fn()
      render(<FilterChip label="react" onToggle={handleToggle} />)
      fireEvent.click(screen.getByRole('button'))
      expect(handleToggle).toHaveBeenCalledOnce()
    })

    it('displays count when provided', () => {
      render(<FilterChip label="react" onToggle={() => {}} count={5} />)
      expect(screen.getByText('(5)')).toBeInTheDocument()
    })

    it('does not display count when count is undefined', () => {
      render(<FilterChip label="react" onToggle={() => {}} />)
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
    })
  })

  describe('link mode (href provided, no onToggle)', () => {
    it('renders an anchor link with the label', () => {
      render(<FilterChip label="css" href="/blog?tags=css" />)
      const link = screen.getByRole('link', { name: /css/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/blog?tags=css')
    })

    it('does not render a button in link mode', () => {
      render(<FilterChip label="css" href="/blog?tags=css" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('display-only mode (no onToggle, no href)', () => {
    it('renders the label as a span', () => {
      render(<FilterChip label="typescript" />)
      // No button or link roles -- renders as span
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText('typescript')).toBeInTheDocument()
    })
  })
})
