# AASTool — Accessibility Assessment Scheme

**Accessibility Assessment Scheme · Open Source**

An enterprise platform for evaluating building accessibility across five disability types and five assessment dimensions. Produces OBS (Overall Building Score), NEB classification, TIS/CIS breakdowns, and certification reports.

```
Frontend (Next.js)  ──REST──▶  Backend (Express)  ──TypeORM──▶  MariaDB
   presentation only            all business logic              source of truth
```

## Quick Start

### Prerequisites

- Node.js 18+
- MariaDB 10.11+ (or use Docker)
- npm

### 1. Database

```bash
cd backend
docker compose up -d mariadb
```

### 2. Backend

```bash
cd backend
npm install
npx ts-node src/scripts/seed.ts    # seed criteria, thresholds, building types
npm start                           # → http://localhost:4000
```

Set `DATABASE_URL` to your MariaDB connection string:

```env
DATABASE_URL=mysql://user:password@host:3306/mydb
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                         # → http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` in `frontend/.env.local`.

## Architecture

| Layer | Stack | Responsibility |
|-------|-------|----------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TanStack Query | REST consumer, zero business logic |
| API | Express 4, TypeScript | All calculations, weights, thresholds |
| Database | MariaDB via TypeORM | Criteria, building types, evaluations, config |

### Key Principles

- **Frontend is presentation-only** — no hardcoded weights, thresholds, or formulas
- **Backend is single source of truth** — all calculations happen server-side
- **Data-driven** — disability weights, NEB thresholds, and scoring config live in the database
- **Pure REST** — no direct DB connections from the frontend

## Scoring System

| Metric | Description |
|--------|-------------|
| **OBS** | Overall Building Score (0–100%) — weighted aggregate across all DT/AD dimensions |
| **NEB** | Normalized Efficiency Band — classifies the building (A+, A, B, C, D) |
| **TIS** | Type Impact Score — contribution per disability type |
| **CIS** | Criterion Impact Score — contribution per assessment dimension |

## Project Structure

```
proj/
├── backend/                  # Express + TypeORM REST API
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── entities/         # TypeORM entities (DB schema)
│   │   ├── services/         # Business logic & calculations
│   │   ├── scripts/          # Seed, migration, utilities
│   │   └── tests/            # Calculation & metadata tests
│   └── docker-compose.yml    # MariaDB container
├── frontend/                 # Next.js App Router
│   ├── app/                  # Pages (dashboard, certification, buildings, etc.)
│   ├── components/           # Shared UI components
│   └── lib/                  # API client, hooks, utilities
└── docs/                     # Architecture & deployment guides
```

## License

See [LICENSE](LICENSE).
