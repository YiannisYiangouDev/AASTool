# Testing Guide

## Test Suites

### Backend Tests

| Test | File | Purpose |
|------|------|---------|
| Calculation test | `src/tests/calculation.test.ts` | Verify OBS computation |
| Metadata test | `src/tests/metadata.test.ts` | Verify DB metadata completeness |
| Static analysis | `src/tests/static.test.ts` | Detect hardcoded patterns |
| Workbook mapping | `src/tests/workbook.mapping.test.ts` | Compare criteria vs Excel |

### Running Tests

```bash
cd backend

# Single test
npm test                    # Runs calculation.test.ts

# Full suite
npm run test:automated      # Runs all 3 tests

# Workbook verification
npm run verify:workbook     # Generate mapping report
```

### What Each Test Validates

#### calculation.test.ts
- OBS is a number 0-100
- Average raw score is 3.0 with default scores
- Returns valid structure

#### metadata.test.ts
- MAX_OBS config exists
- At least 1 building type
- At least 1 criterion
- At least 1 NEB threshold

#### static.test.ts
- No hardcoded weight arrays (`[0.2,0.2,0.2,0.2,0.2]`)
- No hardcoded threshold arrays (`[85, 60, 40]`)
- No hardcoded MAX_OBS = 25

#### workbook.mapping.test.ts
- All 63 criteria values match Excel workbook
- Reports any mismatches

## Frontend Testing

The frontend currently has no automated tests. Recommended approach:

```bash
# Add testing libraries
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

## Manual Testing Checklist

### Backend API
- [ ] `GET /health` → 200
- [ ] `POST /evaluate` with default body → valid OBS
- [ ] `POST /evaluate` with custom scores → updated OBS
- [ ] `GET /criteria` → 63 items
- [ ] `GET /building-types` → 7 items
- [ ] `GET /disability-types` → 5 items
- [ ] `GET /assessment-dimensions` → 5 items

### Frontend Pages
- [ ] `/dashboard` — OBS gauge renders, DT/AD labels display
- [ ] `/certification` — Criteria load, filter buttons work
- [ ] `/criteria` — All 63 criteria listed, search/filter works
- [ ] `/buildings` — Building types listed
- [ ] `/login` — Mock login redirects to dashboard
- [ ] `/reports` — Reports list renders
