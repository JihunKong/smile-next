import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import {
  generateCertificateHtmlWithQR,
  type CertificatePdfData,
} from '@/lib/certificates/pdf-template'

// Type declarations for dynamic imports
type QRCodeModule = {
  toDataURL: (
    text: string,
    options?: {
      width?: number
      margin?: number
      color?: { dark?: string; light?: string }
    }
  ) => Promise<string>
}

type PuppeteerModule = {
  default: {
    launch: (options?: {
      headless?: boolean | 'new'
      args?: string[]
    }) => Promise<{
      newPage: () => Promise<{
        setContent: (html: string, options?: { waitUntil?: string }) => Promise<void>
        pdf: (options?: {
          format?: string
          landscape?: boolean
          printBackground?: boolean
          preferCSSPageSize?: boolean
          margin?: { top?: string; right?: string; bottom?: string; left?: string }
        }) => Promise<Uint8Array>
      }>
      close: () => Promise<void>
    }>
  }
}

/**
 * Generate QR code as data URL using qrcode library
 * We need to generate this server-side for PDF embedding
 */
async function generateQRCodeDataUrl(verificationCode: string): Promise<string | undefined> {
  try {
    // Dynamic import to avoid SSR issues
    const QRCode = (await import('qrcode')) as QRCodeModule
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://smile.stanford.edu'}/verify/${verificationCode}`
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    return dataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    return undefined
  }
}

/**
 * Convert image URL to base64 data URL for PDF embedding
 */
async function imageUrlToDataUrl(url: string): Promise<string | undefined> {
  try {
    // Handle local URLs
    if (url.startsWith('/')) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      url = `${baseUrl}${url}`
    }

    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${url}`)
      return undefined
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('Failed to convert image to data URL:', error)
    return undefined
  }
}

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

    // Fetch student certificate with related data
    const studentCertificate = await prisma.studentCertificate.findFirst({
      where: {
        id,
        studentId: session.user.id,
      },
      include: {
        certificate: true,
      },
    })

    if (!studentCertificate) {
      return NextResponse.json(
        { error: 'Certificate enrollment not found' },
        { status: 404 }
      )
    }

    // Verify certificate is completed
    if (studentCertificate.status !== 'completed') {
      return NextResponse.json(
        { error: 'Certificate is not yet completed. Complete all required activities first.' },
        { status: 400 }
      )
    }

    // Get student info
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Build student name
    const studentName =
      student.firstName && student.lastName
        ? `${student.firstName} ${student.lastName}`
        : student.email?.split('@')[0] || 'Student'

    const cert = studentCertificate.certificate

    // Convert image URLs to data URLs for PDF embedding
    const [logoDataUrl, signatureDataUrl, watermarkDataUrl] = await Promise.all([
      cert.logoImageUrl ? imageUrlToDataUrl(cert.logoImageUrl) : undefined,
      cert.signatureImageUrl ? imageUrlToDataUrl(cert.signatureImageUrl) : undefined,
      cert.watermarkImageUrl ? imageUrlToDataUrl(cert.watermarkImageUrl) : undefined,
    ])

    // Build PDF data
    const pdfData: CertificatePdfData = {
      certificateName: cert.name,
      organizationName: cert.organizationName || '',
      programName: cert.programName || undefined,
      studentName,
      completedAt: studentCertificate.completionDate || new Date(),
      verificationCode: studentCertificate.verificationCode,
      logoImageUrl: logoDataUrl,
      signatureImageUrl: signatureDataUrl,
      watermarkImageUrl: watermarkDataUrl,
      qrCodeEnabled: cert.qrCodeEnabled,
      signatoryName: cert.signatoryName || undefined,
      certificateStatement: cert.certificateStatement || undefined,
    }

    // Generate QR code if enabled
    let qrCodeDataUrl: string | undefined
    if (cert.qrCodeEnabled) {
      qrCodeDataUrl = await generateQRCodeDataUrl(studentCertificate.verificationCode)
    }

    // Generate HTML
    const html = generateCertificateHtmlWithQR(pdfData, qrCodeDataUrl)

    // Generate PDF using puppeteer (dynamic import for server-side only)
    let pdfBuffer: Uint8Array

    try {
      const puppeteer = (await import('puppeteer')) as PuppeteerModule
      const browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      })

      const page = await browser.newPage()

      // Set content and wait for fonts to load
      await page.setContent(html, { waitUntil: 'networkidle0' })

      // Generate PDF with A4 landscape
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      })

      await browser.close()

      pdfBuffer = pdf
    } catch (puppeteerError) {
      console.error('Puppeteer error:', puppeteerError)

      // Fallback: Return HTML for manual PDF conversion
      // This can happen if puppeteer is not installed or fails
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="certificate-${studentCertificate.verificationCode}.html"`,
        },
      })
    }

    // Generate filename
    const sanitizedName = studentName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `Certificate_${sanitizedName}_${studentCertificate.verificationCode}.pdf`

    // Return PDF - use ReadableStream for Response compatibility
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer)
        controller.close()
      },
    })
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Failed to generate certificate PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate PDF' },
      { status: 500 }
    )
  }
}
