#!/usr/bin/env bash
set -euo pipefail

# Colors
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red() { printf "\033[31m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }

# Check dependencies
command -v docker >/dev/null 2>&1 || { red "Docker is required"; exit 1; }

# Load env
ENV_FILE=".env.migration"
if [ ! -f "$ENV_FILE" ]; then
  yellow "Creating $ENV_FILE from migration/env-template.txt"
  cp migration/env-template.txt "$ENV_FILE"
  red "Please fill $ENV_FILE (Firebase + Mongo creds) and re-run"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

# Validate required envs
REQUIRED_VARS=(FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY MONGODB_URI)
for v in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!v:-}" ]; then
    red "Missing env var: $v"
    MISSING=1
  fi
done
if [ "${MISSING:-0}" = 1 ]; then
  exit 1
fi

# Start a throwaway Mongo if URI points to localhost and port 27017 is free
if [[ "$MONGODB_URI" == *"mongodb://localhost:27017"* ]] || [[ "$MONGODB_URI" == *"mongodb://127.0.0.1:27017"* ]]; then
  if ! nc -z 127.0.0.1 27017 >/dev/null 2>&1; then
    yellow "Starting temporary MongoDB container..."
    docker run -d --rm --name mongo-migration -p 27017:27017 mongo:6 >/dev/null
    TEMP_MONGO=1
    # wait for mongo up
    sleep 5
  else
    yellow "Using existing local MongoDB on 27017"
  fi
fi

# Prepare Mongo URI for container networking
DOCKER_MONGO_URI="$MONGODB_URI"
if [[ "$MONGODB_URI" == *"mongodb://localhost:"* ]] || [[ "$MONGODB_URI" == *"mongodb://127.0.0.1:"* ]]; then
  # Replace localhost/127.0.0.1 with host.docker.internal so the container can reach host-mapped port
  DOCKER_MONGO_URI=$(echo "$MONGODB_URI" | sed -E 's#mongodb://(localhost|127\.0\.0\.1)#mongodb://host.docker.internal#g')
  yellow "Rewriting Mongo URI for Docker: $DOCKER_MONGO_URI"
fi

# Run migration inside a Node container to avoid local setup
yellow "Running migration in Docker..."
docker run --rm \
  -v "$(pwd)":/app \
  -w /app \
  -e FIREBASE_PROJECT_ID \
  -e FIREBASE_CLIENT_EMAIL \
  -e FIREBASE_PRIVATE_KEY \
  -e MONGODB_URI="$DOCKER_MONGO_URI" \
  node:20-alpine sh -lc "npm i mongodb firebase-admin --no-save && node migration/firestore-to-mongodb.js"

STATUS=$?

# Cleanup temp mongo
if [ "${TEMP_MONGO:-0}" = 1 ]; then
  yellow "Stopping temporary MongoDB container..."
  docker stop mongo-migration >/dev/null || true
fi

if [ $STATUS -eq 0 ]; then
  green "Migration completed successfully. See migration-mappings.json for ID mappings."
else
  red "Migration failed. Check logs above."
fi
