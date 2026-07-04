import React, { useState, useEffect } from 'react'
import { useEditor } from '../../contexts/EditorContext'
import { useFileSystem } from '../../hooks/useFileSystem'

export function WelcomeScreen() {
  const ctx = useEditor()
  const { openFile, openFileByPath } = useFileSystem()
  const [recentFiles, setRecentFiles] = useState<string[]>([])

  useEffect(() => {
    window.api.getRecentFiles().then(setRecentFiles).catch(() => {})
  }, [])

  const shortcuts = [
    { keys: 'Ctrl+N', desc: 'New document' },
    { keys: 'Ctrl+O', desc: 'Open file' },
    { keys: 'Ctrl+S', desc: 'Save' },
    { keys: 'Ctrl+B', desc: 'Bold' },
    { keys: 'Ctrl+I', desc: 'Italic' },
    { keys: 'Ctrl+K', desc: 'Insert link' },
    { keys: 'Ctrl+Enter', desc: 'Execute AI cell' },
    { keys: 'Ctrl+\\', desc: 'Source mode' },
    { keys: 'Ctrl+Shift+F', desc: 'Focus mode' },
    { keys: 'Ctrl+Shift+K', desc: 'Kanban view' }
  ]

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">📝</div>
        <h1 className="welcome-title">My Markdown</h1>
        <p className="welcome-subtitle">A WYSIWYG Markdown editor with AI, knowledge graph, and more</p>

        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={openFile}>
            📂 Open File
          </button>
          <button className="welcome-btn" onClick={() => {
            const defaultDoc = [
              '# Welcome to My Markdown',
              '',
              'Start typing here...',
              '',
              '## Quick Start',
              '',
              '- **Bold** with Ctrl+B',
              '- *Italic* with Ctrl+I',
              '- Create AI cells with :::ai blocks',
              '- Press Ctrl+Enter to execute',
              '',
              '## Features',
              '',
              '- WYSIWYG editing',
              '- AI-powered writing',
              '- Knowledge graph',
              '- Kanban boards',
              '- Drawing canvas',
              '- Image hosting'
            ].join('\n')
            ctx.setContent(defaultDoc)
            ctx.setFileName('Untitled')
            ctx.setIsModified(true)
            window.api.setTitle('My Markdown - Untitled')
          }}>
            ✨ New Document
          </button>
        </div>

        {recentFiles.length > 0 && (
          <div className="welcome-recent">
            <h3>Recent Files</h3>
            {recentFiles.slice(0, 8).map(f => (
              <div
                key={f}
                className="welcome-recent-item"
                onClick={() => openFileByPath(f)}
                title={f}
              >
                <span className="welcome-recent-icon">📄</span>
                <span className="welcome-recent-name">{f.split(/[/\\]/).pop()}</span>
                <span className="welcome-recent-path">{f.split(/[/\\]/).slice(-3, -1).join('/')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="welcome-shortcuts">
          <h3>Keyboard Shortcuts</h3>
          <div className="welcome-shortcuts-grid">
            {shortcuts.map(s => (
              <div key={s.keys} className="welcome-shortcut">
                <kbd>{s.keys}</kbd>
                <span>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
