import React, { useState } from 'react';
import { Menu, ActionIcon, Modal, Text, Button, Box, Textarea, Group } from '@mantine/core';
import { IconShare, IconCopy, IconCheck } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';

interface ShareMenuProps {
  t: (k: any, options?: any) => string;
  chartData: any[];
  chartName: string;
  week: string | undefined;
  weekNumber: number | null;
  disabled?: boolean;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ t, chartData, chartName, week, disabled }) => {
  const [modalOpened, setModalOpened] = useState(false);
  const clipboard = useClipboard({ timeout: 2000 });

  const generatePlainTextChart = () => {
    if (!chartData || chartData.length === 0 || !week) {
      return t('charts.share.noData', 'No data available');
    }

    const lines: string[] = [];
    
    // Header - format: "ChartName :: Type - Week N"
    lines.push(`${chartName}`);
    
    // Column headers with separator
    const headers = [
      t('charts.share.position', 'Posição'),
      t('charts.share.nameArtist', 'Nome | Artista'),
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
      
      const deltaPlays = row.deltaPlays;
      let playsStr = `${row.plays || 0}`;
      if (typeof deltaPlays === 'number' && deltaPlays !== 0) {
        const percent = row.previousPlays ? ((deltaPlays / row.previousPlays) * 100).toFixed(2) : '0';
        playsStr += ` (${deltaPlays > 0 ? '+' : ''}${percent}%)`;
      }
      
      // Format: rank (delta) | name - artist | plays (change) | peak | weeks
      const nameArtist = row.artistName ? `${row.name} - ${row.artistName}` : row.name || '';
      
      const rowData = [
        `${row.rank}${deltaStr}`,
        nameArtist,
        playsStr,
        row.peak || '',
        row.totalWeeks || ''
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
            minRows={10}
            maxRows={20}
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
    </>
  );
};

export default ShareMenu;
