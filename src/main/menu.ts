import { Menu, BrowserWindow, app } from 'electron'

export function buildMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => sendAction('file:new') },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => sendAction('file:open') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendAction('file:save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendAction('file:save-as') },
        { type: 'separator' },
        { label: 'Export HTML...', click: () => sendAction('export:html') },
        { label: 'Export PDF...', click: () => sendAction('export:pdf') },
        { label: 'Export Feishu JSON...', click: () => sendAction('export:feishu') },
        { label: 'Export Word Document...', click: () => sendAction('export:doc') },
        { type: 'separator' },
        ...(isMac ? [] : [{ label: 'Exit', accelerator: 'Alt+F4', click: () => app.quit() }])
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => sendAction('edit:undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => sendAction('edit:redo') },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => sendAction('edit:cut') },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => sendAction('edit:copy') },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => sendAction('edit:paste') },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => sendAction('edit:find') },
        { label: 'Replace', accelerator: 'CmdOrCtrl+H', click: () => sendAction('edit:replace') },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => sendAction('edit:select-all') }
      ]
    },
    {
      label: 'Paragraph',
      submenu: [
        { label: 'Heading 1', accelerator: 'CmdOrCtrl+1', click: () => sendAction('para:heading-1') },
        { label: 'Heading 2', accelerator: 'CmdOrCtrl+2', click: () => sendAction('para:heading-2') },
        { label: 'Heading 3', accelerator: 'CmdOrCtrl+3', click: () => sendAction('para:heading-3') },
        { label: 'Heading 4', accelerator: 'CmdOrCtrl+4', click: () => sendAction('para:heading-4') },
        { label: 'Heading 5', accelerator: 'CmdOrCtrl+5', click: () => sendAction('para:heading-5') },
        { label: 'Heading 6', accelerator: 'CmdOrCtrl+6', click: () => sendAction('para:heading-6') },
        { type: 'separator' },
        { label: 'Bold', accelerator: 'CmdOrCtrl+B', click: () => sendAction('para:bold') },
        { label: 'Italic', accelerator: 'CmdOrCtrl+I', click: () => sendAction('para:italic') },
        { label: 'Strikethrough', click: () => sendAction('para:strikethrough') },
        { label: 'Code', accelerator: 'CmdOrCtrl+Shift+`', click: () => sendAction('para:code') },
        { type: 'separator' },
        { label: 'Unordered List', accelerator: 'CmdOrCtrl+Shift+U', click: () => sendAction('para:ul') },
        { label: 'Ordered List', accelerator: 'CmdOrCtrl+Shift+O', click: () => sendAction('para:ol') },
        { label: 'Task List', click: () => sendAction('para:task') },
        { type: 'separator' },
        { label: 'Blockquote', accelerator: 'CmdOrCtrl+Shift+Q', click: () => sendAction('para:blockquote') },
        { label: 'Code Block', accelerator: 'CmdOrCtrl+Shift+K', click: () => sendAction('para:code-block') },
        { label: 'Horizontal Rule', click: () => sendAction('para:hr') },
        { type: 'separator' },
        { label: 'Link', accelerator: 'CmdOrCtrl+K', click: () => sendAction('para:link') },
        { label: 'Image', accelerator: 'CmdOrCtrl+Shift+I', click: () => sendAction('para:image') }
      ]
    },
    {
      label: 'Format',
      submenu: [
        { label: 'Upload All Local Images', click: () => sendAction('image:upload-all') },
        { type: 'separator' },
        { label: 'Insert Table of Contents', click: () => sendAction('format:toc') },
        { label: 'Insert YAML Front Matter', click: () => sendAction('format:frontmatter') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+Shift+L', click: () => sendAction('view:toggle-sidebar') },
        { label: 'Source Code Mode', accelerator: 'CmdOrCtrl+\\', click: () => sendAction('view:toggle-source') },
        { label: 'Focus Mode', accelerator: 'CmdOrCtrl+Shift+F', click: () => sendAction('view:toggle-focus') },
        { label: 'Typewriter Mode', accelerator: 'CmdOrCtrl+Shift+T', click: () => sendAction('view:toggle-typewriter') },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => sendAction('view:zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => sendAction('view:zoom-out') },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => sendAction('view:zoom-reset') }
      ]
    },
    {
      label: 'Theme',
      submenu: [
        { label: 'Select Theme...', click: () => sendAction('theme:select') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About My Markdown', click: () => sendAction('help:about') },
        { label: 'Toggle Developer Tools', accelerator: 'F12', click: () => sendAction('help:devtools') }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function sendAction(action: string): void {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    win.webContents.send('menu:action', action)
  }
}
