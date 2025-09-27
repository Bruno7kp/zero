#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Starting ZeroCharts Laravel backend (env: ${APP_ENV:-unknown})"

cd /var/www/html

# Ensure .env exists (in case only .env.production was mounted/copied elsewhere)
if [ ! -f .env ] && [ -f .env.production ]; then
  echo "[entrypoint] .env missing – copying from .env.production"
  cp .env.production .env
fi

# If using sqlite, ensure database file exists
if grep -q '^DB_CONNECTION=sqlite' .env 2>/dev/null; then
  DB_FILE_LINE=$(grep '^DB_DATABASE=' .env || true)
  DB_FILE=${DB_FILE_LINE#DB_DATABASE=}
  if [ -n "$DB_FILE" ]; then
    if [ ! -f "$DB_FILE" ]; then
      echo "[entrypoint] Creating sqlite database file at $DB_FILE"
      mkdir -p "$(dirname "$DB_FILE")"
      touch "$DB_FILE"
      chown www-data:www-data "$DB_FILE" || true
    fi
  fi
fi

# Generate APP_KEY if empty in file and not provided via env
if [ -f .env ]; then
  ENV_APP_KEY=$(grep '^APP_KEY=' .env | cut -d '=' -f2-)
  if [ -z "$ENV_APP_KEY" ]; then
    echo "[entrypoint] Generating APP_KEY..."
    php artisan key:generate --force --no-interaction || echo "[entrypoint] WARN: key generation failed"
    NEW_KEY=$(grep '^APP_KEY=' .env | cut -d '=' -f2- || true)
    if [ -n "$NEW_KEY" ]; then
      echo "[entrypoint] Generated APP_KEY=$NEW_KEY (copy this into backend/.env.production for persistence)"
    fi
  fi
fi

# Run migrations (optional toggle)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running migrations..."
  php artisan migrate --force || echo "[entrypoint] WARN: migrations failed"
fi

# Cache config/routes/views (can be skipped with CACHE_OPTIMIZE=false)
if [ "${CACHE_OPTIMIZE:-true}" = "true" ]; then
  echo "[entrypoint] Optimizing framework caches..."
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
fi

echo "[entrypoint] Ready: launching php-fpm"
exec "$@"
