#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Starting ZeroCharts Laravel backend (env: ${APP_ENV:-unknown})"
if [ ! -d vendor/laravel ]; then
  echo "[entrypoint][FATAL] vendor directory incomplete (vendor/laravel missing). Aborting." >&2
fi

if [ ! -f .env.production ]; then
  if [ -f .env.production.example ]; then
    echo "[entrypoint] .env.production missing – seeding from example (REMINDER: fill secrets!)."
    cp .env.production.example .env.production
  else
    echo "[entrypoint][WARN] Neither .env.production nor example present." >&2
  fi
fi

cd /var/www/html

# Ensure .env exists or differs in critical keys; sync from .env.production if needed
if [ -f .env.production ]; then
  if [ ! -f .env ]; then
    echo "[entrypoint] .env missing – copying from .env.production"
    cp .env.production .env
  else
    # Compare critical keys (GOOGLE_CALLBACK_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_KEY, DB_CONNECTION)
    PROD_CB=$(grep '^GOOGLE_CALLBACK_URL=' .env.production | cut -d '=' -f2- || true)
    CURR_CB=$(grep '^GOOGLE_CALLBACK_URL=' .env | cut -d '=' -f2- || true)
    PROD_CID=$(grep '^GOOGLE_CLIENT_ID=' .env.production | cut -d '=' -f2- || true)
    CURR_CID=$(grep '^GOOGLE_CLIENT_ID=' .env | cut -d '=' -f2- || true)
    PROD_CSEC=$(grep '^GOOGLE_CLIENT_SECRET=' .env.production | cut -d '=' -f2- || true)
    CURR_CSEC=$(grep '^GOOGLE_CLIENT_SECRET=' .env | cut -d '=' -f2- || true)
    PROD_DB=$(grep '^DB_CONNECTION=' .env.production | cut -d '=' -f2- || true)
    CURR_DB=$(grep '^DB_CONNECTION=' .env | cut -d '=' -f2- || true)
    PROD_KEY=$(grep '^APP_KEY=' .env.production | cut -d '=' -f2- || true)
    CURR_KEY=$(grep '^APP_KEY=' .env | cut -d '=' -f2- || true)
    if [ "$PROD_CB" != "$CURR_CB" ] || [ "$PROD_CID" != "$CURR_CID" ] || [ "$PROD_CSEC" != "$CURR_CSEC" ] || [ -n "$PROD_KEY" -a "$PROD_KEY" != "$CURR_KEY" ] || [ "$PROD_DB" != "$CURR_DB" ]; then
      echo "[entrypoint] Detected drift in critical env keys – syncing .env from .env.production"
      cp .env.production .env
    fi
  fi
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
      chmod 660 "$DB_FILE" || true
      chmod 770 "$(dirname "$DB_FILE")" || true
    else
      # File exists – ensure ownership and write permission
      if [ ! -w "$DB_FILE" ]; then
        echo "[entrypoint] Fixing sqlite database file permissions (was not writable)"
        chown www-data:www-data "$DB_FILE" 2>/dev/null || true
        chmod 660 "$DB_FILE" 2>/dev/null || true
      fi
      DB_DIR="$(dirname "$DB_FILE")"
      if [ ! -w "$DB_DIR" ]; then
        echo "[entrypoint] Fixing sqlite database directory permissions (was not writable)"
        chown www-data:www-data "$DB_DIR" 2>/dev/null || true
        chmod 770 "$DB_DIR" 2>/dev/null || true
      fi
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

echo "[entrypoint] Laravel version: $(php artisan --version 2>/dev/null || echo 'unknown')"
echo "[entrypoint] Google callback (post-env sync): $(grep '^GOOGLE_CALLBACK_URL=' .env | cut -d '=' -f2-)"

# Quick sanity: ensure sqlite (if used) is writable by php-fpm
if grep -q '^DB_CONNECTION=sqlite' .env 2>/dev/null; then
  DB_FILE_LINE=$(grep '^DB_DATABASE=' .env || true)
  DB_FILE=${DB_FILE_LINE#DB_DATABASE=}
  if [ -f "$DB_FILE" ]; then
    if [ ! -w "$DB_FILE" ]; then
      echo "[entrypoint][WARN] SQLite file not writable at runtime; attempting permission repair (phase2)"
      chown www-data:www-data "$DB_FILE" 2>/dev/null || true
      chmod 660 "$DB_FILE" 2>/dev/null || true
    fi
  fi
fi

# Run migrations (optional toggle)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running migrations..."
  php artisan migrate --force || echo "[entrypoint] WARN: migrations failed"
fi

# Ensure personal access tokens table exists (if using Sanctum)
php artisan tinker --execute="if(!Schema::hasTable('personal_access_tokens')){echo '[[entrypoint]] tokens table missing – running migrate again';}" >/dev/null 2>&1 || true

# Cache config/routes/views (can be skipped with CACHE_OPTIMIZE=false)
if [ "${CACHE_OPTIMIZE:-true}" = "true" ]; then
  echo "[entrypoint] Optimizing framework caches..."
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
fi

echo "[entrypoint] Ready: launching php-fpm (GOOGLE_CALLBACK_URL=$(grep '^GOOGLE_CALLBACK_URL=' .env | cut -d '=' -f2-))"
exec "$@"
