'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ActivityData,
  BasicInfoState,
  ExamFormState,
  InquiryFormState,
  OpenModeFormState,
} from '../types'

export function useActivityEdit(activityId: string) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activity, setActivity] = useState<ActivityData | null>(null)

  // Basic info state
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>({
    name: '',
    description: '',
    level: '',
    visible: true,
    educationLevel: '',
    schoolSubject: '',
    topic: '',
    hideUsernames: false,
    isAnonymousAuthorAllowed: false,
  })

  // Exam settings state
  const [examState, setExamState] = useState<ExamFormState>({
    timeLimitMinutes: 60,
    passingThreshold: 70,
    maxAttempts: 1,
    allowReattempts: false,
    showFeedback: true,
    showLeaderboard: true,
    anonymizeLeaderboard: false,
    randomizeQuestions: false,
    randomizeAnswerChoices: false,
    examQuestionCount: 25,
    isPublished: false,
    examInstructions: '',
    examStartDate: '',
    examEndDate: '',
    questionPoolSize: 0,
  })

  // Inquiry settings state
  const [inquiryState, setInquiryState] = useState<InquiryFormState>({
    inquiryShowLeaderboard: true,
    allowHints: false,
    maxHints: 3,
    inquiryIsPublished: false,
    inquiryTheme: '',
    referenceDocument: '',
    minWordCount: 10,
    maxWordCount: 500,
    qualityThreshold: 6.0,
    inquiryMaxAttempts: 3,
  })

  // Open mode settings state
  const [openModeState, setOpenModeState] = useState<OpenModeFormState>({
    isPassFailEnabled: false,
    requiredQuestionCount: 1,
    requiredAvgLevel: 2.0,
    requiredAvgScore: 5.0,
    peerRatingsRequired: 0,
    peerResponsesRequired: 0,
    openModeInstructions: '',
  })

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/activities/${activityId}/edit`)
      if (!res.ok) {
        if (res.status === 403) {
          setError('You do not have permission to edit this activity')
        } else if (res.status === 404) {
          setError('Activity not found')
        } else {
          throw new Error('Failed to load activity')
        }
        return
      }

      const data: ActivityData = await res.json()
      setActivity(data)

      // Set basic info
      setBasicInfo({
        name: data.name,
        description: data.description || '',
        level: data.level || '',
        visible: data.visible,
        educationLevel: data.educationLevel || '',
        schoolSubject: data.schoolSubject || '',
        topic: data.topic || '',
        hideUsernames: data.hideUsernames,
        isAnonymousAuthorAllowed: data.isAnonymousAuthorAllowed,
      })

      // Set exam settings
      if (data.examSettings) {
        setExamState({
          timeLimitMinutes: data.examSettings.time_limit_minutes || 60,
          passingThreshold: data.examSettings.passing_threshold || 70,
          maxAttempts: data.examSettings.max_attempts || 1,
          allowReattempts: data.examSettings.allow_reattempts || false,
          showFeedback: data.examSettings.show_feedback !== false,
          showLeaderboard: data.examSettings.show_leaderboard !== false,
          anonymizeLeaderboard: data.examSettings.anonymize_leaderboard || false,
          randomizeQuestions: data.examSettings.randomize_questions || false,
          randomizeAnswerChoices: data.examSettings.randomize_answer_choices || false,
          examQuestionCount: data.examSettings.exam_question_count || 25,
          isPublished: data.examSettings.is_published || false,
          examInstructions: data.examSettings.instructions || '',
          examStartDate: '',
          examEndDate: '',
          questionPoolSize: 0,
        })
      }

      // Set inquiry settings
      if (data.inquirySettings) {
        setInquiryState((prev) => ({
          ...prev,
          inquiryShowLeaderboard: data.inquirySettings!.show_leaderboard !== false,
          allowHints: data.inquirySettings!.allow_hints || false,
          maxHints: data.inquirySettings!.max_hints || 3,
          inquiryIsPublished: data.inquirySettings!.is_published !== false,
        }))
      }

      // Set open mode settings
      if (data.openModeSettings) {
        setOpenModeState({
          isPassFailEnabled: data.openModeSettings.is_pass_fail_enabled || false,
          requiredQuestionCount: data.openModeSettings.required_question_count || 1,
          requiredAvgLevel: data.openModeSettings.required_avg_level || 2.0,
          requiredAvgScore: data.openModeSettings.required_avg_score || 5.0,
          peerRatingsRequired: data.openModeSettings.peer_ratings_required || 0,
          peerResponsesRequired: data.openModeSettings.peer_responses_required || 0,
          openModeInstructions: data.openModeSettings.instructions || '',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activity) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const payload: Record<string, unknown> = {
        name: basicInfo.name,
        description: basicInfo.description || null,
        level: basicInfo.level || null,
        visible: basicInfo.visible,
        educationLevel: basicInfo.educationLevel || null,
        schoolSubject: basicInfo.schoolSubject || null,
        topic: basicInfo.topic || null,
        hideUsernames: basicInfo.hideUsernames,
        isAnonymousAuthorAllowed: basicInfo.isAnonymousAuthorAllowed,
      }

      // Add mode-specific settings
      if (activity.mode === 0) {
        payload.openModeSettings = {
          is_pass_fail_enabled: openModeState.isPassFailEnabled,
          required_question_count: openModeState.requiredQuestionCount,
          required_avg_level: openModeState.requiredAvgLevel,
          required_avg_score: openModeState.requiredAvgScore,
          peer_ratings_required: openModeState.peerRatingsRequired,
          peer_responses_required: openModeState.peerResponsesRequired,
          instructions: openModeState.openModeInstructions || null,
        }
      } else if (activity.mode === 1) {
        payload.examSettings = {
          time_limit_minutes: examState.timeLimitMinutes,
          passing_threshold: examState.passingThreshold,
          max_attempts: examState.maxAttempts,
          allow_reattempts: examState.allowReattempts,
          show_feedback: examState.showFeedback,
          show_leaderboard: examState.showLeaderboard,
          anonymize_leaderboard: examState.anonymizeLeaderboard,
          randomize_questions: examState.randomizeQuestions,
          randomize_answer_choices: examState.randomizeAnswerChoices,
          exam_question_count: examState.examQuestionCount,
          is_published: examState.isPublished,
          instructions: examState.examInstructions || null,
        }
      } else if (activity.mode === 2) {
        payload.inquirySettings = {
          show_leaderboard: inquiryState.inquiryShowLeaderboard,
          allow_hints: inquiryState.allowHints,
          max_hints: inquiryState.maxHints,
          is_published: inquiryState.inquiryIsPublished,
        }
      }

      const res = await fetch(`/api/activities/${activityId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return {
    // Core state
    loading,
    saving,
    error,
    success,
    activity,
    // Form state
    basicInfo,
    setBasicInfo,
    examState,
    setExamState,
    inquiryState,
    setInquiryState,
    openModeState,
    setOpenModeState,
    // Actions
    handleSubmit,
  }
}
