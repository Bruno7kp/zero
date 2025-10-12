// Shared types for columns config
export interface ColumnConfig {
  key: string;
  isColumn?: boolean; // se representa uma coluna real na tabela/lista
  label: string; // chave simples ou label direto
  labelComplete?: string; // chave completa de tradução
  visible: boolean; // visibilidade (atributo boolean)
}

// Configurações adicionais por view que não são booleanas
export interface ViewSettings {
  containerSize: 'md' | 'lg' | 'xl' | '100%';
  fontScale?: -2 | -1 | 0 | 1 | 2;
  rankVariationLocation?: 'under' | 'column' | 'hidden' | 'corner';
  playsVariationDisplay?: 'hidden' | 'absolute' | 'percent';
  playsVariationLocation?: 'hidden' | 'under' | 'column';
  peakCountStyle?: 'withCount' | 'noCount';
  tableBackground?: 'default' | 'transparent';
  listBackground?: 'default' | 'transparent';
  artistDisplayMode?: 'under' | 'column';
  listPeakWeeksCombined?: boolean;
  showDroppedItems?: boolean;
  showFormulaInsteadOfPlays?: boolean;
  showCarousel?: boolean;
}

export interface ViewConfig {
  columns: ColumnConfig[];
  settings: ViewSettings;
}

export interface ColumnsState {
  views: Record<'table' | 'list' | 'grid', ViewConfig>;
  // Global UI settings (deprecated - use views.*.settings.showCarousel instead)
  showCarousel?: boolean;
}
