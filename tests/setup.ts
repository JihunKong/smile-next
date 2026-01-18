/**
 * Global test setup file for Vitest
 * This file runs before all tests
 * @see https://vitest.dev/config/#setupfiles
 */

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test (e.g., unmount React components)
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js image component (returns a simple img element)
vi.mock('next/image', () => ({
  default: (props: any) => {
    // Return a plain object that can be rendered as img
    return { type: 'img', props }
  },
}))

// Suppress console errors in tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   error: vi.fn(),
//   warn: vi.fn(),
// }
