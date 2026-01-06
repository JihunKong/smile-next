'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const toolsMenuRef = useRef<HTMLDivElement>(null)
  const { data: session, status } = useSession()

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setToolsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch unread message count
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchUnreadCount = async () => {
        try {
          const res = await fetch('/api/messages?type=inbox')
          if (res.ok) {
            const data = await res.json()
            const unread = data.messages?.filter((m: { isRead: boolean }) => !m.isRead).length || 0
            setUnreadCount(unread)
          }
        } catch {
          // Silently fail
        }
      }
      fetchUnreadCount()
      // Refresh every 60 seconds
      const interval = setInterval(fetchUnreadCount, 60000)
      return () => clearInterval(interval)
    }
  }, [status])

  const isAuthenticated = status === 'authenticated'

  return (
    <nav className="shadow-sm border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/smileq-logo.svg"
                alt="SMILE"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {!isAuthenticated && (
              <Link
                href="/"
                className="text-[var(--stanford-pine)] hover:opacity-80"
              >
                Home
              </Link>
            )}
            <Link
              href="/about"
              className="text-[var(--stanford-pine)] hover:opacity-80"
            >
              About
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Dashboard
                </Link>
                <Link
                  href="/groups"
                  className="text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Groups
                </Link>

                {/* Tools Dropdown */}
                <div className="relative" ref={toolsMenuRef}>
                  <button
                    onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                    className="flex items-center space-x-1 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    <span>Tools</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {toolsMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <Link
                        href="/my-results"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setToolsMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        My Results
                      </Link>
                      <Link
                        href="/leaderboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setToolsMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Leaderboard
                      </Link>
                      <Link
                        href="/certificates"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setToolsMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Certificates
                      </Link>
                    </div>
                  )}
                </div>

                {/* Notifications Bell */}
                <Link
                  href="/messages"
                  className="relative text-[var(--stanford-pine)] hover:opacity-80 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[var(--stanford-cardinal)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--stanford-cardinal)] flex items-center justify-center text-white text-sm font-medium">
                      {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-white px-4 py-2 rounded-md hover:opacity-80"
                  style={{ backgroundColor: 'var(--stanford-cardinal)' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (
              <Link
                href="/messages"
                className="relative text-[var(--stanford-pine)] hover:opacity-80 p-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[var(--stanford-cardinal)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 hover:scale-105 text-white"
              style={{
                backgroundColor: 'var(--stanford-cardinal)',
                boxShadow: '0 2px 8px rgba(140, 21, 21, 0.3)',
              }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span className="text-sm font-semibold">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {!isAuthenticated && (
              <Link
                href="/"
                className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
              >
                Home
              </Link>
            )}
            <Link
              href="/about"
              className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
            >
              About
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Dashboard
                </Link>
                <Link
                  href="/groups"
                  className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Groups
                </Link>

                {/* Tools Section */}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Tools</p>
                  <Link
                    href="/my-results"
                    className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    My Results
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/certificates"
                    className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    Certificates
                  </Link>
                  <Link
                    href="/messages"
                    className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    Messages {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                </div>

                {/* User Section */}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-3 py-2 text-[var(--stanford-cardinal)] hover:opacity-80"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 text-white rounded-md hover:opacity-80"
                  style={{ backgroundColor: 'var(--stanford-cardinal)' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
