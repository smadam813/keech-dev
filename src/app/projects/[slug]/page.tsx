import { projects } from '@/.velite'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { GithubIcon } from '@/components/icons/brand-icons'
import { ELDER_FUTHARK } from '@/components/runes/rune-config'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

const CATEGORY_LABEL = {
  'side-project': 'Side project',
  'professional': 'Professional',
  'open-source':  'Open source',
} as const

export async function generateStaticParams() {
  return projects.map(project => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)
  if (!project) return { title: 'Project Not Found' }

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
  if (!project) notFound()

  return (
    <article className="w-full mx-auto" style={{ maxWidth: 'var(--page-max)' }}>
      <Link href="/projects" className="back-link">
        <ArrowLeft size={14} />
        <span>All projects</span>
      </Link>

      <div className="post-detail__grid">
        <div>
          <article className="post-detail__main">
            {project.category && (
              <div
                className="project-card__eyebrow"
                style={{ marginBottom: 12 }}
              >
                {CATEGORY_LABEL[project.category]}
              </div>
            )}
            <h1 className="post-detail__title">{project.title}</h1>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 20,
                color: 'var(--color-ink-dim)',
                margin: '10px 0 20px',
              }}
            >
              {project.description}
            </p>

            {project.stack.length > 0 && (
              <div className="tag-bar" style={{ marginBottom: 20 }}>
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="chip chip--sm"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--color-hair-strong)',
                      background: 'var(--color-surface-lo)',
                      color: 'var(--color-ink-dim)',
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div className="home-ctas" style={{ margin: '16px 0 28px' }}>
              {project.demo && (
                <a href={project.demo} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                  <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.sowilo.char}</span>
                  <ExternalLink size={14} />
                  <span>Live demo</span>
                </a>
              )}
              {project.github && (
                <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                  <span aria-hidden="true" className="btn__rune">{ELDER_FUTHARK.algiz.char}</span>
                  <GithubIcon size={14} />
                  <span>Source</span>
                </a>
              )}
            </div>

            {project.image && (
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  marginBottom: 24,
                  border: '1px solid var(--color-hair-strong)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={project.image.src}
                  alt={`${project.title} screenshot`}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="prose prose-projects">
              <MDXContent html={project.body} />
            </div>
          </article>
        </div>

        <aside className="post-detail__toc hidden lg:block" />
      </div>
    </article>
  )
}
