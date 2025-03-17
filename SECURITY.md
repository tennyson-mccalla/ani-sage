# Ani-Sage Security Guidelines

## API Keys and Secrets Management

### Local Development

1. **Environment Variables**
   - Store all API keys and secrets in environment variables
   - Use a `.env` file for local development (already in `.gitignore`)
   - Create a `.env.example` file with placeholders to document required variables

2. **Pre-commit Hook**
   - A pre-commit hook is installed to scan for potential API keys in code
   - Run `chmod +x .git/hooks/pre-commit` if needed to ensure it's executable
   - The hook prevents committing files with patterns that look like API keys

### Production Deployment

1. **Environment Configuration**
   - Never commit `.env` files to repositories
   - Set environment variables directly in the production environment
   - For cloud hosting, use secure environment variable storage:
     - Heroku: Config vars
     - Vercel: Environment variables
     - AWS: Parameter Store/Secrets Manager
     - GitHub Actions: Repository secrets

2. **Secrets Rotation**
   - Rotate API keys regularly (at least every 90 days)
   - Implement monitoring to detect unusual API usage patterns
   - Create separate API keys for development and production

### Security Best Practices

1. **Access Control**
   - Apply least privilege principle to all API keys
   - Create separate keys for separate services rather than using one key everywhere
   - Limit API key permissions to only what's needed

2. **Error Handling**
   - Implement graceful fallbacks when API keys are missing
   - Don't expose detailed error messages to end users
   - Log API failures for debugging but sanitize logs

3. **Frontend Security**
   - Never expose API keys in frontend code
   - Use server-side API proxies for client-side applications
   - Implement rate limiting on API endpoints

## Security Incident Response

If a security incident occurs (like leaked credentials):

1. **Immediate Actions**
   - Revoke/rotate compromised credentials immediately
   - Assess the scope of the exposure
   - Review access logs for signs of unauthorized use

2. **Remediation**
   - Update code to remove hardcoded credentials
   - Review and enhance pre-commit hooks and security checks
   - Conduct a security review of other potential vulnerabilities

3. **Prevention**
   - Schedule regular security training for the team
   - Implement additional automated security scanning tools
   - Consider implementing git-secrets or similar tools for broader coverage