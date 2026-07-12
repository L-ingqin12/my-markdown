import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

interface SystemStatus {
  availableSlots: number
  runningInstances: number
  maxInstances: number
  reason: string
  canAcceptWork: boolean
}

interface ClaudeInstance {
  id: string
  conversationId: string
  pid: number
  status: string
  createdAt: number
}

interface ClaudeContextValue {
  instances: ClaudeInstance[]
  systemStatus: SystemStatus
  queueDepth: number
  spawnConversation: (conversationId: string) => Promise<string | null>
  sendMessage: (instanceId: string, prompt: string) => Promise<boolean>
  killConversation: (instanceId: string) => Promise<boolean>
}

const defaultSystemStatus: SystemStatus = {
  availableSlots: 0, runningInstances: 0, maxInstances: 5,
  reason: 'Not monitoring', canAcceptWork: false
}

const ClaudeContext = createContext<ClaudeContextValue>({
  instances: [],
  systemStatus: defaultSystemStatus,
  queueDepth: 0,
  spawnConversation: async () => null,
  sendMessage: async () => false,
  killConversation: async () => false
})

export function ClaudeProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<ClaudeInstance[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(defaultSystemStatus)
  const [queueDepth, setQueueDepth] = useState(0)

  useEffect(() => {
    const unsubStatus = window.api.onClaudeSystemStatus?.((status: SystemStatus) => {
      setSystemStatus(status)
    })
    const unsubQueue = window.api.onClaudeQueueStatus?.((depth: number) => {
      setQueueDepth(depth)
    })

    // Poll instance list periodically
    const timer = setInterval(async () => {
      try {
        const list = await window.api.claudeList?.()
        if (list) setInstances(list)
      } catch { /* API not available */ }
    }, 3000)

    return () => {
      unsubStatus?.()
      unsubQueue?.()
      clearInterval(timer)
    }
  }, [])

  const spawnConversation = useCallback(async (conversationId: string) => {
    try {
      return await window.api.claudeSpawn?.(conversationId) ?? null
    } catch {
      return null
    }
  }, [])

  const sendMessage = useCallback(async (instanceId: string, prompt: string) => {
    try {
      return await window.api.claudeSendPrompt?.(instanceId, prompt) ?? false
    } catch {
      return false
    }
  }, [])

  const killConversation = useCallback(async (instanceId: string) => {
    try {
      return await window.api.claudeKill?.(instanceId) ?? false
    } catch {
      return false
    }
  }, [])

  const claudeValue = useMemo(() => ({
      instances, systemStatus, queueDepth,
      spawnConversation, sendMessage, killConversation
    }), [instances, systemStatus, queueDepth,
        spawnConversation, sendMessage, killConversation])

  return (
    <ClaudeContext.Provider value={claudeValue}>
      {children}
    </ClaudeContext.Provider>
  )
}

export function useClaude() {
  return useContext(ClaudeContext)
}
