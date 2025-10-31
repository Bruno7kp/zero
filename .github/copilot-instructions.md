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

## GitHub Copilot / AI Agent Instructions — ZeroCharts (concise)

Purpose: help AI contributors be productive quickly by listing the repo's architecture, local workflows, and project-specific conventions.

- Monorepo: `backend/` (Laravel 12, PHP 8.2+), `frontend/` (React 19 + Vite + TypeScript), `docker/` and top-level compose files. Key entrypoints: `backend/routes/api.php`, `frontend/src/main.tsx`.

- Local dev quick commands (preferred):
   - Start services: `docker compose up -d --build` (dev compose: `docker-compose.yml`).
   - Backend tests (local): `docker compose exec app php artisan test` or locally `cd backend && php artisan test`.
   - Frontend dev: `cd frontend && npm ci && npm run dev` (port 5173). Backend API: http://localhost:8081/api. Nginx proxy: http://localhost:8088.

- Where to look first:
   - API routes and controllers: `backend/routes/api.php`, `backend/app/Http/Controllers/`.
   - Domain models: `backend/app/Models/` (e.g. `Chart.php`, `User.php`).
   - Frontend pages: `frontend/src/pages/` (stats pages like `DebutsAtOneByArtistStats.tsx` show patterns for hooks, Mantine UI, and Spotify image usage).
   - Frontend data layer: `frontend/src/db/` (Dexie migrations), `frontend/src/store/` (Redux slices), `frontend/src/services/` (API wrappers like `SpotifyApi`).

- Project-specific conventions (do not invent alternatives):
   - Frontend: TypeScript-only; hooks + functional components; Mantine for UI; Redux Toolkit for global state. Follow existing slice patterns in `src/store/` and Dexie versioning in `src/db/` when changing schema.
   - Backend: follow Laravel conventions (routes → controllers → models). Use dependency injection and keep logic out of controllers when possible.
   - IndexedDB: any schema change must increment the Dexie DB version and include migration transforms under `frontend/src/db/`.

   - Code comments and inline documentation: write comments in English. UI strings and translations must continue to use the `frontend/src/locales/*` files (en/pt). This helps cross-team readability and tooling that processes comments or generates docs.

- Integration points & important env vars:
   - Google OAuth: backend `.env` keys `GOOGLE_CLIENT_ID`/`SECRET` and callback URL.
   - Frontend: `VITE_API_BASE_URL` (default `http://localhost:8081/api`) and `VITE_GOOGLE_CLIENT_ID`.
   - Spotify helpers reference credentials in `frontend/src/services/SpotifyApi` (`SPOTIFY_TOKEN`, `SPOTIFY_SECRET`).

- Small contract for common changes:
   - Add API endpoint: edit `backend/routes/api.php` → new controller in `backend/app/Http/Controllers/` → add tests in `backend/tests/Feature/` → run `php artisan test`.
   - Add frontend page: add component in `frontend/src/pages/` → register route in router (check `main.tsx`) → add translations in `frontend/src/locales/` → follow Mantine patterns used by other pages.

- Tests & CI: backend tests run with SQLite in CI; frontend CI runs lint + build (build includes type-check). Run tests locally before opening PRs.

- Edge cases for AI code changes:
   - Don't change Dexie schema without a migration and version bump — this will break clients.
   - Keep API route shapes stable for the frontend; if changing response shapes, update frontend services and add an adapter where needed.
   - When touching authentication/session behavior, prefer small, reversible changes and add tests.

If anything here is unclear or you want deeper examples (controller + test, Dexie migration example, or an example PR), tell me which area to expand and I'll add a focused snippet and test.

### Dexie migrations, traduções e armazenamento (importante)

- Migração Dexie (IndexedDB): sempre que alterar o schema em `frontend/src/db/` incremente a versão do banco e adicione um bloco de migração. Exemplo padrão:
   1. Atualize a inicialização do DB: `db.version(X).stores({...})` onde X é um inteiro maior.
   2. Use `db.version(X).upgrade(async tx => { /* transformar dados existentes */ })` para mover/transformar registros.
   3. Teste localmente abrindo o devtools -> Application -> IndexedDB para validar que os dados migraram.

- Traduções (`frontend/src/locales/en.json` e `frontend/src/locales/pt.json`):
   - Sempre crie chaves correspondentes nas duas línguas ao adicionar textos novos. Exemplo:
      - em `en.json`: "stats.newFeature.title": "My new stat"
      - em `pt.json`: "stats.newFeature.title": "Minha nova estatística"
   - Procure por padrões nos arquivos existentes (namespaces como `stats.`) e reutilize chaves quando fizer sentido.
   - Atualize componentes usando `t('stats.newFeature.title')` (veja `frontend/src/pages/` para exemplos como `DebutsAtOneByArtistStats.tsx`).

- Onde os dados ficam armazenados:
   - IndexedDB (via Dexie): principal armazenamento para dados de charts, stats e semanas. Código em `frontend/src/db/` (tabelas principais como `charts_data`, `charts_stats`, `chart_weeks`).
   - localStorage: usado para preferências leves (ver `frontend/src/hooks/useStatsPreferences`) e chaves de UI persistente. Verifique o hook citado para confirmar quais chaves são salvas.
   - Sempre considere a coerência: ao alterar formato de dados em IndexedDB, forneça transformação na migração para evitar divergência com o estado em localStorage.

   - Uso centralizado do localStorage (IMPORTANTE):
      - Não adicione chamadas diretas a `localStorage` em novos arquivos. Este repositório possui uma camada de abstração e um registro canônico de chaves para evitar chaves duplicadas e problemas de formato.
      - Arquivos importantes:
         - `frontend/src/utils/storage.ts` — helper central para leitura/gravação segura (JSON, fallback, remoção).
         - `frontend/src/constants/storageKeys.ts` — registro único de chaves usadas no app (versões e mapeamento de chaves legadas).
      - Como adicionar uma nova chave persistida (passos mínimos):
         1. Adicione uma entrada em `storageKeys.ts` com nome claro e versão (ex.: `MY_FEATURE_PREFERENCES: 'zc.myFeature:v1'`).
         2. No código, importe o helper e o key: `import storage from 'src/utils/storage'; import { MY_FEATURE_PREFERENCES } from 'src/constants/storageKeys';` e use `storage.getJson(MY_FEATURE_PREFERENCES)` / `storage.setJson(MY_FEATURE_PREFERENCES, value)`.
         3. Se estiver migrando uma chave antiga, adicione o mapeamento em `LEGACY_KEYS` dentro de `storageKeys.ts` e trate a migração no helper ou num bloco de startup apropriado.
         4. Adicione um teste/unitário simples (ou verifica manualmente) que confirma leitura/escrita e formato esperado.
      - Motivo: centralizar evita colisões de nomes, facilita mudanças de formato (versão) e mantém compatibilidade com migrações do cliente.

Esses pontos são críticos — alterar o schema do Dexie sem migração ou esquecer de adicionar chaves de tradução causa regressões facilmente.

   ### Recent frontend changes (Oct 2025)

   - Renomeação de preferência: `tableSize` foi renomeado para `fontSize` — atualize traduções e consumidores quando tocar na UI relacionada a tabelas/grades.
   - Nova preferência `containerSize`: opções suportadas `md`, `lg`, `xl`, `100%` (padrão: `xl`). A opção de "container size" foi escondida na UI para dispositivos móveis e o layout é forçado para `100%` em mobile.
   - Persistência consolidada: várias preferências de UI (incluindo `statsPreferences`, `libraryFilters`, e as preferências de listas de semanas) foram migradas para Redux Toolkit + `redux-persist`. O código **não** depende mais de leituras ad-hoc de `localStorage` para essas preferências — prefira os slices e selectors em `frontend/src/store/`.
   - Colunas/visualização: a persistência das configurações de colunas foi centralizada no slice `columns` — componentes não escrevem mais diretamente em `localStorage`.
   - Formatação e ferramentas: adicionamos `.editorconfig`, uma configuração do Prettier em `frontend/.prettierrc` e um script `format` no `frontend/package.json` para padronizar o estilo. No backend há um script `composer format` que executa o Pint.

   Nota rápida para agents: se você estiver escrevendo código que acessa preferências persistidas, leia/reutilize os slices existentes (ex.: `statsPreferences`, `columns`) e evite adicionar leituras diretas a `localStorage`. Para dados grandes/historicamente persistidos (charts, semanas) continue usando IndexedDB/Dexie e siga o fluxo de migração descrito acima.

   ### Commit messages — Gitflow + Conventional Commits

   Estamos usando o modelo de branches Gitflow na equipe. Para manter histórico consistente e facilitar leitura/automação, peça ao gerador de mensagens de commit (ou escreva manualmente) para seguir um formato baseado em Conventional Commits combinado com o prefixo do branch.

   Regras rápidas:
   - Cabeçalho: `<type>(<scope>): <short summary>` — mantenha <= 72 caracteres.
   - `type` sugerido (mapa de branch → type):
      - `feature/*` → `feat`
      - `hotfix/*` ou `bugfix/*` → `fix`
      - `release/*` → `chore` (ou `release` quando aplicável)
      - `docs/*` → `docs`
      - `refactor/*` → `refactor`
      - `test/*` → `test`
      - `ci/*` → `ci`
      - `build/*` → `build`
      - `style/*` → `style`

   Exemplos:
   - feat(stats): persist sidebar collapsed state  (branch: `feature/stats-persist-collapsed`)
   - fix(api): return 404 when chart not found           (branch: `hotfix/api-chart-404`)
   - chore(release): bump backend to 1.2.0               (branch: `release/1.2.0`)

   Corpo (opcional): detalhe o que foi feito e por quê. Use bullets quando útil.

   Footer (opcional): referências a issues/tickets. Ex.: `Refs: ISSUE_ID` ou `Closes: ISSUE_ID`.

   Diretivas para geradores/AI:
   - Gere a mensagem em português ou inglês conforme o idioma do PR, mas mantenha o cabeçalho curto e em inglês quando possível (padrão do repo é inglês nas chaves).
   - Inclua o escopo quando claro (`stats`, `charts`, `api`, `frontend`, `backend`).
   - Use o tipo que corresponde ao branch atual — o gerador deve inspecionar o nome do branch e mapear para o `type` correto.
   - Garanta o imperativo no resumo (por ex. "persist" em vez de "persisted"/"persisting").

   Se quiser, posso adicionar um gancho de `commit-msg` (husky + commitlint) e um `commitizen` adapter para forçar esse padrão automaticamente — diga se quer que eu coloque isso no repositório.
