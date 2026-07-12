import React, { createContext, useContext, useState, useRef, useMemo } from 'react'
import type { Preferences } from '../../shared/types'

export interface EditorHandle {
  focus: () => void
  getContent: () => string
  setContent: (c: string) => void
  insertText: (text: string) => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleStrikethrough: () => void
  toggleCode: () => void
  setHeading: (level: number) => void
  toggleBulletList: () => void
  toggleOrderedList: () => void
  toggleTaskList: () => void
  toggleBlockquote: () => void
  insertCodeBlock: () => void
  insertHorizontalRule: () => void
  insertLink: () => void
  insertImage: () => void
  insertToc: () => void
  insertFrontMatter: () => void
  insertAtCursor: (text: string) => void
  getSelectedText: () => string
  insertAiConversation: (messages: Array<{role: string; content: string}>) => void
  insertAiPromptBlock: () => void
  executeAiBlock: () => Promise<void>
  undo: () => void
  redo: () => void
  find: () => void
  findNext: () => void
  findPrevious: () => void
  replace: () => void
  replaceAll: () => void
}

const defaultPreferences: Preferences = {
  fontSize: 16,
  fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  tabWidth: 4,
  wordWrap: true,
  autoSave: true,
  autoSaveInterval: 2000,
  showLineNumbers: false,
  spellCheck: false
}

// ── EditorDataContext (high-frequency values: change on every keystroke) ──

export interface EditorDataContextValue {
  content: string
  setContent: (c: string) => void
  filePath: string | null
  setFilePath: (p: string | null) => void
  fileName: string
  setFileName: (n: string) => void
  isModified: boolean
  setIsModified: (m: boolean) => void
  cursorPos: { line: number; col: number }
  setCursorPos: (pos: { line: number; col: number }) => void
  editorRef: React.MutableRefObject<EditorHandle | null>
}

export const EditorDataContext = createContext<EditorDataContextValue>({
  content: '',
  setContent: () => {},
  filePath: null,
  setFilePath: () => {},
  fileName: 'Untitled',
  setFileName: () => {},
  isModified: false,
  setIsModified: () => {},
  cursorPos: { line: 1, col: 1 },
  setCursorPos: () => {},
  editorRef: { current: null }
})

export function EditorDataProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileName, setFileName] = useState('Untitled')
  const [isModified, setIsModified] = useState(false)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const editorRef = useRef<EditorHandle | null>(null)

  const value = useMemo(() => ({
    content, setContent,
    filePath, setFilePath,
    fileName, setFileName,
    isModified, setIsModified,
    cursorPos, setCursorPos,
    editorRef
  }), [content, filePath, fileName, isModified, cursorPos])

  return (
    <EditorDataContext.Provider value={value}>
      {children}
    </EditorDataContext.Provider>
  )
}

export function useEditorData() {
  return useContext(EditorDataContext)
}

// ── EditorUIContext (low-frequency UI state) ──

export interface EditorUIContextValue {
  sourceMode: boolean
  setSourceMode: (m: boolean) => void
  focusMode: boolean
  setFocusMode: (m: boolean) => void
  typewriterMode: boolean
  setTypewriterMode: (m: boolean) => void
  sidebarVisible: boolean
  setSidebarVisible: (v: boolean) => void
  showSearch: boolean
  setShowSearch: (s: boolean) => void
  viewMode: 'editor' | 'kanban' | 'mindmap' | 'graph'
  setViewMode: (mode: 'editor' | 'kanban' | 'mindmap' | 'graph') => void
  showThemeDialog: boolean
  setShowThemeDialog: (v: boolean) => void
  showAbout: boolean
  setShowAbout: (v: boolean) => void
  showExportResult: boolean
  setShowExportResult: (v: boolean) => void
  showPreferences: boolean
  setShowPreferences: (v: boolean) => void
  showUploadConfig: boolean
  setShowUploadConfig: (v: boolean) => void
  preferences: Preferences
  setPreferences: (p: Preferences) => void
}

export const EditorUIContext = createContext<EditorUIContextValue>({
  sourceMode: false,
  setSourceMode: () => {},
  focusMode: false,
  setFocusMode: () => {},
  typewriterMode: false,
  setTypewriterMode: () => {},
  sidebarVisible: true,
  setSidebarVisible: () => {},
  showSearch: false,
  setShowSearch: () => {},
  viewMode: 'editor',
  setViewMode: () => {},
  showThemeDialog: false,
  setShowThemeDialog: () => {},
  showAbout: false,
  setShowAbout: () => {},
  showExportResult: false,
  setShowExportResult: () => {},
  showPreferences: false,
  setShowPreferences: () => {},
  showUploadConfig: false,
  setShowUploadConfig: () => {},
  preferences: defaultPreferences,
  setPreferences: () => {}
})

export function EditorUIContextProvider({ children }: { children: React.ReactNode }) {
  const [sourceMode, setSourceMode] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [typewriterMode, setTypewriterMode] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [viewMode, setViewMode] = useState<'editor' | 'kanban' | 'mindmap' | 'graph'>('editor')
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showExportResult, setShowExportResult] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showUploadConfig, setShowUploadConfig] = useState(false)

  React.useEffect(() => {
    window.api.getPreferences().then(p => {
      if (p) setPreferences(p as Preferences)
    }).catch(() => {})
  }, [])

  const value = useMemo(() => ({
    sourceMode, setSourceMode,
    focusMode, setFocusMode,
    typewriterMode, setTypewriterMode,
    sidebarVisible, setSidebarVisible,
    showSearch, setShowSearch,
    viewMode, setViewMode,
    showThemeDialog, setShowThemeDialog,
    showAbout, setShowAbout,
    showExportResult, setShowExportResult,
    showPreferences, setShowPreferences,
    showUploadConfig, setShowUploadConfig,
    preferences, setPreferences
  }), [
    sourceMode, focusMode, typewriterMode,
    sidebarVisible, showSearch, viewMode,
    showThemeDialog, showAbout, showExportResult,
    showPreferences, showUploadConfig, preferences
  ])

  return (
    <EditorUIContext.Provider value={value}>
      {children}
    </EditorUIContext.Provider>
  )
}

export function useEditorUI() {
  return useContext(EditorUIContext)
}

// ── Combined provider ──

export function EditorProvider({ children }: { children: React.ReactNode }) {
  return (
    <EditorDataProvider>
      <EditorUIContextProvider>
        {children}
      </EditorUIContextProvider>
    </EditorDataProvider>
  )
}

// ── Convenience hook (returns everything from both contexts) ──

export type EditorContextValue = EditorDataContextValue & EditorUIContextValue

export function useEditor(): EditorContextValue {
  return { ...useEditorData(), ...useEditorUI() }
}
