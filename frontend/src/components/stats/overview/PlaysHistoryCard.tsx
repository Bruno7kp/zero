import React from 'react';
import {
  Card,
  Flex,
  Button,
  Title,
  Text,
  Skeleton,
  useMantineTheme,
  useComputedColorScheme,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ResponsiveWaffle } from '@nivo/waffle';

const MAX_WEEKS = 52;
const GRID_ROWS = 4;
const GRID_COLUMNS = 13;
const CELL_SIZE = 12;
const CHART_MARGIN = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLUMNS;
const CHART_HEIGHT = GRID_ROWS * CELL_SIZE + CHART_MARGIN * 2;
const CHART_WIDTH = GRID_COLUMNS * CELL_SIZE + CHART_MARGIN * 2;

interface PlaysHistoryCardProps {
  loading: boolean;
  cardBg: string;
  history: Array<{
    week: string;
    artistName: string;
    plays: number;
  }>;
}

export const PlaysHistoryCard: React.FC<PlaysHistoryCardProps> = ({ loading, cardBg, history }) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark');
  const isDark = colorScheme === 'dark';

  const limitedHistory = React.useMemo(() => history.slice(-MAX_WEEKS), [history]);

  const waffleData = React.useMemo(() => {
    if (limitedHistory.length === 0) {
      return [];
    }

    const playsValues = limitedHistory.map(item => item.plays);
    const maxPlays = Math.max(...playsValues);
    const minPlays = Math.min(...playsValues);
    const range = Math.max(maxPlays - minPlays, 1);

    const palette = isDark
      ? [
          theme.colors.dark[5],
          theme.colors.green[7],
          theme.colors.green[6],
          theme.colors.green[4],
          theme.colors.green[2],
        ]
      : [
          theme.colors.gray[2],
          theme.colors.teal[1],
          theme.colors.teal[3],
          theme.colors.teal[5],
          theme.colors.teal[7],
        ];

    return limitedHistory.map(item => {
      const normalized = (item.plays - minPlays) / range;
      const level = Math.min(
        palette.length - 1,
        Math.max(0, Math.round(normalized * (palette.length - 1)))
      );

      return {
        id: item.week,
        label: item.artistName,
        value: 1,
        color: palette[level],
        plays: item.plays,
      };
    });
  }, [
    isDark,
    limitedHistory,
    theme.colors.dark,
    theme.colors.gray,
    theme.colors.green,
    theme.colors.teal,
  ]);

  return (
    <Card withBorder p="lg" style={{ background: cardBg }}>
      <Flex align="center" gap="md" mb="sm">
        <div style={{ flex: 1 }}>
          <Title order={4}>{t('stats.visualizations.overview.playsHistory')}</Title>
          <Text size="sm" c="dimmed">
            {t('stats.visualizations.overview.playsHistoryDescription')}
          </Text>
        </div>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to="/stats/visualizations/number-one-timeline"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Flex>
      {loading ? (
        <Skeleton height={CHART_HEIGHT} radius="md" />
      ) : waffleData.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: CHART_HEIGHT }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <div
          style={{
            height: CHART_HEIGHT,
            width: '100%',
            maxWidth: CHART_WIDTH,
            margin: '0 auto',
          }}
        >
          <ResponsiveWaffle
            data={waffleData}
            total={TOTAL_CELLS}
            rows={GRID_ROWS}
            columns={GRID_COLUMNS}
            margin={{
              top: CHART_MARGIN,
              right: CHART_MARGIN,
              bottom: CHART_MARGIN,
              left: CHART_MARGIN,
            }}
            padding={1}
            colors={datum => (datum as { color: string }).color}
            emptyColor={isDark ? theme.colors.dark[5] : theme.colors.gray[2]}
            emptyOpacity={0.35}
            borderRadius={2}
            borderWidth={1}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 0.25]],
            }}
            animate
            motionConfig="gentle"
            tooltip={({ data }) => {
              const computed = data as { id: string | number; label: string };
              const weekId = String(computed.id);
              const datum = waffleData.find(entry => entry.id === weekId);
              return (
                <div
                  style={{
                    background: isDark ? theme.colors.dark[6] : theme.white,
                    color: isDark ? theme.white : theme.black,
                    padding: '6px 10px',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <Text size="xs" fw={600}>
                    {weekId.replace(/-/g, '.')}
                  </Text>
                  <Text size="xs">{datum?.label ?? computed.label}</Text>
                  {datum && (
                    <Text size="xs">
                      {datum.plays.toLocaleString()} {t('stats.playsLabel')}
                    </Text>
                  )}
                </div>
              );
            }}
          />
        </div>
      )}
    </Card>
  );
};
