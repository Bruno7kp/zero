import React from 'react';
import { Box, Group, Text, Button, Stack, Badge, Popover } from '@mantine/core';
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

  return (
    <Box style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Group gap={6} wrap="nowrap" style={{ justifyContent: 'center' }}>
        {run.map((point, index) => {
            const start = dayjs(point.week);
            const end = start.add(6, 'day');
            const range = `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`;
            const opened = openedKey === point.week;
            const routeType = chartType || 'artist';
            const handleNavigate = (e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/charts/week/${point.week}/${routeType}`);
              // Fecha o popover após navegar
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
                  variant={point.week === highlightWeek ? 'outline' : 'default'}
                  color='blue'
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
                    <Text size="xs" fw={700}>{t('charts.stats.week', { n: index + 1 })}</Text>
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
      </Group>
    </Box>
  );
};
