import React, { useState } from 'react'
import { Outline } from './Outline'
import { FileTree } from './FileTree'
import { TagPanel } from './TagPanel'
import { useEditor } from '../../contexts/EditorContext'
import { extractTags } from '../../utils/wikilink'

interface SidebarProps {
  content: string
  visible: boolean
  onUploadConfig: () => void
  onPreferences: () => void
}

type TabId = 'files' | 'outline' | 'tags' | 'settings'

export function Sidebar({ content, visible, onUploadConfig, onPreferences }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('files')
  const ctx = useEditor()

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'outline', label: 'Outline', icon: '📋' },
    { id: 'tags', label: 'Tags', icon: '🏷' },
    { id: 'settings', label: 'Settings', icon: '⚙' }
  ]

  const handleFileClick = async (path: string) => {
    const result = await window.api.readFile(path)
    if (result) {
      ctx.setContent(result.content)
      ctx.setFilePath(result.filePath)
      ctx.setFileName(result.fileName)
      ctx.setIsModified(false)
      window.api.setTitle(`My Markdown - ${result.fileName}`)
    }
  }

  return (
    <div className={`app-sidebar ${!visible ? 'hidden' : ''}`}>
      {/* Tab bar */}
      <div className="sidebar-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="sidebar-tab-icon">{tab.icon}</span>
            <span className="sidebar-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="sidebar-content">
        {activeTab === 'files' && (
          <FileTree
            onFileClick={handleFileClick}
            activeFile={ctx.filePath}
          />
        )}

        {activeTab === 'outline' && (
          <Outline content={content} />
        )}

        {activeTab === 'tags' && (
          <TagPanel
            documents={ctx.filePath ? [{ path: ctx.filePath, content }] : []}
          />
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '8px' }}>
            <div className="sidebar-menu-item" onClick={onUploadConfig}>
              <span>🖼</span> Image Upload Settings
            </div>
            <div className="sidebar-menu-item" onClick={onPreferences}>
              <span>⚙</span> Preferences
            </div>
            <div className="sidebar-menu-item" onClick={() => ctx.setViewMode(ctx.viewMode === 'kanban' ? 'editor' : 'kanban')}>
              <span>📋</span> Kanban Board
            </div>
            <div className="sidebar-menu-item" onClick={() => ctx.setViewMode(ctx.viewMode === 'mindmap' ? 'editor' : 'mindmap')}>
              <span>🧠</span> Mind Map
            </div>
            <div className="sidebar-menu-item" onClick={() => ctx.setViewMode(ctx.viewMode === 'graph' ? 'editor' : 'graph')}>
              <span>🔗</span> Knowledge Graph
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
