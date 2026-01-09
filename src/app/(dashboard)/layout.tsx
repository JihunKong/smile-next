import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await auth()

    if (!session) {
      redirect('/auth/login')
    }

    return <>{children}</>
  } catch (error) {
    console.error('[Dashboard Layout] Auth error:', error)
    redirect('/auth/login')
  }
}
