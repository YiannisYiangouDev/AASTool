# Calculation Engine — Technical Reference

## Overview

The calculation engine implements the OBS (Overall Building Score) framework based on EN 17210 accessibility standards. All calculations are dynamic — no weights, thresholds, or criteria are hardcoded.

## Core Formulas

### 1. Individual Score IS(i,j)

$$IS(i,j) = V(i,j) \times S(i,j)$$

Where:
- $V(i,j)$ = criterion value (weight from Excel workbook, stored in `criteria.value`)
- $S(i,j)$ = assigned score (1-5) for criterion under DT `i` and AD `j`
- $i$ = disability type (1-5)
- $j$ = assessment dimension (1-5)

### 2. Total Impact Score TIS(i)

$$TIS(i) = \sum_{j} IS(i,j)$$

Sum of all individual scores for disability type $i$ across all dimensions $j$.

### 3. Composite Impact Score CIS(j)

$$CIS(j) = \sum_{i} w_i \times IS(i,j)$$

Sum of disability-weighted individual scores for assessment dimension $j$ across all disability types $i$. Weights $w_i$ come from `building_types.disability_weights`.

### 4. Overall Building Score OBS

$$OBS = \frac{\sum_{i} w_i \times TIS(i)}{MAX\_OBS} \times 100$$

Where:
- $w_i$ = disability weight for type $i$
- $MAX\_OBS$ = normalization factor (configurable, default 25)
- Result is a percentage (0-100)

### 5. NEB Classification

OBS percentage is compared against thresholds in `neb_thresholds`:

| OBS Range | NEB Class | Equivalent | Meaning |
|-----------|-----------|------------|---------|
| ≥ 85% | A+ | 5 | Excellent / Best practice |
| ≥ 60% | A | 4 | Good |
| ≥ 40% | B | 3 | Acceptable |
| < 40% | No Rating | N/A | Non-compliant |

## Implementation

Location: `backend/src/services/calculationService.ts`

### Key Functions

```typescript
export async function evaluate(buildingType: string, scores?: CriteriaMap)
```

**Parameters:**
- `buildingType`: e.g., "Commercial Buildings"
- `scores`: Optional partial mapping of criterion codes → scores (1-5). Missing scores default to `DEFAULT_SCORE` (3).

**Returns:**
```typescript
{
  obs: number;              // 0-100 percentage
  nebClass: string;         // "A+", "A", "B", "No Rating"
  nebEquivalent: string;    // "5", "4", "3", "N/A"
  nebMeaning: string;       // Human-readable description
  nebScore: number;         // 1-5
  averageRawScore: number;  // Mean of all scores
  avgRawScoreByDT: Record<number, number>;  // Avg score per DT
  avgRawScoreByAD: Record<number, number>;  // Avg score per AD
  strengths: Criterion[];   // Top N high-scoring criteria
  weaknesses: Criterion[];  // Top N low-scoring criteria
  tisByDT: Record<number, number>;          // TIS per DT
  cisByAD: Record<number, number>;          // CIS per AD
  criteria: Criterion[];    // All criteria with computed IS
}
```

### Dynamic DT/AD Derivation

The engine dynamically discovers which DT/AD IDs exist from the criteria data:

```typescript
function uniqueSortedIds(items: any[], field: string): number[] {
  const ids = new Set<number>();
  for (const item of items) {
    const v = Number(item[field]);
    if (Number.isFinite(v) && v > 0) ids.add(v);
  }
  return [...ids].sort((a, b) => a - b);
}
```

This means adding a 6th disability type or removing one requires **zero code changes** — just update the database criteria.

## Configurable Parameters

All stored in `config` table:

| Key | Default | Description |
|-----|---------|-------------|
| MAX_OBS | 25 | OBS normalization divisor |
| DEFAULT_SCORE | 3 | Default score for unrated criteria |
| STRENGTH_THRESHOLD | 5 | Minimum score to be a "strength" |
| WEAKNESS_THRESHOLD | 2 | Maximum score to be a "weakness" |
| TOP_N_RESULTS | 5 | Number of top strengths/weaknesses |

## Verification

The calculation engine has been verified against the Excel workbook (WP.xlsx):
- All 63 criteria values match the workbook exactly
- OBS formula matches spreadsheet calculations
- NEB thresholds match certification bands

### Running Verification

```bash
cd backend
npm run verify:workbook    # Compare criteria against workbook
npm test                   # Run calculation tests
npm run test:automated     # Full test suite
```
