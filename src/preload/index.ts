import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { FileResult, UploadConfig, ThemeInfo, Preferences, AIProviderConfig, ConversationMeta, ChatMessage, AiChunkData, AiDoneData, AiErrorData, ClaudeInstanceInfo, ClaudeExitInfo, ClaudeSystemStatus } from '../shared/types'

const api = {
  // File operations
  openFile: (): Promise<FileResult | null> => ipcRenderer.invoke(IPC.FILE_OPEN),
  openFolder: (): Promise<{ folderPath: string; files: Array<{ path: string; name: string }> } | null> =>
    ipcRenderer.invoke(IPC.FOLDER_OPEN),
  scanFolder: (folderPath: string): Promise<Array<{ path: string; name: string }>> =>
    ipcRenderer.invoke(IPC.FOLDER_SCAN, folderPath),
  saveFile: (filePath: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.FILE_SAVE, filePath, content),
  saveFileAs: (content: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.FILE_SAVE_AS, content),
  readFile: (filePath: string): Promise<FileResult | null> =>
    ipcRenderer.invoke(IPC.FILE_READ, filePath),
  getRecentFiles: (): Promise<string[]> => ipcRenderer.invoke(IPC.FILE_GET_RECENT),
  addRecentFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke(IPC.FILE_ADD_RECENT, filePath),

  // Image upload
  uploadImages: (imagePaths: string[]): Promise<string[]> =>
    ipcRenderer.invoke(IPC.IMAGE_UPLOAD, imagePaths),
  getUploadConfig: (): Promise<UploadConfig> => ipcRenderer.invoke(IPC.IMAGE_GET_CONFIG),
  setUploadConfig: (config: Partial<UploadConfig>): Promise<void> =>
    ipcRenderer.invoke(IPC.IMAGE_SET_CONFIG, config),
  testUpload: (): Promise<boolean> => ipcRenderer.invoke(IPC.IMAGE_TEST_UPLOAD),
  writeTempImage: (buffer: ArrayBuffer, ext: string): Promise<string> =>
    ipcRenderer.invoke(IPC.IMAGE_WRITE_TEMP, buffer, ext),

  // Theme
  getThemeList: (): Promise<ThemeInfo[]> => ipcRenderer.invoke(IPC.THEME_LIST),
  loadThemeCss: (themeName: string): Promise<string> =>
    ipcRenderer.invoke(IPC.THEME_LOAD, themeName),
  getCurrentTheme: (): Promise<string> => ipcRenderer.invoke(IPC.THEME_GET_CURRENT),
  setCurrentTheme: (themeName: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.THEME_SET_CURRENT, themeName),

  // Window
  setTitle: (title: string): void => { ipcRenderer.send(IPC.WINDOW_SET_TITLE, title) },
  minimizeWindow: (): void => { ipcRenderer.send(IPC.WINDOW_MINIMIZE) },
  maximizeWindow: (): void => { ipcRenderer.send(IPC.WINDOW_MAXIMIZE) },
  closeWindow: (): void => { ipcRenderer.send(IPC.WINDOW_CLOSE) },

  // Menu events (main → renderer)
  onMenuAction: (callback: (action: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on(IPC.MENU_ACTION, handler)
    return () => { ipcRenderer.removeListener(IPC.MENU_ACTION, handler) }
  },

  // Preferences
  getPreferences: (): Promise<Preferences> => ipcRenderer.invoke(IPC.PREF_GET),
  setPreferences: (partial: Partial<Preferences>): Promise<boolean> =>
    ipcRenderer.invoke(IPC.PREF_SET, partial),

  // Export
  exportHtml: (content: string, filePath?: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.EXPORT_HTML, content, filePath),
  exportPdf: (content: string, filePath?: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.EXPORT_PDF, content, filePath),
  exportFeishu: (content: string, filePath?: string, title?: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.EXPORT_FEISHU, content, filePath, title),
  exportDoc: (content: string, filePath?: string, title?: string, themeCss?: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC.EXPORT_DOC, content, filePath, title, themeCss),

  // AI Chat
  aiChatSend: (conversationId: string, message: string): Promise<{ success: boolean; conversationId?: string; error?: string }> =>
    ipcRenderer.invoke(IPC.AI_CHAT_SEND, conversationId, message),
  aiChatStop: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC.AI_CHAT_STOP),
  aiListConversations: (): Promise<{ success: boolean; conversations: ConversationMeta[] }> =>
    ipcRenderer.invoke(IPC.AI_LIST_CONVERSATIONS),
  aiGetConversation: (id: string): Promise<{ success: boolean; conversation?: ConversationMeta; messages: ChatMessage[]; error?: string }> =>
    ipcRenderer.invoke(IPC.AI_GET_CONVERSATION, id),
  aiDeleteConversation: (id: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC.AI_DELETE_CONVERSATION, id),
  aiGetProviders: (): Promise<{ success: boolean; providers: AIProviderConfig[] }> =>
    ipcRenderer.invoke(IPC.AI_GET_PROVIDERS),
  aiSetProviders: (providers: AIProviderConfig[]): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC.AI_SET_PROVIDERS, providers),
  aiTestConnection: (config: AIProviderConfig): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC.AI_TEST_CONNECTION, config),

  // AI Events (main → renderer)
  onAiChunk: (callback: (data: AiChunkData) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: AiChunkData) => callback(data)
    ipcRenderer.on(IPC.AI_CHUNK, handler)
    return () => { ipcRenderer.removeListener(IPC.AI_CHUNK, handler) }
  },
  onAiDone: (callback: (data: AiDoneData) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: AiDoneData) => callback(data)
    ipcRenderer.on(IPC.AI_DONE, handler)
    return () => { ipcRenderer.removeListener(IPC.AI_DONE, handler) }
  },
  onAiError: (callback: (data: AiErrorData) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: AiErrorData) => callback(data)
    ipcRenderer.on(IPC.AI_ERROR, handler)
    return () => { ipcRenderer.removeListener(IPC.AI_ERROR, handler) }
  },

  // Claude CLI management
  claudeSpawn: (conversationId: string): Promise<string> =>
    ipcRenderer.invoke(IPC.CLAUDE_SPAWN, conversationId),
  claudeSendPrompt: (instanceId: string, prompt: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.CLAUDE_SEND_PROMPT, instanceId, prompt),
  claudeKill: (instanceId: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.CLAUDE_KILL, instanceId),
  claudeKillAll: (): Promise<void> =>
    ipcRenderer.invoke(IPC.CLAUDE_KILL_ALL),
  claudeList: (): Promise<ClaudeInstanceInfo[]> =>
    ipcRenderer.invoke(IPC.CLAUDE_LIST),
  onClaudeOutput: (callback: (instanceId: string, text: string) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, instanceId: string, text: string) => callback(instanceId, text)
    ipcRenderer.on(IPC.CLAUDE_OUTPUT, handler)
    return () => { ipcRenderer.removeListener(IPC.CLAUDE_OUTPUT, handler) }
  },
  onClaudeError: (callback: (instanceId: string, text: string) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, instanceId: string, text: string) => callback(instanceId, text)
    ipcRenderer.on(IPC.CLAUDE_ERROR_OUTPUT, handler)
    return () => { ipcRenderer.removeListener(IPC.CLAUDE_ERROR_OUTPUT, handler) }
  },
  onClaudeExited: (callback: (instanceId: string, info: ClaudeExitInfo) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, instanceId: string, info: ClaudeExitInfo) => callback(instanceId, info)
    ipcRenderer.on(IPC.CLAUDE_EXITED, handler)
    return () => { ipcRenderer.removeListener(IPC.CLAUDE_EXITED, handler) }
  },
  onClaudeSystemStatus: (callback: (status: ClaudeSystemStatus) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, status: ClaudeSystemStatus) => callback(status)
    ipcRenderer.on(IPC.CLAUDE_SYSTEM_STATUS, handler)
    return () => { ipcRenderer.removeListener(IPC.CLAUDE_SYSTEM_STATUS, handler) }
  },
  onClaudeQueueStatus: (callback: (depth: number) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, depth: number) => callback(depth)
    ipcRenderer.on(IPC.CLAUDE_QUEUE_STATUS, handler)
    return () => { ipcRenderer.removeListener(IPC.CLAUDE_QUEUE_STATUS, handler) }
  },

  // Git operations
  gitStatus: (filePath?: string): Promise<any> => ipcRenderer.invoke(IPC.GIT_STATUS, filePath),
  gitCommit: (filePath: string, message: string): Promise<boolean> => ipcRenderer.invoke(IPC.GIT_COMMIT, filePath, message),
  gitCommitAll: (repoPath: string, message: string): Promise<boolean> => ipcRenderer.invoke(IPC.GIT_COMMIT_ALL, repoPath, message),
  gitPush: (repoPath: string): Promise<boolean> => ipcRenderer.invoke(IPC.GIT_PUSH, repoPath),
  gitPull: (repoPath: string): Promise<boolean> => ipcRenderer.invoke(IPC.GIT_PULL, repoPath),
  gitLog: (repoPath: string, count?: number): Promise<any[]> => ipcRenderer.invoke(IPC.GIT_LOG, repoPath, count),
  gitInit: (repoPath: string): Promise<boolean> => ipcRenderer.invoke(IPC.GIT_INIT, repoPath),
  gitDiff: (filePath: string): Promise<string> => ipcRenderer.invoke(IPC.GIT_DIFF, filePath)
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
