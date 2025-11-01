import React from 'react';
import { Group, Badge, Button, Tooltip } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

interface EditHeaderProps {
  type: string;
  week?: string;
  cutoff: number;
  loading: boolean;
  canRefresh: boolean;
  t: (k: any, fallback?: any) => string;
  onRefresh: () => void;
}

export const EditHeader: React.FC<EditHeaderProps> = ({
  type,
  week,
  cutoff,
  loading,
  canRefresh,
  t,
  onRefresh,
}) => {
  return (
    <Group justify="space-between" mb={6} gap="xs">
      <Group gap="xs">
        <Badge variant="light" size="xs">
          {String(type).toUpperCase()}
        </Badge>
        <Badge variant="light" size="xs">
          {t('chartEdit.week', 'Semana')}: {week || '-'}
        </Badge>
        <Badge variant="light" size="xs">
          {t('chartEdit.cutoff', 'Cutoff')}: {cutoff}
        </Badge>
      </Group>
      <Group gap="xs">
        <Tooltip
          label={t(
            'chartEdit.refreshTip',
            'Atualizar desta semana no Last.fm (inclui empates fora do cutoff)'
          )}
        >
          <Button
            size="xs"
            variant="default"
            leftSection={<IconRefresh size={14} />}
            onClick={onRefresh}
            disabled={loading || !canRefresh}
          >
            {t('chartEdit.refresh', 'Atualizar da fonte')}
          </Button>
        </Tooltip>
      </Group>
    </Group>
  );
};

export default EditHeader;
