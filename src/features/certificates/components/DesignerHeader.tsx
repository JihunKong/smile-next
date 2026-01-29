'use client'

import Link from 'next/link'

export function DesignerHeader() {
  return (
    <section className="bg-gradient-to-r from-[#8C1515] to-[#B83A4B] text-white py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/certificates"
          className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Certificates
        </Link>
        <h1 className="text-2xl font-bold">Certificate Designer</h1>
        <p className="text-white/80 mt-1">Create a new certificate program with visual customization</p>
      </div>
    </section>
  )
}
