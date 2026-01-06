import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const studentCertificate = await prisma.studentCertificate.findFirst({
      where: {
        id,
        studentId: session.user.id,
      },
      include: {
        certificate: {
          include: {
            activities: {
              include: {
                activity: true,
              },
              orderBy: {
                sequenceOrder: 'asc',
              },
            },
          },
        },
      },
    })

    if (!studentCertificate) {
      return NextResponse.json(
        { error: 'Certificate enrollment not found' },
        { status: 404 }
      )
    }

    // Calculate progress for each activity
    const activitiesWithProgress = await Promise.all(
      studentCertificate.certificate.activities.map(async (ca) => {
        // Check exam attempts
        const examAttempt = await prisma.examAttempt.findFirst({
          where: {
            userId: session.user.id,
            activityId: ca.activityId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Check inquiry attempts
        const inquiryAttempt = await prisma.inquiryAttempt.findFirst({
          where: {
            userId: session.user.id,
            activityId: ca.activityId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Check case attempts
        const caseAttempt = await prisma.caseAttempt.findFirst({
          where: {
            userId: session.user.id,
            activityId: ca.activityId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Determine status
        let status: 'not_started' | 'in_progress' | 'completed' = 'not_started'
        let score: number | undefined

        if (examAttempt) {
          if (examAttempt.status === 'completed' && examAttempt.passed) {
            status = 'completed'
            score = examAttempt.score || undefined
          } else if (examAttempt.status === 'in_progress') {
            status = 'in_progress'
          } else if (examAttempt.status === 'completed') {
            status = 'in_progress' // Failed, need to retry
            score = examAttempt.score || undefined
          }
        }

        if (inquiryAttempt) {
          if (inquiryAttempt.status === 'completed') {
            status = 'completed'
          } else if (inquiryAttempt.status === 'in_progress') {
            status = 'in_progress'
          }
        }

        if (caseAttempt) {
          if (caseAttempt.status === 'completed' && caseAttempt.passed) {
            status = 'completed'
            score = caseAttempt.totalScore || undefined
          } else if (caseAttempt.status === 'in_progress') {
            status = 'in_progress'
          } else if (caseAttempt.status === 'completed') {
            status = 'in_progress' // Failed, need to retry
            score = caseAttempt.totalScore || undefined
          }
        }

        return {
          id: ca.id,
          activity: {
            id: ca.activity.id,
            name: ca.activity.name,
            description: ca.activity.description,
            activityType: ca.activity.activityType,
            owningGroupId: ca.activity.owningGroupId,
          },
          sequenceOrder: ca.sequenceOrder,
          required: ca.required,
          status,
          score,
        }
      })
    )

    // Calculate overall progress
    const completed = activitiesWithProgress.filter((a) => a.status === 'completed').length
    const inProgress = activitiesWithProgress.filter((a) => a.status === 'in_progress').length
    const notStarted = activitiesWithProgress.filter((a) => a.status === 'not_started').length
    const total = activitiesWithProgress.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    // Update certificate status if completed
    if (completed === total && total > 0 && studentCertificate.status !== 'completed') {
      await prisma.studentCertificate.update({
        where: { id },
        data: {
          status: 'completed',
          completionDate: new Date(),
        },
      })
      studentCertificate.status = 'completed'
      studentCertificate.completionDate = new Date()
    }

    return NextResponse.json({
      id: studentCertificate.id,
      status: studentCertificate.status,
      enrollmentDate: studentCertificate.enrollmentDate,
      completionDate: studentCertificate.completionDate,
      verificationCode: studentCertificate.verificationCode,
      certificate: {
        id: studentCertificate.certificate.id,
        name: studentCertificate.certificate.name,
        organizationName: studentCertificate.certificate.organizationName,
        programName: studentCertificate.certificate.programName,
        certificateStatement: studentCertificate.certificate.certificateStatement,
        logoImageUrl: studentCertificate.certificate.logoImageUrl,
      },
      activities: activitiesWithProgress,
      progress: {
        completed,
        inProgress,
        notStarted,
        total,
        percentage,
      },
    })
  } catch (error) {
    console.error('Failed to fetch progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
