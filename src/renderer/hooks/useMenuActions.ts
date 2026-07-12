import { useEffect, useCallback, useRef } from 'react'
import type { EditorContextValue } from '../contexts/EditorContext'

export function useMenuActions(
  ctx: EditorContextValue,
  openFile: () => Promise<any>,
  saveFile: () => Promise<any>,
  saveFileAs: () => Promise<any>,
  uploadAllLocalImages: () => Promise<any>
) {
  // Use refs for values read in effect callbacks to avoid stale closures
  const sidebarVisibleRef = useRef(ctx.sidebarVisible)
  sidebarVisibleRef.current = ctx.sidebarVisible
  const sourceModeRef = useRef(ctx.sourceMode)
  sourceModeRef.current = ctx.sourceMode
  const focusModeRef = useRef(ctx.focusMode)
  focusModeRef.current = ctx.focusMode
  const typewriterModeRef = useRef(ctx.typewriterMode)
  typewriterModeRef.current = ctx.typewriterMode
  const filePathRef = useRef(ctx.filePath)
  filePathRef.current = ctx.filePath
  const contentRef = useRef(ctx.content)
  contentRef.current = ctx.content

  // Export handlers
  const handleExportHtml = useCallback(async () => {
    try {
      const path = await window.api.exportHtml(contentRef.current)
      if (path) ctx.setShowExportResult(true)
    } catch (err) { console.error('Export failed:', err) }
  }, [ctx.setShowExportResult])

  const handleExportPdf = useCallback(async () => {
    try {
      const path = await window.api.exportPdf(contentRef.current)
      if (path) ctx.setShowExportResult(true)
    } catch (err) { console.error('Export PDF failed:', err) }
  }, [ctx.setShowExportResult])

  const handleExportFeishu = useCallback(async () => {
    try {
      const path = await window.api.exportFeishu(contentRef.current)
      if (path) ctx.setShowExportResult(true)
    } catch (err) { console.error('Export Feishu failed:', err) }
  }, [ctx.setShowExportResult])

  const handleExportDoc = useCallback(async () => {
    try {
      const path = await window.api.exportDoc(contentRef.current)
      if (path) ctx.setShowExportResult(true)
    } catch (err) { console.error('Export DOC failed:', err) }
  }, [ctx.setShowExportResult])

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
        case 'file:open-folder': ctx.setSidebarVisible(true); break
        case 'file:save':
          if (filePathRef.current) saveFile()
          else saveFileAs()
          break
        case 'file:save-as': saveFileAs(); break
        case 'edit:undo': ctx.editorRef.current?.undo(); break
        case 'edit:redo': ctx.editorRef.current?.redo(); break
        case 'edit:find': ctx.setShowSearch(true); break
        case 'edit:replace': ctx.setShowSearch(true); break
        case 'view:toggle-sidebar': ctx.setSidebarVisible(!sidebarVisibleRef.current); break
        case 'view:toggle-source': ctx.setSourceMode(!sourceModeRef.current); break
        case 'view:toggle-focus': ctx.setFocusMode(!focusModeRef.current); break
        case 'view:toggle-typewriter': ctx.setTypewriterMode(!typewriterModeRef.current); break
        case 'export:html': handleExportHtml(); break
        case 'export:pdf': handleExportPdf(); break
        case 'export:feishu': handleExportFeishu(); break
        case 'export:doc': handleExportDoc(); break
        case 'image:upload-all': uploadAllLocalImages(); break
        case 'theme:select': ctx.setShowThemeDialog(true); break
        case 'help:about': ctx.setShowAbout?.(true); break
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
  }, [
    ctx.setContent, ctx.setFilePath, ctx.setFileName, ctx.setIsModified,
    ctx.setSidebarVisible, ctx.setSourceMode, ctx.setFocusMode,
    ctx.setTypewriterMode, ctx.setShowSearch, ctx.setShowThemeDialog, ctx.setShowAbout,
    ctx.editorRef,
    openFile, saveFile, saveFileAs, uploadAllLocalImages,
    handleExportHtml, handleExportPdf, handleExportFeishu, handleExportDoc
  ])
}
