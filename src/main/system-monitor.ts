import si from 'systeminformation'
import os from 'os'
import { EventEmitter } from 'events'

export interface SystemSnapshot {
  cpuPercent: number
  cpuLoadAvg: number
  memoryPercent: number
  memoryAvailable: number
  diskIORead: number
  diskIOWrite: number
  timestamp: number
  coreCount: number
}

export class SystemMonitor extends EventEmitter {
  private pollInterval: number
  private timer: ReturnType<typeof setTimeout> | null = null
  private lastSnapshot: SystemSnapshot | null = null

  constructor(options?: { interval?: number }) {
    super()
    this.pollInterval = options?.interval ?? 3000
  }

  start() {
    this.poll()
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  getLastSnapshot(): SystemSnapshot | null {
    return this.lastSnapshot
  }

  private async poll() {
    try {
      const [cpu, mem, disksIO] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.disksIO().catch(() => ({ rIO_sec: 0, wIO_sec: 0 }))
      ])

      const snapshot: SystemSnapshot = {
        cpuPercent: cpu.currentLoad,
        cpuLoadAvg: cpu.avgLoad,
        memoryPercent: (mem.total - mem.available) / mem.total * 100,
        memoryAvailable: mem.available,
        diskIORead: (disksIO as any)?.rIO_sec ?? 0,
        diskIOWrite: (disksIO as any)?.wIO_sec ?? 0,
        timestamp: Date.now(),
        coreCount: os.cpus().length
      }

      this.lastSnapshot = snapshot
      this.emit('snapshot', snapshot)
    } catch (err) {
      console.error('[SystemMonitor] poll error:', err)
    }

    this.timer = setTimeout(() => this.poll(), this.pollInterval)
  }
}
