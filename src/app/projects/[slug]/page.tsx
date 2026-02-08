import { projects } from '@/.velite'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { TechBadge } from '@/components/projects/tech-badge'
import { ArrowLeft, Github, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return projects.map(project => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)

  if (!project) {
    return {
      title: 'Project Not Found'
    }
  }

  const description = project.description.slice(0, 160)

  return {
    title: project.title,
    description,
    openGraph: {
      type: 'article',
      title: project.title,
      description,
      ...(project.image && { images: [{ url: project.image.src }] }),
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)

  if (!project) {
    notFound()
  }

  return (
    <article className="w-full mx-auto max-w-4xl px-6 pt-12 pb-16">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        <span>All Projects</span>
      </Link>

      {/* Header */}
      <header className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          {project.title}
        </h1>
        <p className="text-lg text-muted mb-6">
          {project.description}
        </p>

        {/* Tech stack badges (all items) */}
        {project.stack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.stack.map((tech) => (
              <TechBadge key={tech} tech={tech} />
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 font-bold
                         bg-surface border-[3px] border-black shadow-brutal
                         hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
                         transition-all duration-150"
            >
              <Github size={18} />
              <span>View Code</span>
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 font-bold
                         bg-accent text-white border-[3px] border-black shadow-brutal
                         hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px]
                         transition-all duration-150"
            >
              <ExternalLink size={18} />
              <span>Live Demo</span>
            </a>
          )}
        </div>
      </header>

      {/* Optional screenshot */}
      {project.image && (
        <div className="mb-10 relative aspect-video border-[3px] border-black shadow-brutal overflow-hidden">
          <Image
            src={project.image.src}
            alt={`${project.title} screenshot`}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* MDX body content */}
      <div className="prose">
        <MDXContent code={project.body} />
      </div>
    </article>
  )
}
