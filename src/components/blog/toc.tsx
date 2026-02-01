interface TocEntry {
  title: string
  url: string
  items: TocEntry[]
}

interface TocProps {
  entries: TocEntry[]
}

export function TableOfContents({ entries }: TocProps) {
  if (entries.length === 0) {
    return null
  }

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto">
      <h2 className="font-display text-lg font-bold mb-4">Contents</h2>
      <TocList entries={entries} />
    </nav>
  )
}

function TocList({ entries, depth = 0 }: { entries: TocEntry[]; depth?: number }) {
  return (
    <ul className={depth > 0 ? 'ml-4' : ''}>
      {entries.map((entry) => (
        <li key={entry.url} className="my-2">
          <a
            href={entry.url}
            className="text-muted hover:text-foreground transition-colors"
          >
            {entry.title}
          </a>
          {entry.items.length > 0 && (
            <TocList entries={entry.items} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  )
}
