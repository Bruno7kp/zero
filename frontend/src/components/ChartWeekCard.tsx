import React from 'react';
import { Card, Group, Text, Flex, Divider, Box, useMantineTheme, Badge, Grid, ActionIcon } from '@mantine/core';
import { IconMicrophone, IconDisc, IconMusic, IconChevronRight } from '@tabler/icons-react';
import { SpotifyImageWithModal } from '../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface Top1Item {
  type: 'artist' | 'album' | 'track';
  name: string;
  artistName: string;
  entityId: string;
}

interface ChartWeekCardProps {
  week: string;
  weekNumber: number;
  top1: Top1Item[];
  themeMode: ThemeMode;
  formatWeekDate: (weekStr: string) => string;
  hasAllKill?: boolean;
}

export const ChartWeekCard: React.FC<ChartWeekCardProps> = ({ week, weekNumber, top1, themeMode, formatWeekDate, hasAllKill = false }) => {
  const theme = useMantineTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Get the showFormulaInsteadOfPlays setting from table view (will be used later for plays/sales display)
  const _showFormulaInsteadOfPlays = useSelector((state: any) => 
    state.columns?.views?.table?.settings?.showFormulaInsteadOfPlays ?? false
  );

  return (
    <Card shadow="md" p="md" mb="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
      <Group>
        <Text fw={700} size="md">{t('charts.weekNumber')}: {weekNumber}</Text>
        <Text size="xs" c="dimmed">{formatWeekDate(week)}</Text>
        {hasAllKill && (
          <Badge color="gold" variant="filled" size="sm">All-Kill</Badge>
        )}
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Flex direction="column" gap="md">
        {top1.map(item => {
          let icon = <IconMusic size={18} />;
          if (item.type === 'artist') icon = <IconMicrophone size={18} />;
          if (item.type === 'album') icon = <IconDisc size={18} />;
          
          return (
            <Grid key={item.type} align="center" gutter="xs">
              <Grid.Col span="content">
                <Flex align="center" justify="center">
                  {icon}
                </Flex>
              </Grid.Col>
              <Grid.Col span="content">
                <SpotifyImageWithModal
                  entityId={item.entityId}
                  name={item.name}
                  artistName={item.artistName}
                  type={item.type}
                  clientId={SPOTIFY_TOKEN}
                  clientSecret={SPOTIFY_SECRET}
                  width={32}
                  height={32}
                  borderRadius={4}
                />
              </Grid.Col>
              <Grid.Col span="auto">
                <Box style={{ minWidth: 0 }}>
                  <Text fw={700} size="sm" style={{ lineHeight: 1.3 }}>{item.name}</Text>
                  {item.artistName && (
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>{item.artistName}</Text>
                  )}
                </Box>
              </Grid.Col>
              {/* Placeholder for plays/sales - will be fetched dynamically */}
              <Grid.Col span="content">
                <Box style={{ minWidth: 80, textAlign: 'right' }}>
                  <Text size="xs" c="dimmed">
                    {/* Will add plays/sales data here */}
                  </Text>
                </Box>
              </Grid.Col>
              <Grid.Col span="content">
                <ActionIcon
                  variant="light"
                  onClick={() => navigate(`/charts/week/${week}/${item.type}`)}
                  aria-label={t('charts.view')}
                  size="sm"
                >
                  <IconChevronRight size={16} />
                </ActionIcon>
              </Grid.Col>
            </Grid>
          );
        })}
      </Flex>
    </Card>
  );
};
