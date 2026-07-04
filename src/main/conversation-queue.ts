import crypto from 'crypto'

export interface QueuedRequest {
  id: string
  conversationId: string
  prompt: string
  enqueuedAt: number
  resolve: (result: string) => void
  reject: (err: Error) => void
}

export class ConversationQueue {
  private queue: QueuedRequest[] = []
  private readonly maxQueueSize: number

  constructor(maxQueueSize: number = 10) {
    this.maxQueueSize = maxQueueSize
  }

  enqueue(conversationId: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error('Queue is full'))
        return
      }
      this.queue.push({
        id: crypto.randomUUID(),
        conversationId,
        prompt,
        enqueuedAt: Date.now(),
        resolve,
        reject
      })
    })
  }

  dequeue(): QueuedRequest | undefined {
    return this.queue.shift()
  }

  get length(): number {
    return this.queue.length
  }

  get isFull(): boolean {
    return this.queue.length >= this.maxQueueSize
  }

  peek(): QueuedRequest | undefined {
    return this.queue[0]
  }

  removeByConversationId(conversationId: string): number {
    const before = this.queue.length
    this.queue = this.queue.filter(r => r.conversationId !== conversationId)
    return before - this.queue.length
  }

  clear(): void {
    this.queue = []
  }
}
