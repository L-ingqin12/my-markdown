import React, { useState, useEffect } from 'react'
import { useEditor } from '../../contexts/EditorContext'

interface Preferences {
  fontSize: number
  fontFamily: string
  tabWidth: number
  wordWrap: boolean
  autoSave: boolean
  autoSaveInterval: number
  showLineNumbers: boolean
  spellCheck: boolean
}

interface PreferencesDialogProps {
  onClose: () => void
}

export function PreferencesDialog({ onClose }: PreferencesDialogProps) {
  const editorCtx = useEditor()
  const [prefs, setPrefs] = useState<Preferences>({
    fontSize: 16,
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    tabWidth: 4,
    wordWrap: true,
    autoSave: true,
    autoSaveInterval: 2000,
    showLineNumbers: false,
    spellCheck: false
  })

  useEffect(() => {
    async function load() {
      try {
        const p = await window.api.getPreferences()
        if (p) setPrefs(p as Preferences)
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const handleSave = async () => {
    await window.api.setPreferences(prefs)
    // Sync back to editor context so changes take effect immediately
    Object.assign(editorCtx.preferences, prefs)
    onClose()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: '450px' }}>
        <h2>Preferences</h2>

        <div className="form-group">
          <label>Font Size ({prefs.fontSize}px)</label>
          <input
            type="range"
            min={12}
            max={28}
            step={1}
            value={prefs.fontSize}
            onChange={e => setPrefs({ ...prefs, fontSize: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>Font Family</label>
          <select
            value={prefs.fontFamily}
            onChange={e => setPrefs({ ...prefs, fontFamily: e.target.value })}
          >
            <option value="'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif">System Default</option>
            <option value="'Georgia', 'Times New Roman', serif">Serif (Georgia)</option>
            <option value="'Consolas', 'Fira Code', 'JetBrains Mono', monospace">Monospace (Consolas)</option>
            <option value="'LXGW WenKai', '楷体', serif">LXGW WenKai</option>
          </select>
        </div>

        <div className="form-group">
          <label>Tab Width: {prefs.tabWidth}</label>
          <input
            type="range"
            min={2}
            max={8}
            step={2}
            value={prefs.tabWidth}
            onChange={e => setPrefs({ ...prefs, tabWidth: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>Auto-Save Interval ({prefs.autoSaveInterval}ms)</label>
          <select
            value={prefs.autoSaveInterval}
            onChange={e => setPrefs({ ...prefs, autoSaveInterval: parseInt(e.target.value) })}
          >
            <option value="1000">1 second</option>
            <option value="2000">2 seconds</option>
            <option value="5000">5 seconds</option>
            <option value="10000">10 seconds</option>
            <option value="30000">30 seconds</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prefs.autoSave}
              onChange={e => setPrefs({ ...prefs, autoSave: e.target.checked })}
            />
            Enable Auto-Save
          </label>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prefs.wordWrap}
              onChange={e => setPrefs({ ...prefs, wordWrap: e.target.checked })}
            />
            Word Wrap
          </label>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prefs.showLineNumbers}
              onChange={e => setPrefs({ ...prefs, showLineNumbers: e.target.checked })}
            />
            Show Line Numbers
          </label>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={prefs.spellCheck}
              onChange={e => setPrefs({ ...prefs, spellCheck: e.target.checked })}
            />
            Spell Check (Experimental)
          </label>
        </div>

        <div className="dialog-footer">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
