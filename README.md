# AASTool — Enterprise Documentation

**Accessibility Assessment Scheme · Enterprise Edition**

*Version 1.0.0 | June 2026*

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Folder Structure](#folder-structure)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [Scoring System](#scoring-system)
9. [API Reference](#api-reference)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Additional Documentation](#additional-documentation)

---

## Project Overview

AASTool is an enterprise platform for evaluating building accessibility across five disability types (DT1–DT5) and five assessment dimensions (AD1–AD5). The system produces:

- **OBS** — Overall Building Score (0–100%)
- **NEB** — Normalized Efficiency Band (A+, A, B, C, D classification)
- **TIS(i)** — Type Impact Score per disability type
- **CIS(j)** — Criterion Impact Score per assessment dimension
- **Certification** — Full EN 17210-aligned certification reports

Built on **63 evaluation criteria** (EC–DT–AD mapping), each with a 5-level progressive automation scale. All scoring is data-driven — weights, thresholds, and formulas live exclusively in the MySQL/MariaDB database.

### Key Features

| Feature | Description |
|---------|-------------|
| Multi-dimensional scoring | Weighted evaluation across disability types and assessment dimensions |
| Dynamic certification | Real-time OBS → NEB classification with building-type-specific weighting |
| RESTful API | Pure JSON endpoints — no direct DB access from frontend |
| Offline-ready PWA | Progressive Web App with service worker, manifest, offline indicator |
| Light/Dark theme | CSS custom properties with theme toggle |
| Accessibility-first | ARIA labels, skip-to-content, semantic HTML |
| CI/CD pipeline | GitHub Actions automated test → build → deploy to Azure |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Next.js 16 (App Router) + React 19 + Tailwind CSS 4    │   │
│  │                                                         │   │
│  │  Pages ──▶ React Query ──▶ Axios ──▶ REST API          │   │
│  │  (zero business logic — presentation only)              │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │  HTTP (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND SERVER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Express 4 + TypeScript + TypeORM                       │   │
│  │                                                         │   │
│  │  Controllers ──▶ Services ──▶ Repositories ──▶ DB      │   │
│  │  (all business logic, calculation, validation)          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │  mysql2 driver
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MariaDB 10.11 (Docker)                                 │   │
│  │                                                         │   │
│  │  Tables: criteria, building_types, evaluations,         │   │
│  │          neb_thresholds, config                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Frontend is presentation-only** — zero hardcoded weights, thresholds, or formulas
2. **Backend is single source of truth** — all calculations happen server-side
3. **Data-driven** — all weights, thresholds, and scoring config live exclusively in the database
4. **No hardcoded values** — every string, token, gradient, and label is sourced from API, env, or shared modules
5. **Pure REST** — no direct database connections from the frontend
6. **Stateless API** — each request is self-contained; no server-side sessions

---

## Quick Start

### Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| Node.js | 18+ (22 recommended) |
| npm | 9+ |
| Docker Desktop | 24+ |
| Git | 2.40+ |

### 1. Clone & Install

```bash
git clone git@github.com:YiannisYiangouDev/AASTool.git
cd AASTool

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Start Database (Docker)

```bash
cd backend
docker compose up -d mariadb
# Wait for healthy: docker ps | grep mariadb
```

### 3. Seed the Database

```bash
cd backend
export DATABASE_URL=mysql://myuser:mypassword@127.0.0.1:3306/mydb
node scripts/seed-mariadb.js
```

### 4. Start Backend

```bash
cd backend
npm run dev    # ts-node watch mode → http://localhost:4000
```

### 5. Start Frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env.local
npm run dev    # Turbopack → http://localhost:3000
```

### One-Command Alternative

```bash
./start-dev.sh   # Starts MariaDB + Backend + Frontend
./stop-dev.sh    # Stops all services
./status-dev.sh  # Checks service health
./logs-dev.sh    # Tails logs
```

---

## Folder Structure

```
AASTool/
│
├── README.md                      # This file
├── DEVELOPMENT.md                 # Developer onboarding guide
├── start-dev.sh                   # Start all services
├── stop-dev.sh                    # Stop all services
├── status-dev.sh                  # Health check all services
├── logs-dev.sh                    # Tail all service logs
│
├── backend/                       # Express + TypeORM REST API
│   ├── package.json               # Dependencies & scripts
│   ├── tsconfig.json              # TypeScript configuration (CommonJS)
│   ├── docker-compose.yml         # MariaDB 10.11 container
│   ├── docker-initdb.d/
│   │   └── init.sql               # DB user/database bootstrap
│   ├── scripts/
│   │   └── seed-mariadb.js        # Database seeding script
│   └── src/
│       ├── index.ts               # Express app entry point
│       ├── data-source.ts         # TypeORM DataSource configuration
│       ├── controllers/           # Route handlers (REST endpoints)
│       │   ├── assessmentsController.ts
│       │   ├── authController.ts
│       │   ├── buildingsController.ts
│       │   ├── dataController.ts
│       │   ├── evaluateController.ts
│       │   └── reportsController.ts
│       ├── entities/              # TypeORM entity definitions (DB schema)
│       │   ├── BuildingType.ts
│       │   ├── Config.ts
│       │   ├── Criterion.ts
│       │   ├── Evaluation.ts
│       │   └── NebThreshold.ts
│       ├── services/              # Business logic
│       │   ├── calculationService.ts
│       │   └── metadataService.ts
│       ├── migrations/            # Database migrations
│       ├── scripts/               # Seed, migration runner
│       └── tests/                 # Jest test suites
│
├── frontend/                      # Next.js 16 App Router
│   ├── package.json               # Dependencies & scripts
│   ├── tsconfig.json              # TypeScript (bundler resolution)
│   ├── next.config.js             # Next.js configuration
│   ├── tailwind.config.ts         # Tailwind CSS 4 configuration
│   ├── postcss.config.js          # PostCSS with @tailwindcss/postcss
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   └── sw.js                  # Service worker
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout (providers, theme, footer)
│   │   ├── globals.css            # Global styles + Tailwind
│   │   ├── page.tsx               # Home page (landing)
│   │   ├── dashboard/page.tsx     # Dashboard
│   │   ├── building/page.tsx      # Building types overview
│   │   ├── buildings/[id]/page.tsx # Building detail
│   │   ├── criteria/page.tsx      # Criteria reference (search/filter)
│   │   ├── certification/page.tsx # Certification engine
│   │   ├── dimensions/page.tsx    # Assessment dimensions
│   │   ├── disability/page.tsx    # Disability types
│   │   ├── reports/page.tsx       # Generated reports list
│   │   ├── login/page.tsx         # Login page
│   │   ├── assessments/new/page.tsx    # New assessment
│   │   └── assessments/[id]/page.tsx   # Assessment detail
│   ├── components/                # Shared React components
│   │   ├── Header.tsx             # Top navigation bar
│   │   ├── BottomNav.tsx          # Mobile bottom navigation
│   │   ├── BuildingCard.tsx       # Building summary card
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   ├── OfflineIndicator.tsx   # Network offline banner
│   │   ├── PWAProvider.tsx        # PWA install prompt
│   │   ├── SplashScreen.tsx       # SERG branded loading screen
│   │   ├── Providers.tsx          # React Query provider wrapper
│   │   └── layout/
│   │       ├── mobile-nav.tsx     # Mobile nav + theme provider
│   │       └── navbar.tsx         # Desktop sidebar nav
│   └── lib/                       # Shared utilities
│       ├── api/
│       │   ├── client.ts          # Axios instance with interceptors
│       │   └── endpoints.ts       # All API endpoint functions
│       ├── hooks/
│       │   ├── useBuildings.ts    # React Query hook for buildings
│       │   ├── useCriteria.ts     # React Query hook for criteria
│       │   └── useAssessment.ts   # React Query hook for assessments
│       ├── queryClient.ts         # React Query client config
│       ├── theme.ts               # Color/gradient tokens + gauge helpers
│       ├── storage.ts             # localStorage persistence helpers
│       ├── animations.ts          # Framer Motion animation presets
│       └── pwa.ts                 # PWA registration utilities
│
├── docs/                          # Documentation
│   ├── frontend.md                # Frontend architecture & component docs
│   ├── backend.md                 # Backend architecture & service docs
│   ├── api.md                     # Complete API reference (OpenAPI-style)
│   ├── pdf-generation.md          # PDF generation subsystem
│   ├── azure-migration.md         # Azure cloud migration guide
│   └── README.md                  # Docs index
│
└── .github/workflows/
    └── deploy.yml                 # CI/CD pipeline (GitHub Actions)
```

---

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | MySQL/MariaDB connection string |
| `PORT` | No | `4000` | Express server port |
| `APP_VERSION` | No | `1.0.0` | Version reported by `/health` |
| `JWT_SECRET` | **Yes** | — | HMAC-SHA256 signing key for auth tokens |
| `JWT_EXPIRES_IN` | No | `3600` | Token lifetime in seconds |
| `LOGIN_REDIRECT` | No | `/dashboard` | Post-login redirect path |
| `ASSESSMENT_STATUS` | No | `Completed` | Default assessment status label |
| `REPORT_LOCALE` | No | `en-US` | Date formatting locale for reports |
| `REPORT_TITLE_PREFIX` | No | `Accessibility Report` | Report title prefix |

Example:

```env
DATABASE_URL=mysql://myuser:mypassword@127.0.0.1:3306/mydb
JWT_SECRET=your-secret-key-here
PORT=4000
```

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:4000/api/v1` | Backend API base URL |

Example (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Docker (MariaDB)

Set in `backend/docker-compose.yml`:

| Variable | Value |
|----------|-------|
| `MYSQL_ROOT_PASSWORD` | `rootpass` |
| `MYSQL_DATABASE` | `mydb` |
| `MYSQL_USER` | `myuser` |
| `MYSQL_PASSWORD` | `mypassword` |

---

## Database Setup

### Option 1: Docker (recommended)

```bash
cd backend
docker compose up -d
```

MariaDB 10.11 starts on port 3306. The init script at `docker-initdb.d/init.sql` creates the database and user.

### Option 2: Existing MariaDB Instance

Ensure the database and user exist:

```sql
CREATE DATABASE IF NOT EXISTS mydb;
CREATE USER IF NOT EXISTS 'myuser'@'%' IDENTIFIED BY 'mypassword';
GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'%';
FLUSH PRIVILEGES;
```

Then seed:

```bash
cd backend
export DATABASE_URL=mysql://myuser:mypassword@127.0.0.1:3306/mydb
node scripts/seed-mariadb.js
```

### Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `criteria` | 63 evaluation criteria | `code`, `name`, `definition`, `value`, `disability`, `dimension`, `levels` |
| `building_types` | Building categories | `name`, `disability_weights`, `dimension_weights` |
| `evaluations` | Saved assessment results | `building_type`, `scores`, `result`, `obs`, `neb_class` |
| `neb_thresholds` | NEB classification bands | `min`, `neb_class`, `equivalent`, `neb_score` |
| `config` | System configuration | `key`, `value` (MAX_OBS, DEFAULT_SCORE, etc.) |

---

## Running the Application

### Development Mode

```bash
# Terminal 1: Database
cd backend && docker compose up -d

# Terminal 2: Backend
cd backend && npm run dev    # ts-node with auto-reload

# Terminal 3: Frontend
cd frontend && npm run dev   # Next.js with Turbopack HMR
```

Or use the convenience scripts:

```bash
./start-dev.sh    # Starts all three services
./status-dev.sh   # Checks if all services are healthy
./logs-dev.sh     # Follows all logs
./stop-dev.sh     # Stops everything
```

### Production Build

```bash
# Build and start backend
cd backend && npm run build && npm start

# Build and start frontend
cd frontend && npm run build && npm start
```

### Health Check

```bash
# Backend
curl http://localhost:4000/api/v1/health
# → {"ok":true,"data":{"status":"ok","uptime":123,"database":"connected",...}}

# Backend (root)
curl http://localhost:4000/health
# → {"status":"ok","uptime":123,"database":"connected",...}
```

---

## Scoring System

### Evaluation Criteria (63 items)

Each criterion maps to:
- **DT** (Disability Type, 1–5): Physical, Sensory, Cognitive, Intellectual, Psychosocial
- **AD** (Assessment Dimension, 1–5): Wayfinding, Entry, Circulation, Facilities, Evacuation
- **Weight** (Wij): Base cell weight assigned per criterion
- **5-level automation scale**: From Level 1 (manual) to Level 5 (fully automated)

### Formulas

**IS (Individual Score)**:

$$IS_{ij} = W_{ij} \times S_{ij}$$

Where $W_{ij}$ is the base cell weight and $S_{ij}$ is the user-assigned score (1–5).

**OBS (Overall Building Score)**:

$$OBS = \frac{\sum_{i=1}^{n} (DTWeight_i \times TIS_i)}{MAX\\_OBS} \times 100$$

**TIS(i) — Type Impact Score per DT**:

$$TIS_i = \sum_{j=1}^{m} IS_{ij}$$

**CIS(j) — Criterion Impact Score per AD**:

$$CIS_j = \sum_{i=1}^{n} DTWeight_i \times IS_{ij}$$

### NEB Classification

| OBS Range | NEB Class | Equivalent | NEB Score |
|-----------|-----------|------------|-----------|
| ≥ 80 | A+ | Excellent | 5 |
| ≥ 65 | A | Very Good | 4 |
| ≥ 50 | B | Good | 3 |
| ≥ 35 | C | Fair | 2 |
| ≥ 0 | D | Poor | 1 |

### Configurable Parameters

| Parameter | DB Key | Default | Description |
|-----------|--------|---------|-------------|
| MAX_OBS | `MAX_OBS` | (seeded) | Normalization divisor |
| DEFAULT_SCORE | `DEFAULT_SCORE` | 3 | Fallback score for unscored criteria |
| STRENGTH_THRESHOLD | `STRENGTH_THRESHOLD` | 5 | Minimum score to flag as strength |
| WEAKNESS_THRESHOLD | `WEAKNESS_THRESHOLD` | 2 | Maximum score to flag as weakness |
| TOP_N_RESULTS | `TOP_N_RESULTS` | 5 | Number of top strengths/weaknesses to return |

---

## API Reference

See [docs/AASTool-API-Reference.pdf](docs/AASTool-API-Reference.pdf) for the complete API endpoint reference (markdown source: [docs/.pdf-build/api.md](docs/.pdf-build/api.md)).

### Quick Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/health` | API health check |
| `GET` | `/api/v1/criteria` | List all criteria |
| `POST` | `/api/v1/criteria` | Create criterion |
| `GET` | `/api/v1/criteria/:code` | Get criterion by code |
| `POST` | `/api/v1/evaluate` | Run evaluation |
| `GET` | `/api/v1/buildings` | List building types |
| `GET` | `/api/v1/buildings/:id` | Get building detail |
| `POST` | `/api/v1/assessments` | Create assessment |
| `GET` | `/api/v1/assessments/:id` | Get assessment |
| `GET` | `/api/v1/building-types` | List building types |
| `GET` | `/api/v1/neb-thresholds` | Get NEB bands |
| `GET` | `/api/v1/config` | Get system config |
| `GET` | `/api/v1/disability-types` | Get DT labels |
| `GET` | `/api/v1/assessment-dimensions` | Get AD labels |
| `GET` | `/api/v1/reports` | List reports |
| `POST` | `/api/v1/login` | Login (HMAC-SHA256 tokens) |

---

## Testing

### Backend Tests

```bash
cd backend
npm test                        # Run Jest test suite
npm run test:automated          # Jest with CI-friendly output
```

Test files:
- `src/tests/calculation.test.ts` — Calculation engine unit tests
- `src/tests/metadata.test.ts` — Metadata service tests
- `src/tests/static.test.ts` — Static validation tests
- `src/tests/workbook.mapping.test.ts` — Workbook mapping validation

### Frontend (TypeScript)

```bash
cd frontend
npx tsc --noEmit               # TypeScript type checking
npm run lint                    # ESLint
```

---

## Deployment

### Azure (Recommended)

See [docs/azure-migration.md](docs/azure-migration.md) for full Azure deployment guide.

**Infrastructure** (Bicep):
- `main.bicep` — Subscription-scoped deployment
- `resources.bicep` — Resource group: App Service (B1 Linux), Static Web App, MariaDB Server

**CI/CD** (`.github/workflows/deploy.yml`):
1. `test-backend` — Jest + MariaDB service container
2. `build-backend` — `tsc` compilation
3. `deploy-backend` — Azure App Service deploy
4. `build-frontend` — `next build`
5. `deploy-frontend` — Azure Static Web App deploy

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `AZURE_BACKEND_PUBLISH_PROFILE` | App Service deployment credentials |
| `AZURE_FRONTEND_DEPLOY_TOKEN` | Static Web App deployment token |
| `DATABASE_URL` | Production MariaDB connection string |

---

## Troubleshooting

### "DATABASE_URL environment variable is required"

**Cause**: Backend started without the env var.
**Fix**: `export DATABASE_URL=mysql://myuser:mypassword@127.0.0.1:3306/mydb`

### "MariaDB container not starting"

```bash
docker logs mariadb               # Check container logs
docker compose down && docker compose up -d   # Restart
```

### "Backend can't connect to database"

```bash
# Check if MariaDB is listening
nc -z 127.0.0.1 3306 && echo "OK" || echo "Not listening"

# Verify credentials
mysql -h 127.0.0.1 -u myuser -pmypassword mydb -e "SELECT 1"
```

### "Frontend TypeScript errors"

```bash
cd frontend
rm -rf .next/dev                  # Clear stale dev cache
npx tsc --noEmit                  # Re-check types
```

### "npm run build hangs"

Turbopack may hang on stale `.next` cache:
```bash
rm -rf .next && npm run build
```

---

## Additional Documentation

| Document | Content |
|----------|---------|
| [docs/AASTool-Frontend-Architecture.pdf](docs/AASTool-Frontend-Architecture.pdf) | Complete frontend architecture, components, pages, data flow |
| [docs/AASTool-Backend-Architecture.pdf](docs/AASTool-Backend-Architecture.pdf) | Backend architecture, services, calculation engine, entities |
| [docs/AASTool-API-Reference.pdf](docs/AASTool-API-Reference.pdf) | OpenAPI-style endpoint reference with request/response examples |
| [docs/AASTool-PDF-Generation-Subsystem.pdf](docs/AASTool-PDF-Generation-Subsystem.pdf) | PDF generation subsystem documentation |
| [docs/azure-migration.md](docs/azure-migration.md) | Azure cloud infrastructure & migration guide |
| [docs/.pdf-build/](docs/.pdf-build/) | Markdown sources for all documentation PDFs |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Developer onboarding and contribution guide |

---

*AASTool by Serg | Dev by Y*
