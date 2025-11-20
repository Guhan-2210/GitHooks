# GitHub Secrets Setup Guide

## Required Secrets for CI/CD Workflow

This workflow uses GitHub Secrets to store sensitive information. Follow this guide to set them up.

## 🔑 Secrets to Configure

### 1. NODE_ENV (Optional)
- **Purpose**: Set the environment for running tests
- **Default**: Falls back to `test` if not set
- **Recommended Value**: `test` or `production`

### 2. MY_SECRET (Optional)
- **Purpose**: Example secret for custom usage in your workflow
- **Use Cases**: 
  - API keys
  - Database credentials
  - Deployment tokens
  - Custom configuration values

### 3. CODECOV_TOKEN (Optional)
- **Purpose**: If you want to integrate with Codecov in the future
- **Note**: Currently not used, but available if needed

## 📝 How to Add Secrets

### Method 1: GitHub Web UI

1. Go to your repository on GitHub
2. Click `Settings` (repository settings, not account settings)
3. In the left sidebar, click `Secrets and variables` → `Actions`
4. Click `New repository secret`
5. Add each secret:

```
Name: NODE_ENV
Value: test
```

```
Name: MY_SECRET
Value: your-secret-value-here
```

### Method 2: GitHub CLI

```bash
# Set NODE_ENV
gh secret set NODE_ENV --body "test"

# Set MY_SECRET
gh secret set MY_SECRET --body "your-secret-value-here"

# Or set from a file
gh secret set MY_SECRET < secret-value.txt

# Interactive mode (will prompt for value)
gh secret set MY_SECRET
```

### Method 3: GitHub CLI (from stdin)

```bash
echo "test" | gh secret set NODE_ENV
echo "my-secret-value" | gh secret set MY_SECRET
```

## 🔍 Verify Secrets are Set

The workflow includes a step that prints whether secrets are configured:

```yaml
- name: Print Workflow Info
  run: |
    echo "NODE_ENV Secret: ${{ secrets.NODE_ENV != '' && '✅ Set' || '❌ Not Set' }}"
    echo "MY_SECRET Secret: ${{ secrets.MY_SECRET != '' && '✅ Set' || '❌ Not Set' }}"
```

This will show ✅ if the secret is set, or ❌ if it's missing.

## 🛡️ Security Best Practices

### DO:
- ✅ Use secrets for sensitive data (API keys, tokens, passwords)
- ✅ Use descriptive names for secrets
- ✅ Rotate secrets regularly
- ✅ Use different secrets for different environments
- ✅ Limit secret access to necessary workflows only

### DON'T:
- ❌ **NEVER** print secret values directly (they will be masked, but still don't)
- ❌ Don't commit secrets to the repository
- ❌ Don't share secrets in pull request comments
- ❌ Don't use secrets in untrusted forks (disabled by default)
- ❌ Don't store non-sensitive config as secrets (use env vars instead)

## 📊 How Secrets Are Used in the Workflow

### Job-level Environment Variables

```yaml
env:
  NODE_ENV: ${{ secrets.NODE_ENV || 'test' }}
  MY_SECRET: ${{ secrets.MY_SECRET }}
```

All steps in the job can access these as `$NODE_ENV` and `$MY_SECRET`.

### Step-level Environment Variables

```yaml
- name: Run Tests with Coverage
  run: npm run test:coverage
  env:
    CI: true
    GITHUB_ACTIONS: true
```

These are only available in that specific step.

## 🎯 Viewing Secrets in Workflow Output

The workflow prints secret status (without revealing values):

```bash
========================================
🔐 SECRETS STATUS
========================================
NODE_ENV Secret: ✅ Set
MY_SECRET Secret: ✅ Set
========================================
🔐 ENVIRONMENT VARIABLES (from secrets)
========================================
NODE_ENV: test
MY_SECRET: ***REDACTED***
MY_SECRET Length: 16
========================================
```

**Note**: Secret values are automatically masked by GitHub Actions, so even if you accidentally print them, they'll show as `***`.

## 🔄 Updating Secrets

Secrets can be updated at any time:

```bash
# Update existing secret
gh secret set NODE_ENV --body "production"

# List all secrets (won't show values)
gh secret list

# Delete a secret
gh secret delete MY_SECRET
```

## 🌍 Environment-Specific Secrets

For different environments (dev/staging/prod), you can:

1. **Use Environment Secrets** (GitHub Environments feature)
2. **Use different repositories** for different environments
3. **Use naming conventions**: `DEV_API_KEY`, `PROD_API_KEY`

## 📚 References

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI Secrets](https://cli.github.com/manual/gh_secret)
- [Security Hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

## ✅ Quick Setup Checklist

- [ ] Navigate to Repository Settings → Secrets and variables → Actions
- [ ] Add `NODE_ENV` secret with value `test`
- [ ] Add `MY_SECRET` secret with your custom value
- [ ] Verify secrets are listed (values are hidden)
- [ ] Run the workflow to see secret status in logs
- [ ] Confirm secrets are working (check workflow output)

---

**Need Help?** Check the workflow logs for secret status output, or refer to the [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

