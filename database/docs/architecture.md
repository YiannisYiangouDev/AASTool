# AASTool Database Architecture

**MariaDB 10.11 | 7 Tables | 63 Criteria | 7 Building Types**

---

## Entity-Relationship Diagram

```
┌──────────────────┐      ┌──────────────────┐
│   BuildingType   │      │    Evaluation     │
├──────────────────┤      ├──────────────────┤
│ id (UUID, PK)    │      │ id (UUID, PK)     │
│ name (UNIQUE)    │      │ user_id           │
│ disability_weights│      │ building_type     │
│ dimension_weights│      │ scores (JSON)     │
└──────────────────┘      │ result (JSON)     │
                           │ obs (float)       │
┌──────────────────┐      │ neb_class         │
│    Criterion     │      │ average_raw_score │
├──────────────────┤      │ created_at        │
│ id (UUID, PK)    │      └──────────────────┘
│ code (UNIQUE)    │
│ name             │      ┌──────────────────┐
│ definition       │      │  NebThreshold    │
│ justification    │      ├──────────────────┤
│ value (float)    │      │ id (UUID, PK)    │
│ disability (int) │      │ min (int)        │
│ dimension (int)  │      │ neb_class        │
│ score (int)      │      │ equivalent       │
│ levels (JSON)    │      │ meaning          │
└──────────────────┘      │ neb_score (int)  │
                           │ ordinal (int)    │
┌──────────────────┐      └──────────────────┘
│     Config       │
├──────────────────┤      ┌──────────────────┐
│ id (UUID, PK)    │      │  DisabilityType  │
│ key (UNIQUE)     │      ├──────────────────┤
│ value            │      │ id (int, PK)     │
└──────────────────┘      │ name             │
                           │ icon             │
┌──────────────────┐      │ gradient         │
│ AssessmentDimension│     │ bg_color         │
├──────────────────┤      │ text_color       │
│ id (int, PK)     │      │ border_color     │
│ name             │      └──────────────────┘
│ icon             │
│ gradient         │
│ bg_color         │
│ text_color       │
│ border_color     │
└──────────────────┘
```

---

## Table Details

### 1. `criteria` — 63 evaluation criteria

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID (PK) | Auto-generated | `0652f82f-...` |
| `code` | VARCHAR (UNIQUE) | Criterion code | `EC1.1.1` |
| `name` | VARCHAR | Short name | `Accessible Entrance Width` |
| `definition` | TEXT | Full definition | `Minimum clear opening width...` |
| `justification` | TEXT | Why it matters | `Ensures wheelchair passage...` |
| `value` | FLOAT | Base weight (0-1) | `0.7` |
| `disability` | INT | DT ID (1-5) | `1` |
| `dimension` | INT | AD ID (1-5) | `1` |
| `score` | INT | Default score | `3` |
| `levels` | JSON | 5 level descriptions | `["Insufficient",...,"Excellent"]` |

**Code format**: `EC{disability}.{dimension}.{sequence}`
- `EC1.1.3` = Physical (DT1), Wayfinding (AD1), 3rd criterion

### 2. `building_types` — 7 building profiles

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `name` | VARCHAR (UNIQUE) | Building type name |
| `disability_weights` | JSON | 5-element array (DT1–DT5 weights) |
| `dimension_weights` | JSON | 5-element array (AD1–AD5 weights) |

**Types**: Residential, Commercial, Industrial, Institutional, Religious, Recreational, Special-Purpose

### 3. `evaluations` — Saved assessment results

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | VARCHAR (nullable) | Optional user identifier |
| `building_type` | VARCHAR | Building type name |
| `scores` | JSON | All criterion scores `{ code: score }` |
| `result` | JSON | Full evaluation result object |
| `obs` | DOUBLE (nullable) | OBS score (0-100) |
| `neb_class` | VARCHAR (nullable) | NEB class (A+, A, B, C, No Rating) |
| `average_raw_score` | DOUBLE (nullable) | Average score across criteria |
| `created_at` | DATETIME | Auto-generated timestamp |

### 4. `neb_thresholds` — NEB classification bands

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `min` | INT | Minimum OBS for this band |
| `neb_class` | VARCHAR | Class label |
| `equivalent` | VARCHAR | Human-readable equivalent |
| `meaning` | TEXT | What this class means |
| `neb_score` | INT | Numeric score (5-1) |
| `ordinal` | INT | Sort order |

**Bands**: A+(85) → A(60) → B(40) → C(20) → No Rating(0)

### 5. `config` — System configuration

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `key` | VARCHAR (UNIQUE) | Parameter key |
| `value` | TEXT | Parameter value |

**Keys**: `MAX_OBS`, `DEFAULT_SCORE`, `STRENGTH_THRESHOLD`, `WEAKNESS_THRESHOLD`, `TOP_N_RESULTS`

### 6. `disability_types` — DT metadata

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | 1-5 |
| `name` | VARCHAR | Full name |
| `icon` | VARCHAR | Icon code |
| `gradient` | VARCHAR | Tailwind gradient classes |
| `bg_color`, `text_color`, `border_color` | VARCHAR | Theme colors |

### 7. `assessment_dimensions` — AD metadata

Same structure as `disability_types`, for dimensions 1-5.

---

## Scoring System

### Formula Flow

```
User scores → Impact Score (IS = value × score)
                   ↓
         Total Impact Score by DT (TIS)
                   ↓
         Weighted aggregation → OBS (0-100)
                   ↓
         NEB Classification (A+ to No Rating)
```

All calculations happen in the **backend** (`calculationService.ts`).
The database stores only reference data and saved results.

---

## Query Patterns

### Most Common Queries

```sql
-- All criteria ordered by code
SELECT * FROM criteria ORDER BY code ASC;

-- Evaluation with default scores
SELECT code, name, value, score FROM criteria;

-- Building types with their weight profiles
SELECT name, disability_weights, dimension_weights FROM building_types;

-- NEB classification for an OBS score
SELECT * FROM neb_thresholds WHERE min <= :obs ORDER BY min DESC LIMIT 1;

-- Reports list
SELECT id, building_type, obs, neb_class, created_at
FROM evaluations ORDER BY created_at DESC;
```

---

## Migration Process

```bash
cd backend

# Run pending migrations
npm run migrate

# Create a new migration (TypeORM CLI)
npx typeorm migration:create src/migrations/AddNewFeature
```

Migrations are applied in order by timestamp.
The TypeORM `migrations` table tracks which have been applied.

---

## Maintenance Procedures

### Backup (daily recommended)
```bash
cd database && bash scripts/backup.sh
```

### Verify Data Integrity
```bash
cd database && bash verify-database.sh
```

### Check Database Health
```bash
docker compose ps
docker logs aastool-db --tail 50
```

### Size Report
```bash
mysql -h localhost -u myuser -pmypassword mydb -e "
  SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
  FROM information_schema.tables
  WHERE table_schema = 'mydb'
  ORDER BY (data_length + index_length) DESC;"
```

---

*AASTool by Serg | Dev by Y*
