import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'

interface ThemeDialogProps {
  onClose: () => void
}

export function ThemeDialog({ onClose }: ThemeDialogProps) {
  const { theme, themeList, setTheme } = useTheme()

  const handleSelect = async (name: string) => {
    await setTheme(name)
    onClose()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: '560px', maxWidth: '640px' }}>
        <h2>Select Theme</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '8px',
          maxHeight: '50vh',
          overflowY: 'auto',
          padding: '4px'
        }}>
          {themeList.map(t => (
            <div
              key={t.name}
              onClick={() => handleSelect(t.name)}
              style={{
                padding: '12px',
                border: theme === t.name ? '2px solid var(--primary-color)' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                background: theme === t.name ? 'rgba(66,139,202,0.08)' : 'var(--bg-color)',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                {t.displayName}
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {t.isBuiltin ? 'Built-in' : 'Custom'}
              </div>
              {theme === t.name && (
                <div style={{ color: 'var(--primary-color)', fontSize: '12px', marginTop: '4px' }}>
                  ✓ Active
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="dialog-footer">
          <button className="primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
