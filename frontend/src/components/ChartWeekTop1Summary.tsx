import React, { useEffect, useState } from 'react';
import { db } from '../db/indexedDb';
import { Button, Card, Group, Text, Flex, Divider, Grid, rem, ThemeIcon } from '@mantine/core';
import {
    IconMicrophone,
    IconDisc,
    IconMusic,
    IconChevronRight,
    IconListNumbers
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

interface ChartWeekTop1SummaryProps {
  chartId: string;
  week?: string;
}

export const ChartWeekTop1Summary: React.FC<ChartWeekTop1SummaryProps> = ({ chartId, week }) => {
  const [top1, setTop1] = useState<{ type: string; name: string; artistName: string; entityId: string }[]>([]);
  const [weekStr, setWeekStr] = useState<string | undefined>(week);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchTop1() {
      // Descobre a semana mais recente se não informada
      let targetWeek = weekStr;
      if (!targetWeek) {
        const all = await db.charts_data
          .where('chartId')
          .equals(chartId)
          .toArray();
        const weeks = Array.from(new Set(all.map(i => i.week))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        targetWeek = weeks[0];
        setWeekStr(targetWeek);
      }
      if (!targetWeek) return;
      // Busca o #1 de cada tipo
      const types = ['artist', 'album', 'track'];
      const results = await Promise.all(
        types.map(async (type) => {
          const recs = await db.charts_data
            .where(['chartId', 'chartType', 'week'])
            .equals([chartId, type, targetWeek!])
            .toArray();
          const top = recs.find(r => r.rank === 1);
          return top ? { type, name: top.name, artistName: top.artistName, entityId: top.entityId } : null;
        })
      );
      setTop1(results.filter(Boolean) as any);
    }
    fetchTop1();
  }, [chartId, weekStr]);

        if (!weekStr || !top1 || top1.length === 0) {
            return (
                <Card shadow="md" p="md">
                    <Group>
                        <ThemeIcon variant="light" size="md">
                            <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        <Text fw={600} size="lg">{t('charts.lastWeek')}</Text>
                    </Group>
                    <Divider variant="dashed" size="sm" my="xs"/>
                    <Flex direction="column" gap="md">
                        <Text c="dimmed" size="sm" style={{ textAlign: 'center' }}>
                            {t('errors.noTop1Data')}
                        </Text>
                    </Flex>
                </Card>
            );
        }

  return (
      <Card shadow="md" p="md">
          <Group>
              <ThemeIcon variant="light" size="md">
                  <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
              </ThemeIcon>
              <Text fw={600} size="lg">{t('charts.lastWeek')}</Text>
          </Group>
          <Divider variant="dashed" size="sm" my="xs"/>
          <Flex direction="column" gap="md">
              {top1.map(item => {
                  let icon = <IconMusic size={18} />;
                  if (item.type === 'artist') {
                      icon = <IconMicrophone size={18} />;
                  }
                  if (item.type === 'album') {
                      icon = <IconDisc size={18} />;
                  }

                  return (
                      <Grid key={item.type} grow align="center" gutter="xs">
                          <Grid.Col span="auto">
                              <Flex align="center" justify="center">
                                  {icon}
                              </Flex>
                          </Grid.Col>
                          <Grid.Col span="auto">
                              <div style={{
                                  width: '40px',
                                  height: '40px',
                                  backgroundColor: 'var(--mantine-color-gray-1)',
                                  borderRadius: '4px'
                              }} />
                          </Grid.Col>
                          <Grid.Col span={6}>
                              <Text fw={700} size="sm" style={{ lineHeight: 1.3 }}>
                                  {item.name}
                              </Text>
                              {item.artistName && (
                                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                                      {item.artistName}
                                  </Text>
                              )}
                          </Grid.Col>
                          <Grid.Col span="auto">
                              <Flex justify="flex-end">
                                  <Button
                                      component={Link}
                                      to={`/charts/week/${weekStr}/${item.type}`}
                                      size="xs"
                                      variant="light"
                                      aria-label={t('charts.view')}
                                  >
                                      <IconChevronRight size={18} />
                                  </Button>
                              </Flex>
                          </Grid.Col>
                      </Grid>
                  );
              })}
          </Flex>
          <Divider variant="dashed" size="sm" my="xs"/>
          <Group justify="center" align="center">
              <Button
                  component={Link}
                  to={`/charts`}
                  size="sm"
                  fullWidth
                  variant="light"
                  aria-label={t('charts.viewAll')}
              >
                  {t('charts.viewAll')}
              </Button>
          </Group>
      </Card>
  );
};
