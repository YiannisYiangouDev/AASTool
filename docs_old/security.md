# Security Considerations

## Overview

AAS handles building accessibility data. While not processing sensitive personal data, the following security practices are implemented.

## Current Security Measures

### Backend
- **Helmet**: HTTP security headers enabled
- **CORS**: Cross-Origin Resource Sharing configured
- **Input Validation**: Request body validation on evaluate endpoint
- **JSON Parse Protection**: Custom middleware catches malformed JSON
- **Environment Variables**: Database credentials via `DATABASE_URL` env var

### Frontend
- **HTTPS**: Recommended in production
- **XSS Protection**: React's built-in escaping
- **Environment Variables**: API URL via `NEXT_PUBLIC_API_URL`

## Authentication

Currently using **mock JWT authentication** for development. Production should implement:

### Recommended: Azure Entra ID (formerly Azure AD)
```typescript
// @azure/msal-node
import { ConfidentialClientApplication } from '@azure/msal-node';

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
};
```

### Alternative: JWT with refresh tokens
- Store refresh tokens in database
- Implement token revocation on logout
- Use short-lived access tokens (15 min)
- Use httpOnly cookies for refresh tokens

## Production Security Checklist

- [ ] Enable HTTPS (TLS 1.2+)
- [ ] Implement proper authentication (Entra ID or JWT)
- [ ] Add rate limiting to `/api/v1/evaluate`
- [ ] Configure CORS to specific origins
- [ ] Add request size limits
- [ ] Implement audit logging for certification endpoints
- [ ] Use Azure Key Vault for secrets
- [ ] Enable database encryption at rest
- [ ] Configure firewall rules for database
- [ ] Set up automated dependency scanning (Dependabot)
- [ ] Regular security updates via `npm audit`

## Data Protection

### GDPR Considerations
The platform does not currently store personal data of assessed individuals. If personal data is added:
- Implement data retention policies
- Provide data export/deletion capabilities
- Document lawful basis for processing
- Maintain processing activity records

### Database Security
- Connection over SSL in production
- Least-privilege database user
- Regular backups with encryption
- No direct database exposure to internet

## Secrets Management

Never commit secrets to the repository. Use:
1. `.env` files (gitignored) for local development
2. Azure Key Vault for production
3. GitHub Actions secrets for CI/CD

### Required Secrets
| Secret | Purpose |
|--------|---------|
| DATABASE_URL | Database connection string |
| JWT_SECRET | Token signing key |
| AZURE_CLIENT_ID | Entra ID application ID |
| AZURE_CLIENT_SECRET | Entra ID client secret |
| AZURE_TENANT_ID | Entra ID tenant |
