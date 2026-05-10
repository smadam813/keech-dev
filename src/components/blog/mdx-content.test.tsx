import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MDXContent } from './mdx-content'

describe('MDXContent HTML rendering', () => {
  it('renders valid HTML content via dangerouslySetInnerHTML', () => {
    const html = '<h1>Hello World</h1><p>This is a test paragraph.</p>'

    const { container } = render(<MDXContent html={html} />)

    expect(container.querySelector('h1')?.textContent).toBe('Hello World')
    expect(container.querySelector('p')?.textContent).toBe('This is a test paragraph.')
  })

  it('renders HTML with role="list" attributes on lists', () => {
    const html = '<ul role="list"><li>Item 1</li><li>Item 2</li></ul>'

    const { container } = render(<MDXContent html={html} />)

    const list = container.querySelector('ul')
    expect(list).toBeInTheDocument()
    expect(list).toHaveAttribute('role', 'list')
  })

  it('renders code blocks with pre and code elements', () => {
    const html = '<pre><code class="language-typescript">const x = 1;</code></pre>'

    const { container } = render(<MDXContent html={html} />)

    expect(container.querySelector('pre')).toBeInTheDocument()
    expect(container.querySelector('code')?.textContent).toBe('const x = 1;')
  })
})

describe('MDXContent fallback on empty/missing content', () => {
  it('renders the branded fallback when given empty string', () => {
    render(<MDXContent html="" />)

    expect(screen.getByText(/this post couldn/i)).toBeInTheDocument()
  })

  it('renders a Back to Blog link in the fallback', () => {
    render(<MDXContent html="" />)

    const link = screen.getByRole('link', { name: /back to blog/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/blog')
  })
})

describe('MDXContent copy button click handler', () => {
  const codeBlockHtml = `
    <figure data-rehype-pretty-code-figure class="code-block">
      <pre><code>const hello = "world"</code></pre>
      <button class="code-block__copy" aria-label="Copy code" aria-live="polite" data-state="idle">
        <svg class="code-block__icon-copy"></svg>
        <svg class="code-block__icon-check"></svg>
        <svg class="code-block__icon-x"></svg>
      </button>
    </figure>
  `

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('copies code text to clipboard when copy button is clicked', async () => {
    const { container } = render(<MDXContent html={codeBlockHtml} />)

    const button = container.querySelector('.code-block__copy') as HTMLButtonElement
    fireEvent.click(button)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const hello = "world"')
    })
  })

  it('sets data-state to success after successful copy', async () => {
    const { container } = render(<MDXContent html={codeBlockHtml} />)

    const button = container.querySelector('.code-block__copy') as HTMLButtonElement
    fireEvent.click(button)

    await waitFor(() => {
      expect(button.dataset.state).toBe('success')
      expect(button.getAttribute('aria-label')).toBe('Copied!')
    })
  })

  it('sets data-state to error when clipboard fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const rejection = new Error('Clipboard denied')
    ;(navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(rejection)

    const { container } = render(<MDXContent html={codeBlockHtml} />)

    const button = container.querySelector('.code-block__copy') as HTMLButtonElement
    fireEvent.click(button)

    await waitFor(() => {
      expect(button.dataset.state).toBe('error')
      expect(button.getAttribute('aria-label')).toBe('Copy failed')
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith('Clipboard write failed:', rejection)

    consoleErrorSpy.mockRestore()
  })

  it('reverts to idle state after 2 seconds', async () => {
    vi.useFakeTimers()
    const { container } = render(<MDXContent html={codeBlockHtml} />)

    const button = container.querySelector('.code-block__copy') as HTMLButtonElement
    fireEvent.click(button)

    await vi.advanceTimersByTimeAsync(0)
    expect(button.dataset.state).toBe('success')

    await vi.advanceTimersByTimeAsync(2000)
    expect(button.dataset.state).toBe('idle')
    expect(button.getAttribute('aria-label')).toBe('Copy code')
  })

  it('does nothing when clicking outside the copy button', () => {
    const { container } = render(<MDXContent html={codeBlockHtml} />)

    const pre = container.querySelector('pre') as HTMLElement
    fireEvent.click(pre)

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('handles click on SVG inside the button via event delegation', async () => {
    const { container } = render(<MDXContent html={codeBlockHtml} />)

    const svg = container.querySelector('.code-block__icon-copy') as SVGElement
    fireEvent.click(svg)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const hello = "world"')
    })
  })
})
