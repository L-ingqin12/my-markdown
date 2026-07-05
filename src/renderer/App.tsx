import React, { useEffect, useCallback } from 'react'
import { EditorProvider, useEditor } from './contexts/EditorContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ChatProvider } from './contexts/ChatContext'
import { ClaudeProvider } from './contexts/ClaudeContext'
import { AppLayout } from './components/layout/AppLayout'
import { useFileSystem } from './hooks/useFileSystem'
import { useAutoSave } from './hooks/useAutoSave'
import { useImageUpload } from './hooks/useImageUpload'
import { PreferencesDialog } from './components/dialogs/PreferencesDialog'
import { AboutDialog } from './components/dialogs/AboutDialog'
import { UploadConfig } from './components/upload/UploadConfig'

function AppInner() {
  const ctx = useEditor()
  const { openFile, saveFile, saveFileAs, openFileByPath } = useFileSystem()
  const { handlePaste, handleDrop, uploadAllLocalImages, uploading, uploadProgress } = useImageUpload()
  const { preferences } = ctx

  useAutoSave(ctx.content, ctx.filePath, ctx.isModified, preferences?.autoSaveInterval ?? 2000)

  // Menu action handler
  useEffect(() => {
    const cleanup = window.api.onMenuAction((action: string) => {
      switch (action) {
        case 'file:new':
          ctx.setContent('')
          ctx.setFilePath(null)
          ctx.setFileName('Untitled')
          ctx.setIsModified(false)
          window.api.setTitle('My Markdown - Untitled')
          break
        case 'file:open': openFile(); break
        case 'file:save':
          if (ctx.filePath) saveFile()
          else saveFileAs()
          break
        case 'file:save-as': saveFileAs(); break
        case 'edit:undo': ctx.editorRef.current?.undo(); break
        case 'edit:redo': ctx.editorRef.current?.redo(); break
        case 'edit:find': ctx.setShowSearch(true); break
        case 'edit:replace': ctx.setShowSearch(true); break
        case 'view:toggle-sidebar': ctx.setSidebarVisible(!ctx.sidebarVisible); break
        case 'view:toggle-source': ctx.setSourceMode(!ctx.sourceMode); break
        case 'view:toggle-focus': ctx.setFocusMode(!ctx.focusMode); break
        case 'view:toggle-typewriter': ctx.setTypewriterMode(!ctx.typewriterMode); break
        case 'export:html': handleExportHtml(); break
        case 'export:pdf': handleExportPdf(); break
        case 'image:upload-all': uploadAllLocalImages(); break
        case 'theme:select': ctx.setShowPreferences(true); break
        case 'help:about': ctx.setShowAbout?.(true); break
        case 'help:devtools':
          // DevTools is toggled via main process menu shortcut (F12)
          break
        // Paragraph formatting
        case 'para:bold': ctx.editorRef.current?.toggleBold(); break
        case 'para:italic': ctx.editorRef.current?.toggleItalic(); break
        case 'para:strikethrough': ctx.editorRef.current?.toggleStrikethrough(); break
        case 'para:code': ctx.editorRef.current?.toggleCode(); break
        case 'para:heading-1': ctx.editorRef.current?.setHeading(1); break
        case 'para:heading-2': ctx.editorRef.current?.setHeading(2); break
        case 'para:heading-3': ctx.editorRef.current?.setHeading(3); break
        case 'para:heading-4': ctx.editorRef.current?.setHeading(4); break
        case 'para:heading-5': ctx.editorRef.current?.setHeading(5); break
        case 'para:heading-6': ctx.editorRef.current?.setHeading(6); break
        case 'para:ul': ctx.editorRef.current?.toggleBulletList(); break
        case 'para:ol': ctx.editorRef.current?.toggleOrderedList(); break
        case 'para:task': ctx.editorRef.current?.toggleTaskList(); break
        case 'para:blockquote': ctx.editorRef.current?.toggleBlockquote(); break
        case 'para:code-block': ctx.editorRef.current?.insertCodeBlock(); break
        case 'para:hr': ctx.editorRef.current?.insertHorizontalRule(); break
        case 'para:link': ctx.editorRef.current?.insertLink(); break
        case 'para:image': ctx.editorRef.current?.insertImage(); break
        case 'format:toc': ctx.editorRef.current?.insertToc(); break
        case 'format:frontmatter': ctx.editorRef.current?.insertFrontMatter(); break
      }
    })

    return cleanup
  }, [ctx, openFile, saveFile, saveFileAs, openFileByPath, uploadAllLocalImages])

  // Paste/drop image handlers
  useEffect(() => {
    document.addEventListener('paste', handlePaste as any)
    document.addEventListener('drop', handleDrop as any)
    document.addEventListener('dragover', (e) => e.preventDefault())
    return () => {
      document.removeEventListener('paste', handlePaste as any)
      document.removeEventListener('drop', handleDrop as any)
      document.removeEventListener('dragover', (e) => e.preventDefault())
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
              if (ctx.filePath) saveFile()
              else saveFileAs()
            }
            break
          case 'o':
            e.preventDefault()
            openFile()
            break
          case 'n':
            e.preventDefault()
            ctx.setContent('')
            ctx.setFilePath(null)
            ctx.setFileName('Untitled')
            ctx.setIsModified(false)
            window.api.setTitle('My Markdown - Untitled')
            break
          case 'Enter':
            e.preventDefault()
            ctx.editorRef.current?.executeAiBlock()
            break
          case 'Y':
          case 'y':
            if (e.shiftKey) {
              e.preventDefault()
              ctx.editorRef.current?.insertFrontMatter()
            }
            break
          case 'K':
          case 'k':
            if (e.shiftKey) {
              e.preventDefault()
              ctx.setViewMode(ctx.viewMode === 'kanban' ? 'editor' : 'kanban')
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [ctx, saveFile, saveFileAs, openFile])

  async function handleExportHtml() {
    try {
      const path = await window.api.exportHtml(ctx.content)
      if (path) {
        ctx.setShowExportResult?.(true)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  async function handleExportPdf() {
    try {
      const path = await window.api.exportPdf(ctx.content)
      if (path) {
        ctx.setShowExportResult?.(true)
      }
    } catch (err) {
      console.error('Export PDF failed:', err)
    }
  }

  return (
    <div className={`app-container ${ctx.focusMode ? 'focus-mode' : ''}`}>
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
