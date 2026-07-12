import React, { useEffect, useRef } from 'react'
import { useEditor } from '../../contexts/EditorContext'

export function SearchPanel() {
  const ctx = useEditor()
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const doSearch = () => {
    // Use CM6's built-in search panel
    const editor = document.querySelector('.cm-editor') as HTMLElement
    if (editor) {
      const evt = new KeyboardEvent('keydown', {
        key: 'f', ctrlKey: true, bubbles: true, cancelable: true
      })
      editor.dispatchEvent(evt)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      doSearch()
    }
    if (e.key === 'Escape') {
      ctx.setShowSearch(false)
    }
  }

  return (
    <div className="search-panel-overlay">
      <div className="search-panel-content">
        <div className="search-panel-row">
          <input
            ref={searchInputRef}
            type="text"
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="search-panel-input"
          />
          <button className="search-close-btn" onClick={() => ctx.setShowSearch(false)}>×</button>
        </div>
      </div>
    </div>
  )
}
