export function formatViewCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'view' : 'views'}`
}
