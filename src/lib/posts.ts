import { posts } from '@/.velite'

/**
 * All published posts (drafts excluded).
 * Single source of truth for the draft guard — import this instead of
 * filtering `posts` inline so drafts cannot leak via missed call sites.
 * See .planning/phases/24-audit-gap-closures/24-CONTEXT.md D-01.
 */
export const publishedPosts = posts.filter(p => !p.draft)
