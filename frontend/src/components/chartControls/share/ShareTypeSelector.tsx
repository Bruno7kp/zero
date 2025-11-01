import React from 'react';
import { Radio, Stack, Text, Accordion, Flex, Divider } from '@mantine/core';
import { IconShare } from '@tabler/icons-react';

interface ShareTypeSelectorProps {
  t: (k: any, options?: any) => string;
  selectedType: 'grid' | 'stories' | 'stories2' | 'completo' | 'text';
  setSelectedType: (type: 'grid' | 'stories' | 'stories2' | 'completo' | 'text') => void;
}

export const ShareTypeSelector: React.FC<ShareTypeSelectorProps> = ({
  t,
  selectedType,
  setSelectedType,
}) => {
  return (
    <Accordion.Item value="type">
      <Accordion.Control>
        <Flex direction="column" gap={2}>
          <Flex align="center" gap={8}>
            <IconShare size={16} />
            <Text fw={600}>{t('charts.share.selectType', 'Select Type')}</Text>
          </Flex>
          <Text size="xs" c="dimmed">
            {t('charts.share.selectTypeDescription', 'Choose the format for sharing your chart')}
          </Text>
        </Flex>
      </Accordion.Control>
      <Accordion.Panel>
        <Radio.Group value={selectedType} onChange={value => setSelectedType(value as any)}>
          <Stack gap="xs">
            <Radio value="stories2" label={t('charts.share.stories2', 'Stories Pro')} />
            <Radio value="completo" label={t('charts.share.completo', 'Complete')} />
            <Divider />
            <Radio value="stories" label={t('charts.share.stories', 'Stories')} />
            <Radio value="grid" label={t('charts.share.grid', 'Grid')} />
            <Radio value="text" label={t('charts.share.text', 'Text')} />
          </Stack>
        </Radio.Group>
      </Accordion.Panel>
    </Accordion.Item>
  );
};
