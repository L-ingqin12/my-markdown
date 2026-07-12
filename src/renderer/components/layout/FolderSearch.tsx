import React, { useState, useCallback, useEffect } from 'react'

interface SearchResult {
  filePath: string
  fileName: string
  line: number
  content: string
}

interface FolderSearchProps {
  onFileOpen?: (path: string) => void
}

export function FolderSearch({ onFileOpen }: FolderSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [files, setFiles] = useState<Array<{ path: string; name: string }>>([])

  useEffect(() => {
    window.api.getRecentFiles().then(paths => {
      setFiles(paths.map(p => ({ name: p.split(/[/\\]/).pop() || p, path: p })))
    })
  }, [])

  const handleSearch = useCallback(async () => {
    if (!query.trim() || files.length === 0) return
    setSearching(true)
    setResults([])

    const found: SearchResult[] = []
    for (const file of files.slice(0, 50)) { // limit to 50 files
      try {
        const result = await window.api.readFile(file.path)
        if (result) {
          const lines = result.content.split('\n')
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              found.push({
                filePath: file.path,
                fileName: file.name,
                line: i + 1,
                content: line.trim().slice(0, 120)
              })
            }
          })
        }
      } catch { /* skip unreadable files */ }
    }

    setResults(found)
    setSearching(false)
  }, [query, files])

  return (
    <div className="folder-search">
      <div className="folder-search-input">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search in files..."
          className="search-panel-input"
        />
        <button onClick={handleSearch} className="search-action-btn" disabled={searching}>
          {searching ? '...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="folder-search-results">
          <div className="folder-search-count">{results.length} matches</div>
          {results.map((r, i) => (
            <div
              key={i}
              className="folder-search-item"
              onClick={() => {
                window.api.readFile(r.filePath).then(res => {
                  if (res) {
                    window.api.setTitle(`My Markdown - ${r.fileName}`)
                    window.api.addRecentFile(r.filePath)
                    onFileOpen?.(r.filePath)
                  }
                })
              }}
            >
              <div className="folder-search-item-name">{r.fileName}:{r.line}</div>
              <div className="folder-search-item-preview">{r.content}</div>
            </div>
          ))}
        </div>
      )}

      {query && !searching && results.length === 0 && (
        <div className="folder-search-empty">No results found</div>
      )}
    </div>
  )
}
