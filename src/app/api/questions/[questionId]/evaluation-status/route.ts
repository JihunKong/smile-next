import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { generateBloomsGuidance } from '@/lib/ai/claude'

/**
 * GET: Get AI evaluation status for a question
 * Flask-compatible endpoint: /api/questions/<question_id>/evaluation-status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params

    // Get question with evaluation
    const question = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      include: {
        evaluation: true,
        activity: {
          include: {
            owningGroup: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if user is a group member
    if (question.activity.owningGroup.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    const evaluation = question.evaluation

    // If no evaluation exists or still pending
    if (!evaluation) {
      return NextResponse.json({
        success: true,
        status: 'pending',
        evaluation: null,
      })
    }

    // Return evaluation with Flask-compatible format
    return NextResponse.json({
      success: true,
      status: evaluation.evaluationStatus || 'pending',
      evaluation: {
        overall_score: evaluation.overallScore,
        blooms_level: evaluation.bloomsLevel,
        blooms_confidence: evaluation.bloomsConfidence,
        creativity_score: evaluation.creativityScore,
        clarity_score: evaluation.clarityScore,
        relevance_score: evaluation.relevanceScore,
        complexity_score: evaluation.complexityScore,
        innovation_score: evaluation.innovationScore,
        evaluation_text: evaluation.evaluationText,
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        keywords_found: evaluation.keywordsFound || [],
        enhanced_questions: evaluation.enhancedQuestions || [],
        grade_level_alignment: evaluation.gradeLevelAlignment,
        subject_alignment: evaluation.subjectAlignment,
        curriculum_standards: evaluation.curriculumStandards || [],
        processing_time_ms: evaluation.processingTimeMs,
        completed_at: evaluation.updatedAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error('[GET /api/questions/[questionId]/evaluation-status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get evaluation status' },
      { status: 500 }
    )
  }
}

/**
 * POST: Request Tier 2 detailed guidance (on-demand)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params

    // Get question with evaluation
    const question = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      include: {
        evaluation: true,
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const evaluation = question.evaluation
    if (!evaluation || evaluation.evaluationStatus !== 'completed') {
      return NextResponse.json(
        { error: 'Evaluation not yet completed' },
        { status: 400 }
      )
    }

    // Check if Tier 2 already generated
    if (evaluation.bloomsGuidance && evaluation.tier2GeneratedAt) {
      return NextResponse.json({
        success: true,
        guidance: evaluation.bloomsGuidance,
        generatedAt: evaluation.tier2GeneratedAt.toISOString(),
      })
    }

    // Get question with activity context for Tier 2 guidance
    const questionWithContext = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        activity: true,
      },
    })

    if (!questionWithContext) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Generate Tier 2 guidance using Claude
    console.log('[Tier 2] Generating guidance for question:', questionId)

    const guidance = await generateBloomsGuidance(
      questionWithContext.content,
      evaluation.bloomsLevel || 'remember',
      {
        subject: questionWithContext.activity.schoolSubject || undefined,
        topic: questionWithContext.activity.topic || undefined,
        educationLevel: questionWithContext.activity.educationLevel || undefined,
      }
    )

    // Save the generated guidance to the database
    await prisma.questionEvaluation.update({
      where: { id: evaluation.id },
      data: {
        bloomsGuidance: JSON.parse(JSON.stringify(guidance)),
        tier2GeneratedAt: new Date(),
      },
    })

    console.log('[Tier 2] Successfully generated and saved guidance for question:', questionId)

    return NextResponse.json({
      success: true,
      guidance,
      generatedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[POST /api/questions/[questionId]/evaluation-status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to request Tier 2 guidance' },
      { status: 500 }
    )
  }
}
