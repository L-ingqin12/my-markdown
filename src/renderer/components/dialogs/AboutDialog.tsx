import React from 'react'

interface AboutDialogProps {
  onClose: () => void
}

export function AboutDialog({ onClose }: AboutDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>About My Markdown</h2>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 300, marginBottom: '8px' }}>My Markdown</h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Version 1.0.0</p>
          <p style={{ marginTop: '16px', fontSize: '13px', lineHeight: '1.6', color: '#666' }}>
            A Typora-compatible Markdown editor with WYSIWYG editing,
            image hosting integration, and theme support.
          </p>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#aaa' }}>
            <p>Built with Electron, React, and CodeMirror 6</p>
            <p style={{ marginTop: '4px' }}>
              Keyboard Shortcuts:
              <strong> Ctrl+S</strong> Save &nbsp;|&nbsp;
              <strong> Ctrl+O</strong> Open &nbsp;|&nbsp;
              <strong> Ctrl+B</strong> Bold &nbsp;|&nbsp;
              <strong> Ctrl+I</strong> Italic &nbsp;|&nbsp;
              <strong> Ctrl+K</strong> Link &nbsp;|&nbsp;
              <strong> Ctrl+\\</strong> Source Mode &nbsp;|&nbsp;
              <strong> Ctrl+Shift+F</strong> Focus Mode
            </p>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  )
}
