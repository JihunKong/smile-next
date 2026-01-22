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
 *   - DEPLOYER_APP_ID: The integer ID of the GitHub App
 *   - DEPLOYER_APP_INSTALLATION_ID: The integer ID of the specific installation
 *   - DEPLOYER_APP_PRIVATE_KEY: The content of the .pem file
 * 
 * Output:
 *   Prints the installation access token to stdout (suitable for GitHub Actions)
 */

import { getGitHubAppToken } from './github-app-auth'

async function main() {
  // Debug: Check if environment variables are available (without revealing values)
  // Use stderr for debug output so it doesn't interfere with stdout token capture
  const hasAppId = !!process.env.DEPLOYER_APP_ID
  const hasInstallationId = !!process.env.DEPLOYER_APP_INSTALLATION_ID
  const hasPrivateKey = !!process.env.DEPLOYER_APP_PRIVATE_KEY
  
  console.error('[DEBUG] Environment check:')
  console.error(`  DEPLOYER_APP_ID: ${hasAppId ? 'SET' : 'NOT SET'} (length: ${process.env.DEPLOYER_APP_ID?.length || 0})`)
  console.error(`  DEPLOYER_APP_INSTALLATION_ID: ${hasInstallationId ? 'SET' : 'NOT SET'} (length: ${process.env.DEPLOYER_APP_INSTALLATION_ID?.length || 0})`)
  console.error(`  DEPLOYER_APP_PRIVATE_KEY: ${hasPrivateKey ? 'SET' : 'NOT SET'} (length: ${process.env.DEPLOYER_APP_PRIVATE_KEY?.length || 0})`)
  
  try {
    const token = await getGitHubAppToken()
    // Output token to stdout ONLY (GitHub Actions captures this via command substitution)
    // All debug/logging goes to stderr to avoid interfering with stdout
    console.log(token)
    process.exit(0)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Failed to get GitHub App token:', errorMessage)
    
    // Provide specific troubleshooting based on error type
    if (errorMessage.includes('private key') || errorMessage.includes('ASN1') || errorMessage.includes('wrong tag')) {
      console.error('\n🔑 Private Key Format Error:')
      console.error('The private key format is incorrect. Common issues:')
      console.error('1. Missing headers: Ensure the key includes:')
      console.error('   -----BEGIN RSA PRIVATE KEY-----')
      console.error('   [key content]')
      console.error('   -----END RSA PRIVATE KEY-----')
      console.error('2. Lost newlines: When pasting into GitHub secrets, newlines may be lost.')
      console.error('   The script will try to fix this, but ensure you copy the ENTIRE key.')
      console.error('3. Wrong key type: Make sure you\'re using the private key (.pem file), not the public key.')
      console.error('\n💡 Solution:')
      console.error('1. Open your .pem file')
      console.error('2. Copy the ENTIRE content (including headers)')
      console.error('3. Paste it into the DEPLOYER_APP_PRIVATE_KEY secret')
      console.error('4. The script will normalize newlines automatically')
    } else if (errorMessage.includes('Missing required environment variables')) {
      console.error('\n📋 Missing Secrets:')
      console.error('1. Ensure secrets are set in GitHub: Settings → Secrets and variables → Actions')
      console.error('2. Verify the secrets are named exactly:')
      console.error('   - DEPLOYER_APP_ID')
      console.error('   - DEPLOYER_APP_INSTALLATION_ID')
      console.error('   - DEPLOYER_APP_PRIVATE_KEY')
      console.error('3. Check that secrets: inherit is present in the workflow_call')
    } else if (errorMessage.includes('Permission Error') || errorMessage.includes('403') || errorMessage.includes('422')) {
      console.error('\n🔒 GitHub App Permission Error:')
      console.error('The GitHub App does not have the required permissions enabled.')
      console.error('\nTo fix this:')
      console.error('1. Go to: https://github.com/settings/apps')
      console.error('2. Select your GitHub App')
      console.error('3. Navigate to "Permissions & events"')
      console.error('4. Under "Repository permissions", set "Packages" to "Write"')
      console.error('5. Under "Account permissions" (if using org packages), set "Packages" to "Write"')
      console.error('6. Click "Save changes"')
      console.error('7. Go to: https://github.com/settings/installations')
      console.error('8. Click "Configure" next to your installation')
      console.error('9. Review and accept the updated permissions')
      console.error('\nFor more details, see: docs/GITHUB_APP_TROUBLESHOOTING.md')
    } else {
      console.error('\nTroubleshooting:')
      console.error('1. Ensure secrets are set in GitHub: Settings → Secrets and variables → Actions')
      console.error('2. Verify the secrets are named exactly: DEPLOYER_APP_ID, DEPLOYER_APP_INSTALLATION_ID, DEPLOYER_APP_PRIVATE_KEY')
      console.error('3. Check that secrets: inherit is present in the workflow_call')
      console.error('4. Verify your GitHub App credentials are correct')
      console.error('5. Check GitHub App permissions: https://github.com/settings/apps')
    }
    
    process.exit(1)
  }
}

main()
