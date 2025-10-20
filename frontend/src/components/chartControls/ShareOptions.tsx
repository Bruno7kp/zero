import React from 'react';
import { Button, Radio, Stack, Text, ColorPicker, Accordion, Flex, Box } from '@mantine/core';
import { IconDownload, IconCopy, IconCheck, IconShare, IconSettings, IconPhoto, IconGridDots } from '@tabler/icons-react';
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
  chartType: 'artist' | 'album' | 'track';
  chartData: any[];
  previewImageUrl: string | null;
  isLoading: boolean;
  chartName: string;
  week: string | undefined;
  weekNumber: number | null;
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
  chartType,
  chartData,
  previewImageUrl,
  isLoading,
  chartName,
  week,
  weekNumber,
  statsMap,
  handleDownload,
}) => {
  const clipboard = useClipboard({ timeout: 2000 });

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        <Accordion multiple variant="separated" radius="md">
          {/* Tipo de Compartilhamento */}
          <Accordion.Item value="type">
            <Accordion.Control>
              <Flex direction="column" gap={2}>
                <Flex align="center" gap={8}><IconShare size={16} /><Text fw={600}>{t('charts.share.selectType', 'Select Type')}</Text></Flex>
                <Text size="xs" c="dimmed">{t('charts.share.selectTypeDescription', 'Choose the format for sharing your chart')}</Text>
              </Flex>
            </Accordion.Control>
            <Accordion.Panel>
              <Radio.Group value={selectedType} onChange={(value) => setSelectedType(value as any)}>
                <Stack gap="xs">
                  <Radio value="stories2" label={t('charts.share.stories2', 'Stories 2')} />
                  <Radio value="stories" label={t('charts.share.stories', 'Stories')} />
                  <Radio value="grid" label={t('charts.share.grid', 'Grid')} />
                  <Radio value="completo" label={t('charts.share.completo', 'Complete')} />
                  <Radio value="text" label={t('charts.share.text', 'Text')} />
                </Stack>
              </Radio.Group>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Configurações do Grid */}
          {selectedType === 'grid' && (
            <Accordion.Item value="grid-settings">
              <Accordion.Control>
                <Flex direction="column" gap={2}>
                  <Flex align="center" gap={8}><IconGridDots size={16} /><Text fw={600}>{t('charts.share.gridSize', 'Grid Size')}</Text></Flex>
                  <Text size="xs" c="dimmed">{t('charts.share.gridSizeDescription', 'Select the grid dimensions')}</Text>
                </Flex>
              </Accordion.Control>
              <Accordion.Panel>
                <Radio.Group value={selectedGridSize.toString()} onChange={(value) => setSelectedGridSize(parseInt(value) as 3 | 4 | 5)}>
                  <Stack gap="xs">
                    <Radio value="3" label="3x3" disabled={chartData.length < 9} />
                    <Radio value="4" label="4x4" disabled={chartData.length < 16} />
                    <Radio value="5" label="5x5" disabled={chartData.length < 25} />
                  </Stack>
                </Radio.Group>
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {/* Configurações do Stories */}
          {selectedType === 'stories' && (
            <Accordion.Item value="stories-settings">
              <Accordion.Control>
                <Flex direction="column" gap={2}>
                  <Flex align="center" gap={8}><IconPhoto size={16} /><Text fw={600}>{t('charts.share.storiesTop', 'Top Count')}</Text></Flex>
                  <Text size="xs" c="dimmed">{t('charts.share.storiesTopDescription', 'Number of items to include')}</Text>
                </Flex>
              </Accordion.Control>
              <Accordion.Panel>
                <Radio.Group value={selectedStoriesTop.toString()} onChange={(value) => setSelectedStoriesTop(parseInt(value) as 5 | 10)}>
                  <Stack gap="xs">
                    <Radio value="5" label="Top 5" />
                    <Radio value="10" label="Top 10" disabled={chartData.length < 10} />
                  </Stack>
                </Radio.Group>
              </Accordion.Panel>
            </Accordion.Item>
          )}

          {/* Configurações do Stories 2 */}
          {selectedType === 'stories2' && (
            <Accordion.Item value="stories2-settings">
              <Accordion.Control>
                <Flex direction="column" gap={2}>
                  <Flex align="center" gap={8}><IconSettings size={16} /><Text fw={600}>{t('charts.share.stories2Settings', 'Stories 2 Settings')}</Text></Flex>
                  <Text size="xs" c="dimmed">{t('charts.share.stories2SettingsDescription', 'Customize appearance and data display')}</Text>
                </Flex>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <div>
                    <Text size="sm" fw={500} mb="xs">{t('charts.share.storiesTop', 'Top Count')}</Text>
                    <Radio.Group value={selectedStories2Top.toString()} onChange={(value) => setSelectedStories2Top(parseInt(value) as 5 | 10)}>
                      <Stack gap="xs">
                        <Radio value="5" label="Top 5" />
                        <Radio value="10" label="Top 10" disabled={chartData.length < 10} />
                      </Stack>
                    </Radio.Group>
                  </div>

                  <div>
                    <Text size="sm" fw={500} mb="xs">{t('charts.share.backgroundType', 'Background Type')}</Text>
                    <Radio.Group value={selectedStories2BackgroundType} onChange={(value) => setSelectedStories2BackgroundType(value as 'blur' | 'solid')}>
                      <Stack gap="xs">
                        <Radio value="blur" label={t('charts.share.backgroundBlur', 'Blurred Image')} />
                        <Radio value="solid" label={t('charts.share.backgroundSolid', 'Solid Color')} />
                      </Stack>
                    </Radio.Group>
                  </div>

                  {selectedStories2BackgroundType === 'solid' && (
                    <div>
                      <Text size="sm" fw={500} mb="xs">{t('charts.share.backgroundColor', 'Background Color')}</Text>
                      <ColorPicker
                        value={selectedStories2BackgroundColor}
                        onChange={setSelectedStories2BackgroundColor}
                        size="lg"
                        format="hex"
                        swatches={[
                          '#1a1a1a', '#666666', '#f5f5f5',
                          '#117e39', '#22c55e',
                          '#a31818', '#f088be',
                          '#070049', '#2563eb', '#60a5fa',
                          '#e66109', '#fbbf24',
                          '#7d0eb1', '#c4b5fd'
                        ]}
                      />
                    </div>
                  )}

                  <div>
                    <Text size="sm" fw={500} mb="xs">{t('charts.share.showColumn', 'Show Column')}</Text>
                    <Radio.Group value={selectedStories2ShowPlays} onChange={(value) => setSelectedStories2ShowPlays(value as 'last' | 'plays' | 'peak' | 'weeks')}>
                      <Stack gap="xs">
                        <Radio value="last" label={t('charts.share.lastPosition', 'Last Position')} />
                        <Radio value="plays" label={t('charts.share.plays', 'Plays')} />
                        <Radio value="peak" label={t('charts.share.peak', 'Peak')} />
                        <Radio value="weeks" label={t('charts.share.weeks', 'Weeks')} />
                      </Stack>
                    </Radio.Group>
                  </div>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>
      </Box>

      <Box style={{ flexShrink: 0, paddingTop: 'var(--mantine-spacing-md)' }}>
        <Button
          leftSection={selectedType === 'text' ? (clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />) : <IconDownload size={16} />}
          onClick={selectedType === 'text' ? () => clipboard.copy(generatePlainTextChart(t, chartData, chartName, week, weekNumber, chartType, statsMap)) : handleDownload}
          fullWidth
          disabled={selectedType !== 'text' && (!previewImageUrl || isLoading)}
          color={selectedType === 'text' && clipboard.copied ? 'teal' : 'blue'}
        >
          {selectedType === 'text' ? (clipboard.copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')) : (isLoading ? 'Generating image...' : t('charts.share.download', 'Download'))}
        </Button>
      </Box>
    </Box>
  );
};