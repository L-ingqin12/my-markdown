import React from 'react'
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

  const wordCount = ctx.content.trim() ? ctx.content.trim().split(/\s+/).length : 0
  const modified = ctx.isModified ? ' ●' : ''

  return (
    <div className="app-statusbar">
      <div className="status-left">
        <span className="status-item">{ctx.fileName}{modified}</span>
        <span className="status-item">Ln {ctx.cursorPos.line}, Col {ctx.cursorPos.col}</span>
        <span className="status-item">{wordCount} words</span>
      </div>
      <div className="status-right">
        <select
          className="status-item theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          title="Select theme (also Ctrl+Shift+T)"
          style={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'var(--bg-color)',
            fontSize: '12px',
            color: 'var(--text-color)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '1px 4px',
            minWidth: '120px'
          }}
        >
          {themeList.map(t => (
            <option key={t.name} value={t.name}>{t.displayName}</option>
          ))}
        </select>
        <span className="status-item" onClick={onUploadConfig} title="Image Upload">&#x1F5BC;</span>
        <span className="status-item" onClick={onPreferences} title="Preferences">&#x2699;</span>
        <span className="status-item" onClick={onAbout} title="About">?</span>
      </div>
    </div>
  )
}
