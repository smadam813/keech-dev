export function formatViewCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'view' : 'views'}`
}

export function getCachedViews(slug: string): number | null {
  try {
    const raw = localStorage.getItem(`views:${slug}`)
    return raw !== null ? Number(raw) : null
  } catch {
    return null
  }
}

export function setCachedViews(slug: string, count: number): void {
  try {
    localStorage.setItem(`views:${slug}`, String(count))
  } catch {
    // localStorage unavailable — fail silently
  }
}
