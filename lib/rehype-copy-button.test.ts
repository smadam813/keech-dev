import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import { rehypeCopyButton } from './rehype-copy-button'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'

function parse(html: string): Root {
  return unified().use(rehypeParse, { fragment: true }).parse(html)
}

function transform(tree: Root): Root {
  const plugin = rehypeCopyButton()
  plugin(tree)
  return tree
}

function findElements(tree: Root, tagName: string): Element[] {
  const results: Element[] = []
  visit(tree, 'element', (node) => {
    if (node.tagName === tagName) results.push(node)
  })
  return results
}

describe('rehypeCopyButton', () => {
  it('adds code-block class to figure[data-rehype-pretty-code-figure]', () => {
    const tree = parse(
      '<figure data-rehype-pretty-code-figure><pre><code>const x = 1</code></pre></figure>'
    )
    transform(tree)

    const figures = findElements(tree, 'figure')
    expect(figures).toHaveLength(1)
    const className = figures[0].properties.className
    expect(className).toContain('code-block')
  })

  it('appends a button with class code-block__copy inside the figure', () => {
    const tree = parse(
      '<figure data-rehype-pretty-code-figure><pre><code>x</code></pre></figure>'
    )
    transform(tree)

    const buttons = findElements(tree, 'button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].properties.className).toContain('code-block__copy')
  })

  it('button has aria-label, aria-live, and data-state=idle', () => {
    const tree = parse(
      '<figure data-rehype-pretty-code-figure><pre><code>x</code></pre></figure>'
    )
    transform(tree)

    const buttons = findElements(tree, 'button')
    expect(buttons[0].properties.ariaLabel).toBe('Copy code')
    expect(buttons[0].properties.ariaLive).toBe('polite')
    expect(buttons[0].properties.dataState).toBe('idle')
  })

  it('button contains three SVG icons (copy, check, x)', () => {
    const tree = parse(
      '<figure data-rehype-pretty-code-figure><pre><code>x</code></pre></figure>'
    )
    transform(tree)

    const buttons = findElements(tree, 'button')
    const svgs = findElements(
      { type: 'root', children: buttons[0].children } as Root,
      'svg'
    )
    expect(svgs).toHaveLength(3)
    expect(svgs[0].properties.className).toContain('code-block__icon-copy')
    expect(svgs[1].properties.className).toContain('code-block__icon-check')
    expect(svgs[2].properties.className).toContain('code-block__icon-x')
  })

  it('does not modify figures without data-rehype-pretty-code-figure', () => {
    const tree = parse('<figure><pre><code>x</code></pre></figure>')
    transform(tree)

    const figures = findElements(tree, 'figure')
    expect(figures[0].properties.className).toBeUndefined()
    const buttons = findElements(tree, 'button')
    expect(buttons).toHaveLength(0)
  })

  it('handles multiple code blocks', () => {
    const tree = parse(
      '<figure data-rehype-pretty-code-figure><pre><code>a</code></pre></figure>' +
        '<figure data-rehype-pretty-code-figure><pre><code>b</code></pre></figure>'
    )
    transform(tree)

    const buttons = findElements(tree, 'button')
    expect(buttons).toHaveLength(2)
  })
})
