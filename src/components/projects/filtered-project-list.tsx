'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { FilterBar } from '@/components/ui/filter-bar'
import { TechBadge } from '@/components/projects/tech-badge'
import { ProjectCard } from './project-card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

interface FilteredProjectListProps {
  projects: Array<{
    title: string
    slug: string
    description: string
    stack: string[]
    github?: string
    demo?: string
    image?: { src: string }
  }>
  allStack: string[]
}

export function FilteredProjectList({ projects, allStack }: FilteredProjectListProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Read filter state from URL
  const activeStack = useMemo(
    () => new Set(searchParams.get('stack')?.split(',').filter(Boolean) ?? []),
    [searchParams]
  )

  const isFiltering = activeStack.size > 0

  // AND logic: show all when no filters, otherwise only projects containing ALL selected stack items
  const filteredProjects =
    activeStack.size === 0
      ? projects
      : projects.filter((project) =>
          [...activeStack].every((tech) => project.stack.includes(tech))
        )

  // Write updated stack set to URL via replaceState (no navigation)
  const updateURL = useCallback(
    (next: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.size === 0) {
        params.delete('stack')
      } else {
        params.set('stack', [...next].sort().join(','))
      }
      const query = params.toString()
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    },
    [searchParams, pathname]
  )

  const handleToggle = useCallback(
    (item: string) => {
      const next = new Set(activeStack)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      updateURL(next)
    },
    [activeStack, updateURL]
  )

  const handleClear = useCallback(() => {
    updateURL(new Set())
  }, [updateURL])

  return (
    <>
      <FilterBar
        items={allStack}
        activeItems={activeStack}
        onToggle={handleToggle}
        onClear={handleClear}
        renderChip={({ item, active, onToggle }) => (
          <TechBadge key={item} tech={item} active={active} onToggle={onToggle} />
        )}
        label="Filter by technology"
      />
      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((project) =>
            isFiltering ? (
              <ProjectCard key={project.slug} project={project} />
            ) : (
              <ScrollReveal key={project.slug}>
                <ProjectCard project={project} />
              </ScrollReveal>
            )
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-lg mb-4">
            No projects match the selected technologies.
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="text-accent hover:text-accent-hover font-mono font-bold underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
