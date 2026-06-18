# Backend — AAS

Express + TypeScript + TypeORM REST API. **Sole source of truth** for all business logic, calculations, and persistence.

## Quick Start

```bash
cd proj/backend
npm install
# Ensure MariaDB is running
docker compose up -d mariadb
# Seed the database
npx ts-node src/scripts/seed.ts
# Start dev server
npm run dev
# → http://localhost:4000/api/v1
```

## Technology

| Layer | Library |
|-------|---------|
| Runtime | Node.js (v24 via nvm, v18 fallback) |
| Framework | Express 4.x |
| Language | TypeScript (ts-node) |
| ORM | TypeORM 0.3.17 |
| Database | MariaDB (Docker, port 3306, database: mydb) |
| Validation | Zod |

## 13 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/evaluate | Full evaluation computation |
| GET | /api/v1/criteria | All evaluation criteria |
| GET | /api/v1/criteria/:code | Single criterion |
| GET | /api/v1/building-types | Building types + weights |
| GET | /api/v1/neb-thresholds | NEB classification thresholds |
| GET | /api/v1/config | Configuration key-values |
| GET | /api/v1/disability-types | Disability type categories |
| GET | /api/v1/assessment-dimensions | Assessment dimensions |
| GET | /api/v1/buildings | Buildings list |
| GET | /api/v1/buildings/:id | Building detail |
| POST | /api/v1/assessments | Create assessment |
| GET | /api/v1/assessments/:id | Get assessment |
| GET | /api/v1/reports | Reports list |
| POST | /api/v1/auth/login | Login (mock) |

## Database

5 entities via TypeORM: Criterion, BuildingType, NebThreshold, Config, Evaluation.
Database: `mydb`, user: `myuser`, password: `mypassword`.

## Documentation

See `html/proj/docs/backend.md` for full overview.
See `html/proj/docs/api.md` for complete API reference.
