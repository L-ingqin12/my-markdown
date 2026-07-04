import { SystemSnapshot } from './system-monitor'

export interface CapacityResult {
  availableSlots: number
  runningInstances: number
  maxInstances: number
  reason: string
  canAcceptWork: boolean
}

export class ResourceCalculator {
  private readonly MAX_CPU_PERCENT = 70
  private readonly MEMORY_PER_INSTANCE_GB = 1.5
  private readonly ABSOLUTE_MAX_INSTANCES = 5
  private readonly MIN_AVAILABLE_MEMORY_GB = 2

  constructor(private readonly activeInstanceCount: () => number) {}

  calculate(snapshot: SystemSnapshot): CapacityResult {
    const totalMemoryGB = snapshot.memoryAvailable / (1024 ** 3)
    const runningCount = this.activeInstanceCount()

    const cpuHeadroom = Math.max(0, this.MAX_CPU_PERCENT - snapshot.cpuPercent)
    const maxByCpu = cpuHeadroom > 30 ? this.ABSOLUTE_MAX_INSTANCES
      : cpuHeadroom > 10 ? Math.floor(this.ABSOLUTE_MAX_INSTANCES * (cpuHeadroom / 30))
      : 0

    const reservedForSystem = this.MIN_AVAILABLE_MEMORY_GB
    const usableMemoryGB = totalMemoryGB - reservedForSystem
    const maxByMemory = Math.max(0, Math.floor(usableMemoryGB / this.MEMORY_PER_INSTANCE_GB))

    const diskPressure = (snapshot.diskIORead + snapshot.diskIOWrite) > 500
    const diskPenalty = diskPressure ? 1 : 0

    const theoreticalMax = Math.max(0, Math.min(this.ABSOLUTE_MAX_INSTANCES, maxByCpu, maxByMemory) - diskPenalty)
    const availableSlots = Math.max(0, theoreticalMax - runningCount)

    const reasons: string[] = []
    if (availableSlots === 0 && runningCount > 0) {
      if (snapshot.cpuPercent >= this.MAX_CPU_PERCENT) reasons.push(`CPU at ${snapshot.cpuPercent.toFixed(0)}%`)
      if (totalMemoryGB < this.MIN_AVAILABLE_MEMORY_GB) reasons.push(`only ${totalMemoryGB.toFixed(1)}GB free`)
      if (runningCount >= this.ABSOLUTE_MAX_INSTANCES) reasons.push('at absolute instance cap')
      if (diskPressure) reasons.push('disk I/O pressure')
    }

    return {
      availableSlots,
      runningInstances: runningCount,
      maxInstances: theoreticalMax,
      reason: reasons.length ? reasons.join('; ') : `${availableSlots} slot(s) available`,
      canAcceptWork: availableSlots > 0
    }
  }
}
