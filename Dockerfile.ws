# Dockerfile for WebSocket server
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./

FROM base AS deps
RUN npm ci --only=production

FROM base AS build-deps
RUN npm ci

FROM build-deps AS builder
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate
RUN npx tsc --project tsconfig.server.json

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
CMD ["node", "dist/server/index.js"]
