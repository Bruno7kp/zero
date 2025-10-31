import React from 'react';
import { Stack, Flex, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { DeltaBadge } from '../../components/DeltaBadge';

interface BadgeStylePreviewProps {
  kind: 'rank' | 'plays';
  rankCfg: any;
  playsCfg: any;
}

export const BadgeStylePreview: React.FC<BadgeStylePreviewProps> = ({
  kind,
  rankCfg,
  playsCfg,
}) => {
  const { t } = useTranslation();
  const cfg = kind === 'rank' ? rankCfg : playsCfg;
  // Mesmos exemplos usados antes, mostrando como ficaria na coluna
  const sampleDeltas: any[] = ['NEW', 5, -3, 0];

  // Forçamos visual xs e contexto de coluna para refletir a aparência real.

  return (
    <Stack gap={8} mt={4} align="center">
      <Text fw={600} size="sm" ta="center" style={{ width: '100%' }}>
        {t('charts.badgeStyles.field_preview')}
      </Text>
      <Flex gap={6} wrap="wrap" justify="center" style={{ width: '100%' }}>
        {sampleDeltas.map((d, i) => (
          <DeltaBadge key={i} delta={d} cfg={cfg} kind={kind} textSize="xs" columnContext />
        ))}
      </Flex>
    </Stack>
  );
};
