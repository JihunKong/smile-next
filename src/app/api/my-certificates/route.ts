import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const studentCertificates = await prisma.studentCertificate.findMany({
      where: {
        studentId: session.user.id,
      },
      include: {
        certificate: {
          include: {
            _count: {
              select: {
                activities: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrollmentDate: 'desc',
      },
    })

    // Calculate progress for each certificate
    const certificatesWithProgress = await Promise.all(
      studentCertificates.map(async (sc) => {
        const activities = await prisma.certificateActivity.findMany({
          where: { certificateId: sc.certificateId },
          include: {
            activity: true,
          },
        })

        // Check completion status for each activity
        let completed = 0
        for (const ca of activities) {
          // Check exam attempts
          const examAttempt = await prisma.examAttempt.findFirst({
            where: {
              userId: session.user.id,
              activityId: ca.activityId,
              status: 'completed',
              passed: true,
            },
          })

          // Check inquiry attempts
          const inquiryAttempt = await prisma.inquiryAttempt.findFirst({
            where: {
              userId: session.user.id,
              activityId: ca.activityId,
              status: 'completed',
            },
          })

          // Check case attempts
          const caseAttempt = await prisma.caseAttempt.findFirst({
            where: {
              userId: session.user.id,
              activityId: ca.activityId,
              status: 'completed',
              passed: true,
            },
          })

          if (examAttempt || inquiryAttempt || caseAttempt) {
            completed++
          }
        }

        const total = activities.length
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
          ...sc,
          progress: {
            completed,
            total,
            percentage,
          },
        }
      })
    )

    return NextResponse.json({ certificates: certificatesWithProgress })
  } catch (error) {
    console.error('Failed to fetch my certificates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}
