import { appStore } from './store'
import { spawn } from 'child_process'

interface UploadConfig {
  service: 'picgo' | 'custom-command' | 'smms' | 'github' | 'none'
  picgoConfig?: Record<string, unknown>
  customCommand?: string
  smmsToken?: string
  githubRepo?: string
  githubToken?: string
  githubBranch?: string
  githubPath?: string
}

export function getUploadConfig(): UploadConfig {
  return (appStore.get('uploadConfig') as UploadConfig) || { service: 'none' }
}

export function setUploadConfig(config: Partial<UploadConfig>): void {
  const current = getUploadConfig()
  appStore.set('uploadConfig', { ...current, ...config })
}

export async function uploadImages(imagePaths: string[]): Promise<string[]> {
  const config = getUploadConfig()

  switch (config.service) {
    case 'picgo':
      return uploadViaPicGo(imagePaths)
    case 'custom-command':
      return uploadViaCustomCommand(imagePaths, config.customCommand || '')
    case 'smms':
      return uploadViaSmms(imagePaths, config.smmsToken || '')
    case 'github':
      return uploadViaGithub(imagePaths, config)
    default:
      // 'none' — just copy to local assets folder
      return imagePaths.map(p => `file://${p}`)
  }
}

async function uploadViaPicGo(imagePaths: string[]): Promise<string[]> {
  try {
    const PicGo = require('picgo')
    const picgo = new PicGo()
    const result = await picgo.upload(imagePaths)
    return Array.isArray(result) ? result : [result]
  } catch {
    // Fallback: try PicGo HTTP API
    return uploadViaPicGoHttp(imagePaths)
  }
}

async function uploadViaPicGoHttp(imagePaths: string[]): Promise<string[]> {
  const FormData = require('form-data')
  const fs = require('fs')
  const http = require('http')

  const results: string[] = []
  for (const imgPath of imagePaths) {
    const url = await new Promise<string>((resolve, reject) => {
      const form = new FormData()
      form.append('image', fs.createReadStream(imgPath))

      const req = http.request({
        hostname: '127.0.0.1',
        port: 36677,
        path: '/upload',
        method: 'POST',
        headers: form.getHeaders()
      }, (res: { on: (arg0: string, arg1: (chunk: string) => void) => void }) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.success && json.result?.length > 0) {
              resolve(json.result[0])
            } else {
              reject(new Error('Upload failed'))
            }
          } catch {
            reject(new Error('Invalid response'))
          }
        })
      })
      req.on('error', reject)
      form.pipe(req)
    })
    results.push(url)
  }
  return results
}

async function uploadViaCustomCommand(imagePaths: string[], command: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, imagePaths, {
      shell: true,
      windowsHide: true
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString() })

    child.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(`Upload command exited with code ${code}: ${stderr}`))
        return
      }
      const lines = stdout.trim().split('\n').filter(l => l.trim())
      const urlLines = lines.filter(l =>
        l.startsWith('http://') || l.startsWith('https://') || l.startsWith('file://')
      )
      if (urlLines.length > 0) {
        resolve(urlLines)
      } else {
        resolve(lines.slice(-imagePaths.length))
      }
    })

    child.on('error', reject)
  })
}

async function uploadViaSmms(imagePaths: string[], token: string): Promise<string[]> {
  const fs = require('fs')
  const results: string[] = []

  for (const imgPath of imagePaths) {
    const buffer = fs.readFileSync(imgPath)
    const form = new FormData()
    form.append('smfile', new Blob([buffer]))

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = token
    }

    const response = await fetch('https://sm.ms/api/v2/upload', {
      method: 'POST',
      headers,
      body: form
    })
    const json = await response.json()
    if (json.success) {
      results.push(json.data.url)
    } else if (json.code === 'image_repeated' && json.images) {
      results.push(json.images)
    } else {
      throw new Error(`SM.MS upload failed: ${json.message || 'Unknown error'}`)
    }
  }
  return results
}

async function uploadViaGithub(imagePaths: string[], config: UploadConfig): Promise<string[]> {
  const fs = require('fs')
  const results: string[] = []

  const { githubRepo, githubToken, githubBranch = 'main', githubPath = 'images/' } = config

  for (const imgPath of imagePaths) {
    const fileBuffer = fs.readFileSync(imgPath)
    const base64 = fileBuffer.toString('base64')
    const fileName = `${githubPath}${Date.now()}_${require('path').basename(imgPath)}`

    const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: 'Upload image via My Markdown',
        content: base64,
        branch: githubBranch
      })
    })

    const json = await response.json()
    if (json.content?.download_url) {
      results.push(`https://raw.githubusercontent.com/${githubRepo}/${githubBranch}/${fileName}`)
    } else if (response.status === 422) {
      // File exists, use unique name
      const uniqueName = `${githubPath}${Date.now()}_${Math.random().toString(36).slice(2)}_${require('path').basename(imgPath)}`
      const retryRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${uniqueName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json'
        },
        body: JSON.stringify({
          message: 'Upload image via My Markdown',
          content: base64,
          branch: githubBranch
        })
      })
      const retryJson = await retryRes.json()
      results.push(`https://raw.githubusercontent.com/${githubRepo}/${githubBranch}/${uniqueName}`)
    } else {
      throw new Error(`GitHub upload failed: ${json.message || 'Unknown error'}`)
    }
  }
  return results
}

export async function testUpload(): Promise<boolean> {
  try {
    const testPath = require('path').join(__dirname, '../../resources/test-upload.png')
    await uploadImages([testPath])
    return true
  } catch {
    return false
  }
}
