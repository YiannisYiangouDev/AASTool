# AASTool — Pre-Deployment Check Process

**Enterprise Edition | Version 1.0.0**

---

## Overview

The `check-deploy.sh` script is a pre-deployment validation suite that ensures code quality, database integrity, and API functionality before deploying to Azure or pushing to production. It runs **13 automated checks** across 5 phases.

---

## Quick Start

```bash
# Run the full check suite
bash check-deploy.sh

# Skip frontend build (faster for backend-only changes)
CHECK_SKIP_FRONTEND=true bash check-deploy.sh
```

Exit code `0` = all checks passed.  
Exit code `1` = one or more checks failed.

---

## Phase 1 — Environment Checks (4 checks)

Verifies that all required tools and configuration are available on the current machine.

| # | Check | What It Tests | Failure Scenario |
|---|-------|--------------|-----------------|
| 1 | Node.js installed | `node -v` exits successfully | Node.js not installed or not on PATH |
| 2 | npm installed | `npm -v` exits successfully | npm not found |
| 3 | Git available | `git --version` exits successfully | Git not installed |
| 4 | DATABASE_URL configured | `.env` or `.env.example` contains `DATABASE_URL` | Missing environment variable |

---

## Phase 2 — Backend TypeScript Compilation (2 checks)

Validates that the backend compiles cleanly before deployment.

| # | Check | What It Tests | Failure Scenario |
|---|-------|--------------|-----------------|
| 5 | TypeScript noEmit | `tsc --noEmit` — full type checking | Type errors in source files |
| 6 | Full build | `npm run build` — compiles to `dist/` | Compilation errors, missing dependencies |

---

## Phase 3 — Automated Tests (5 checks)

Runs the backend test suite to verify data integrity and calculation accuracy.

### Static Tests (No Database Required)

| # | Check | What It Tests |
|---|-------|--------------|
| 7 | Static checks | Scans source code for hardcoded calculation values (e.g., `MAX_OBS = 25`, `85, 60, 40` thresholds) — ensures all config is data-driven |
| 8 | Workbook mapping | Validates the 63-criteria DataFrame integrity: code format `EC{dt}.{ad}.{seq}`, all 25 DT-AD pairs, 5 levels per criterion, value ranges |
| 9 | Metadata static | Validates entity structure: `DATABASE_URL` format, Criterion entity fields, BuildingType weights array length, config keys |

### API Tests (Requires Running Backend)

| # | Check | What It Tests |
|---|-------|--------------|
| 10 | Evaluate API | `POST /api/v1/evaluate` with Commercial Buildings — verifies `ok: true` and `result` object with OBS score |
| 11 | Metadata API | `GET /api/v1/disability-types` and `GET /api/v1/assessment-dimensions` — verifies 5 DTs and 5 ADs returned |

---

## Phase 4 — Frontend Checks (Optional, skipped with `CHECK_SKIP_FRONTEND`)

| # | Check | What It Tests |
|---|-------|--------------|
| — | Frontend TypeScript | `tsc --noEmit` in `frontend/` directory |
| — | Next.js build | `npm run build` — production build of the Next.js app |

---

## Phase 5 — Code Quality (2 checks)

Security and repository hygiene validation.

| # | Check | What It Tests | Failure Scenario |
|---|-------|--------------|-----------------|
| 12 | No .env in staging | Ensures no `.env` file is accidentally staged for commit | `.env` with real credentials would be pushed to GitHub |
| 13 | No hardcoded secrets | Scans staged files for patterns `rootpass` or `mypassword` | Credentials exposed in source code |

A warning is also shown if there are uncommitted changes (non-blocking).

---

## Summary Output

At the end of the run, the script displays:

```
═══════════════════════════════════════════
  Pre-Deployment Check Summary
═══════════════════════════════════════════
  Total:  13
  Passed: 13
  Failed: 0

  ✅ All checks passed — ready to deploy!
```

---

## Integration with CI/CD

This script is designed to run in multiple contexts:

| Context | Command | Notes |
|---------|---------|-------|
| **Local development** | `bash check-deploy.sh` | Full check before pushing |
| **Git pre-push hook** | `bash check-deploy.sh` | Add to `.git/hooks/pre-push` |
| **GitHub Actions** | `bash check-deploy.sh` | Run as a step before `azure/webapps-deploy` |
| **Azure DevOps** | `bash check-deploy.sh` | Run in a pipeline job |

### Sample GitHub Actions Integration

```yaml
- name: Run pre-deployment checks
  run: bash check-deploy.sh
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| Check [10] fails | Backend not running | Start with `bash start-dev.sh` or `node dist/index.js` |
| Check [4] fails | Missing `.env` | Run `cp backend/.env.example backend/.env` |
| Check [12] fails | `.env` staged | Run `git reset -- .env` and add `.env` to `.gitignore` |
| Script hangs | Backend not responding to health check | Verify `curl http://localhost:4000/health` returns 200 |
| Node.js errors | Wrong Node version | Requires Node.js 18+ (tested on 22 and 24) |

---

## File Reference

| File | Location | Purpose |
|------|----------|---------|
| Check script | `check-deploy.sh` | Pre-deployment validation |
| Backend tests | `backend/src/tests/` | 4 test files (static, workbook, calculation, metadata) |
| API spec | `docs/api.md` | Full API reference |
| Azure guide | `docs/azure-deployment.md` | Deployment instructions |
| CI/CD pipeline | `.github/workflows/deploy.yml` | GitHub Actions automation |

---

*Document version 1.0.0 — Generated from AASTool codebase*