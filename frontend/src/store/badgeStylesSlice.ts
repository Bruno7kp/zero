import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface BadgeStyleConfig {
  variant: 'light' | 'filled' | 'outline' | 'transparent';
  radius: 0 | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill';
  iconPosition: 'before' | 'after' | 'hidden' | 'split'; // split = segundo badge vertical (tabela)
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  condensed: boolean; // reduz padding
  colorStrategy: 'direction' | 'static';
  staticColor?: string; // usado se strategy = static
  emphasizeZero?: boolean; // se '=' ganha fundo diferenciado
  splitIconVariant?: 'filled' | 'transparent'; // variant para o badge do ícone quando split
  splitTall?: boolean; // se true, usa layout alto (estilo altVariation) para split
}

export interface ViewBadgeState { rank: { preset: string }; plays: { preset: string }; }
export interface BadgeStylesState { views: Record<'table' | 'list' | 'grid', ViewBadgeState>; }

// Novos presets baseados na especificação do usuário
// 1. transparente (sem ícone)
// 2. transparente com ícone
// 3. light (sem ícone)
// 4. light com ícone
// 5. sólido (sem ícone)
// 6. sólido com ícone
// 7. maximalista (especial)
// 8. especial leve (maximalistaLight) - igual ao maximalista, mas segundo badge transparente
const PRESETS: Record<string, BadgeStyleConfig> = {
  transparent: {
    variant: 'transparent', radius: 0, iconPosition: 'hidden', size: 'xs', condensed: true, colorStrategy: 'direction', emphasizeZero: false
  },
  transparentIcon: {
    variant: 'transparent', radius: 0, iconPosition: 'before', size: 'xs', condensed: true, colorStrategy: 'direction', emphasizeZero: false
  },
  light: {
    variant: 'light', radius: 'pill', iconPosition: 'hidden', size: 'sm', condensed: false, colorStrategy: 'direction', emphasizeZero: true
  },
  lightIcon: {
    variant: 'light', radius: 'pill', iconPosition: 'before', size: 'sm', condensed: false, colorStrategy: 'direction', emphasizeZero: true
  },
  solid: {
    variant: 'filled', radius: 'sm', iconPosition: 'hidden', size: 'sm', condensed: false, colorStrategy: 'direction', emphasizeZero: true
  },
  solidIcon: {
    variant: 'filled', radius: 'sm', iconPosition: 'before', size: 'sm', condensed: false, colorStrategy: 'direction', emphasizeZero: true
  },
  maximalist: {
    variant: 'light', radius: 0, iconPosition: 'split', size: 'xs', condensed: true, colorStrategy: 'static', staticColor: 'gray', emphasizeZero: false, splitIconVariant: 'filled', splitTall: true
  },
  maximalistLight: {
    variant: 'light', radius: 0, iconPosition: 'split', size: 'xs', condensed: true, colorStrategy: 'static', staticColor: 'gray', emphasizeZero: false, splitIconVariant: 'transparent', splitTall: true
  }
};

// Initial defaults aligned to requested view defaults (table):
// table: rank outline ("Padrão"), plays minimal
// list/grid deviations are applied via reset logic or per-view enforcement in UI
const initialState: BadgeStylesState = {
  views: {
    table: { rank: { preset: 'light' }, plays: { preset: 'transparent' } },
    list: { rank: { preset: 'solidIcon' }, plays: { preset: 'light' } },
    grid: { rank: { preset: 'solidIcon' }, plays: { preset: 'light' } },
  }
};

function resolve(preset: string): BadgeStyleConfig {
  return PRESETS[preset] || PRESETS.light;
}

export const badgeStylesSlice = createSlice({
  name: 'badgeStyles',
  initialState,
  reducers: {
    setPreset(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; kind: 'rank' | 'plays'; preset: string }>) {
      const { view, kind, preset } = action.payload;
      if (!state.views[view]) return;
      state.views[view][kind].preset = preset;
    },
    resetAll() {
      return { ...initialState };
    }
  },
  extraReducers: () => {}
});

export const { setPreset, resetAll } = badgeStylesSlice.actions;

export function selectResolvedBadge(state: any, kind: 'rank' | 'plays', view: 'table' | 'list' | 'grid' = 'table'): BadgeStyleConfig {
  const slice: BadgeStylesState = state.badgeStyles;
  const entry = slice.views?.[view]?.[kind] || slice.views.table[kind];
  return resolve(entry.preset);
}

export function selectPresetList(): { key: string; config: BadgeStyleConfig }[] {
  return Object.entries(PRESETS).map(([key, config]) => ({ key, config }));
}

export default badgeStylesSlice.reducer;