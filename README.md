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

## Build Produção (Resumo)
1. Definir `APP_ENV=production`, `APP_DEBUG=false` no backend.
2. Ajustar `APP_URL` e `VITE_API_BASE_URL` para o domínio final (HTTPS).
3. Rodar build frontend:
```
cd frontend
npm ci
npm run build
```
4. Servir `frontend/dist` via nginx (ou outro CDN) e apontar `/api` para o backend.
5. Rodar:
```
php artisan migrate --force
php artisan config:cache route:cache view:cache
```
6. Configurar fila (opcional futuro) `php artisan queue:work`.

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
