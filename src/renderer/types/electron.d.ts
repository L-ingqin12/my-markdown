import type { ElectronAPI } from '../../preload/index'
import type { AIProviderConfig, ConversationMeta, ChatMessage, AiChunkData, AiDoneData, AiErrorData } from '../../shared/types'

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export type { AIProviderConfig, ConversationMeta, ChatMessage, AiChunkData, AiDoneData, AiErrorData }
export {}
