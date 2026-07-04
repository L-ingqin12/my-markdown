import { appStore } from './store'
import { spawn } from 'child_process'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join, dirname, basename, extname } from 'path'
import { existsSync } from 'fs'
import http from 'http'
import https from 'https'
import os from 'os'

interface UploadConfig {
  service: 'picgo' | 'custom-command' | 'smms' | 'github' | 'local' | 'none'
  picgoConfig?: Record<string, unknown>
  customCommand?: string
  smmsToken?: string
  githubRepo?: string
  githubToken?: string
  githubBranch?: string
  githubPath?: string
  localAssetsDir?: string
}

export function getUploadConfig(): UploadConfig {
  return (appStore.get('uploadConfig') as UploadConfig) || { service: 'local' }
}

export function setUploadConfig(config: Partial<UploadConfig>): void {
  const current = getUploadConfig()
  appStore.set('uploadConfig', { ...current, ...config })
}

export async function testUpload(): Promise<boolean> {
  try {
    // Try writing a small test file and uploading
    const tmpDir = join(os.tmpdir(), 'my-markdown-test')
    await mkdir(tmpDir, { recursive: true })
    const testPath = join(tmpDir, 'test.png')
    // Create a minimal valid PNG
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    await writeFile(testPath, png)
    const result = await uploadImages([testPath])
    return result.length > 0
  } catch {
    return false
  }
}

export async function uploadImages(imagePaths: string[], docPath?: string): Promise<string[]> {
  const config = getUploadConfig()

  switch (config.service) {
    case 'picgo':
      return uploadViaPicGoHttp(imagePaths)  // HTTP API is more reliable than require('picgo')
    case 'custom-command':
      return uploadViaCustomCommand(imagePaths, config.customCommand || '')
    case 'smms':
      return uploadViaSmms(imagePaths, config.smmsToken || '')
    case 'github':
      return uploadViaGithub(imagePaths, config)
    case 'local':
      return copyToLocalAssets(imagePaths, config.localAssetsDir || docPath || '')
    default:
      return copyToLocalAssets(imagePaths, config.localAssetsDir || docPath || '')
  }
}

async function copyToLocalAssets(imagePaths: string[], docPath: string): Promise<string[]> {
  const results: string[] = []
  const baseDir = docPath ? join(dirname(docPath), 'assets') : join(process.cwd(), 'assets')
  await mkdir(baseDir, { recursive: true })

  for (const imgPath of imagePaths) {
    try {
      const ext = extname(imgPath)
      const destName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
      const destPath = join(baseDir, destName)
      const data = await readFile(imgPath)
      await writeFile(destPath, data)
      results.push(docPath ? `./assets/${destName}` : destPath)
    } catch {
      results.push(imgPath)
    }
  }
  return results
}

async function uploadViaPicGoHttp(imagePaths: string[]): Promise<string[]> {
  const fs = await import('fs')
  const results: string[] = []

  for (const imgPath of imagePaths) {
    const url = await new Promise<string>((resolve, reject) => {
      const boundary = '----PicGo' + Date.now()
      const body = buildMultipartBody(imgPath, boundary)

      const req = http.request({
        hostname: '127.0.0.1',
        port: 36677,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        }
      }, (res) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.success && json.result?.length > 0) {
              resolve(json.result[0])
            } else {
              reject(new Error('PicGo upload failed: ' + (json.message || 'unknown')))
            }
          } catch {
            reject(new Error('Invalid PicGo response'))
          }
        })
      })
      req.on('error', () => reject(new Error('PicGo not running (port 36677)')))
      req.write(body)
      req.end()
    }).catch(() => {
      // If PicGo not available, fall back to local copy
      return `file://${imgPath}`
    })
    results.push(url)
  }
  return results
}

function buildMultipartBody(filePath: string, boundary: string): Buffer {
  const fs = require('fs')
  const fileName = basename(filePath)
  const fileContent: Buffer = fs.readFileSync(filePath)

  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${fileName}"\r\nContent-Type: image/${extname(filePath).slice(1) || 'png'}\r\n\r\n`
  )
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
  return Buffer.concat([header, fileContent, footer])
}

async function uploadViaCustomCommand(imagePaths: string[], command: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const escapedPaths = imagePaths.map(p => `"${p}"`)
    const fullCmd = `${command} ${escapedPaths.join(' ')}`

    const child = spawn(fullCmd, [], {
      shell: true,
      windowsHide: true
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
    child.stderr.on('data', (data: Buffer) => { stderr += data.toString() })

    child.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(`Command exited with code ${code}: ${stderr}`))
        return
      }
      const lines = stdout.trim().split('\n').filter(l => l.trim())
      const urlLines = lines.filter(l =>
        l.startsWith('http://') || l.startsWith('https://') || l.startsWith('file://')
      )
      resolve(urlLines.length > 0 ? urlLines : lines.slice(-imagePaths.length))
    })

    child.on('error', reject)
  })
}

async function uploadViaSmms(imagePaths: string[], token: string): Promise<string[]> {
  const fs = require('fs')
  const https = require('https')
  const results: string[] = []

  for (const imgPath of imagePaths) {
    const boundary = '----SmMs' + Date.now()
    const fileBuffer = fs.readFileSync(imgPath)
    const fileName = basename(imgPath)

    let body = Buffer.alloc(0)
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="smfile"; filename="${fileName}"\r\nContent-Type: image/${extname(imgPath).slice(1) || 'png'}\r\n\r\n`
    )
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
    body = Buffer.concat([header, fileBuffer, footer])

    const result = await new Promise<string>((resolve, reject) => {
      const req = https.request({
        hostname: 'sm.ms',
        path: '/api/v2/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          ...(token ? { 'Authorization': token } : {})
        }
      }, (res: any) => {
        let data = ''
        res.on('data', (c: string) => { data += c })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.success) {
              resolve(json.data.url)
            } else if (json.code === 'image_repeated' && json.images) {
              resolve(json.images)
            } else {
              reject(new Error(json.message || 'Upload failed'))
            }
          } catch {
            reject(new Error('Invalid response'))
          }
        })
      })
      req.on('error', reject)
      req.write(body)
      req.end()
    })

    results.push(result)
  }
  return results
}

async function uploadViaGithub(imagePaths: string[], config: UploadConfig): Promise<string[]> {
  const fs = require('fs')
  const https = require('https')
  const results: string[] = []
  const { githubRepo, githubToken, githubBranch = 'main', githubPath = 'images/' } = config

  for (const imgPath of imagePaths) {
    const fileBuffer = fs.readFileSync(imgPath)
    const base64 = fileBuffer.toString('base64')
    const fileName = `${githubPath}${Date.now()}_${basename(imgPath)}`

    const body = JSON.stringify({
      message: 'Upload via My Markdown',
      content: base64,
      branch: githubBranch
    })

    const result = await postGitHub(githubRepo!, githubToken!, fileName, body)
    if (result) {
      results.push(`https://raw.githubusercontent.com/${githubRepo}/${githubBranch}/${fileName}`)
    } else {
      // Retry with unique name
      const uniqueName = `${githubPath}${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${basename(imgPath)}`
      const retryBody = JSON.stringify({
        message: 'Upload via My Markdown',
        content: base64,
        branch: githubBranch
      })
      const retryResult = await postGitHub(githubRepo!, githubToken!, uniqueName, retryBody)
      results.push(`https://raw.githubusercontent.com/${githubRepo}/${githubBranch}/${uniqueName}`)
    }
  }
  return results
}

function postGitHub(repo: string, token: string, fileName: string, body: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${fileName}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'MyMarkdown',
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    }, (res: any) => {
      let data = ''
      res.on('data', (c: string) => { data += c })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(!!json.content?.download_url || res.statusCode === 201)
        } catch {
          resolve(false)
        }
      })
    })
    req.on('error', () => resolve(false))
    req.write(body)
    req.end()
  })
}
