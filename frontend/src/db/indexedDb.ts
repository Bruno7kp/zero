// src/db/indexedDb.ts
import Dexie from 'dexie';
import type { Table } from 'dexie';


export interface ChartData {
  id?: number;
  chartId: string; // id do chart, string para facilitar indexação
  chartType: string;
  entityId: string;
  week: string;
  rank: number;
  plays: number;
  name: string;
  artistName: string;
  deltaRank?: number | string;
  deltaPlays?: number | string;
}


export interface ChartStats {
  chartId: string;
  chartType: string;
  entityId: string;
  peak?: any;
  totals?: any;
  sequences?: any;
  chartRun?: Array<{ week: string; position: number; plays: number }>;
}

export class ZeroChartsDB extends Dexie {
  charts_data!: Table<ChartData, number>;
  charts_stats!: Table<ChartStats, [string, string, string]>;
  playcount_cache!: Table<{ key: string; value: number; expires: number }, string>;

  constructor() {
    super('ZeroChartsDB');
    this.version(11).stores({
      charts_data: `++id, chartId, chartType, entityId, week, rank, plays, name, artistName, [chartId+chartType], [chartId+chartType+week], [chartId+chartType+entityId], &[chartId+chartType+entityId+week]`,
      charts_stats: `&[chartId+chartType+entityId], chartId, chartType, entityId, peak, totals, sequences, [chartId+chartType]`,
      playcount_cache: `key, expires`
    });
  }
}

export const db = new ZeroChartsDB();
