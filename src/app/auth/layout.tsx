export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
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
