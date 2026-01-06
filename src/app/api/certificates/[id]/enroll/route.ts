import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(
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

    // Check if certificate exists and is active
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        activities: {
          include: {
            activity: true,
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

    if (certificate.status !== 'active') {
      return NextResponse.json(
        { error: 'Certificate is not available for enrollment' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.studentCertificate.findUnique({
      where: {
        certificateId_studentId: {
          certificateId: id,
          studentId: session.user.id,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({
        message: 'Already enrolled',
        enrollment: existingEnrollment,
      })
    }

    // Create enrollment
    const enrollment = await prisma.studentCertificate.create({
      data: {
        certificateId: id,
        studentId: session.user.id,
        status: 'enrolled',
      },
    })

    return NextResponse.json({
      message: 'Successfully enrolled',
      enrollment,
    })
  } catch (error) {
    console.error('Failed to enroll:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in certificate' },
      { status: 500 }
    )
  }
}
