# Troubleshooting Guide

## Common Issues

### Frontend won't start (Port 3000 in use)

```bash
# Kill process on port 3000
wsl bash -c "fuser -k 3000/tcp"

# Or find and kill manually
wsl bash -c "lsof -ti:3000 | xargs kill -9"
```

### "Port 3000 is in use, using available port 3001"

This means another process (possibly an old Next.js instance) is holding port 3000. Kill it:
```bash
wsl bash -c "fuser -k 3000/tcp"
# Then restart frontend
```

### Backend can't connect to MariaDB

```bash
# Check if MariaDB is running
docker ps | grep mariadb

# Start if not running
cd backend && docker-compose up -d

# Check logs
cd backend && docker-compose logs mariadb

# Test connection
docker exec -it mariadb mysql -u myuser -pmypassword -e "SELECT 1"
```

### "Metadata validation failed" on startup

This means the database is missing required data:
```bash
cd backend
npm run migrate    # Ensure tables exist
npm run seed       # Populate data
npm start          # Try starting again
```

### Frontend shows "Loading..." indefinitely

Check:
1. Backend is running on port 4000
2. No CORS errors in browser console
3. API URL is correct (`NEXT_PUBLIC_API_URL`)

```bash
# Verify backend
curl http://localhost:4000/health

# Verify evaluate endpoint
curl -X POST http://localhost:4000/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"buildingType":"Commercial Buildings"}'
```

### TypeORM "Entity metadata not found"

Clear the dist directory and rebuild:
```bash
cd backend
rm -rf dist
npm start    # ts-node will recompile
```

### CSS/Styling not applied

Tailwind v4 requires `@tailwindcss/postcss`:
```bash
cd frontend
npm install @tailwindcss/postcss
rm -rf .next
npm run dev
```

### npm not found (PowerShell)

Node.js and npm are only available in WSL, not PowerShell:
```bash
# Use WSL
wsl bash -c "cd /mnt/c/Users/yiannis/Desktop/Serg/proj/backend && npm start"
```

## Database Reset

Complete reset (deletes all data):
```bash
cd backend
docker-compose down -v    # Delete volume
docker-compose up -d       # Recreate
npm run migrate            # Create tables
npm run seed               # Populate data
```

## Verification Commands

```bash
# Check all services
ss -tlnp | grep -E ':3000|:4000|:3306'

# Backend health
curl http://localhost:4000/health

# Frontend
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000

# Database
docker exec mariadb mysqladmin ping -h localhost

# Criteria count
curl -s http://localhost:4000/api/v1/criteria | jq '.data | length'
```
