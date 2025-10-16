import React, { useState } from 'react';
import { Menu, ActionIcon, Modal, Text, Button, Box, Textarea, Group } from '@mantine/core';
import { IconShare, IconCopy, IconCheck } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import { useSelector } from 'react-redux';
import ShareImageModal from './ShareImageModal';

interface ShareMenuProps {
  t: (k: any, options?: any) => string;
  chartData: any[];
  chartName: string;
  week: string | undefined;
  weekNumber: number | null;
  chartType: 'artist' | 'album' | 'track';
  disabled?: boolean;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ t, chartData, chartName, week, weekNumber, chartType, disabled }) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [shareModalOpened, setShareModalOpened] = useState(false);
  const clipboard = useClipboard({ timeout: 2000 });
  const statsMap = useSelector((state: any) => state.charts?.statsMap || {});

  const formatInteger = (value: number | null | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '0';
    return value.toLocaleString();
  };

  const parseNumeric = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const generatePlainTextChart = () => {
    if (!chartData || chartData.length === 0 || !week) {
      return t('charts.share.noData', 'No data available');
    }

    const lines: string[] = [];
    
    const typeLabel = (() => {
      if (chartType === 'artist') {
        return t('charts.share.topArtistsHeader', 'Top Artists');
      }
      if (chartType === 'album') {
        return t('charts.share.topAlbumsHeader', 'Top Albums');
      }
      if (chartType === 'track') {
        return t('charts.share.topTracksHeader', 'Top Tracks');
      }
      return '';
    })();

    const headerWeek = weekNumber
      ? t('charts.share.weekNumberLabel', { defaultValue: 'Week {{num}}', num: weekNumber })
      : (week ? t('charts.share.weekLabelFallback', { defaultValue: week, week }) : '');

    const header = typeLabel
      ? `${chartName} :: ${typeLabel}${headerWeek ? ` - ${headerWeek}` : ''}`
      : `${chartName}${headerWeek ? ` - ${headerWeek}` : ''}`;

    lines.push(header);
    
    // Column headers with separator
    const nameColumnLabel = chartType === 'artist'
      ? t('charts.share.artistColumn', 'Artista')
      : t('charts.share.nameArtist', 'Nome | Artista');

    const headers = [
      t('charts.share.position', 'Posição'),
      nameColumnLabel,
      t('charts.share.plays', 'Reproduções'),
      t('charts.share.peak', 'Pico'),
      t('charts.share.weeks', 'Semanas')
    ];
    lines.push(headers.join(' | '));
    
    // Data rows
    chartData.forEach((row) => {
      const deltaRank = row.deltaRank;
      let deltaStr = '';
      
      if (deltaRank === 'NEW') {
        deltaStr = ' (NEW)';
      } else if (deltaRank === 'RE') {
        deltaStr = ' (RE)';
      } else if (typeof deltaRank === 'number') {
        if (deltaRank > 0) {
          deltaStr = ` (+${deltaRank})`;
        } else if (deltaRank < 0) {
          deltaStr = ` (${deltaRank})`;
        } else {
          deltaStr = ' (=)';
        }
      }
      
      const deltaPlaysRaw = parseNumeric(row.deltaPlays) || 0;
      const playsValue = parseNumeric(row.plays) ?? 0;
      const previousPlays = playsValue - deltaPlaysRaw;
      const percentChange = previousPlays > 0 && deltaPlaysRaw !== 0
        ? (deltaPlaysRaw / previousPlays) * 100
        : null;
      const playsParts: string[] = [formatInteger(playsValue)];
      if (deltaPlaysRaw !== 0) {
        const percentLabel = percentChange !== null
          ? `${deltaPlaysRaw > 0 ? '+' : ''}${percentChange.toFixed(0)}%`
          : `${deltaPlaysRaw > 0 ? '+' : '-'}${formatInteger(Math.abs(deltaPlaysRaw))}`;
        playsParts.push(`(${percentLabel})`);
      }
      const playsStr = playsParts.join(' ');

      const stats = statsMap?.[row.entityId] || row.stats || {};
      const peakValue = stats?.peak?.position ?? row.peak ?? '';
      const weeksValue = stats?.totals?.withinCutoff ?? row.totalWeeks ?? '';
      
      // Format: rank (delta) | name - artist | plays (change) | peak | weeks
      const nameArtist = row.artistName ? `${row.name} - ${row.artistName}` : row.name || '';
      
      const rowData = [
        `${row.rank}${deltaStr}`,
        nameArtist,
        playsStr,
        peakValue !== null && peakValue !== undefined ? `${peakValue}` : '',
        weeksValue !== null && weeksValue !== undefined ? `${weeksValue}` : ''
      ];
      
      lines.push(rowData.join(' | '));
    });
    
    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = generatePlainTextChart();
    clipboard.copy(text);
  };

  return (
    <>
      <Menu withinPortal position="bottom" shadow="md" withArrow>
        <Menu.Target>
          <ActionIcon variant="subtle" aria-label={t('charts.share.title', 'Share')} ml={0} my="xs" disabled={disabled}>
            <IconShare size={18} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item 
            leftSection={<IconCopy size={16} />} 
            onClick={() => setModalOpened(true)}
          >
            {t('charts.share.copyChart', 'Copy chart')}
          </Menu.Item>
          <Menu.Item 
            leftSection={<IconShare size={16} />} 
            onClick={() => setShareModalOpened(true)}
          >
            {t('charts.share.shareChart', 'Compartilhar chart')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={t('charts.share.copyChartTitle', 'Copy chart as plain text')}
        size="lg"
        centered
      >
        <Box>
          <Text size="sm" c="dimmed" mb="md">
            {t('charts.share.copyChartDescription', 'Copy the chart below to share it as plain text.')}
          </Text>
          <Textarea
            value={generatePlainTextChart()}
            readOnly
            rows={22}
            maxRows={22}
            styles={{
              input: {
                fontFamily: 'monospace',
                fontSize: '12px',
              }
            }}
          />
          <Group justify="flex-end" mt="md">
            <Button 
              variant="default" 
              onClick={() => setModalOpened(false)}
            >
              {t('common.close', 'Close')}
            </Button>
            <Button 
              leftSection={clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              onClick={handleCopy}
              color={clipboard.copied ? 'teal' : 'blue'}
            >
              {clipboard.copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
            </Button>
          </Group>
        </Box>
      </Modal>

      <ShareImageModal
        t={t}
        chartData={chartData}
        chartName={chartName}
        week={week}
        weekNumber={weekNumber}
        chartType={chartType}
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
      />
    </>
  );
};

export default ShareMenu;
