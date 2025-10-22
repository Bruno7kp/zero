import React from 'react';
import { Button, Accordion, Box } from '@mantine/core';
import { IconDownload, IconCopy, IconCheck, IconPhoto } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import { generatePlainTextChart } from './utils/shareUtils';
import {
  ShareTypeSelector,
  GridSettings,
  StoriesSettings,
  Stories2Settings,
  CompletoSettings,
} from './share';

interface ShareOptionsProps {
  t: (k: any, options?: any) => string;
  selectedType: 'grid' | 'stories' | 'stories2' | 'completo' | 'text';
  setSelectedType: (type: 'grid' | 'stories' | 'stories2' | 'completo' | 'text') => void;
  selectedGridSize: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  setSelectedGridSize: (size: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => void;
  selectedGridShowText: boolean;
  setSelectedGridShowText: (show: boolean) => void;
  selectedGridShowVariationIcons: boolean;
  setSelectedGridShowVariationIcons: (show: boolean) => void;
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
  selectedStories2ListWrapBackgroundType: 'transparent' | 'solid';
  setSelectedStories2ListWrapBackgroundType: (type: 'transparent' | 'solid') => void;
  selectedStories2ListWrapBackgroundColor: string;
  setSelectedStories2ListWrapBackgroundColor: (color: string) => void;
  selectedStories2ShowAlbumCovers: boolean;
  setSelectedStories2ShowAlbumCovers: (show: boolean) => void;
  selectedStories2ShowColoredIcons: boolean;
  setSelectedStories2ShowColoredIcons: (show: boolean) => void;
  selectedStories2ShowIconBackground: boolean;
  setSelectedStories2ShowIconBackground: (show: boolean) => void;
  selectedCompletoBackgroundColor: string;
  setSelectedCompletoBackgroundColor: (color: string) => void;
  selectedCompletoTop: string;
  setSelectedCompletoTop: (top: string) => void;
  selectedCompletoShowColoredIcons: boolean;
  setSelectedCompletoShowColoredIcons: (show: boolean) => void;
  selectedCompletoColumns: string[];
  setSelectedCompletoColumns: (columns: string[]) => void;
  selectedCompletoCustomHeaderImage: string;
  setSelectedCompletoCustomHeaderImage: (url: string) => void;
  isAllowedImageDomain: (url: string) => boolean;
  chartType: 'artist' | 'album' | 'track';
  chartData: any[];
  previewImageUrl: string | null;
  isLoading: boolean;
  chartName: string;
  week: string | undefined;
  weekNumber: number | null;
  statsMap: any;
  handleDownload: () => void;
  onUpdatePreview?: () => void;
}

export const ShareOptions: React.FC<ShareOptionsProps> = ({
  t,
  selectedType,
  setSelectedType,
  selectedGridSize,
  setSelectedGridSize,
  selectedGridShowText,
  setSelectedGridShowText,
  selectedGridShowVariationIcons,
  setSelectedGridShowVariationIcons,
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
  selectedStories2ListWrapBackgroundType,
  setSelectedStories2ListWrapBackgroundType,
  selectedStories2ListWrapBackgroundColor,
  setSelectedStories2ListWrapBackgroundColor,
  selectedStories2ShowAlbumCovers,
  setSelectedStories2ShowAlbumCovers,
  selectedStories2ShowColoredIcons,
  setSelectedStories2ShowColoredIcons,
  selectedStories2ShowIconBackground,
  setSelectedStories2ShowIconBackground,
  selectedCompletoBackgroundColor,
  setSelectedCompletoBackgroundColor,
  selectedCompletoTop,
  setSelectedCompletoTop,
  selectedCompletoShowColoredIcons,
  setSelectedCompletoShowColoredIcons,
  selectedCompletoColumns,
  setSelectedCompletoColumns,
  selectedCompletoCustomHeaderImage,
  setSelectedCompletoCustomHeaderImage,
  isAllowedImageDomain,
  chartType,
  chartData,
  previewImageUrl,
  isLoading,
  chartName,
  week,
  weekNumber,
  statsMap,
  handleDownload,
  onUpdatePreview,
}) => {
  const clipboard = useClipboard({ timeout: 2000 });

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        <Accordion multiple variant="separated" radius="md">
          <ShareTypeSelector
            t={t}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />

          {selectedType === 'grid' && (
            <GridSettings
              t={t}
              selectedGridSize={selectedGridSize}
              setSelectedGridSize={setSelectedGridSize}
              selectedGridShowText={selectedGridShowText}
              setSelectedGridShowText={setSelectedGridShowText}
              selectedGridShowVariationIcons={selectedGridShowVariationIcons}
              setSelectedGridShowVariationIcons={setSelectedGridShowVariationIcons}
              chartData={chartData}
            />
          )}

          {selectedType === 'stories' && (
            <StoriesSettings
              t={t}
              selectedStoriesTop={selectedStoriesTop}
              setSelectedStoriesTop={setSelectedStoriesTop}
              chartData={chartData}
            />
          )}

          {selectedType === 'stories2' && (
            <Stories2Settings
              t={t}
              selectedStories2Top={selectedStories2Top}
              setSelectedStories2Top={setSelectedStories2Top}
              selectedStories2BackgroundType={selectedStories2BackgroundType}
              setSelectedStories2BackgroundType={setSelectedStories2BackgroundType}
              selectedStories2BackgroundColor={selectedStories2BackgroundColor}
              setSelectedStories2BackgroundColor={setSelectedStories2BackgroundColor}
              selectedStories2ShowPlays={selectedStories2ShowPlays}
              setSelectedStories2ShowPlays={setSelectedStories2ShowPlays}
              selectedStories2ListWrapBackgroundType={selectedStories2ListWrapBackgroundType}
              setSelectedStories2ListWrapBackgroundType={setSelectedStories2ListWrapBackgroundType}
              selectedStories2ListWrapBackgroundColor={selectedStories2ListWrapBackgroundColor}
              setSelectedStories2ListWrapBackgroundColor={setSelectedStories2ListWrapBackgroundColor}
              selectedStories2ShowAlbumCovers={selectedStories2ShowAlbumCovers}
              setSelectedStories2ShowAlbumCovers={setSelectedStories2ShowAlbumCovers}
              selectedStories2ShowColoredIcons={selectedStories2ShowColoredIcons}
              setSelectedStories2ShowColoredIcons={setSelectedStories2ShowColoredIcons}
              selectedStories2ShowIconBackground={selectedStories2ShowIconBackground}
              setSelectedStories2ShowIconBackground={setSelectedStories2ShowIconBackground}
              chartData={chartData}
            />
          )}

          {selectedType === 'completo' && (
            <CompletoSettings
              t={t}
              selectedCompletoBackgroundColor={selectedCompletoBackgroundColor}
              setSelectedCompletoBackgroundColor={setSelectedCompletoBackgroundColor}
              selectedCompletoTop={selectedCompletoTop}
              setSelectedCompletoTop={setSelectedCompletoTop}
              selectedCompletoShowColoredIcons={selectedCompletoShowColoredIcons}
              setSelectedCompletoShowColoredIcons={setSelectedCompletoShowColoredIcons}
              selectedCompletoColumns={selectedCompletoColumns}
              setSelectedCompletoColumns={setSelectedCompletoColumns}
              selectedCompletoCustomHeaderImage={selectedCompletoCustomHeaderImage}
              setSelectedCompletoCustomHeaderImage={setSelectedCompletoCustomHeaderImage}
              isAllowedImageDomain={isAllowedImageDomain}
              chartData={chartData}
            />
          )}
        </Accordion>

        {selectedType !== 'text' && onUpdatePreview && (
          <Button
            leftSection={<IconPhoto size={16} />}
            onClick={onUpdatePreview}
            fullWidth
            disabled={isLoading}
            variant="light"
            mt="md"
          >
            {isLoading ? t('charts.share.generating', 'Generating...') : t('charts.share.updatePreview', 'Update Preview')}
          </Button>
        )}

        <Button
          leftSection={selectedType === 'text' ? (clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />) : <IconDownload size={16} />}
          onClick={selectedType === 'text' ? () => clipboard.copy(generatePlainTextChart(t, chartData, chartName, week, weekNumber, chartType, statsMap)) : handleDownload}
          fullWidth
          disabled={selectedType !== 'text' && (!previewImageUrl || isLoading)}
          color={selectedType === 'text' && clipboard.copied ? 'teal' : 'blue'}
          mt="md"
        >
          {selectedType === 'text' ? (clipboard.copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')) : (isLoading ? t('charts.share.generatingImage', 'Generating image...') : t('charts.share.download', 'Download'))}
        </Button>
      </Box>
    </Box>
  );
};