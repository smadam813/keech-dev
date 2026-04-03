const SLUG_PATTERN = /^[a-z0-9-]+$/
const MAX_SLUG_LENGTH = 100
const MAX_BATCH_SLUGS = 20

export function validateSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug)
}

export function validateSlugs(slugs: string[]): { valid: boolean; error?: string } {
  if (slugs.length > MAX_BATCH_SLUGS) {
    return { valid: false, error: `Maximum ${MAX_BATCH_SLUGS} slugs per request` }
  }
  const invalid = slugs.find(s => !validateSlug(s))
  if (invalid) {
    return { valid: false, error: 'Invalid slug parameter' }
  }
  return { valid: true }
}
