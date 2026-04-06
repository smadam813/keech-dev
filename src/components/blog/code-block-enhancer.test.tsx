import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { CodeBlockEnhancer } from './code-block-enhancer'

describe('CodeBlockEnhancer (TEST-03)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="prose">
        <pre><code>const x = 1</code></pre>
      </div>
    `
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('wraps pre elements in div.group.relative', () => {
    render(<CodeBlockEnhancer />)
    const wrapper = document.querySelector('.prose .group.relative')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.querySelector('pre')).not.toBeNull()
  })

  it('injects copy button with aria-label="Copy code"', () => {
    render(<CodeBlockEnhancer />)
    const button = document.querySelector('button[aria-label="Copy code"]')
    expect(button).not.toBeNull()
    expect(button?.closest('.group.relative')).not.toBeNull()
  })

  it('clicking copy button calls navigator.clipboard.writeText with code text', async () => {
    render(<CodeBlockEnhancer />)
    const button = document.querySelector('button[aria-label="Copy code"]') as HTMLButtonElement
    expect(button).not.toBeNull()
    button.click()
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1')
    })
  })

  it('does nothing when no .prose container exists', () => {
    document.body.innerHTML = '<div><pre><code>code</code></pre></div>'
    render(<CodeBlockEnhancer />)
    expect(document.querySelector('.group.relative')).toBeNull()
  })

  it('skips pre already wrapped in .group parent (no double-wrapping)', () => {
    document.body.innerHTML = `
      <div class="prose">
        <div class="group"><pre><code>already wrapped</code></pre></div>
      </div>
    `
    render(<CodeBlockEnhancer />)
    const groups = document.querySelectorAll('.group')
    expect(groups.length).toBe(1)
  })
})
