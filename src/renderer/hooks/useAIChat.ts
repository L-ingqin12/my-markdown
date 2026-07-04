import { useCallback } from 'react'
import { useChatContext } from '../contexts/ChatContext'
import type { ChatMessage } from '../../preload/index'

export interface UseAIChatReturn {
  sendMessage: (content: string) => Promise<void>
  stopStreaming: () => void
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
  error: string | null
}

export function useAIChat(): UseAIChatReturn {
  const {
    sendMessage: ctxSendMessage,
    stopStreaming: ctxStopStreaming,
    messages,
    isStreaming,
    streamingContent,
    error
  } = useChatContext()

  return {
    sendMessage: ctxSendMessage,
    stopStreaming: ctxStopStreaming,
    messages,
    isStreaming,
    streamingContent,
    error
  }
}
