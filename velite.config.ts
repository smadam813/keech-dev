import { defineCollection, defineConfig, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'

const posts = defineCollection({
  name: 'Post',
  pattern: 'posts/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(99),
      slug: s.slug('posts'),
      date: s.isodate(),
      updated: s.isodate().optional(),
      description: s.string().max(300).optional(),
      tags: s.array(s.string()).default([]),
      draft: s.boolean().default(false),
      toc: s.toc(),
      metadata: s.metadata(),
      excerpt: s.excerpt({ length: 150 }),
      body: s.mdx()
    })
    .transform(data => ({
      ...data,
      permalink: `/blog/${data.slug}`,
      readingTime: data.metadata.readingTime
    }))
})

const projects = defineCollection({
  name: 'Project',
  pattern: 'projects/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(99),
      slug: s.slug('projects'),
      description: s.string().max(300),
      date: s.isodate(),
      updated: s.isodate().optional(),
      featured: s.boolean().default(false),
      stack: s.array(s.string()).default([]),
      github: s.string().optional(),
      demo: s.string().optional(),
      category: s.enum(['side-project', 'professional', 'open-source']).optional(),
      image: s.image().optional(),
      body: s.mdx()
    })
    .transform(data => ({
      ...data,
      permalink: `/projects/${data.slug}`
    }))
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true
  },
  collections: { posts, projects },
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: 'github-dark-dimmed',
          keepBackground: true,
          defaultLang: {
            block: 'typescript',
            inline: 'typescript'
          }
        }
      ]
    ]
  }
})
