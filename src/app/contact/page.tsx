'use client'

import { useState, useEffect, useRef } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const formStartTime = useRef<number>(Date.now())
  const interactionCount = useRef<number>(0)

  useEffect(() => {
    formStartTime.current = Date.now()
  }, [])

  const handleInteraction = () => {
    interactionCount.current++
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const timeTaken = Date.now() - formStartTime.current

    // Bot detection: form filled too quickly
    if (timeTaken < 3000) {
      setStatus('error')
      setStatusMessage('Please take a moment to fill out the form properly.')
      return
    }

    // Bot detection: minimal interaction
    if (interactionCount.current < 5) {
      setStatus('error')
      setStatusMessage('Please interact with the form fields.')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setStatus('success')
        setStatusMessage("Message sent successfully! We'll get back to you soon.")
        setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
        setStatusMessage(result.message || 'Failed to send message. Please try again.')
      }
    } catch {
      setStatus('error')
      setStatusMessage('Network error. Please try again later.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-[#2E2D29]">Contact Us</h1>
          <p className="text-xl text-gray-600">Get in touch with the SMILE team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29]">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    onFocus={handleInteraction}
                    onKeyDown={handleInteraction}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515]"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    onFocus={handleInteraction}
                    onKeyDown={handleInteraction}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={handleInteraction}
                  onKeyDown={handleInteraction}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515]"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  onFocus={handleInteraction}
                  onKeyDown={handleInteraction}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515]"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  onFocus={handleInteraction}
                  onKeyDown={handleInteraction}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8C1515] focus:border-[#8C1515]"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-3 bg-[#8C1515] text-white rounded-md hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            {status !== 'idle' && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  status === 'success'
                    ? 'bg-green-100 text-green-700'
                    : status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : ''
                }`}
              >
                {statusMessage}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29]">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-[#8C1515] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">Email</p>
                    <Link href="mailto:info@seedsofempowerment.org" className="text-[#8C1515] hover:opacity-80">
                      info@seedsofempowerment.org
                    </Link>
                  </div>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-[#8C1515] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <div>
                    <p className="font-medium">Website</p>
                    <p className="text-gray-600">seedsofempowerment.org</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-[#8C1515] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                  <div>
                    <p className="font-medium">Stanford Partnership</p>
                    <p className="text-gray-600">Educational Technology Research</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29]">Get Support</h2>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-[#8C1515] bg-blue-50">
                  <h3 className="font-semibold">Technical Issues</h3>
                  <p className="text-sm text-gray-600">Having trouble with the platform? Contact our support team.</p>
                </div>
                <div className="p-4 border-l-4 border-[#D2C295] bg-green-50">
                  <h3 className="font-semibold">Educational Partnerships</h3>
                  <p className="text-sm text-gray-600">Interested in partnering with SMILE? We&apos;d love to hear from you.</p>
                </div>
                <div className="p-4 border-l-4 border-[#8C1515] bg-yellow-50">
                  <h3 className="font-semibold">Research Collaboration</h3>
                  <p className="text-sm text-gray-600">Exploring educational technology research opportunities.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
