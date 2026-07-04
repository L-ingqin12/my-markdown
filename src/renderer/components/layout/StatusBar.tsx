import React, { useState, useEffect } from 'react'
import { useEditor } from '../../contexts/EditorContext'
import { useTheme } from '../../contexts/ThemeContext'

interface StatusBarProps {
  onUploadConfig: () => void
  onPreferences: () => void
  onAbout: () => void
}

export function StatusBar({ onUploadConfig, onPreferences, onAbout }: StatusBarProps) {
  const ctx = useEditor()
  const { theme, themeList, setTheme } = useTheme()
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [wordCount, setWordCount] = useState(0)

  // Track cursor position
  useEffect(() => {
    const checkCursor = () => {
      const content = ctx.content
      setWordCount(content.trim() ? content.trim().split(/\s+/).length : 0)

      // Try to get cursor from CM6
      const cmContent = document.querySelector('.cm-content')
      if (cmContent) {
        const activeLine = cmContent.querySelector('.cm-activeLine')
        if (activeLine) {
          const lines = cmContent.querySelectorAll('.cm-line')
          const idx = Array.from(lines).indexOf(activeLine)
          if (idx >= 0) setCursorPos(p => ({ ...p, line: idx + 1 }))
        }
      }
    }

    const timer = setInterval(checkCursor, 500)
    return () => clearInterval(timer)
  }, [ctx.content])

  const modified = ctx.isModified ? ' ●' : ''

  return (
    <div className="app-statusbar">
      <div className="status-left">
        <span className="status-item">{ctx.fileName}{modified}</span>
        <span className="status-item">Ln {cursorPos.line}, Col {cursorPos.col}</span>
        <span className="status-item">{wordCount} words</span>
      </div>
      <div className="status-right">
        <select
          className="status-item"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            border: 'none', background: 'transparent',
            fontSize: '12px', color: '#888', cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          {themeList.map(t => (
            <option key={t.name} value={t.name}>{t.displayName}</option>
          ))}
        </select>
        <span className="status-item" onClick={onUploadConfig} title="Image Upload Settings">
          &#x1F5BC;
        </span>
        <span className="status-item" onClick={onPreferences} title="Preferences">
          &#x2699;
        </span>
        <span className="status-item" onClick={onAbout} title="About">
          ?
        </span>
      </div>
    </div>
  )
}
