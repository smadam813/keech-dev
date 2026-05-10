import { Suspense } from 'react'
import { projects } from '@/.velite'
import { FilteredProjectList } from '@/components/projects/filtered-project-list'
import { NAV_RUNES } from '@/lib/runes'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'A showcase of software projects, open source contributions, and side projects built by Adam Keech.',
}

export default function ProjectsPage() {
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
  const allStack = [...new Set(sortedProjects.flatMap(p => p.stack))].sort()

  return (
    <section className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <h1 className="page-title">
        <span aria-hidden="true" className="page-title__rune">{NAV_RUNES['/projects']}</span>
        Projects
      </h1>
      <p className="home-lede" style={{ marginTop: 0 }}>
        Selected work — side projects, open-source bits, and things I ship when nobody asked.
      </p>
      <Suspense>
        <FilteredProjectList projects={sortedProjects} allStack={allStack} />
      </Suspense>
    </section>
  )
}
