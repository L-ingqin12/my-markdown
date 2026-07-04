import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

interface Preferences {
  fontSize: number
  fontFamily: string
  tabWidth: number
  wordWrap: boolean
  autoSave: boolean
  autoSaveInterval: number
  showLineNumbers: boolean
  spellCheck: boolean
}

interface EditorContextValue {
  content: string
  setContent: (c: string) => void
  filePath: string | null
  setFilePath: (p: string | null) => void
  fileName: string
  setFileName: (n: string) => void
  isModified: boolean
  setIsModified: (m: boolean) => void
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
  editorRef: React.MutableRefObject<EditorHandle | null>
  preferences: Preferences
  setShowThemeDialog: (v: boolean) => void
  setShowAbout: (v: boolean) => void
  setShowExportResult: (v: boolean) => void
  viewMode: 'editor' | 'kanban' | 'mindmap' | 'graph'
  setViewMode: (mode: string) => void
}

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

const EditorContext = createContext<EditorContextValue>({
  content: '',
  setContent: () => {},
  filePath: null,
  setFilePath: () => {},
  fileName: 'Untitled',
  setFileName: () => {},
  isModified: false,
  setIsModified: () => {},
  sourceMode: false,
  setSourceMode: () => {},
  focusMode: false,
  setFocusMode: () => {},
  typewriterMode: false,
  setTypewriterMode: () => {},
  sidebarVisible: false,
  setSidebarVisible: () => {},
  showSearch: false,
  setShowSearch: () => {},
  editorRef: { current: null },
  preferences: defaultPreferences,
  setShowThemeDialog: () => {},
  setShowAbout: () => {},
  setShowExportResult: () => {},
  viewMode: 'editor',
  setViewMode: () => {}
})

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileName, setFileName] = useState('Untitled')
  const [isModified, setIsModified] = useState(false)
  const [sourceMode, setSourceMode] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [typewriterMode, setTypewriterMode] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [viewMode, setViewMode] = useState<'editor' | 'kanban' | 'mindmap' | 'graph'>('editor')
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const editorRef = useRef<EditorHandle | null>(null)

  // Load preferences on mount
  React.useEffect(() => {
    window.api.getPreferences().then(p => {
      if (p) setPreferences(p as Preferences)
    }).catch(() => {})
  }, [])

  return (
    <EditorContext.Provider value={{
      content, setContent,
      filePath, setFilePath,
      fileName, setFileName,
      isModified, setIsModified,
      sourceMode, setSourceMode,
      focusMode, setFocusMode,
      typewriterMode, setTypewriterMode,
      sidebarVisible, setSidebarVisible,
      showSearch, setShowSearch,
      editorRef, preferences,
      viewMode, setViewMode: (mode: string) => setViewMode(mode as 'editor' | 'kanban' | 'mindmap' | 'graph'),
      setShowThemeDialog: () => {},
      setShowAbout: () => {},
      setShowExportResult: () => {}
    }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  return useContext(EditorContext)
}
