# Guia de estilo para IDEs e agentes de IA

Objetivo: garantir indentação consistente (2 espaços) e comportamento previsível de formatação quando editores humanos e agentes automáticos (IA) fizerem alterações no repositório.

Regras principais
- Indentação: 2 espaços. Não usar tabs para código (Makefile é exceção).
- Final de linha: LF (\n).
- Charset: UTF-8.
- Comprimento de linha recomendado: 100 caracteres.
- Sempre preservar arquivos existentes: evite reformatar arquivos que não são necessários para a mudança.

Configurar IDE/editor
- Adicione o arquivo `.editorconfig` (já presente neste repositório). A maioria das IDEs (VS Code, JetBrains, etc.) respeita esse ficheiro por padrão ou com um plugin.
- Para VS Code, use as configurações do workspace em `.vscode/settings.json`. Recomenda-se instalar a extensão Prettier e defini-la como formatador padrão.
- Ative "Format on Save" e desative "Detect Indentation" para evitar mistura de tabs/espacos.

Orientações para o agente de IA (e para revisores automáticos)
- Antes de editar: leia e siga `.editorconfig` e `.vscode/settings.json`.
- Não reformatar arquivos inteiros desnecessariamente. Faça apenas as alterações mínimas necessárias para implementar a tarefa.
- Quando gerar patches: produza código com 2 espaços de indentação e LF como fim de linha.
- Preserve o estilo local do arquivo quando múltiplos estilos já existirem claramente (ex.: arquivos gerados automaticamente no `dist/`), a menos que a tarefa seja especificamente para reformatar o projeto.
- Execute validações locais rápidas após alterações (quando aplicável):
  - TypeScript: `cd frontend && npx tsc --noEmit`
  - Lint: `cd frontend && npm run -s lint`

Como rodar a formatação (opcional)
- Se desejar usar Prettier manualmente:
  1. Instale Prettier localmente: `npm install --save-dev prettier` dentro de `frontend`.
  2. Rode: `npx prettier --write "frontend/src/**/*.{ts,tsx,js,jsx,json,css,md}"`

Notas finais
- Ao criar PRs, verifique o diff para garantir que apenas as mudanças esperadas foram aplicadas.
- Se precisar de uma regra de formatação adicional (por exemplo: regras TypeScript/ESLint), abra uma issue para discutirmos a configuração global e a instalação das dependências necessárias.

Runtime data locations (important for agents)
-------------------------------------------
Para evitar confusão, aqui estão os locais e keys onde o frontend guarda dados de usuário e o estado do app — siga essas referências quando um agente precisar ler ou updatear estado:

- Charts / chart ativo
  - Lista de charts: `state.charts.charts` (array)
  - Chart atualmente ativo: `state.charts.activeChartId` (id)
  - Exemplos de leitura em componentes:
    - `const charts = useSelector((s:any) => s.charts.charts);`
    - `const activeChartId = useSelector((s:any) => s.charts.activeChartId);`

- Theme / idioma
  - Theme: `state.theme.value` (ex.: 'dark' / 'light') — muitos componentes usam `useSelector((s:any) => s.theme?.value)`
  - Language (i18n): `state.i18n.language` (ex.: 'en' / 'pt') — use `useSelector((s:any) => s.i18n.language)`
  - Há também um `lang` slice (`state.lang`) injetado em alguns pontos; preferir `state.i18n.language` quando o código existente usa `react-i18next`.

- Columns / view settings (container size, fonts, visible columns)
  - Configuração por view: `state.columns.views[view]` onde `view` é 'table' | 'list' | 'grid'.
  - Ex.: `state.columns.views.table.settings.containerSize` e `state.columns.views.table.columns` (visibilidade por coluna).

- User preferences / UI prefs
  - Stats preferences (fontSize, containerSize, toggles): available via the `statsPreferences` slice — `state.statsPreferences` or the hook `useStatsPreferences()`.
  - Library filters: `state.libraryFilters` ou o hook `useLibraryFilters()`.

- Persisted slices (redux-persist)
  - The store whitelist includes important persisted slices: `charts`, `columns`, `statsPreferences`, `libraryFilters`, `chartsWeeks` (see `frontend/src/store/index.ts`).

- IndexedDB (large chart data)
  - The app stores chart rows and weeks in IndexedDB via Dexie (`frontend/src/db/`). For bulk chart data (plays, ranks, weeks) prefer `db.charts_data` rather than localStorage.

- LocalStorage helper and keys
  - Use the centralized helper in `frontend/src/utils/storage.ts` and the canonical key registry in `frontend/src/constants/storageKeys.ts` if you need to read/write localStorage directly.

Agent guidance when reading/writing runtime data
-----------------------------------------------
- Prefer using existing hooks (e.g. `useStatsPreferences`, `useLibraryFilters`, `useIsMobile`) instead of reaching into the store shape directly; hooks centralize migrations and defaults.
- If you must read the store directly, use `useSelector` with the paths above. Avoid guessing nested paths — consult `frontend/src/store` slices when in doubt.
- When updating state, prefer dispatching the slice actions exposed (e.g. `dispatch(updatePreferenceAction(...))`, `dispatch(updateColumn(...))`) to keep logic and persistence consistent.
- Avoid writing directly to legacy localStorage keys — the project removed legacy reads/writes in favor of redux-persist; prefer updating the redux slice or the storage helper keys in `constants/storageKeys.ts`.

If this section is unclear or you want a small quick-reference README I can add to the repo (one file with common selectors, hooks and examples), tell me and I will create it under `.github/` or `frontend/docs/`.
