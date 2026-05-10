'use client'

import { FilteredList } from '@/components/ui/filtered-list'
import { ProjectCard } from './project-card'

interface FilteredProjectListProps {
  projects: Array<{
    title: string
    slug: string
    description: string
    stack: string[]
    github?: string
    demo?: string
    category?: 'side-project' | 'professional' | 'open-source'
    image?: { src: string }
  }>
  allStack: string[]
}

export function FilteredProjectList({ projects, allStack }: FilteredProjectListProps) {
  return (
    <FilteredList
      items={projects}
      allFilterValues={allStack}
      getItemValues={(project) => project.stack}
      paramName="stack"
      filterLabel="Filter by technology"
      gridClassName="grid gap-6 md:grid-cols-2"
      statusFormat={(n, total) => `Showing ${n} of ${total} projects`}
      emptyMessage="No projects match the selected technologies."
      getKey={(project) => project.slug}
      renderItem={(project) => <ProjectCard project={project} />}
    />
  )
}
