import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

// Note: Navigation is rendered in RootLayout (/app/layout.tsx)
// Do NOT add Navigation here to avoid duplicate navigation bars

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session

  try {
    session = await auth()
  } catch (error) {
    console.error('[Dashboard Layout] Auth error:', error)

    // Check if it's a database connection error
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('database') ||
        errorMessage.includes('prisma') ||
        errorMessage.includes('connection')) {
      // Database connection error - show error page
      redirect(`/auth/error?error=DatabaseError&message=${encodeURIComponent('Database connection failed. Please try again later.')}`)
    }

    // Other auth errors - redirect to login
    redirect('/auth/login')
  }

  // No session - user is not logged in
  if (!session) {
    redirect('/auth/login')
  }

  // Session exists but user data is incomplete
  if (!session.user?.id) {
    console.error('[Dashboard Layout] Invalid session - missing user ID')
    redirect(`/auth/error?error=InvalidSession&message=${encodeURIComponent('Your session is invalid. Please log in again.')}`)
  }

  // Children are rendered within the RootLayout which already has Navigation
  return <>{children}</>
}
