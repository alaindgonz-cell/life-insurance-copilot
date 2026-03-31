# Life Insurance Call Copilot — CLAUDE.md

## Project Overview
Real-time AI copilot for life insurance sales calls. Captures audio from browser, transcribes via Deepgram STT, and uses Claude to surface relevant product information, objection handlers, and compliance prompts in real-time.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js WebSocket server (ws library), REST API via Next.js API routes
- **Database**: PostgreSQL 16 + pgvector extension
- **Cache/Pub-Sub**: Redis 7
- **STT**: Deepgram Nova-2 (streaming)
- **AI**: Claude claude-sonnet-4-6 (claude-sonnet-4-6)
- **Auth**: NextAuth.js

## Repository Structure
```
life-insurance-copilot/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/             # React components
│   │   ├── call/               # Call session components
│   │   ├── copilot/            # AI suggestion components
│   │   └── ui/                 # Shared UI components
│   ├── lib/                    # Shared utilities
│   │   ├── db/                 # Database client & queries
│   │   ├── redis/              # Redis client
│   │   ├── deepgram/           # Deepgram STT client
│   │   └── claude/             # Claude API client
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── server/                 # WebSocket server
├── .planning/                  # GSD planning files
├── prisma/                     # Database schema
├── scripts/                    # Utility scripts
└── docker-compose.yml
```

## Development Commands
- `npm run dev` — Start Next.js dev server (port 3000)
- `npm run ws:dev` — Start WebSocket server (port 3001)
- `npm run dev:all` — Start both servers concurrently
- `npm run db:migrate` — Run Prisma migrations
- `npm run db:seed` — Seed the database
- `npm run test` — Run tests with Jest
- `npm run lint` — Run ESLint

## Environment Variables
See `.env.example` for all required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `DEEPGRAM_API_KEY` — Deepgram API key
- `ANTHROPIC_API_KEY` — Anthropic/Claude API key
- `NEXTAUTH_SECRET` — NextAuth secret
- `NEXTAUTH_URL` — App URL

## Architecture Decisions
- WebSocket server runs separately from Next.js for real-time audio streaming
- Deepgram streaming connection is maintained per active call session
- Redis pub/sub bridges WebSocket server and Next.js API
- pgvector stores product embeddings for semantic search during calls
- Each call session has a UUID, linked to agent and prospect records

## Code Conventions
- Use TypeScript strict mode
- Async/await over callbacks
- Zod for runtime validation
- Named exports preferred
- Component files: PascalCase, utility files: camelCase
