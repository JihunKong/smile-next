'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  isRead: boolean
  isAnonymous: boolean
  createdAt: string
}

export default function MessagesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?type=${activeTab}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      setIsLoading(true)
      fetchMessages()
    }
  }, [session, activeTab])

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, { method: 'POST' })
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const unreadCount = messages.filter((m) => !m.isRead).length

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your messages.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2E2D29]">Messages</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up!'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/messages/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === 'inbox'
                    ? 'border-[#8C1515] text-[#8C1515]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Inbox
                {unreadCount > 0 && (
                  <span className="ml-2 bg-[#8C1515] text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === 'sent'
                    ? 'border-[#8C1515] text-[#8C1515]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sent
              </button>
            </nav>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
              <p className="text-gray-500">
                {activeTab === 'inbox'
                  ? "You don't have any messages yet."
                  : "You haven't sent any messages yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    if (!message.isRead) markAsRead(message.id)
                    router.push(`/messages/${message.id}`)
                  }}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !message.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-[#8C1515] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {message.isAnonymous
                        ? '?'
                        : message.senderName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${!message.isRead ? 'font-semibold' : ''} text-gray-900`}>
                          {message.isAnonymous ? 'Anonymous' : message.senderName}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm ${!message.isRead ? 'text-gray-900' : 'text-gray-600'} truncate`}>
                        {message.content}
                      </p>
                    </div>
                    {!message.isRead && (
                      <div className="w-2 h-2 bg-[#8C1515] rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
