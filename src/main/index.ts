import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc-handlers'
import { registerAiHandlers } from './ai-handlers'
import { buildMenu } from './menu'
import { loadPreferences } from './preferences'
import { appStore } from './store'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const prefs = loadPreferences()
  const { width, height, x, y, isMaximized } = prefs.windowBounds ?? {}

  mainWindow = new BrowserWindow({
    width: width ?? 1200,
    height: height ?? 800,
    x,
    y,
    minWidth: 800,
    minHeight: 500,
    show: false,
    title: 'My Markdown - Untitled',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isMaximized) {
    mainWindow.maximize()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      const maximized = mainWindow.isMaximized()
      appStore.set('windowBounds', { ...bounds, isMaximized: maximized })
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_RENDERER_URL) {
    const url = process.env.ELECTRON_RENDERER_URL
    if (url) {
      mainWindow.loadURL(url)
    }
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  registerAiHandlers()
  buildMenu()
  createWindow()

  // Open file from command line / file association (Windows)
  const filePath = process.argv.find(a => a.endsWith('.md') || a.endsWith('.markdown') || a.endsWith('.mdx'))
  if (filePath && mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.send('menu:action', 'file:open-path:' + filePath)
    })
  }

  app.on('second-instance', (_e, argv) => {
    const fp = argv.find((a: string) => a.endsWith('.md'))
    if (fp && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.webContents.send('menu:action', 'file:open-path:' + fp)
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Single instance lock for file association
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) { app.quit() }

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
