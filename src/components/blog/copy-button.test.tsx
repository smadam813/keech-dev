import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CopyButton } from './copy-button'

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
})

describe('CopyButton keyboard accessibility (A11Y-01)', () => {
  it('includes focus-visible:opacity-100 class so it becomes visible on keyboard Tab', () => {
    const { container } = render(<CopyButton getText={() => 'code content'} />)
    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    // The button must have focus-visible:opacity-100 in its class list
    // This ensures it is visible when navigated to via keyboard Tab
    expect(button!.className).toContain('focus-visible:opacity-100')
  })

  it('is initially hidden from pointer users (opacity-0) but keyboard-accessible', () => {
    const { container } = render(<CopyButton getText={() => 'code content'} />)
    const button = container.querySelector('button')
    expect(button!.className).toContain('opacity-0')
    expect(button!.className).toContain('focus-visible:opacity-100')
  })

  it('has an accessible label for screen readers', () => {
    render(<CopyButton getText={() => 'code content'} />)
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
  })
})
