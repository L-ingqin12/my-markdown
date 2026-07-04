import React, { useState, useEffect, useCallback } from 'react'
import type { AIProviderConfig } from '../../../preload/index'

interface ProviderConfigDialogProps {
  onClose: () => void
}

interface ProviderForm {
  id: string
  name: string
  type: 'anthropic' | 'openai' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  isActive: boolean
}

const TYPE_LABELS: Record<string, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  custom: 'Custom (OpenAI-compatible)'
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-3-opus-20240229',
  openai: 'gpt-4o',
  custom: ''
}

const DEFAULT_URLS: Record<string, string> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
  custom: ''
}

function emptyForm(type: 'anthropic' | 'openai' | 'custom' = 'openai'): ProviderForm {
  return {
    id: '',
    name: type === 'custom' ? 'Custom Provider' : type.charAt(0).toUpperCase() + type.slice(1),
    type,
    apiKey: '',
    baseUrl: DEFAULT_URLS[type],
    model: DEFAULT_MODELS[type],
    isActive: false
  }
}

export function ProviderConfigDialog({ onClose }: ProviderConfigDialogProps) {
  const [providers, setProviders] = useState<AIProviderConfig[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<ProviderForm>(emptyForm())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    loadProviders()
  }, [])

  async function loadProviders() {
    try {
      const result = await window.api.aiGetProviders()
      if (result.success) {
        setProviders(result.providers)
      }
    } catch (err) {
      console.error('Failed to load providers:', err)
    }
  }

  async function saveProviders(newProviders: AIProviderConfig[]) {
    try {
      await window.api.aiSetProviders(newProviders)
      setProviders(newProviders)
      setDirty(false)
    } catch (err) {
      console.error('Failed to save providers:', err)
    }
  }

  const handleAdd = useCallback((type: 'anthropic' | 'openai' | 'custom') => {
    const newForm = emptyForm(type)
    newForm.id = `provider_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setForm(newForm)
    setEditing(newForm.id)
    setTestResult(null)
  }, [])

  const handleEdit = useCallback((provider: AIProviderConfig) => {
    setForm({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model: provider.model,
      isActive: provider.isActive
    })
    setEditing(provider.id)
    setTestResult(null)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const newProviders = providers.filter(p => p.id !== id)
    await saveProviders(newProviders)
    if (editing === id) {
      setEditing(null)
      setForm(emptyForm())
    }
  }, [providers, editing, saveProviders])

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return

    const existing = providers.findIndex(p => p.id === form.id)
    const provider: AIProviderConfig = {
      id: form.id,
      name: form.name.trim(),
      type: form.type,
      apiKey: form.apiKey,
      baseUrl: form.baseUrl,
      model: form.model,
      isActive: form.isActive
    }

    let newProviders: AIProviderConfig[]
    if (existing >= 0) {
      newProviders = [...providers]
      newProviders[existing] = provider
    } else {
      newProviders = [...providers, provider]
    }

    await saveProviders(newProviders)
    setEditing(null)
    setForm(emptyForm())
  }, [form, providers, saveProviders])

  const handleSetActive = useCallback(async (id: string) => {
    const newProviders = providers.map(p => ({
      ...p,
      isActive: p.id === id
    }))
    await saveProviders(newProviders)
  }, [providers, saveProviders])

  const handleTestConnection = useCallback(async () => {
    if (!form.apiKey) {
      setTestResult({ ok: false, message: 'Please enter an API key first.' })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const result = await window.api.aiTestConnection({
        id: form.id,
        name: form.name,
        type: form.type,
        apiKey: form.apiKey,
        baseUrl: form.baseUrl,
        model: form.model,
        isActive: form.isActive
      })
      setTestResult({
        ok: result.success,
        message: result.success ? 'Connection successful!' : (result.error || 'Connection failed.')
      })
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Connection test failed'
      })
    } finally {
      setTesting(false)
    }
  }, [form])

  const handleChangeType = useCallback((type: string) => {
    const t = type as 'anthropic' | 'openai' | 'custom'
    setForm(prev => ({
      ...prev,
      type: t,
      baseUrl: DEFAULT_URLS[t],
      model: DEFAULT_MODELS[t]
    }))
    setTestResult(null)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditing(null)
    setForm(emptyForm())
    setTestResult(null)
  }, [])

  const activeProvider = providers.find(p => p.isActive)

  return (
    <div className="dialog-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className="dialog" style={{ minWidth: 500, maxWidth: 650 }}>
        <h2>AI Provider Configuration</h2>

        {/* Provider list */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Providers</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => handleAdd('anthropic')} className="primary" style={{ fontSize: 12, padding: '3px 10px' }}>
                + Anthropic
              </button>
              <button onClick={() => handleAdd('openai')} className="primary" style={{ fontSize: 12, padding: '3px 10px' }}>
                + OpenAI
              </button>
              <button onClick={() => handleAdd('custom')} style={{ fontSize: 12, padding: '3px 10px' }}>
                + Custom
              </button>
            </div>
          </div>

          {providers.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13, border: '1px dashed #ccc', borderRadius: 4 }}>
              No providers configured. Add an Anthropic or OpenAI provider to get started.
            </div>
          ) : (
            <div style={{ border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
              {providers.map(provider => (
                <div
                  key={provider.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderBottom: '1px solid #eee',
                    background: provider.isActive ? 'rgba(66, 139, 202, 0.05)' : undefined
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>
                      {provider.name}
                      {provider.isActive && (
                        <span style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: '#27ae60',
                          fontWeight: 600
                        }}>
                          (active)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {TYPE_LABELS[provider.type] || provider.type}
                      {provider.model ? ` - ${provider.model}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!provider.isActive && (
                      <button
                        onClick={() => handleSetActive(provider.id)}
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        title="Set as active provider"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(provider)}
                      style={{ fontSize: 11, padding: '2px 8px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      style={{ fontSize: 11, padding: '2px 8px', color: '#c0392b' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active provider indicator */}
        {!activeProvider && providers.length > 0 && (
          <div style={{
            padding: '8px 12px',
            background: '#fff3cd',
            borderRadius: 4,
            fontSize: 12,
            color: '#856404',
            marginBottom: 12
          }}>
            No provider is active. Click "Activate" on a provider to use it for chat.
          </div>
        )}

        {!activeProvider && providers.length === 0 && (
          <div style={{
            padding: '8px 12px',
            background: '#f8f9fa',
            borderRadius: 4,
            fontSize: 12,
            color: '#666',
            marginBottom: 12
          }}>
            Add a provider and activate it to start using AI chat.
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: 16,
            marginBottom: 12
          }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>
              {providers.find(p => p.id === editing) ? 'Edit Provider' : 'New Provider'}
            </h3>

            <div className="form-group">
              <label>Provider Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); setTestResult(null) }}
                placeholder="My Provider"
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => handleChangeType(e.target.value)}>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="custom">Custom (OpenAI-compatible)</option>
              </select>
            </div>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => { setForm(prev => ({ ...prev, apiKey: e.target.value })); setTestResult(null) }}
                placeholder="sk-..."
              />
            </div>

            <div className="form-group">
              <label>Base URL</label>
              <input
                type="text"
                value={form.baseUrl}
                onChange={(e) => { setForm(prev => ({ ...prev, baseUrl: e.target.value })); setTestResult(null) }}
                placeholder={form.type === 'custom' ? 'https://api.example.com/v1' : DEFAULT_URLS[form.type]}
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => { setForm(prev => ({ ...prev, model: e.target.value })); setTestResult(null) }}
                placeholder={form.type === 'custom' ? 'model-name' : DEFAULT_MODELS[form.type]}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                Set as active provider
              </label>
            </div>

            {/* Test connection */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                style={{ fontSize: 12, padding: '4px 12px' }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              {testResult && (
                <span style={{
                  fontSize: 12,
                  color: testResult.ok ? '#27ae60' : '#c0392b'
                }}>
                  {testResult.message}
                </span>
              )}
            </div>

            <div className="dialog-footer" style={{ margin: 0, padding: 0, border: 'none' }}>
              <button onClick={handleCancelEdit}>Cancel</button>
              <button
                onClick={handleSave}
                className="primary"
                disabled={!form.name.trim() || !form.apiKey.trim()}
              >
                Save Provider
              </button>
            </div>
          </div>
        )}

        <div className="dialog-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
