import { defineCollection, defineConfig, s } from 'velite'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { createCssVariablesTheme } from 'shiki'
import type { Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * CSS-variables theme for syntax highlighting.
 * Token colors are defined in globals.css alongside other design tokens,
 * sourced from github-dark-dimmed for visual parity.
 */
const codeTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {}
})

/**
 * Rehype plugin that adds role="list" to <ul> and <ol> elements.
 * Required for VoiceOver compatibility — Safari strips list semantics
 * when list-style is removed via CSS.
 */
function rehypeListRole() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'ul' || node.tagName === 'ol') {
        node.properties = node.properties || {}
        node.properties.role = 'list'
      }
    })
  }
}

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
      body: s.markdown()
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
      body: s.markdown()
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
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: codeTheme,
          keepBackground: false,
          defaultLang: {
            block: 'typescript',
            inline: 'typescript'
          }
        }
      ],
      rehypeListRole
    ]
  }
})
