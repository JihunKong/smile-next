import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - SMILE',
  description: 'SMILE platform terms of service - agreement for using the Stanford Mobile Inquiry-based Learning Environment',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8 text-[#2E2D29]">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: August 30, 2025</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using SMILE (Stanford Mobile Inquiry-based Learning Environment), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Use of Service</h2>
              <p className="text-gray-700 mb-4">SMILE is an educational platform designed to facilitate interactive learning. You agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Use the service only for lawful, educational purposes</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Not engage in any activity that disrupts or interferes with the service</li>
                <li>Treat other users with respect and professionalism</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">User Content</h2>
              <p className="text-gray-700 mb-4">
                You retain ownership of any content you create or upload to SMILE. However, you grant us a license to use, modify, and display your content as necessary to provide the service.
              </p>
              <p className="text-gray-700 mb-4">You are responsible for ensuring that your content:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Does not violate any third-party rights</li>
                <li>Is not offensive, harmful, or inappropriate</li>
                <li>Complies with applicable laws and regulations</li>
                <li>Maintains academic integrity standards</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Educational Use</h2>
              <p className="text-gray-700 mb-4">
                SMILE is designed for educational purposes. All activities, discussions, and content should contribute to a positive learning environment.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Privacy and Data</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy-policy" className="text-[#8C1515] hover:opacity-80">
                  Privacy Policy
                </Link>{' '}
                to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                SMILE is provided &quot;as is&quot; without warranty of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Contact Information</h2>
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <Link href="mailto:info@seedsofempowerment.org" className="text-[#8C1515] hover:opacity-80">
                  info@seedsofempowerment.org
                </Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
