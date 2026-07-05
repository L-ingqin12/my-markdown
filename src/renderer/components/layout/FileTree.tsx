import React, { useState, useEffect, useCallback } from 'react'

interface FileEntry {
  name: string
  path: string
}

interface FileTreeProps {
  onFileClick?: (path: string) => void
  activeFile?: string | null
}

export function FileTree({ onFileClick, activeFile }: FileTreeProps) {
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpenFolder = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.openFolder()
      if (result) {
        setFolderPath(result.folderPath)
        setFiles(result.files)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Load recent files as fallback when no folder is open
  useEffect(() => {
    if (!folderPath) {
      window.api.getRecentFiles().then(paths => {
        setFiles(paths.map(p => ({
          name: p.split(/[/\\]/).pop() || p,
          path: p
        })))
      })
    }
  }, [folderPath])

  const handleRefresh = useCallback(async () => {
    if (!folderPath) return
    setLoading(true)
    try {
      const scanned = await window.api.scanFolder(folderPath)
      setFiles(scanned)
    } finally {
      setLoading(false)
    }
  }, [folderPath])

  // Organize files by directory for tree-like display
  const fileGroups = files.reduce((groups, file) => {
    const dir = file.path.split(/[/\\]/).slice(0, -1).join(' / ') || '/'
    if (!groups[dir]) groups[dir] = []
    groups[dir].push(file)
    return groups
  }, {} as Record<string, FileEntry[]>)

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        {folderPath ? (
          <>
            <div className="file-tree-folder" title={folderPath}>
              📁 {folderPath.split(/[/\\]/).pop() || folderPath}
            </div>
            <div className="file-tree-actions">
              <button onClick={handleRefresh} title="Refresh">↻</button>
              <button onClick={handleOpenFolder} title="Open another folder">📂</button>
            </div>
          </>
        ) : (
          <div className="file-tree-folder" onClick={handleOpenFolder} style={{ cursor: 'pointer' }}>
            📂 Open Folder...
          </div>
        )}
      </div>

      <div className="file-tree-list">
        {loading ? (
          <div className="file-tree-item">Loading...</div>
        ) : files.length === 0 ? (
          <div className="file-tree-item" style={{ color: '#aaa' }}>
            No files yet
          </div>
        ) : (
          Object.entries(fileGroups).map(([dir, entries]) => (
            <div key={dir} className="file-tree-group">
              {Object.keys(fileGroups).length > 1 && (
                <div className="file-tree-dir">{dir}</div>
              )}
              {entries.map(f => (
                <div
                  key={f.path}
                  className={`file-tree-item file ${activeFile === f.path ? 'active' : ''}`}
                  onClick={() => onFileClick?.(f.path)}
                  title={f.path}
                >
                  <span className="file-tree-icon">📄</span>
                  <span className="file-tree-name">{f.name}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
