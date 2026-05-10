import type { Root, Element, ElementContent, Properties } from 'hast'
import { visit } from 'unist-util-visit'

function svg(className: string, children: ElementContent[]): Element {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      className: [className],
      xmlns: 'http://www.w3.org/2000/svg',
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    children,
  }
}

function el(tagName: string, properties: Properties): Element {
  return { type: 'element', tagName, properties, children: [] }
}

const copyIcon = svg('code-block__icon-copy', [
  el('rect', { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }),
  el('path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }),
])

const checkIcon = svg('code-block__icon-check', [
  el('path', { d: 'M20 6 9 17l-5-5' }),
])

const xIcon = svg('code-block__icon-x', [
  el('path', { d: 'M18 6 6 18' }),
  el('path', { d: 'm6 6 12 12' }),
])

export function rehypeCopyButton() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (
        node.tagName !== 'figure' ||
        !('dataRehypePrettyCodeFigure' in node.properties)
      ) {
        return
      }

      const existing = node.properties.className
      if (Array.isArray(existing)) {
        existing.push('code-block')
      } else {
        node.properties.className = ['code-block']
      }

      const button: Element = {
        type: 'element',
        tagName: 'button',
        properties: {
          className: ['code-block__copy'],
          ariaLabel: 'Copy code',
          ariaLive: 'polite',
          dataState: 'idle',
        },
        children: [copyIcon, checkIcon, xIcon],
      }

      node.children.push(button)
    })
  }
}
