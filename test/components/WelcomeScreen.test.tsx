/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { WelcomeScreen } from '../../src/renderer/components/layout/WelcomeScreen'
import { EditorContext } from '../../src/renderer/contexts/EditorContext'

const mockEditorCtx: any = {
  fileName: 'Untitled', isModified: false, filePath: null,
  content: '', cursorPos: { line: 1, col: 1 }, setCursorPos: () => {},
  setContent: vi.fn(), setFilePath: vi.fn(), setFileName: vi.fn(), setIsModified: vi.fn(),
  editorRef: { current: null },
  preferences: { fontSize: 16, fontFamily: 'sans-serif', tabWidth: 4, wordWrap: true, autoSave: true, autoSaveInterval: 2000, showLineNumbers: false, spellCheck: false },
  sourceMode: false, focusMode: false, typewriterMode: false, sidebarVisible: true, showSearch: false,
  viewMode: 'editor', setViewMode: () => {},
  setSourceMode: () => {}, setFocusMode: () => {}, setTypewriterMode: () => {},
  setSidebarVisible: () => {}, setShowSearch: () => {},
  showThemeDialog: false, setShowThemeDialog: () => {},
  showAbout: false, setShowAbout: () => {},
  showPreferences: false, setShowPreferences: () => {},
  showUploadConfig: false, setShowUploadConfig: () => {},
  showExportResult: false, setShowExportResult: () => {}
}

describe('WelcomeScreen', () => {
  beforeEach(() => { vi.clearAllMocks() })

  function renderWelcome() {
    return render(
      <EditorContext.Provider value={mockEditorCtx}>
        <WelcomeScreen />
      </EditorContext.Provider>
    )
  }

  it('renders the app title', () => {
    renderWelcome()
    expect(screen.getByText('My Markdown')).toBeTruthy()
  })

  it('renders app subtitle', () => {
    renderWelcome()
    expect(screen.getByText(/WYSIWYG Markdown editor/)).toBeTruthy()
  })

  it('has an Open File button', () => {
    renderWelcome()
    expect(screen.getByText(/Open File/)).toBeTruthy()
  })

  it('has a New Document button', () => {
    renderWelcome()
    expect(screen.getByText(/New Document/)).toBeTruthy()
  })

  it('New Document button populates editor with default content', () => {
    renderWelcome()
    fireEvent.click(screen.getByText(/New Document/))
    expect(mockEditorCtx.setContent).toHaveBeenCalled()
    expect(mockEditorCtx.setFileName).toHaveBeenCalledWith('Untitled')
    expect(mockEditorCtx.setIsModified).toHaveBeenCalledWith(true)
  })

  it('shows keyboard shortcuts section', () => {
    renderWelcome()
    expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy()
    expect(screen.getByText('Ctrl+N')).toBeTruthy()
    expect(screen.getByText('Ctrl+S')).toBeTruthy()
    expect(screen.getByText('Ctrl+B')).toBeTruthy()
    expect(screen.getByText('Ctrl+Enter')).toBeTruthy()
  })
})
