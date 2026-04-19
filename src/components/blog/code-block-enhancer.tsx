'use client'

import { useEffect, useRef } from 'react'

/**
 * DOM-based code block enhancement for statically-rendered HTML content.
 *
 * Since MDX content is now rendered as HTML via dangerouslySetInnerHTML,
 * we can no longer use React component overrides for <pre> elements.
 * This component runs after mount to:
 * 1. Wrap each <pre> in a container with relative positioning
 * 2. Inject a copy button that reads the code text content
 */
export function CodeBlockEnhancer() {
  const enhanced = useRef(false)

  useEffect(() => {
    if (enhanced.current) return
    enhanced.current = true

    // Find all <pre> elements in the prose container (sibling of this component's mount point)
    const container = document.querySelector('.prose')
    if (!container) return

    const preElements = container.querySelectorAll('pre')

    preElements.forEach((pre) => {
      // Skip if already wrapped
      if (pre.parentElement?.classList.contains('group')) return

      // Create wrapper div
      const wrapper = document.createElement('div')
      wrapper.className = 'group relative'

      // Wrap the pre element
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)

      // Create copy button
      const button = document.createElement('button')
      button.className = [
        'absolute right-2 top-2 p-2 rounded border opacity-0',
        'group-hover:opacity-100 focus-visible:opacity-100 transition-opacity',
      ].join(' ')
      button.style.borderColor = 'var(--color-hair-strong)'
      button.style.background = 'var(--color-surface-hi)'
      button.style.color = 'var(--color-ink)'
      button.setAttribute('aria-label', 'Copy code')
      button.setAttribute('aria-live', 'polite')
      button.innerHTML = copyIcon

      button.addEventListener('click', async () => {
        const code = pre.querySelector('code')
        const text = code?.textContent || pre.textContent || ''
        if (!text) return

        try {
          await navigator.clipboard.writeText(text)
          button.innerHTML = checkIcon
          button.setAttribute('aria-label', 'Copied!')
        } catch (err) {
          console.error('Clipboard write failed:', err)
          button.innerHTML = xIcon
          button.setAttribute('aria-label', 'Copy failed')
        }

        setTimeout(() => {
          button.innerHTML = copyIcon
          button.setAttribute('aria-label', 'Copy code')
        }, 2000)
      })

      wrapper.appendChild(button)
    })
  }, [])

  return null
}

// SVG icons matching lucide Copy and Check icons (24x24, stroke-based)
const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`

const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`

const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
