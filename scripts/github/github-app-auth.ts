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
 * - GITHUB_APP_ID: The integer ID of the GitHub App
 * - GITHUB_APP_INSTALLATION_ID: The integer ID of the specific installation
 * - GITHUB_APP_PRIVATE_KEY: The content of the .pem file
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
 */
function normalizePrivateKey(key: string): string {
  // Replace literal \n with actual newlines
  let normalized = key.replace(/\\n/g, '\n')

  // Ensure proper PEM format with headers on their own lines
  normalized = normalized
    .replace(/-----BEGIN RSA PRIVATE KEY-----\s*/, '-----BEGIN RSA PRIVATE KEY-----\n')
    .replace(/\s*-----END RSA PRIVATE KEY-----/, '\n-----END RSA PRIVATE KEY-----')

  // Also handle PKCS8 format
  normalized = normalized
    .replace(/-----BEGIN PRIVATE KEY-----\s*/, '-----BEGIN PRIVATE KEY-----\n')
    .replace(/\s*-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----')

  return normalized.trim()
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
  const normalizedKey = normalizePrivateKey(privateKey)

  // Import the private key for signing
  let key
  try {
    key = await importPKCS8(normalizedKey, 'RS256')
  } catch {
    // If PKCS8 fails, the key might be in traditional RSA format
    // Convert RSA to PKCS8 format header for jose
    const pkcs8Key = normalizedKey
      .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----')
      .replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----')
    key = await importPKCS8(pkcs8Key, 'RS256')
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
  const appId = process.env.GITHUB_APP_ID
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY

  if (!appId || !installationId || !privateKey) {
    const missing = []
    if (!appId) missing.push('GITHUB_APP_ID')
    if (!installationId) missing.push('GITHUB_APP_INSTALLATION_ID')
    if (!privateKey) missing.push('GITHUB_APP_PRIVATE_KEY')
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
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
