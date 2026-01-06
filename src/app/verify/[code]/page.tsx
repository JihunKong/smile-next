import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface VerifyPageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { code } = await params
  return {
    title: `Verify Certificate - ${code} | SMILE`,
    description: 'Verify the authenticity of a SMILE certificate',
  }
}

async function getCertificateByCode(code: string) {
  try {
    const studentCertificate = await prisma.studentCertificate.findUnique({
      where: { verificationCode: code },
      include: {
        certificate: {
          include: {
            activities: {
              include: {
                activity: true,
              },
            },
          },
        },
      },
    })

    if (!studentCertificate) return null

    // Get student info
    const student = await prisma.user.findUnique({
      where: { id: studentCertificate.studentId },
      select: {
        firstName: true,
        lastName: true,
      },
    })

    return {
      ...studentCertificate,
      student,
    }
  } catch {
    return null
  }
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params
  const data = await getCertificateByCode(code)

  if (!data || data.status !== 'completed') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
            <p className="text-gray-600 mb-6">
              The certificate with verification code <code className="bg-gray-100 px-2 py-1 rounded">{code}</code> could not be verified.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">Possible reasons:</h3>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>The verification code may be incorrect</li>
                <li>The certificate program may not be completed</li>
                <li>The certificate may have been revoked</li>
              </ul>
            </div>

            <div className="space-y-4">
              <form className="flex max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Enter verification code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#8C1515] text-white rounded-r-lg hover:opacity-90"
                >
                  Verify
                </button>
              </form>
              <div className="flex justify-center space-x-4 text-sm">
                <Link href="/" className="text-[#8C1515] hover:underline">
                  Home
                </Link>
                <Link href="/certificates" className="text-[#8C1515] hover:underline">
                  Browse Certificates
                </Link>
                <Link href="/contact" className="text-[#8C1515] hover:underline">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { certificate, student, completionDate } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Verified Badge */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Certificate Verified</h1>
          <p className="text-green-700">
            This certificate is authentic and was issued by SMILE Platform.
          </p>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#8C1515] to-[#B83A4B] p-8 text-white text-center">
            {certificate.logoImageUrl && (
              <img
                src={certificate.logoImageUrl}
                alt={certificate.name}
                className="h-16 mx-auto mb-4"
              />
            )}
            <h2 className="text-3xl font-bold mb-2">{certificate.name}</h2>
            {certificate.organizationName && (
              <p className="text-white/80">{certificate.organizationName}</p>
            )}
          </div>

          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">This certifies that</p>
            <h3 className="text-2xl font-bold text-[#2E2D29] mb-4">
              {student?.firstName} {student?.lastName}
            </h3>
            <p className="text-gray-600 mb-6">
              has successfully completed all requirements for
            </p>
            {certificate.programName && (
              <p className="text-xl font-semibold text-[#8C1515] mb-6">
                {certificate.programName}
              </p>
            )}
            {certificate.certificateStatement && (
              <p className="text-gray-700 italic mb-6">
                &quot;{certificate.certificateStatement}&quot;
              </p>
            )}
          </div>
        </div>

        {/* Verification Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-[#2E2D29] mb-4">Verification Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Certificate Holder</p>
              <p className="font-medium text-gray-900">
                {student?.firstName} {student?.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Program</p>
              <p className="font-medium text-gray-900">
                {certificate.programName || certificate.name}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Completion Date</p>
              <p className="font-medium text-gray-900">
                {completionDate
                  ? new Date(completionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Verification Code</p>
              <p className="font-medium text-gray-900 font-mono">{code}</p>
            </div>
            <div>
              <p className="text-gray-500">Organization</p>
              <p className="font-medium text-gray-900">
                {certificate.organizationName || 'SMILE Platform'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Activities Completed</p>
              <p className="font-medium text-gray-900">{certificate.activities.length}</p>
            </div>
          </div>
        </div>

        {/* Program Requirements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[#2E2D29] mb-4">Program Requirements</h3>
          <div className="space-y-2">
            {certificate.activities
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center p-3 bg-green-50 rounded-lg"
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">
                    {index + 1}. {item.activity.name}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Verified on {new Date().toLocaleDateString()}</p>
          <p className="mt-2">
            For questions about this certificate, please{' '}
            <Link href="/contact" className="text-[#8C1515] hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
