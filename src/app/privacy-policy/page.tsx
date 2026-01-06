import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - SMILE',
  description: 'SMILE platform privacy policy - how we collect, use, and protect your information',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8 text-[#2E2D29]">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: August 30, 2025</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                SMILE (Stanford Mobile Inquiry-based Learning Environment) collects information you provide directly to us, such as when you create an account, join a group, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Account information (name, email, username)</li>
                <li>Profile information and preferences</li>
                <li>Content you create (groups, activities, responses)</li>
                <li>Communication with other users and support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Enable you to participate in interactive learning activities</li>
                <li>Facilitate communication within your learning groups</li>
                <li>Send you technical notices and support messages</li>
                <li>Conduct research to improve educational outcomes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Information Sharing</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>With other members of your learning groups (as part of the educational experience)</li>
                <li>With educational institutions for legitimate academic purposes</li>
                <li>For research purposes (anonymized and aggregated data only)</li>
                <li>As required by law or to protect our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy, please contact us at{' '}
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
