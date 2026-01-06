import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // Get all active certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        status: 'active',
      },
      include: {
        _count: {
          select: {
            activities: true,
            studentCertificates: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Failed to fetch certificates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}
