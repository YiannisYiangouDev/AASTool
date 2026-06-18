# SERG-ASSTool Kernel REST API Specification

Base URL: /api/v1
Auth: JWT (Bearer) for protected endpoints. Public read endpoints may be unprotected.

1) POST /api/v1/evaluate
- Purpose: Run the canonical calculation engine (IS/CIS/TIS/OBS/NEB) for a building.
- Request JSON:
  {
    "buildingType": "Commercial Buildings", // optional, default used when absent
    "scores": { "EC1.1.1": 3, "EC1.1.2": 4, ... } // optional: map criterion code → 1..5
  }
- Validation:
  - `buildingType` string if provided
  - `scores` object with string keys and numeric values (1 ≤ v ≤ 5)
- Response 200:
  {
    "obs": 72.34, // percent (0-100)
    "nebClass": "A",
    "nebEquivalent": "4",
    "nebMeaning": "Good",
    "nebScore": 4,
    "averageRawScore": 3.12,
    "tisByDT": { "1": 4.1234, "2": 3.9876, ... },
    "cisByAD": { "1": 2.3456, "2": 3.2100, ... },
    "criteria": [ { code, name, value, disability, dimension, score, is }, ... ]
  }
- Errors: 400 (validation), 422 (domain constraints), 500 (internal)

2) GET /api/v1/criteria
- Purpose: Return canonical criteria list (code, name, definition, justification, value, disability, dimension, default score, levels)
- Response 200: Array of Criterion objects.

2b) POST /api/v1/criteria
- Purpose: Create a new evaluation criterion with progressive 5-level smart automation scales.
- Request JSON:
  {
    "code": "EC1.1.3",                // required, pattern ECx.y.z
    "name": "Adaptive Floor Navigation",
    "definition": "Brief description of what this criterion measures...",
    "justification": "Why this matters (optional)",
    "value": 0.3,                      // float 0-1
    "disability": 1,                   // int 1-5 (DT)
    "dimension": 1,                    // int 1-5 (AD)
    "levels": ["L1 text", "L2 text", "L3 text", "L4 text", "L5 text"]  // exactly 5 strings
  }
- Validation:
  - `code` required, must match `/^EC\d+\.\d+\.\d+$/`
  - `name` and `definition` required
  - `value` number 0-1
  - `disability` int 1-5
  - `dimension` int 1-5
  - `levels` array of exactly 5 strings
  - Duplicate `code` returns 409 Conflict
- Response 201: `{ ok: true, data: { id, code, name, definition, justification, value, disability, dimension, score, levels } }`
- Errors: 400 (validation), 409 (duplicate code), 500 (internal)

3) GET /api/v1/criteria/:code
- Purpose: Return single criterion by `code`.
- Response 200: Criterion object or 404 if not found.

4) GET /api/v1/building-types
- Purpose: Return building type list and default disability/dimension weights.
- Response 200:
  {
    "buildingTypes": ["Commercial Buildings", ...],
    "weights": { "Commercial Buildings": { "disability": [0.24,...], "dimension": [0.26,...] }, ... }
  }

5) POST /api/v1/certifications (protected)
- Purpose: Create/store a certification record from an evaluation and optionally trigger PDF/report generation.
- Request JSON:
  {
    "evaluation": { /* same shape as /evaluate result */ },
    "metadata": { "siteName": "HQ", "assessorId": "user-uuid", "notes": "..." }
  }
- Response 201:
  { "id": "uuid", "nebClass": "A", "issuedAt": "2026-06-11T...Z", "reportUrl": "/exports/.." }

6) Evaluations CRUD (protected)
- POST /api/v1/evaluations — store evaluation (returns id)
- GET /api/v1/evaluations/:id — fetch evaluation
- GET /api/v1/evaluations?owner={id}&limit=&offset= — list evaluations
- DELETE /api/v1/evaluations/:id — soft-delete (RBAC)

7) Auth endpoints
- POST /api/v1/auth/register — body: { name, email, password } → validates via Zod, creates user, returns 201
- POST /api/v1/auth/login — body: { email, password } → returns { accessToken, refreshToken, expiresIn }
- POST /api/v1/auth/refresh — body: { refreshToken } → issues new accessToken
- POST /api/v1/auth/logout — invalidates refresh token

8) Exports & Reports
- POST /api/v1/exports/pdf — protected; body: { evaluationId | evaluation, formatOptions } → returns { url | binary }
- POST /api/v1/exports/csv — protected; returns CSV stream or URL

9) Validation Schemas (suggested Zod)
- EvaluateSchema: object({ buildingType?: string(), scores?: record(string(), number().min(1).max(5)) })
- CriterionSchema: object({ code: string, name: string, value: number, disability: number, dimension: number, score: number, levels: array(string()) })
- CertificationSchema: object({ evaluation: EvaluateResultSchema, metadata: object().optional() })

10) Error model
- 400 Bad Request — validation errors: { ok:false, error: 'Validation failed', details: [...] }
- 401 Unauthorized — auth required
- 403 Forbidden — insufficient permissions
- 404 Not Found
- 422 Unprocessable Entity — business rule violation
- 500 Internal Server Error — { ok:false, error: 'Internal error' }

11) Non-functional & Security notes
- Rate-limit `POST /api/v1/evaluate` to prevent abuse.
- Validate numeric precision and return deterministic rounding (2 decimals for `obs`, 4 for internal partials).
- Logging & audit for certification and export endpoints.
- Use HTTPS and secure cookies for auth; store refresh tokens server-side (or in DB) with revocation.

12) Example `curl` (evaluate)

curl -X POST -H "Content-Type: application/json" \
  -d '{"buildingType":"Commercial Buildings","scores":{"EC1.1.1":3}}' \
  https://api.example.com/api/v1/evaluate


Implementation notes
- Reuse `html/proj/backend/src/services/calculationService.ts` as the canonical kernel implementation.
- Add unit tests mirroring `html/proj/backend/src/tests/calculation.test.ts` to verify parity after integration.
- Persist criteria and building-types as DB fixtures or immutable JSON served by backend.
