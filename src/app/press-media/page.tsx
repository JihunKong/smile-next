import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Press & Media - SMILE',
  description: "Stay updated with the latest news, media coverage, and announcements about SMILE's impact on education.",
}

export default function PressMediaPage() {
  const newsItems = [
    {
      year: '2023',
      title: 'Ask SMILE Platform Launches with Advanced AI Integration',
      description: 'SMILE unveils its revolutionary Ask SMILE platform powered by GPT language models, alongside the development of SMILE LLM for offline learning environments and SMILE Coach for career counseling.',
    },
    {
      year: '2021',
      title: 'SMILE Goes Voice-Activated with Google Assistant Launch',
      description: 'Stanford SMILE expands accessibility by launching on Google Assistant with three core features: Question Evaluator Quiz, Recent News Feature, and School Subjects Feature.',
    },
    {
      year: '2020',
      title: "UAE Study Demonstrates SMILE's Impact on Student Learning",
      description: "Research study with 54 kindergarten students in UAE shows SMILE Global significantly improved students' question analysis skills and confidence in inquiry-based learning.",
    },
    {
      year: '2017',
      title: 'SMILE Global Develops Natural Language Processing API',
      description: 'Stanford researchers launch groundbreaking natural language processing API for automated question evaluation, revolutionizing how students receive feedback on inquiry skills.',
    },
    {
      year: '2016',
      title: 'SMILE Recognized in Global Education Opportunity Report',
      description: 'The International Commission on Financing Global Education Opportunity highlights SMILE as an innovative educational tool. SMILE Plug implemented on Raspberry Pi for broader accessibility.',
    },
    {
      year: '2012',
      title: 'SMILE Consortium Launched with Marvell Partnership',
      description: 'Stanford partners with Marvell to create the SMILE Consortium, expanding mobile learning implementations in Argentina and Indonesia math classrooms with policy modifications supporting the initiative.',
    },
    {
      year: '2011',
      title: 'First Global Pilot Studies Launch Across Multiple Continents',
      description: "SMILE conducts groundbreaking pilot studies in South Africa, UAE, Ghana, Tanzania, and Argentina, demonstrating the platform's effectiveness across diverse educational contexts and cultures.",
    },
    {
      year: '2009',
      title: 'Stanford Launches SMILE: Revolutionary Mobile Learning Platform',
      description: 'Dr. Paul Kim founds Seeds of Empowerment and begins technical design of the Stanford Mobile Inquiry-based Learning Environment, initiating the PocketSchool research study for portable learning networks.',
    },
  ]

  const awards = [
    {
      title: 'EdTech Innovation Award',
      organization: 'Education Technology Association, 2024',
    },
    {
      title: 'Best Learning Platform',
      organization: 'Digital Learning Awards, 2023',
    },
    {
      title: 'Student Choice Award',
      organization: 'Campus Technology Conference, 2023',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-[#2E2D29]">Press &amp; Media</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest news, media coverage, and announcements about SMILE&apos;s impact on education.
          </p>
        </div>

        {/* Latest News */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Latest News
          </h2>
          <div className="space-y-8">
            {newsItems.map((item, index) => (
              <article key={index} className={index < newsItems.length - 1 ? 'border-b border-gray-200 pb-6' : ''}>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{item.year}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#8C1515]">{item.title}</h3>
                <p className="text-gray-700 mb-3">{item.description}</p>
                <a
                  href="#"
                  className="text-sm font-medium text-[#8C1515] hover:underline"
                >
                  Read more →
                </a>
              </article>
            ))}
          </div>
        </div>

        {/* Awards & Recognition */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Awards &amp; Recognition
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {awards.map((award, index) => (
              <div key={index} className="text-center p-6 border rounded-lg">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl bg-[#8C1515]">
                  {index === 0 && (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  )}
                </div>
                <h3 className="font-semibold mb-2">{award.title}</h3>
                <p className="text-sm text-gray-600">{award.organization}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact for Media */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Media Inquiries</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              For interviews, press releases, or additional information about SMILE,
              please don&apos;t hesitate to reach out to our media team.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-[#8C1515] text-white rounded-md hover:opacity-90 text-lg font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Media Team
              </Link>
              <button className="inline-flex items-center px-6 py-3 border border-[#D2C295] rounded-md hover:bg-gray-50 text-lg font-semibold text-[#2E2D29]">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                Subscribe to Updates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
