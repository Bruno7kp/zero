import React, { useMemo, useState, useEffect } from 'react';
import {
  ActionIcon,
  Badge,
  Card,
  Collapse,
  Divider,
  Grid,
  Group,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  IconTrophy,
  IconCrown,
  IconTarget,
  IconBolt,
  IconRocket,
  IconMedal,
  IconLock,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { getSecondaryCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import storage from '../../utils/storage';
import KEYS from '../../constants/storageKeys';

interface AlbumAchievementsProps {
  stats: {
    totalWeeks?: number;
    peak?: number;
    totalPoints?: number;
    totalPlays?: number;
  };
  chartRun: Array<{ week: string; position: number | null; plays: number }>;
  background?: string;
}

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
  color: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export const AlbumAchievements: React.FC<AlbumAchievementsProps> = ({
  stats,
  chartRun,
  background,
}) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');

  // Collapse state with localStorage persistence
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return storage.getJson<boolean>(KEYS.ALBUM_ACHIEVEMENTS_COLLAPSED, [], false) ?? false;
  });

  useEffect(() => {
    storage.setJson(KEYS.ALBUM_ACHIEVEMENTS_COLLAPSED, collapsed);
  }, [collapsed]);

  const achievements = useMemo<Achievement[]>(() => {
    const result: Achievement[] = [];
    const totalWeeks = stats.totalWeeks || 0;
    const totalPoints = stats.totalPoints || 0;

    // Row 1: Top 10 / First #1 / Chart Dominator

    // 1. Rising Star - Reach top 10 (Common)
    const peakPosition = stats.peak ?? 999;
    const hasRisingStar = peakPosition <= 10;
    result.push({
      id: 'rising-star',
      icon: <IconRocket size={24} />,
      title: t('library.achievements.album.risingStar'),
      description: hasRisingStar
        ? t('library.achievements.album.risingStarDesc', { rank: peakPosition, target: 10 })
        : t('library.achievements.album.risingStarLocked', { target: 10 }),
      unlocked: hasRisingStar,
      color: 'pink',
      rarity: 'common',
    });

    // 2. First #1 Achievement (Rare)
    const hasNumberOne = stats.peak === 1;
    const weeksToFirst = chartRun.findIndex(r => r.position === 1) + 1;
    result.push({
      id: 'first-number-one',
      icon: <IconCrown size={24} />,
      title: t('library.achievements.album.firstNumberOne'),
      description: hasNumberOne
        ? t('library.achievements.album.firstNumberOneDesc', { weeks: weeksToFirst })
        : t('library.achievements.album.firstNumberOneLocked'),
      unlocked: hasNumberOne,
      color: 'yellow',
      rarity: 'rare',
    });

    // 3. Chart Dominator - 5+ weeks at #1 (Epic)
    const weeksAtOne = chartRun.filter(r => r.position === 1).length;
    const hasDominator = weeksAtOne >= 5;
    result.push({
      id: 'chart-dominator',
      icon: <IconTrophy size={24} />,
      title: t('library.achievements.album.chartDominator'),
      description: hasDominator
        ? t('library.achievements.album.chartDominatorDesc', { weeks: weeksAtOne, target: 5 })
        : t('library.achievements.album.chartDominatorProgress', {
            current: weeksAtOne,
            target: 5,
          }),
      unlocked: hasDominator,
      progress: Math.min(weeksAtOne, 5),
      total: 5,
      color: 'red',
      rarity: 'epic',
    });

    // Row 2: Consistency / Veteran / Century Club

    // 4. Consistency King - 10+ consecutive weeks in chart (Rare)
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    const sortedRun = [...chartRun].sort((a, b) => a.week.localeCompare(b.week));

    for (let i = 0; i < sortedRun.length; i++) {
      const position = sortedRun[i].position;
      if (i === 0 || (position !== null && position <= 100)) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    const hasConsistency = maxConsecutive >= 10;
    result.push({
      id: 'consistency-king',
      icon: <IconBolt size={24} />,
      title: t('library.achievements.album.consistencyKing'),
      description: hasConsistency
        ? t('library.achievements.album.consistencyKingDesc', { weeks: maxConsecutive, target: 10 })
        : t('library.achievements.album.consistencyKingProgress', {
            current: maxConsecutive,
            target: 10,
          }),
      unlocked: hasConsistency,
      progress: Math.min(maxConsecutive, 10),
      total: 10,
      color: 'grape',
      rarity: 'rare',
    });

    // 5. Veteran - 1 year (52 weeks) in charts (Epic)
    const hasVeteran = totalWeeks >= 52;
    result.push({
      id: 'veteran',
      icon: <IconMedal size={24} />,
      title: t('library.achievements.album.veteran'),
      description: hasVeteran
        ? t('library.achievements.album.veteranDesc', { weeks: totalWeeks, target: 52 })
        : t('library.achievements.album.veteranProgress', {
            current: totalWeeks,
            target: 52,
          }),
      unlocked: hasVeteran,
      progress: Math.min(totalWeeks, 52),
      total: 52,
      color: 'teal',
      rarity: 'epic',
    });

    // Row 3: Point Master

    // 6. Point Master - 1000+ total points (Common)
    const hasPointMaster = totalPoints >= 1000;
    result.push({
      id: 'point-master',
      icon: <IconTarget size={24} />,
      title: t('library.achievements.album.pointMaster'),
      description: hasPointMaster
        ? t('library.achievements.album.pointMasterDesc', {
            points: totalPoints.toLocaleString(),
            target: (1000).toLocaleString(),
          })
        : t('library.achievements.album.pointMasterProgress', {
            current: totalPoints.toLocaleString(),
            target: (1000).toLocaleString(),
          }),
      unlocked: hasPointMaster,
      progress: Math.min(totalPoints, 1000),
      total: 1000,
      color: 'violet',
      rarity: 'common',
    });

    return result;
  }, [stats, chartRun, t]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return 'yellow';
      case 'epic':
        return 'violet';
      case 'rare':
        return 'blue';
      default:
        return 'gray';
    }
  };

  // Card background color using secondary background
  const cardBg = getSecondaryCardBackgroundByMode(theme, themeMode);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ background }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" mb={collapsed ? 0 : 'md'}>
          <Title order={3}>{t('library.achievements.title')}</Title>
          <Group gap="sm">
            <Badge size="lg" variant="gradient" gradient={{ from: 'teal', to: 'blue' }}>
              {unlockedCount}/{totalCount}
            </Badge>
            <ActionIcon variant="subtle" onClick={() => setCollapsed(!collapsed)} size="md">
              {collapsed ? <IconChevronDown size={20} /> : <IconChevronUp size={20} />}
            </ActionIcon>
          </Group>
        </Group>

        <Collapse in={!collapsed}>
          <Grid>
            {achievements.map(achievement => (
              <Grid.Col key={achievement.id} span={{ base: 12, sm: 6, md: 6 }}>
                <Card
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    opacity: achievement.unlocked ? 1 : 0.6,
                    position: 'relative',
                    backgroundColor: cardBg,
                  }}
                >
                  <Stack gap={0}>
                    {/* Top section: Icon and Title */}
                    <Group gap="sm" wrap="nowrap" align="center" mb="xs">
                      <ThemeIcon
                        size="lg"
                        radius="md"
                        variant={achievement.unlocked ? 'gradient' : 'light'}
                        gradient={{ from: achievement.color, to: achievement.color, deg: 45 }}
                        color={achievement.color}
                        style={{ flexShrink: 0 }}
                      >
                        {achievement.unlocked ? achievement.icon : <IconLock size={24} />}
                      </ThemeIcon>
                      <Text size="sm" fw={700} style={{ flex: 1 }}>
                        {achievement.title}
                      </Text>
                    </Group>

                    <Divider variant="dashed" size="sm" mb="xs" />

                    {/* Bottom section: Rarity badge and description */}
                    <Stack gap="xs">
                      {achievement.rarity && (
                        <Badge size="xs" variant="light" color={getRarityColor(achievement.rarity)}>
                          {t(`library.achievements.rarity.${achievement.rarity}`)}
                        </Badge>
                      )}
                      <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
                        {achievement.description}
                      </Text>

                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <Tooltip
                          label={`${achievement.progress} / ${achievement.total}`}
                          position="bottom"
                        >
                          <Progress
                            value={(achievement.progress / (achievement.total || 1)) * 100}
                            size="sm"
                            radius="xl"
                            color={achievement.color}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Collapse>
      </Stack>
    </Card>
  );
};
