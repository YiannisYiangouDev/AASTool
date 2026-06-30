# AASTool — Postman API Testing Guide

**Enterprise Edition | Version 1.0.0**

---

## Overview

This guide provides a complete Postman collection for testing the AASTool REST API. Import the collection into Postman to test all 17 endpoints with pre-configured requests, headers, and test scripts.

---

## Quick Start

```bash
# Ensure the backend is running first
bash scripts/start-dev.sh

# Verify backend health
curl http://localhost:4000/health
```

Then import the collection into Postman:
1. Open Postman
2. Click **Import** → **Raw text**
3. Paste the collection JSON from the section below
4. Click **Import**

---

## Postman Collection JSON

Copy and paste the entire block below into Postman's Import dialog:

```json
{
  "info": {
    "name": "AASTool API",
    "description": "Complete API collection for the AASTool Accessibility Assessment Scheme\n\nBase URL: http://localhost:4000\n\nAuthentication: HMAC-SHA256 tokens via POST /api/v1/login",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "1. Health",
      "item": [
        {
          "name": "GET /health (root)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status is ok', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.status).to.eql('ok');",
                  "  pm.expect(json.database).to.eql('connected');",
                  "  pm.expect(json.version).to.exist;",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/health"
            }
          }
        },
        {
          "name": "GET /api/v1/health",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Health with envelope', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(true);",
                  "  pm.expect(json.data.status).to.eql('ok');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/health"
            }
          }
        }
      ]
    },
    {
      "name": "2. Evaluation",
      "item": [
        {
          "name": "POST /api/v1/evaluate (default)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Evaluate with defaults', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(true);",
                  "  pm.expect(json.result.obs).to.be.a('number');",
                  "  pm.expect(json.result.nebClass).to.exist;",
                  "  pm.expect(json.result.criteria.length).to.eql(63);",
                  "  pm.expect(json.result.averageRawScore).to.eql(3);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"buildingType\": \"Commercial Buildings\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/evaluate"
            }
          }
        },
        {
          "name": "POST /api/v1/evaluate (custom scores)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Evaluate with custom scores', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(true);",
                  "  pm.expect(json.result.strengths.length).to.be.above(0);",
                  "  pm.expect(json.result.weaknesses.length).to.be.above(0);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"buildingType\": \"Commercial Buildings\",\n  \"scores\": {\n    \"EC1.1.1\": 5,\n    \"EC1.1.2\": 5,\n    \"EC1.2.2\": 5,\n    \"EC1.4.1\": 5,\n    \"EC2.5.3\": 1,\n    \"EC4.4.1\": 1,\n    \"EC4.3.1\": 1,\n    \"EC5.1.1\": 2\n  }\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/evaluate"
            }
          }
        },
        {
          "name": "POST /api/v1/evaluate (error — invalid building)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Invalid building type returns 400', () => {",
                  "  pm.response.to.have.status(400);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(false);",
                  "  pm.expect(json.error).to.include('Missing or invalid');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"buildingType\": \"Nonexistent\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/evaluate"
            }
          }
        },
        {
          "name": "POST /api/v1/evaluate (error — no body)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Empty body returns 400', () => {",
                  "  pm.response.to.have.status(400);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(false);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/evaluate"
            }
          }
        },
        {
          "name": "POST /api/v1/evaluate (error — malformed JSON)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Malformed JSON returns 400', () => {",
                  "  pm.response.to.have.status(400);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.error).to.include('Invalid JSON');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "not-json"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/evaluate"
            }
          }
        }
      ]
    },
    {
      "name": "3. Criteria",
      "item": [
        {
          "name": "GET /api/v1/criteria",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('List all criteria', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(true);",
                  "  pm.expect(json.data.length).to.eql(63);",
                  "  pm.expect(json.data[0].code).to.match(/^EC/);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/criteria"
            }
          }
        },
        {
          "name": "GET /api/v1/criteria/EC1.1.1",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Get single criterion', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.code).to.eql('EC1.1.1');",
                  "  pm.expect(json.data.name).to.exist;",
                  "  pm.expect(json.data.levels.length).to.eql(5);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/criteria/EC1.1.1"
            }
          }
        },
        {
          "name": "GET /api/v1/criteria/INVALID",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Invalid code returns 404', () => {",
                  "  pm.response.to.have.status(404);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(false);",
                  "  pm.expect(json.error).to.include('not found');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/criteria/INVALID"
            }
          }
        }
      ]
    },
    {
      "name": "4. Reference Data",
      "item": [
        {
          "name": "GET /api/v1/building-types",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Building types', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.length).to.eql(7);",
                  "  pm.expect(json.data[0].disability_weights.length).to.eql(5);",
                  "  pm.expect(json.data[0].dimension_weights.length).to.eql(5);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/building-types"
            }
          }
        },
        {
          "name": "GET /api/v1/disability-types",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Disability types', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.length).to.eql(5);",
                  "  pm.expect(json.data[0].name).to.eql('Physical Disability');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/disability-types"
            }
          }
        },
        {
          "name": "GET /api/v1/assessment-dimensions",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Assessment dimensions', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.length).to.eql(5);",
                  "  pm.expect(json.data[0].name).to.include('Spatial');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/assessment-dimensions"
            }
          }
        },
        {
          "name": "GET /api/v1/neb-thresholds",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('NEB thresholds', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.length).to.eql(5);",
                  "  pm.expect(json.data[0].neb_class).to.exist;",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/neb-thresholds"
            }
          }
        },
        {
          "name": "GET /api/v1/config",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Config values', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.length).to.be.above(0);",
                  "  const keys = json.data.map(k => k.key);",
                  "  pm.expect(keys).to.include.members(['MAX_OBS', 'DEFAULT_SCORE']);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/config"
            }
          }
        }
      ]
    },
    {
      "name": "5. Assessments & Buildings",
      "item": [
        {
          "name": "GET /api/v1/buildings",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('List buildings', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.data.length).to.be.above(0);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/buildings"
            }
          }
        },
        {
          "name": "POST /api/v1/assessments",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Create assessment', () => {",
                  "  pm.response.to.have.status(201);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(true);",
                  "  pm.expect(json.data.id).to.exist;",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"buildingId\": \"7e768861-88ba-4faa-a4a3-47e45f3d5d4b\",\n  \"name\": \"Postman Test Assessment\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/assessments"
            }
          }
        },
        {
          "name": "GET /api/v1/reports",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('List reports', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(true);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/reports"
            }
          }
        }
      ]
    },
    {
      "name": "6. Authentication",
      "item": [
        {
          "name": "POST /api/v1/login (success)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Login succeeds', () => {",
                  "  pm.response.to.have.status(200);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.ok).to.eql(true);",
                  "  pm.expect(json.accessToken).to.exist;",
                  "  pm.expect(json.refreshToken).to.exist;",
                  "  pm.expect(json.expiresIn).to.eql(3600);",
                  "  pm.collectionVariables.set('accessToken', json.accessToken);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"test123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/login"
            }
          }
        },
        {
          "name": "POST /api/v1/login (error — no password)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Missing password returns 400', () => {",
                  "  pm.response.to.have.status(400);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.error).to.include('Email and password');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/login"
            }
          }
        },
        {
          "name": "POST /api/v1/login (error — short password)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Short password returns 400', () => {",
                  "  pm.response.to.have.status(400);",
                  "  const json = pm.response.json();",
                  "  pm.expect(json.error).to.include('at least 6');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/login"
            }
          }
        }
      ]
    }
  ]
}
```

---

## Running the Collection

### Prerequisites

```bash
# 1. Start the backend
cd backend
export DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
node dist/index.js

# 2. Verify it's running
curl http://localhost:4000/health
# → {"status":"ok","database":"connected",...}
```

### Using Postman

| Step | Action |
|------|--------|
| 1 | Open Postman |
| 2 | Click **Import** (top-left) |
| 3 | Switch to **Raw text** tab |
| 4 | Paste the entire JSON from the section above |
| 5 | Click **Import** |
| 6 | Run requests in order or use **Collection Runner** |

### Using Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Save the collection JSON to a file, then run:
newman run AASTool-API.postman_collection.json \
  --reporters cli,json \
  --reporter-json-export test-results.json
```

---

## Endpoint Summary

| Method | Endpoint | Category | Auth Required |
|--------|----------|----------|---------------|
| GET | `/health` | Health | No |
| GET | `/api/v1/health` | Health | No |
| POST | `/api/v1/evaluate` | Evaluation | No |
| GET | `/api/v1/criteria` | Criteria | No |
| GET | `/api/v1/criteria/:code` | Criteria | No |
| POST | `/api/v1/criteria` | Criteria | No |
| GET | `/api/v1/building-types` | Reference | No |
| GET | `/api/v1/disability-types` | Reference | No |
| GET | `/api/v1/assessment-dimensions` | Reference | No |
| GET | `/api/v1/neb-thresholds` | Reference | No |
| GET | `/api/v1/config` | Reference | No |
| GET | `/api/v1/buildings` | Buildings | No |
| GET | `/api/v1/buildings/:id` | Buildings | No |
| POST | `/api/v1/assessments` | Assessments | No |
| GET | `/api/v1/assessments/:id` | Assessments | No |
| GET | `/api/v1/reports` | Reports | No |
| POST | `/api/v1/login` | Auth | No |

---

## Expected Responses

### Success Response Format

```json
{
  "ok": true,
  "data": { ... }
}
```

The `POST /api/v1/evaluate` endpoint returns results directly under `result`:

```json
{
  "ok": true,
  "result": {
    "obs": 60,
    "nebClass": "A",
    "nebEquivalent": "4",
    "nebMeaning": "Good",
    "averageRawScore": 3,
    "strengths": [],
    "weaknesses": [],
    "criteria": []
  }
}
```

### Error Response Format

```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Test Scenarios

### Happy Path

1. `GET /health` → Server is up
2. `GET /api/v1/criteria` → 63 criteria returned
3. `POST /api/v1/evaluate` → OBS: 60, NEB: A
4. `GET /api/v1/building-types` → 7 building profiles
5. `POST /api/v1/login` → Access token received

### Error Handling

1. `POST /api/v1/evaluate` with `{}` → 400 Missing buildingType
2. `POST /api/v1/evaluate` with malformed JSON → 400 Invalid JSON
3. `POST /api/v1/evaluate` with unknown building → 400 Descriptive error
4. `GET /api/v1/criteria/INVALID` → 404 Not found
5. `POST /api/v1/login` with missing password → 400 Email and password required

### Edge Cases

1. Evaluate with all default scores → OBS: 60, NEB: A
2. Evaluate with custom scores (mix of 5s and 1s) → Verify strengths/weaknesses populated
3. Evaluate `Industrial Buildings` → Different building weights
4. Multiple building types sequentially → Each returns valid results

---

## Quick Verification Script

If you don't have Postman installed, use this one-liner to verify the API is working:

```bash
echo "=== Health ===" && \
curl -s http://localhost:4000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Status: {d[\"status\"]}, DB: {d[\"database\"]}, Version: {d[\"version\"]}')" && \
echo "=== Criteria Count ===" && \
curl -s http://localhost:4000/api/v1/criteria | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Criteria: {len(d[\"data\"])}')" && \
echo "=== Evaluate ===" && \
curl -s http://localhost:4000/api/v1/evaluate -X POST -H "Content-Type: application/json" -d '{"buildingType":"Commercial Buildings"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OBS: {d[\"result\"][\"obs\"]}, NEB: {d[\"result\"][\"nebClass\"]}')" && \
echo "=== Login ===" && \
curl -s http://localhost:4000/api/v1/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Token: {d[\"accessToken\"][:20]}...')" && \
echo "=== All API checks passed ==="
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `ECONNREFUSED` | Backend not running | Start with `bash start-dev.sh` |
| `Cannot POST /api/v1/login` | Wrong route | Use `POST /api/v1/login` (not `/api/v1/auth/login`) |
| `Internal error` on evaluate | Bad building type | Use one of: `Commercial Buildings`, `Residential Buildings`, etc. |
| 0 results for criteria | DB not seeded | Run `npm run seed` in the backend directory |
| `DATABASE_URL not configured` | Missing `.env` file | `cp .env.example .env` in `backend/` directory |

---

*Document version 1.0.0 — Generated from AASTool codebase*
