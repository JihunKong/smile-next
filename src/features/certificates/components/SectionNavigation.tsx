'use client'

type SectionId = 'basic' | 'design' | 'activities' | 'qr'

interface Section {
  id: SectionId
  label: string
  icon: string
}

const SECTIONS: Section[] = [
  { id: 'basic', label: 'Basic Info', icon: '1' },
  { id: 'design', label: 'Design', icon: '2' },
  { id: 'activities', label: 'Activities', icon: '3' },
  { id: 'qr', label: 'QR Code', icon: '4' },
]

interface SectionNavigationProps {
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
}

export function SectionNavigation({ activeSection, onSectionChange }: SectionNavigationProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSection === section.id
                ? 'bg-[#8C1515] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              activeSection === section.id ? 'bg-white text-[#8C1515]' : 'bg-gray-300 text-gray-600'
            }`}>
              {section.icon}
            </span>
            {section.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export type { SectionId }
