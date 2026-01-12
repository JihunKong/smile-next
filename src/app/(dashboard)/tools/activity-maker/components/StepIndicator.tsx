'use client'

interface StepIndicatorProps {
  currentStep: number
}

const steps = [
  { number: 1, title: 'Activity Details', description: 'Topic & audience' },
  { number: 2, title: 'Questions', description: 'Configuration' },
  { number: 3, title: 'Group', description: 'Select or create' },
  { number: 4, title: 'Review', description: 'Confirm & create' },
]

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
        <div
          className="h-full bg-[var(--stanford-cardinal)] transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                currentStep >= step.number
                  ? 'bg-[var(--stanford-cardinal)] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step.number ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <div className="mt-2 text-center">
              <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
