## ZeroCharts Backend (Laravel)

API backend do projeto ZeroCharts. Fornece endpoints de autenticação (Google OAuth), gerenciamento de charts e sincronização.

### Requisitos
- Docker / Docker Compose (ou ambiente PHP 8.3+, MySQL 8, Node 20 se rodar sem docker)
- Composer

### Setup Rápido com Docker

1. Copiar arquivos de ambiente:
```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
2. Gerar APP_KEY:
```
docker compose run --rm app php artisan key:generate
```
3. Subir serviços:
```
docker compose up -d --build
```
4. Rodar migrações (e tabelas de sessão / fila / cache):
```
docker compose exec app php artisan migrate --force
```

Backend disponível em: http://localhost:8081/api
Frontend dev (Vite) em: http://localhost:5173

### Estrutura principal
- `app/` Controllers, Providers, Models
- `routes/api.php` Endpoints da API
- `database/migrations` Estrutura de tabelas
- `config/` Configurações Laravel (auth, database, queue etc.)

### Variáveis de Ambiente (backend/.env)
| Variável | Descrição |
|----------|-----------|
| APP_URL | URL base usada em links e callback OAuth |
| DB_* | Configuração MySQL (usa serviço `db` no docker) |
| GOOGLE_CLIENT_ID / SECRET | Credenciais Google OAuth |
| GOOGLE_CALLBACK_URL | Deve apontar para `/api/auth/google/callback` |
| QUEUE_CONNECTION | `database` por padrão |
| SESSION_DRIVER | `database` para persistir sessões |

### OAuth Google
Adicionar no console Google a URL de callback: `http://localhost:8081/api/auth/google/callback` (ajustar em produção para domínio HTTPS).

### Comandos Úteis
```
# Logs (container app)
docker compose logs -f app

# Rodar testes (se existirem futuramente)
docker compose exec app php artisan test

# Regerar caches de config/rotas/views
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

### Deploy Produção (resumo)
1. Definir `.env` com APP_ENV=production, APP_DEBUG=false
2. Ajustar APP_URL para domínio final
3. Rodar `php artisan key:generate` se for instância nova
4. `php artisan migrate --force`
5. `php artisan config:cache route:cache view:cache`
6. Configurar worker de filas se necessário (`php artisan queue:work`)

### Frontend Integração
O frontend consome a API usando `VITE_API_BASE_URL` (variável no `frontend/.env`). Endpoints montados via helper centralizado.

### Contribuição
Pull requests são bem-vindos. Antes de enviar:
- Padronize com PHP-CS-Fixer / Pint (se adicionado futuramente)
- Evite subir `.env` ou segredos

### Licença
Este backend utiliza Laravel (MIT). O código adicional do projeto segue mesma licença salvo indicação contrária.
