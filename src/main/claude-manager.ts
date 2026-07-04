import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import crypto from 'crypto'

export interface ClaudeInstanceInfo {
  id: string
  conversationId: string
  pid: number
  status: 'running' | 'generating' | 'idle' | 'error'
  createdAt: number
  lastActivity: number
  cpuPercent: number
  memoryMB: number
}

interface InstanceEntry {
  info: ClaudeInstanceInfo
  process: ChildProcess
}

export class ClaudeManager extends EventEmitter {
  private instances = new Map<string, InstanceEntry>()

  spawnInstance(conversationId: string): ClaudeInstanceInfo {
    const id = crypto.randomUUID()
    const child = spawn('claude', [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
      windowsHide: true
    })

    const info: ClaudeInstanceInfo = {
      id,
      conversationId,
      pid: child.pid!,
      status: 'running',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      cpuPercent: 0,
      memoryMB: 0
    }

    this.instances.set(id, { info, process: child })

    child.stdout!.on('data', (data: Buffer) => {
      info.lastActivity = Date.now()
      info.status = 'generating'
      this.emit('output', id, data.toString())
    })

    child.stderr!.on('data', (data: Buffer) => {
      this.emit('error-output', id, data.toString())
    })

    child.on('exit', (code, signal) => {
      info.status = code === 0 ? 'idle' : 'error'
      this.instances.delete(id)
      this.emit('exited', id, { code, signal })
    })

    child.on('error', (err) => {
      info.status = 'error'
      this.emit('spawn-error', id, err.message)
    })

    return info
  }

  sendPrompt(instanceId: string, prompt: string): boolean {
    const entry = this.instances.get(instanceId)
    if (!entry || !entry.process.stdin?.writable) return false
    entry.process.stdin.write(prompt + '\n')
    entry.info.lastActivity = Date.now()
    entry.info.status = 'generating'
    return true
  }

  killInstance(instanceId: string): boolean {
    const entry = this.instances.get(instanceId)
    if (!entry) return false
    entry.process.kill()
    this.instances.delete(instanceId)
    return true
  }

  getInstanceCount(): number {
    return this.instances.size
  }

  getInstances(): ClaudeInstanceInfo[] {
    return Array.from(this.instances.values()).map(e => e.info)
  }

  killAll(): void {
    for (const [id] of this.instances) {
      this.killInstance(id)
    }
  }
}
