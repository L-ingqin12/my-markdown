import React, { useMemo } from 'react'

interface Heading {
  level: number
  text: string
  line: number
}

interface OutlineProps {
  content: string
}

export function Outline({ content }: OutlineProps) {
  const headings = useMemo<Heading[]>(() => {
    const lines = content.split('\n')
    const result: Heading[] = []
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        result.push({
          level: match[1].length,
          text: match[2].trim(),
          line: i
        })
      }
    }
    return result
  }, [content])

  if (headings.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#aaa', fontSize: '13px', textAlign: 'center' }}>
        No headings found
      </div>
    )
  }

  const handleClick = (line: number) => {
    const editorEl = document.querySelector('.cm-content')
    if (editorEl) {
      const lines = editorEl.querySelectorAll('.cm-line')
      if (lines[line]) {
        lines[line].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  return (
    <>
      {headings.map((h, i) => (
        <div
          key={i}
          className={`outline-item outline-h${h.level}`}
          onClick={() => handleClick(h.line)}
          title={h.text}
        >
          {h.text}
        </div>
      ))}
    </>
  )
}
