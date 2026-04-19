'use client'

import { FilterBar } from '@/components/ui/filter-bar'
import { FilterChip } from '@/components/ui/filter-chip'
import { useFilteredList } from '@/hooks/use-filtered-list'
import { ProjectCard } from './project-card'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { cn } from '@/lib/utils'

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
  const {
    filteredItems: filteredProjects,
    activeFilters: activeStack,
    isFiltering,
    isPending,
    filterCounts: stackCounts,
    handleToggle,
    handleClear,
  } = useFilteredList({
    items: projects,
    allFilterValues: allStack,
    getItemValues: (project) => project.stack,
    paramName: 'stack',
  })

  return (
    <>
      <div className="tag-bar">
        <FilterBar
          items={allStack}
          activeItems={activeStack}
          onToggle={handleToggle}
          onClear={handleClear}
          counts={stackCounts}
          renderChip={({ item, active, onToggle, count }) => (
            <FilterChip key={item} label={item} active={active} onToggle={onToggle} count={count} />
          )}
          label="Filter by technology"
        />
      </div>
      {isFiltering && (
        <p className="filter-status">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      )}
      {filteredProjects.length > 0 ? (
        <div className={cn(
          'grid gap-6 md:grid-cols-2',
          'transition-opacity duration-200 filter-grid-fade',
          isPending ? 'opacity-0' : 'opacity-100'
        )}>
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
          <p className="filter-status" style={{ marginBottom: 16 }}>
            No projects match the selected technologies.
          </p>
          <button type="button" onClick={handleClear} className="btn btn--ghost">
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
