import { posts } from '@/.velite'

export type Post = (typeof posts)[number]

export const publishedPosts = posts.filter(p => !p.draft)
