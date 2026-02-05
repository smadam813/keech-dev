import Link from 'next/link'
import Image from 'next/image'
import { Github, ExternalLink } from 'lucide-react'
import { TechBadge } from './tech-badge'

interface ProjectCardProps {
  project: {
    title: string
    slug: string
    description: string
    stack: string[]
    github?: string
    demo?: string
    image?: { src: string }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block group"
    >
      <article
        className="h-full flex flex-col bg-surface border-[3px] border-black shadow-brutal
                   hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
                   transition-all duration-150"
      >
        {/* Optional image */}
        {project.image && (
          <div className="aspect-video relative border-b-[3px] border-black overflow-hidden">
            <Image
              src={project.image.src}
              alt={`${project.title} screenshot`}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          <header className="mb-3">
            <h2 className="font-display text-xl font-bold group-hover:text-accent transition-colors">
              {project.title}
            </h2>
          </header>

          <p className="text-foreground/80 mb-4 line-clamp-2 flex-1">
            {project.description}
          </p>

          {/* Tech stack badges (first 4) */}
          {project.stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.stack.slice(0, 4).map((tech) => (
                <TechBadge key={tech} tech={tech} />
              ))}
              {project.stack.length > 4 && (
                <span className="text-xs text-muted self-center">
                  +{project.stack.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Quick link indicators */}
          <div className="flex items-center gap-4 text-sm text-muted">
            {project.github && (
              <span className="flex items-center gap-1">
                <Github size={14} />
                <span>Code</span>
              </span>
            )}
            {project.demo && (
              <span className="flex items-center gap-1">
                <ExternalLink size={14} />
                <span>Demo</span>
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
