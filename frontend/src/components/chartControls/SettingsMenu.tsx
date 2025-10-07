import React from 'react';
import { Menu, ActionIcon } from '@mantine/core';
import { IconSettings, IconPencil, IconTable, IconList, IconLayoutGrid } from '@tabler/icons-react';

interface SettingsMenuProps {
  t: (k: any) => string;
  week?: string;
  isBusy: boolean;
  isMobile: boolean;
  onOpenDrawer: () => void;
  onOpenEdit: () => void;
  onSetView: (v: 'table' | 'grid' | 'list') => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ t, week, isBusy, isMobile, onOpenDrawer, onOpenEdit, onSetView }) => {
  return (
    <Menu withinPortal position="bottom" shadow="md" withArrow>
      <Menu.Target>
        <ActionIcon variant="subtle" aria-label="Opções" ml={0} my="xs">
          <IconSettings size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={16} />} onClick={onOpenDrawer}>
          {t('charts.columnsConfig')}
        </Menu.Item>
        <Menu.Item leftSection={<IconPencil size={16} />} disabled={!week || isBusy} onClick={onOpenEdit}>
          {t('common.edit')}
        </Menu.Item>
        {isMobile && (
          <>
            <Menu.Divider />
            <Menu.Label>{t('charts.view')}</Menu.Label>
            <Menu.Item leftSection={<IconTable size={16} />} onClick={() => onSetView('table')}>
              {t('charts.tableView')}
            </Menu.Item>
            <Menu.Item leftSection={<IconList size={16} />} onClick={() => onSetView('list')}>
              {t('charts.listView')}
            </Menu.Item>
            <Menu.Item leftSection={<IconLayoutGrid size={16} />} onClick={() => onSetView('grid')}>
              {t('charts.gridView')}
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default SettingsMenu;
