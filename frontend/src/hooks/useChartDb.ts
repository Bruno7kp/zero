// src/hooks/useChartDb.ts
import { useCallback } from 'react';
import { db } from '../db/indexedDb';
import type { ChartData, ChartStats, ChartWeekRow } from '../db/indexedDb';

export function useChartDb() {
  // Salva vários ChartData de uma vez
  const saveChartData = useCallback(async (items: ChartData[]) => {
    await db.charts_data.bulkPut(items);
  }, []);

  // Busca todos os dados de um usuário e tipo de chart
  const getChartData = useCallback(async (user: string, chartType: string) => {
    return db.charts_data.where(['user', 'chartType']).equals([user, chartType]).toArray();
  }, []);

  // Busca dados de uma semana específica
  const getChartDataByWeek = useCallback(async (chartId: string, chartType: string, week: string) => {
    return db.charts_data.where(['chartId', 'chartType', 'week']).equals([chartId, chartType, week]).toArray();
  }, []);

  // Remove dados de uma semana específica para um tipo (usado para corrigir semanas parcialmente salvas de versões antigas)
  const deleteChartDataByWeek = useCallback(async (chartId: string, chartType: string, week: string) => {
    await db.charts_data.where(['chartId', 'chartType', 'week']).equals([chartId, chartType, week]).delete();
  }, []);

  // Marca semana completa
  const markWeekComplete = useCallback(async (chartId: string, week: string) => {
    await db.chart_weeks.put({ chartId, week, status: 'complete' });
  }, []);

  // Marca semana parcial
  const markWeekPartial = useCallback(async (chartId: string, week: string) => {
    // Se já estiver completa não rebaixa
    const existing = await db.chart_weeks.get([chartId, week]);
    if (existing && existing.status === 'complete') return;
    await db.chart_weeks.put({ chartId, week, status: 'partial' });
  }, []);

  // Verifica se semana está marcada como completa
  const isWeekMarkedComplete = useCallback(async (chartId: string, week: string) => {
    const row = await db.chart_weeks.get([chartId, week]) as ChartWeekRow | undefined;
    return row?.status === 'complete';
  }, []);

  // Recupera status bruto da semana
  const getWeekStatus = useCallback(async (chartId: string, week: string) => {
    const row = await db.chart_weeks.get([chartId, week]) as ChartWeekRow | undefined;
    return row?.status; // undefined | 'partial' | 'complete'
  }, []);

  // Retorna semanas sem marcação (nem parcial nem completa) dado um conjunto
  const getUnmarkedWeeks = useCallback(async (chartId: string, weeks: string[]) => {
    const results: string[] = [];
    for (const w of weeks) {
      const row = await db.chart_weeks.get([chartId, w]);
      if (!row) results.push(w);
    }
    return results;
  }, []);

  // Salva estatísticas de chart
  const saveChartStats = useCallback(async (stats: ChartStats) => {
    await db.charts_stats.put(stats);
  }, []);

  // Busca estatísticas de uma entidade
  const getChartStats = useCallback(async (user: string, chartType: string, entityId: string) => {
    return db.charts_stats.get([user, chartType, entityId]);
  }, []);

  // Exporta todos os dados
  const exportChartData = useCallback(async () => {
    const allData = await db.charts_data.toArray();
    return JSON.stringify(allData, null, 2);
  }, []);

  // Importa dados em massa
  const importChartData = useCallback(async (jsonString: string) => {
    const data: ChartData[] = JSON.parse(jsonString);
    await db.charts_data.bulkPut(data);
  }, []);

  return {
    saveChartData,
    getChartData,
    getChartDataByWeek,
    deleteChartDataByWeek,
  markWeekComplete,
  markWeekPartial,
    isWeekMarkedComplete,
  getWeekStatus,
  getUnmarkedWeeks,
    saveChartStats,
    getChartStats,
    exportChartData,
    importChartData,
  };
}
