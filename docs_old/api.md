# API Reference — AAS

**Base URL**: `http://localhost:4000/api/v1`
**Content-Type**: `application/json`

## Endpoints

### Health Check
```
GET /health
```
**Response 200**: `{"status":"ok"}`

---

### Evaluation

#### POST /api/v1/evaluate
Run the full OBS/TIS/CIS/NEB calculation engine.

**Request**:
```json
{
  "buildingType": "Commercial Buildings",
  "scores": {
    "EC1.1.1": 4,
    "EC1.1.2": 3
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| buildingType | string | No | Building type name (default: "Commercial Buildings") |
| scores | object | No | Criterion code → score (1-5) mapping |

**Response 200**:
```json
{
  "ok": true,
  "result": {
    "obs": 60.0,
    "nebClass": "A",
    "nebEquivalent": "4",
    "nebMeaning": "Good",
    "nebScore": 4,
    "averageRawScore": 3.0,
    "avgRawScoreByDT": {"1": 3.0, "2": 3.0, ...},
    "avgRawScoreByAD": {"1": 3.0, "2": 3.0, ...},
    "strengths": [...],
    "weaknesses": [...],
    "tisByDT": {"1": 15.0, "2": 15.0, ...},
    "cisByAD": {"1": 3.0, "2": 3.0, ...},
    "criteria": [
      {
        "code": "EC1.1.1",
        "name": "Accessible Entrance Width",
        "value": 0.7,
        "disability": 1,
        "dimension": 1,
        "score": 3,
        "is": 2.1
      }
    ]
  }
}
```

**Errors**: 400 (validation), 500 (internal)

---

### Criteria

#### GET /api/v1/criteria
List all evaluation criteria.

**Response 200**:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "code": "EC1.1.1",
      "name": "Accessible Entrance Width",
      "definition": "...",
      "justification": "...",
      "value": 0.7,
      "disability": 1,
      "dimension": 1,
      "score": 3,
      "levels": ["Insufficient...", "Narrow...", ...]
    }
  ]
}
```

#### GET /api/v1/criteria/:code
Get single criterion by code. Returns 404 if not found.

---

### Building Types

#### GET /api/v1/building-types
List all building types with weights.

**Response 200**:
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "Commercial Buildings",
      "disability_weights": [0.28, 0.22, 0.18, 0.12, 0.2],
      "dimension_weights": [0.3, 0.25, 0.18, 0.12, 0.15]
    }
  ]
}
```

---

### Disability Types

#### GET /api/v1/disability-types
Canonical disability type labels from `building-types.json`.

**Response 200**:
```json
{
  "ok": true,
  "data": [
    {"id": 1, "name": "Physical Disability", "description": "DT 1 — Physical Disability"},
    {"id": 2, "name": "Sensory Disability", "description": "DT 2 — Sensory Disability"}
  ]
}
```

---

### Assessment Dimensions

#### GET /api/v1/assessment-dimensions
Canonical dimension labels from `building-types.json`.

**Response 200**:
```json
{
  "ok": true,
  "data": [
    {"id": 1, "name": "Spatial & Physical Accessibility", "description": "AD 1 — Spatial & Physical Accessibility"},
    {"id": 2, "name": "Safety & Environmental Comfort", "description": "AD 2 — Safety & Environmental Comfort"}
  ]
}
```

---

### NEB Thresholds

#### GET /api/v1/neb-thresholds
Certification threshold configuration.

**Response 200**:
```json
{
  "ok": true,
  "data": [
    {"id": "uuid", "min": 85, "neb_class": "A+", "equivalent": "5", "meaning": "Excellent / Best practice", "neb_score": 5, "ordinal": 1}
  ]
}
```

---

### Config

#### GET /api/v1/config
Runtime configuration values.

**Response 200**:
```json
{
  "ok": true,
  "data": [
    {"id": "uuid", "key": "MAX_OBS", "value": "25"}
  ]
}
```

---

### Buildings (Aggregated)

#### GET /api/v1/buildings
List buildings with assessment counts.

#### GET /api/v1/buildings/:id
Get single building with assessment history.

---

### Assessments

#### POST /api/v1/assessments
Create and store an evaluation.

**Request**:
```json
{
  "buildingId": "uuid",
  "name": "Optional assessment name"
}
```

**Response 201**:
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "buildingId": "uuid",
    "name": "Assessment - Commercial Buildings",
    "results": { ... }
  }
}
```

#### GET /api/v1/assessments/:id
Retrieve a stored assessment.

---

### Reports

#### GET /api/v1/reports
List all stored evaluation reports.

---

### Authentication

#### POST /api/v1/auth/login
Mock authentication (for development).

**Request**: `{"email": "user@example.com", "password": "password123"}`

**Response 200**: `{"ok": true, "accessToken": "mock-jwt-token-xyz", "refreshToken": "...", "expiresIn": 3600, "redirectTo": "/dashboard"}`

---

## Error Format

All errors follow:
```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error / bad request |
| 404 | Resource not found |
| 500 | Internal server error |
