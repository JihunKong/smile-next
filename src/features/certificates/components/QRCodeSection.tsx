'use client'

const QR_POSITIONS = [
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
]

interface QRCodeSectionProps {
  qrCodeEnabled: boolean
  qrCodePosition: string
  onQrCodeEnabledChange: (enabled: boolean) => void
  onQrCodePositionChange: (position: string) => void
}

export function QRCodeSection({
  qrCodeEnabled,
  qrCodePosition,
  onQrCodeEnabledChange,
  onQrCodePositionChange,
}: QRCodeSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">QR Code Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Enable QR Code</label>
            <p className="text-xs text-gray-500">Display a QR code for certificate verification</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={qrCodeEnabled}
              onChange={(e) => onQrCodeEnabledChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8C1515]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8C1515]"></div>
          </label>
        </div>

        {qrCodeEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Position</label>
            <select
              value={qrCodePosition}
              onChange={(e) => onQrCodePositionChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition"
            >
              {QR_POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
