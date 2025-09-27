# ZeroCharts

Monorepo contendo:
- **backend/** (Laravel API) – autenticação (Google), charts, sincronização
- **frontend/** (Vite + React + Mantine) – interface do usuário, IndexedDB offline/cache
- **docker/** e `docker-compose.yml` – ambiente de desenvolvimento/containerização

## Visão Geral
ZeroCharts permite criar e acompanhar charts semanais personalizados a partir de dados do Last.fm, com:
- Sincronização semanal atômica (artist / album / track)
- Cálculo de estatísticas (peak, sequências, semanas dentro do cutoff)
- Sistema de certificações com fórmula configurável (plays + pontos de estabilidade)
- Detecção de NEW / RE (re-entry) e variações (=, +, -)
- Cache & persistência local (IndexedDB / Dexie) com marcação de semanas completas/parciais
- Interface responsiva em Mantine + i18n (en/pt)

## Stack
| Camada | Tecnologia |
|--------|------------|
| Backend | PHP 8.x, Laravel |
| Frontend | React + Vite + TypeScript |
| UI | Mantine, mantine-datatable |
| DB (dev) | MySQL via Docker (ou SQLite) |
| Cache local | IndexedDB (Dexie) |
| Auth Social | Google OAuth |

## Ambiente de Desenvolvimento (Docker)

1. Copie exemplos de env:
```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
2. Ajuste credenciais (Google, DB password etc.) em `backend/.env`.
3. Gere APP_KEY:
```
docker compose run --rm app php artisan key:generate
```
4. Suba containers:
```
docker compose up -d --build
```
5. Migrações:
```
docker compose exec app php artisan migrate --force
```
6. Acesse:
- API: http://localhost:8081/api
- Frontend (dev): http://localhost:5173

## Variáveis Importantes
Backend (`backend/.env`):
- `APP_URL` deve incluir a porta 8081 em dev
- `DB_CONNECTION=mysql` / `DB_HOST=db` / `DB_DATABASE=zerocharts_db`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL=http://localhost:8081/api`
- `VITE_GOOGLE_CLIENT_ID=...`

## Build / Deploy Produção (Resumo)
 Arquitetura de produção (Opção A) configurada:
 - `docker/backend/Dockerfile.prod` (PHP-FPM + vendor + otimizações)
 - `docker/nginx/Dockerfile.fullstack.prod` (Nginx servindo SPA + proxy FastCGI para Laravel)

 Pipeline ( `.github/workflows/ci.yml` ):
 1. Testes + lint
 2. Build e push imagens: `*-backend` (php-fpm) e `*-web` (nginx + SPA)
 3. Servidor: `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`

Passos manuais mínimos se não usar compose de produção ainda:
1. Criar `.env` backend com `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://seu.dominio`.
2. Definir `VITE_API_BASE_URL=https://seu.dominio/api` em tempo de build (frontend) ou via reverse proxy.
3. Gerar APP_KEY se vazio (entrypoint já tenta gerar se `RUN_MIGRATIONS=true`).
4. Executar migrações (`php artisan migrate --force`).
5. (Opcional) Cache de config/rotas/views (entrypoint já cobre se `CACHE_OPTIMIZE=true`).
6. Configurar fila futura: `php artisan queue:work --tries=1`.

Variáveis do entrypoint backend:
- `RUN_MIGRATIONS=true|false`
- `CACHE_OPTIMIZE=true|false`

 Compose de produção já incluso: `docker-compose.prod.yml` (serviços: backend, web, db).

## Scripts Principais
Frontend `package.json`:
- `npm run dev` – servidor de desenvolvimento Vite
- `npm run build` – build de produção

Backend (via artisan):
- `php artisan migrate`
- `php artisan tinker`
- `php artisan queue:work` (quando filas forem usadas)

## Estrutura de Dados (IndexedDB)
Tabelas principais:
- `charts_data` – entradas semanais
- `charts_stats` – estatísticas agregadas
- `chart_weeks` – status de semana (`complete` | `partial`)

## Lógica de Deltas
- `deltaRank` e `deltaPlays` calculados ao salvar semana
- NEW: primeira aparição (sem histórico anterior no cutoff)
- RE: retorno após gap ou ausência
- '=' mostrado para variação zero (badge cinza)

## Certificações
Fórmula ponderada (plays + pontos de estabilidade). Níveis configuráveis (Gold / Platinum / Diamond) e múltiplos.

## Contribuição
Pull requests são bem-vindos. Antes de abrir:
- Não commitar `.env` ou segredos.
- Manter estilo de código consistente (ESLint / TS + Laravel padrões).

## Licença
Projeto sob licença MIT (componentes de terceiros mantêm suas respectivas licenças).

---
Para detalhes de backend veja `backend/README.md`.
