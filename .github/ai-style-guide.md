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
