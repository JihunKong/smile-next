import type { ActivityData } from '@/app/(dashboard)/activities/[id]/edit/types'

/**
 * Shared test fixtures for useActivityEdit hook tests
 */

export const createMockActivity = (overrides: Partial<ActivityData> = {}): ActivityData => ({
  id: 'activity-123',
  name: 'Test Activity',
  description: 'A test activity description',
  activityType: 'quiz',
  mode: 0, // Open Mode
  level: 'Intermediate',
  visible: true,
  educationLevel: 'High School',
  schoolSubject: 'Mathematics',
  topic: 'Algebra',
  hideUsernames: false,
  isAnonymousAuthorAllowed: true,
  openModeSettings: {
    is_pass_fail_enabled: true,
    required_question_count: 5,
    required_avg_level: 3.0,
    required_avg_score: 7.0,
    peer_ratings_required: 2,
    peer_responses_required: 3,
    instructions: 'Complete all questions',
  },
  examSettings: null,
  inquirySettings: null,
  owningGroup: {
    id: 'group-123',
    name: 'Test Group',
  },
  hasQuestions: false,
  hasAttempts: false,
  ...overrides,
})

export const createExamModeActivity = (): ActivityData =>
  createMockActivity({
    mode: 1,
    openModeSettings: null,
    examSettings: {
      time_limit_minutes: 45,
      passing_threshold: 80,
      max_attempts: 3,
      allow_reattempts: true,
      show_feedback: true,
      show_leaderboard: false,
      anonymize_leaderboard: true,
      randomize_questions: true,
      randomize_answer_choices: true,
      exam_question_count: 30,
      is_published: true,
      instructions: 'Read carefully',
    },
  })

export const createInquiryModeActivity = (): ActivityData =>
  createMockActivity({
    mode: 2,
    openModeSettings: null,
    inquirySettings: {
      show_leaderboard: true,
      allow_hints: true,
      max_hints: 5,
      is_published: false,
    },
  })
