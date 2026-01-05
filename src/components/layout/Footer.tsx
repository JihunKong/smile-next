import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-white">SMILE</span>
              <span className="text-2xl font-bold text-white ml-4">Education</span>
            </div>
            <p className="text-gray-300 mb-4">
              Empowering educators and students worldwide with innovative tools
              for creating impactful questions and collaborative learning.
            </p>
            <p className="text-sm text-gray-400">
              SMILE has reached educators and students in over 35 countries and
              over 3,000,000 Students &amp; Teacher Users
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blooms-taxonomy"
                  className="text-gray-300 hover:text-white"
                >
                  Bloom&apos;s Taxonomy
                </Link>
              </li>
              <li>
                <Link
                  href="/research-publication"
                  className="text-gray-300 hover:text-white"
                >
                  Research
                </Link>
              </li>
              <li>
                <Link
                  href="/smile-stories"
                  className="text-gray-300 hover:text-white"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Support
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-gray-300 hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/press-media"
                  className="text-gray-300 hover:text-white"
                >
                  Press &amp; Media
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Seeds of Empowerment. All rights
            reserved.
            <span className="mx-2">&bull;</span>
            <a
              href="mailto:info@seedsofempowerment.org"
              className="text-gray-300 hover:text-white"
            >
              info@seedsofempowerment.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
