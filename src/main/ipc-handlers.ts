import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { openFileDialog, openFolderDialog, scanFolder, saveFile, saveFileAsDialog, readFileByPath, getRecentFiles } from './file-manager'
import { getPreferences, setPreferences, getTheme, setTheme } from './preferences'
import { uploadImages, getUploadConfig, setUploadConfig, testUpload } from './image-uploader'
import { getThemeList, loadThemeCss, getCurrentTheme } from './theme-manager'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { app as electronApp } from 'electron'
import { recentFilesStore } from './store'
import { exportHtml } from './export'
import { exportPdf } from './export'
import { exportFeishu } from './export-feishu'
import { exportDoc } from './export-doc'
import {
  getGitStatus, gitCommit, gitCommitAll, gitPush,
  gitPull, gitLog, gitInit, gitDiff
} from './git-manager'
import { ClaudeManager } from './claude-manager'
import { ConversationQueue } from './conversation-queue'

export function registerIpcHandlers(): void {
  // File operations
  ipcMain.handle(IPC.FILE_OPEN, async () => {
    return openFileDialog()
  })

  ipcMain.handle(IPC.FOLDER_OPEN, async () => {
    return openFolderDialog()
  })

  ipcMain.handle(IPC.FOLDER_SCAN, async (_e, folderPath: string) => {
    return scanFolder(folderPath)
  })

  ipcMain.handle(IPC.FILE_SAVE, async (_e, filePath: string, content: string) => {
    return saveFile(filePath, content)
  })

  ipcMain.handle(IPC.FILE_SAVE_AS, async (_e, content: string) => {
    return saveFileAsDialog(content)
  })

  ipcMain.handle(IPC.FILE_READ, async (_e, filePath: string) => {
    return readFileByPath(filePath)
  })

  ipcMain.handle(IPC.FILE_GET_RECENT, async () => {
    return getRecentFiles()
  })

  ipcMain.handle(IPC.FILE_ADD_RECENT, async (_e, filePath: string) => {
    recentFilesStore.addRecent(filePath)
  })

  // Image upload
  ipcMain.handle(IPC.IMAGE_UPLOAD, async (_e, imagePaths: string[]) => {
    return uploadImages(imagePaths)
  })

  ipcMain.handle(IPC.IMAGE_UPLOAD_ALL, async (_e, content: string, basePath?: string) => {
    const localImgRegex = /!\[.*?\]\((?!https?:\/\/)(?!data:)([^)]+)\)/g
    const localPaths: string[] = []
    let match
    while ((match = localImgRegex.exec(content)) !== null) {
      const resolved = basePath ? join(dirname(basePath), match[1]) : match[1]
      localPaths.push(resolved)
    }
    if (localPaths.length === 0) return []
    return uploadImages(localPaths, basePath)
  })

  ipcMain.handle(IPC.IMAGE_GET_CONFIG, async () => {
    return getUploadConfig()
  })

  ipcMain.handle(IPC.IMAGE_SET_CONFIG, async (_e, config: Record<string, unknown>) => {
    return setUploadConfig(config)
  })

  ipcMain.handle(IPC.IMAGE_TEST_UPLOAD, async () => {
    return testUpload()
  })

  ipcMain.handle(IPC.IMAGE_WRITE_TEMP, async (_e, buffer: ArrayBuffer, ext: string) => {
    const tempDir = join(electronApp.getPath('temp'), 'my-markdown')
    await mkdir(tempDir, { recursive: true })
    const fileName = `img_${Date.now()}.${ext}`
    const filePath = join(tempDir, fileName)
    await writeFile(filePath, Buffer.from(buffer))
    return filePath
  })

  // Theme
  ipcMain.handle(IPC.THEME_LIST, async () => {
    return getThemeList()
  })

  ipcMain.handle(IPC.THEME_LOAD, async (_e, themeName: string) => {
    return loadThemeCss(themeName)
  })

  ipcMain.handle(IPC.THEME_GET_CURRENT, async () => {
    return getCurrentTheme()
  })

  ipcMain.handle(IPC.THEME_SET_CURRENT, async (_e, themeName: string) => {
    setTheme(themeName)
    return true
  })

  // Preferences
  ipcMain.handle(IPC.PREF_GET, async () => {
    return getPreferences()
  })

  ipcMain.handle(IPC.PREF_SET, async (_e, partial: Record<string, unknown>) => {
    setPreferences(partial)
    return true
  })

  // Window
  ipcMain.on(IPC.WINDOW_SET_TITLE, (_e, title: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.setTitle(title)
  })

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.minimize()
  })

  ipcMain.on(IPC.WINDOW_MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  ipcMain.on(IPC.WINDOW_CLOSE, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.close()
  })

  // Export
  ipcMain.handle(IPC.EXPORT_HTML, async (_e, content: string, filePath?: string) => {
    return exportHtml(content, filePath)
  })

  ipcMain.handle(IPC.EXPORT_PDF, async (_e, content: string, filePath?: string) => {
    return exportPdf(content, filePath)
  })

  ipcMain.handle(IPC.EXPORT_FEISHU, async (_e, content: string, filePath?: string, title?: string) => {
    return exportFeishu(content, filePath, title)
  })

  ipcMain.handle(IPC.EXPORT_DOC, async (_e, content: string, filePath?: string, title?: string, themeCss?: string) => {
    const options: { title?: string; themeCss?: string } = {}
    if (title) options.title = title
    if (themeCss) options.themeCss = themeCss
    return exportDoc(content, filePath, options)
  })

  // Git handlers
  ipcMain.handle(IPC.GIT_STATUS, async (_e, filePath?: string) => getGitStatus(filePath))
  ipcMain.handle(IPC.GIT_COMMIT, async (_e, filePath: string, message: string) => gitCommit(filePath, message))
  ipcMain.handle(IPC.GIT_COMMIT_ALL, async (_e, repoPath: string, message: string) => gitCommitAll(repoPath, message))
  ipcMain.handle(IPC.GIT_PUSH, async (_e, repoPath: string) => gitPush(repoPath))
  ipcMain.handle(IPC.GIT_PULL, async (_e, repoPath: string) => gitPull(repoPath))
  ipcMain.handle(IPC.GIT_LOG, async (_e, repoPath: string, count?: number) => gitLog(repoPath, count))
  ipcMain.handle(IPC.GIT_INIT, async (_e, repoPath: string) => gitInit(repoPath))
  ipcMain.handle(IPC.GIT_DIFF, async (_e, filePath: string) => gitDiff(filePath))

  // Claude CLI handlers
  const claudeManager = new ClaudeManager()
  const convQueue = new ConversationQueue(10)

  ipcMain.handle(IPC.CLAUDE_SPAWN, async (_e, conversationId: string) => {
    const info = claudeManager.spawnInstance(conversationId)
    return info.id
  })
  ipcMain.handle(IPC.CLAUDE_SEND_PROMPT, async (_e, instanceId: string, prompt: string) => {
    return claudeManager.sendPrompt(instanceId, prompt)
  })
  ipcMain.handle(IPC.CLAUDE_KILL, async (_e, instanceId: string) => {
    return claudeManager.killInstance(instanceId)
  })
  ipcMain.handle(IPC.CLAUDE_KILL_ALL, async () => {
    claudeManager.killAll()
  })
  ipcMain.handle(IPC.CLAUDE_LIST, async () => {
    return claudeManager.getInstances()
  })

  // Bridge Claude events to renderer
  claudeManager.on('output', (instanceId: string, text: string) => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send(IPC.CLAUDE_OUTPUT, instanceId, text))
  })
  claudeManager.on('error-output', (instanceId: string, text: string) => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send(IPC.CLAUDE_ERROR_OUTPUT, instanceId, text))
  })
  claudeManager.on('exited', (instanceId: string, info: Record<string, unknown>) => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send(IPC.CLAUDE_EXITED, instanceId, info))
  })
  claudeManager.on('system-status', (status: Record<string, unknown>) => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send(IPC.CLAUDE_SYSTEM_STATUS, status))
  })
  convQueue.on('queue-depth', (depth: number) => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send(IPC.CLAUDE_QUEUE_STATUS, depth))
  })
}
