import { dialog, BrowserWindow } from 'electron'
import { readFile, writeFile, access, mkdir, readdir } from 'fs/promises'
import { existsSync, statSync } from 'fs'
import { dirname, basename, join } from 'path'
import { recentFilesStore } from './store'

const MARKDOWN_FILTERS = [
  { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'mdwn', 'mdtxt', 'mdtext', 'rmd'] },
  { name: 'Text Files', extensions: ['txt'] },
  { name: 'All Files', extensions: ['*'] }
]

export interface FileResult {
  content: string
  filePath: string
  fileName: string
}

export async function openFileDialog(): Promise<FileResult | null> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    title: 'Open Markdown File',
    filters: MARKDOWN_FILTERS,
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const filePath = result.filePaths[0]
  const content = await readFile(filePath, 'utf-8')
  const fileName = basename(filePath)

  recentFilesStore.addRecent(filePath)
  return { content, filePath, fileName }
}

export async function saveFile(filePath: string, content: string): Promise<boolean> {
  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
    await writeFile(filePath, content, 'utf-8')
    recentFilesStore.addRecent(filePath)
    return true
  } catch {
    return false
  }
}

export async function saveFileAsDialog(content: string): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const result = await dialog.showSaveDialog(win, {
    title: 'Save Markdown File',
    filters: MARKDOWN_FILTERS,
    defaultPath: 'untitled.md'
  })

  if (result.canceled || !result.filePath) return null

  const success = await saveFile(result.filePath, content)
  return success ? result.filePath : null
}

export async function readFileByPath(filePath: string): Promise<FileResult | null> {
  try {
    await access(filePath)
    const content = await readFile(filePath, 'utf-8')
    const fileName = basename(filePath)
    return { content, filePath, fileName }
  } catch {
    return null
  }
}

export function getRecentFiles(): string[] {
  return recentFilesStore.getRecent()
}

export async function openFolderDialog(): Promise<{ folderPath: string; files: Array<{ path: string; name: string }> } | null> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    title: 'Open Folder',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) return null
  const folderPath = result.filePaths[0]
  const files = await scanFolder(folderPath)
  return { folderPath, files }
}

export async function scanFolder(folderPath: string): Promise<Array<{ path: string; name: string }>> {
  const results: Array<{ path: string; name: string }> = []
  const MD_EXT = new Set(['.md', '.markdown', '.mdown', '.mkd', '.mdx', '.txt'])

  async function walk(dir: string) {
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath)
        } else if (entry.isFile()) {
          const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
          if (MD_EXT.has(ext)) {
            results.push({ path: fullPath, name: entry.name })
          }
        }
      }
    } catch { /* skip inaccessible dirs */ }
  }

  await walk(folderPath)
  return results.sort((a, b) => a.name.localeCompare(b.name))
}

