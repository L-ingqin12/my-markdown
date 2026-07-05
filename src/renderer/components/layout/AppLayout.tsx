import React from 'react'
import { Panel, Group, Separator } from 'react-resizable-panels'
import Editor from '../editor/Editor'
import { EditorToolbar } from '../editor/EditorToolbar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { SearchPanel } from './SearchPanel'
import { useEditor } from '../../contexts/EditorContext'
import { KanbanView } from '../kanban/KanbanView'
import { MindMapView } from '../graph/MindMapView'
import { KnowledgeGraph } from '../graph/KnowledgeGraph'
import { WelcomeScreen } from './WelcomeScreen'
import { PreferencesDialog } from '../dialogs/PreferencesDialog'
import { AboutDialog } from '../dialogs/AboutDialog'
import { UploadConfig } from '../upload/UploadConfig'
import { ChatPanel } from '../chat/ChatPanel'

export function AppLayout() {
  const ctx = useEditor()

  const editorContent = ctx.viewMode === 'kanban' ? (
    <KanbanView />
  ) : ctx.viewMode === 'mindmap' ? (
    <MindMapView content={ctx.content} />
  ) : ctx.viewMode === 'graph' ? (
    <KnowledgeGraph
      documents={[{ path: ctx.filePath || 'current.md', content: ctx.content }]}
      currentPath={ctx.filePath || undefined}
      onNodeClick={() => {}}
    />
  ) : !ctx.filePath && !ctx.content ? (
    <WelcomeScreen />
  ) : (
    <Editor ref={ctx.editorRef} sourceMode={ctx.sourceMode} />
  )

  return (
    <>
      <EditorToolbar />
      <div className="app-body">
        {ctx.sidebarVisible ? (
          <Group direction="horizontal">
            <Panel defaultSize="20%" minSize="15%" maxSize="35%">
              <Sidebar
                content={ctx.content}
                visible={true}
                onUploadConfig={() => ctx.setShowThemeDialog(true)}
                onPreferences={() => ctx.setShowThemeDialog(true)}
              />
            </Panel>
            <Separator className="sidebar-resize-handle" />
            <Panel defaultSize="80%" minSize="50%">
              <div className="app-editor-area">
                {editorContent}
                {ctx.showSearch && ctx.viewMode === 'editor' && <SearchPanel />}
              </div>
            </Panel>
          </Group>
        ) : (
          <div className="app-editor-area" style={{ width: '100%' }}>
            {editorContent}
            {ctx.showSearch && ctx.viewMode === 'editor' && <SearchPanel />}
          </div>
        )}
      </div>
      <ChatPanel />
      <StatusBar
        onUploadConfig={() => ctx.setShowThemeDialog(true)}
        onPreferences={() => ctx.setShowThemeDialog(true)}
        onAbout={() => ctx.setShowAbout(true)}
      />
      {ctx.showThemeDialog && <UploadConfig onClose={() => ctx.setShowThemeDialog(false)} />}
      {ctx.showAbout && <AboutDialog onClose={() => ctx.setShowAbout(false)} />}
    </>
  )
}
