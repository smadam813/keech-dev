export function serializeFilters(filters: Set<string>): string | null {
  if (filters.size === 0) return null
  return [...filters].sort().join(',')
}

export function parseFilters(value: string | null): Set<string> {
  if (!value) return new Set()
  return new Set(value.split(',').filter(Boolean))
}
