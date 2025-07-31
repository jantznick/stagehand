#!/bin/sh

# Load .env file if it exists, but filter out the DATABASE_URL
if [ -f .env ]; then
  export $(grep -v '^DATABASE_URL=' .env | sed 's/#.*//g' | xargs)
fi

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Installing API dependencies..."
npm install --workspace=api

echo "Running database migrations..."
npx prisma migrate deploy --schema=packages/api/prisma/schema.prisma

echo "Starting API server..."
npm run dev --workspace=api 