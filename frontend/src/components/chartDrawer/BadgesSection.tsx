import React, { useMemo } from 'react';
import { Box, Flex, Stack, Text, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { IconCaretUpFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { BadgeStylePreview } from '../badgeStyles/BadgeStylePreview';

export type BadgeKind = 'rank' | 'plays';

interface BadgesSectionProps {
  viewType: 'table' | 'list' | 'grid';
  allowKindSelect: boolean;
  badgeKind: BadgeKind;
  onBadgeKindChange: (kind: BadgeKind) => void;
  selectedPreset: string;
  allowSpecialsUI: boolean;
  onSelectPreset: (preset: string) => void;
  resolvedRank: any;
  resolvedPlays: any;
}

export const BadgesSection: React.FC<BadgesSectionProps> = ({
  viewType,
  allowKindSelect,
  badgeKind,
  onBadgeKindChange,
  selectedPreset,
  allowSpecialsUI,
  onSelectPreset,
  resolvedRank,
  resolvedPlays,
}) => {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const groups: string[][] = useMemo(() => (
    viewType === 'grid'
      ? [['solid','solidIconOnly','solidIcon']]
      : [
          ['transparent','transparentIconOnly','transparentIcon'],
          ['light','lightIconOnly','lightIcon'],
          ['solid','solidIconOnly','solidIcon'],
          allowSpecialsUI ? ['maximalist','maximalistLight'] : []
        ].filter(g => g.length)
  ), [viewType, allowSpecialsUI]);

  const presetVisualLabel = (k: string) => {
    const baseKey = k.startsWith('transparent') ? 'transparent' : k.startsWith('light') ? 'light' : k.startsWith('solid') ? 'solid' : k;
    const rawText = t(`charts.badgeStyles.preset_${baseKey}` as any);
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const baseText = cap(rawText);
    if (baseKey === 'maximalist') {
      return <Flex align="center" justify="center" style={{ width: '100%' }}>{cap(rawText)}</Flex>;
    }
    if (k.endsWith('IconOnly')) {
      return <Flex align="center" justify="center" style={{ width: '100%' }}><IconCaretUpFilled size={12} /></Flex>;
    }
    if (k.endsWith('Icon')) {
      return <Flex align="center" gap={4} justify="center" style={{ width: '100%' }}><IconCaretUpFilled size={12} /> <span>{baseText}</span></Flex>;
    }
    return <Flex align="center" justify="center" style={{ width: '100%' }}>{baseText}</Flex>;
  };

  const trackBg = colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1];
  const activeBg = colorScheme === 'dark' ? theme.colors.dark[4] : theme.white;
  const activeColor = colorScheme === 'dark' ? theme.white : theme.black;
  const inactiveColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.dark[6];
  const focusRing = theme.colors.blue[5];
  const segmentStyle = (active: boolean, _hovered: boolean, focused: boolean): React.CSSProperties => ({
    flex: 1,
    cursor: 'pointer',
    padding: '4px 10px',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontWeight: 600,
    // Inactive stays transparent so the track shows; active uses a contrasting bg
    background: active ? activeBg : 'transparent',
    color: active ? activeColor : inactiveColor,
    borderRadius: 999,
    userSelect: 'none',
    transition: 'background .12s ease, color .12s ease, box-shadow .12s ease',
    minWidth: 0,
    outline: 'none',
    boxShadow: focused ? `0 0 0 2px ${focusRing}` : 'none'
  });

  return (
    <Stack gap={6}>
      {allowKindSelect && (
        <>
          <Text size="xs" c="dimmed">{t('charts.badgeStyles.kindSelectLabel')}</Text>
          <Box>
            <Flex style={{ width: '100%', background: trackBg, borderRadius: 999, padding: 2, gap: 2 }}>
              {(['rank','plays'] as const).map((k) => (
                <Box
                  key={k}
                  style={segmentStyle(badgeKind === k, false, false)}
                  onClick={() => onBadgeKindChange(k)}
                  role="button"
                  aria-pressed={badgeKind === k}
                  tabIndex={0}
                >
                  {k === 'rank' ? t('charts.badgeStyles.kindRank') : t('charts.badgeStyles.kindPlays')}
                </Box>
              ))}
            </Flex>
          </Box>
        </>
      )}

      <Text size="xs" c="dimmed">{t('charts.badgeStyles.presetsTitle')}</Text>

      <Stack gap={8}>
        {groups.map((g, i) => (
          <Flex key={i} direction="column" style={{ width: '100%' }}>
            <Flex style={{ width: '100%', background: trackBg, borderRadius: 999, padding: 2, gap: 2 }}>
              {g.map((k) => {
                const active = k === selectedPreset;
                return (
                  <Box
                    key={k}
                    style={segmentStyle(active, false, false)}
                    onClick={() => onSelectPreset(k)}
                    role="button"
                    aria-pressed={active}
                    tabIndex={0}
                  >
                    {presetVisualLabel(k)}
                  </Box>
                );
              })}
            </Flex>
          </Flex>
        ))}
      </Stack>

      <Flex justify="center" mb="lg">
        <BadgeStylePreview kind={viewType === 'grid' ? 'rank' : badgeKind} rankCfg={resolvedRank} playsCfg={resolvedPlays} />
      </Flex>
    </Stack>
  );
};
