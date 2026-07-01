# AASTool Database

**MariaDB 10.11 — Standalone Database Project**

---

## Overview

This is the standalone database project for AASTool. It contains all database-related assets: Docker configuration, migration scripts, backup tools, and documentation.

### Structure

```
database/
├── docker/
│   ├── docker-compose.yml       # MariaDB + Adminer containers
│   └── initdb/
│       └── init.sql             # First-run schema initialization
├── migrations/                   # TypeORM migration files (copied from backend)
├── schema/                       # Exported SQL schema snapshots
├── backups/                      # Compressed SQL dumps
├── scripts/
│   ├── backup.sh                 # Create a database backup
│   ├── restore.sh                # Restore from a backup
│   └── export-schema.sh          # Export current schema
├── docs/
│   └── architecture.md            # Database architecture documentation
├── .env.example                   # Environment configuration template
├── verify-database.sh             # Data integrity verification
└── README.md                      # This file
```

### Quick Start

```bash
# 1. Start the database
cd database
cp .env.example .env
docker compose up -d

# 2. Verify it's running
bash verify-database.sh

# 3. Backend connects via DATABASE_URL:
export DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
```

---

## Docker

### Starting the Database

```bash
cd database
docker compose up -d
```

Starts:
- **MariaDB 10.11** on port 3306 (persistent volume, health check, auto-restart)
- **Adminer** on port 8080 (DB management UI)

### Stopping

```bash
docker compose down
# To also remove the data volume:
docker compose down -v
```

### Configuration

Copy `.env.example` to `.env` and edit:

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_ROOT_PASSWORD` | `rootpass` | MariaDB root password |
| `MYSQL_DATABASE` | `mydb` | Application database name |
| `MYSQL_USER` | `myuser` | Application database user |
| `MYSQL_PASSWORD` | `mypassword` | Application database password |

---

## Verification

```bash
bash verify-database.sh
```

Checks:
- Database connection
- All 7 tables exist with correct row counts (criteria: 63, building_types: 7, etc.)
- Foreign keys and indexes
- Schema integrity (required columns exist)

---

## Backup & Restore

### Backup

```bash
# Default backup (to ./backups/)
bash scripts/backup.sh

# With custom connection
DATABASE_URL="mysql://user:pass@host:3306/db" bash scripts/backup.sh
```

Creates a compressed `.sql.gz` dump in `backups/`. Old backups (>7 days) auto-deleted.

### Restore

```bash
# List available backups
ls -lh backups/

# Restore
bash scripts/restore.sh backups/aastool-db-20260701_120000.sql.gz
```

### Schema Export

```bash
bash scripts/export-schema.sh
```

Exports current schema (no data) to `schema/aastool-schema.sql`.

---

## Migrations

Migration files in `migrations/` are TypeORM-compatible `MigrationInterface` classes.
They are also present in the backend project for the TypeORM migration runner.

```bash
# The backend runs migrations on startup via:
cd backend
npm run migrate
```

---

## Database Connection

The backend connects to this database using environment variables only:

```env
DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
```

**No hardcoded hostnames, ports, or credentials in the backend code.**

---

## Production Deployment

In Azure, the database is deployed as a managed service:

| Service | Azure Resource |
|---------|---------------|
| MariaDB | Azure Database for MariaDB (10.3) |
| Connection | SSL-enabled, firewall-restricted |

The database project here is used for:
- Local development
- CI/CD pipeline test containers
- Backup/restore procedures
- Schema management
