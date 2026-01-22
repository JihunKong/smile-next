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

import { getGitHubToken } from '../../src/lib/services/githubAppService'

async function main() {
  try {
    const token = await getGitHubToken()
    // Output token to stdout (GitHub Actions can capture this)
    console.log(token)
    process.exit(0)
  } catch (error) {
    console.error('Failed to get GitHub App token:', error)
    process.exit(1)
  }
}

main()
