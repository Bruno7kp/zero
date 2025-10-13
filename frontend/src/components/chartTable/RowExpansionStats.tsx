import React from 'react';
import { ChartItemStatsLoader } from '../stats/ChartItemStatsLoader';

interface RowExpansionStatsProps {
  chartId: string;
  chartType: string;
  entityId: string;
  week?: string;
}

export const RowExpansionStats: React.FC<RowExpansionStatsProps> = ({ chartId, chartType, entityId, week }) => {
  return (
    <ChartItemStatsLoader
      chartId={chartId}
      chartType={chartType}
      entityId={entityId}
      week={week}
    />
  );
};

export default RowExpansionStats;
