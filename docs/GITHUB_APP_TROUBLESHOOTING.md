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
