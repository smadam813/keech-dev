import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, BookOpen } from 'lucide-react'
import { GithubIcon } from '@/components/icons/brand-icons'
import { FilterChip } from '@/components/ui/filter-chip'
import { PROJECT_RUNES } from '@/lib/runes'
import { CATEGORY_LABEL } from '@/lib/project-categories'

interface ProjectCardProps {
  project: {
    title: string
    slug: string
    description: string
    stack: string[]
    github?: string
    demo?: string
    category?: 'side-project' | 'professional' | 'open-source'
    image?: { src: string }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const shownStack = project.stack.slice(0, 6)
  const extraStack = project.stack.length - shownStack.length

  return (
    <Link href={`/projects/${project.slug}`} className="block group h-full">
      <article className={`card project-card ${project.image ? 'card--img' : ''}`}>
        <span aria-hidden="true" className="project-card__badge">
          {PROJECT_RUNES.bullet}
        </span>

        {project.image && (
          <div className="project-card__image">
            <Image
              src={project.image.src}
              alt={`${project.title} screenshot`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="project-card__body">
          {project.category && (
            <div className="project-card__eyebrow">
              {CATEGORY_LABEL[project.category]}
            </div>
          )}
          <header>
            <h2 className="card__title">{project.title}</h2>
          </header>

          <p className="card__excerpt">{project.description}</p>

          {shownStack.length > 0 && (
            <div className="project-card__stack">
              {shownStack.map((tech) => (
                <FilterChip key={tech} label={tech} variant="sm" />
              ))}
              {extraStack > 0 && (
                <span className="project-card__stack-more">+{extraStack}</span>
              )}
            </div>
          )}

          <div className="project-card__actions">
            {project.demo && (
              <span><ExternalLink size={14} /><span>Live</span></span>
            )}
            {project.github && (
              <span><GithubIcon size={14} /><span>Source</span></span>
            )}
            <span><BookOpen size={14} /><span>Read</span></span>
          </div>
        </div>
      </article>
    </Link>
  )
}
