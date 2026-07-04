import React, { useState, useRef, useEffect } from 'react'
import { useEditor } from '../../contexts/EditorContext'

export function SearchPanel() {
  const ctx = useEditor()
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [regex, setRegex] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearch = () => {
    if (!searchText) return
    // Dispatch CM6 search
    const cm = document.querySelector('.cm-editor')
    if (cm) {
      const evt = new KeyboardEvent('keydown', {
        key: 'f', ctrlKey: true, bubbles: true
      })
      cm.dispatchEvent(evt)
    }
  }

  const handleClose = () => {
    ctx.setShowSearch(false)
  }

  return (
    <div className="search-panel">
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Find..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch()
          if (e.key === 'Escape') handleClose()
        }}
      />
      <input
        type="text"
        placeholder="Replace with..."
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleClose()
        }}
      />
      <div className="search-actions">
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} />
          Aa
        </label>
        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input type="checkbox" checked={regex} onChange={e => setRegex(e.target.checked)} />
          .*
        </label>
        <button onClick={handleSearch}>Find</button>
        <button>Replace</button>
        <button>All</button>
        <button onClick={handleClose} style={{ marginLeft: 'auto' }}>&times;</button>
      </div>
    </div>
  )
}
