// Shared types used across main, preload, and renderer processes

export interface FileResult {
  content: string
  filePath: string
  fileName: string
}

export interface UploadConfig {
  service: string
  customCommand?: string
  smmsToken?: string
  githubRepo?: string
  githubToken?: string
  githubBranch?: string
  githubPath?: string
}

export interface ThemeInfo {
  name: string
  displayName: string
  isBuiltin: boolean
}

export interface Preferences {
  fontSize: number
  fontFamily: string
  tabWidth: number
  wordWrap: boolean
  autoSave: boolean
  autoSaveInterval: number
  showLineNumbers: boolean
  spellCheck: boolean
}

// AI types
export interface AIProviderConfig {
  id: string
  name: string
  type: 'anthropic' | 'openai' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  isActive: boolean
}

export interface ConversationMeta {
  id: string
  title: string
  created: string
  updated: string
  provider: string
  model: string
  messageCount: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface AiChunkData {
  chunk: string
  conversationId: string
}

export interface AiDoneData {
  conversationId: string
  content: string
  title?: string
  stopped?: boolean
}

export interface AiErrorData {
  conversationId: string
  error: string
}

// Claude types
export interface ClaudeInstanceInfo {
  id: string
  conversationId: string
  pid: number
  status: 'running' | 'generating' | 'idle' | 'error'
  createdAt: number
  lastActivity: number
  cpuPercent: number
  memoryMB: number
}

export interface ClaudeExitInfo {
  code: number | null
  signal: string | null
}

export interface ClaudeSystemStatus {
  availableSlots: number
  runningInstances: number
  maxInstances: number
  reason: string
  canAcceptWork: boolean
}
