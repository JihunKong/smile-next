import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * System Health Check Endpoint
 *
 * Returns server resource information:
 * - Disk usage
 * - Memory usage
 * - Docker statistics
 *
 * Note: This endpoint is designed to run inside a Docker container.
 * Some system metrics may not be available or may reflect container limits.
 */

interface DiskInfo {
  total: string
  used: string
  available: string
  usagePercent: number
  status: 'ok' | 'warning' | 'critical'
}

interface MemoryInfo {
  total: string
  used: string
  available: string
  usagePercent: number
  status: 'ok' | 'warning' | 'critical'
}

interface DockerInfo {
  available: boolean
  images?: number
  containers?: number
  error?: string
}

interface SystemHealthResponse {
  status: 'ok' | 'warning' | 'critical'
  disk: DiskInfo
  memory: MemoryInfo
  docker: DockerInfo
  uptime: string
  timestamp: string
  environment: string
}

// Thresholds for warnings
const DISK_WARNING_THRESHOLD = 70
const DISK_CRITICAL_THRESHOLD = 85
const MEMORY_WARNING_THRESHOLD = 80
const MEMORY_CRITICAL_THRESHOLD = 90

async function getDiskInfo(): Promise<DiskInfo> {
  try {
    // Get disk usage for root filesystem
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'")
    const parts = stdout.trim().split(/\s+/)

    if (parts.length >= 4) {
      const usagePercent = parseInt(parts[3].replace('%', ''), 10)
      let status: 'ok' | 'warning' | 'critical' = 'ok'

      if (usagePercent >= DISK_CRITICAL_THRESHOLD) {
        status = 'critical'
      } else if (usagePercent >= DISK_WARNING_THRESHOLD) {
        status = 'warning'
      }

      return {
        total: parts[0],
        used: parts[1],
        available: parts[2],
        usagePercent,
        status
      }
    }

    throw new Error('Unexpected df output format')
  } catch (error) {
    return {
      total: 'unknown',
      used: 'unknown',
      available: 'unknown',
      usagePercent: 0,
      status: 'ok'
    }
  }
}

async function getMemoryInfo(): Promise<MemoryInfo> {
  try {
    // Get memory info - works inside containers
    const { stdout } = await execAsync("free -h | grep Mem | awk '{print $2,$3,$4}'")
    const parts = stdout.trim().split(/\s+/)

    if (parts.length >= 3) {
      // Get percentage from free -m for accuracy
      const { stdout: memPercent } = await execAsync("free | grep Mem | awk '{print int($3/$2*100)}'")
      const usagePercent = parseInt(memPercent.trim(), 10) || 0

      let status: 'ok' | 'warning' | 'critical' = 'ok'

      if (usagePercent >= MEMORY_CRITICAL_THRESHOLD) {
        status = 'critical'
      } else if (usagePercent >= MEMORY_WARNING_THRESHOLD) {
        status = 'warning'
      }

      return {
        total: parts[0],
        used: parts[1],
        available: parts[2],
        usagePercent,
        status
      }
    }

    throw new Error('Unexpected free output format')
  } catch (error) {
    return {
      total: 'unknown',
      used: 'unknown',
      available: 'unknown',
      usagePercent: 0,
      status: 'ok'
    }
  }
}

async function getDockerInfo(): Promise<DockerInfo> {
  try {
    // Check if docker CLI is available (might not be in container)
    const { stdout: imageCount } = await execAsync('docker images -q 2>/dev/null | wc -l')
    const { stdout: containerCount } = await execAsync('docker ps -aq 2>/dev/null | wc -l')

    return {
      available: true,
      images: parseInt(imageCount.trim(), 10) || 0,
      containers: parseInt(containerCount.trim(), 10) || 0
    }
  } catch {
    return {
      available: false,
      error: 'Docker CLI not available in container'
    }
  }
}

async function getUptime(): Promise<string> {
  try {
    const { stdout } = await execAsync('uptime -p 2>/dev/null || uptime')
    return stdout.trim()
  } catch {
    return 'unknown'
  }
}

export async function GET() {
  try {
    // Gather all system information in parallel
    const [disk, memory, docker, uptime] = await Promise.all([
      getDiskInfo(),
      getMemoryInfo(),
      getDockerInfo(),
      getUptime()
    ])

    // Determine overall status
    let overallStatus: 'ok' | 'warning' | 'critical' = 'ok'

    if (disk.status === 'critical' || memory.status === 'critical') {
      overallStatus = 'critical'
    } else if (disk.status === 'warning' || memory.status === 'warning') {
      overallStatus = 'warning'
    }

    const response: SystemHealthResponse = {
      status: overallStatus,
      disk,
      memory,
      docker,
      uptime,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }

    // Set appropriate status code
    const statusCode = overallStatus === 'critical' ? 503 : 200

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
