/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { EditorToolbar } from '../../src/renderer/components/editor/EditorToolbar'
import { EditorContext } from '../../src/renderer/contexts/EditorContext'

const createEditorCtx = (overrides: any = {}) => ({
  fileName: 'doc.md', isModified: false, filePath: '/test/doc.md',
  content: '# Hello',
  cursorPos: { line: 1, col: 1 }, setCursorPos: () => {},
  setContent: vi.fn(), setFilePath: vi.fn(), setFileName: vi.fn(), setIsModified: vi.fn(),
  editorRef: {
    current: {
      focus: vi.fn(), getContent: () => '# Hello', setContent: vi.fn(),
      insertText: vi.fn(), insertAtCursor: vi.fn(), getSelectedText: () => '',
      undo: vi.fn(), redo: vi.fn(),
      toggleBold: vi.fn(), toggleItalic: vi.fn(), toggleStrikethrough: vi.fn(),
      toggleCode: vi.fn(), setHeading: vi.fn(),
      toggleBulletList: vi.fn(), toggleOrderedList: vi.fn(), toggleTaskList: vi.fn(),
      toggleBlockquote: vi.fn(), insertCodeBlock: vi.fn(), insertHorizontalRule: vi.fn(),
      insertLink: vi.fn(), insertImage: vi.fn(), insertToc: vi.fn(),
      insertFrontMatter: vi.fn(), insertAiPromptBlock: vi.fn(),
      executeAiBlock: vi.fn(), insertAiConversation: vi.fn(),
      find: vi.fn(), findNext: vi.fn(), findPrevious: vi.fn(), replace: vi.fn(), replaceAll: vi.fn()
    }
  },
  preferences: { fontSize: 16, fontFamily: 'sans-serif', tabWidth: 4, wordWrap: true, autoSave: true, autoSaveInterval: 2000, showLineNumbers: false, spellCheck: false },
  sourceMode: false, focusMode: false, typewriterMode: false, sidebarVisible: true, showSearch: false,
  viewMode: 'editor' as const, setViewMode: vi.fn(),
  setSourceMode: vi.fn(), setFocusMode: vi.fn(), setTypewriterMode: vi.fn(),
  setSidebarVisible: vi.fn(), setShowSearch: () => {},
  showThemeDialog: false, setShowThemeDialog: () => {},
  showAbout: false, setShowAbout: () => {},
  showPreferences: false, setShowPreferences: () => {},
  showUploadConfig: false, setShowUploadConfig: () => {},
  showExportResult: false, setShowExportResult: () => {},
  ...overrides
})

describe('EditorToolbar', () => {
  beforeEach(() => { vi.clearAllMocks() })

  function renderToolbar(ctx: any = createEditorCtx()) {
    return render(
      <EditorContext.Provider value={ctx}>
        <EditorToolbar />
      </EditorContext.Provider>
    )
  }

  it('renders formatting buttons', () => {
    renderToolbar()
    expect(screen.getByText('B')).toBeTruthy()  // Bold
    expect(screen.getByText('I')).toBeTruthy()  // Italic
    expect(screen.getByText('Link')).toBeTruthy()
    expect(screen.getByText('Image')).toBeTruthy()
    expect(screen.getByText('Kanban')).toBeTruthy()
  })

  it('New button clears document state', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('New'))
    expect(ctx.setContent).toHaveBeenCalledWith('')
    expect(ctx.setFilePath).toHaveBeenCalledWith(null)
    expect(ctx.setFileName).toHaveBeenCalledWith('Untitled')
  })

  it('toggleBold button calls editor toggleBold', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('B'))
    expect(ctx.editorRef.current.toggleBold).toHaveBeenCalledTimes(1)
  })

  it('toggleItalic button calls editor toggleItalic', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('I'))
    expect(ctx.editorRef.current.toggleItalic).toHaveBeenCalledTimes(1)
  })

  it('Source button toggles source mode', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('Source'))
    expect(ctx.setSourceMode).toHaveBeenCalledWith(true)
  })

  it('Focus button toggles focus mode', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('Focus'))
    expect(ctx.setFocusMode).toHaveBeenCalledWith(true)
  })

  it('Kanban button with editor viewMode toggles to kanban', () => {
    const ctx = createEditorCtx({ viewMode: 'editor' })
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('Kanban'))
    expect(ctx.setViewMode).toHaveBeenCalledWith('kanban')
  })

  it('Kanban button with kanban viewMode toggles back to editor', () => {
    const ctx = createEditorCtx({ viewMode: 'kanban' })
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('Kanban'))
    expect(ctx.setViewMode).toHaveBeenCalledWith('editor')
  })

  it('MindMap button toggles mindmap view', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('MindMap'))
    expect(ctx.setViewMode).toHaveBeenCalledWith('mindmap')
  })

  it('Graph button toggles graph view', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('Graph'))
    expect(ctx.setViewMode).toHaveBeenCalledWith('graph')
  })

  it('+ AI Cell button inserts AI prompt block', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('+ AI Cell'))
    expect(ctx.editorRef.current.insertAiPromptBlock).toHaveBeenCalledTimes(1)
  })

  it('FM button inserts frontmatter', () => {
    const ctx = createEditorCtx()
    renderToolbar(ctx)
    fireEvent.click(screen.getByText('FM'))
    expect(ctx.editorRef.current.insertFrontMatter).toHaveBeenCalledTimes(1)
  })
})
