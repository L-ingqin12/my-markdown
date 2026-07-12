import React, { useEffect } from 'react'
import { EditorProvider, useEditor } from './contexts/EditorContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ChatProvider } from './contexts/ChatContext'
import { ClaudeProvider } from './contexts/ClaudeContext'
import { AppLayout } from './components/layout/AppLayout'
import { useFileSystem } from './hooks/useFileSystem'
import { useAutoSave } from './hooks/useAutoSave'
import { useImageUpload } from './hooks/useImageUpload'
import { useMenuActions } from './hooks/useMenuActions'
import { PreferencesDialog } from './components/dialogs/PreferencesDialog'
import { AboutDialog } from './components/dialogs/AboutDialog'
import { UploadConfig } from './components/upload/UploadConfig'

function AppInner() {
  const ctx = useEditor()
  const { openFile, saveFile, saveFileAs } = useFileSystem()
  const { handlePaste, handleDrop, uploadAllLocalImages, uploading, uploadProgress } = useImageUpload()
  const {
    content, setContent,
    filePath, setFilePath,
    fileName, setFileName,
    isModified, setIsModified,
    editorRef,
    viewMode, setViewMode,
    focusMode,
    preferences
  } = ctx

  useAutoSave(content, filePath, isModified, preferences?.autoSaveInterval ?? 2000)

  useMenuActions(ctx, openFile, saveFile, saveFileAs, uploadAllLocalImages)

  // Paste/drop image handlers
  useEffect(() => {
    const preventDrag = (e: DragEvent) => e.preventDefault()
    document.addEventListener('paste', handlePaste as any)
    document.addEventListener('drop', handleDrop as any)
    document.addEventListener('dragover', preventDrag)
    return () => {
      document.removeEventListener('paste', handlePaste as any)
      document.removeEventListener('drop', handleDrop as any)
      document.removeEventListener('dragover', preventDrag)
    }
  }, [handlePaste, handleDrop])

  // Keyboard shortcuts not handled by menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            if (e.shiftKey) {
              e.preventDefault()
              saveFileAs()
            } else {
              e.preventDefault()
              if (filePath) saveFile()
              else saveFileAs()
            }
            break
          case 'o':
            e.preventDefault()
            openFile()
            break
          case 'n':
            e.preventDefault()
            setContent('')
            setFilePath(null)
            setFileName('Untitled')
            setIsModified(false)
            window.api.setTitle('My Markdown - Untitled')
            break
          case 'Enter':
            e.preventDefault()
            editorRef.current?.executeAiBlock()
            break
          case 'Y':
          case 'y':
            if (e.shiftKey) {
              e.preventDefault()
              editorRef.current?.insertFrontMatter()
            }
            break
          case 'K':
          case 'k':
            if (e.shiftKey) {
              e.preventDefault()
              setViewMode(viewMode === 'kanban' ? 'editor' : 'kanban')
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setContent, setFilePath, setFileName, setIsModified, editorRef, setViewMode, saveFile, saveFileAs, openFile])

  return (
    <div className={`app-container ${focusMode ? 'focus-mode' : ''}`}>
      <AppLayout />
      {uploading && (
        <div className="upload-progress">{uploadProgress}</div>
      )}
    </div>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <EditorProvider>
        <ChatProvider>
          <ClaudeProvider>
            <AppInner />
          </ClaudeProvider>
        </ChatProvider>
      </EditorProvider>
    </ThemeProvider>
  )
}
