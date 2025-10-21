import React from 'react';
import { Radio, Stack, Text, Accordion, Flex } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';

interface StoriesSettingsProps {
  t: (k: any, options?: any) => string;
  selectedStoriesTop: 5 | 10;
  setSelectedStoriesTop: (top: 5 | 10) => void;
  chartData: any[];
}

export const StoriesSettings: React.FC<StoriesSettingsProps> = ({
  t,
  selectedStoriesTop,
  setSelectedStoriesTop,
  chartData,
}) => {
  return (
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
  );
};