import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Research & Publications - SMILE',
  description: 'Comprehensive bibliography of research papers on the Stanford Mobile Inquiry-based Learning Environment (SMILE) developed by Dr. Paul Kim and his team at Stanford University.',
}

export default function ResearchPublicationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-[#2E2D29]">Research &amp; Publications</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive bibliography of research papers that report on the Stanford Mobile Inquiry-based Learning Environment (SMILE) developed by Dr. Paul Kim and his team at Stanford University.
          </p>
        </div>

        {/* Featured Research */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Latest Research
          </h2>
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border-l-4 border-[#8C1515] mb-4">
            <h3 className="text-xl font-semibold mb-3 text-[#8C1515]">
              &quot;Generative AI as a coach to help students enhance proficiency in question formulation&quot;
            </h3>
            <p className="text-gray-700 mb-4">
              Kim, P., Wang, W., &amp; Bonk, C. J. (2025). Latest research on how generative AI can serve as a coaching tool to improve students&apos; questioning skills within the SMILE framework.
            </p>
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Journal of Educational Computing Research, 63(1), 3-28</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border-l-4 border-[#2E2D29]">
            <h3 className="text-xl font-semibold mb-3 text-[#2E2D29]">
              &quot;Enhancing critical inquiry in EFL education: Design and validation of an AI-supported assessment tool&quot;
            </h3>
            <p className="text-gray-700 mb-4">
              Lai, W., Kim, P., &amp; Lee, J. (2025). Research on AI-supported assessment tools for critical inquiry in English as Foreign Language education using SMILE.
            </p>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Research Methods in Applied Linguistics</span>
            </div>
          </div>
        </div>

        {/* Complete Bibliography */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            SMILE Research Bibliography
          </h2>

          {/* Core Development & Framework Papers */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-[#8C1515]">Core Development &amp; Framework Papers</h3>
            <div className="space-y-4">
              {[
                'Lai, W., Kim, P., & Lee, J. (2025). Enhancing critical inquiry in EFL education: Design and validation of an AI-supported assessment tool. Research Methods in Applied Linguistics.',
                'Kim, P., Wang, W., & Bonk, C. J. (2025). Generative AI as a coach to help students enhance proficiency in question formulation. Journal of Educational Computing Research, 63(1), 3-28.',
                'Kim, P. (2020). Future implications of the fourth industrial revolution on education and training. In B. Panth & R. Maclean (Eds.), Anticipating and preparing for emerging skills and jobs: Key issues, concerns, and prospects (pp. 165-178). Springer.',
                'Song, D., & Kim, P. (2015). Inquiry-based mobilized math classroom with Stanford mobile inquiry-based learning environment (SMILE). In H. Crompton & J. Traxler (Eds.), Mobile learning and mathematics (pp. 96-110). Routledge.',
                'Buckner, E., & Kim, P. (2014). Integrating technology and pedagogy for inquiry-based learning: The Stanford Mobile Inquiry-based Learning Environment (SMILE). Prospects, 44(1), 99-118.',
                'Kim, P. (2013). Mobile innovations in the education ecosystem. Revista de Ingeniería, 37, 36-48.',
                'Kim, P., Chiang, Y. V., Karimi, A., & Seol, S. (2012). Using mobile phones to scaffold student-generated questions and promote a global Student-centered Mobile Interactive Learning Environment (SMILE).',
                'Song, D., Kim, P., & Karimi, A. (2012). Inquiry-based learning environment using mobile devices in math classroom.',
                'Seol, S., Sharp, A., & Kim, P. (2011). Stanford Mobile Inquiry-based Learning Environment (SMILE): Using mobile phones to promote student inquires in the elementary classroom. Proceedings of the International Conference on Information Technology Based Higher Education and Training, 1-8.',
              ].map((citation, i) => (
                <div key={i} className="border-l-4 border-[#D2C295] pl-4">
                  <p className="text-gray-900 text-sm">{citation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation & Assessment Studies */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-[#8C1515]">Evaluation &amp; Assessment Studies</h3>
            <div className="space-y-4">
              {[
                'Kim, P., & An, J. Y. (2016). New evaluation vector through the Stanford mobile inquiry-based learning environment (SMILE) for participatory action research. Healthcare Informatics Research, 22(3), 164-171.',
                'Lee, J., Kim, P. H., & Ahn, M. (2022). Design based system research of an online platform prototype to foster higher-order questioning. Journal of Logistics, Informatics and Service Science, 9(2), 45-62.',
                'Lim, K. Y. T., Song, B. H., & Kho, M. X. (2019). The change in nature and efficacy of learners\' questions through progressive interaction with the Stanford Mobile Inquiry-based Learning Environment (SMILE). In Innovations in Educational Change (pp. 178-195). Springer.',
                'Kim, P. H. (2019). Fostering students\' question-generation skill by implementing an online inquiry-based learning platform: Stanford mobile inquiry-based learning environment (SMILE).',
                'Park, E., & Kim, P. (2016). A case study exploring student engagement with Stanford Mobile Inquiry-based Learning Environment (SMILE). GLOKALde, 2(3), 12-28.',
              ].map((citation, i) => (
                <div key={i} className="border-l-4 border-[#D2C295] pl-4">
                  <p className="text-gray-900 text-sm">{citation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Training & Implementation Studies */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-[#8C1515]">Teacher Training &amp; Implementation Studies</h3>
            <div className="space-y-4">
              {[
                'Hsu, H. Y., & Kim, P. (2016). Preservice teachers\' uses of SMILE to enact student-generated questioning practices. International Journal of Innovation in Science and Mathematics Education, 24(2), 1-15.',
                'Thomas, K., Hylen, M., & Carter, B. (2024). Ch-ch-ch-ch-changes: Preservice teachers\' perceptions on mobile phones—2013-2022. Society for Information Technology & Teacher Education International Conference, 2024(1), 1245-1252.',
                'Wu, L., & He, S. (2021). Teacher–researcher co-designing of a technology-enhanced classroom inquiry framework.',
                'Wu, L., Liu, Y., How, M. L., & He, S. (2023). Investigating student-generated questioning in a technology-enabled elementary science classroom: A case study. Education Sciences, 13(2), 187.',
              ].map((citation, i) => (
                <div key={i} className="border-l-4 border-[#D2C295] pl-4">
                  <p className="text-gray-900 text-sm">{citation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* International Applications */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-[#8C1515]">International Applications - Spanish Language Studies</h3>
            <div className="space-y-4">
              {[
                'Aarón, M. A. (2019). Uso de la Plataforma Smile para la Elaboración de Conceptos en Estudiantes en Repitencia en un Programa de Ingeniería. Información Tecnológica, 30(5), 93-102.',
                'Barliza, A. D. S., & Gonzálvez, M. A. A. (2018). Didáctica para la elaboración de preguntas utilizando aprendizaje colaborativo.',
                'Da Silva-Ovando, A. C., & Quintana, O. S. O. (2022). Design a challenge-based learning model for higher education.',
                'González, Y. Y. L., & Díaz, J. G. (2015). Metodología basada en la indagación soportada con la herramienta Smile.',
                'Solano, A. D., & Aarón, M. A. (2020). Enseñanza en ingeniería de manera colaborativa a partir de un diseño tecnopedagógico, usando SMILE. Formación Universitaria, 13(1), 15-24.',
              ].map((citation, i) => (
                <div key={i} className="border-l-4 border-[#D2C295] pl-4">
                  <p className="text-gray-900 text-sm">{citation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent AI Integration Studies */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-[#8C1515]">Recent AI Integration Studies</h3>
            <div className="space-y-4">
              {[
                'Kim, I. (2024). The effectiveness of a GenAI-integrated coaching system on science inquiries generated by refugee students. EDULEARN24 Proceedings, 1-8.',
                'Bafandkar, S., Chung, S., Khosravian, H., & Lee, J. (2025). PAPPL: Personalized AI-powered progressive learning platform.',
                'Liang, W. (2024). Exploring a framework for supporting self-directed English learning through ChatGPT: A meta-cognitive strategy. E-Learn: World Conference on E-Learning in Corporate, Government, Healthcare, and Higher Education, 2024(1), 445-452.',
              ].map((citation, i) => (
                <div key={i} className="border-l-4 border-[#D2C295] pl-4">
                  <p className="text-gray-900 text-sm">{citation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This bibliography represents research papers that explicitly mention or utilize the Stanford Mobile Inquiry-based Learning Environment (SMILE) developed by Dr. Paul Kim and his team at Stanford University. The papers span multiple languages, educational contexts, and applications, demonstrating the global impact and adoption of the SMILE platform in educational research and practice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Research Leadership */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#2E2D29] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            SMILE Research Leadership
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl bg-[#8C1515]">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Dr. Paul Kim</h3>
              <p className="text-sm text-gray-600 mb-3">Founding Director, SMILE Platform</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl bg-[#2E2D29]">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Global Research Consortium</h3>
              <p className="text-sm text-gray-600 mb-3">International Collaborators</p>
              <p className="text-xs text-gray-500">Researchers from Stanford, Singapore, Brazil, Spain, Colombia, UAE, and other institutions contributing to SMILE research across multiple languages and contexts.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-semibold mb-4 text-[#2E2D29]">Collaborate With Us</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Are you interested in educational research or collaboration opportunities?
              We welcome partnerships with educators, researchers, and institutions.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-[#8C1515] text-white rounded-md hover:opacity-90 text-lg font-semibold"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
