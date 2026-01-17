import { prisma } from '@/lib/db/prisma'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
  }
  return openaiClient
}

// Types
export interface ExamCoachingFeedback {
  attemptId: string
  performance: {
    score: number
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    percentageScore: number
  }
  sections: {
    title: string
    content: string
  }[]
  generatedAt: string
}

export interface QuestionAnalysis {
  questionText: string
  correctAnswer: string
  studentAnswer: string
  isCorrect: boolean
  explanation?: string
}

interface Choice {
  id?: string
  text: string
  isCorrect?: boolean
}

// Generate AI Coaching Feedback for Exam Attempt
export async function generateExamCoachingFeedback(
  attemptId: string,
  userId: string
): Promise<ExamCoachingFeedback | null> {
  // Get the exam attempt with activity and responses
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      activity: {
        include: {
          questions: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
      responses: {
        where: { isDeleted: false },
      },
    },
  })

  if (!attempt) return null

  // Verify ownership
  if (attempt.userId !== userId) return null

  // Build a map of question ID to student response
  const responseMap = new Map<string, { choice: string | null; isCorrect: boolean | null }>()
  for (const response of attempt.responses) {
    responseMap.set(response.questionId, {
      choice: response.choice,
      isCorrect: response.isCorrect,
    })
  }

  // Analyze each question
  const questionAnalyses: QuestionAnalysis[] = []
  let correctCount = 0

  for (const question of attempt.activity.questions) {
    const choices = (question.choices as Choice[] | null) || []
    const correctAnswers = (question.correctAnswers as string[] | null) || []
    const studentResponse = responseMap.get(question.id)

    // Find correct choice text
    const correctChoice = choices.find((c: Choice) => c.isCorrect || correctAnswers.includes(c.id || c.text))
    const correctAnswerText = correctChoice?.text || 'N/A'

    // Find student's chosen answer text
    const studentChoiceText = studentResponse?.choice
      ? choices.find((c: Choice) => c.id === studentResponse.choice || c.text === studentResponse.choice)?.text ||
        studentResponse.choice
      : 'Not answered'

    const isCorrect = studentResponse?.isCorrect ?? false
    if (isCorrect) correctCount++

    questionAnalyses.push({
      questionText: question.content,
      correctAnswer: correctAnswerText,
      studentAnswer: studentChoiceText,
      isCorrect,
      explanation: question.explanation || undefined,
    })
  }

  const totalQuestions = attempt.activity.questions.length
  const percentageScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

  // Build AI prompt
  const incorrectQuestions = questionAnalyses.filter((q) => !q.isCorrect)

  const prompt = `You are an educational coach providing feedback on an exam attempt. Analyze the following results and provide personalized coaching feedback.

Exam: ${attempt.activity.name}
Score: ${correctCount}/${totalQuestions} (${percentageScore.toFixed(1)}%)

${
  incorrectQuestions.length > 0
    ? `
Incorrect Questions:
${incorrectQuestions
  .map(
    (q, i) => `
${i + 1}. Question: ${q.questionText}
   Correct Answer: ${q.correctAnswer}
   Student's Answer: ${q.studentAnswer}
   ${q.explanation ? `Explanation: ${q.explanation}` : ''}
`
  )
  .join('\n')}`
    : 'All questions were answered correctly!'
}

Provide coaching feedback with these sections:
1. Performance Overview (2-3 sentences summarizing their performance)
2. Strengths (what they did well, even if scored low)
3. Areas for Improvement (specific concepts they need to review)
4. Study Recommendations (concrete study strategies)
5. Next Steps (actionable items for improvement)

Format as JSON:
{
  "sections": [
    {"title": "Performance Overview", "content": "..."},
    {"title": "Strengths", "content": "..."},
    {"title": "Areas for Improvement", "content": "..."},
    {"title": "Study Recommendations", "content": "..."},
    {"title": "Next Steps", "content": "..."}
  ]
}

Be encouraging but honest. Focus on growth mindset.`

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}')

    return {
      attemptId,
      performance: {
        score: attempt.score || correctCount,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
        percentageScore: Math.round(percentageScore * 10) / 10,
      },
      sections: aiResponse.sections || [],
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to generate AI coaching feedback:', error)

    // Return basic feedback without AI
    return {
      attemptId,
      performance: {
        score: attempt.score || correctCount,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
        percentageScore: Math.round(percentageScore * 10) / 10,
      },
      sections: [
        {
          title: 'Performance Overview',
          content: `You scored ${correctCount} out of ${totalQuestions} questions correctly (${percentageScore.toFixed(1)}%).`,
        },
        {
          title: 'Review Needed',
          content:
            incorrectQuestions.length > 0
              ? `Please review the ${incorrectQuestions.length} questions you missed.`
              : 'Excellent work! You answered all questions correctly.',
        },
      ],
      generatedAt: new Date().toISOString(),
    }
  }
}
