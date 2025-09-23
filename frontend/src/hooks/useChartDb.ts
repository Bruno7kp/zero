// src/hooks/useChartDb.ts
import { useCallback } from 'react';
import { db } from '../db/indexedDb';
import type { ChartData, ChartStats } from '../db/indexedDb';

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
    saveChartStats,
    getChartStats,
    exportChartData,
    importChartData,
  };
}
