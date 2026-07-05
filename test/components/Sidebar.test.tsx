/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Sidebar } from '../../src/renderer/components/layout/Sidebar'
import { EditorContext } from '../../src/renderer/contexts/EditorContext'

const mockEditorCtx: any = {
  fileName: 'doc.md', isModified: false, filePath: '/test/doc.md',
  content: '# Hello\n\n## Section 1\n\nSome text\n\n## Section 2',
  cursorPos: { line: 1, col: 1 }, setCursorPos: () => {},
  setContent: () => {}, setFilePath: () => {}, setFileName: () => {}, setIsModified: () => {},
  editorRef: { current: null },
  preferences: { fontSize: 16, fontFamily: 'sans-serif', tabWidth: 4, wordWrap: true, autoSave: true, autoSaveInterval: 2000, showLineNumbers: false, spellCheck: false },
  sourceMode: false, focusMode: false, typewriterMode: false, sidebarVisible: true, showSearch: false,
  viewMode: 'editor', setViewMode: vi.fn(),
  setSourceMode: () => {}, setFocusMode: () => {}, setTypewriterMode: () => {},
  setSidebarVisible: () => {}, setShowSearch: () => {},
  showThemeDialog: false, setShowThemeDialog: () => {},
  showAbout: false, setShowAbout: () => {},
  showPreferences: false, setShowPreferences: () => {},
  showUploadConfig: false, setShowUploadConfig: () => {},
  showExportResult: false, setShowExportResult: () => {}
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure recent files returns empty for FileTree
    ;(window as any).api = {
      ...(window as any).api,
      getRecentFiles: async () => [],
      readFile: async () => null
    }
  })

  function renderSidebar(props: any = {}) {
    return render(
      <EditorContext.Provider value={mockEditorCtx}>
        <Sidebar
          content={mockEditorCtx.content}
          visible={true}
          onUploadConfig={props.onUploadConfig || vi.fn()}
          onPreferences={props.onPreferences || vi.fn()}
        />
      </EditorContext.Provider>
    )
  }

  it('renders all four tabs', () => {
    renderSidebar()
    expect(screen.getByText('Files')).toBeTruthy()
    expect(screen.getByText('Outline')).toBeTruthy()
    expect(screen.getByText('Tags')).toBeTruthy()
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('shows FileTree by default (Files tab active)', async () => {
    renderSidebar()
    expect(screen.getByText('Files')).toBeTruthy()
    // FileTree loads async - wait for it
    const emptyText = await screen.findByText(/No files yet|Loading/, {}, { timeout: 3000 })
    expect(emptyText).toBeTruthy()
  })

  it('switches to Outline tab and shows headings', async () => {
    renderSidebar()
    fireEvent.click(screen.getByText('Outline'))
    // Should show headings from content
    expect(screen.getByText('Hello')).toBeTruthy()
    expect(screen.getByText('Section 1')).toBeTruthy()
    expect(screen.getByText('Section 2')).toBeTruthy()
  })

  it('switches to Settings tab and shows menu items', async () => {
    renderSidebar()
    fireEvent.click(screen.getByText('Settings'))
    expect(screen.getByText(/Image Upload Settings/)).toBeTruthy()
    expect(screen.getByText(/Preferences/)).toBeTruthy()
    expect(screen.getByText(/Kanban Board/)).toBeTruthy()
    expect(screen.getByText(/Mind Map/)).toBeTruthy()
    expect(screen.getByText(/Knowledge Graph/)).toBeTruthy()
  })

  it('calls onUploadConfig when Image Upload clicked in Settings', () => {
    const onUpload = vi.fn()
    renderSidebar({ onUploadConfig: onUpload })
    fireEvent.click(screen.getByText('Settings'))
    fireEvent.click(screen.getByText(/Image Upload Settings/))
    expect(onUpload).toHaveBeenCalledTimes(1)
  })

  it('calls onPreferences when Preferences clicked in Settings', () => {
    const onPrefs = vi.fn()
    renderSidebar({ onPreferences: onPrefs })
    fireEvent.click(screen.getByText('Settings'))
    fireEvent.click(screen.getByText(/Preferences/))
    expect(onPrefs).toHaveBeenCalledTimes(1)
  })

  it('toggles Kanban view from Settings', () => {
    renderSidebar()
    fireEvent.click(screen.getByText('Settings'))
    fireEvent.click(screen.getByText(/Kanban Board/))
    expect(mockEditorCtx.setViewMode).toHaveBeenCalledWith('kanban')
  })

  it('toggles MindMap view from Settings', () => {
    renderSidebar()
    fireEvent.click(screen.getByText('Settings'))
    fireEvent.click(screen.getByText(/Mind Map/))
    expect(mockEditorCtx.setViewMode).toHaveBeenCalledWith('mindmap')
  })
})
