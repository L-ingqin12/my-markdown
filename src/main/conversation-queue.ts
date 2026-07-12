import { EventEmitter } from 'events'
import crypto from 'crypto'

export interface QueuedRequest {
  id: string
  conversationId: string
  prompt: string
  enqueuedAt: number
  resolve: (result: string) => void
  reject: (err: Error) => void
}

export class ConversationQueue extends EventEmitter {
  private queue: QueuedRequest[] = []
  private readonly maxQueueSize: number

  constructor(maxQueueSize: number = 10) {
    super()
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
      this.emit('queue-depth', this.queue.length)
    })
  }

  dequeue(): QueuedRequest | undefined {
    const item = this.queue.shift()
    if (item) {
      this.emit('queue-depth', this.queue.length)
    }
    return item
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
    const removed: QueuedRequest[] = []
    this.queue = this.queue.filter(r => {
      if (r.conversationId !== conversationId) return true
      removed.push(r)
      return false
    })
    for (const item of removed) {
      item.reject(new Error('Removed by conversation ID'))
    }
    const result = before - this.queue.length
    if (result > 0) {
      this.emit('queue-depth', this.queue.length)
    }
    return result
  }

  clear(): void {
    for (const item of this.queue) {
      item.reject(new Error('Queue cleared'))
    }
    this.queue = []
    this.emit('queue-depth', 0)
  }
}
