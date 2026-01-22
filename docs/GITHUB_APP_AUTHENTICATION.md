# GitHub App Authentication Implementation

## Overview

This document describes the GitHub App authentication implementation that replaces Personal Access Tokens (PATs) in the CI/CD pipeline.

## Two-Step Authentication Process

The implementation follows GitHub's required two-step authentication process:

### Step A: The Handshake (JWT Generation)
- **Purpose**: Prove identity to GitHub ("I am the App")
- **Implementation**: `generateAppJWT()` function in `scripts/github/github-app-auth.ts`
- **Process**:
  1. Normalizes the private key (handles `\n` literals and actual newlines)
  2. Imports the private key using `jose` library
  3. Signs a JWT with RS256 algorithm
  4. Sets required claims:
     - `iss`: GitHub App ID
     - `iat`: Issued at time (60 seconds in past to account for clock drift)
     - `exp`: Expiration time (10 minutes from now)

### Step B: The Exchange (Installation Token Request)
- **Purpose**: Get a temporary access token for the installation
- **Implementation**: `getInstallationToken()` function in `scripts/github/github-app-auth.ts`
- **Process**:
  1. Calls Step A to generate JWT
  2. Sends POST request to: `POST /app/installations/{installation_id}/access_tokens`
  3. Includes JWT in `Authorization: Bearer {jwt}` header
  4. Receives installation access token (e.g., `ghs_...`) valid for 1 hour

## Required Secrets

Add these secrets to your GitHub repository:

1. **DEPLOYER_APP_ID** - The integer ID of your GitHub App
2. **DEPLOYER_APP_INSTALLATION_ID** - The integer ID of the specific installation
3. **DEPLOYER_APP_PRIVATE_KEY** - The content of your `.pem` file (can include literal `\n` or actual newlines)

## Dependencies

### Library Choice: `jose` (v5.9.6)

**Why `jose` instead of `jsonwebtoken`?**
- `jose` is the modern, recommended library for JWT in Node.js
- Better security practices and more actively maintained
- Native support for modern JavaScript/TypeScript
- Better handling of key formats (PKCS8, RSA)
- Used by major frameworks (Next.js, Auth.js, etc.)

The library is already added to `package.json`:
```json
"jose": "^5.9.6"
```

## Token Rotation (Future Proofing)

### Automatic Token Refresh

The implementation includes automatic token rotation:

1. **Token Caching**: Tokens are cached in memory to avoid unnecessary API calls
2. **Expiration Buffer**: Tokens are refreshed when they have less than 5 minutes remaining
3. **Automatic Refresh**: When a cached token is close to expiring, a new token is automatically requested

### Implementation Details

```typescript
// Token cache with expiration tracking
interface CachedToken {
  token: string
  expiresAt: Date
}

// Automatic refresh logic (5-minute buffer)
const bufferMs = 5 * 60 * 1000 // 5 minutes
if (cachedInstallationToken.expiresAt.getTime() - Date.now() > bufferMs) {
  // Use cached token
} else {
  // Refresh token automatically
}
```

### Use Cases

- **Short Scripts** (< 5 minutes): Tokens are cached during script lifetime, no refresh needed
- **Long-Running Services** (24/7): Tokens are automatically refreshed before expiration
- **GitHub Actions Workflows**: Each workflow run gets a fresh token, cached during that run

## Usage in GitHub Actions

### Workflow Integration

Both `build-node.yml` and `deploy-gcp-compute-vm-ssh.yml` include:

```yaml
- name: Get GitHub App Token
  id: github-token
  env:
    DEPLOYER_APP_ID: ${{ secrets.DEPLOYER_APP_ID }}
    DEPLOYER_APP_INSTALLATION_ID: ${{ secrets.DEPLOYER_APP_INSTALLATION_ID }}
    DEPLOYER_APP_PRIVATE_KEY: ${{ secrets.DEPLOYER_APP_PRIVATE_KEY }}
  run: |
    TOKEN=$(npx tsx scripts/github/get-github-app-token.ts)
    echo "token=$TOKEN" >> $GITHUB_OUTPUT
    echo "::add-mask::$TOKEN"
```

### Token Usage

The token is then used in subsequent steps:
- **Docker Login**: `password: ${{ steps.github-token.outputs.token }}`
- **Deploy Scripts**: `export GHCR_PAT="${{ steps.github-token.outputs.token }}"`

## Files Modified/Created

1. **`package.json`**: Added `jose` dependency
2. **`scripts/github/github-app-auth.ts`**: Standalone authentication service (CI/CD only)
3. **`scripts/github/get-github-app-token.ts`**: GitHub Actions script entry point
4. **`.github/workflows/build-node.yml`**: Updated to use GitHub App token
5. **`.github/workflows/deploy-gcp-compute-vm-ssh.yml`**: Updated to use GitHub App token

## Architecture Decision

The GitHub App authentication code is located in `scripts/github/` rather than `src/lib/services/` because:
- It's **only used in CI/CD pipelines**, not in the application runtime
- Keeps CI/CD dependencies separate from application code
- Reduces application bundle size (no need to include this in production builds)
- Makes it clear this is infrastructure/automation code, not application logic

## Security Features

1. **Token Masking**: Tokens are automatically masked in GitHub Actions logs
2. **Key Normalization**: Handles various PEM key formats securely
3. **Error Handling**: Comprehensive error messages for debugging
4. **Token Expiration**: Tokens automatically expire after 1 hour (GitHub's limit)

## Testing

To test locally:

```bash
export DEPLOYER_APP_ID="your_app_id"
export DEPLOYER_APP_INSTALLATION_ID="your_installation_id"
export DEPLOYER_APP_PRIVATE_KEY="$(cat path/to/private-key.pem)"

npx tsx scripts/github/get-github-app-token.ts
```

The script will output the installation access token to stdout.
