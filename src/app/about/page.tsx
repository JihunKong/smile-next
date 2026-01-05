import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/smileq-logo.svg"
              alt="SMILE"
              width={80}
              height={80}
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--stanford-pine)] mb-4">
            About SMILE
          </h1>
          <p className="text-xl text-gray-600">
            Student-Made Interactive Learning Environment
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto prose prose-lg">
          <h2 className="text-2xl font-bold text-[var(--stanford-pine)] mb-6">
            Our Mission
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            SMILE is an innovative educational platform that transforms the way students learn
            by putting them at the center of the question-creation process. Rather than just
            answering questions, students learn to think critically by crafting meaningful
            questions themselves.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Our platform leverages AI technology to evaluate question quality using
            Bloom&apos;s Taxonomy, providing immediate feedback and helping students develop
            higher-order thinking skills. Teachers can easily manage groups, track progress,
            and facilitate collaborative learning experiences.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-[var(--stanford-pine)] text-center mb-12">
            What Makes SMILE Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Student-Driven */}
            <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-blue-500">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Student-Driven Learning</h3>
              <p className="text-gray-600 text-sm">
                Students take ownership of their learning by creating questions, fostering
                deeper understanding and critical thinking skills.
              </p>
            </div>

            {/* Teacher Facilitation */}
            <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-green-500">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Teacher Facilitation</h3>
              <p className="text-gray-600 text-sm">
                Educators can easily create groups, set up activities, and monitor student
                progress with powerful analytics tools.
              </p>
            </div>

            {/* Global Community */}
            <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-purple-500">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Global Community</h3>
              <p className="text-gray-600 text-sm">
                Join over 3 million users across 35+ countries who are transforming
                education through question-based learning.
              </p>
            </div>

            {/* Accessible Anywhere */}
            <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-yellow-500">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Accessible Anywhere</h3>
              <p className="text-gray-600 text-sm">
                Access SMILE from any device with an internet connection. Learn and
                collaborate from anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[var(--stanford-cardinal)] mb-2">
                3M+
              </div>
              <p className="text-gray-600">Students & Teachers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--stanford-cardinal)] mb-2">
                35+
              </div>
              <p className="text-gray-600">Countries</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--stanford-cardinal)] mb-2">
                10M+
              </div>
              <p className="text-gray-600">Questions Created</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-[var(--stanford-cardinal)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Learning?
          </h2>
          <p className="text-white/90 mb-8">
            Join millions of educators and students who are already using SMILE.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-block bg-white text-[var(--stanford-cardinal)] px-8 py-3 rounded-full font-semibold hover:opacity-90 transition"
            >
              Get Started Free
            </Link>
            <Link
              href="/"
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
