# Architecture — AAS

## System Overview

A full-stack accessibility assessment platform that evaluates building accessibility against the EN 17210 standard using the OBS (Overall Building Score), NEB (National Equivalency Benchmark), TIS(i) (Total Impact Score by Disability Type), and CIS(j) (Composite Impact Score by Assessment Dimension) framework.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Next.js 16 Frontend (port 3000)             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │   │
│  │  │ Dashboard │ │Certificat│ │ Criteria Browser   │   │   │
│  │  │  Page     │ │ion Engine│ │                    │   │   │
│  │  └─────┬─────┘ └────┬─────┘ └────────┬───────────┘   │   │
│  │        │             │               │                │   │
│  │  ┌─────┴─────────────┴───────────────┴───────────┐    │   │
│  │  │         TanStack React Query Cache             │    │   │
│  │  └──────────────────────┬────────────────────────┘    │   │
│  │                         │                             │   │
│  │  ┌──────────────────────┴────────────────────────┐    │   │
│  │  │              Axios API Client                  │    │   │
│  │  │         (lib/api/client.ts + endpoints.ts)     │    │   │
│  │  └──────────────────────┬────────────────────────┘    │   │
│  └─────────────────────────┼─────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/REST (JSON)
                             │
┌────────────────────────────┼─────────────────────────────────┐
│              EXPRESS BACKEND (port 4000)                      │
│  ┌──────────────────────────┴──────────────────────────┐     │
│  │                    Controllers                        │     │
│  │  evaluateController │ dataController │ buildings    │     │
│  │  assessmentsCtrl    │ reportsCtrl    │ authCtrl     │     │
│  └──────────────────────────┬──────────────────────────┘     │
│                             │                                 │
│  ┌──────────────────────────┴──────────────────────────┐     │
│  │                     Services                          │     │
│  │  calculationService  │  metadataService               │     │
│  │  (OBS/NEB/TIS/CIS)   │  (DB access + validation)      │     │
│  └──────────────────────────┬──────────────────────────┘     │
│                             │                                 │
│  ┌──────────────────────────┴──────────────────────────┐     │
│  │               TypeORM DataSource                      │     │
│  │  Entities: Criterion, BuildingType, Evaluation,      │     │
│  │            NebThreshold, Config                       │     │
│  └──────────────────────────┬──────────────────────────┘     │
└─────────────────────────────┼────────────────────────────────┘
                              │ SQL
                              │
┌─────────────────────────────┼────────────────────────────────┐
│                   MariaDB 10.11 (port 3306)                   │
│  Tables: criteria | building_types | evaluations             │
│          neb_thresholds | config                              │
└──────────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. 100% Data-Driven
The system requires **ZERO code changes** for:
- Adding/removing criteria
- Changing weights or thresholds
- Changing disability types or assessment dimensions
- Changing building types
- Changing certification rules

All metadata flows from the database (MariaDB) through the API to the frontend.

### 2. Frontend = Presentation Only
- Renders UI components
- Calls backend APIs exclusively
- Manages local UI state (selected tabs, search queries)
- Uses `useMetadata()` hook for DT/AD labels (fetched from API)
- **NO** business calculations, certification logic, or hardcoded metadata

### 3. Backend Owns All Business Logic
- Calculation engine (`calculationService.ts`) — OBS, TIS, CIS, NEB
- Metadata validation at startup (`metadataService.ts`)
- All thresholds, weights, and criteria from database
- Dynamic DT/AD derivation from criteria (not hardcoded 1-5)

### 4. Database as Source of Truth
- `criteria` table: All 63 evaluation criteria with codes, values, DT/AD mappings
- `building_types` table: 7 building types with disability/dimension weight arrays
- `neb_thresholds` table: Certification thresholds (A+, A, B, No Rating)
- `config` table: Runtime configuration (MAX_OBS, DEFAULT_SCORE, etc.)
- `evaluations` table: Saved assessment history

## Data Flow

```
User Input → React State → API Client → POST /api/v1/evaluate
  → evaluateController → calculationService.evaluate()
    → metadataService (fetch criteria, weights, thresholds)
    → Compute IS(i,j) = value × score
    → Compute TIS(i) = Σ IS(i,j)
    → Compute CIS(j) = Σ w(i) × IS(i,j)
    → Compute OBS = (Σ w(i) × TIS(i)) / MAX_OBS × 100
    → Lookup NEB class from thresholds
  → Return JSON response
→ React State Update → Re-render UI
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (React) | 16.2.6 |
| State Management | TanStack React Query | 5.x |
| HTTP Client | Axios | 1.5.x |
| Animation | Framer Motion | 12.40 |
| Styling | Tailwind CSS | v4 |
| Backend Runtime | Node.js + Express | 4.18.x |
| ORM | TypeORM | 0.3.17 |
| Validation | Zod | 4.4.x |
| Database | MariaDB | 10.11 |
| Containerization | Docker Compose | 3.8 |
| Language | TypeScript | 5.x |

## File Structure

```
proj/
├── backend/
│   ├── src/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── entities/        # TypeORM models
│   │   ├── migrations/      # DB schema migrations
│   │   ├── data/            # Canonical data files
│   │   ├── scripts/         # CLI tools (seed, migrate)
│   │   ├── tests/           # Automated tests
│   │   ├── index.ts         # Express app entry
│   │   └── data-source.ts   # TypeORM config
│   ├── docker-compose.yml   # MariaDB container
│   ├── docker-initdb.d/     # DB init SQL
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Shared UI components
│   ├── lib/                 # API client, hooks, utilities
│   ├── types/               # TypeScript type definitions
│   └── package.json
├── docs/                    # Enterprise documentation
├── .gitignore
├── DEVELOPENT.md
└── WP.xlsx                  # Excel workbook (canonical reference)
```
