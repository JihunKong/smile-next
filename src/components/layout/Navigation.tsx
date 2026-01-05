'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
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
          <div className="hidden md:flex items-center space-x-8">
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
                <Link
                  href="/tools"
                  className="text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Tools
                </Link>
                <Link
                  href="/profile"
                  className="text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-white px-4 py-2 rounded-md hover:opacity-80"
                  style={{ backgroundColor: 'var(--stanford-cardinal)' }}
                >
                  Logout
                </button>
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
          <div className="md:hidden flex items-center">
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
                <Link
                  href="/tools"
                  className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Tools
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-[var(--stanford-pine)] hover:opacity-80"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-3 py-2 text-[var(--stanford-cardinal)] hover:opacity-80"
                >
                  Logout
                </button>
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
