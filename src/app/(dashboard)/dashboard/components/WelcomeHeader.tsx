/**
 * WelcomeHeader Component
 *
 * Displays a gradient welcome banner with personalized greeting.
 * Extracted from dashboard/page.tsx as part of VIBE-0003C refactoring.
 */

interface WelcomeHeaderProps {
  userName?: string | null
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8 shadow-lg">
      <div className="flex items-center">
        <i className="fas fa-user-circle text-4xl mr-4"></i>
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName || 'User'}!</h1>
          <p className="text-blue-100 mt-1">Ready to create impactful questions and engage learners?</p>
        </div>
      </div>
    </div>
  )
}
