import React, { useState, useEffect } from 'react'

interface UploadConfig {
  service: string
  customCommand?: string
  smmsToken?: string
  githubRepo?: string
  githubToken?: string
  githubBranch?: string
  githubPath?: string
}

interface UploadConfigProps {
  onClose: () => void
}

export function UploadConfig({ onClose }: UploadConfigProps) {
  const [config, setConfig] = useState<UploadConfig>({ service: 'local' })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const c = await window.api.getUploadConfig()
        setConfig(c as UploadConfig)
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const handleSave = async () => {
    await window.api.setUploadConfig(config)
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await window.api.setUploadConfig(config)
      const ok = await window.api.testUpload()
      setTestResult(ok ? 'Upload test passed!' : 'Upload test failed')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setTestResult(`Error: ${message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
        <h2>Image Upload Settings</h2>

        <div className="form-group">
          <label>Upload Service</label>
          <select
            value={config.service}
            onChange={e => setConfig({ ...config, service: e.target.value })}
          >
            <option value="local">Local Assets Folder (default)</option>
            <option value="picgo">PicGo (auto-detect, port 36677)</option>
            <option value="smms">SM.MS (free image hosting)</option>
            <option value="github">GitHub Repository</option>
            <option value="custom-command">Custom Upload Script</option>
          </select>
        </div>

        {config.service === 'smms' && (
          <div className="form-group">
            <label>SM.MS API Token</label>
            <input
              type="password"
              placeholder="Get token from https://sm.ms/home/apitoken"
              value={config.smmsToken || ''}
              onChange={e => setConfig({ ...config, smmsToken: e.target.value })}
            />
          </div>
        )}

        {config.service === 'github' && (
          <>
            <div className="form-group">
              <label>GitHub Repository (owner/repo)</label>
              <input
                placeholder="e.g. myusername/my-images"
                value={config.githubRepo || ''}
                onChange={e => setConfig({ ...config, githubRepo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>GitHub Personal Access Token</label>
              <input
                type="password"
                placeholder="Token with 'repo' or 'public_repo' scope"
                value={config.githubToken || ''}
                onChange={e => setConfig({ ...config, githubToken: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Branch</label>
              <input
                placeholder="main"
                value={config.githubBranch || ''}
                onChange={e => setConfig({ ...config, githubBranch: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Upload Path Prefix</label>
              <input
                placeholder="images/"
                value={config.githubPath || ''}
                onChange={e => setConfig({ ...config, githubPath: e.target.value })}
              />
            </div>
          </>
        )}

        {config.service === 'custom-command' && (
          <div className="form-group">
            <label>Custom Upload Command</label>
            <textarea
              rows={3}
              placeholder='e.g. python "C:\scripts\upload.py" or bash /usr/local/bin/upload.sh'
              value={config.customCommand || ''}
              onChange={e => setConfig({ ...config, customCommand: e.target.value })}
            />
            <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              The command receives image paths as arguments. Output URLs to stdout (one per line).
              Exit code 0 = success. See Typora's custom command protocol.
            </small>
          </div>
        )}

        {config.service === 'picgo' && (
          <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '4px', fontSize: '13px', marginBottom: '12px' }}>
            <p><strong>PicGo Integration</strong></p>
            <p style={{ marginTop: '8px' }}>We'll try to use PicGo-Core as a library first.</p>
            <p>If PicGo App (v2.2+) is running, we'll also try HTTP upload on port 36677.</p>
            <p style={{ marginTop: '8px', color: '#888' }}>
              Install PicGo-Core: <code>npm install -g picgo</code>
            </p>
          </div>
        )}

        {testResult && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '13px',
            marginBottom: '12px',
            background: testResult.includes('passed') ? '#e6f7e6' : '#fde8e8',
            color: testResult.includes('passed') ? '#2e7d32' : '#c62828'
          }}>
            {testResult}
          </div>
        )}

        <div className="dialog-footer">
          <button onClick={handleTest} disabled={testing}>
            {testing ? 'Testing...' : 'Test Upload'}
          </button>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
