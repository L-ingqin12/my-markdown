import React, { useState, useCallback, useRef } from 'react'
import { Excalidraw, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw'
import { ExcalidrawScene } from '../../utils/excalidraw-parser'
import { exportToBlob } from '@excalidraw/excalidraw'

interface ExcalidrawBlockProps {
  blockId: string
  sceneData: ExcalidrawScene
  onUpdate: (newScene: ExcalidrawScene) => void
}

export function ExcalidrawBlock({ blockId, sceneData, onUpdate }: ExcalidrawBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const lastSavedRef = useRef<string>(JSON.stringify(sceneData))

  const handleSave = useCallback(() => {
    if (!apiRef.current) return
    const elements = apiRef.current.getSceneElements()
    const appState = apiRef.current.getAppState()
    const files = apiRef.current.getFiles()

    const newScene: ExcalidrawScene = {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize
      },
      files
    }

    lastSavedRef.current = JSON.stringify(newScene)
    onUpdate(newScene)
    setIsEditing(false)
  }, [onUpdate])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleExportPng = useCallback(async () => {
    if (!apiRef.current) return
    const elements = apiRef.current.getSceneElements()
    const appState = apiRef.current.getAppState()
    const files = apiRef.current.getFiles()

    try {
      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportBackground: true },
        files,
        mimeType: 'image/png'
      })
      const buffer = await blob.arrayBuffer()
      await window.api.exportPdf('', '') // using for file save, stub
      // In a real implementation, use a proper save dialog
    } catch (err) {
      console.error('Export PNG failed:', err)
    }
  }, [])

  if (!isEditing) {
    return (
      <ExcalidrawPreview
        elements={sceneData.elements || []}
        appState={sceneData.appState || {}}
        files={sceneData.files || {}}
        onEdit={() => setIsEditing(true)}
        height={300}
      />
    )
  }

  return (
    <div style={{
      position: 'relative',
      height: '500px',
      border: '1px solid var(--window-border)',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#fff'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid #eee',
        background: '#fafafa'
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Excalidraw Editor</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportPng}
            style={{
              padding: '4px 12px', border: '1px solid #ccc', borderRadius: '4px',
              background: '#fff', cursor: 'pointer', fontSize: '12px'
            }}
          >
            Export PNG
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '4px 12px', border: '1px solid #ccc', borderRadius: '4px',
              background: '#fff', cursor: 'pointer', fontSize: '12px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '4px 12px', border: 'none', borderRadius: '4px',
              background: 'var(--primary-color)', color: '#fff',
              cursor: 'pointer', fontSize: '12px'
            }}
          >
            Done
          </button>
        </div>
      </div>
      <div style={{ height: 'calc(100% - 44px)' }}>
        <Excalidraw
          excalidrawAPI={(api) => { apiRef.current = api }}
          initialData={{
            elements: sceneData.elements || [],
            appState: sceneData.appState || { viewBackgroundColor: '#ffffff' },
            files: sceneData.files || {}
          }}
          onChange={() => { /* handled on save */ }}
        />
      </div>
    </div>
  )
}

// Preview component
function ExcalidrawPreview({
  elements,
  appState,
  files,
  onEdit,
  height = 300
}: {
  elements: any[]
  appState: Record<string, any>
  files: Record<string, any>
  onEdit: () => void
  height?: number
}) {
  const emptyScene = !elements || elements.length === 0

  return (
    <div style={{
      position: 'relative',
      height: emptyScene ? '120px' : `${height}px`,
      border: '2px dashed #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      margin: '12px 0',
      background: '#fcfcfc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {emptyScene ? (
        <div style={{ textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#x270F;</div>
          <div style={{ fontSize: '13px' }}>Empty drawing - click to edit</div>
          <button
            onClick={onEdit}
            style={{
              marginTop: '8px', padding: '6px 16px',
              border: '1px solid #ccc', borderRadius: '4px',
              background: '#fff', cursor: 'pointer', fontSize: '13px'
            }}
          >
            Create Drawing
          </button>
        </div>
      ) : (
        <>
          <Excalidraw
            initialData={{
              elements,
              appState: { ...appState, viewModeEnabled: true },
              files
            }}
            viewModeEnabled={true}
          />
          <button
            onClick={onEdit}
            style={{
              position: 'absolute', top: 8, right: 8,
              padding: '4px 12px', border: '1px solid #ccc',
              borderRadius: '4px', background: '#fff',
              cursor: 'pointer', fontSize: '12px',
              zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            Edit
          </button>
        </>
      )}
    </div>
  )
}
