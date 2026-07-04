import type { ElectronAPI, AIProviderConfig, ConversationMeta, ChatMessage, AiChunkData, AiDoneData, AiErrorData } from '../../preload/index'

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export type { AIProviderConfig, ConversationMeta, ChatMessage, AiChunkData, AiDoneData, AiErrorData }
export {}
