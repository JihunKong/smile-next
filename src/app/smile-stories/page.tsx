import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Success Stories - SMILE',
  description: 'Discover how SMILE is transforming education and empowering students and educators around the world.',
}

export default function SmileStoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-[#2E2D29]">Success Stories</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how SMILE is transforming education and empowering students and educators around the world.
          </p>
        </div>

        {/* Featured Story */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-lg p-8 mb-12 border-l-4 border-[#8C1515]">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white mr-4 bg-[#8C1515]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#8C1515]">Featured Success Story</h2>
              <p className="text-gray-600">How Roosevelt High School increased student engagement by 85%</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            &quot;After implementing SMILE in our classrooms, we saw unprecedented levels of student participation.
            Students who were previously disengaged started actively contributing to discussions and helping their peers.
            The collaborative features made learning feel more like a community effort than individual competition.&quot;
          </p>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>— Ms. Jennifer Lopez, Principal, Roosevelt High School, Chicago</span>
          </div>
        </div>

        {/* Story Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[#8C1515]">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-[#2E2D29]">Student Voices</h3>
            <p className="text-gray-600 text-sm mb-4">
              Authentic quotes from students and research findings about student engagement with SMILE.
            </p>
            <a href="#student-stories" className="text-sm font-medium text-[#8C1515] hover:underline">
              Read research findings →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[#8C1515]">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-[#2E2D29]">Academic Research</h3>
            <p className="text-gray-600 text-sm mb-4">
              Published research and case studies documenting SMILE&apos;s impact on learning engagement.
            </p>
            <a href="#educator-stories" className="text-sm font-medium text-[#8C1515] hover:underline">
              Read research studies →
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-[#8C1515]">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3 text-[#2E2D29]">Pedagogical Innovation</h3>
            <p className="text-gray-600 text-sm mb-4">
              How SMILE transforms teaching practices and classroom dynamics according to educational research.
            </p>
            <a href="#institution-stories" className="text-sm font-medium text-[#8C1515] hover:underline">
              Read innovations →
            </a>
          </div>
        </div>

        {/* Research Testimonials & Student Voices */}
        <div id="student-stories" className="mb-12">
          <h2 className="text-2xl font-semibold mb-8 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            Student Voices &amp; Research Findings
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-[#8C1515]">
              <blockquote className="text-lg text-gray-700 mb-4">
                &quot;What I like most about this activity is that I could make up my own question and other kids could read my questions and answer them.&quot;
              </blockquote>
              <div className="text-sm text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
                — Elementary school student, SMILE pilot study (2011, WorldComp Proceedings)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <blockquote className="text-gray-700 mb-4">
                &quot;Students very much enjoyed creating, sharing, and answering their own questions, which helped them learn by exposing them to new ideas.&quot;
              </blockquote>
              <div className="text-sm text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                — Stanford University (2011)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <blockquote className="text-gray-700 mb-4">
                &quot;SMILE successfully spurs student questioning and changes student–teacher dynamics in class.&quot;
              </blockquote>
              <div className="text-sm text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                — UNESCO Prospects journal (2014)
              </div>
            </div>
          </div>
        </div>

        {/* Research & Academic Impact */}
        <div id="educator-stories" className="mb-12">
          <h2 className="text-2xl font-semibold mb-8 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Research &amp; Academic Impact
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <blockquote className="text-gray-700 mb-4">
                &quot;SMILE provides multiple means of engagement: with content, peers, and instructors.&quot;
              </blockquote>
              <div className="text-sm text-gray-600">
                — Case Study on Student Engagement with SMILE (2016)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <blockquote className="text-gray-700 mb-4">
                &quot;SMILE enables learners to construct inquiries around their own contexts — such as health issues in their communities — enhancing relevance and agency.&quot;
              </blockquote>
              <div className="text-sm text-gray-600">
                — Healthcare Informatics Research (2016)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-[#8C1515]">
              <blockquote className="text-lg text-gray-700 mb-4">
                &quot;SMILE is a mobile learning platform designed to cause a paradigm shift within education by enabling students to be active agents in their own learning.&quot;
              </blockquote>
              <div className="text-sm text-gray-600">
                — UNESCO ICT in Education Multimedia Archives (2013)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <blockquote className="text-gray-700 mb-4">
                &quot;The quality of the student-generated question is the evidence of learning outcomes, not test scores.&quot;
              </blockquote>
              <div className="text-sm text-gray-600">
                — UNESCO (2013)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <blockquote className="text-gray-700 mb-4">
                &quot;SMILE turns a traditional classroom into a highly interactive learning environment, engaging students in critical reasoning and problem solving while generating, sharing, and evaluating multimedia-rich inquiries.&quot;
              </blockquote>
              <div className="text-sm text-gray-600">
                — Silver Lining for Learning Podcast (2020)
              </div>
            </div>
          </div>
        </div>

        {/* Pedagogical Innovation */}
        <div id="institution-stories" className="mb-12">
          <h2 className="text-2xl font-semibold mb-8 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            Pedagogical Innovation
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <blockquote className="text-gray-700 mb-4">
                &quot;SMILE engages students in an active learning process by encouraging them to ask, share, answer, and evaluate their own questions.&quot;
              </blockquote>
              <div className="text-sm text-gray-600">
                — Seeds of Empowerment documentation
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-[#8C1515]">
              <blockquote className="text-lg text-gray-700 mb-4">
                &quot;Teachers using SMILE play more the role of a coach or facilitator, shifting away from being the sole source of knowledge.&quot;
              </blockquote>
              <div className="text-sm text-gray-600">
                — Stanford University research
              </div>
            </div>

            {/* Key Features Highlight */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4 text-[#2E2D29]">
                SMILE Platform Core Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#8C1515] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">Student-generated questions</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#8C1515] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-gray-700">Peer-to-peer sharing</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#8C1515] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">Mobile learning platform</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#8C1515] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-gray-700">Critical reasoning development</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#8C1515] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-gray-700">Collaborative learning environment</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-[#8C1515] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">Multimedia-rich inquiries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Share Your SMILE Story</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Have you experienced success with SMILE? We&apos;d love to hear about your journey and
              share your story to inspire other educators and students.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-[#8C1515] text-white rounded-md hover:opacity-90 text-lg font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Share Your Story
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
