import { Suspense } from 'react'
import { projects } from '@/.velite'
import { FilteredProjectList } from '@/components/projects/filtered-project-list'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'A showcase of software projects, open source contributions, and side projects built by Adam Keech.',
}

export default function ProjectsPage() {
  // Sort: featured first, then by date (newest first)
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const allStack = [...new Set(sortedProjects.flatMap(p => p.stack))].sort()

  return (
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Projects</h1>
      <Suspense>
        <FilteredProjectList projects={sortedProjects} allStack={allStack} />
      </Suspense>
    </section>
  )
}
