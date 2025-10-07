import React from 'react';
import { SegmentedControl, Center } from '@mantine/core';
import { IconMicrophone, IconDisc, IconMusic, IconTable, IconLayoutGrid, IconList } from '@tabler/icons-react';

const chartTypes = [
  { value: 'artist', icon: <Center><IconMicrophone size={18} /></Center> },
  { value: 'album', icon: <Center><IconDisc size={18} /></Center> },
  { value: 'track', icon: <Center><IconMusic size={18} /></Center> },
];

interface TypeControlProps {
  type: string;
  isBusy: boolean;
  onChangeType: (nextType: string) => void;
}

export const TypeControl: React.FC<TypeControlProps> = ({ type, isBusy, onChangeType }) => (
  <SegmentedControl
    value={type}
    onChange={v => { if (!v || isBusy) return; onChangeType(v); }}
    data={chartTypes.map(({ value, icon }) => ({ label: icon as any, value, disabled: isBusy }))}
    size="sm"
    my="xs"
    withItemsBorders={false}
    disabled={isBusy}
  />
);

interface ViewControlProps {
  view: 'table' | 'grid' | 'list';
  onSetView: (v: 'table' | 'grid' | 'list') => void;
}

export const ViewControl: React.FC<ViewControlProps> = ({ view, onSetView }) => (
  <SegmentedControl
    value={view}
    onChange={v => onSetView(v as any)}
    data={[
      { label: (<Center><IconTable size={18} /></Center>) as any, value: 'table' },
      { label: (<Center><IconList size={18} /></Center>) as any, value: 'list' },
      { label: (<Center><IconLayoutGrid size={18} /></Center>) as any, value: 'grid' },
    ]}
    size="sm"
    my="xs"
    withItemsBorders={false}
  />
);

export default TypeControl;
