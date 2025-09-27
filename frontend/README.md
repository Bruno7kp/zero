# ZeroCharts Frontend (React + Vite + TS)

Aplicação SPA que consome a API Laravel e armazena dados históricos localmente (IndexedDB via Dexie) para estatísticas offline.

## Principais Tecnologias
- React + Vite + TypeScript
- Mantine UI
- Redux Toolkit (charts, sync, auth, i18n)
- Dexie (IndexedDB) com migrações (ex: status de semanas: partial/complete)
- i18next (multi-idioma)

## Scripts
| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (porta 5173) |
| `npm run build` | Build de produção (gera `dist/`) |
| `npm run preview` | Servir build local |
| `npm run lint` | ESLint (fail em error, warnings tolerados) |

## Variáveis de Ambiente (`frontend/.env`)
| Variável | Uso |
|----------|-----|
| VITE_API_BASE_URL | Base para chamadas (em prod usamos `/api`) |
| VITE_GOOGLE_CLIENT_ID | OAuth Google (opcional) |

## Estrutura Resumida
```
src/
  components/        # UI reutilizável
  pages/             # Páginas (routing)
  store/             # Redux slices
  db/                # Dexie + tipos + migrações
  utils/             # Cálculos de stats, helpers
  hooks/             # Hooks customizados (offline, db, etc.)
  locales/           # Traduções i18n
```

## IndexedDB / Dexie
- Versão inclui tabela `chart_weeks` para marcar `partial` / `complete`.
- Migrações devem ser idempotentes; sempre aumentar versão + adicionar transformação.

## Estratégia de Cache (Produção)
- Assets com hash: cache longo (30d, immutable)
- `index.html`: `no-cache, no-store` para garantir atualização de versão

## CI
- Lint + build em push para `main` e `refactor`.
- Imagem Docker final (nginx + SPA) construída no mesmo pipeline que backend.

## Fluxo de Branches (ver backend README para detalhes)
- `refactor`: staging
- `main`: produção

## Desenvolvimento
1. Criar chart e sincronizar semanas (track/album/artist) via Last.fm.
2. Stats são recalculadas incrementalmente e persistidas.
3. Offline: leitura de dados e algumas métricas seguem disponíveis; certificações podem exigir online.

## Próximos Melhorias Sugeridas
- Reativar regra `@typescript-eslint/no-explicit-any` gradualmente
- Adicionar testes de componentes críticos (ex: cálculo de stats isolado)
- Reportar `GIT_SHA` na UI (ex: footer) consumindo `/api/health`

## Licença
Mesmo escopo do backend (MIT, salvo menções específicas).
