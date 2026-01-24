'use client'

import { useState, useEffect } from 'react'

interface InviteLinkProps {
    groupId: string
    inviteCode: string | null
    canRegenerate?: boolean
    onRegenerate?: () => Promise<void>
}

export function InviteLink({
    groupId,
    inviteCode,
    canRegenerate = false,
    onRegenerate
}: InviteLinkProps) {
    const [copied, setCopied] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [regenerating, setRegenerating] = useState(false)
    const [inviteUrl, setInviteUrl] = useState<string | null>(null)

    useEffect(() => {
        if (inviteCode && typeof window !== 'undefined') {
            setInviteUrl(`${window.location.origin}/groups/join?code=${inviteCode}`)
        }
    }, [inviteCode])

    const copyLink = async () => {
        if (!inviteUrl) return
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleRegenerate = async () => {
        if (!onRegenerate) return
        setRegenerating(true)
        try {
            await onRegenerate()
        } finally {
            setRegenerating(false)
        }
    }

    if (!inviteCode) {
        return (
            <div className="text-sm text-gray-500">
                No invite link available
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Copy Link Button */}
            <div className="flex items-center gap-2">
                <button
                    onClick={copyLink}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    {copied ? 'Copied!' : 'Copy Invite Link'}
                </button>

                <button
                    onClick={() => setShowQR(!showQR)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="Show QR Code"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                    </svg>
                </button>

                {canRegenerate && (
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                        title="Regenerate invite link"
                    >
                        <svg className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* QR Code placeholder - would use qrcode.react in production */}
            {showQR && inviteUrl && (
                <div className="p-4 bg-white rounded-lg border inline-block">
                    <div className="w-[150px] h-[150px] bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        QR Code: {inviteCode}
                    </div>
                </div>
            )}
        </div>
    )
}
