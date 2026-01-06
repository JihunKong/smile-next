'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  avatarUrl: string | null
  totalScore: number
  totalQuestions: number
  totalExams: number
  averageScore: number | null
  badges: string[]
}

interface GroupLeaderboard {
  groupId: string
  groupName: string
  entries: LeaderboardEntry[]
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [leaderboards, setLeaderboards] = useState<GroupLeaderboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        if (response.ok) {
          const data = await response.json()
          setLeaderboards(data.leaderboards)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchLeaderboards()
    }
  }, [session])

  const filteredLeaderboards = selectedGroup === 'all'
    ? leaderboards
    : leaderboards.filter(lb => lb.groupId === selectedGroup)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2E2D29]">Leaderboard</h1>
            <p className="text-gray-600 mt-1">See how you rank among your peers</p>
          </div>
        </div>

        {/* Group Filter */}
        {leaderboards.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent text-gray-900"
            >
              <option value="all">All Groups</option>
              {leaderboards.map((lb) => (
                <option key={lb.groupId} value={lb.groupId}>
                  {lb.groupName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Leaderboards */}
        {filteredLeaderboards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leaderboard data</h3>
            <p className="text-gray-500">Join a group and complete activities to see your ranking!</p>
            <Link href="/groups" className="mt-4 inline-block text-[#8C1515] hover:underline">
              Browse Groups
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredLeaderboards.map((leaderboard) => (
              <div key={leaderboard.groupId} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-semibold text-[#2E2D29]">{leaderboard.groupName}</h2>
                </div>

                {leaderboard.entries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No participants yet in this group.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {/* Top 3 Podium */}
                    {leaderboard.entries.length >= 3 && (
                      <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
                        <div className="flex justify-center items-end gap-4">
                          {/* 2nd Place */}
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xl font-bold mb-2">
                              {leaderboard.entries[1]?.avatarUrl ? (
                                <img src={leaderboard.entries[1].avatarUrl} alt="" className="w-full h-full rounded-full" />
                              ) : (
                                leaderboard.entries[1]?.userName?.[0]?.toUpperCase() || '2'
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{leaderboard.entries[1]?.userName}</p>
                            <p className="text-xs text-gray-500">{leaderboard.entries[1]?.totalScore} pts</p>
                          </div>
                          {/* 1st Place */}
                          <div className="text-center -mt-4">
                            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 text-2xl font-bold mb-2 ring-4 ring-yellow-200">
                              {leaderboard.entries[0]?.avatarUrl ? (
                                <img src={leaderboard.entries[0].avatarUrl} alt="" className="w-full h-full rounded-full" />
                              ) : (
                                leaderboard.entries[0]?.userName?.[0]?.toUpperCase() || '1'
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{leaderboard.entries[0]?.userName}</p>
                            <p className="text-xs text-gray-500">{leaderboard.entries[0]?.totalScore} pts</p>
                          </div>
                          {/* 3rd Place */}
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-amber-600 flex items-center justify-center text-white text-xl font-bold mb-2">
                              {leaderboard.entries[2]?.avatarUrl ? (
                                <img src={leaderboard.entries[2].avatarUrl} alt="" className="w-full h-full rounded-full" />
                              ) : (
                                leaderboard.entries[2]?.userName?.[0]?.toUpperCase() || '3'
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{leaderboard.entries[2]?.userName}</p>
                            <p className="text-xs text-gray-500">{leaderboard.entries[2]?.totalScore} pts</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full List */}
                    {leaderboard.entries.map((entry) => (
                      <div
                        key={entry.userId}
                        className={`p-4 flex items-center ${
                          entry.userId === session?.user?.id ? 'bg-[#8C1515]/5' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 text-sm font-bold ${
                          entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                          entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                          entry.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#8C1515] flex items-center justify-center text-white font-medium mr-4">
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full" />
                          ) : (
                            entry.userName?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#2E2D29]">
                            {entry.userName}
                            {entry.userId === session?.user?.id && (
                              <span className="ml-2 text-xs text-[#8C1515]">(You)</span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{entry.totalQuestions} questions</span>
                            <span>{entry.totalExams} exams</span>
                            {entry.badges.length > 0 && (
                              <div className="flex gap-1">
                                {entry.badges.map((badge, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-[#8C1515]/10 text-[#8C1515] rounded">
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#8C1515]">{entry.totalScore}</p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
