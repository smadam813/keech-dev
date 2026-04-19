export interface TocEntry {
  title: string
  url: string
  items: TocEntry[]
}

interface TocProps {
  entries: TocEntry[]
}

export function TableOfContents({ entries }: TocProps) {
  if (entries.length === 0) return null

  return (
    <nav
      className="max-h-[calc(100vh-8rem)] overflow-auto"
      style={{
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-ink-dim)',
      }}
    >
      <div
        className="mb-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-accent-gold)',
        }}
      >
        Contents
      </div>
      <TocList entries={[{ title: 'Introduction', url: '#', items: [] }, ...entries]} />
    </nav>
  )
}

export function TocList({ entries, depth = 0 }: { entries: TocEntry[]; depth?: number }) {
  return (
    <ul className={depth > 0 ? 'ml-4' : ''} style={{ listStyle: 'none', padding: 0 }}>
      {entries.map((entry) => (
        <li key={entry.url} className="my-1.5">
          <a
            href={entry.url}
            className="transition-colors"
            style={{ color: 'var(--color-ink-dim)', fontSize: 13, lineHeight: 1.5 }}
          >
            {entry.title}
          </a>
          {entry.items.length > 0 && <TocList entries={entry.items} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  )
}
