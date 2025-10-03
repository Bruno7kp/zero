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
  // Incremental runtime metadata (versão 2+)
  _running?: {
    lastWeek: string | null;
    lastRank: number | null;
    weeksProcessed: number;
    version: number;
    seqPeak: number;
    seqRank1: number;
    seqTop5: number;
    seqTop10: number;
    seqWithinCutoff: number;
  };
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
    // Schema v16: adds _running incremental metadata (no index change needed)
    this.version(16).stores({
      charts_data: `++id, chartId, chartType, entityId, week, rank, plays, name, artistName, [chartId+chartType], [chartId+chartType+week], [chartId+chartType+entityId], &[chartId+chartType+entityId+week], [artistName+chartType]`,
      charts_stats: `&[chartId+chartType+entityId], chartId, chartType, entityId, peak, totals, sequences, [chartId+chartType]`,
      playcount_cache: `key, expires`,
      chart_weeks: `[chartId+week], chartId, week, status`
    }).upgrade(async (tx) => {
      // Idempotent conversion: if any legacy rows still have 'completed', map them.
      try {
        const table: any = tx.table('chart_weeks');
        await table.toCollection().modify((row: any) => {
          if (row.completed && !row.status) row.status = 'complete';
          if (!row.status) row.status = 'partial';
          delete row.completed;
        });
      } catch {/* ignore */}
      // Add _running metadata to existing stats if missing
      try {
        const statsTable: any = tx.table('charts_stats');
        await statsTable.toCollection().modify((row: any) => {
          if (!row._running) {
            // Best-effort infer lastWeek from chartRun
            const lastWeek = Array.isArray(row.chartRun) && row.chartRun.length ? row.chartRun[row.chartRun.length - 1].week : null;
            row._running = {
              lastWeek,
              lastRank: null,
              weeksProcessed: Array.isArray(row.chartRun) ? row.chartRun.length : 0,
              version: 2,
              seqPeak: 0,
              seqRank1: 0,
              seqTop5: 0,
              seqTop10: 0,
              seqWithinCutoff: 0,
            };
          }
        });
      } catch {/* ignore stats upgrade */}
    });
  }
}
export const db = new ZeroChartsDB();

// Basic open promise. Primary key change conflicts shouldn't happen now, but keep a safety reset.
export const dbReady: Promise<void> = db.open()
  .then(() => {})
  .catch(async (e) => {
    if (/UpgradeError/i.test(e?.name || '') && /primary key/i.test(e?.message || '')) {
      console.warn('[Dexie] PK upgrade conflict (unexpected) – recreating DB', e);
      await db.delete();
      await db.open();
    } else {
      console.error('[Dexie] Failed to open DB', e);
    }
  });

// Optional convenience function for callers wanting to ensure readiness on app bootstrap
export async function ensureDbReady() { await dbReady; }
