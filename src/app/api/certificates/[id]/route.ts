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

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        activities: {
          include: {
            activity: {
              select: {
                id: true,
                name: true,
                description: true,
                activityType: true,
              },
            },
          },
          orderBy: {
            sequenceOrder: 'asc',
          },
        },
        _count: {
          select: {
            studentCertificates: true,
          },
        },
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled
    let enrollment = null
    if (session?.user?.id) {
      const studentCertificate = await prisma.studentCertificate.findUnique({
        where: {
          certificateId_studentId: {
            certificateId: id,
            studentId: session.user.id,
          },
        },
      })

      if (studentCertificate) {
        enrollment = {
          isEnrolled: true,
          enrollmentId: studentCertificate.id,
          status: studentCertificate.status,
        }
      }
    }

    return NextResponse.json({ certificate, enrollment })
  } catch (error) {
    console.error('Failed to fetch certificate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificate' },
      { status: 500 }
    )
  }
}
