import React from 'react';
import { Radio, Stack, Text, Accordion, Flex, ColorInput, Switch } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { COLOR_SWATCHES } from '../templates/utils/colorSwatches';

interface Stories2SettingsProps {
  t: (k: any, options?: any) => string;
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
  chartData: any[];
}

export const Stories2Settings: React.FC<Stories2SettingsProps> = ({
  t,
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
  chartData,
}) => {
  return (
    <Accordion.Item value="stories2-settings">
      <Accordion.Control>
        <Flex direction="column" gap={2}>
          <Flex align="center" gap={8}>
            <IconSettings size={16} />
            <Text fw={600}>{t('charts.share.stories2Settings', 'Stories 2 Settings')}</Text>
          </Flex>
          <Text size="xs" c="dimmed">
            {t('charts.share.stories2SettingsDescription', 'Customize appearance and data display')}
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
              value={selectedStories2Top.toString()}
              onChange={value => setSelectedStories2Top(parseInt(value) as 5 | 10)}
            >
              <Stack gap="xs">
                <Radio value="5" label="Top 5" />
                <Radio value="10" label="Top 10" disabled={chartData.length < 10} />
              </Stack>
            </Radio.Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.backgroundType', 'Background Type')}
            </Text>
            <Radio.Group
              value={selectedStories2BackgroundType}
              onChange={value => setSelectedStories2BackgroundType(value as 'blur' | 'solid')}
            >
              <Stack gap="xs">
                <Radio value="blur" label={t('charts.share.backgroundBlur', 'Blurred Image')} />
                <Radio value="solid" label={t('charts.share.backgroundSolid', 'Solid Color')} />
              </Stack>
            </Radio.Group>
          </div>

          {selectedStories2BackgroundType === 'solid' && (
            <div>
              <Text size="sm" fw={500} mb="xs">
                {t('charts.share.backgroundColor', 'Background Color')}
              </Text>
              <ColorInput
                value={selectedStories2BackgroundColor}
                onChange={setSelectedStories2BackgroundColor}
                size="md"
                format="hex"
                swatchesPerRow={10}
                swatches={COLOR_SWATCHES}
              />
            </div>
          )}

          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.showColumn', 'Show Column')}
            </Text>
            <Radio.Group
              value={selectedStories2ShowPlays}
              onChange={value =>
                setSelectedStories2ShowPlays(value as 'last' | 'plays' | 'peak' | 'weeks')
              }
            >
              <Stack gap="xs">
                <Radio value="last" label={t('charts.share.lastPosition', 'Last Position')} />
                <Radio value="plays" label={t('charts.share.plays', 'Plays')} />
                <Radio value="peak" label={t('charts.share.peak', 'Peak')} />
                <Radio value="weeks" label={t('charts.share.weeks', 'Weeks')} />
              </Stack>
            </Radio.Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.listWrapBackgroundType', 'List Wrap Background')}
            </Text>
            <Radio.Group
              value={selectedStories2ListWrapBackgroundType}
              onChange={value =>
                setSelectedStories2ListWrapBackgroundType(value as 'transparent' | 'solid')
              }
            >
              <Stack gap="xs">
                <Radio
                  value="transparent"
                  label={t('charts.share.listWrapTransparent', 'Transparent')}
                />
                <Radio value="solid" label={t('charts.share.listWrapSolid', 'Solid Color')} />
              </Stack>
            </Radio.Group>
          </div>

          {selectedStories2ListWrapBackgroundType === 'solid' && (
            <div>
              <Text size="sm" fw={500} mb="xs">
                {t('charts.share.listWrapBackgroundColor', 'List Wrap Background Color')}
              </Text>
              <ColorInput
                value={selectedStories2ListWrapBackgroundColor}
                onChange={setSelectedStories2ListWrapBackgroundColor}
                size="md"
                format="hex"
                swatchesPerRow={10}
                swatches={COLOR_SWATCHES}
              />
            </div>
          )}

          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.showAlbumCovers', 'Show Album Covers')}
            </Text>
            <Switch
              checked={selectedStories2ShowAlbumCovers}
              onChange={event => setSelectedStories2ShowAlbumCovers(event.currentTarget.checked)}
              label={
                selectedStories2ShowAlbumCovers
                  ? t('common.show', 'Show')
                  : t('common.hide', 'Hide')
              }
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.showColoredIcons', 'Show Colored Icons')}
            </Text>
            <Switch
              checked={selectedStories2ShowColoredIcons}
              onChange={event => setSelectedStories2ShowColoredIcons(event.currentTarget.checked)}
              label={
                selectedStories2ShowColoredIcons
                  ? t('charts.enabled', 'Enabled')
                  : t('charts.disabled', 'Disabled')
              }
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('charts.share.showIconBackground', 'Show Icon Background')}
            </Text>
            <Switch
              checked={selectedStories2ShowIconBackground}
              onChange={event => setSelectedStories2ShowIconBackground(event.currentTarget.checked)}
              label={
                selectedStories2ShowIconBackground
                  ? t('common.show', 'Show')
                  : t('common.hide', 'Hide')
              }
            />
          </div>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
};
