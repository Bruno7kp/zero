#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Starting ZeroCharts Laravel backend (env: ${APP_ENV:-unknown})"

cd /var/www/html

# If no APP_KEY in environment (.env), try to generate (first container start)
if grep -q "^APP_KEY=\s*$" .env 2>/dev/null || [ -z "${APP_KEY:-}" ]; then
  if ! grep -q "^APP_KEY=" .env 2>/dev/null || [ -z "${APP_KEY:-}" ]; then
    echo "[entrypoint] Generating APP_KEY..."
    php artisan key:generate --force --no-interaction || echo "[entrypoint] WARN: key generation failed"
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
