import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import {
  uploadCertificateLogo,
  uploadCertificateWatermark,
  uploadCertificateSignature,
  deleteCertificateImage,
  validateImageFile,
} from '@/lib/file-upload'

type ImageType = 'logo' | 'watermark' | 'signature'

const IMAGE_FIELD_MAP: Record<ImageType, string> = {
  logo: 'logoImageUrl',
  watermark: 'watermarkImageUrl',
  signature: 'signatureImageUrl',
}

/**
 * POST /api/certificates/[id]/images
 * Upload a certificate image (logo, watermark, or signature)
 *
 * Form fields:
 * - file: The image file
 * - type: 'logo' | 'watermark' | 'signature'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found or not authorized' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const imageType = formData.get('type') as ImageType | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!imageType || !['logo', 'watermark', 'signature'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be: logo, watermark, or signature' },
        { status: 400 }
      )
    }

    // Validate file
    const validationError = validateImageFile({ type: file.type, size: file.size }, 5)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Delete old image if exists
    const fieldName = IMAGE_FIELD_MAP[imageType] as keyof typeof certificate
    const oldImageUrl = certificate[fieldName] as string | null
    if (oldImageUrl) {
      await deleteCertificateImage(oldImageUrl)
    }

    // Upload new image based on type
    let imageUrl: string
    switch (imageType) {
      case 'logo':
        imageUrl = await uploadCertificateLogo(buffer, file.name, file.type)
        break
      case 'watermark':
        imageUrl = await uploadCertificateWatermark(buffer, file.name, file.type)
        break
      case 'signature':
        imageUrl = await uploadCertificateSignature(buffer, file.name, file.type)
        break
    }

    // Update certificate record
    await prisma.certificate.update({
      where: { id },
      data: {
        [IMAGE_FIELD_MAP[imageType]]: imageUrl,
      },
    })

    return NextResponse.json({
      message: `${imageType} image uploaded successfully`,
      imageUrl,
      type: imageType,
    })
  } catch (error) {
    console.error('Failed to upload certificate image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/certificates/[id]/images
 * Remove a certificate image (logo, watermark, or signature)
 *
 * Query params:
 * - type: 'logo' | 'watermark' | 'signature'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get image type from query params
    const { searchParams } = new URL(request.url)
    const imageType = searchParams.get('type') as ImageType | null

    if (!imageType || !['logo', 'watermark', 'signature'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be: logo, watermark, or signature' },
        { status: 400 }
      )
    }

    // Check if user owns this certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found or not authorized' },
        { status: 404 }
      )
    }

    // Get current image URL
    const fieldName = IMAGE_FIELD_MAP[imageType] as keyof typeof certificate
    const imageUrl = certificate[fieldName] as string | null

    if (!imageUrl) {
      return NextResponse.json(
        { error: `No ${imageType} image to delete` },
        { status: 400 }
      )
    }

    // Delete file from storage
    await deleteCertificateImage(imageUrl)

    // Update certificate record
    await prisma.certificate.update({
      where: { id },
      data: {
        [IMAGE_FIELD_MAP[imageType]]: null,
      },
    })

    return NextResponse.json({
      message: `${imageType} image deleted successfully`,
      type: imageType,
    })
  } catch (error) {
    console.error('Failed to delete certificate image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/certificates/[id]/images
 * Get all certificate images
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this certificate or is enrolled
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      select: {
        id: true,
        creatorId: true,
        logoImageUrl: true,
        watermarkImageUrl: true,
        signatureImageUrl: true,
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Only certificate creator can view all images
    if (certificate.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to view certificate images' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      logo: certificate.logoImageUrl,
      watermark: certificate.watermarkImageUrl,
      signature: certificate.signatureImageUrl,
    })
  } catch (error) {
    console.error('Failed to get certificate images:', error)
    return NextResponse.json(
      { error: 'Failed to get images' },
      { status: 500 }
    )
  }
}
