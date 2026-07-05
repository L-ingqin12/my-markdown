import React from 'react'
import { useEditor } from '../../contexts/EditorContext'
import { useTheme } from '../../contexts/ThemeContext'

interface StatusBarProps {
  onUploadConfig: () => void
  onPreferences: () => void
  onAbout: () => void
  onThemeDialog: () => void
}

export function StatusBar({ onUploadConfig, onPreferences, onAbout, onThemeDialog }: StatusBarProps) {
  const ctx = useEditor()
  const { theme, themeList } = useTheme()

  const wordCount = ctx.content.trim() ? ctx.content.trim().split(/\s+/).length : 0
  const modified = ctx.isModified ? ' ●' : ''
  const themeDisplay = themeList.find(t => t.name === theme)?.displayName || theme

  return (
    <div className="app-statusbar">
      <div className="status-left">
        <span className="status-item">{ctx.fileName}{modified}</span>
        <span className="status-item">Ln {ctx.cursorPos.line}, Col {ctx.cursorPos.col}</span>
        <span className="status-item">{wordCount} words</span>
      </div>
      <div className="status-right">
        <span className="status-item theme-btn" onClick={onThemeDialog} title="Change theme">
          Theme: {themeDisplay} ({themeList.length})
        </span>
        <span className="status-item" onClick={onUploadConfig} title="Image Upload">&#x1F5BC;</span>
        <span className="status-item" onClick={onPreferences} title="Preferences">&#x2699;</span>
        <span className="status-item" onClick={onAbout} title="About">?</span>
      </div>
    </div>
  )
}
