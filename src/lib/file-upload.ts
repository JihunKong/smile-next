import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Upload directories
const PUBLIC_DIR = path.join(process.cwd(), 'public')
const GROUPS_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'groups')
const CERTIFICATES_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'certificates')
const AVATARS_UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'avatars')

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

/**
 * Get file extension from filename or mime type
 */
function getExtension(filename: string, mimeType?: string): string {
  // Try to get from filename first
  const extFromName = path.extname(filename).toLowerCase()
  if (extFromName) return extFromName

  // Fallback to mime type
  const mimeExtensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  }
  return mimeType ? mimeExtensions[mimeType] || '.jpg' : '.jpg'
}

/**
 * Upload a group image to local storage
 * @param file - The file buffer to save
 * @param originalName - Original filename (for extension)
 * @param mimeType - Optional mime type
 * @returns The public URL path for the uploaded image
 */
export async function uploadGroupImage(
  file: Buffer,
  originalName: string,
  mimeType?: string
): Promise<string> {
  // Ensure upload directory exists
  await ensureUploadDir(GROUPS_UPLOAD_DIR)

  // Generate unique filename
  const ext = getExtension(originalName, mimeType)
  const filename = `${uuidv4()}${ext}`
  const filepath = path.join(GROUPS_UPLOAD_DIR, filename)

  // Write file to disk
  await writeFile(filepath, file)

  // Return public URL path
  return `/uploads/groups/${filename}`
}

/**
 * Delete a group image from local storage
 * @param imageUrl - The public URL path of the image to delete
 */
export async function deleteGroupImage(imageUrl: string): Promise<void> {
  // Only handle local uploads
  if (!imageUrl.startsWith('/uploads/groups/')) {
    return
  }

  const filename = imageUrl.replace('/uploads/groups/', '')
  const filepath = path.join(GROUPS_UPLOAD_DIR, filename)

  if (existsSync(filepath)) {
    await unlink(filepath)
  }
}

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default 8)
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(
  file: { type: string; size: number },
  maxSizeMB: number = 8
): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'
  }

  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    return `File too large. Maximum size is ${maxSizeMB}MB`
  }

  return null
}

// ============================================================================
// Certificate Image Upload Functions
// ============================================================================

/**
 * Upload a certificate logo image to local storage
 * @param file - The file buffer to save
 * @param originalName - Original filename (for extension)
 * @param mimeType - Optional mime type
 * @returns The public URL path for the uploaded image
 */
export async function uploadCertificateLogo(
  file: Buffer,
  originalName: string,
  mimeType?: string
): Promise<string> {
  const logoDir = path.join(CERTIFICATES_UPLOAD_DIR, 'logos')
  await ensureUploadDir(logoDir)

  const ext = getExtension(originalName, mimeType)
  const filename = `logo_${uuidv4()}${ext}`
  const filepath = path.join(logoDir, filename)

  await writeFile(filepath, file)

  return `/uploads/certificates/logos/${filename}`
}

/**
 * Upload a certificate watermark image to local storage
 * @param file - The file buffer to save
 * @param originalName - Original filename (for extension)
 * @param mimeType - Optional mime type
 * @returns The public URL path for the uploaded image
 */
export async function uploadCertificateWatermark(
  file: Buffer,
  originalName: string,
  mimeType?: string
): Promise<string> {
  const watermarkDir = path.join(CERTIFICATES_UPLOAD_DIR, 'watermarks')
  await ensureUploadDir(watermarkDir)

  const ext = getExtension(originalName, mimeType)
  const filename = `watermark_${uuidv4()}${ext}`
  const filepath = path.join(watermarkDir, filename)

  await writeFile(filepath, file)

  return `/uploads/certificates/watermarks/${filename}`
}

/**
 * Upload a certificate signature image to local storage
 * @param file - The file buffer to save
 * @param originalName - Original filename (for extension)
 * @param mimeType - Optional mime type
 * @returns The public URL path for the uploaded image
 */
export async function uploadCertificateSignature(
  file: Buffer,
  originalName: string,
  mimeType?: string
): Promise<string> {
  const signatureDir = path.join(CERTIFICATES_UPLOAD_DIR, 'signatures')
  await ensureUploadDir(signatureDir)

  const ext = getExtension(originalName, mimeType)
  const filename = `signature_${uuidv4()}${ext}`
  const filepath = path.join(signatureDir, filename)

  await writeFile(filepath, file)

  return `/uploads/certificates/signatures/${filename}`
}

/**
 * Delete a certificate image from local storage
 * @param imageUrl - The public URL path of the image to delete
 */
export async function deleteCertificateImage(imageUrl: string): Promise<void> {
  // Only handle local certificate uploads
  if (!imageUrl.startsWith('/uploads/certificates/')) {
    return
  }

  const relativePath = imageUrl.replace('/uploads/certificates/', '')
  const filepath = path.join(CERTIFICATES_UPLOAD_DIR, relativePath)

  if (existsSync(filepath)) {
    await unlink(filepath)
  }
}

// ============================================================================
// User Avatar Upload Functions
// ============================================================================

/**
 * Upload a user avatar image to local storage
 * @param file - The file buffer to save
 * @param originalName - Original filename (for extension)
 * @param mimeType - Optional mime type
 * @returns The public URL path for the uploaded image
 */
export async function uploadAvatarImage(
  file: Buffer,
  originalName: string,
  mimeType?: string
): Promise<string> {
  await ensureUploadDir(AVATARS_UPLOAD_DIR)

  const ext = getExtension(originalName, mimeType)
  const filename = `avatar_${uuidv4()}${ext}`
  const filepath = path.join(AVATARS_UPLOAD_DIR, filename)

  await writeFile(filepath, file)

  return `/uploads/avatars/${filename}`
}

/**
 * Delete a user avatar image from local storage
 * @param imageUrl - The public URL path of the image to delete
 */
export async function deleteAvatarImage(imageUrl: string): Promise<void> {
  // Only handle local avatar uploads
  if (!imageUrl.startsWith('/uploads/avatars/')) {
    return
  }

  const filename = imageUrl.replace('/uploads/avatars/', '')
  const filepath = path.join(AVATARS_UPLOAD_DIR, filename)

  if (existsSync(filepath)) {
    await unlink(filepath)
  }
}
