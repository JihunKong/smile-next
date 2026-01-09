'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SystemInfo {
  version: string
  environment: string
  nodeVersion: string
  databaseStatus: 'connected' | 'disconnected' | 'error'
  redisStatus: 'connected' | 'disconnected' | 'error'
  lastDeployment: string | null
  uptime: string
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

export default function AdminSystemPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if user is admin
  const isAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 1

  useEffect(() => {
    if (session) {
      loadSystemInfo()
    }
  }, [session])

  async function loadSystemInfo() {
    try {
      setLoading(true)
      setError(null)

      // Fetch health status
      const healthRes = await fetch('/api/health')
      const healthData = await healthRes.json()

      // Fetch queue stats
      const queueRes = await fetch('/api/health/queue')
      const queueData = await queueRes.json()

      setSystemInfo({
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: '18.x',
        databaseStatus: healthData.database ? 'connected' : 'error',
        redisStatus: queueData.redis ? 'connected' : 'disconnected',
        lastDeployment: null,
        uptime: healthData.uptime || 'Unknown',
      })

      setQueueStats({
        pending: queueData.pending || 0,
        processing: queueData.processing || 0,
        completed: queueData.completed || 0,
        failed: queueData.failed || 0,
      })
    } catch (err) {
      setError('Failed to load system information')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Admin privileges required.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-indigo-600 hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600 mt-1">Monitor system health and configuration</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadSystemInfo}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Database Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Database</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      systemInfo?.databaseStatus === 'connected'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {systemInfo?.databaseStatus || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    className={`w-8 h-8 ${
                      systemInfo?.databaseStatus === 'connected'
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                  <span className="ml-3 text-lg font-semibold text-gray-900">PostgreSQL</span>
                </div>
              </div>

              {/* Redis Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Redis Queue</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      systemInfo?.redisStatus === 'connected'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {systemInfo?.redisStatus || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    className={`w-8 h-8 ${
                      systemInfo?.redisStatus === 'connected'
                        ? 'text-green-500'
                        : 'text-yellow-500'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span className="ml-3 text-lg font-semibold text-gray-900">BullMQ</span>
                </div>
              </div>

              {/* Environment */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Environment</h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {systemInfo?.environment || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                  </svg>
                  <span className="ml-3 text-lg font-semibold text-gray-900">
                    v{systemInfo?.version || '1.0.0'}
                  </span>
                </div>
              </div>

              {/* Uptime */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Uptime</h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Online
                  </span>
                </div>
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="ml-3 text-lg font-semibold text-gray-900">
                    {systemInfo?.uptime || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Queue Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Queue Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{queueStats?.pending || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{queueStats?.processing || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Processing</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{queueStats?.completed || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{queueStats?.failed || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Failed</p>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Application Version</span>
                  <span className="font-medium text-gray-900">{systemInfo?.version || '1.0.0'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Node.js Version</span>
                  <span className="font-medium text-gray-900">{systemInfo?.nodeVersion || '18.x'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Environment</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {systemInfo?.environment || 'development'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Framework</span>
                  <span className="font-medium text-gray-900">Next.js 14</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Database</span>
                  <span className="font-medium text-gray-900">PostgreSQL (Prisma ORM)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={loadSystemInfo}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
