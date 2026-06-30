# AASTool — Development Workflow Guide

**Enterprise Edition | Version 1.0.0**

---

## Overview

This guide documents the complete development lifecycle for AASTool:

```
Develop API
    ↓
Test manually with Postman
    ↓
Fix problems
    ↓
Create automated tests
    ↓
Run tests before deployment
```

---

## Table of Contents

1. [Develop API](#1-develop-api)
2. [Test Manually with Postman](#2-test-manually-with-postman)
3. [Fix Problems](#3-fix-problems)
4. [Create Automated Tests](#4-create-automated-tests)
5. [Run Tests Before Deployment](#5-run-tests-before-deployment)

---

## 1. Develop API

### Architecture

```
Request → Express Route → Controller → Service → TypeORM → MariaDB
                                           ↓
                                    Response JSON
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| HTTP Framework | Express 4 | Route handling, middleware |
| ORM | TypeORM 0.3 | Database queries, entities |
| Database | MariaDB 10.11 | Data persistence |
| Language | TypeScript 5 | Type safety |
| Module System | CommonJS | Node.js compatibility |

### Adding a New Endpoint

**Step 1: Create the controller** (`backend/src/controllers/`)

```typescript
// backend/src/controllers/exampleController.ts
import { Request, Response } from 'express';

export async function getExample(req: Request, res: Response) {
  try {
    res.json({ ok: true, data: { message: 'Hello from example' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Failed to fetch example' });
  }
}
```

**Step 2: Register the route** (`backend/src/index.ts`)

```typescript
import { getExample } from './controllers/exampleController';

// After existing routes:
app.get('/api/v1/example', getExample);
```

**Step 3: Add an entity** (if new table needed) (`backend/src/entities/`)

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'examples' })
export class Example {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;
}
```

**Step 4: Register entity** in `backend/src/data-source.ts`

```typescript
entities: [Criterion, BuildingType, Evaluation, NebThreshold, Config, DisabilityType, AssessmentDimension, Example],
```

**Step 5: Build and test**

```bash
cd backend
npm run build
export DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
node dist/index.js
```

### Response Conventions

All endpoints follow a consistent envelope:

```json
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": "Human-readable message" }

// Evaluate endpoint (special case)
{ "ok": true, "result": { ... } }
```

HTTP status codes:
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation) |
| 404 | Resource not found |
| 500 | Internal server error |

### Current Endpoints (17 total)

| Method | Endpoint | Controller |
|--------|----------|------------|
| GET | `/health` | Inline |
| GET | `/api/v1/health` | Inline |
| POST | `/api/v1/evaluate` | `evaluateController` |
| GET | `/api/v1/criteria` | `dataController` |
| POST | `/api/v1/criteria` | `dataController` |
| GET | `/api/v1/criteria/:code` | `dataController` |
| GET | `/api/v1/building-types` | `dataController` |
| GET | `/api/v1/neb-thresholds` | `dataController` |
| GET | `/api/v1/config` | `dataController` |
| GET | `/api/v1/disability-types` | `dataController` |
| GET | `/api/v1/assessment-dimensions` | `dataController` |
| GET | `/api/v1/buildings` | `buildingsController` |
| GET | `/api/v1/buildings/:id` | `buildingsController` |
| POST | `/api/v1/assessments` | `assessmentsController` |
| GET | `/api/v1/assessments/:id` | `assessmentsController` |
| GET | `/api/v1/reports` | `reportsController` |
| POST | `/api/v1/login` | `authController` |

### Environment Variables

```bash
# Required
export DATABASE_URL="mysql://user:password@host:3306/database"

# Optional (with defaults)
export PORT=4000
export APP_VERSION=1.0.0
export JWT_SECRET="your-secret-key"
export JWT_EXPIRES_IN=3600
export LOGIN_REDIRECT=/dashboard
export ASSESSMENT_STATUS=Completed
export REPORT_LOCALE=en-US
export REPORT_TITLE_PREFIX="Accessibility Report"
```

---

## 2. Test Manually with Postman

### Postman Collection

A complete Postman collection is available at `docs/AASTool-API.postman_collection.json` with 30+ pre-configured requests.

**Import Options** (from easiest):

**Option A — Run in Postman (one click):**
[![Run in Postman](https://run.pstmn.io/button.svg)](https://www.postman.co/workspace/My-Workspace~b4dff02b-afb4-4513-8ca4-21b9afd99b4b/run/56274532-3f4b1953-6b2a-4216-ab2e-c06b47325ad0?action=share&creator=56274532)

**Option B — Import from GitHub URL:**
```
Open Postman → Import → Link
https://raw.githubusercontent.com/YiannisYiangouDev/AASTool/main/docs/AASTool-API.postman_collection.json
```

**Option C — Import from file:**
```
Open Postman → Import → Files → docs/AASTool-API.postman_collection.json
```

### Manual Test Sequence

#### 1. Health Check

```bash
curl http://localhost:4000/health
```
Expected: `{"status":"ok","database":"connected",...}`

#### 2. List Criteria

```bash
curl http://localhost:4000/api/v1/criteria
```
Expected: 63 criteria returned

#### 3. Get Single Criterion

```bash
curl http://localhost:4000/api/v1/criteria/EC1.1.1
```
Expected: Single criterion with 5 levels

#### 4. Run Evaluation

```bash
curl -s http://localhost:4000/api/v1/evaluate \
  -X POST -H "Content-Type: application/json" \
  -d '{"buildingType":"Commercial Buildings"}'
```
Expected: OBS: 60, NEB: A, 63 criteria

#### 5. Test Error Handling

```bash
# Invalid building type
curl -s http://localhost:4000/api/v1/evaluate \
  -X POST -H "Content-Type: application/json" \
  -d '{"buildingType":"Nonexistent"}'
# Expected: 400 "Missing or invalid disability_weights"

# Empty body
curl -s http://localhost:4000/api/v1/evaluate \
  -X POST -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 "buildingType must be a string"

# Malformed JSON
curl -s http://localhost:4000/api/v1/evaluate \
  -X POST -H "Content-Type: application/json" \
  -d 'not-json'
# Expected: 400 "Invalid JSON body"

# Invalid criteria code
curl -s http://localhost:4000/api/v1/criteria/INVALID
# Expected: 404 "Criterion not found"

# Login with no password
curl -s http://localhost:4000/api/v1/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
# Expected: 400 "Email and password are required"
```

#### 6. Custom Scores

```bash
curl -s http://localhost:4000/api/v1/evaluate \
  -X POST -H "Content-Type: application/json" \
  -d '{"buildingType":"Commercial Buildings","scores":{"EC1.1.1":5,"EC2.5.3":1}}'
```
Expected: Strengths > 0, Weaknesses > 0

#### 7. Login

```bash
curl -s http://localhost:4000/api/v1/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```
Expected: Access token received

### Quick Smoke Test (One-Liner)

```bash
echo "=== Health ===" && \
curl -s http://localhost:4000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Status: {d[\"status\"]}, DB: {d[\"database\"]}')" && \
echo "=== Criteria ===" && \
curl -s http://localhost:4000/api/v1/criteria | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"data\"])} criteria')" && \
echo "=== Evaluate ===" && \
curl -s http://localhost:4000/api/v1/evaluate -X POST -H "Content-Type: application/json" -d '{"buildingType":"Commercial Buildings"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OBS: {d[\"result\"][\"obs\"]}, NEB: {d[\"result\"][\"nebClass\"]}')" && \
echo "=== Login ===" && \
curl -s http://localhost:4000/api/v1/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Token: {d[\"accessToken\"][:20]}...')" && \
echo "=== All checks passed ==="
```

---

## 3. Fix Problems

### Common API Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` | Backend not running | `bash start-dev.sh` |
| `DATABASE_URL not configured` | Missing `.env` | `cp .env.example .env` in `backend/` |
| `Cannot POST /api/v1/login` | Wrong route | Use `/api/v1/login` (not `/api/v1/auth/login`) |
| `Internal error` on evaluate | Bad building type | Use: Commercial, Residential, Industrial, etc. |
| 0 criteria returned | DB not seeded | `npm run seed` in backend |
| `EADDRINUSE` | Port already in use | `pkill -f "node dist/index"` then restart |

### Development Debugging

```bash
# Check logs
tail -f /tmp/backend.log
tail -f /tmp/frontend.log

# Check ports
ss -tlnp | grep -E ':(3000|4000|3306)\s'

# Kill stale processes
pkill -f "node dist/index.js"
pkill -f "next-server"

# Full clean restart
bash scripts/stop-dev.sh
bash scripts/start-dev.sh
```

### Build Issues

```bash
# Backend build fails
cd backend && npm run build

# Frontend TS errors
cd frontend && npx tsc --noEmit

# Frontend build hangs (stale cache)
cd frontend && rm -rf .next && npm run build
```

---

## 4. Create Automated Tests

### Test Structure

Tests are located in `backend/src/tests/`:

```
backend/src/tests/
├── static.test.ts              # No hardcoded calc values
├── workbook.mapping.test.ts    # 63 criteria integrity (13 checks)
├── calculation.test.ts         # OBS range, avg score, NEB class
└── metadata.test.ts            # Static + DB-dependent checks
```

### Running Tests

```bash
cd backend

# Run all tests (requires DB)
export DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
npm run test:automated

# Run individual tests
npx ts-node src/tests/static.test.ts
npx ts-node src/tests/workbook.mapping.test.ts
npx ts-node src/tests/calculation.test.ts

# Metadata test (static only — no DB)
SKIP_DB_TESTS=true npx ts-node src/tests/metadata.test.ts

# Metadata test (with DB)
node dist/tests/metadata.test.js
```

### Writing a New Test

**Example: Testing a new endpoint**

Create `backend/src/tests/example.test.ts`:

```typescript
import assert from 'assert';

// Static validation (no DB needed)
function testExample() {
  const result = { ok: true, data: { count: 5 } };
  assert(result.ok === true, 'should return ok');
  assert(result.data.count > 0, 'count should be positive');
  console.log('  ✓ Example test passed');
}

async function run() {
  console.log('\nExample Tests\n');
  testExample();
  console.log('\nAll example tests passed');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Then add it to `package.json` scripts:

```json
"test:example": "ts-node src/tests/example.test.ts",
"test:automated": "ts-node src/tests/metadata.test.ts && ts-node src/tests/static.test.ts && ts-node src/tests/calculation.test.ts && ts-node src/tests/example.test.ts"
```

### What Each Test Covers

#### `static.test.ts`
- Scans source code for hardcoded calculation values
- Checks for banned patterns like `85, 60, 40` thresholds or `MAX_OBS = 25`

#### `workbook.mapping.test.ts` (13 checks)
| Check | What It Validates |
|-------|-------------------|
| Criteria count | Exactly 63 criteria |
| Code format | Pattern `EC{dt}.{ad}.{seq}` |
| Code-meta match | Code EC1.1.x → disability=1, dimension=1 |
| DT distribution | All 5 disability types have criteria |
| AD distribution | All 5 assessment dimensions have criteria |
| DT-AD pairs | All 25 combinations represented |
| Levels | Each criterion has exactly 5 levels |
| Value range | All values in (0, 1] |
| Score range | All default scores 1-5 |
| Code uniqueness | No duplicate codes |
| Building types | 7 types with valid weights |
| Building weights | Each type has 5-element arrays |
| Labels | DT and AD names present |

#### `calculation.test.ts`
- OBS is a number in range 0-100
- Average raw score is 1-5
- `nebClass` exists
- 63 criteria in result

#### `metadata.test.ts`
**Static (no DB):**
- DATABASE_URL format check
- Criterion entity field validation
- BuildingType weights array length
- Config keys sanity check

**DB-dependent:**
- DataSource connects
- At least 60 criteria in DB
- MAX_OBS config exists and is positive
- Building types have valid weights

---

## 5. Run Tests Before Deployment

### Pre-Deployment Check Script

`check-deploy.sh` runs **13 automated checks** across 5 phases:

```bash
# Full check (requires running backend)
bash check-deploy.sh

# Skip frontend build (faster)
CHECK_SKIP_FRONTEND=true bash check-deploy.sh
```

### What It Checks

#### Phase 1: Environment (4 checks)
| # | Check | Pass Condition |
|---|-------|---------------|
| 1 | Node.js installed | `node -v` succeeds |
| 2 | npm installed | `npm -v` succeeds |
| 3 | Git available | `git --version` succeeds |
| 4 | DATABASE_URL configured | Found in `.env` or `.env.example` |

#### Phase 2: Backend Compilation (2 checks)
| # | Check | Pass Condition |
|---|-------|---------------|
| 5 | TypeScript noEmit | `tsc --noEmit` exits 0 |
| 6 | Full build | `npm run build` exits 0 |

#### Phase 3: Automated Tests
| # | Check | Type |
|---|-------|------|
| 7 | Static checks | No DB |
| 8 | Workbook mapping | No DB |
| 9 | Metadata static | No DB |
| 10 | Evaluate API | API call |
| 11 | Metadata API | API call |
| 12 | Smoke test (12 API checks) | API calls |

#### Phase 5: Code Quality (2 checks)
| # | Check | What It Prevents |
|---|-------|------------------|
| 13 | No .env in staging | Accidental credential commit |
| 14 | No hardcoded secrets | `rootpass`/`mypassword` in source |

### CI/CD Integration (GitHub Actions)

The `.github/workflows/deploy.yml` pipeline automatically runs:

```yaml
- name: Run pre-deployment checks
  run: bash check-deploy.sh
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Pipeline stages:
```
Push to main
    ↓
test-backend (MariaDB service container + tests)
    ↓
build-backend (tsc compilation)
    ↓
deploy-backend (Azure App Service)
    ↓
build-frontend (next build)
    ↓
deploy-frontend (Azure Static Web Apps)
```

### Azure Deployment

Full deployment guide at `docs/azure-deployment.md`.

```bash
# Deploy infrastructure
cd azure
az deployment sub create \
  --location westeurope \
  --template-file main.bicep \
  --parameters environment=production dbPassword='...' dbAdminPassword='...'

# Required GitHub secrets
# - AZURE_WEBAPP_PUBLISH_PROFILE
# - AZURE_STATIC_WEB_APPS_TOKEN
```

---

## Complete Workflow Example

Here's the full workflow from development to deployment:

```bash
# 1. DEVELOP
cd backend
# Edit controller, entity, route...

npm run build           # Verify compilation
export DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
node dist/index.js      # Test manually

# 2. TEST MANUALLY
curl http://localhost:4000/api/v1/criteria | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"data\"])} criteria')"

# 3. FIX PROBLEMS
# (iterate on errors found)

# 4. CREATE AUTOMATED TESTS
# Write test file in backend/src/tests/
npx ts-node src/tests/example.test.ts

# 5. RUN CHECKS BEFORE DEPLOYMENT
bash check-deploy.sh

# If all pass:
git add -A
git commit -m "feat: add new feature"
git push origin main
# → GitHub Actions auto-deploys to Azure
```

---

## File Reference

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Express app entry, route registration |
| `backend/src/controllers/` | Route handlers (6 controllers) |
| `backend/src/entities/` | TypeORM entity models (7 entities) |
| `backend/src/services/` | Business logic (calculation + metadata) |
| `backend/src/tests/` | Test files (4 test suites) |
| `docs/AASTool-API.postman_collection.json` | Importable Postman collection (30+ requests) |
| `docs/postman-testing.md` | Postman testing guide with Run in Postman button |
| `check-deploy.sh` | Pre-deployment check script (13 checks) |
| `docs/api.md` | Full API reference |
| `docs/backend.md` | Backend architecture docs |
| `docs/azure-deployment.md` | Azure deployment guide |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline |
| `azure/main.bicep` | Azure infrastructure template |

---

*AASTool by Serg | Dev by Y*
