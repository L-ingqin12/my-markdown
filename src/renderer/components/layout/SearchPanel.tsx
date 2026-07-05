import React, { useState, useEffect, useRef } from 'react'
import { useEditor } from '../../contexts/EditorContext'

export function SearchPanel() {
  const ctx = useEditor()
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [showReplace, setShowReplace] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const getSearchQuery = () => {
    if (!searchText) return null
    let pattern = searchText
    if (!useRegex) {
      pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`
    }
    try {
      return new RegExp(pattern, caseSensitive ? 'g' : 'gi')
    } catch {
      return null
    }
  }

  const doSearch = () => {
    const query = getSearchQuery()
    if (!query) return

    const content = ctx.editorRef.current?.getContent() || ''
    const matches = content.match(query)
    setMatchCount(matches ? matches.length : 0)

    // Use CM6's built-in search panel via keyboard shortcut
    const editor = document.querySelector('.cm-editor') as HTMLElement
    if (editor) {
      // Open CM6 native search
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
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setMatchCount(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="search-panel-input"
          />
          <span
            className={`search-option-btn ${useRegex ? 'active' : ''}`}
            onClick={() => setUseRegex(!useRegex)}
            title="Regular Expression"
          >.*</span>
          <span
            className={`search-option-btn ${caseSensitive ? 'active' : ''}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Case Sensitive"
          >Aa</span>
          <span
            className={`search-option-btn ${wholeWord ? 'active' : ''}`}
            onClick={() => setWholeWord(!wholeWord)}
            title="Whole Word"
          >ab</span>
          <span className="search-match-info">
            {matchCount > 0 ? `${currentMatch || '-'}/${matchCount}` : searchText ? '0' : ''}
          </span>
          <button className="search-close-btn" onClick={() => ctx.setShowSearch(false)}>×</button>
        </div>

        <div className="search-panel-row">
          <input
            type="text"
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace with..."
            className="search-panel-input"
          />
          <button className="search-action-btn" onClick={doSearch}>Find</button>
          <button className="search-action-btn">Replace</button>
          <button className="search-action-btn">All</button>
        </div>
      </div>
    </div>
  )
}
