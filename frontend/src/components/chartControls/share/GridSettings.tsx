import React from 'react';
import { Radio, Stack, Text, Accordion, Flex, Switch } from '@mantine/core';
import { IconGridDots } from '@tabler/icons-react';

interface GridSettingsProps {
  t: (k: any, options?: any) => string;
  selectedGridSize: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  setSelectedGridSize: (size: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => void;
  selectedGridShowText: boolean;
  setSelectedGridShowText: (show: boolean) => void;
  selectedGridShowVariationIcons: boolean;
  setSelectedGridShowVariationIcons: (show: boolean) => void;
  chartData: any[];
}

export const GridSettings: React.FC<GridSettingsProps> = ({
  t,
  selectedGridSize,
  setSelectedGridSize,
  selectedGridShowText,
  setSelectedGridShowText,
  selectedGridShowVariationIcons,
  setSelectedGridShowVariationIcons,
  chartData,
}) => {
  return (
    <Accordion.Item value="grid-settings">
      <Accordion.Control>
        <Flex direction="column" gap={2}>
          <Flex align="center" gap={8}><IconGridDots size={16} /><Text fw={600}>{t('charts.share.gridSize', 'Grid Size')}</Text></Flex>
          <Text size="xs" c="dimmed">{t('charts.share.gridSizeDescription', 'Select the grid dimensions')}</Text>
        </Flex>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="md">
          <Radio.Group value={selectedGridSize.toString()} onChange={(value) => setSelectedGridSize(parseInt(value) as 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)}>
            <Stack gap="xs">
              {chartData.length >= 9 && <Radio value="3" label="3x3" />}
              {chartData.length >= 16 && <Radio value="4" label="4x4" />}
              {chartData.length >= 25 && <Radio value="5" label="5x5" />}
              {chartData.length >= 36 && <Radio value="6" label="6x6" />}
              {chartData.length >= 49 && <Radio value="7" label="7x7" />}
              {chartData.length >= 64 && <Radio value="8" label="8x8" />}
              {chartData.length >= 81 && <Radio value="9" label="9x9" />}
              {chartData.length >= 100 && <Radio value="10" label="10x10" />}
            </Stack>
          </Radio.Group>
          <div>
            <Text size="sm" fw={500} mb="xs">{t('charts.share.showGridText', 'Show Text')}</Text>
            <Switch
              checked={selectedGridShowText}
              onChange={(event) => setSelectedGridShowText(event.currentTarget.checked)}
              label={selectedGridShowText ? t('common.show', 'Show') : t('common.hide', 'Hide')}
            />
          </div>
          <div>
            <Text size="sm" fw={500} mb="xs">{t('charts.share.showGridVariationIcons', 'Show Variation Icons')}</Text>
            <Switch
              checked={selectedGridShowVariationIcons}
              onChange={(event) => setSelectedGridShowVariationIcons(event.currentTarget.checked)}
              label={selectedGridShowVariationIcons ? t('common.show', 'Show') : t('common.hide', 'Hide')}
            />
          </div>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};