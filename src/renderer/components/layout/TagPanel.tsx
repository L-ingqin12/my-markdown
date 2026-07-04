import React, { useMemo, useState, useEffect } from 'react'
import { extractTags } from '../../utils/wikilink'

interface TagRecord {
  name: string
  count: number
  files: string[]
}

interface TagPanelProps {
  documents: Array<{ path: string; content: string }>
  onTagClick?: (tag: string) => void
  activeTag?: string
}

export function TagPanel({ documents, onTagClick, activeTag }: TagPanelProps) {
  const [tags, setTags] = useState<TagRecord[]>([])

  useEffect(() => {
    const tagMap = new Map<string, Set<string>>()
    documents.forEach(doc => {
      const docTags = extractTags(doc.content)
      docTags.forEach(tag => {
        if (!tagMap.has(tag)) tagMap.set(tag, new Set())
        tagMap.get(tag)!.add(doc.path)
      })
    })

    const sorted = Array.from(tagMap.entries())
      .map(([name, files]) => ({ name, count: files.size, files: Array.from(files) }))
      .sort((a, b) => b.count - a.count)

    setTags(sorted)
  }, [documents])

  return (
    <div style={{ padding: '8px' }}>
      {tags.length === 0 ? (
        <div style={{ padding: '16px', color: '#aaa', fontSize: '13px', textAlign: 'center' }}>
          No tags found. Add tags in YAML frontmatter or with #tag syntax.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {tags.map(tag => (
            <div
              key={tag.name}
              onClick={() => onTagClick?.(tag.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                background: activeTag === tag.name ? 'var(--primary-color)' : '#eee',
                color: activeTag === tag.name ? '#fff' : 'var(--text-color)',
                transition: 'background 0.15s'
              }}
            >
              <span>{tag.name}</span>
              <span style={{
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {tag.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
