'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { deleteActivity, duplicateActivity } from '../actions'

interface DeleteActivityButtonProps {
  activityId: string
  activityName: string
}

interface ActionButtonsProps {
  activityId: string
  activityName: string
  groupId: string
  isManager: boolean
}

interface QRCodeSectionProps {
  activityId: string
  inviteUrl: string
}

// QR Code Section Component
export function QRCodeSection({ activityId, inviteUrl }: QRCodeSectionProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Failed to copy URL')
    }
  }

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `activity-${activityId}-qr.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        <i className="fas fa-qrcode mr-2 text-blue-500"></i>
        Invite via QR Code
      </h2>

      {/* QR Code Display */}
      <div ref={qrRef} className="flex justify-center mb-4 bg-white p-4 rounded-lg border">
        <svg viewBox="0 0 128 128" className="w-32 h-32">
          {/* Simple QR code placeholder - in production, use react-qr-code */}
          <rect x="0" y="0" width="128" height="128" fill="white" />
          <rect x="8" y="8" width="32" height="32" fill="black" />
          <rect x="16" y="16" width="16" height="16" fill="white" />
          <rect x="20" y="20" width="8" height="8" fill="black" />
          <rect x="88" y="8" width="32" height="32" fill="black" />
          <rect x="96" y="16" width="16" height="16" fill="white" />
          <rect x="100" y="20" width="8" height="8" fill="black" />
          <rect x="8" y="88" width="32" height="32" fill="black" />
          <rect x="16" y="96" width="16" height="16" fill="white" />
          <rect x="20" y="100" width="8" height="8" fill="black" />
          {/* Center pattern */}
          <rect x="48" y="48" width="32" height="32" fill="black" />
          <rect x="56" y="56" width="16" height="16" fill="white" />
          <rect x="60" y="60" width="8" height="8" fill="black" />
        </svg>
      </div>

      {/* Invite URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Invite Link</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inviteUrl}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg truncate"
          />
          <button
            onClick={handleCopyUrl}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-1`}></i>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownloadQR}
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
      >
        <i className="fas fa-download mr-2"></i>
        Download QR Code
      </button>
    </section>
  )
}

// Action Buttons Component
export function ActionButtons({ activityId, activityName, groupId, isManager }: ActionButtonsProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/activities/${activityId}/export-csv`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activityName.replace(/\s+/g, '_')}_questions.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Failed to export CSV')
      }
    } catch {
      alert('Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDuplicate = async () => {
    if (!confirm(`Duplicate activity "${activityName}"?`)) return
    setIsDuplicating(true)
    try {
      const result = await duplicateActivity(activityId)
      if (result.success && result.newActivityId) {
        router.push(`/activities/${result.newActivityId}`)
      } else {
        alert(result.error || 'Failed to duplicate activity')
      }
    } catch {
      alert('Failed to duplicate activity')
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleGenerateAIQuestions = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/activities/${activityId}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 }),
      })
      if (response.ok) {
        router.refresh()
        alert('5 questions generated successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to generate questions')
      }
    } catch {
      alert('Failed to generate questions')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isManager) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Leaderboard */}
      <a
        href={`/activities/${activityId}/leaderboard`}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg hover:bg-yellow-200 transition"
      >
        <i className="fas fa-trophy"></i>
        Leaderboard
      </a>

      {/* Export CSV */}
      <button
        onClick={handleExportCSV}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-lg hover:bg-green-200 transition disabled:opacity-50"
      >
        <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-csv'}`}></i>
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </button>

      {/* Add 5 Questions (AI) */}
      <button
        onClick={handleGenerateAIQuestions}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 text-sm font-medium rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
      >
        <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
        {isGenerating ? 'Generating...' : 'Add 5 Questions (AI)'}
      </button>

      {/* Duplicate */}
      <button
        onClick={handleDuplicate}
        disabled={isDuplicating}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
      >
        <i className={`fas ${isDuplicating ? 'fa-spinner fa-spin' : 'fa-copy'}`}></i>
        {isDuplicating ? 'Duplicating...' : 'Duplicate'}
      </button>
    </div>
  )
}

export function DeleteActivityButton({ activityId, activityName }: DeleteActivityButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function handleDelete() {
    if (confirmText !== activityName) {
      alert('Please type the activity name to confirm deletion')
      return
    }
    setIsLoading(true)
    const result = await deleteActivity(activityId)
    if (result.success) {
      router.push('/activities')
    } else {
      alert(result.error || 'Failed to delete activity')
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Activity</h3>
          <p className="text-gray-600 mb-4">
            This action cannot be undone. All questions and data in this activity will be permanently deleted.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Type <strong>{activityName}</strong> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            placeholder="Type activity name to confirm"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowConfirm(false)
                setConfirmText('')
              }}
              className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading || confirmText !== activityName}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete Activity'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/80 text-white font-medium rounded-lg hover:bg-red-600 transition"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete Activity
    </button>
  )
}
