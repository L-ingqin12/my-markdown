import { ipcMain, BrowserWindow, app } from 'electron'
import { IPC } from '../shared/ipc-channels'
import { getProviders, setProviders, getActiveProvider, AIProviderConfig } from './ai-store'
import { getProvider, ChatMessage } from './ai-providers'
import { readdir, readFile, writeFile, mkdir, unlink } from 'fs/promises'
import { join, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

const CONVERSATIONS_DIR = join(app.getPath('userData'), 'ai-conversations')

let activeAbortController: AbortController | null = null

interface ConversationMeta {
  id: string
  title: string
  created: string
  updated: string
  provider: string
  model: string
  messageCount: number
}

async function ensureConversationsDir(): Promise<void> {
  try {
    await mkdir(CONVERSATIONS_DIR, { recursive: true })
  } catch {
    // Directory already exists
  }
}

function generateFrontmatter(meta: ConversationMeta): string {
  return [
    '---',
    `id: ${meta.id}`,
    `title: ${meta.title}`,
    `created: ${meta.created}`,
    `updated: ${meta.updated}`,
    `provider: ${meta.provider}`,
    `model: ${meta.model}`,
    `messageCount: ${meta.messageCount}`,
    '---'
  ].join('\n')
}

function parseFrontmatter(fileContent: string): { data: Record<string, string>; content: string } {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: fileContent }
  }

  const data: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      data[key] = value
    }
  }

  return { data, content: match[2].trimStart() }
}

function parseMessages(content: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  // Split on ## User or ## Assistant headers
  const parts = content.split(/(?=^## (?:User|Assistant)\n)/m)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const userMatch = trimmed.match(/^## User\n\n([\s\S]*)$/)
    const assistantMatch = trimmed.match(/^## Assistant\n\n([\s\S]*)$/)

    if (userMatch) {
      messages.push({ role: 'user', content: userMatch[1].trim() })
    } else if (assistantMatch) {
      messages.push({ role: 'assistant', content: assistantMatch[1].trim() })
    }
  }
  return messages
}

function messagesToMarkdown(messages: ChatMessage[]): string {
  return messages.map(msg =>
    `## ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${msg.content}`
  ).join('\n\n')
}

async function loadConversationFile(id: string): Promise<{ meta: ConversationMeta; messages: ChatMessage[] } | null> {
  try {
    const filePath = join(CONVERSATIONS_DIR, `${id}.md`)
    const content = await readFile(filePath, 'utf-8')
    const { data, content: body } = parseFrontmatter(content)
    const messages = parseMessages(body)

    const meta: ConversationMeta = {
      id: data.id || id,
      title: data.title || 'Untitled',
      created: data.created || new Date().toISOString(),
      updated: data.updated || new Date().toISOString(),
      provider: data.provider || '',
      model: data.model || '',
      messageCount: parseInt(data.messageCount || '0', 10)
    }

    return { meta, messages }
  } catch {
    return null
  }
}

async function saveConversationFile(
  id: string,
  messages: ChatMessage[],
  provider?: AIProviderConfig,
  existingMeta?: ConversationMeta | null
): Promise<void> {
  await ensureConversationsDir()

  const now = new Date().toISOString()
  const title = messages.length > 0
    ? messages[0].content.slice(0, 60).replace(/\n/g, ' ').trim()
    : 'Untitled'

  const meta: ConversationMeta = {
    id,
    title: existingMeta?.title || title || 'Untitled',
    created: existingMeta?.created || now,
    updated: now,
    provider: provider?.name || existingMeta?.provider || '',
    model: provider?.model || existingMeta?.model || '',
    messageCount: messages.length
  }

  const frontmatter = generateFrontmatter(meta)
  const body = messagesToMarkdown(messages)
  const fileContent = `${frontmatter}\n\n${body}`

  const filePath = join(CONVERSATIONS_DIR, `${id}.md`)
  await writeFile(filePath, fileContent, 'utf-8')
}

async function listConversationFiles(): Promise<ConversationMeta[]> {
  await ensureConversationsDir()

  try {
    const files = await readdir(CONVERSATIONS_DIR)
    const mdFiles = files.filter(f => extname(f).toLowerCase() === '.md')

    const conversations: ConversationMeta[] = []

    for (const file of mdFiles) {
      const filePath = join(CONVERSATIONS_DIR, file)
      try {
        const content = await readFile(filePath, 'utf-8')
        const { data } = parseFrontmatter(content)
        if (data.id) {
          conversations.push({
            id: data.id,
            title: data.title || 'Untitled',
            created: data.created || '',
            updated: data.updated || '',
            provider: data.provider || '',
            model: data.model || '',
            messageCount: parseInt(data.messageCount || '0', 10)
          })
        }
      } catch {
        // Skip files that can't be read
      }
    }

    // Sort by updated date, most recent first
    conversations.sort((a, b) => {
      if (!a.updated && !b.updated) return 0
      if (!a.updated) return 1
      if (!b.updated) return -1
      return new Date(b.updated).getTime() - new Date(a.updated).getTime()
    })

    return conversations
  } catch {
    return []
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && (
    err.name === 'AbortError' ||
    err.message.includes('abort') ||
    err.message.includes('cancel')
  )
}

export function registerAiHandlers(): void {
  // Send a chat message (streaming)
  ipcMain.handle(IPC.AI_CHAT_SEND, async (event, conversationId: string, message: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { success: false, error: 'No window found' }

    const abortController = new AbortController()
    activeAbortController = abortController

    // Determine if this is a new conversation
    const isNew = !conversationId || conversationId === 'new'
    const actualId = isNew ? uuidv4() : conversationId

    try {
      // Load existing conversation if any
      let existingMessages: ChatMessage[] = []
      let existingMeta: ConversationMeta | null = null

      if (!isNew) {
        const existing = await loadConversationFile(actualId)
        if (existing) {
          existingMessages = existing.messages
          existingMeta = existing.meta
        }
      }

      // Get active provider
      const activeProvider = getActiveProvider()
      if (!activeProvider) {
        throw new Error('No active AI provider configured. Please add and activate a provider in the AI settings.')
      }

      if (!activeProvider.apiKey) {
        throw new Error(`Provider "${activeProvider.name}" has no API key configured.`)
      }

      // Build the provider
      const provider = getProvider(activeProvider.type, {
        apiKey: activeProvider.apiKey,
        baseUrl: activeProvider.baseUrl,
        model: activeProvider.model
      })

      // Build message history
      const allMessages: ChatMessage[] = [
        ...existingMessages,
        { role: 'user' as const, content: message }
      ]

      // Add user message to conversation
      existingMessages.push({ role: 'user', content: message })

      // Stream the response
      let fullResponse = ''

      try {
        for await (const chunk of provider.streamChat(allMessages, { signal: abortController.signal })) {
          fullResponse += chunk
          if (!abortController.signal.aborted) {
            win.webContents.send(IPC.AI_CHUNK, { chunk, conversationId: actualId })
          }
        }
      } catch (streamErr) {
        if (isAbortError(streamErr)) {
          // Streaming was aborted by user - use whatever we have so far
          if (!fullResponse) {
            win.webContents.send(IPC.AI_DONE, {
              conversationId: actualId,
              stopped: true
            })
            return { success: true, conversationId: actualId, stopped: true }
          }
        } else {
          throw streamErr
        }
      }

      // If we got a response, add it to messages and save
      if (fullResponse) {
        existingMessages.push({ role: 'assistant', content: fullResponse })
      }

      // Save the conversation
      await saveConversationFile(actualId, existingMessages, activeProvider, existingMeta)

      if (!abortController.signal.aborted) {
        win.webContents.send(IPC.AI_DONE, {
          conversationId: actualId,
          content: fullResponse,
          title: existingMessages[0]?.content.slice(0, 60).replace(/\n/g, ' ').trim() || 'Untitled'
        })
      }

      return { success: true, conversationId: actualId }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (!abortController.signal.aborted) {
        win.webContents.send(IPC.AI_ERROR, {
          conversationId: actualId,
          error: errorMessage
        })
      }
      return { success: false, error: errorMessage }
    } finally {
      if (activeAbortController === abortController) {
        activeAbortController = null
      }
    }
  })

  // Stop the current streaming
  ipcMain.handle(IPC.AI_CHAT_STOP, async () => {
    if (activeAbortController) {
      activeAbortController.abort()
      activeAbortController = null
    }
    return { success: true }
  })

  // List all conversations
  ipcMain.handle(IPC.AI_LIST_CONVERSATIONS, async () => {
    try {
      const conversations = await listConversationFiles()
      return { success: true, conversations }
    } catch (err) {
      return { success: false, error: String(err), conversations: [] }
    }
  })

  // Get a single conversation with its messages
  ipcMain.handle(IPC.AI_GET_CONVERSATION, async (_event, conversationId: string) => {
    try {
      const existing = await loadConversationFile(conversationId)
      if (!existing) {
        return { success: false, error: 'Conversation not found', messages: [] }
      }
      return { success: true, conversation: existing.meta, messages: existing.messages }
    } catch (err) {
      return { success: false, error: String(err), messages: [] }
    }
  })

  // Delete a conversation
  ipcMain.handle(IPC.AI_DELETE_CONVERSATION, async (_event, conversationId: string) => {
    try {
      const filePath = join(CONVERSATIONS_DIR, `${conversationId}.md`)
      await unlink(filePath)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Get AI providers
  ipcMain.handle(IPC.AI_GET_PROVIDERS, async () => {
    try {
      const providers = getProviders()
      return { success: true, providers }
    } catch (err) {
      return { success: false, error: String(err), providers: [] }
    }
  })

  // Set AI providers
  ipcMain.handle(IPC.AI_SET_PROVIDERS, async (_event, providers: AIProviderConfig[]) => {
    try {
      setProviders(providers)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  // Test provider connection
  ipcMain.handle(IPC.AI_TEST_CONNECTION, async (_event, providerConfig: AIProviderConfig) => {
    try {
      const provider = getProvider(providerConfig.type, {
        apiKey: providerConfig.apiKey,
        baseUrl: providerConfig.baseUrl,
        model: providerConfig.model
      })
      const ok = await provider.testConnection()
      return { success: ok }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
