import '@testing-library/jest-dom'

// Mock window.api for renderer tests
const mockApi = {
  openFile: async () => null,
  saveFile: async () => true,
  saveFileAs: async () => '/test/path.md',
  readFile: async () => null,
  getRecentFiles: async () => [],
  addRecentFile: async () => {},
  uploadImages: async (paths: string[]) => paths.map(p => `https://cdn.example.com/${p}`),
  getUploadConfig: async () => ({ service: 'none' }),
  setUploadConfig: async () => {},
  testUpload: async () => true,
  writeTempImage: async () => '/tmp/test.png',
  getThemeList: async () => [{ name: 'github', displayName: 'Github', isBuiltin: true }],
  loadThemeCss: async () => ':root { --bg-color: #fff; }',
  getCurrentTheme: async () => 'github',
  setCurrentTheme: async () => true,
  setTitle: () => {},
  minimizeWindow: () => {},
  maximizeWindow: () => {},
  closeWindow: () => {},
  onMenuAction: () => () => {},
  getPreferences: async () => ({ fontSize: 16, fontFamily: 'sans-serif', tabWidth: 4, wordWrap: true, autoSave: true, autoSaveInterval: 2000, showLineNumbers: false, spellCheck: false }),
  setPreferences: async () => true,
  exportHtml: async () => '/test/export.html',
  exportPdf: async () => '/test/export.pdf',
  // AI
  aiChatSend: async () => ({ success: true }),
  aiChatStop: async () => ({ success: true }),
  aiListConversations: async () => ({ success: true, conversations: [] }),
  aiGetConversation: async () => ({ success: true, messages: [] }),
  aiDeleteConversation: async () => ({ success: true }),
  aiGetProviders: async () => ({ success: true, providers: [] }),
  aiSetProviders: async () => ({ success: true }),
  aiTestConnection: async () => ({ success: true }),
  onAiChunk: () => () => {},
  onAiDone: () => () => {},
  onAiError: () => () => {},
  // Claude
  claudeSpawn: async () => 'instance-1',
  claudeSendPrompt: async () => true,
  claudeKill: async () => true,
  claudeKillAll: async () => {},
  claudeList: async () => [],
  onClaudeOutput: () => () => {},
  onClaudeError: () => () => {},
  onClaudeExited: () => () => {},
  onClaudeSystemStatus: () => () => {},
  onClaudeQueueStatus: () => () => {},
  // Folder
  openFolder: async () => null,
  scanFolder: async () => [],
  // Export
  exportFeishu: async () => null,
  exportDoc: async () => null,
  // Git
  gitStatus: async () => null,
  gitCommit: async () => true,
  gitCommitAll: async () => true,
  gitPush: async () => true,
  gitPull: async () => true,
  gitLog: async () => [],
  gitInit: async () => true,
  gitDiff: async () => ''
}

if (typeof window !== 'undefined') {
  (window as any).api = mockApi
}
