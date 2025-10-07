import React from 'react';
import { ScrollArea, Table, Divider, Badge } from '@mantine/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableRow, { type EditRow } from './SortableRow';

interface EditTableProps {
  groupedByPlays: Array<{ plays: number; items: EditRow[] }>;
  cutoff: number;
  loading: boolean;
  labels: { pos: string; nameArtist: string; plays: string; adjust: string };
  onDragEnd: (event: any) => void;
}

export const EditTable: React.FC<EditTableProps> = ({ groupedByPlays, cutoff, loading, labels, onDragEnd }) => {
  return (
    <ScrollArea h={520} offsetScrollbars>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing={4} horizontalSpacing={8}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 60, textAlign: 'center' }}>{labels.pos}</Table.Th>
              <Table.Th>{labels.nameArtist}</Table.Th>
              <Table.Th style={{ width: 90, textAlign: 'center' }}>{labels.plays}</Table.Th>
              <Table.Th style={{ width: 84, textAlign: 'center' }}>{labels.adjust}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {groupedByPlays.map(({ plays, items }) => (
              <React.Fragment key={`grp-${plays}`}>
                <SortableContext items={items.map(i => i.entityId)} strategy={verticalListSortingStrategy}>
                  {items.map((r) => (
                    <SortableRow key={r.entityId} r={r} cutoff={cutoff} loading={loading} adjustLabel={labels.adjust} />
                  ))}
                </SortableContext>
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Divider my={2} label={<Badge size="xs" variant="light">{plays} {labels.plays}</Badge>} labelPosition="center" />
                  </Table.Td>
                </Table.Tr>
              </React.Fragment>
            ))}
          </Table.Tbody>
        </Table>
      </DndContext>
    </ScrollArea>
  );
};

export default EditTable;
