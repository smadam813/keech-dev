import { posts } from '@/.velite'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/blog/mdx-content'
import { TableOfContents } from '@/components/blog/toc'
import { TagChip } from '@/components/blog/tag-chip'
import type { Metadata } from 'next'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)

  if (!post) {
    return {
      title: 'Post Not Found'
    }
  }

  const description = post.description || (post.excerpt?.slice(0, 160) ?? '')

  return {
    title: post.title,
    description,
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      publishedTime: post.date,
      tags: post.tags,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = posts.find(p => p.slug === slug)

  if (!post) {
    notFound()
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(post.date))

  const formattedUpdated = post.updated
    ? new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(post.updated))
    : null

  return (
    <article className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12">
        {/* Main content */}
        <div>
          <header className="mb-10">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted mb-4">
              <time dateTime={post.date}>{formattedDate}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} min read</span>
              {formattedUpdated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Updated {formattedUpdated}</span>
                </>
              )}
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}
          </header>

          <div className="prose">
            <MDXContent code={post.body} />
          </div>
        </div>

        {/* Sidebar with TOC - hidden on mobile */}
        <aside className="hidden lg:block">
          <TableOfContents entries={post.toc} />
        </aside>
      </div>
    </article>
  )
}
