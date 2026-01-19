'use client'

import { useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAntiCheat, type AntiCheatStats } from '@/hooks/useAntiCheat'
import { updateCaseCheatingStats } from '../actions'
import {
  useCaseAttempt,
  GradingRubric,
  AutoSubmitModal,
  EvaluatingScreen,
  SaveToast,
  CaseTimer,
  CaseNavigator,
} from '@/features/case-mode'
import type { CaseScenario, ScenarioResponse } from '@/features/case-mode'

interface CaseTakeClientProps {
  activityId: string
  activityName: string
  groupName: string
  attemptId: string
  scenarios: CaseScenario[]
  timePerCase: number
  totalTimeLimit: number
  passThreshold: number
  maxAttempts: number
  attemptsUsed: number
  savedResponses: Record<string, ScenarioResponse>
  startedAt: string
  instructions?: string
}

export function CaseTakeClient({
  activityId,
  activityName,
  attemptId,
  scenarios,
  timePerCase,
  totalTimeLimit,
  passThreshold,
  savedResponses: initialResponses,
  startedAt,
  instructions,
}: CaseTakeClientProps) {
  // Use the extracted case attempt hook
  const {
    currentIndex,
    currentScenario,
    goToNext,
    goToPrevious,
    goToIndex,
    responses,
    currentResponse,
    updateResponse,
    caseTimeRemaining,
    totalTimeRemaining,
    formatTime,
    showEvaluating,
    evaluationProgress,
    evaluationMessage,
    confirmSubmit,
    showAutoSubmitModal,
    handleAutoSubmitContinue,
    showSaveToast,
  } = useCaseAttempt({
    activityId,
    attemptId,
    scenarios,
    timePerCase,
    totalTimeLimit,
    initialResponses,
    startedAt,
  })

  // Anti-cheating integration
  const lastSyncedStats = useRef<AntiCheatStats | null>(null)

  const handleStatsChange = useCallback(
    async (stats: AntiCheatStats) => {
      if (
        lastSyncedStats.current &&
        stats.events.length === lastSyncedStats.current.events.length
      ) {
        return
      }

      const lastEventCount = lastSyncedStats.current?.events.length || 0
      const newEvents = stats.events.slice(lastEventCount)

      if (newEvents.length > 0) {
        await updateCaseCheatingStats(attemptId, {
          tabSwitchCount: stats.tabSwitchCount,
          copyAttempts: stats.copyAttempts,
          pasteAttempts: stats.pasteAttempts,
          cheatingFlags: newEvents.map((e) => ({ type: e.type, timestamp: e.timestamp })),
        })
      }

      lastSyncedStats.current = stats
    },
    [attemptId]
  )

  useAntiCheat({
    enabled: true,
    onStatsChange: handleStatsChange,
    preventPaste: false,
    showWarningOnTabSwitch: true,
  })

  // Empty scenarios state
  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">이 케이스 학습에 사용 가능한 시나리오가 없습니다.</p>
          <Link
            href={`/activities/${activityId}`}
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            활동으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Anti-cheating CSS */}
      <style jsx global>{`
        .case-scenario-content, .scenario-text, .case-content, #caseTitle, #caseDomain, #caseContent {
          -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none;
        }
        textarea, input[type="text"] {
          -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important;
        }
      `}</style>

      {/* Modals and Toasts */}
      {showAutoSubmitModal && <AutoSubmitModal onContinue={handleAutoSubmitContinue} />}
      <SaveToast show={showSaveToast} />

      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/activities/${activityId}`} className="text-gray-500 hover:text-gray-700 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <p className="text-xs text-indigo-600 font-medium">케이스 학습 모드</p>
                <h1 className="font-semibold text-gray-900 truncate max-w-xs">{activityName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-indigo-600">{currentIndex + 1}</span>
                <span>/</span>
                <span>{scenarios.length}</span>
                <span className="text-gray-400">케이스</span>
              </div>

              <CaseTimer timeRemaining={caseTimeRemaining} formatTime={formatTime} />

              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                <span>전체:</span>
                <span className="font-medium">{formatTime(totalTimeRemaining)}</span>
              </div>

              <button
                onClick={confirmSubmit}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-4 rounded-lg text-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">제출하기</span>
              </button>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div className="bg-indigo-600 h-1 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Instructions */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 rounded-lg p-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">케이스 학습 안내</h3>
              {instructions && (
                <div className="bg-white border border-indigo-100 rounded p-3 mb-3 text-sm text-gray-700">
                  <p className="whitespace-pre-wrap">{instructions}</p>
                </div>
              )}
              <div className="text-sm text-indigo-800 space-y-1">
                <p><span className="font-semibold">{scenarios.length}개</span>의 비즈니스 케이스 시나리오를 분석합니다.</p>
                <ul className="list-disc ml-5 text-indigo-700">
                  <li>시나리오의 핵심 문제점을 파악하세요</li>
                  <li>구체적이고 실행 가능한 해결책을 제시하세요</li>
                  <li>케이스별 제한 시간: <span className="font-semibold">{timePerCase}분</span></li>
                  <li>4가지 기준으로 평가됩니다 (이해도, 창의성, 비판적 사고, 실제 적용)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <GradingRubric passThreshold={passThreshold} />

        {showEvaluating ? (
          <EvaluatingScreen progress={evaluationProgress} message={evaluationMessage} />
        ) : (
          <>
            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Case <span className="text-indigo-600">{currentIndex + 1}</span> of <span>{scenarios.length}</span>
                </span>
                <div className="flex items-center gap-4">
                  <CaseTimer timeRemaining={caseTimeRemaining} formatTime={formatTime} variant="inline" />
                  <button onClick={confirmSubmit} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm" style={{ backgroundColor: '#059669' }}>
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit All Cases
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }} />
              </div>
            </div>

            {/* Case Content */}
            {currentScenario && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 case-scenario-content">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 id="caseTitle" className="text-2xl font-bold text-gray-900 scenario-text">{currentScenario.title}</h2>
                    {currentScenario.domain && (
                      <span id="caseDomain" className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">{currentScenario.domain}</span>
                    )}
                  </div>
                  <div id="caseContent" className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap case-content">
                    {currentScenario.content}
                  </div>
                </div>

                {/* Response Form */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    분석 작성
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      1. 이 시나리오의 핵심 문제점은 무엇인가요?<span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={currentResponse.issues}
                      onChange={(e) => updateResponse('issues', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      rows={6}
                      placeholder="비즈니스 케이스에서 발견된 구체적인 문제점, 윤리적 이슈, 논리적 결함 등을 설명하세요..."
                      maxLength={2000}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">문제가 왜 문제인지 구체적으로 설명하세요.</p>
                      <span className={`text-xs ${currentResponse.issues.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                        {currentResponse.issues.length} / 2000자
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2. 어떤 해결책을 제안하시나요?<span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={currentResponse.solution}
                      onChange={(e) => updateResponse('solution', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      rows={6}
                      placeholder="파악한 문제를 해결하기 위한 구체적이고 실행 가능한 해결책을 제시하세요..."
                      maxLength={2000}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">실제로 구현 가능한 실용적인 해결책에 집중하세요.</p>
                      <span className={`text-xs ${currentResponse.solution.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                        {currentResponse.solution.length} / 2000자
                      </span>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goToPrevious}
                      disabled={currentIndex === 0}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      이전 케이스
                    </button>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      자동 저장 중
                    </div>
                    <button
                      onClick={currentIndex === scenarios.length - 1 ? confirmSubmit : goToNext}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                      style={{ backgroundColor: '#4f46e5' }}
                    >
                      {currentIndex === scenarios.length - 1 ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          전체 검토
                        </>
                      ) : (
                        <>
                          다음 케이스
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Case Navigator */}
            <CaseNavigator
              scenarios={scenarios}
              currentIndex={currentIndex}
              responses={responses}
              onNavigate={goToIndex}
            />
          </>
        )}
      </div>
    </div>
  )
}
