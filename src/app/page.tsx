import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Background Image */}
      <Image
        src="/images/sbg_optimized.jpg"
        alt="SMILE Background"
        fill
        priority
        className="object-cover object-center"
        quality={85}
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-[1]" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Title */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
              Transform Learning
              <br />
              Through <span style={{ color: '#FFD700' }}>Questions</span>
            </h1>
            <div className="mb-12 max-w-3xl mx-auto">
              <p
                className="text-2xl md:text-3xl text-white font-light leading-relaxed px-8 py-4 rounded-2xl inline-block"
                style={{ backgroundColor: '#20B2AA' }}
              >
                Empower educators and students with AI-driven inquiry-based
                learning
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link
                href="/auth/signup"
                className="inline-block text-white px-12 py-5 rounded-full font-bold text-xl hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl"
                style={{ backgroundColor: '#8C1515' }}
              >
                Start Your Journey
              </Link>
              <Link
                href="/about"
                className="inline-block bg-white text-gray-900 px-12 py-5 rounded-full font-bold text-xl hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>
  )
}
