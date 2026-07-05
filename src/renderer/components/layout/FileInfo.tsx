import React from 'react'
import { useEditor } from '../../contexts/EditorContext'

export function FileInfo() {
  const ctx = useEditor()

  const wordCount = ctx.content.trim() ? ctx.content.trim().split(/\s+/).length : 0
  const charCount = ctx.content.length
  const lineCount = ctx.content ? ctx.content.split('\n').length : 1
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="file-info-panel">
      <div className="file-info-section">
        <div className="file-info-label">File</div>
        <div className="file-info-value file-info-filename" title={ctx.filePath || ''}>
          {ctx.fileName || 'Untitled'}
        </div>
        {ctx.filePath && (
          <div className="file-info-path" title={ctx.filePath}>
            {ctx.filePath.split(/[/\\]/).slice(-3).join(' / ')}
          </div>
        )}
      </div>

      <div className="file-info-section">
        <div className="file-info-label">Content</div>
        <div className="file-info-stats">
          <div className="file-info-stat">
            <span className="file-info-stat-value">{readMinutes}</span>
            <span className="file-info-stat-label">min read</span>
          </div>
          <div className="file-info-stat">
            <span className="file-info-stat-value">{wordCount}</span>
            <span className="file-info-stat-label">words</span>
          </div>
          <div className="file-info-stat">
            <span className="file-info-stat-value">{charCount}</span>
            <span className="file-info-stat-label">chars</span>
          </div>
          <div className="file-info-stat">
            <span className="file-info-stat-value">{lineCount}</span>
            <span className="file-info-stat-label">lines</span>
          </div>
        </div>
      </div>

      {ctx.isModified && (
        <div className="file-info-unsaved">
          This document has unsaved changes
        </div>
      )}
    </div>
  )
}
