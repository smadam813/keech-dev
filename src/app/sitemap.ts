import type { MetadataRoute } from 'next'
import { projects } from '@/.velite'
import { publishedPosts } from '@/lib/posts'

const BASE_URL = 'https://keech.dev'

export default function sitemap(): MetadataRoute.Sitemap {

  const latestPostDate = publishedPosts.reduce((latest, p) => {
    const d = new Date(p.updated || p.date)
    return d > latest ? d : latest
  }, new Date(0))

  const latestProjectDate = projects.reduce((latest, p) => {
    const d = new Date(p.updated || p.date)
    return d > latest ? d : latest
  }, new Date(0))

  const latestContentDate = latestPostDate > latestProjectDate ? latestPostDate : latestProjectDate

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: latestContentDate, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date('2026-02-01'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: latestPostDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/projects`, lastModified: latestProjectDate, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated || post.date),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    lastModified: new Date(project.updated || project.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes, ...projectRoutes]
}
