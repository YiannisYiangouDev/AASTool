# AAS Frontend

Next.js 16 App Router application. **Pure REST API consumer** — contains zero business logic.

## Quick Start

```bash
cd proj/frontend
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` in `.env.local` to point to the backend.

## Technology

| Layer | Library |
|-------|---------|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19.2.6, Tailwind CSS 3.4 |
| Animation | Framer Motion 12.40 |
| Data fetching | @tanstack/react-query 5.x + axios |
| Validation | Zod 3.25 |

## Architecture

- **12 pages** in `app/` — all fetch data from the backend REST API
- **8 components** in `components/` — Header, BottomNav, BuildingCard, ErrorBoundary, PWAProvider, OfflineIndicator, ThemeProvider, Navbar
- **5 hooks** in `lib/hooks/` — React Query wrappers for backend endpoints
- **13 endpoint functions** in `lib/api/endpoints.ts` — one per backend route
- **`unwrap<T>()` helper** — normalizes `{ok: true, data: T}` and `{ok: true, result: T}` responses

## What's NOT here

❌ No calculations (TIS/CIS/OBS/NEB all server-side)
❌ No Supabase
❌ No hardcoded criteria, weights, or thresholds
❌ No direct database access
❌ No Next.js API routes

## Documentation

See `html/proj/docs/frontend.md` for full overview.
