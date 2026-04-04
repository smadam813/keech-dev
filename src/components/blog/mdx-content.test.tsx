import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MDXContent } from './mdx-content'

// CodeBlockEnhancer is a client component using DOM APIs not available in jsdom
vi.mock('./code-block-enhancer', () => ({
  CodeBlockEnhancer: () => null,
}))

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
