/**
 * CommunityFeed Component
 *
 * Displays community activity "buzz" with static/placeholder data.
 * Shows recent community member activities and weekly challenge.
 *
 * Extracted as part of VIBE-0003E refactoring.
 */

import Link from 'next/link'

interface CommunityFeedProps {
  totalQuestions: number
}

// Static community data (could be made dynamic in a future enhancement)
const COMMUNITY_MEMBERS = [
  {
    initials: 'SC',
    name: 'Dr. Sarah Chen',
    color: 'blue',
    content: (
      <>
        earned the <span className="text-yellow-600">🏆 Research Master</span> badge
      </>
    ),
    detail: '15 minutes ago • 10 questions with perfect AI scores',
  },
  {
    initials: 'MR',
    name: 'Marcus Rodriguez',
    color: 'green',
    content: (
      <>
        asked <em>&quot;How will quantum computing change cryptography?&quot;</em>
      </>
    ),
    detail: '2 hours ago • 7 responses already',
  },
]

export function CommunityFeed({ totalQuestions }: CommunityFeedProps) {
  const streakDays = totalQuestions > 1 ? 25 : 7
  const participantCount = totalQuestions > 0 ? 156 : 89

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <i className="fas fa-globe text-green-500 mr-2"></i>Community Buzz
        </h2>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
      </div>

      <div className="space-y-4">
        {/* Static community member activities */}
        {COMMUNITY_MEMBERS.map((member) => (
          <CommunityMemberItem key={member.initials} member={member} />
        ))}

        {/* Emma Johnson - dynamic streak */}
        <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
            EJ
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-900">
              <strong>Emma Johnson</strong> started a {streakDays}-day learning streak!
            </div>
            <div className="text-xs text-gray-500 mt-1">4 hours ago • Corporate Training track</div>
          </div>
        </div>

        {/* Prof. Ahmed Hassan */}
        <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-medium">
            AH
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-900">
              <strong>Prof. Ahmed Hassan</strong> shared insights on{' '}
              <em>&quot;Critical thinking in education&quot;</em>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              6 hours ago • Philosophy Department • 12 likes
            </div>
          </div>
        </div>

        {/* Weekly Challenge */}
        <WeeklyChallenge participantCount={participantCount} />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <div className="text-sm text-gray-600">
          <span className="text-green-600 font-semibold">847</span> active learners this week
          <div className="text-xs text-gray-500 mt-1">Join the conversation!</div>
        </div>
      </div>
    </div>
  )
}

interface CommunityMember {
  initials: string
  name: string
  color: string
  content: React.ReactNode
  detail: string
}

function CommunityMemberItem({ member }: { member: CommunityMember }) {
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div
        className={`w-8 h-8 bg-${member.color}-100 rounded-full flex items-center justify-center text-${member.color}-600 text-sm font-medium`}
      >
        {member.initials}
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-900">
          <strong>{member.name}</strong> {member.content}
        </div>
        <div className="text-xs text-gray-500 mt-1">{member.detail}</div>
      </div>
    </div>
  )
}

function WeeklyChallenge({ participantCount }: { participantCount: number }) {
  return (
    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="text-sm text-gray-900 text-center">
        <span className="text-blue-600 font-semibold">🎯 Weekly Challenge:</span> &quot;Subject
        Explorer&quot;
      </div>
      <div className="text-xs text-gray-600 text-center mt-1">
        {participantCount} participants • 3 days left
      </div>
      <div className="text-center mt-2">
        <Link
          href="/dashboard/join-challenge"
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors inline-block"
        >
          Join Challenge
        </Link>
      </div>
    </div>
  )
}
