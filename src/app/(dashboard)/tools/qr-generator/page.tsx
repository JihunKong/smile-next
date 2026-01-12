'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

type QRType = 'group' | 'activity' | 'question'

interface SelectItem {
  id: string
  name: string
  subtitle?: string
}

export default function QRGeneratorPage() {
  const { data: session } = useSession()
  const [qrType, setQrType] = useState<QRType>('group')
  const [selectedId, setSelectedId] = useState('')
  const [items, setItems] = useState<SelectItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Fetch items based on QR type
  useEffect(() => {
    const fetchItems = async () => {
      if (!session) return
      setIsLoading(true)
      setSelectedId('')
      setGeneratedUrl('')

      try {
        let endpoint = ''
        switch (qrType) {
          case 'group':
            endpoint = '/api/groups/my-teachable'
            break
          case 'activity':
            endpoint = '/api/activities?teachable=true'
            break
          case 'question':
            endpoint = '/api/questions/my?limit=50'
            break
        }

        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()

          let mappedItems: SelectItem[] = []
          if (qrType === 'group') {
            mappedItems = (data.groups || []).map((g: { id: string; name: string }) => ({
              id: g.id,
              name: g.name,
            }))
          } else if (qrType === 'activity') {
            mappedItems = (data.activities || []).map((a: { id: string; name: string; groupName?: string }) => ({
              id: a.id,
              name: a.name,
              subtitle: a.groupName,
            }))
          } else {
            mappedItems = (data.questions || []).map((q: { id: string; content: string; activityName?: string }) => ({
              id: q.id,
              name: q.content.substring(0, 50) + (q.content.length > 50 ? '...' : ''),
              subtitle: q.activityName,
            }))
          }
          setItems(mappedItems)
        }
      } catch (error) {
        console.error('Failed to fetch items:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [qrType, session])

  // Generate URL when item is selected
  useEffect(() => {
    if (!selectedId || !baseUrl) {
      setGeneratedUrl('')
      return
    }

    let url = ''
    switch (qrType) {
      case 'group':
        url = `${baseUrl}/groups/${selectedId}`
        break
      case 'activity':
        url = `${baseUrl}/activities/${selectedId}`
        break
      case 'question':
        url = `${baseUrl}/questions/${selectedId}`
        break
    }
    setGeneratedUrl(url)
  }, [selectedId, qrType, baseUrl])

  const downloadQR = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngUrl = canvas.toDataURL('image/png')

      const link = document.createElement('a')
      link.download = `qr-${qrType}-${selectedId}.png`
      link.href = pngUrl
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const copyUrl = async () => {
    if (!generatedUrl) return
    try {
      await navigator.clipboard.writeText(generatedUrl)
      alert('URL copied to clipboard!')
    } catch {
      alert('Failed to copy URL')
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to use the QR Generator.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tools
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QR Code Generator
          </h1>
          <p className="text-white/80 mt-1">Generate QR codes for quick access to your groups, activities, and questions</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Generate QR Code</h2>

            {/* QR Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['group', 'activity', 'question'] as QRType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setQrType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      qrType === type
                        ? 'bg-[#8C1515] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Item Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {qrType.charAt(0).toUpperCase() + qrType.slice(1)}
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-6 w-6 text-[#8C1515]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No {qrType}s found.</p>
                  <p className="text-sm mt-1">Create a {qrType} first to generate QR codes.</p>
                </div>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                >
                  <option value="">-- Select a {qrType} --</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.subtitle ? `(${item.subtitle})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Generated URL */}
            {generatedUrl && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy URL"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Display */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Preview</h2>

            <div className="flex flex-col items-center justify-center min-h-[300px]">
              {generatedUrl ? (
                <>
                  <div ref={qrRef} className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <QRCodeSVG
                      value={generatedUrl}
                      size={200}
                      level="H"
                      includeMargin={true}
                      bgColor="#FFFFFF"
                      fgColor="#2E2D29"
                    />
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={downloadQR}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#8C1515] text-white rounded-lg hover:bg-[#6D1010] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PNG
                    </button>
                    <button
                      onClick={copyUrl}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Link
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Scan this QR code to access the {qrType} directly
                  </p>
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p>Select a {qrType} to generate a QR code</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Select Type</h3>
                <p className="text-sm text-gray-600">Choose whether to create a QR for a group, activity, or question.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Choose Item</h3>
                <p className="text-sm text-gray-600">Select the specific item you want to generate a QR code for.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Download & Share</h3>
                <p className="text-sm text-gray-600">Download the QR code as PNG or share the link directly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
