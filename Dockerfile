# Multi-stage Dockerfile for Next.js app
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --only=production

FROM base AS build-deps
RUN npm ci

FROM build-deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public 2>/dev/null || true
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
