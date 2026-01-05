import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Simple Header with Logo */}
      <header className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image
              src="/smileq-logo.svg"
              alt="SMILE"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold text-[var(--stanford-pine)]">
              SMILE
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Seeds of Empowerment. All rights reserved.</p>
      </footer>
    </div>
  )
}
