#!/usr/bin/env bash
set -e

# Configuration
DB_CONTAINER="red_tetris_postgres"
DB_USER="tetris"
DB_PASS="tetris123"
DB_NAME="red_tetris"
DB_PORT="5432"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SQL="$SCRIPT_DIR/backend/sql/init.sql"

echo "=============================================="
echo " Starting Red Tetris Stack"
echo "=============================================="

# 1. Start PostgreSQL Docker container if not running
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker is not installed or not running. Continuing with in-memory storage."
else
  if [ "$(docker ps -q -f name=$DB_CONTAINER)" ]; then
    echo "✅ PostgreSQL container is already running."
  else
    if [ "$(docker ps -aq -f status=exited -f name=$DB_CONTAINER)" ]; then
      echo "🔄 Starting existing stopped PostgreSQL container..."
      docker start $DB_CONTAINER > /dev/null
    else
      echo "🐘 Pulling and starting PostgreSQL container..."
      docker run -d \
        --name $DB_CONTAINER \
        -e POSTGRES_USER=$DB_USER \
        -e POSTGRES_PASSWORD=$DB_PASS \
        -e POSTGRES_DB=$DB_NAME \
        -p $DB_PORT:5432 \
        -v "$INIT_SQL":/docker-entrypoint-initdb.d/init.sql:ro \
        postgres:16-alpine > /dev/null
    fi

    echo "⏳ Waiting for PostgreSQL to be ready..."
    until docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; do
      sleep 1
    done
    echo "✅ PostgreSQL is ready on port $DB_PORT."
  fi
fi

# 2. Build Frontend
echo "📦 Building Frontend (Vite production build)..."
cd "$SCRIPT_DIR/frontend"
npm install
npm run build
cd "$SCRIPT_DIR"

# 3. Start Backend (which serves API + Socket.io + Frontend static files)
echo "🚀 Starting Red Tetris Backend on port 8000..."
export POSTGRES_USER="$DB_USER"
export POSTGRES_PASSWORD="$DB_PASS"
export POSTGRES_DB="$DB_NAME"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="$DB_PORT"
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:$DB_PORT/$DB_NAME"

cd "$SCRIPT_DIR/backend"
npm install
exec npm run start
