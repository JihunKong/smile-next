#!/usr/bin/env node
/**
 * GitHub Actions Script: Get GitHub App Installation Access Token
 * 
 * This script generates a GitHub App JWT and exchanges it for an Installation Access Token.
 * It's designed to be run in GitHub Actions workflows.
 * 
 * Usage:
 *   npx tsx scripts/github/get-github-app-token.ts
 * 
 * Environment Variables Required:
 *   - GITHUB_APP_ID: The integer ID of the GitHub App
 *   - GITHUB_APP_INSTALLATION_ID: The integer ID of the specific installation
 *   - GITHUB_APP_PRIVATE_KEY: The content of the .pem file
 * 
 * Output:
 *   Prints the installation access token to stdout (suitable for GitHub Actions)
 */

import { getGitHubAppToken } from './github-app-auth'

async function main() {
  // Debug: Check if environment variables are available (without revealing values)
  const hasAppId = !!process.env.GITHUB_APP_ID
  const hasInstallationId = !!process.env.GITHUB_APP_INSTALLATION_ID
  const hasPrivateKey = !!process.env.GITHUB_APP_PRIVATE_KEY
  
  console.log('[DEBUG] Environment check:')
  console.log(`  GITHUB_APP_ID: ${hasAppId ? 'SET' : 'NOT SET'} (length: ${process.env.GITHUB_APP_ID?.length || 0})`)
  console.log(`  GITHUB_APP_INSTALLATION_ID: ${hasInstallationId ? 'SET' : 'NOT SET'} (length: ${process.env.GITHUB_APP_INSTALLATION_ID?.length || 0})`)
  console.log(`  GITHUB_APP_PRIVATE_KEY: ${hasPrivateKey ? 'SET' : 'NOT SET'} (length: ${process.env.GITHUB_APP_PRIVATE_KEY?.length || 0})`)
  
  try {
    const token = await getGitHubAppToken()
    // Output token to stdout (GitHub Actions can capture this)
    console.log(token)
    process.exit(0)
  } catch (error) {
    console.error('Failed to get GitHub App token:', error)
    console.error('\nTroubleshooting:')
    console.error('1. Ensure secrets are set in GitHub: Settings → Secrets and variables → Actions')
    console.error('2. Verify the secrets are named exactly: GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY')
    console.error('3. Check that secrets: inherit is present in the workflow_call')
    process.exit(1)
  }
}

main()
