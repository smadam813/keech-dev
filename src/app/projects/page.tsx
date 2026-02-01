import { projects } from '@/.velite'
import { ProjectCard } from '@/components/projects/project-card'

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

  return (
    <main className="container mx-auto max-w-5xl px-6 py-8">
      <header className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Projects</h1>
        <p className="text-muted text-lg max-w-2xl">
          Things I&apos;ve built, from side projects to open source contributions.
        </p>
      </header>

      {sortedProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 scroll-reveal">
          {sortedProjects.map(project => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No projects yet. Check back soon!</p>
      )}
    </main>
  )
}
