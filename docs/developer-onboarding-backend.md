<!--
================================================================================
SERG-ASSTool
Backend Developer Guide — The "Kernel"
Enterprise Edition — Version 1.0
Document ID: SERG-TECH-001
Confidentiality: Internal — Backend Engineering Team
Release Date: 2026-06-17
================================================================================
-->

<div class="cover-page">

# SERG-ASSTool

---

## Backend Developer Guide

### Express &middot; TypeScript &middot; MariaDB &middot; EN 17210

---

**Version:** 1.0 | **Release:** 2026-06-17 | **Document ID:** SERG-TECH-001

*&copy; 2026 SERG-ASSTool. Internal &mdash; Backend Engineering Team.*

</div>

<div class="page-break"></div>

---

# 1 EXECUTIVE SUMMARY

The SERG-ASSTool Backend (the "Kernel") is a metadata-driven REST API implementing the **EN 17210** accessibility scoring framework. It is the single source of truth for all business logic, calculations, and data access.

| Responsibility | Implementation |
|---------------|---------------|
| Calculation Engine | 5-layer EN 17210 algorithm (IS &rarr; TIS &rarr; CIS &rarr; OBS &rarr; NEB) |
| Data Persistence | TypeORM + MariaDB with 5 entities |
| REST API | 14 endpoints across 6 controllers |
| Validation | Zod schemas for all POST/PUT |
| Caching | Lazy-initialized in-memory metadata cache |
| Security | Helmet, CORS, HTTPS, TLS 1.2 |
| Enforcement | Static test suite bans hardcoded patterns |

**Core principle:** All configurable values live in the database &mdash; weights, thresholds, criteria, and configuration. Domain experts update the system via SQL or API. No code changes. No deployments.

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4.18 |
| Language | TypeScript 5.1+ (ES2022, CommonJS) |
| ORM | TypeORM 0.3.17 |
| Database | MariaDB 10.11 |
| Validation | Zod 4.4+ |
| Containerization | Docker Compose |
| Cloud | Azure (Bicep IaC) |
| CI/CD | GitHub Actions |

---

<div class="page-break"></div>

# 2 PROJECT OVERVIEW

## Architecture

```
Frontend (Next.js) --> Backend (Express) --> Database (MariaDB)
     ^                      ^                      ^
  "Dumb client"        "The Kernel"        "Single source of truth"
  Zero business         All calculations    All configurable
  logic                 All validation      values
```

## Key Architectural Decisions

1. **Metadata-Driven:** All configurable values in the database, never in code
2. **Single Source of Truth:** Backend is sole authority for calculations
3. **Dynamic Type Detection:** DT 1&ndash;5 and AD 1&ndash;5 derived from criteria data
4. **Config-Driven Thresholds:** NEB breakpoints, strength/weakness, MAX_OBS are all DB rows
5. **Lazy Metadata Caching:** Initializes once, caches lookup data in memory
6. **Static Test Enforcement:** CI blocks deployment if hardcoded patterns detected

## Business Purpose

SERG-ASSTool evaluates buildings against **63 canonical criteria** across a 5&times;5 matrix:

- **5 Disability Types (DT):** Physical, Sensory, Cognitive &amp; Neurodiverse, Communication &amp; Mental Health, Multiple/Situational
- **5 Assessment Dimensions (AD):** Spatial &amp; Physical, Safety &amp; Environmental, Cognitive &amp; Navigational, Digital Interaction, Social Inclusion

Each criterion has a unique code `EC{DT}.{AD}.{index}` (e.g., `EC1.1.1`).

**Certification flow:** Assessor selects building type &rarr; rates criteria 1&ndash;5 &rarr; Backend computes weighted OBS% &rarr; Maps to NEB class (A+/A/B/No Rating) &rarr; Returns strengths, weaknesses, per-DT/AD scores &rarr; Persists with full audit trail.

Targets compliance with **EN 17210** and EU accessibility regulations.

---

<div class="page-break"></div>

# 3 SYSTEM ARCHITECTURE

```
+-------------------------------------------------------------+
|                   PRESENTATION LAYER                        |
| Next.js Pages --> React Components --> Custom Hooks --> Axios|
+-------------------------------------------------------------+
|                      API GATEWAY                            |
| Express Router -> Helmet -> CORS -> JSON Parser -> Error Handler |
+-------------------------------------------------------------+
|                  BUSINESS LOGIC LAYER                       |
| Calculation Service (5-layer engine) + Metadata Service     |
| Zod Validation                                              |
+-------------------------------------------------------------+
|                   DATA ACCESS LAYER                         |
| TypeORM Repositories --> Entities --> Migrations            |
+-------------------------------------------------------------+
|                  PERSISTENCE LAYER                          |
|                     MariaDB 10.11                           |
+-------------------------------------------------------------+
```

**Data flow:** User Input &rarr; Hook &rarr; Axios POST &rarr; Router &rarr; Controller &rarr; Service &rarr; Repository &rarr; MariaDB &rarr; Response &rarr; React Render

---

<div class="page-break"></div>

# 4 BACKEND OVERVIEW

## Folder Structure

```
backend/
├── docker-compose.yml              # MariaDB container
├── docker-initdb.d/init.sql        # DB user/database creation
├── package.json / tsconfig.json
├── src/
│   ├── index.ts                    # Express entry point
│   ├── data-source.ts              # TypeORM DataSource config
│   ├── controllers/                # 6 route handlers
│   │   ├── evaluateController.ts   # POST /api/v1/evaluate
│   │   ├── dataController.ts       # GET/POST criteria, types, thresholds, config
│   │   ├── buildingsController.ts  # GET buildings
│   │   ├── assessmentsController.ts# POST/GET assessments
│   │   ├── reportsController.ts    # GET reports
│   │   └── authController.ts       # POST /api/v1/auth/login
│   ├── services/
│   │   ├── calculationService.ts   # 5-layer EN 17210 engine
│   │   └── metadataService.ts      # Lazy cache + validation
│   ├── entities/                   # Criterion, BuildingType, Evaluation, NebThreshold, Config
│   ├── migrations/                 # 3 sequential schema migrations
│   ├── data/                       # Seed data (criteria.ts, building-types.json)
│   ├── scripts/                    # seed.ts, runMigrations.ts, workbook scripts
│   └── tests/                      # calculation.test.ts, static.test.ts, metadata.test.ts
```

## Controllers

Controllers handle request parsing, validation, and response formatting. **No business logic** &mdash; they delegate to services.

| Controller | Key Endpoints | Purpose |
|-----------|--------------|---------|
| `evaluateController` | `POST /evaluate` | Full EN 17210 evaluation |
| `dataController` | `GET/POST /criteria`, `GET /building-types`, `GET /neb-thresholds`, `GET /config` | Dynamic data CRUD |
| `buildingsController` | `GET /buildings`, `GET /buildings/:id` | Building directory |
| `assessmentsController` | `POST /assessments`, `GET /assessments/:id` | Assessment persistence |
| `reportsController` | `GET /reports` | Evaluation history |
| `authController` | `POST /auth/login` | Mock JWT login |

## Services

**Calculation Service** &mdash; Implements the 5-layer scoring algorithm (see Section 6).

**Metadata Service** &mdash; Lazy-initialized cache:
- Initializes DataSource connection once
- Caches NEB thresholds (ordered DESC by `min`)
- Caches config values per key
- Provides `getBuildingType()`, `getAllCriteria()`, `validateMetadata()`
- Validates all 4 core tables have data on startup; exits code 1 if not

## Static Test Enforcement

`static.test.ts` greps ALL source files for banned hardcoded patterns:
- &#10060; `0.2,0.2,0.2,0.2,0.2` &mdash; equal weights must be DB-driven
- &#10060; `85, 60, 40` &mdash; NEB thresholds must be in `neb_thresholds` table
- &#10060; `MAX_OBS = 25` &mdash; config must be in `config` table

This runs in CI and blocks deployment if violated.

---

<div class="page-break"></div>

# 5 DATABASE OVERVIEW

## Entity-Relationship

```mermaid
erDiagram
    building_types {
        VARCHAR_36 id PK
        VARCHAR_255 name UK
        JSON disability_weights
        JSON dimension_weights
    }
    criteria {
        VARCHAR_36 id PK
        VARCHAR_255 code UK
        TEXT name definition justification
        FLOAT value
        INT disability dimension
        INT score
        JSON levels
    }
    evaluations {
        VARCHAR_36 id PK
        VARCHAR_255 user_id building_type
        JSON scores result
        DATETIME created_at
        DOUBLE obs
        VARCHAR neb_class
        DOUBLE average_raw_score
    }
    neb_thresholds {
        VARCHAR_36 id PK
        INT min
        VARCHAR_50 neb_class
        VARCHAR_50 equivalent
        TEXT meaning
        INT neb_score ordinal
    }
    config {
        VARCHAR_36 id PK
        VARCHAR_255 key UK
        TEXT value
    }
    evaluations ||--o{ building_types : "building_type refs name"
```

## Table Details

### `building_types` (7 rows)
Stores per-type weight matrices for DT and AD.

| Column | Type | Description |
|--------|------|-------------|
| `name` | VARCHAR(255) UNIQUE | e.g., "Commercial Buildings" |
| `disability_weights` | JSON | 5 floats for DT 1&ndash;5 |
| `dimension_weights` | JSON | 5 floats for AD 1&ndash;5 |

Example: `{ "name": "Commercial Buildings", "disability_weights": [0.28,0.22,0.18,0.12,0.2], "dimension_weights": [0.30,0.25,0.18,0.12,0.15] }`

### `criteria` (63 rows)
Canonical evaluation criteria. Each has `value` (importance weight 0&ndash;1), `disability` and `dimension` classification (1&ndash;5), default `score` (3), and `levels` (array of 5 descriptors). Example: `EC1.1.1` &mdash; "Accessible Entrance Width" &mdash; value 0.7, DT 1, AD 1.

### `evaluations` (variable rows)
One row per assessment. Stores `scores` (code&rarr;score map), computed `result` (full JSON), `obs` (%), `neb_class`, `average_raw_score`.

### `neb_thresholds` (4 rows)

| min | neb_class | meaning |
|-----|-----------|---------|
| 85 | A+ | Excellent / Best practice |
| 60 | A | Good |
| 40 | B | Acceptable |
| 0 | No Rating | Non-compliant |

### `config` (5 rows)

| key | value | Description |
|-----|-------|-------------|
| `MAX_OBS` | 25 | Maximum OBS raw score |
| `DEFAULT_SCORE` | 3 | Fallback score |
| `STRENGTH_THRESHOLD` | 5 | Min score for strength |
| `WEAKNESS_THRESHOLD` | 2 | Max score for weakness |
| `TOP_N_RESULTS` | 5 | Results to return |

---

<div class="page-break"></div>

# 6 CALCULATION ENGINE

Implements the **EN 17210 accessibility scoring framework** &mdash; purely metadata-driven, no hardcoded formulas.

## The 5-Layer Algorithm

```
Layer 1: IS        Layer 2: TIS         Layer 3: CIS          Layer 4: OBS          Layer 5: NEB
Impact Score       Total Impact         Combined Impact       Overall Building      Classification
per criterion      Score per DT         Score per AD          Score %               Lookup
    |                   |                    |                    |                    |
IS = value x score  TIS = sum IS per DT  CIS = sum(dtW x IS)  OBS = sum(dtWxTIS)  Find 1st threshold
                                          per AD               /MAX_OBS x 100       where OBS >= min
```

### Layer 1: IS (Impact Score)
`IS(c) = c.value &times; c.score` &mdash; rounded to 4 decimal places.

### Layer 2: TIS (Total Impact Score)
`TIS(dt) = &Sigma; IS(c)` for all criteria where `c.disability === dt`. DT IDs are **derived from data** &mdash; not hardcoded.

### Layer 3: CIS (Combined Impact Score)
`CIS(ad) = &Sigma; (dtWeight[dt] &times; IS(c))` for all criteria where `c.dimension === ad`.

### Layer 4: OBS (Overall Building Score)
`OBS_raw = &Sigma; (dtWeight[dt] &times; TIS(dt))` for all DTs. `OBS_pct = (OBS_raw / MAX_OBS) &times; 100`. MAX_OBS is read from `config` table (value: 25). Rounded to 2 decimal places.

### Layer 5: NEB Classification
Thresholds loaded DESC by `min`: 85, 60, 40, 0. Find first where OBS% &ge; threshold.min &rarr; A+ (&ge;85), A (&ge;60), B (&ge;40), No Rating (&lt;40).

## Additional Computations

- **Strengths/Weaknesses:** Top N where score &ge; STRENGTH_THRESHOLD or &le; WEAKNESS_THRESHOLD (from `config`)
- **Per-DT/AD averages:** Arithmetic mean of scores grouped by DT/AD

## Metadata-Driven Design

Every configurable value lives in the database, never in code:

| Hardcoded (&cross;) | Metadata-Driven (&check;) |
|-------------------|-------------------------|
| `const NEB = [85, 60, 40]` | `SELECT * FROM neb_thresholds ORDER BY min DESC` |
| `const MAX_OBS = 25` | `SELECT value FROM config WHERE key='MAX_OBS'` |
| Fixed DT/AD arrays | Derived from `criteria.disability`/`.dimension` |
| Redeploy to change | Update DB row &mdash; instant effect |

**Key guarantees:** DT/AD sets derived from data; weights per building type from DB; NEB thresholds are DB rows; MAX_OBS is configurable; static tests enforce compliance.

---

<div class="page-break"></div>

# 7 API ARCHITECTURE

- **Base URL:** `/api/v1`
- **Response Envelope:** `{ ok: boolean, data?: any, error?: string }`
- **Status Codes:** 200, 201, 400, 404, 409, 500

## Endpoint Reference

### Evaluation
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/evaluate` | No | Full EN 17210 computation |

**Request:** `{ "buildingType": "Commercial Buildings", "scores": { "EC1.1.1": 5 } }`

**Response:** `{ ok: true, result: { obs, nebClass, nebMeaning, nebScore, averageRawScore, avgRawScoreByDT, avgRawScoreByAD, strengths, weaknesses, tisByDT, cisByAD, criteria } }`

### Data CRUD
| Method | Path | Description |
|--------|------|-------------|
| GET | `/criteria` | All 63 criteria |
| GET | `/criteria/:code` | Single criterion |
| POST | `/criteria` | Add criterion dynamically |
| GET | `/building-types` | 7 building types with weights |
| GET | `/neb-thresholds` | NEB classification thresholds |
| GET | `/config` | All config key-values |
| GET | `/disability-types` | 5 DT labels |
| GET | `/assessment-dimensions` | 5 AD labels |

### Assessments &amp; Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/buildings` | All buildings (joined with evaluations) |
| GET | `/buildings/:id` | Building detail |
| POST | `/assessments` | Create &amp; save assessment |
| GET | `/assessments/:id` | Retrieve saved assessment |
| GET | `/reports` | Evaluation history |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Mock JWT login |

## Dynamic Criteria System

Adding a criterion is a single API call or SQL INSERT &mdash; no code changes, no deployment:

```bash
curl -X POST http://localhost:4000/api/v1/criteria \
  -H "Content-Type: application/json" \
  -d '{"code":"EC1.1.10","name":"...","definition":"...","value":0.15,"disability":1,"dimension":1,"levels":["L1","L2","L3","L4","L5"]}'
```

**Validation rules:** `code` must match `/^EC\d+\.\d+\.\d+$/`, `value` 0&ndash;1, `disability`/`dimension` 1&ndash;5, `levels` exactly 5 strings, duplicate code &rarr; 409. The next evaluation automatically includes the new criterion.

---

<div class="page-break"></div>

# 8 REQUEST LIFECYCLE

## Evaluation Request Flow

```
Browser -> Next.js Hook -> Axios POST /api/v1/evaluate
  -> Express: Helmet -> CORS -> JSON parse
    -> evaluateController: validates body shape
      -> calculationService.evaluate(buildingType, scores)
        -> Read MAX_OBS, thresholds, weights from metadata cache
        -> Load all 63 criteria, apply scores
        -> Compute IS -> TIS -> CIS -> OBS -> NEB
        -> Compute strengths, weaknesses, averages
        -> Return result object
      -> Controller: res.json({ ok: true, result })
    -> Express: 200 JSON response
  -> Axios: unwrap result
-> React: re-render with OBS gauge, NEB class, strengths, weaknesses
```

## Controller Validation
`evaluateController.ts` checks `buildingType` is string/undefined and `scores` is object/undefined. Returns 400 with specific message on failure.

## Response Object Shape
`obs`, `nebClass`, `nebEquivalent`, `nebMeaning`, `nebScore`, `averageRawScore`, `avgRawScoreByDT`, `avgRawScoreByAD`, `strengths` (top 5), `weaknesses` (top 5), `tisByDT`, `cisByAD`, `criteria` (all 63 with computed IS).

---

<div class="page-break"></div>

# 9 LOCAL DEVELOPMENT SETUP

## Prerequisites

| Tool | Min Version | Check |
|------|------------|-------|
| Node.js | 18 LTS (20 rec.) | `node --version` |
| npm | 9+ | `npm --version` |
| Docker | 24+ | `docker --version` |

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd serg-asstool/backend && npm install

# 2. Start MariaDB
docker compose up -d mariadb
# Wait ~10s, verify: docker compose ps

# 3. Seed database
npx ts-node src/scripts/seed.ts
# Output: "DataSource initialized" / "Seeding complete"

# 4. Start backend
npm start
# Output: "Backend listening on 4000"

# 5. Verify
curl http://localhost:4000/health         # -> {"status":"ok"}
curl http://localhost:4000/api/v1/criteria # -> 63 criteria
```

## Docker Environment

MariaDB only runs in Docker; backend/frontend run natively.

| Property | Value |
|----------|-------|
| Image | `mariadb:10.11` |
| Host Port | `3306` |
| Database | `mydb` |
| User/Pass | `myuser` / `mypassword` |
| Root Pass | `rootpass` |
| Data Volume | `db_data` |

## Environment Variables

| Variable | Default |
|----------|---------|
| `PORT` | `4000` |
| `DATABASE_URL` | `mysql://myuser:mypassword@127.0.0.1:3306/mydb` |
| `DB_TYPE` | `mariadb` |
| `TYPEORM_SYNCHRONIZE` | `false` |

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Start backend |
| `npm test` | Run calculation tests |
| `npm run test:automated` | Full suite (metadata + static + calculation) |
| `npm run seed` | Seed database |
| `npm run migrate` | Run migrations |
| `npm run verify:workbook` | Verify Excel workbook mapping |

## Setup Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ECONNREFUSED :3306` | `docker compose up -d mariadb` |
| `Access denied` | Check DATABASE_URL matches docker-compose.yml |
| `Table doesn't exist` | `npx ts-node src/scripts/seed.ts` |
| `Metadata validation failed` | Run seed script |
| `Port 4000 in use` | `netstat -ano \| findstr 4000` then kill PID |

---

<div class="page-break"></div>

# 10 RUNNING THE PROJECT

## Manual Startup (Windows)

**Terminal 1 &mdash; MariaDB:** `cd backend && docker compose up -d mariadb`

**Terminal 2 &mdash; Backend:** `cd backend && npm start`

**Terminal 3 &mdash; Frontend (optional):** `cd frontend && npm run dev`

## Dev Shell Scripts

| Script | Purpose |
|--------|---------|
| `start-dev.sh` | Start all services |
| `stop-dev.sh` | Stop all services |
| `status-dev.sh` | Check service status |
| `logs-dev.sh` | View service logs |

## Quick Verification

```bash
curl localhost:4000/health    # -> {"status":"ok"}

curl -X POST localhost:4000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"buildingType":"Commercial Buildings"}'   # -> full result JSON
```

---

<div class="page-break"></div>

# 11 COMMON WORKFLOWS

## 1. Add a New Criterion
```bash
curl -X POST localhost:4000/api/v1/criteria -H "Content-Type: application/json" \
  -d '{"code":"EC1.1.10","name":"...","definition":"...","value":0.15,"disability":1,"dimension":1,"levels":["L1","L2","L3","L4","L5"]}'
```
Or via SQL:
```sql
INSERT INTO criteria (id, code, name, definition, justification, value, disability, dimension, score, levels)
VALUES (UUID(), 'EC1.1.10', '...', '...', '...', 0.15, 1, 1, 3, '["L1","L2","L3","L4","L5"]');
```

## 2. Adjust NEB Thresholds
```sql
UPDATE neb_thresholds SET min = 65 WHERE neb_class = 'A';
INSERT INTO neb_thresholds VALUES (UUID(), 95, 'A++', '5+', 'Outstanding', 5, 0);
```

## 3. Create a Building Type
```sql
INSERT INTO building_types VALUES (
  UUID(), 'Healthcare Buildings', '[0.20,0.25,0.20,0.20,0.15]', '[0.30,0.30,0.15,0.10,0.15]'
);
```

## 4. Update Config Values
```sql
UPDATE config SET value = '30' WHERE `key` = 'MAX_OBS';
UPDATE config SET value = '4' WHERE `key` = 'STRENGTH_THRESHOLD';
```

## 5. Run Tests Before Commit
```bash
npm run test:automated
# Expected: "Metadata validation passed" / "Static checks passed" / "All tests passed"
```

## 6. Debug a Calculation
Send test evaluation via curl &rarr; examine `tisByDT`, `cisByAD`, `criteria[0].is` &rarr; compare against Excel workbook reference.

## 7. Database Backup &amp; Restore
```bash
docker exec mariadb mysqldump -u myuser -pmypassword mydb > backup.sql
docker exec -i mariadb mysql -u myuser -pmypassword mydb < backup.sql
```

## 8. Reset Database
```bash
docker compose down -v && docker compose up -d mariadb && npx ts-node src/scripts/seed.ts
```

---

<div class="page-break"></div>

# 12 DEBUGGING GUIDE

## Top 5 Errors

### 1. "DataSource init failed"
**Causes:** MariaDB not running, wrong DATABASE_URL, port conflict.
**Fix:** `docker compose up -d mariadb`; verify credentials match docker-compose.yml.

### 2. "Metadata validation failed" (exit code 1)
**Fix:** Run `npx ts-node src/scripts/seed.ts`. Check all 4 core tables have data.

### 3. "ECONNREFUSED 127.0.0.1:4000"
**Fix:** Backend not running &mdash; `npm start`.

### 4. CORS Errors in Browser
**Fix:** Backend uses `cors()` middleware. If frontend port changed, update CORS config in `index.ts`.

### 5. "Missing configuration: MAX_OBS"
**Fix:** Re-run seed or insert manually:
```sql
INSERT INTO config VALUES (UUID(), 'MAX_OBS', '25');
```

## Log Locations

| Component | How to View |
|-----------|-------------|
| Backend | Terminal where `npm start` runs (stdout) |
| MariaDB | `docker compose logs mariadb` |
| Docker | `docker compose logs` |

---

<div class="page-break"></div>

# 13 TROUBLESHOOTING

| # | Problem | Likely Fix |
|---|---------|-----------|
| 1 | Backend won't start | `docker compose up -d mariadb` then `npm start` |
| 2 | "Access denied for user" | Verify DATABASE_URL matches docker-compose.yml |
| 3 | Tables don't exist | `npx ts-node src/scripts/seed.ts` |
| 4 | OBS always 0 | Check `SELECT * FROM config WHERE key='MAX_OBS'` |
| 5 | NEB always "No Rating" | Re-seed `neb_thresholds` table |
| 6 | Empty strengths/weaknesses | Check STRENGTH_THRESHOLD & WEAKNESS_THRESHOLD in config |
| 7 | "entity.parse.failed" | Invalid JSON in request body &mdash; validate payload |
| 8 | TypeORM "EntityMetadataNotFound" | Verify all 5 entities in `data-source.ts` entities array |
| 9 | Docker pull fails | Check network; `docker pull mariadb:10.11` manually |
| 10 | TypeScript compilation errors | `npm install` then `npx tsc --noEmit` |
| 11 | Static test fails in CI | Remove hardcoded values; use DB config |
| 12 | Data lost after restart | Verify `db_data` volume exists: `docker volume ls` |

---

<div class="page-break"></div>

# 14 CODING STANDARDS

## Core Principles
1. **Metadata-Driven First:** Never hardcode a database-worthy value
2. **Backend Owns Logic:** All calculations &amp; business rules in services
3. **TypeScript Strict:** `strict: true`, no implicit `any`
4. **Single Source of Truth:** Canonical seed data in `src/data/`

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `calculation-service.ts` |
| Classes/Entities | PascalCase | `NebThreshold` |
| Functions/variables | camelCase | `getBuildingType()` |
| DB tables/columns | snake_case | `neb_thresholds`, `building_type` |
| API paths | kebab-case | `/api/v1/building-types` |

## Service &amp; Controller Rules
- Services export **async functions**, never classes
- Services use metadata service for data access (not direct repos)
- Calculation service is the **only** place formulas exist
- Controllers validate shape before calling services
- Controllers use `try/catch` &rarr; 400 for validation, 500 for internal errors
- Success responses always include `ok: true`

## Prohibited Patterns (CI-enforced)

```typescript
// WRONG - hardcoded
const weights = [0.2, 0.2, 0.2, 0.2, 0.2];
const NEB = [85, 60, 40];
const MAX_OBS = 25;

// CORRECT - from database
const weights = bt.disability_weights;
const neb = await metadata.getNebThresholds();
const MAX_OBS = await metadata.getConfigNumber('MAX_OBS');
```

**Formatting:** 2-space indent, no trailing whitespace, files end with newline, semicolons required.

---

<div class="page-break"></div>

# 15 GIT WORKFLOW

**Branch strategy:** `main` (production) &larr; `develop` (integration) &larr; `feature/*` / `fix/*` / `chore/*`

**Commit format:** `<type>(<scope>): <description>` &mdash; types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

**PR process:** Create feature branch &rarr; commit &rarr; `npm run test:automated` &rarr; push &rarr; PR to `develop` &rarr; CI runs &rarr; code review &rarr; merge.

**CI pipeline (on push to main):** test-backend &rarr; build-backend &rarr; deploy-backend &rarr; build-frontend &rarr; deploy-frontend (5 jobs, GitHub Actions).

---

<div class="page-break"></div>

# 16 DEPLOYMENT

## Azure Resources (via `main.bicep`)

| Resource | SKU |
|----------|-----|
| App Service Plan | B1 Basic Linux |
| Backend App Service | Node 20 LTS |
| Static Web App | Standard |
| MariaDB Server | 10.3, TLS 1.2 |
| Application Insights + Log Analytics | Monitoring |

## Deploy

```bash
az deployment sub create \
  --location westeurope \
  --template-file azure/main.bicep \
  --parameters dbPassword='<password>' dbAdminPassword='<admin>'
```

## Production App Settings

```
PORT=4000
WEBSITES_PORT=4000
DATABASE_URL=mysql://myuser:<pwd>@mariadb-aas-production.mariadb.database.azure.com:3306/mydb
DB_TYPE=mariadb
TYPEORM_SYNCHRONIZE=false
```

---

<div class="page-break"></div>

# 17 FAQ

**Q: Why TypeORM and not Prisma?**
A: Mature MariaDB support, entity decorators, built-in migration system, and repository pattern.

**Q: Why lazy metadata initialization?**
A: Defers DB connection to first request &mdash; server starts even if DB is temporarily unavailable.

**Q: Why derive DT/AD from data instead of config?**
A: System auto-adapts when criteria are added/removed without code changes.

**Q: How do I reset the database?**
A: `docker compose down -v && docker compose up -d mariadb && npx ts-node src/scripts/seed.ts`

**Q: Migrations vs seed?**
A: Migrations = schema (DDL), seed = data (DML). Migrations create tables; seed populates canonical values.

**Q: Can I use PostgreSQL?**
A: Changing `DB_TYPE` to `postgres` and updating the connection string should work but is untested.

---

<div class="page-break"></div>

# 18 USEFUL COMMANDS

| Command | Purpose |
|---------|---------|
| `docker compose up -d mariadb` | Start MariaDB |
| `docker compose down` | Stop MariaDB |
| `docker compose logs -f mariadb` | Follow DB logs |
| `docker exec -it mariadb mariadb -u myuser -pmypassword mydb` | DB CLI |
| `npm start` | Start backend |
| `npm run test:automated` | Full test suite |
| `npm run seed` | Seed database |
| `curl localhost:4000/health` | Health check |
| `curl localhost:4000/api/v1/criteria` | Get all criteria |
| `curl localhost:4000/api/v1/building-types` | Get building types |
| `curl localhost:4000/api/v1/neb-thresholds` | Get NEB thresholds |
| `curl localhost:4000/api/v1/config` | Get config |
| `SHOW TABLES;` | List DB tables |
| `SELECT COUNT(*) FROM criteria;` | Should return 63 |

---

<div class="page-break"></div>

# 19 GLOSSARY

| Term | Definition |
|------|------------|
| **SERG-ASSTool** | SERG Accessibility Assessment Scheme Tool |
| **AD** | Assessment Dimension (1&ndash;5): Spatial, Safety, Cognitive, Digital, Social |
| **CIS** | Combined Impact Score &mdash; weighted sum per AD |
| **DT** | Disability Type (1&ndash;5): Physical, Sensory, Cognitive, Communication, Multiple |
| **EN 17210** | European Standard for built environment accessibility |
| **IS** | Impact Score = value &times; score per criterion |
| **TIS** | Total Impact Score = &Sigma; IS per DT |
| **OBS** | Overall Building Score = weighted percentage (0&ndash;100) |
| **NEB** | National Evaluation Benchmark (A+, A, B, No Rating) |
| **MAX_OBS** | Maximum possible OBS raw value (25, configurable) |
| **TypeORM** | TypeScript ORM for Node.js |
| **Zod** | TypeScript-first schema validation |
| **Bicep** | Azure infrastructure-as-code language |
| **Seed** | Initial data population process |
| **Static Test** | Test scanning source code for banned hardcoded patterns |
