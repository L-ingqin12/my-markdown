import React, { useMemo, useCallback } from 'react'

interface Heading {
  level: number
  text: string
  line: number
}

interface OutlineProps {
  content: string
  onHeadingClick?: (line: number) => void
}

export function Outline({ content, onHeadingClick }: OutlineProps) {
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

  const handleClick = useCallback((line: number) => {
    // Try to scroll via the CodeMirror editor
    const scroller = document.querySelector('.cm-scroller') as HTMLElement | null
    if (scroller) {
      // Calculate approximate position: each line ~28px height with 1.8 line-height at 16px
      const lineHeight = 16 * 1.8  // ~28.8px
      const paddingTop = 32 // 2em padding
      const targetY = paddingTop + line * lineHeight
      scroller.scrollTo({
        top: targetY - 100, // offset to show some context above
        behavior: 'smooth'
      })
    }
    onHeadingClick?.(line)
  }, [onHeadingClick])

  if (headings.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#aaa', fontSize: '13px', textAlign: 'center' }}>
        No headings found
      </div>
    )
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
