import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface StreamOptions {
  signal?: AbortSignal
}

export interface AIProvider {
  readonly name: string
  streamChat(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncGenerator<string, void, unknown>
  testConnection(): Promise<boolean>
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private client: Anthropic
  private model: string

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined
    })
    this.model = config.model || 'claude-3-opus-20240229'
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncGenerator<string, void, unknown> {
    const apiMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content
    }))

    const stream = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: 4096,
        messages: apiMessages,
        stream: true
      },
      { signal: options?.signal }
    )

    for await (const event of stream) {
      if (options?.signal?.aborted) break

      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with just: ok' }],
        stream: true
      })
      for await (const _event of stream) {
        // Just consume the stream to verify connection works
        break
      }
      return true
    } catch {
      return false
    }
  }
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  protected client: OpenAI
  protected model: string

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined
    })
    this.model = config.model || 'gpt-4o'
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: StreamOptions
  ): AsyncGenerator<string, void, unknown> {
    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content
    }))

    const stream = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: apiMessages,
        stream: true
      },
      { signal: options?.signal }
    )

    for await (const chunk of stream) {
      if (options?.signal?.aborted) break

      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) {
        yield delta
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Reply with just: ok' }],
        stream: true,
        max_tokens: 10
      })
      for await (const _chunk of stream) {
        break
      }
      return true
    } catch {
      return false
    }
  }
}

export class CustomProvider extends OpenAIProvider {
  readonly name = 'custom'

  constructor(config: ProviderConfig) {
    super(config)
  }
}

export function getProvider(
  type: 'anthropic' | 'openai' | 'custom',
  config: ProviderConfig
): AIProvider {
  switch (type) {
    case 'anthropic':
      return new AnthropicProvider(config)
    case 'openai':
      return new OpenAIProvider(config)
    case 'custom':
      return new CustomProvider(config)
    default:
      throw new Error(`Unknown provider type: ${type}`)
  }
}
