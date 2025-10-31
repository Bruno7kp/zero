import React from 'react';
import { Radio, Stack, Text, Accordion, Flex, ColorInput } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { COLOR_SWATCHES } from '../templates/utils/colorSwatches';

interface StoriesSettingsProps {
  t: (k: any, options?: any) => string;
  selectedStoriesTop: 5 | 10;
  setSelectedStoriesTop: (top: 5 | 10) => void;
  selectedStoriesPrimaryColor: string;
  setSelectedStoriesPrimaryColor: (color: string) => void;
  selectedStoriesHighlightColor: string;
  setSelectedStoriesHighlightColor: (color: string) => void;
  chartData: any[];
}

export const StoriesSettings: React.FC<StoriesSettingsProps> = ({
  t,
  selectedStoriesTop,
  setSelectedStoriesTop,
  selectedStoriesPrimaryColor,
  setSelectedStoriesPrimaryColor,
  selectedStoriesHighlightColor,
  setSelectedStoriesHighlightColor,
  chartData,
}) => {
  return (
    <Accordion.Item value="stories-settings">
      <Accordion.Control>
        <Flex direction="column" gap={2}>
          <Flex align="center" gap={8}>
            <IconPhoto size={16} />
            <Text fw={600}>{t('charts.share.storiesSettings', 'Stories Settings')}</Text>
          </Flex>
          <Text size="xs" c="dimmed">
            {t('charts.share.storiesSettingsDescription', 'Customize your stories image')}
          </Text>
        </Flex>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.storiesTop', 'Top Count')}
            </Text>
            <Radio.Group
              value={selectedStoriesTop.toString()}
              onChange={value => setSelectedStoriesTop(parseInt(value) as 5 | 10)}
            >
              <Stack gap="xs">
                <Radio value="5" label="Top 5" />
                <Radio value="10" label="Top 10" disabled={chartData.length < 10} />
              </Stack>
            </Radio.Group>
          </div>
          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.primaryColor', 'Primary Color')}
            </Text>
            <Text size="xs" c="dimmed" mb="xs">
              {t('charts.share.primaryColorDescription', 'Color for rank badges and header number')}
            </Text>
            <ColorInput
              value={selectedStoriesPrimaryColor}
              onChange={setSelectedStoriesPrimaryColor}
              format="hex"
              swatchesPerRow={10}
              swatches={COLOR_SWATCHES}
            />
          </div>
          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.highlightColor', 'Highlight Color')}
            </Text>
            <Text size="xs" c="dimmed" mb="xs">
              {t('charts.share.highlightColorDescription', 'Color for the #1 position highlight')}
            </Text>
            <ColorInput
              value={selectedStoriesHighlightColor}
              onChange={setSelectedStoriesHighlightColor}
              format="hex"
              swatchesPerRow={10}
              swatches={COLOR_SWATCHES}
            />
          </div>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};
