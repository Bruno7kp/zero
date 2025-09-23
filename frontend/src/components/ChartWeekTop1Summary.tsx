import React, { useEffect, useState } from 'react';
import { db } from '../db/indexedDb';
import { Button, Card, Group, Text, Flex } from '@mantine/core';
import { IconMicrophone, IconDisc, IconMusic } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface ChartWeekTop1SummaryProps {
  chartId: string;
  week?: string;
}

export const ChartWeekTop1Summary: React.FC<ChartWeekTop1SummaryProps> = ({ chartId, week }) => {
  const [top1, setTop1] = useState<{ type: string; name: string; artistName: string; entityId: string }[]>([]);
  const [weekStr, setWeekStr] = useState<string | undefined>(week);

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

  if (!weekStr) return null;

  return (
    <Card shadow="xs" p="md" mb="md" withBorder>
      <Text fw={700} mb="xs">#1 da última semana ({weekStr}):</Text>
      <Group>
        {top1.map(item => {
          let icon = <IconMusic size={18} />;
          if (item.type === 'artist') icon = <IconMicrophone size={18} />;
          if (item.type === 'album') icon = <IconDisc size={18} />;
          return (
            <Flex key={item.type} direction="column" align="center" p="sm" style={{ minWidth: 120 }}>
              <Flex align="center" gap={6} mb={2}>{icon}<Text size="sm" fw={600}>{item.type === 'artist' ? 'Artista' : item.type === 'album' ? 'Álbum' : 'Música'}</Text></Flex>
              <Text fw={700} ta="center">{item.name}</Text>
              {item.artistName && <Text size="xs" ta="center">{item.artistName}</Text>}
              <Button
                component={Link}
                to={`/charts/week/${weekStr}/${item.type}`}
                size="xs"
                mt="xs"
                variant="light"
              >
                Ver chart
              </Button>
            </Flex>
          );
        })}
      </Group>
    </Card>
  );
};
