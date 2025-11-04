import React from 'react';
import { Card, Flex, Button, Title, Text, Skeleton, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ResponsiveWaffle } from '@nivo/waffle';

interface PlaysHistoryCardProps {
  loading: boolean;
  cardBg: string;
  history: Array<{
    week: string;
    artistName: string;
    plays: number;
  }>;
}

export const PlaysHistoryCard: React.FC<PlaysHistoryCardProps> = ({
  loading,
  cardBg,
  history,
}) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark');
  const isDark = colorScheme === 'dark';

  const waffleData = React.useMemo(() => {
    if (history.length === 0) return [];
    
    const maxPlays = Math.max(...history.map(h => h.plays));
    const minPlays = Math.min(...history.map(h => h.plays));
    
    return history.map(item => {
      // Calculate color based on plays (red to green gradient)
      const normalized = (item.plays - minPlays) / (maxPlays - minPlays || 1);
      const red = Math.round(255 * (1 - normalized));
      const green = Math.round(255 * normalized);
      
      return {
        id: item.week,
        label: item.artistName,
        value: 1,
        color: `rgb(${red}, ${green}, 0)`,
        plays: item.plays,
      };
    });
  }, [history]);

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
        <Skeleton height={200} radius="md" />
      ) : waffleData.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 200 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <div style={{ height: 200, width: '100%' }}>
          <ResponsiveWaffle
            data={waffleData}
            total={waffleData.length}
            rows={3}
            columns={5}
            margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
            colors={(datum: any) => datum.color}
            borderRadius={3}
            borderWidth={2}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 0.3]],
            }}
            animate
            motionConfig="gentle"
            tooltip={({ id, label }) => {
              const item = waffleData.find(h => h.id === id);
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
                    {String(id).replace(/-/g, '.')}
                  </Text>
                  <Text size="xs">{label}</Text>
                  {item && (
                    <Text size="xs">
                      {item.plays.toLocaleString()} {t('stats.playsLabel')}
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
