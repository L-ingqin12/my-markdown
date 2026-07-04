import React, { useState } from 'react'
import Editor from '../editor/Editor'
import { EditorToolbar } from '../editor/EditorToolbar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { SearchPanel } from './SearchPanel'
import { useEditor } from '../../contexts/EditorContext'
import { KanbanView } from '../kanban/KanbanView'
import { MindMapView } from '../graph/MindMapView'
import { KnowledgeGraph } from '../graph/KnowledgeGraph'
import { PreferencesDialog } from '../dialogs/PreferencesDialog'
import { AboutDialog } from '../dialogs/AboutDialog'
import { UploadConfig } from '../upload/UploadConfig'
import { ChatPanel } from '../chat/ChatPanel'

export function AppLayout() {
  const ctx = useEditor()
  const [showPrefs, setShowPrefs] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showUploadConfig, setShowUploadConfig] = useState(false)

  // Expose dialog toggles to ctx
  ctx.setShowThemeDialog = (v: boolean) => setShowPrefs(true)
  ctx.setShowAbout = (v: boolean) => setShowAbout(v)
  ctx.setShowExportResult = (v: boolean) => { /* handled by status bar */ }

  return (
    <>
      <EditorToolbar />
      <div className="app-body">
        <Sidebar
          content={ctx.content}
          visible={ctx.sidebarVisible}
          onUploadConfig={() => setShowUploadConfig(true)}
          onPreferences={() => setShowPrefs(true)}
        />
        <div className="app-editor-area">
          {ctx.viewMode === 'kanban' ? (
            <KanbanView />
          ) : ctx.viewMode === 'mindmap' ? (
            <MindMapView content={ctx.content} />
          ) : ctx.viewMode === 'graph' ? (
            <KnowledgeGraph
              documents={[{ path: ctx.filePath || 'current.md', content: ctx.content }]}
              currentPath={ctx.filePath || undefined}
              onNodeClick={() => {}}
            />
          ) : (
            <Editor
              ref={ctx.editorRef}
              sourceMode={ctx.sourceMode}
            />
          )}
          {ctx.showSearch && ctx.viewMode !== 'kanban' && <SearchPanel />}
        </div>
      </div>
      <ChatPanel />
      <StatusBar
        onUploadConfig={() => setShowUploadConfig(true)}
        onPreferences={() => setShowPrefs(true)}
        onAbout={() => setShowAbout(true)}
      />

      {/* Dialogs */}
      {showPrefs && <PreferencesDialog onClose={() => setShowPrefs(false)} />}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
      {showUploadConfig && <UploadConfig onClose={() => setShowUploadConfig(false)} />}
    </>
  )
}
