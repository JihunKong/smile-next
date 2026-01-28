'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useUserProfile } from '@/features/user'
import type { ProfileTabId, AccountFormData, FormMessage } from '@/features/user'
import {
  ProfileHeader,
  ProfileNav,
  ProfileSettingsTab,
} from '@/features/user/components/profile'
import SmileScoreTab from './components/SmileScoreTab'
import InquiryJourneyTab from './components/InquiryJourneyTab'
import CareerDirectionsTab from './components/CareerDirectionsTab'
import StrengthSummaryTab from './components/StrengthSummaryTab'
import AchievementsTab from './components/AchievementsTab'
import ContributionStatsTab from './components/ContributionStatsTab'
import ActivityTimelineTab from './components/ActivityTimelineTab'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<ProfileTabId>('smile-score')

  // Use the profile hook for data fetching and form management
  const {
    profile,
    stats,
    badges,
    isLoading,
    form,
    isSaving,
    message,
    updateForm,
    saveProfile,
    clearMessage,
    initials,
    memberSinceFormatted,
    badgeCount,
  } = useUserProfile()

  // Handler for settings tab form submission
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProfile()
  }

  // Handler for settings tab form changes
  const handleFormChange = (field: keyof AccountFormData, value: string) => {
    updateForm(field, value)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Dashboard */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:opacity-80"
            style={{ color: '#8C1515' }}
          >
            <svg
              className="w-4 h-4 inline mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Hero Profile Section */}
        <ProfileHeader
          profile={profile}
          stats={stats}
          initials={initials}
          memberSinceFormatted={memberSinceFormatted}
          badgeCount={badgeCount}
          isLoading={isLoading}
        />

        {/* Tabbed Interface */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <ProfileNav activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'smile-score' && <SmileScoreTab />}
            {activeTab === 'inquiry-journey' && <InquiryJourneyTab />}
            {activeTab === 'career-directions' && <CareerDirectionsTab />}
            {activeTab === 'strength-summary' && <StrengthSummaryTab />}
            {activeTab === 'achievements' && <AchievementsTab />}
            {activeTab === 'stats' && <ContributionStatsTab />}
            {activeTab === 'activity' && <ActivityTimelineTab />}
            {activeTab === 'settings' && (
              <ProfileSettingsTab
                profile={profile}
                form={form}
                isSaving={isSaving}
                message={message}
                onFormChange={handleFormChange}
                onSubmit={handleSettingsSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
