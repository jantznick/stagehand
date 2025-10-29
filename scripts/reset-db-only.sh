#!/bin/bash
#
# This script resets ONLY the Dockerized database. It is intended for local
# development where services are run on the host machine and only the
# database runs in Docker.

# Exit immediately if a command exits with a non-zero status.
set -e

# Change to the script's directory to ensure paths are correct
cd "$(dirname "$0")/.."

echo "---"
echo "STEP 1: Stopping and purging the database container and volume..."

# Stop the database service if it's running
docker-compose stop database || echo "Database container not running, continuing."

# Remove the stopped container
docker-compose rm -f database

# Forcefully remove the named volume to wipe all data
# The || true prevents the script from exiting if the volume doesn't exist yet
docker volume rm stagehand_stagehand-db-data || echo "Database volume 'stagehand_stagehand-db-data' not found, continuing."

echo "Database container and volume wiped."
echo "---"

echo "STEP 3: Starting a fresh database container..."
docker-compose up -d database
echo "Database container is starting in the background..."
echo "Waiting 10 seconds for the database to initialize..."
sleep 10
echo "Database should now be ready."
echo "---"

echo "STEP 4: Deleting old migrations to ensure a clean slate..."
rm -rf packages/api/prisma/migrations
echo "Old migrations deleted."
echo "---"

echo "STEP 4: Running database migration from your local Node.js environment..."
if [ ! -f .env ]; then
    echo "ERROR: .env file not found in the root directory."
    echo "Please create one from .env.example and ensure DATABASE_URL is set for localhost."
    exit 1
fi
# This command assumes your .env file's DATABASE_URL points to localhost:5432
set -o allexport; source .env; set +o allexport && npm exec --workspace=api -- prisma migrate dev
echo "New migration created and applied."
echo "---"

echo "STEP 6: Regenerating Prisma Client to ensure it's up to date..."
set -o allexport; source .env; set +o allexport && npm exec --workspace=api -- prisma generate
echo "Prisma client regenerated."
echo "---"

echo "STEP 7: Seeding the database from your local Node.js environment..."
set -o allexport; source .env; set +o allexport && npm exec --workspace=api -- node prisma/seed.js
echo "---"
echo "✅ Database has been successfully reset and seeded for local development!"
echo "You can now start your local API and web servers."
echo "---"
