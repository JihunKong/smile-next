/**
 * GitHub App Authentication for CI/CD
 *
 * Standalone implementation for GitHub Actions workflows.
 * This file is self-contained and doesn't depend on the application codebase.
 *
 * Implements the two-step authentication process:
 * Step A: Generate JWT signed with private key (The Handshake)
 * Step B: Exchange JWT for Installation Access Token (The Exchange)
 *
 * Required Environment Variables:
 * - DEPLOYER_APP_ID: The integer ID of the GitHub App
 * - DEPLOYER_APP_INSTALLATION_ID: The integer ID of the specific installation
 * - DEPLOYER_APP_PRIVATE_KEY: The content of the .pem file
 */

import { SignJWT, importPKCS8 } from 'jose'

const GITHUB_API_BASE = 'https://api.github.com'

// Token cache for rotation (valid for 1 hour, refresh when < 5 min remaining)
interface CachedToken {
  token: string
  expiresAt: Date
}

let cachedToken: CachedToken | null = null

/**
 * Normalizes the PEM private key by handling different newline formats.
 * GitHub App private keys may have literal '\n' strings or actual newlines.
 * When pasted into GitHub secrets, newlines are often lost or corrupted.
 */
function normalizePrivateKey(key: string): string {
  if (!key || key.trim() === '') {
    throw new Error('Private key is empty')
  }

  // Replace literal \n with actual newlines
  let normalized = key.replace(/\\n/g, '\n')

  // Detect key type
  const isRSA = normalized.includes('BEGIN RSA PRIVATE KEY')
  const isPKCS8 = normalized.includes('BEGIN PRIVATE KEY')

  if (!isRSA && !isPKCS8) {
    throw new Error('Private key must start with "-----BEGIN RSA PRIVATE KEY-----" or "-----BEGIN PRIVATE KEY-----"')
  }

  // Extract the key body (everything between headers)
  let keyBody: string
  let beginHeader: string
  let endHeader: string

  if (isRSA) {
    beginHeader = '-----BEGIN RSA PRIVATE KEY-----'
    endHeader = '-----END RSA PRIVATE KEY-----'
  } else {
    beginHeader = '-----BEGIN PRIVATE KEY-----'
    endHeader = '-----END PRIVATE KEY-----'
  }

  // Find and extract the key body
  const beginIndex = normalized.indexOf(beginHeader)
  const endIndex = normalized.indexOf(endHeader)

  if (beginIndex === -1 || endIndex === -1) {
    throw new Error(`Private key must contain both ${beginHeader} and ${endHeader}`)
  }

  // Extract the key body and clean it
  keyBody = normalized.substring(beginIndex + beginHeader.length, endIndex)
    .replace(/\s+/g, '') // Remove all whitespace (spaces, newlines, tabs)
    .trim()

  if (!keyBody || keyBody.length === 0) {
    throw new Error('Private key body is empty')
  }

  // Reconstruct the key with proper formatting (64 characters per line, as per PEM standard)
  const lines: string[] = []
  for (let i = 0; i < keyBody.length; i += 64) {
    lines.push(keyBody.substring(i, i + 64))
  }

  // Reconstruct the full PEM key
  return `${beginHeader}\n${lines.join('\n')}\n${endHeader}\n`
}

/**
 * STEP A: Generates a JWT for GitHub App authentication (The Handshake).
 * Signs a JWT with the App's private key using RS256.
 * This proves to GitHub: "I am the App."
 *
 * @param appId - GitHub App ID
 * @param privateKey - Private key content
 * @returns JWT string valid for 10 minutes
 */
async function generateAppJWT(appId: string, privateKey: string): Promise<string> {
  let normalizedKey: string
  try {
    normalizedKey = normalizePrivateKey(privateKey)
  } catch (error) {
    throw new Error(`Failed to normalize private key: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Import the private key for signing
  // jose library requires PKCS8 format, so we need to convert RSA format if needed
  let key
  const isRSAFormat = normalizedKey.includes('BEGIN RSA PRIVATE KEY')
  
  try {
    if (isRSAFormat) {
      // Convert RSA format to PKCS8 format for jose
      // Note: This is just a header change - the actual key structure is the same
      const pkcs8Key = normalizedKey
        .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----')
        .replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----')
      key = await importPKCS8(pkcs8Key, 'RS256')
    } else {
      // Already in PKCS8 format
      key = await importPKCS8(normalizedKey, 'RS256')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to import private key. This usually means the key format is incorrect.\n` +
      `Error: ${errorMessage}\n` +
      `Make sure you copied the entire .pem file including headers and all content.`
    )
  }

  const now = Math.floor(Date.now() / 1000)

  // GitHub requires:
  // - iat: issued at time (max 60 seconds in the past)
  // - exp: expiration time (max 10 minutes from iat)
  // - iss: the App ID
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now - 60) // 60 seconds in the past to account for clock drift
    .setExpirationTime(now + 600) // 10 minutes from now
    .setIssuer(appId)
    .sign(key)

  return jwt
}

/**
 * STEP B: Requests an Installation Access Token from GitHub API (The Exchange).
 * Sends the JWT to GitHub and asks: "Give me a token for Installation ID #X"
 * GitHub returns a token (e.g., ghs_...) that is valid for 1 hour.
 *
 * @param installationId - GitHub App Installation ID
 * @param jwt - The JWT from Step A
 * @returns Installation access token and expiration time
 */
async function getInstallationToken(
  installationId: string,
  jwt: string
): Promise<{ token: string; expiresAt: Date }> {
  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to get installation access token: ${response.status} - ${errorText}`
    )
  }

  const data = await response.json()

  return {
    token: data.token,
    expiresAt: new Date(data.expires_at),
  }
}

/**
 * Gets a valid GitHub Installation Access Token.
 * Handles token caching and automatic refresh (Token Rotation).
 *
 * @returns A valid GitHub access token
 */
export async function getGitHubAppToken(): Promise<string> {
  const appId = process.env.DEPLOYER_APP_ID
  const installationId = process.env.DEPLOYER_APP_INSTALLATION_ID
  const privateKey = process.env.DEPLOYER_APP_PRIVATE_KEY

  // Check if environment variables are set (including empty string check)
  const missing: string[] = []
  if (!appId || appId.trim() === '') {
    missing.push('DEPLOYER_APP_ID')
  }
  if (!installationId || installationId.trim() === '') {
    missing.push('DEPLOYER_APP_INSTALLATION_ID')
  }
  if (!privateKey || privateKey.trim() === '') {
    missing.push('DEPLOYER_APP_PRIVATE_KEY')
  }

  if (missing.length > 0) {
    // Provide helpful debugging info
    const debugInfo = {
      hasAppId: !!appId,
      hasInstallationId: !!installationId,
      hasPrivateKey: !!privateKey,
      appIdLength: appId?.length || 0,
      installationIdLength: installationId?.length || 0,
      privateKeyLength: privateKey?.length || 0,
    }
    console.error('[GitHubApp] Environment check failed:', debugInfo)
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please ensure these secrets are set in your GitHub repository settings.`
    )
  }

  // Token Rotation: Check cache first - reuse token if it has more than 5 minutes remaining
  if (cachedToken) {
    const bufferMs = 5 * 60 * 1000 // 5 minutes buffer
    if (cachedToken.expiresAt.getTime() - Date.now() > bufferMs) {
      return cachedToken.token
    }
  }

  // Step A: Generate JWT (The Handshake)
  const jwt = await generateAppJWT(appId, privateKey)

  // Step B: Exchange JWT for Installation Token (The Exchange)
  const result = await getInstallationToken(installationId, jwt)

  // Cache the token for future use
  cachedToken = result

  return result.token
}
