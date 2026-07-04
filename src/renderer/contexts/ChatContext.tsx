import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ConversationMeta, ChatMessage } from '../../preload/index'

export interface ChatContextValue {
  conversations: ConversationMeta[]
  activeConversationId: string | null
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
  isOpen: boolean
  panelHeight: number
  error: string | null
  sendMessage: (content: string) => Promise<void>
  stopStreaming: () => void
  newConversation: () => void
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  togglePanel: () => void
  setPanelHeight: (height: number) => void
  refreshConversations: () => Promise<void>
  clearError: () => void
}

const ChatContext = createContext<ChatContextValue>({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  isOpen: false,
  panelHeight: 250,
  error: null,
  sendMessage: async () => {},
  stopStreaming: () => {},
  newConversation: () => {},
  switchConversation: async () => {},
  deleteConversation: async () => {},
  togglePanel: () => {},
  setPanelHeight: () => {},
  refreshConversations: async () => {},
  clearError: () => {}
})

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [panelHeight, setPanelHeight] = useState(250)
  const [error, setError] = useState<string | null>(null)

  // Refs for cleanup
  const streamingRef = useRef(false)
  const activeConvIdRef = useRef<string | null>(null)

  const refreshConversations = useCallback(async () => {
    try {
      const result = await window.api.aiListConversations()
      if (result.success) {
        setConversations(result.conversations)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load conversations on mount
  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  // Register IPC listeners for streaming
  useEffect(() => {
    const removeChunk = window.api.onAiChunk((data) => {
      if (data.conversationId === activeConvIdRef.current) {
        setStreamingContent(prev => prev + data.chunk)
      }
    })

    const removeDone = window.api.onAiDone((data) => {
      if (data.conversationId === activeConvIdRef.current) {
        if (data.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
        }
        setStreamingContent('')
        streamingRef.current = false
        setIsStreaming(false)
        // Refresh conversation list to update metadata
        refreshConversations()
      }
    })

    const removeError = window.api.onAiError((data) => {
      if (data.conversationId === activeConvIdRef.current) {
        setError(data.error)
        setStreamingContent('')
        streamingRef.current = false
        setIsStreaming(false)
      }
    })

    return () => {
      removeChunk()
      removeDone()
      removeError()
    }
  }, [refreshConversations])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || streamingRef.current) return

    const currentId = activeConvIdRef.current || 'new'
    streamingRef.current = true
    setIsStreaming(true)
    setError(null)
    setStreamingContent('')

    // Add user message immediately
    const userMessage: ChatMessage = { role: 'user', content: content.trim() }
    setMessages(prev => [...prev, userMessage])

    try {
      const result = await window.api.aiChatSend(currentId, content.trim())

      if (result.success && result.conversationId) {
        setActiveConversationId(result.conversationId)
        activeConvIdRef.current = result.conversationId
        refreshConversations()
      } else if (!result.success) {
        setError(result.error || 'Failed to send message')
        streamingRef.current = false
        setIsStreaming(false)
        setStreamingContent('')
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setError(errMsg)
      streamingRef.current = false
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [refreshConversations])

  const stopStreaming = useCallback(async () => {
    try {
      await window.api.aiChatStop()
    } catch {
      // Ignore errors on stop
    }
    streamingRef.current = false
    setIsStreaming(false)
    setStreamingContent('')
  }, [])

  const newConversation = useCallback(() => {
    setActiveConversationId(null)
    activeConvIdRef.current = null
    setMessages([])
    setStreamingContent('')
    setError(null)
    setIsOpen(true)
  }, [])

  const switchConversation = useCallback(async (id: string) => {
    if (streamingRef.current) {
      await stopStreaming()
    }

    try {
      const result = await window.api.aiGetConversation(id)
      if (result.success && result.conversation) {
        setActiveConversationId(id)
        activeConvIdRef.current = id
        setMessages(result.messages)
        setStreamingContent('')
        setError(null)
        setIsOpen(true)
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }, [stopStreaming])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const result = await window.api.aiDeleteConversation(id)
      if (result.success) {
        if (activeConvIdRef.current === id) {
          setActiveConversationId(null)
          activeConvIdRef.current = null
          setMessages([])
          setStreamingContent('')
        }
        refreshConversations()
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }, [refreshConversations, activeConvIdRef])

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      messages,
      isStreaming,
      streamingContent,
      isOpen,
      panelHeight,
      error,
      sendMessage,
      stopStreaming,
      newConversation,
      switchConversation,
      deleteConversation,
      togglePanel,
      setPanelHeight,
      refreshConversations,
      clearError
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  return useContext(ChatContext)
}

export default ChatContext
