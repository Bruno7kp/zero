import React from 'react';
import { Button, Radio, Stack, Text, ColorPicker } from '@mantine/core';
import { IconDownload, IconCopy, IconCheck } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import { generatePlainTextChart } from './utils/shareUtils';

interface ShareOptionsProps {
  t: (k: any, options?: any) => string;
  selectedType: 'grid' | 'stories' | 'stories2' | 'completo' | 'text';
  setSelectedType: (type: 'grid' | 'stories' | 'stories2' | 'completo' | 'text') => void;
  selectedGridSize: 3 | 4 | 5;
  setSelectedGridSize: (size: 3 | 4 | 5) => void;
  selectedStoriesTop: 5 | 10;
  setSelectedStoriesTop: (top: 5 | 10) => void;
  selectedStories2Top: 5 | 10;
  setSelectedStories2Top: (top: 5 | 10) => void;
  selectedStories2BackgroundType: 'blur' | 'solid';
  setSelectedStories2BackgroundType: (type: 'blur' | 'solid') => void;
  selectedStories2BackgroundColor: string;
  setSelectedStories2BackgroundColor: (color: string) => void;
  selectedStories2ShowPlays: 'last' | 'plays' | 'peak' | 'weeks';
  setSelectedStories2ShowPlays: (show: 'last' | 'plays' | 'peak' | 'weeks') => void;
  chartData: any[];
  previewImageUrl: string | null;
  isLoading: boolean;
  chartName: string;
  week: string | undefined;
  weekNumber: number | null;
  chartType: 'artist' | 'album' | 'track';
  statsMap: any;
  handleDownload: () => void;
}

export const ShareOptions: React.FC<ShareOptionsProps> = ({
  t,
  selectedType,
  setSelectedType,
  selectedGridSize,
  setSelectedGridSize,
  selectedStoriesTop,
  setSelectedStoriesTop,
  selectedStories2Top,
  setSelectedStories2Top,
  selectedStories2BackgroundType,
  setSelectedStories2BackgroundType,
  selectedStories2BackgroundColor,
  setSelectedStories2BackgroundColor,
  selectedStories2ShowPlays,
  setSelectedStories2ShowPlays,
  chartData,
  previewImageUrl,
  isLoading,
  chartName,
  week,
  weekNumber,
  chartType,
  statsMap,
  handleDownload,
}) => {
  const clipboard = useClipboard({ timeout: 2000 });

  return (
    <Stack>
      <Text size="sm" fw={500}>{t('charts.share.selectType', 'Selecionar tipo')}</Text>
      <Radio.Group value={selectedType} onChange={(value) => setSelectedType(value as any)}>
        <Radio value="stories" label={t('charts.share.stories', 'Stories')} />
        <Radio value="stories2" label={t('charts.share.stories2', 'Stories 2')} />
        <Radio value="grid" label={t('charts.share.grid', 'Grid')} />
        <Radio value="completo" label={t('charts.share.completo', 'Completo')} />
        <Radio value="text" label={t('charts.share.text', 'Text')} />
      </Radio.Group>
      
      {selectedType === 'grid' && (
        <div>
          <Text size="sm" fw={500} mt="sm">{t('charts.share.gridSize', 'Grid Size')}</Text>
          <Radio.Group value={selectedGridSize.toString()} onChange={(value) => setSelectedGridSize(parseInt(value) as 3 | 4 | 5)}>
            <Radio value="3" label="3x3" disabled={chartData.length < 9} />
            <Radio value="4" label="4x4" disabled={chartData.length < 16} />
            <Radio value="5" label="5x5" disabled={chartData.length < 25} />
          </Radio.Group>
        </div>
      )}
      
      {selectedType === 'stories' && (
        <div>
          <Text size="sm" fw={500} mt="sm">{t('charts.share.storiesTop', 'Top Count')}</Text>
          <Radio.Group value={selectedStoriesTop.toString()} onChange={(value) => setSelectedStoriesTop(parseInt(value) as 5 | 10)}>
            <Radio value="5" label="Top 5" />
            <Radio value="10" label="Top 10" disabled={chartData.length < 10} />
          </Radio.Group>
        </div>
      )}
      
      {selectedType === 'stories2' && (
        <div>
          <Text size="sm" fw={500} mt="sm">{t('charts.share.storiesTop', 'Top Count')}</Text>
          <Radio.Group value={selectedStories2Top.toString()} onChange={(value) => setSelectedStories2Top(parseInt(value) as 5 | 10)}>
            <Radio value="5" label="Top 5" />
            <Radio value="10" label="Top 10" disabled={chartData.length < 10} />
          </Radio.Group>
          
          <Text size="sm" fw={500} mt="sm">{t('charts.share.backgroundType', 'Background Type')}</Text>
          <Radio.Group value={selectedStories2BackgroundType} onChange={(value) => setSelectedStories2BackgroundType(value as 'blur' | 'solid')}>
            <Radio value="blur" label={t('charts.share.backgroundBlur', 'Blurred Image')} />
            <Radio value="solid" label={t('charts.share.backgroundSolid', 'Solid Color')} />
          </Radio.Group>
          
          {selectedStories2BackgroundType === 'solid' && (
            <div style={{ marginTop: '12px' }}>
              <Text size="sm" fw={500} mb="xs">{t('charts.share.backgroundColor', 'Background Color')}</Text>
              <ColorPicker
                value={selectedStories2BackgroundColor}
                onChange={setSelectedStories2BackgroundColor}
                size="lg"
                format="hex"
                swatches={[
                  // Grays
                  '#1a1a1a', '#666666', '#f5f5f5',
                  
                  // Greens
                  '#117e39', '#22c55e',
                  
                  // Reds/Pinks
                  '#a31818', '#f088be',
                  
                  // Blues
                  '#070049', '#2563eb', '#60a5fa',
                  
                  // Yellows/Oranges
                  '#e66109', '#fbbf24',
                  
                  // Purples
                  '#7d0eb1', '#c4b5fd'
                ]}
              />
            </div>
          )}
          
          <Text size="sm" fw={500} mt="sm">{t('charts.share.showColumn', 'Show Column')}</Text>
          <Radio.Group value={selectedStories2ShowPlays} onChange={(value) => setSelectedStories2ShowPlays(value as 'last' | 'plays' | 'peak' | 'weeks')}>
            <Radio value="last" label={t('charts.share.lastPosition', 'Last Position')} />
            <Radio value="plays" label={t('charts.share.plays', 'Plays')} />
            <Radio value="peak" label={t('charts.share.peak', 'Peak')} />
            <Radio value="weeks" label={t('charts.share.weeks', 'Weeks')} />
          </Radio.Group>
        </div>
      )}
      
      <Button
        leftSection={selectedType === 'text' ? (clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />) : <IconDownload size={16} />}
        onClick={selectedType === 'text' ? () => clipboard.copy(generatePlainTextChart(t, chartData, chartName, week, weekNumber, chartType, statsMap)) : handleDownload}
        mt="md"
        disabled={selectedType !== 'text' && (!previewImageUrl || isLoading)}
        color={selectedType === 'text' && clipboard.copied ? 'teal' : 'blue'}
      >
        {selectedType === 'text' ? (clipboard.copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')) : (isLoading ? 'Gerando imagem...' : t('charts.share.download', 'Download'))}
      </Button>
    </Stack>
  );
};