import React from 'react';
import { Box, Text, Button, Stack, Badge, Popover } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

export interface ChartRunProps {
  run: Array<{ week: string; position: number; plays: number }>;
  highlightWeek?: string;
  chartType?: string; // para construir rota /charts/week/:week/:type
}

export const ChartRun: React.FC<ChartRunProps> = ({ run, highlightWeek, chartType }) => {
  const [openedKey, setOpenedKey] = React.useState<string | null>(null);
  const { t } = useTranslation();
  const autoCloseRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Ordena as semanas
  const sorted = React.useMemo(() => {
    if (!run || run.length === 0) return [];
    return [...run].sort((a, b) => dayjs(a.week).valueOf() - dayjs(b.week).valueOf());
  }, [run]);

  // Gera sequência com gaps
  const sequence = React.useMemo(() => {
    if (sorted.length === 0) return [];
    const result: Array<
      { type: 'in'; point: (typeof sorted)[0] } | { type: 'out'; count: number }
    > = [];
    let prev = dayjs(sorted[0].week);
    result.push({ type: 'in', point: sorted[0] });
    for (let i = 1; i < sorted.length; i++) {
      const curr = dayjs(sorted[i].week);
      const diff = curr.diff(prev, 'week');
      if (diff > 1) {
        result.push({ type: 'out', count: diff - 1 });
      }
      result.push({ type: 'in', point: sorted[i] });
      prev = curr;
    }
    return result;
  }, [sorted]);

  // Auto close popover after 5s
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
    setOpenedKey(prev => (prev === weekKey ? null : weekKey));
  };

  // Auto-scroll to highlighted week or end
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (highlightWeek) {
      const target = el.querySelector(`[data-week='${highlightWeek}']`);
      if (target) {
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    el.scrollTop = el.scrollHeight;
  }, [highlightWeek, run]);

  // Calcula o peak (menor valor de position no run)
  const peak = React.useMemo(() => {
    if (!run || run.length === 0) return undefined;
    return Math.min(...run.map(r => r.position));
  }, [run]);

  return (
    <Box
      ref={containerRef}
      style={{ width: '100%', maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}
    >
      <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {sequence.map((item, idx) => {
          if (item.type === 'out') {
            const key = `out-${idx}`;
            const opened = openedKey === key;
            return (
              <Popover
                key={key}
                opened={opened}
                withArrow
                shadow="md"
                position="top"
                closeOnClickOutside
                closeOnEscape
                onChange={o => {
                  if (!o) setOpenedKey(null);
                }}
                onClose={() => setOpenedKey(null)}
              >
                <Popover.Target>
                  <Badge
                    onClick={() => handleToggle(key)}
                    size="xl"
                    variant="default"
                    title="OUT"
                    className="chart-run-badge chart-run-out"
                  >
                    <span style={{ fontSize: 9, fontWeight: 500, display: 'block', lineHeight: 1 }}>
                      {item.count}x
                    </span>
                  </Badge>
                </Popover.Target>
                <Popover.Dropdown style={{ minWidth: 140, textAlign: 'center' }}>
                  <Text size="xs" fw={600}>
                    {t('charts.stats.outOfChart', { n: item.count })}
                  </Text>
                </Popover.Dropdown>
              </Popover>
            );
          } else {
            const point = item.point;
            const opened = openedKey === point.week;
            const routeType = chartType || 'artist';
            const isPeak = point.position === peak;
            const isHighlighted = point.week === highlightWeek;
            const badgeClass = `chart-run-badge ${isPeak ? 'chart-run-peak' : ''} ${
              isHighlighted ? 'chart-run-highlighted' : ''
            }`;
            return (
              <Popover
                key={point.week}
                opened={opened}
                withArrow
                shadow="md"
                position="top"
                closeOnClickOutside
                closeOnEscape
                onChange={o => {
                  if (!o) setOpenedKey(null);
                }}
                onClose={() => setOpenedKey(null)}
              >
                <Popover.Target>
                  <Badge
                    onClick={() => handleToggle(point.week)}
                    size="xl"
                    p={0}
                    variant="default"
                    className={badgeClass}
                    data-week={point.week}
                  >
                    <Text size="xs" fw={600}>
                      {point.position ?? '-'}
                    </Text>
                  </Badge>
                </Popover.Target>
                <Popover.Dropdown style={{ minWidth: 150, textAlign: 'center' }}>
                  <Stack gap={4} align="center">
                    <Text size="xs" fw={600}>
                      {t('charts.stats.week', { n: run.findIndex(r => r.week === point.week) + 1 })}
                    </Text>
                    <Text size="10px" c="dimmed">
                      {dayjs(point.week).format('DD/MM/YYYY')} -{' '}
                      {dayjs(point.week).add(6, 'day').format('DD/MM/YYYY')}
                    </Text>
                    <Text size="10px">
                      {point.plays} {t('charts.stats.playsLabel')}
                    </Text>
                    <Button
                      size="compact-xs"
                      variant="light"
                      component={Link}
                      to={`/charts/week/${point.week}/${routeType}`}
                    >
                      {t('charts.stats.showWeek')}
                    </Button>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            );
          }
        })}
      </Box>
    </Box>
  );
};
