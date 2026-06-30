# AASTool — Azure Enterprise Deployment

**Enterprise Edition | Version 1.0.0**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Provisioning](#infrastructure-provisioning)
4. [Database Setup](#database-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [GitHub Secrets Configuration](#github-secrets-configuration)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment Steps](#post-deployment-steps)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Disaster Recovery](#disaster-recovery)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
                           ┌──────────────────────────┐
                           │   Azure Static Web Apps   │
                           │   (Next.js Frontend)      │
                           │   https://app.xyz/        │
                           └─────────────┬────────────┘
                                         │ HTTPS
                           ┌─────────────▼────────────┐
                           │   Azure App Service       │
                           │   (Express Backend API)   │
                           │   https://api.xyz/        │
                           └─────────────┬────────────┘
                                         │ TCP :3306
                           ┌─────────────▼────────────┐
                           │   Azure Database for      │
                           │   MariaDB                 │
                           │   mariadb-aas-prod.maria  │
                           │   .database.azure.com     │
                           └──────────────────────────┘
```

### Component Breakdown

| Component | Azure Service | SKU | Purpose |
|-----------|--------------|-----|---------|
| **Frontend** | Static Web Apps | Standard | Next.js static export + SSR |
| **Backend** | App Service (Linux) | B1 (Basic) | Express REST API |
| **Database** | Azure Database for MariaDB | 2 vCores, 20GB | Evaluation data, config, users |
| **CI/CD** | GitHub Actions | Included | Automated test → build → deploy |
| **DNS** | Azure DNS / Front Door | Optional | Custom domain, WAF |

---

## Prerequisites

### Azure Subscription

```bash
# Login
az login

# Set active subscription
az account set --subscription "your-subscription-id"

# Register required resource providers
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.DBforMariaDB
az provider register --namespace Microsoft.Storage
```

### GitHub Repository

- Repository: `github.com/YiannisYiangouDev/AASTool`
- Admin access to configure repository secrets
- GitHub Actions enabled

### Local Tools

```bash
# Install Azure CLI
# Windows: winget install Microsoft.AzureCLI
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install Bicep
az bicep install

# Verify
az bicep version
# > Bicep CLI version 0.30.x
```

---

## Infrastructure Provisioning

### Step 1: Create Resource Group with Bicep

Deploy all Azure resources using the provided Bicep templates:

```bash
cd azure

az deployment sub create \
  --location westeurope \
  --template-file main.bicep \
  --parameters \
      environment=production \
      dbPassword='YourSecureP@ssw0rd!' \
      dbAdminPassword='YourAdminP@ssw0rd!'
```

The deployment creates:

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | `rg-aas-production` | Container for all resources |
| App Service Plan | `asp-aas-production` | Linux B1, shared compute |
| Backend App Service | `app-aas-backend-production` | Express API |
| Static Web App | `stapp-aas-frontend-production` | Next.js frontend |
| MariaDB Server | `mariadb-aas-production` | Database server |
| MariaDB Database | `mydb` | Application database |
| Firewall Rule | `AllowAzureServices` | Azure service access |

### Step 2: Configure MariaDB Firewall

After deployment, add your deployment IP to the MariaDB firewall:

```bash
# Get your current public IP
MY_IP=$(curl -s ifconfig.me)

# Add firewall rule for GitHub Actions runner IPs
az mariadb server firewall-rule create \
  --resource-group rg-aas-production \
  --server mariadb-aas-production \
  --name AllowGitHubActions \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Add your dev IP
az mariadb server firewall-rule create \
  --resource-group rg-aas-production \
  --server mariadb-aas-production \
  --name AllowDev \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

> **Security**: In production, use Azure Private Link or VNet service endpoints, and remove the 0.0.0.0 rule.

### Step 3: Get Deployment Outputs

```bash
az deployment sub show \
  --name main \
  --query properties.outputs

# Example output:
# {
#   "backendUrl": { "value": "https://app-aas-backend-production.azurewebsites.net" },
#   "frontendUrl": { "value": "https://stapp-aas-frontend-production.azurestaticapps.net" },
#   "mariadbFqdn": { "value": "mariadb-aas-production.mariadb.database.azure.com" }
# }
```

---

## Database Setup

### Step 1: Connect to Azure MariaDB

```bash
# Using MySQL client
mysql -h mariadb-aas-production.mariadb.database.azure.com \
  -u aasadmin@mariadb-aas-production \
  -p
```

### Step 2: Create Application User

```sql
-- Run this on your local machine BEFORE deploying the app
-- The application user (myuser) is created by the init script
CREATE USER IF NOT EXISTS 'myuser'@'%' IDENTIFIED BY 'YourSecureP@ssw0rd!';
GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'%';
FLUSH PRIVILEGES;
```

### Step 3: Verify Connection String

Ensure the `DATABASE_URL` in App Service settings is correct:

```
mysql://myuser:YourSecureP@ssw0rd!@mariadb-aas-production.mariadb.database.azure.com:3306/mydb
```

You can verify this directly:

```bash
# Test connection from App Service (via SSH or Kudu)
curl -s http://localhost:4000/health
# Expected: { "status": "ok", "database": "connected", ... }
```

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:

### Pipeline Stages

```
Push to main
    │
    ▼
┌─────────────────────┐
│  test-backend       │  ← MariaDB service container, runs migrations + seed + tests
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  build-backend      │  ← npm ci, npm run build, uploads dist/
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  deploy-backend     │  ← Azure Web Apps deploy (zip deploy to App Service)
└─────────────────────┘

┌─────────────────────┐
│  build-frontend     │  ← npm ci, npm run build, uploads .next/
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  deploy-frontend    │  ← Azure Static Web Apps deploy
└─────────────────────┘
```

### Triggering a Deployment

- **Automatic**: Push to `main` branch
- **Manual**: Go to GitHub → Actions → "Deploy to Azure" → Run workflow

### Deploy Script (Alternative)

For manual deployment from your machine:

```bash
# Backend
cd backend
npm ci
npm run build
zip -r deploy.zip dist package.json node_modules
az webapp deploy \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --type zip \
  --src-path deploy.zip

# Frontend
cd frontend
npm ci
npm run build
npx @azure/static-web-apps-cli deploy \
  --app-location . \
  --output-location .next \
  --deployment-token ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
```

---

## GitHub Secrets Configuration

Configure these secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret Name | Value | Required By |
|-------------|-------|-------------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Publish profile from App Service → Overview → Get publish profile | `deploy-backend` |
| `AZURE_STATIC_WEB_APPS_TOKEN` | Deployment token from Static Web App → Environments → Deployment token | `deploy-frontend` |

### How to Retrieve Secrets

**Backend Publish Profile:**
```bash
az webapp deployment list-publishing-profiles \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --query "[?contains(profileName,'MSDeploy')].publishUrl" \
  --output tsv
```

Or from Azure Portal: App Service → Overview → **Get publish profile** (download XML).

**Frontend Deployment Token:**
```bash
az staticwebapp secrets list \
  --name stapp-aas-frontend-production

# Copy the "apiKey" value
```

Or from Azure Portal: Static Web App → Environments → **Deployment token** (copy).

---

## Environment Variables

### Backend App Service Settings

Configured via App Service → Settings → Environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `4000` | App Service listens on this |
| `WEBSITES_PORT` | `4000` | Azure container port mapping |
| `DATABASE_URL` | `mysql://myuser:***@mariadb-aas-production.mariadb.database.azure.com:3306/mydb` | Full connection string |
| `DB_TYPE` | `mariadb` | ORM driver selection |
| `TYPEORM_SYNCHRONIZE` | `false` | **Never true in production** |
| `JWT_SECRET` | *(random 64-char string)* | HMAC signing key |
| `JWT_EXPIRES_IN` | `3600` | Token lifetime in seconds |
| `APP_VERSION` | `1.0.0` | Version reported by /health |
| `LOGIN_REDIRECT` | `/dashboard` | Post-login path |
| `ASSESSMENT_STATUS` | `Completed` | Default assessment status |
| `REPORT_LOCALE` | `en-GB` | Date format locale |
| `REPORT_TITLE_PREFIX` | `Accessibility Report` | Report title prefix |

### Frontend Static Web App Settings

Configured via Static Web App → Settings → Environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://app-aas-backend-production.azurewebsites.net/api/v1` |

### Setting Variables via CLI

```bash
# Set a single app setting
az webapp config appsettings set \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --settings JWT_SECRET="your-random-secret-here"

# Set frontend env var
az staticwebapp appsettings set \
  --name stapp-aas-frontend-production \
  --setting-entries NEXT_PUBLIC_API_URL="https://app-aas-backend-production.azurewebsites.net/api/v1"
```

---

## Post-Deployment Steps

### Step 1: Run Database Migrations

After first deployment, connect via SSH to the App Service or run locally:

```bash
# Via App Service SSH (Kudu)
# Browse to https://app-aas-backend-production.scm.azurewebsites.net/webssh/host

cd site/wwwroot
node dist/scripts/runMigrations.js

# Or run the seed if needed:
node dist/scripts/seed.js
```

### Step 2: Verify Health Endpoint

```bash
curl -s https://app-aas-backend-production.azurewebsites.net/health
# Expected:
# {
#   "status": "ok",
#   "database": "connected",
#   "dbLatencyMs": 3,
#   "version": "1.0.0"
# }
```

### Step 3: Verify CORS Configuration

The backend has CORS enabled globally (`app.use(cors())`). For production, restrict to your frontend domain:

```bash
az webapp config appsettings set \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --settings CORS_ORIGIN="https://stapp-aas-frontend-production.azurestaticapps.net"
```

> Note: This requires a code change to read `CORS_ORIGIN` from env. Currently `cors()` is configured without options.

### Step 4: Configure Custom Domain (Optional)

```bash
# Add custom domain to Static Web App
az staticwebapp hostname set \
  --name stapp-aas-frontend-production \
  --hostname app.yourdomain.com
```

### Step 5: Enable HTTPS

Both App Service and Static Web Apps enforce HTTPS by default. For additional security:

- Enable **TLS 1.2 only** on App Service
- Configure **Azure Front Door** for WAF + CDN
- Use **Private Endpoint** for MariaDB

---

## Monitoring & Alerts

### Application Insights

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --resource-group rg-aas-production \
  --location westeurope \
  --app aas-backend-insights

# Get instrumentation key
az monitor app-insights component show \
  --resource-group rg-aas-production \
  --app aas-backend-insights \
  --query instrumentationKey

# Add to App Service settings
az webapp config appsettings set \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-key" APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=your-key"
```

### Health Check Alerts

```bash
# Create a metric alert for health endpoint failures
az monitor metrics alert create \
  --resource-group rg-aas-production \
  --name "AAS-Backend-Down-Alert" \
  --description "Triggers when backend health endpoint returns non-200" \
  --condition "count Http2xx < 1" \
  --resource app-aas-backend-production
```

### Recommended Dashboard

- **Backend**: HTTP 5xx errors, response time (p95), CPU/memory
- **Database**: CPU %, storage %, connection count, replication lag
- **Frontend**: Page load time, request count, 404 rate

---

## Disaster Recovery

### Backup Strategy

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| MariaDB | Automated geo-redundant backups | Daily | 7 days |
| App Service config | Export ARM template | On change | Git history |
| Static Web App | Git-controlled | Every push | Git history |
| Environment variables | Documented in `.env.example` | On change | Git history |

### Restore MariaDB

```bash
# List available backups
az mariadb server restore list \
  --resource-group rg-aas-production \
  --server mariadb-aas-production

# Restore to a point in time
az mariadb server restore \
  --resource-group rg-aas-production \
  --server mariadb-aas-production-restored \
  --restore-point-in-time "2026-06-30T12:00:00Z" \
  --source-server mariadb-aas-production
```

### Scale Up (Production)

When moving from development to production:

| Resource | Dev (B1) | Production (Recommended) |
|----------|----------|-------------------------|
| App Service Plan | B1 (1 core, 1.75GB) | P1v2 (1 core, 3.5GB) |
| MariaDB | 2 vCores, 20GB | 4 vCores, 100GB |
| Static Web App | Standard | Standard (with custom domain) |

---

## Troubleshooting

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Backend returns 503 on `/health` | Database unreachable | Check MariaDB firewall rules; verify `DATABASE_URL` in App Service settings |
| Frontend shows blank page | API URL misconfigured | Verify `NEXT_PUBLIC_API_URL` in Static Web App settings |
| CI/CD fails on `deploy-backend` | Expired publish profile | Re-download publish profile from Azure Portal and update GitHub secret |
| `ECONNREFUSED` on database | MariaDB firewall blocking | Add `AllowAzureServices` firewall rule (0.0.0.0) |
| Static Web App build fails | Missing environment variables | Set `NEXT_PUBLIC_API_URL` via `az staticwebapp appsettings set` |

### Debugging with Kudu/SSH

```bash
# SSH into App Service
az webapp ssh \
  --resource-group rg-aas-production \
  --name app-aas-backend-production

# View logs
cd /home/LogFiles
tail -f *.log

# Check environment variables
echo $DATABASE_URL

# Test database connectivity
node -e "const mysql = require('mysql'); const c = mysql.createConnection(process.env.DATABASE_URL); c.connect(err => { console.log(err ? 'FAIL: '+err.code : 'OK'); c.end(); })"
```

### Log Streaming

```bash
# Stream App Service logs
az webapp log tail \
  --resource-group rg-aas-production \
  --name app-aas-backend-production
```

---

## Security Checklist

- [ ] **TLS 1.2 enforced** on App Service and MariaDB
- [ ] **JWT_SECRET** is a cryptographically random string (64+ characters)
- [ ] **TYPEORM_SYNCHRONIZE** is `false` in production
- [ ] **MariaDB firewall** restricts access to Azure services + deployment IPs only
- [ ] **CORS** is scoped to the frontend domain (not `*`)
- [ ] **GitHub secrets** are rotated every 90 days
- [ ] **App Service** requires HTTPS-only (enabled by default)
- [ ] **Static Web Apps** has authentication provider configured (optional)
- [ ] **No secrets** are committed to the repository (`.env` is gitignored)
- [ ] **Audit logs** are enabled for the resource group

---

## Cost Estimation (Monthly)

| Service | SKU | Estimated Monthly Cost |
|---------|-----|----------------------|
| App Service Plan | B1 (Linux) | ~€11 |
| Azure Database for MariaDB | 2 vCores, 20GB | ~€100 |
| Static Web Apps | Standard | ~€9 |
| **Total (Dev)** | | **~€120/month** |
| | | |
| App Service Plan | P1v2 (Linux) | ~€55 |
| Azure Database for MariaDB | 4 vCores, 100GB | ~€350 |
| Static Web Apps | Standard + Custom domain | ~€15 |
| **Total (Production)** | | **~€420/month** |

> Prices are estimates. Use the [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) for accurate estimates.
