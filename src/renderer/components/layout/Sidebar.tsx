import React, { useMemo } from 'react'
import { Outline } from './Outline'

interface SidebarProps {
  content: string
  visible: boolean
  onUploadConfig: () => void
  onPreferences: () => void
}

export function Sidebar({ content, visible, onUploadConfig, onPreferences }: SidebarProps) {
  return (
    <div className={`app-sidebar ${!visible ? 'hidden' : ''}`}>
      <div className="sidebar-header">Outline</div>
      <div className="sidebar-content">
        <Outline content={content} />
      </div>
      <div style={{ borderTop: '1px solid #eee', padding: '8px' }}>
        <div className="outline-item" onClick={onUploadConfig} style={{ cursor: 'pointer' }}>
          &#x1F5BC; Image Upload Settings
        </div>
        <div className="outline-item" onClick={onPreferences} style={{ cursor: 'pointer' }}>
          &#x2699; Preferences
        </div>
      </div>
    </div>
  )
}
