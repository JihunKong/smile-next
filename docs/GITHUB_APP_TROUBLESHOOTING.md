# GitHub App Authentication Troubleshooting

## Error: "Missing required environment variables"

If you're seeing this error, it means the GitHub App secrets are not being passed to the workflow step.

### Step 1: Verify Secrets Are Set

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Verify these three secrets exist:
   - `DEPLOYER_APP_ID`
   - `DEPLOYER_APP_INSTALLATION_ID`
   - `DEPLOYER_APP_PRIVATE_KEY`

### Step 2: Check Secret Values

**DEPLOYER_APP_ID**:
- Should be a numeric string (e.g., `"123456"`)
- Found in your GitHub App settings: `https://github.com/settings/apps/YOUR_APP_NAME`

**DEPLOYER_APP_INSTALLATION_ID**:
- Should be a numeric string (e.g., `"987654"`)
- Found by calling: `GET /app/installations` with your App JWT
- Or in the URL when viewing your app installation: `https://github.com/settings/installations/INSTALLATION_ID`

**DEPLOYER_APP_PRIVATE_KEY**:
- Should be the full content of your `.pem` file
- Can include literal `\n` characters or actual newlines
- Starts with `-----BEGIN RSA PRIVATE KEY-----` or `-----BEGIN PRIVATE KEY-----`
- Ends with `-----END RSA PRIVATE KEY-----` or `-----END PRIVATE KEY-----`

### Step 3: Verify Workflow Secret Inheritance

The workflows use `secrets: inherit` which should pass all secrets. If secrets aren't being inherited:

1. **For reusable workflows** (`workflow_call`):
   - The calling workflow must have access to the secrets
   - Check that `secrets: inherit` is present in the workflow call

2. **For organization-level secrets**:
   - Ensure the repository has access to organization secrets
   - Check repository settings: **Settings** → **Secrets and variables** → **Actions** → **Access**

### Step 4: Check the Verification Step

The workflow now includes a "Verify GitHub App Secrets" step that will:
- Check if each secret is set
- Show the length of each secret (without revealing the value)
- Fail early with a clear error message

If this step fails, the secrets are definitely not being passed.

### Step 5: Manual Testing

You can test locally to verify your credentials work:

```bash
export DEPLOYER_APP_ID="your_app_id"
export DEPLOYER_APP_INSTALLATION_ID="your_installation_id"
export DEPLOYER_APP_PRIVATE_KEY="$(cat path/to/private-key.pem)"

npx tsx scripts/github/get-github-app-token.ts
```

If this works locally but fails in GitHub Actions, the issue is with secret configuration in GitHub.

### Common Issues

1. **Secrets not set at repository level**
   - Solution: Add secrets in repository settings

2. **Secrets set but workflow doesn't have access**
   - Solution: Check workflow permissions and repository access settings

3. **Private key format issues**
   - Solution: Ensure the entire PEM file content is copied, including headers and newlines
   - If using literal `\n`, ensure they're preserved when pasting into GitHub secrets

4. **Organization secrets not accessible**
   - Solution: Verify repository has access to organization secrets in repository settings

### Debug Output

The improved error handling will now show:
- Which specific variables are missing
- Length of each variable (to verify they're not empty strings)
- Helpful error message pointing to repository settings

Look for the "Verify GitHub App Secrets" step output in your workflow logs to see exactly what's missing.

## Error: "403 Forbidden" when pushing to GitHub Container Registry

If you're seeing a 403 error when trying to push Docker images to `ghcr.io`, it means the GitHub App token doesn't have the required permissions.

### Symptoms

```
ERROR: failed to push ghcr.io/seeds-smile-the-ultimate/smile-web:pr-7: 
unexpected status from HEAD request to https://ghcr.io/v2/.../blobs/...: 403 Forbidden
```

### Root Cause

The GitHub App doesn't have the `write:packages` permission enabled, or the installation hasn't accepted the updated permissions.

### Solution

1. **Enable Packages Permission in GitHub App Settings**:
   - Go to: https://github.com/settings/apps
   - Select your GitHub App
   - Navigate to **"Permissions & events"**
   - Under **"Repository permissions"**, find **"Packages"**
   - Set it to **"Write"**
   - Under **"Account permissions"** (if using organization packages), also set **"Packages"** to **"Write"**
   - Click **"Save changes"**

2. **Accept Updated Permissions for Installation**:
   - Go to: https://github.com/settings/installations
   - Find your installation (should show your organization/repository)
   - Click **"Configure"**
   - Review the updated permissions
   - Click **"Save"** or **"Update"** to accept the new permissions

3. **Verify the Fix**:
   - Re-run your workflow
   - The token should now have `packages:write` permission
   - The push to GHCR should succeed

### Verification

After updating permissions, you can verify the token has the right permissions by checking the workflow logs. The "Get GitHub App Token" step will show a warning if the token doesn't have `packages:write` permission.

### Additional Notes

- If you're using organization-level packages, you may need both repository and account permissions
- Some organizations have additional security policies that restrict package access
- The installation must be granted access to the specific repository where packages are stored

### If Token Has Packages:Write But Still Getting 403

If your token shows `packages: write` permission but you're still getting 403 errors, the issue is likely:

1. **Package Access Permissions (Most Common)**: The package may only have read access, not write access
   - Go to your package page: `https://github.com/orgs/seeds-smile-the-ultimate/packages/container/smile-web`
   - Click "Package settings" → "Manage access"
   - Ensure your repository or workflow has **Write** access (not just Read)
   - If the package was created with a personal token, you may need to grant the organization/workflow write access
   - For organization-level packages, ensure the repository has write permissions

2. **Organization Package Settings**: The GitHub App installation may not be allowed to create organization-level packages
   - Go to your organization settings: `https://github.com/organizations/seeds-smile-the-ultimate/settings/packages`
   - Check "Package creation" settings
   - Ensure GitHub Apps are allowed to create packages
   - Or check if there are specific package access restrictions

3. **Package Visibility**: The package might need to be created first, or visibility settings might block access
   - Try creating the package manually first via the GitHub UI
   - Or ensure the package visibility allows the installation to push

4. **Repository-Level vs Organization-Level**: 
   - If pushing to `ghcr.io/seeds-smile-the-ultimate/smile-web`, this is an organization-level package
   - Organization-level packages have additional restrictions
   - You may need to explicitly grant the installation access in package settings

5. **Alternative Solution**: If GitHub App limitations persist, consider:
   - Using a Personal Access Token (PAT) with `write:packages` scope as a temporary workaround
   - Or using the `GITHUB_TOKEN` (which has packages access) for builds within the same repository
