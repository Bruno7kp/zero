import React from 'react';
import { Table, Text, Group, ActionIcon } from '@mantine/core';
import { IconArrowsUpDown } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface EditRow {
  entityId: string;
  name: string;
  artistName: string;
  plays: number;
  rank: number;
  inside: boolean;
}

interface SortableRowProps {
  r: EditRow;
  cutoff: number;
  loading: boolean;
  adjustLabel: string;
}

export const SortableRow: React.FC<SortableRowProps> = ({ r, cutoff, loading, adjustLabel }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.entityId });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : (r.rank <= cutoff ? 1 : 0.85),
    background: r.rank <= cutoff ? undefined : 'var(--mantine-color-dark-5)'
  };
  return (
    <Table.Tr key={r.entityId} ref={setNodeRef} style={style}>
      <Table.Td style={{ textAlign: 'center' }}>
        <Text fw={600} size="sm" c={r.rank === 1 ? 'blue' : undefined}>{r.rank}</Text>
      </Table.Td>
      <Table.Td>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text fw={600} size="sm">{r.name}</Text>
          {r.artistName && <Text size="xs" c="dimmed">{r.artistName}</Text>}
        </div>
      </Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Text fw={600} size="sm">{r.plays}</Text>
      </Table.Td>
      <Table.Td>
        <Group justify="center" gap={4}>
          <ActionIcon size="sm" variant="light" disabled={loading} aria-label={adjustLabel} {...attributes} {...listeners}>
            <IconArrowsUpDown size={14} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};

export default SortableRow;
