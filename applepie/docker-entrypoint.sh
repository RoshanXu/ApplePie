#!/bin/sh
set -e

echo "=========================================="
echo "  ApplePie — Docker Container Startup"
echo "=========================================="

# Wait for PostgreSQL to be ready
echo ""
echo "[1/3] Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U "${DB_USER:-postgres}" -d "${DB_NAME:-applepie}" -q; do
  echo "  waiting..."
  sleep 2
done
echo "  PostgreSQL is ready."

# Sync database schema
echo ""
echo "[2/3] Syncing database schema..."
npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss
echo "  Schema sync complete."

# Start Next.js server
echo ""
echo "[3/3] Starting Next.js server on port 3000..."
echo "=========================================="
exec node server.js
