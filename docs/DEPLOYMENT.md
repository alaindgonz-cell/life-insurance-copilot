# Deployment Guide

## Prerequisites
- Docker and Docker Compose
- PostgreSQL 16 with pgvector extension
- Redis 7
- Node.js 20+

## Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` — PostgreSQL connection string (must have pgvector installed)
- `REDIS_URL` — Redis connection string
- `DEEPGRAM_API_KEY` — From deepgram.com/console
- `ANTHROPIC_API_KEY` — From console.anthropic.com
- `NEXTAUTH_SECRET` — Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` — Production URL (e.g., https://your-domain.com)
- `WS_PORT` — WebSocket server port (default: 3001)

## Local Development

```bash
# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Generate embeddings (requires ANTHROPIC_API_KEY)
npm run db:embed

# Start both servers
npm run dev:all
```

## Production Deployment

### Using Docker Compose
```bash
# Build images
docker build -t app .
docker build -f Dockerfile.ws -t app-ws .

# Run migrations before starting
DATABASE_URL=... npx prisma migrate deploy

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Database Migrations
Always run migrations before deploying new code:
```bash
npx prisma migrate deploy
```

## Health Checks
- App: `GET /api/health` — checks DB and Redis connectivity
- WebSocket: `GET /health` on the WS server port (if implemented)
