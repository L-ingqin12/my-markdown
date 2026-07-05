/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { StatusBar } from '../../src/renderer/components/layout/StatusBar'
import { EditorContext } from '../../src/renderer/contexts/EditorContext'
import { ThemeContext } from '../../src/renderer/contexts/ThemeContext'

const mockEditorCtx: any = {
  fileName: 'test.md',
  isModified: true,
  cursorPos: { line: 5, col: 12 },
  content: 'hello world\n\nthis is a test document',
  setContent: () => {},
  setFilePath: () => {},
  setFileName: () => {},
  setIsModified: () => {},
  editorRef: { current: null },
  preferences: { fontSize: 16, fontFamily: 'sans-serif', tabWidth: 4, wordWrap: true, autoSave: true, autoSaveInterval: 2000, showLineNumbers: false, spellCheck: false },
  sourceMode: false, focusMode: false, typewriterMode: false,
  sidebarVisible: true, showSearch: false, viewMode: 'editor',
  filePath: null, isModified: true,
  setSourceMode: () => {}, setFocusMode: () => {}, setTypewriterMode: () => {},
  setSidebarVisible: () => {}, setShowSearch: () => {}, setViewMode: () => {},
  showThemeDialog: false, setShowThemeDialog: () => {},
  showAbout: false, setShowAbout: () => {},
  showPreferences: false, setShowPreferences: () => {},
  showUploadConfig: false, setShowUploadConfig: () => {},
  showExportResult: false, setShowExportResult: () => {},
  cursorPos: { line: 5, col: 12 }, setCursorPos: () => {}
}

const mockThemeCtx: any = {
  theme: 'github',
  themeCss: '',
  themeList: [
    { name: 'github', displayName: 'Github', isBuiltin: true },
    { name: 'night', displayName: 'Night', isBuiltin: true }
  ],
  setTheme: vi.fn(),
  refreshThemeList: vi.fn()
}

function renderStatusBar(props: any = {}) {
  return render(
    <EditorContext.Provider value={mockEditorCtx}>
      <ThemeContext.Provider value={mockThemeCtx}>
        <StatusBar
          onUploadConfig={props.onUploadConfig || vi.fn()}
          onPreferences={props.onPreferences || vi.fn()}
          onAbout={props.onAbout || vi.fn()}
        />
      </ThemeContext.Provider>
    </EditorContext.Provider>
  )
}

describe('StatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders file name with modified indicator', () => {
    renderStatusBar()
    expect(screen.getByText(/test\.md/)).toBeTruthy()
    expect(screen.getByText(/●/)).toBeTruthy()
  })

  it('displays cursor position from context', () => {
    renderStatusBar()
    expect(screen.getByText(/Ln 5, Col 12/)).toBeTruthy()
  })

  it('displays word count', () => {
    renderStatusBar()
    // "hello world\n\nthis is a test document" = 7 words when trimmed
    expect(screen.getByText(/7 words/)).toBeTruthy()
  })

  it('renders theme selector with options', () => {
    renderStatusBar()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select).toBeTruthy()
    expect(select.value).toBe('github')
    expect(select.options.length).toBe(2)
  })

  it('calls onUploadConfig when image icon clicked', () => {
    const onUpload = vi.fn()
    renderStatusBar({ onUploadConfig: onUpload })
    const icon = screen.getByTitle('Image Upload')
    fireEvent.click(icon)
    expect(onUpload).toHaveBeenCalledTimes(1)
  })

  it('calls onPreferences when gear icon clicked', () => {
    const onPrefs = vi.fn()
    renderStatusBar({ onPreferences: onPrefs })
    const icon = screen.getByTitle('Preferences')
    fireEvent.click(icon)
    expect(onPrefs).toHaveBeenCalledTimes(1)
  })

  it('calls onAbout when ? icon clicked', () => {
    const onAbout = vi.fn()
    renderStatusBar({ onAbout })
    const icon = screen.getByTitle('About')
    fireEvent.click(icon)
    expect(onAbout).toHaveBeenCalledTimes(1)
  })

  it('shows empty file name when no file open', () => {
    const noFileCtx = { ...mockEditorCtx, fileName: 'Untitled', isModified: false }
    render(
      <EditorContext.Provider value={noFileCtx}>
        <ThemeContext.Provider value={mockThemeCtx}>
          <StatusBar onUploadConfig={vi.fn()} onPreferences={vi.fn()} onAbout={vi.fn()} />
        </ThemeContext.Provider>
      </EditorContext.Provider>
    )
    expect(screen.getByText('Untitled')).toBeTruthy()
  })

  it('shows 0 words for empty content', () => {
    const emptyCtx = { ...mockEditorCtx, content: '', isModified: false, fileName: 'empty.md' }
    render(
      <EditorContext.Provider value={emptyCtx}>
        <ThemeContext.Provider value={mockThemeCtx}>
          <StatusBar onUploadConfig={vi.fn()} onPreferences={vi.fn()} onAbout={vi.fn()} />
        </ThemeContext.Provider>
      </EditorContext.Provider>
    )
    expect(screen.getByText(/0 words/)).toBeTruthy()
  })
})
