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

export interface ChartWeekRow {
  chartId: string;
  week: string;
  status: 'complete' | 'partial'; // future statuses can be added
}

export class ZeroChartsDB extends Dexie {
  charts_data!: Table<ChartData, number>;
  charts_stats!: Table<ChartStats, [string, string, string]>;
  playcount_cache!: Table<{ key: string; value: number; expires: number }, string>;
  chart_weeks!: Table<ChartWeekRow, [string, string]>;

  constructor() {
    super('ZeroChartsDB');
    this.version(11).stores({
      charts_data: `++id, chartId, chartType, entityId, week, rank, plays, name, artistName, [chartId+chartType], [chartId+chartType+week], [chartId+chartType+entityId], &[chartId+chartType+entityId+week]`,
      charts_stats: `&[chartId+chartType+entityId], chartId, chartType, entityId, peak, totals, sequences, [chartId+chartType]`,
      playcount_cache: `key, expires`
    });
    this.version(12).stores({
      // legacy version with "completed" numeric flag
      chart_weeks: `&[chartId+week], chartId, week, completed`
    });

    // v13: replace numeric completed flag with string status (complete | partial)
    this.version(13).stores({
      chart_weeks: `&[chartId+week], chartId, week, status`
    }).upgrade(async (tx) => {
      try {
        const table: any = tx.table('chart_weeks');
        await table.toCollection().modify((row: any) => {
          if (row.completed) {
            row.status = 'complete';
          } else if (!row.status) {
            // rows without completed flag (shouldn't happen) become partial as conservative default
            row.status = 'partial';
          }
          delete row.completed;
        });
      } catch (e) {
        // silent – migration best-effort
        console.warn('[Dexie][v13 upgrade] chart_weeks migration issue', e);
      }
    });
  }
}

export const db = new ZeroChartsDB();
