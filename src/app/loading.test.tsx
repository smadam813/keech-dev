import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Loading from './loading'
import BlogLoading from './blog/loading'
import BlogPostLoading from './blog/[slug]/loading'
import ProjectsLoading from './projects/loading'

describe('Loading skeleton components', () => {
  describe('Loading (global)', () => {
    it('renders with animate-pulse class present', () => {
      const { container } = render(<Loading />)
      const pulseEls = container.querySelectorAll('.animate-pulse')
      expect(pulseEls.length).toBeGreaterThan(0)
    })

    it('renders a 3-column card grid skeleton', () => {
      const { container } = render(<Loading />)
      // lg:grid-cols-3 class signals 3-column layout
      const grid = container.querySelector('.lg\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('BlogLoading', () => {
    it('renders with animate-pulse class present', () => {
      const { container } = render(<BlogLoading />)
      const pulseEls = container.querySelectorAll('.animate-pulse')
      expect(pulseEls.length).toBeGreaterThan(0)
    })

    it('renders a 3-column grid skeleton', () => {
      const { container } = render(<BlogLoading />)
      const grid = container.querySelector('.lg\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('BlogPostLoading', () => {
    it('renders with animate-pulse class present', () => {
      const { container } = render(<BlogPostLoading />)
      const pulseEls = container.querySelectorAll('.animate-pulse')
      expect(pulseEls.length).toBeGreaterThan(0)
    })

    it('renders with max-w-6xl layout matching the blog post page', () => {
      const { container } = render(<BlogPostLoading />)
      const wrapper = container.querySelector('.max-w-6xl')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('ProjectsLoading', () => {
    it('renders with animate-pulse class present', () => {
      const { container } = render(<ProjectsLoading />)
      const pulseEls = container.querySelectorAll('.animate-pulse')
      expect(pulseEls.length).toBeGreaterThan(0)
    })

    it('renders a 2-column grid (not 3-column) matching projects page layout', () => {
      const { container } = render(<ProjectsLoading />)
      const twoColGrid = container.querySelector('.md\\:grid-cols-2')
      const threeColGrid = container.querySelector('.lg\\:grid-cols-3')
      expect(twoColGrid).toBeInTheDocument()
      expect(threeColGrid).not.toBeInTheDocument()
    })
  })
})
