export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 p-8 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-3xl text-white shadow-lg">
            S
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            SMILE
          </h1>
        </div>

        <p className="max-w-md text-xl text-gray-600 dark:text-gray-300">
          Student-Made Interactive Learning Environment
        </p>

        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-6 py-4 dark:border-green-800 dark:bg-green-900/30">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Phase 1 Complete - Foundation Ready</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Next.js 16</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">App Router + RSC</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">TypeScript</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Type-safe codebase</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Prisma ORM</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">20+ models defined</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Services</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">OpenAI + Claude</p>
          </div>
        </div>

        <a
          href="/api/health"
          className="mt-4 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Check API Health
        </a>
      </main>
    </div>
  );
}
