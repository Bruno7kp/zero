import React from 'react';
import { Radio, Stack, Text, Accordion, Flex, ColorInput, Switch, Checkbox } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

interface CompletoSettingsProps {
  t: (k: any, options?: any) => string;
  selectedCompletoBackgroundColor: string;
  setSelectedCompletoBackgroundColor: (color: string) => void;
  selectedCompletoTop: string;
  setSelectedCompletoTop: (top: string) => void;
  selectedCompletoShowColoredIcons: boolean;
  setSelectedCompletoShowColoredIcons: (show: boolean) => void;
  selectedCompletoColumns: string[];
  setSelectedCompletoColumns: (columns: string[]) => void;
  chartData: any[];
}

export const CompletoSettings: React.FC<CompletoSettingsProps> = ({
  t,
  selectedCompletoBackgroundColor,
  setSelectedCompletoBackgroundColor,
  selectedCompletoTop,
  setSelectedCompletoTop,
  selectedCompletoShowColoredIcons,
  setSelectedCompletoShowColoredIcons,
  selectedCompletoColumns,
  setSelectedCompletoColumns,
  chartData,
}) => {
  return (
    <Accordion.Item value="completo-settings">
      <Accordion.Control>
        <Flex direction="column" gap={2}>
          <Flex align="center" gap={8}><IconSettings size={16} /><Text fw={600}>{t('charts.share.completoSettings', 'Completo Settings')}</Text></Flex>
          <Text size="xs" c="dimmed">{t('charts.share.completoSettingsDescription', 'Customize background color')}</Text>
        </Flex>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">{t('charts.share.completoTop', 'Top Count')}</Text>
            <Radio.Group value={selectedCompletoTop} onChange={(value) => setSelectedCompletoTop(value)}>
              <Stack gap="xs">
                <Radio value="full" label={`Top ${chartData.length}`} />
                {chartData.length > 10 && <Radio value="10" label="Top 10" />}
                {chartData.length > 20 && <Radio value="20" label="Top 20" />}
                {chartData.length > 50 && <Radio value="50" label="Top 50" />}
              </Stack>
            </Radio.Group>
          </div>
          <div>
            <Text size="sm" fw={500} mb="xs">{t('charts.share.backgroundColor', 'Background Color')}</Text>
            <ColorInput
              value={selectedCompletoBackgroundColor}
              onChange={setSelectedCompletoBackgroundColor}
              size="md"
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
          <div>
            <Text size="sm" fw={500} mb="xs">{t('charts.share.showColoredIcons', 'Show Colored Icons')}</Text>
            <Switch
              checked={selectedCompletoShowColoredIcons}
              onChange={(event) => setSelectedCompletoShowColoredIcons(event.currentTarget.checked)}
              label={selectedCompletoShowColoredIcons ? t('common.show', 'Show') : t('common.hide', 'Hide')}
            />
          </div>
          <div>
            <Text size="sm" fw={500} mb="xs">{t('charts.share.columns', 'Columns (max 2)')}</Text>
            <Stack gap="xs">
              {[
                { key: 'plays', label: t('charts.share.plays', 'Plays') },
                { key: 'vendas', label: t('charts.share.sales', 'Sales') },
                { key: 'peak', label: t('charts.share.peak', 'Peak') },
                { key: 'last', label: t('charts.share.lastPosition', 'Last Position') },
                { key: 'weeks', label: t('charts.share.weeks', 'Weeks') }
              ].map(({ key, label }) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={selectedCompletoColumns.includes(key)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    const maxColumns = 2;
                    if (checked && selectedCompletoColumns.length < maxColumns) {
                      setSelectedCompletoColumns([...selectedCompletoColumns, key]);
                    } else if (!checked) {
                      setSelectedCompletoColumns(selectedCompletoColumns.filter(col => col !== key));
                    }
                  }}
                  disabled={!selectedCompletoColumns.includes(key) && selectedCompletoColumns.length >= 2}
                />
              ))}
            </Stack>
          </div>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};