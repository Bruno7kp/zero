# GitHub Copilot Instructions for ZeroCharts

## Project Overview

ZeroCharts is a full-stack web application for creating and tracking personalized weekly music charts from Last.fm data. It's a monorepo containing:

- **Backend**: Laravel 12 (PHP 8.2+) REST API with Google OAuth authentication
- **Frontend**: React 19 + Vite + TypeScript SPA with Mantine UI
- **Database**: MySQL 8.0 (development), SQLite (testing)
- **Cache**: IndexedDB (via Dexie) for offline data persistence
- **Deployment**: Docker containers with nginx, PHP-FPM, and CI/CD via GitHub Actions

## Architecture

### Monorepo Structure
```
/backend          - Laravel API (PHP 8.2+)
/frontend         - React SPA (TypeScript)
/docker           - Docker configurations
/.github          - GitHub workflows and configurations
```

### Technology Stack

**Backend**:
- Laravel 12 framework
- PHP 8.2+
- Sanctum for API authentication
- Socialite for Google OAuth
- MySQL 8.0 (production/dev) or SQLite (testing)
- PHPUnit for testing
- Laravel Pint for code formatting

**Frontend**:
- React 19 with TypeScript
- Vite build tool
- Mantine UI components
- Redux Toolkit for state management
- Dexie for IndexedDB abstraction
- i18next for internationalization (en/pt)
- ESLint for linting

**DevOps**:
- Docker & Docker Compose for local development
- GitHub Actions for CI/CD
- GitHub Container Registry (ghcr.io) for Docker images

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 22+ (if running frontend outside Docker)
- PHP 8.2+ and Composer (if running backend outside Docker)

### Quick Start

1. **Copy environment files**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Generate Laravel APP_KEY**:
   ```bash
   docker compose run --rm app php artisan key:generate
   ```

3. **Start services**:
   ```bash
   docker compose up -d --build
   ```

4. **Run migrations**:
   ```bash
   docker compose exec app php artisan migrate --force
   ```

5. **Access the application**:
   - Backend API: http://localhost:8081/api
   - Frontend dev: http://localhost:5173
   - Nginx proxy: http://localhost:8088

### Environment Variables

**Backend** (`backend/.env`):
- `APP_URL`: Should include port 8081 in dev (e.g., http://localhost:8081)
- `DB_CONNECTION=mysql`, `DB_HOST=db`, `DB_DATABASE=zerocharts_db`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `QUEUE_CONNECTION=database`
- `SESSION_DRIVER=database`

**Frontend** (`frontend/.env`):
- `VITE_API_BASE_URL=http://localhost:8081/api`
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

## Coding Standards

### Backend (Laravel/PHP)

- Follow Laravel conventions and PSR-12 standards
- Use Laravel Pint for code formatting (future: enable in CI)
- Controllers in `app/Http/Controllers`
- Models in `app/Models`
- API routes in `routes/api.php`
- Migrations in `database/migrations`
- Tests in `tests/` (PHPUnit)
- Use type hints and return types
- Use dependency injection via constructor

### Frontend (React/TypeScript)

- Use TypeScript for all new code
- Follow React hooks patterns (functional components)
- Components in `src/components/`
- Pages in `src/pages/`
- Redux slices in `src/store/`
- Database logic in `src/db/` (Dexie)
- Utilities in `src/utils/`
- Hooks in `src/hooks/`
- Translations in `src/locales/`

**TypeScript Rules**:
- `@typescript-eslint/no-explicit-any`: Currently disabled (temporary)
- Unused vars ignored if prefixed with `_`
- `prefer-const`: warning (not error)

**React Patterns**:
- Use functional components with hooks
- Use Redux Toolkit for global state
- Use Mantine components for UI
- Use i18next for translations

### File Organization

- Keep business logic separate from UI components
- Use service/helper functions for reusable code
- Database migrations should be idempotent
- Always increment Dexie version when changing schema

## Building and Testing

### Backend

**Install dependencies**:
```bash
cd backend
composer install
```

**Run tests**:
```bash
cd backend
php artisan test
# Or with Docker:
docker compose exec app php artisan test
```

**Lint (when enabled)**:
```bash
cd backend
./vendor/bin/pint
```

**Key artisan commands**:
- `php artisan migrate` - Run migrations
- `php artisan tinker` - Laravel REPL
- `php artisan config:cache` - Cache configuration
- `php artisan route:cache` - Cache routes
- `php artisan queue:work` - Process queue jobs

### Frontend

**Install dependencies**:
```bash
cd frontend
npm ci
```

**Development server**:
```bash
cd frontend
npm run dev
```

**Build for production**:
```bash
cd frontend
npm run build
```

**Lint**:
```bash
cd frontend
npm run lint
```

**Type checking** (done during build):
```bash
cd frontend
npm run build
```

## CI/CD Pipeline

### Workflow (`.github/workflows/ci.yml`)

Triggers on push to `main` and `refactor` branches, and on pull requests to `main`.

**Jobs**:
1. **backend-tests**: Runs PHP tests with SQLite
2. **frontend-build**: Runs lint and build
3. **docker-images**: Builds and pushes Docker images to ghcr.io

### Branch Strategy

- `main`: Production branch - stable, approved code only
  - Generates Docker tags: `:main`, `:sha-<short>`, `:latest`
- `refactor`: Staging/integration branch
  - Generates Docker tags: `:refactor`, `:sha-<short>`
- Feature branches: Create PRs to `refactor` for staging, then to `main` for production

### Docker Images

Two images are built:
- `ghcr.io/bruno7kp/zero-backend`: PHP-FPM backend
- `ghcr.io/bruno7kp/zero-web`: Nginx + built frontend SPA

## API Structure

### Key Endpoints

- `/api/auth/google` - OAuth login
- `/api/auth/google/callback` - OAuth callback
- `/api/health` - Health check endpoint
- All API routes defined in `backend/routes/api.php`

### Authentication

- Uses Laravel Sanctum for API token authentication
- Google OAuth via Laravel Socialite
- Sessions stored in database

## Database

### Backend (Laravel)

- MySQL 8.0 in production/development
- SQLite for testing
- Migrations in `database/migrations`
- Seeders in `database/seeders`

### Frontend (IndexedDB)

- Dexie wrapper for IndexedDB
- Stores chart data, stats, and week status
- Tables: `charts_data`, `charts_stats`, `chart_weeks`
- Week status: `complete` or `partial`
- Schema migrations handled via Dexie version upgrades

## Key Features

### Charts System

- Weekly chart synchronization with Last.fm
- Track, album, and artist charts
- Delta calculations (rank and plays changes)
- NEW/RE (re-entry) detection
- Peak tracking and consecutive week counts
- Configurable certification system (Gold/Platinum/Diamond)

### Offline Support

- IndexedDB caching for offline access
- Partial/complete week tracking
- Local statistics calculation
- Sync status indicators

### Internationalization

- English (en) and Portuguese (pt) supported
- i18next for translations
- Language detection from browser
- Translation files in `frontend/src/locales/`

## Common Tasks

### Adding a New API Endpoint

1. Add route in `backend/routes/api.php`
2. Create controller method in `backend/app/Http/Controllers`
3. Add request validation if needed
4. Update tests in `backend/tests/`

### Adding a New Frontend Page

1. Create page component in `frontend/src/pages/`
2. Add route in main router configuration
3. Add translations in `frontend/src/locales/en.json` and `pt.json`
4. Import and use Mantine components for UI

### Database Changes

**Backend**:
1. Create migration: `php artisan make:migration <name>`
2. Write up/down methods
3. Run migration: `php artisan migrate`

**Frontend (IndexedDB)**:
1. Update `frontend/src/db/` schema
2. Increment Dexie version
3. Add migration transformation if needed

## Deployment

### Production Checklist

**Backend**:
- Set `APP_ENV=production`
- Set `APP_DEBUG=false`
- Configure `APP_URL` to production domain
- Generate `APP_KEY` if new instance
- Run `php artisan migrate --force`
- Cache config: `php artisan config:cache route:cache view:cache`
- Setup queue worker: `php artisan queue:work --tries=1`

**Frontend**:
- Set `VITE_API_BASE_URL` to production API URL (or `/api` if same domain)
- Build: `npm run build`
- Serve `dist/` via nginx or CDN

### Docker Compose

Production: `docker-compose.prod.yml`
Development: `docker-compose.yml`

## Security

- Never commit `.env` files or secrets
- Google OAuth credentials must be configured in Google Console
- Callback URL must match `GOOGLE_CALLBACK_URL` in backend `.env`
- Use HTTPS in production
- Keep dependencies updated

## Contributing

- Follow existing code style and conventions
- Run linters before committing
- Write tests for new features
- Update documentation if needed
- Create PRs to `refactor` branch first for staging

## Troubleshooting

### Docker Issues

- If containers don't start: `docker compose down -v && docker compose up -d --build`
- Check logs: `docker compose logs -f <service>`
- Rebuild specific service: `docker compose up -d --build <service>`

### Backend Issues

- Clear cache: `php artisan cache:clear config:clear route:clear view:clear`
- Reset database: `php artisan migrate:fresh`
- Check logs: `storage/logs/laravel.log`

### Frontend Issues

- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Clear browser cache and IndexedDB
- Check browser console for errors

## Additional Notes

- The project uses port 8081 for backend API in development
- Nginx proxy on port 8088 serves both backend and frontend in Docker setup
- Frontend Vite dev server runs on port 5173
- Database password and other secrets should be configured in `.env` files
- CI runs on both `main` and `refactor` branches
- Use `--no-pager` with git commands to avoid hanging in scripts
