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
    image?: { src: string }
  }>
  allStack: string[]
}

export function FilteredProjectList({ projects, allStack }: FilteredProjectListProps) {
  const {
    filteredItems: filteredProjects,
    activeFilters: activeStack,
    isFiltering,
    isTransitioning,
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
      <FilterBar
        items={allStack}
        activeItems={activeStack}
        onToggle={handleToggle}
        onClear={handleClear}
        counts={stackCounts}
        renderChip={({ item, active, onToggle, count }) => (
          <FilterChip key={item} label={item} variant="tech" active={active} onToggle={onToggle} count={count} />
        )}
        label="Filter by technology"
      />
      {isFiltering && (
        <p className="text-sm font-mono text-muted mb-4">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      )}
      {filteredProjects.length > 0 ? (
        <div className={cn(
          'grid gap-6 md:grid-cols-2',
          'transition-opacity duration-200 filter-grid-fade',
          isTransitioning ? 'opacity-0' : 'opacity-100'
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
          <p className="text-muted text-lg mb-4">
            No projects match the selected technologies.
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1 text-sm font-mono font-bold border-2 border-black bg-white shadow-brutal hover:shadow-brutal-hover hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-150"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
