# ============================================================
# ApplePie Docker Image — Multi-stage build
# ============================================================
# Build:  docker build -t applepie-app .
# Export: docker save -o applepie-images.tar applepie-app postgres:16-alpine
# ============================================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone mode — outputs to .next/standalone/)
RUN pnpm build

# ---- Stage 2: Production Runtime ----
FROM node:22-alpine AS runner

# Runtime dependencies for Prisma engines + health checks
RUN apk add --no-cache openssl postgresql-client

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build output (includes server.js + bundled node_modules)
COPY --from=builder /app/.next/standalone ./

# Copy static files and public assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema for runtime DB push
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./

# Install prisma CLI globally for DB sync at startup
RUN npm install -g prisma@7.8.0

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
