# AASTool — Deploy Backend & Database to Azure

**Deploy the Express API + MariaDB. The frontend is deployed separately.**

---

## Architecture (Azure)

```
Internet
    │
    ▼
Azure App Service (Linux / Node 22)
    │  Backend API — https://api.yourdomain.com
    │  PORT=4000, NODE_ENV=production
    │
    ▼
Azure Database for MariaDB
    │  mydb — 7 tables, 63 criteria, seeded
    │  SSL-enabled, firewall-restricted
    │
    ▼
Azure Key Vault (optional)
     JWT_SECRET, DB passwords
```

**Only the backend is deployed here. The frontend (Next.js) is a separate deployment.**

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Azure CLI | Latest (`az --version`) |
| Node.js | 22.x |
| npm | 9+ |
| Git | 2.40+ |
| Azure subscription | Active |

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "your-subscription-id"

# Register resource providers
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.DBforMariaDB
```

---

## Step 1: Create Azure Resources

### Option A — Using Bicep (recommended)

```bash
cd azure

az deployment sub create \
  --location westeurope \
  --template-file main.bicep \
  --parameters \
      environment=production \
      dbPassword='Y0urS3cureP@ss!' \
      dbAdminPassword='Y0urAdminP@ss!'
```

This creates:
- **Resource group**: `rg-aas-production`
- **App Service Plan**: Linux B1 (Basic)
- **App Service**: `app-aas-backend-production` (Node 22)
- **MariaDB Server**: `mariadb-aas-production` (2 vCores, 20GB)
- **MariaDB Database**: `mydb`
- **Firewall rule**: Azure services allowed

### Option B — Manual via Azure Portal

1. Create **Resource Group** → `rg-aas-production`
2. Create **Azure Database for MariaDB**:
   - Server name: `mariadb-aas-production`
   - Admin: `aasadmin`
   - Version: 10.3
   - Compute: 2 vCores, 20GB
   - Firewall: Add your IP + "Allow Azure services"
3. Create **App Service** (Linux):
   - Name: `app-aas-backend-production`
   - Runtime stack: Node 22
   - App Service Plan: B1 (Basic)
   - Health check path: `/ready`

---

## Step 2: Configure Database

### Get the connection string

```bash
# From Bicep outputs
az deployment sub show \
  --name main \
  --query properties.outputs

# Output:
# {
#   "backendUrl": "https://app-aas-backend-production.azurewebsites.net",
#   "mariadbFqdn": "mariadb-aas-production.mariadb.database.azure.com"
# }
```

### Create the application user

```bash
mysql -h mariadb-aas-production.mariadb.database.azure.com \
  -u aasadmin@mariadb-aas-production -p
```

```sql
CREATE USER IF NOT EXISTS 'myuser'@'%' IDENTIFIED BY 'Y0urS3cureP@ss!';
GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'%';
FLUSH PRIVILEGES;
```

### Verify the database

```bash
mysql -h mariadb-aas-production.mariadb.database.azure.com \
  -u myuser@mariadb-aas-production -p'Y0urS3cureP@ss!' mydb -e \
  "SELECT COUNT(*) FROM criteria;"
# Expected: 63
```

---

## Step 3: Set Environment Variables in App Service

### Required

```bash
az webapp config appsettings set \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --settings \
    PORT=4000 \
    WEBSITES_PORT=4000 \
    NODE_ENV=production \
    DATABASE_URL="mysql://myuser:Y0urS3cureP@ss!@mariadb-aas-production.mariadb.database.azure.com:3306/mydb?ssl=true" \
    DB_TYPE=mariadb \
    TYPEORM_SYNCHRONIZE=false \
    CORS_ORIGIN="https://your-frontend-domain.azurestaticapps.net" \
    JWT_SECRET="<generate-a-random-64-char-string>" \
    JWT_EXPIRES_IN=3600
```

### Recommended

```bash
az webapp config appsettings set \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --settings \
    LOG_LEVEL=info \
    TRUST_PROXY=true \
    RATE_LIMIT_WINDOW_MS=900000 \
    RATE_LIMIT_MAX=100 \
    REQUEST_LIMIT=1mb \
    APP_VERSION=1.0.0 \
    LOGIN_REDIRECT=/dashboard \
    REPORT_LOCALE=en-GB \
    REPORT_TITLE_PREFIX="Accessibility Report" \
    ASSESSMENT_STATUS=Completed \
    FRONTEND_URL="https://your-frontend-domain.azurestaticapps.net"
```

### Verify settings

```bash
az webapp config appsettings list \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --query "[?name=='NODE_ENV' || name=='DATABASE_URL' || name=='CORS_ORIGIN']" \
  --output table
```

---

## Step 4: Deploy the Backend

### Option A — GitHub Actions (CI/CD)

Push to `main` — the pipeline at `.github/workflows/deploy.yml`:

1. **test-backend**: MariaDB service container → migrations → seed → tests
2. **build-backend**: `npm ci` → `npm run build` → upload artifact
3. **deploy-backend**: Azure Web Apps deploy (zip deploy)

```bash
git push origin main
```

**Required GitHub Secrets:**

| Secret | Value |
|--------|-------|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from App Service → Overview → Get publish profile |
| `AZURE_STATIC_WEB_APPS_TOKEN` | From Static Web App (for frontend deployment) |

### Option B — Manual (zip deploy)

```bash
cd backend

# Build
npm ci
npm run build

# Package
zip -r deploy.zip dist package.json node_modules

# Deploy
az webapp deploy \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --type zip \
  --src-path deploy.zip
```

### Option C — Docker (Container Apps)

```bash
cd backend

# Build image
docker build -t aas-backend:latest .

# Tag and push to Azure Container Registry
az acr login --name youracr
docker tag aas-backend:latest youracr.azurecr.io/aas-backend:latest
docker push youracr.azurecr.io/aas-backend:latest

# Deploy to Container Apps
az containerapp create \
  --resource-group rg-aas-production \
  --name aas-backend \
  --image youracr.azurecr.io/aas-backend:latest \
  --environment-variables DATABASE_URL="..." NODE_ENV=production
```

---

## Step 5: Run Migrations & Seed

```bash
# SSH into App Service
az webapp ssh \
  --resource-group rg-aas-production \
  --name app-aas-backend-production
```

```bash
# Inside the SSH session
cd site/wwwroot

# Run migrations
node dist/scripts/runMigrations.js

# Seed the database (only if first deployment)
node dist/scripts/seed.js
```

---

## Step 6: Verify the Deployment

### Health checks

```bash
# Liveness probe (lightweight)
curl -s https://app-aas-backend-production.azurewebsites.net/health
# → {"status":"ok","uptime":123,"version":"1.0.0"}

# Readiness probe (checks DB)
curl -s https://app-aas-backend-production.azurewebsites.net/ready
# → {"status":"ok","uptime":123,"database":"connected","dbLatencyMs":3}

# API health (legacy)
curl -s https://app-aas-backend-production.azurewebsites.net/api/v1/health
```

### API endpoints

```bash
# Criteria
curl -s https://app-aas-backend-production.azurewebsites.net/api/v1/criteria \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"data\"])} criteria')"

# Building types
curl -s https://app-aas-backend-production.azurewebsites.net/api/v1/building-types \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"data\"])} building types')"

# Evaluate
curl -s https://app-aas-backend-production.azurewebsites.net/api/v1/evaluate \
  -X POST -H "Content-Type: application/json" \
  -d '{"buildingType":"Commercial Buildings"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OBS: {d[\"result\"][\"obs\"]}, NEB: {d[\"result\"][\"nebClass\"]}')"

# Login
curl -s https://app-aas-backend-production.azurewebsites.net/api/v1/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Token: {d[\"accessToken\"][:20]}...')"
```

---

## Step 7: Configure Logging & Monitoring

### Stream logs

```bash
az webapp log tail \
  --resource-group rg-aas-production \
  --name app-aas-backend-production
```

### Enable App Service logs

```bash
az webapp log config \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --docker-container-logging filesystem \
  --level verbose
```

### View recent logs

```bash
az webapp log download \
  --resource-group rg-aas-production \
  --name app-aas-backend-production \
  --log-file logs.zip
```

---

## Environment Variables Reference

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `mysql://user:pass@host:3306/mydb?ssl=true` | Full connection string |
| `CORS_ORIGIN` | `https://app.azurestaticapps.net` | Allowed frontend origins (comma-separated) |
| `JWT_SECRET` | `a1b2c3...` (64 chars) | Auth token signing key |

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Express listen port |
| `WEBSITES_PORT` | `4000` | Azure container port mapping |
| `NODE_ENV` | `development` | Set to `production` |
| `APP_VERSION` | `1.0.0` | Version in health endpoint |
| `TRUST_PROXY` | `false` | Enable for Azure load balancer |
| `REQUEST_LIMIT` | `1mb` | Max request body size |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_TYPE` | `mariadb` | ORM driver |
| `TYPEORM_SYNCHRONIZE` | `false` | Never `true` in production |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `JWT_EXPIRES_IN` | `3600` | Token lifetime (seconds) |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error`, `silent` |

### Reports

| Variable | Default | Description |
|----------|---------|-------------|
| `REPORT_LOCALE` | `en-GB` | Date format locale |
| `REPORT_TITLE_PREFIX` | `Accessibility Report` | Report title prefix |
| `ASSESSMENT_STATUS` | `Completed` | Assessment status label |
| `LOGIN_REDIRECT` | `/dashboard` | Post-login redirect |

### Frontend

| Variable | Description |
|----------|-------------|
| `FRONTEND_URL` | URL of the deployed frontend (used for CORS, redirects) |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/ready` returns 503 | DB not reachable | Check firewall rules, verify `DATABASE_URL` |
| Backend starts but returns 404 on all routes | Wrong startup command | Verify `npm start` → `node dist/index.js` |
| CORS errors in browser | `CORS_ORIGIN` not set | Set the exact frontend URL (with https://) |
| `ETIMEOUT` connecting to MariaDB | SSL required | Add `?ssl=true` to `DATABASE_URL` |
| `Cannot find module` | `node_modules` missing | Run `npm ci --omit=dev` before deploy |
| App Service keeps restarting | Startup timeout | Set `WEBSITES_PORT=4000`, check health endpoint |

---

## Quick Deploy Checklist

- [ ] Azure subscription active
- [ ] Resource group created
- [ ] MariaDB server created + firewall configured
- [ ] Database user created + data verified (63 criteria)
- [ ] App Service created (Node 22, Linux)
- [ ] Environment variables set (20+ vars)
- [ ] CORS_ORIGIN points to frontend domain
- [ ] DATABASE_URL uses SSL (`?ssl=true`)
- [ ] TYPEORM_SYNCHRONIZE = `false`
- [ ] Code pushed to GitHub
- [ ] GitHub Actions pipeline passes
- [ ] Migrations run
- [ ] `/health` returns 200
- [ ] `/ready` returns 200 with `database: "connected"`
- [ ] API endpoints return expected data
- [ ] CORS headers present in responses
- [ ] App Service logs show no errors

---

*AASTool Backend + Database — Azure Deployment Guide*
