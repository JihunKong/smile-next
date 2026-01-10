/**
 * Certificate PDF Template Generator
 *
 * Generates HTML string for certificate PDF generation with:
 * - A4 landscape layout (297mm x 210mm)
 * - Double border frame design
 * - Logo placement (bottom-left, if exists)
 * - QR code placeholder (bottom-right, if enabled)
 * - Signature image placement
 * - Verification code footer
 */

export interface CertificatePdfData {
  certificateName: string
  organizationName: string
  programName?: string
  studentName: string
  completedAt: Date
  verificationCode: string
  logoImageUrl?: string
  signatureImageUrl?: string
  watermarkImageUrl?: string
  qrCodeEnabled?: boolean
  signatoryName?: string
  certificateStatement?: string
}

/**
 * Format date for certificate display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Generate HTML template for certificate PDF
 */
export function generateCertificateHtml(data: CertificatePdfData): string {
  const {
    certificateName,
    organizationName,
    programName,
    studentName,
    completedAt,
    verificationCode,
    logoImageUrl,
    signatureImageUrl,
    watermarkImageUrl,
    qrCodeEnabled = true,
    signatoryName,
    certificateStatement,
  } = data

  // Default certificate statement if not provided
  const statement = certificateStatement ||
    `This is to certify that the above named individual has successfully completed all requirements of the ${programName || certificateName} program.`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${certificateName} - ${studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    body {
      font-family: 'Open Sans', sans-serif;
      background: #f5f5f5;
    }

    .certificate-container {
      width: 297mm;
      height: 210mm;
      background: #ffffff;
      position: relative;
      overflow: hidden;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.05;
      z-index: 0;
      max-width: 60%;
      max-height: 60%;
    }

    /* Outer border */
    .outer-border {
      position: absolute;
      top: 8mm;
      left: 8mm;
      right: 8mm;
      bottom: 8mm;
      border: 3px solid #8C1515;
      border-radius: 4px;
    }

    /* Inner border */
    .inner-border {
      position: absolute;
      top: 12mm;
      left: 12mm;
      right: 12mm;
      bottom: 12mm;
      border: 1px solid #B83A4B;
      border-radius: 2px;
    }

    /* Content area */
    .content {
      position: absolute;
      top: 18mm;
      left: 18mm;
      right: 18mm;
      bottom: 18mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      z-index: 1;
    }

    /* Header section */
    .header {
      margin-bottom: 8mm;
    }

    .organization-name {
      font-family: 'Playfair Display', serif;
      font-size: 14pt;
      color: #333333;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 4mm;
    }

    .certificate-title {
      font-family: 'Playfair Display', serif;
      font-size: 36pt;
      font-weight: 700;
      color: #8C1515;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 2mm;
    }

    .certificate-subtitle {
      font-size: 12pt;
      color: #666666;
      letter-spacing: 1px;
    }

    /* Main section */
    .main-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .presented-to {
      font-size: 11pt;
      color: #666666;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 6mm;
    }

    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 32pt;
      font-weight: 600;
      color: #2E2D29;
      margin-bottom: 6mm;
      border-bottom: 2px solid #8C1515;
      padding-bottom: 4mm;
      min-width: 150mm;
    }

    .certificate-statement {
      font-size: 11pt;
      color: #444444;
      line-height: 1.6;
      max-width: 200mm;
      margin-bottom: 6mm;
    }

    .program-name {
      font-family: 'Playfair Display', serif;
      font-size: 16pt;
      font-weight: 600;
      color: #8C1515;
      margin-bottom: 4mm;
    }

    .completion-date {
      font-size: 11pt;
      color: #666666;
    }

    /* Footer section */
    .footer {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 0 10mm;
    }

    .footer-left {
      text-align: left;
    }

    .footer-center {
      text-align: center;
    }

    .footer-right {
      text-align: right;
    }

    .logo {
      max-width: 40mm;
      max-height: 25mm;
      object-fit: contain;
    }

    .signature-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .signature-image {
      max-width: 50mm;
      max-height: 20mm;
      object-fit: contain;
      margin-bottom: 2mm;
    }

    .signature-line {
      width: 60mm;
      border-top: 1px solid #333333;
      margin-bottom: 2mm;
    }

    .signatory-name {
      font-size: 10pt;
      color: #333333;
      font-weight: 600;
    }

    .signatory-title {
      font-size: 9pt;
      color: #666666;
    }

    .qr-placeholder {
      width: 25mm;
      height: 25mm;
      border: 1px dashed #cccccc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: #999999;
    }

    .qr-code {
      width: 25mm;
      height: 25mm;
    }

    /* Verification code */
    .verification-code {
      position: absolute;
      bottom: 4mm;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8pt;
      color: #999999;
      letter-spacing: 1px;
    }

    /* Decorative elements */
    .corner-ornament {
      position: absolute;
      width: 20mm;
      height: 20mm;
      border-color: #8C1515;
      border-style: solid;
      border-width: 0;
    }

    .corner-top-left {
      top: 14mm;
      left: 14mm;
      border-top-width: 2px;
      border-left-width: 2px;
    }

    .corner-top-right {
      top: 14mm;
      right: 14mm;
      border-top-width: 2px;
      border-right-width: 2px;
    }

    .corner-bottom-left {
      bottom: 14mm;
      left: 14mm;
      border-bottom-width: 2px;
      border-left-width: 2px;
    }

    .corner-bottom-right {
      bottom: 14mm;
      right: 14mm;
      border-bottom-width: 2px;
      border-right-width: 2px;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    ${watermarkImageUrl ? `<img src="${watermarkImageUrl}" alt="" class="watermark" />` : ''}

    <div class="outer-border"></div>
    <div class="inner-border"></div>

    <!-- Corner ornaments -->
    <div class="corner-ornament corner-top-left"></div>
    <div class="corner-ornament corner-top-right"></div>
    <div class="corner-ornament corner-bottom-left"></div>
    <div class="corner-ornament corner-bottom-right"></div>

    <div class="content">
      <!-- Header -->
      <div class="header">
        ${organizationName ? `<div class="organization-name">${organizationName}</div>` : ''}
        <div class="certificate-title">Certificate</div>
        <div class="certificate-subtitle">of Completion</div>
      </div>

      <!-- Main Section -->
      <div class="main-section">
        <div class="presented-to">This Certificate is Presented to</div>
        <div class="student-name">${studentName}</div>
        <div class="certificate-statement">${statement}</div>
        ${programName ? `<div class="program-name">${programName}</div>` : ''}
        <div class="completion-date">Completed on ${formatDate(completedAt)}</div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-left">
          ${logoImageUrl ? `<img src="${logoImageUrl}" alt="Logo" class="logo" />` : ''}
        </div>

        <div class="footer-center">
          <div class="signature-section">
            ${signatureImageUrl ? `<img src="${signatureImageUrl}" alt="Signature" class="signature-image" />` : '<div style="height: 20mm;"></div>'}
            <div class="signature-line"></div>
            ${signatoryName ? `<div class="signatory-name">${signatoryName}</div>` : ''}
            <div class="signatory-title">Authorized Signature</div>
          </div>
        </div>

        <div class="footer-right">
          ${qrCodeEnabled ? `
            <div class="qr-placeholder" id="qr-container">
              <span>QR Code</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <div class="verification-code">
      Verification Code: ${verificationCode}
    </div>
  </div>
</body>
</html>
`
}

/**
 * Generate HTML template for certificate PDF with embedded QR code
 * Uses QR code as base64 data URL
 */
export function generateCertificateHtmlWithQR(
  data: CertificatePdfData,
  qrCodeDataUrl?: string
): string {
  const baseHtml = generateCertificateHtml(data)

  if (!qrCodeDataUrl || !data.qrCodeEnabled) {
    return baseHtml
  }

  // Replace QR placeholder with actual QR code image
  return baseHtml.replace(
    '<div class="qr-placeholder" id="qr-container">\n              <span>QR Code</span>\n            </div>',
    `<img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" />`
  )
}
