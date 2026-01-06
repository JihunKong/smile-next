import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Bloom's Taxonomy - SMILE",
  description: "Understanding the levels of learning and how SMILE activities can help students progress through each cognitive stage.",
}

export default function BloomsTaxonomyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-[#2E2D29]">Bloom&apos;s Taxonomy</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding the levels of learning and how SMILE activities can help students progress through each cognitive stage.
          </p>
        </div>

        {/* Taxonomy Pyramid */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="space-y-6">
            {/* Creating */}
            <div className="bg-red-100 rounded-lg p-6 border-l-4 border-[#8C1515]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#8C1515]">6. Creating</h2>
                <svg className="w-8 h-8 text-[#8C1515]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-3">
                Produce new or original work. Generate, plan, construct, design, assemble, develop.
              </p>
              <div className="text-sm text-gray-600">
                <strong>SMILE Activities:</strong> Group projects, design challenges, research presentations, creative writing assignments.
              </div>
            </div>

            {/* Evaluating */}
            <div className="bg-orange-100 rounded-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-orange-600">5. Evaluating</h2>
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <p className="text-gray-700 mb-3">
                Justify a stand or decision. Critique, judge, defend, support, evaluate.
              </p>
              <div className="text-sm text-gray-600">
                <strong>SMILE Activities:</strong> Peer review sessions, debate forums, case study analysis, critical thinking discussions.
              </div>
            </div>

            {/* Analyzing */}
            <div className="bg-yellow-100 rounded-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-yellow-600">4. Analyzing</h2>
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-3">
                Draw connections among ideas. Differentiate, organize, relate, compare, distinguish.
              </p>
              <div className="text-sm text-gray-600">
                <strong>SMILE Activities:</strong> Comparative analysis, pattern recognition exercises, cause-and-effect discussions.
              </div>
            </div>

            {/* Applying */}
            <div className="bg-green-100 rounded-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-green-600">3. Applying</h2>
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-3">
                Use information in new situations. Execute, implement, solve, use, demonstrate.
              </p>
              <div className="text-sm text-gray-600">
                <strong>SMILE Activities:</strong> Problem-solving exercises, real-world simulations, practical applications.
              </div>
            </div>

            {/* Understanding */}
            <div className="bg-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-600">2. Understanding</h2>
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-3">
                Explain ideas or concepts. Classify, describe, discuss, explain, identify.
              </p>
              <div className="text-sm text-gray-600">
                <strong>SMILE Activities:</strong> Discussion forums, explanation exercises, concept mapping.
              </div>
            </div>

            {/* Remembering */}
            <div className="bg-gray-100 rounded-lg p-6 border-l-4 border-gray-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-600">1. Remembering</h2>
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <p className="text-gray-700 mb-3">
                Recall facts and basic concepts. Define, duplicate, list, memorize, repeat.
              </p>
              <div className="text-sm text-gray-600">
                <strong>SMILE Activities:</strong> Flashcards, quizzes, vocabulary exercises, fact recall activities.
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-[#2E2D29] flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
              For Educators
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Design activities that progress through multiple taxonomy levels
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Use SMILE&apos;s activity types to target specific cognitive skills
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Encourage peer collaboration at higher taxonomy levels
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Provide scaffolding for complex cognitive tasks
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-[#2E2D29] flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              For Students
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-[#8C1515]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Build foundational knowledge before tackling complex problems
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-[#8C1515]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Practice explaining concepts to deepen understanding
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-[#8C1515]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Apply knowledge in different contexts to strengthen learning
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 text-[#8C1515]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Engage in peer review to develop evaluation skills
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Ready to Create Taxonomy-Based Activities?</h3>
            <p className="text-gray-600 mb-6">Start building activities that guide students through all levels of cognitive learning.</p>
            <Link
              href="/groups"
              className="inline-flex items-center px-6 py-3 bg-[#8C1515] text-white rounded-md hover:opacity-90 text-lg font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
