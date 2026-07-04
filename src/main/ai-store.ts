import Store from 'electron-store'
import { createHash } from 'crypto'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

export interface AIProviderConfig {
  id: string
  name: string
  type: 'anthropic' | 'openai' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  isActive: boolean
}

interface AIStoreSchema {
  providers: AIProviderConfig[]
}

function deriveEncryptionKey(): string {
  const machineId = app.getPath('userData')
  const hostname = process.env.COMPUTERNAME || process.env.HOSTNAME || 'unknown'
  const username = process.env.USERNAME || process.env.USER || 'unknown'
  const seed = `${machineId}-${hostname}-${username}`
  return createHash('sha256').update(seed, 'utf8').digest('hex').slice(0, 32)
}

const aiStore = new Store<AIStoreSchema>({
  name: 'ai-providers',
  encryptionKey: deriveEncryptionKey(),
  defaults: {
    providers: []
  }
})

export function getProviders(): AIProviderConfig[] {
  return aiStore.get('providers', [])
}

export function setProviders(providers: AIProviderConfig[]): void {
  aiStore.set('providers', providers)
}

export function getActiveProvider(): AIProviderConfig | undefined {
  const providers = getProviders()
  return providers.find(p => p.isActive)
}

export function createDefaultProvider(type: 'anthropic' | 'openai' | 'custom'): AIProviderConfig {
  const defaults: Record<string, { baseUrl: string; model: string }> = {
    anthropic: {
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-opus-20240229'
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o'
    },
    custom: {
      baseUrl: '',
      model: ''
    }
  }

  const config = defaults[type]
  return {
    id: uuidv4(),
    name: type === 'custom' ? 'Custom Provider' : type.charAt(0).toUpperCase() + type.slice(1),
    type,
    apiKey: '',
    baseUrl: config.baseUrl,
    model: config.model,
    isActive: false
  }
}
