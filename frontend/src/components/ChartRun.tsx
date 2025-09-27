import React from 'react';
import { Box, Text, Button, Stack, Badge, Popover } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
// removed duplicate imports

export interface ChartRunProps {
  run: Array<{ week: string; position: number; plays: number }>;
  highlightWeek?: string;
  chartType?: string; // para construir rota /charts/week/:week/:type
}

export const ChartRun: React.FC<ChartRunProps> = ({ run, highlightWeek, chartType }) => {
  const [openedKey, setOpenedKey] = React.useState<string | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  // activeChartId not needed for navigation link anymore
  const autoCloseRef = React.useRef<number | null>(null);

  // Agrupa semanas consecutivas em períodos (diferença exata de 7 dias)
  const groups = React.useMemo(() => {
    if (!run || run.length === 0) return [] as Array<{ start: string; end: string; weeks: ChartRunProps['run'] }>;
    const sorted = [...run].sort((a, b) => dayjs(a.week).valueOf() - dayjs(b.week).valueOf());
    const result: Array<{ start: string; end: string; weeks: ChartRunProps['run'] }> = [];
    let current: { start: string; end: string; weeks: ChartRunProps['run'] } | null = null;
    for (const item of sorted) {
      if (!current) {
        current = { start: item.week, end: item.week, weeks: [item] };
        continue;
      }
      const prev = current.weeks[current.weeks.length - 1];
      if (dayjs(item.week).diff(dayjs(prev.week), 'day') === 7) {
        current.weeks.push(item);
        current.end = item.week;
      } else {
        result.push(current);
        current = { start: item.week, end: item.week, weeks: [item] };
      }
    }
    if (current) result.push(current);
    return result;
  }, [run]);

  // Auto close after 5s when opened
  React.useEffect(() => {
    if (openedKey) {
      if (autoCloseRef.current) window.clearTimeout(autoCloseRef.current);
      autoCloseRef.current = window.setTimeout(() => {
        setOpenedKey(null);
      }, 5000);
    } else if (autoCloseRef.current) {
      window.clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
    return () => {
      if (autoCloseRef.current) window.clearTimeout(autoCloseRef.current);
    };
  }, [openedKey]);

  const handleToggle = (weekKey: string) => {
    setOpenedKey(prev => prev === weekKey ? null : weekKey);
  };

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // Auto-scroll to highlighted week or last group on mount/update
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Try highlight first
    if (highlightWeek) {
      const target = el.querySelector(`[data-week='${highlightWeek}']`);
      if (target) {
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    // fallback: scroll to end
    el.scrollTop = el.scrollHeight;
  }, [highlightWeek, run]);

  return (
    <Box ref={containerRef} style={{ width: '100%', maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
      <Stack gap="sm">
        {groups.map(group => {
          const startW = dayjs(group.start);
          const endW = dayjs(group.end).add(6, 'day');
          const range = `${startW.format('DD/MM/YYYY')} - ${endW.format('DD/MM/YYYY')}`;
          const weeksCount = group.weeks.length;
          const periodLabel = t('charts.stats.periodWeeks', { count: weeksCount });
          return (
            <Box key={`${group.start}-${group.end}`}>
              <Text size="10px" ta="center" fw={600} mb={4}>{range} • {periodLabel}</Text>
              <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {group.weeks.map(point => {
                  const start = dayjs(point.week);
                  const end = start.add(6, 'day');
                  const range = `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;
                  const opened = openedKey === point.week;
                  const routeType = chartType || 'artist';
                  const handleNavigate = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    navigate(`/charts/week/${point.week}/${routeType}`);
                    setOpenedKey(null);
                  };
                  return (
                    <Popover
                      key={point.week}
                      opened={opened}
                      withArrow
                      shadow="md"
                      position="top"
                      closeOnClickOutside
                      closeOnEscape
                      onChange={(o) => { if (!o) setOpenedKey(null); }}
                      onClose={() => setOpenedKey(null)}
                    >
                      <Popover.Target>
                        <Badge
                          onClick={() => handleToggle(point.week)}
                          size="xl"
                          p={0}
                          variant={point.position === 1 || point.week === highlightWeek ? 'outline' : 'default'}
                          color={point.position === 1 && point.week !== highlightWeek ? 'blue' : 'teal'}
                          data-week={point.week}
                          style={() => ({
                            borderRadius: 6,
                            minWidth: 32,
                          })}
                        >
                          <Text size="xs" fw={700}>{point.position ?? '-'}</Text>
                        </Badge>
                      </Popover.Target>
                      <Popover.Dropdown
                        style={{
                          minWidth: 150,
                          textAlign: 'center'
                        }}
                      >
                        <Stack gap={4} align="center">
                          <Text size="xs" fw={700}>{t('charts.stats.week', { n: run.findIndex(r => r.week === point.week) + 1 })}</Text>
                          <Text size="10px" c="dimmed">{range}</Text>
                          <Text size="10px">{point.plays} {t('charts.stats.playsLabel')}</Text>
                          <Button size="compact-xs" variant="light" onClick={handleNavigate}>
                            {t('charts.stats.showWeek')}
                          </Button>
                        </Stack>
                      </Popover.Dropdown>
                    </Popover>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
