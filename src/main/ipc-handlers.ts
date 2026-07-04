import { ipcMain, BrowserWindow, dialog, app } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { openFileDialog, saveFile, saveFileAsDialog, readFileByPath, getRecentFiles } from './file-manager'
import { getPreferences, setPreferences, getTheme, setTheme } from './preferences'
import { uploadImages, getUploadConfig, setUploadConfig, testUpload } from './image-uploader'
import { getThemeList, loadThemeCss, getCurrentTheme } from './theme-manager'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { app as electronApp } from 'electron'

export function registerIpcHandlers(): void {
  // File operations
  ipcMain.handle(IPC.FILE_OPEN, async () => {
    return openFileDialog()
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
    const { recentFilesStore } = require('./store')
    recentFilesStore.addRecent(filePath)
  })

  // Image upload
  ipcMain.handle(IPC.IMAGE_UPLOAD, async (_e, imagePaths: string[]) => {
    return uploadImages(imagePaths)
  })

  ipcMain.handle(IPC.IMAGE_UPLOAD_ALL, async (_e, content: string) => {
    const result = await uploadImages([content])
    return result
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
    const { exportHtml } = require('./export')
    return exportHtml(content, filePath)
  })

  ipcMain.handle(IPC.EXPORT_PDF, async (_e, content: string, filePath?: string) => {
    const { exportPdf } = require('./export')
    return exportPdf(content, filePath)
  })

  ipcMain.handle(IPC.EXPORT_FEISHU, async (_e, content: string, filePath?: string, title?: string) => {
    const { exportFeishu } = require('./export-feishu')
    return exportFeishu(content, filePath, title)
  })

  ipcMain.handle(IPC.EXPORT_DOC, async (_e, content: string, filePath?: string, title?: string, themeCss?: string) => {
    const { exportDoc } = require('./export-doc')
    const options: { title?: string; themeCss?: string } = {}
    if (title) options.title = title
    if (themeCss) options.themeCss = themeCss
    return exportDoc(content, filePath, options)
  })
}
