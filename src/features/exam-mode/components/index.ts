/**
 * Exam Mode Components
 *
 * Barrel export for all Exam Mode UI components.
 *
 * @see VIBE-0004B, VIBE-0004C, VIBE-0004D, VIBE-0010
 */

// Results components (VIBE-0004C)
export { ExamScoreCard } from './results/ExamScoreCard'
export { ExamResultStats } from './results/ExamResultStats'
export { ExamFeedback } from './results/ExamFeedback'
export { QuestionResultCard } from './results/QuestionResultCard'
export { QuestionResultList } from './results/QuestionResultList'
export { ResultsActions } from './results/ResultsActions'

// Analytics components (VIBE-0004C)
export { ExamOverviewStats } from './analytics/ExamOverviewStats'
export { ScoreDistributionChart } from './analytics/ScoreDistributionChart'
export { QuestionDifficultyTable } from './analytics/QuestionDifficultyTable'
export { StudentPerformanceTable } from './analytics/StudentPerformanceTable'

// Take experience components (VIBE-0004D, VIBE-0010)
export { ExamTimer, type ExamTimerLabels, defaultExamTimerLabels } from './take/ExamTimer'
export { QuestionNav, type QuestionNavLabels, defaultQuestionNavLabels } from './take/QuestionNav'
export { AnswerChoice } from './take/AnswerChoice'
export { QuestionDisplay, type QuestionDisplayLabels, defaultQuestionDisplayLabels } from './take/QuestionDisplay'
export { ExamNavButtons, type ExamNavButtonsLabels, defaultExamNavButtonsLabels } from './take/ExamNavButtons'
export { SubmitConfirmModal, type SubmitConfirmModalLabels, defaultSubmitConfirmModalLabels } from './take/SubmitConfirmModal'
export { ExamStyles } from './take/ExamStyles'
export { EmptyQuestionsMessage, type EmptyQuestionsMessageLabels, defaultEmptyQuestionsMessageLabels } from './take/EmptyQuestionsMessage'
export { TabSwitchWarning, type TabSwitchWarningLabels, defaultTabSwitchWarningLabels } from './take/TabSwitchWarning'
export { SubmitExamButton, type SubmitExamButtonLabels, defaultSubmitExamButtonLabels } from './take/SubmitExamButton'
