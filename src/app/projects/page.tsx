import { projects } from '@/.velite'
import { ProjectCard } from '@/components/projects/project-card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

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
    <section className="w-full mx-auto max-w-7xl px-6 pt-12 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-10">Projects</h1>

      {sortedProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedProjects.map(project => (
            <ScrollReveal key={project.slug}>
              <ProjectCard project={project} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <p className="text-muted">No projects yet. Check back soon!</p>
      )}
    </section>
  )
}
