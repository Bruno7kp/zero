// Mobile sidebar component shared by stats pages
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Stack } from '@mantine/core';
import { useSelector } from 'react-redux';
import type { NavItem } from './StatsSidebar';

interface MobileSidebarProps {
  navItems: NavItem[];
  currentPath: string;
  title: string;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ navItems, currentPath, title }) => {
  const [opened, setOpened] = React.useState(false);
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark');

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return currentPath === item.path;
    }
    if (!item.group) return false;
    const pathParts = currentPath.split('/');
    return pathParts.some(part => part === item.group);
  };

  return (
    <Box>
      <Box
        p="md"
        style={{
          backgroundColor: themeMode === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-dark-4)',
        }}
      >
        <Box onClick={() => setOpened(!opened)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text fw={500}>{title}</Text>
          <Box>{opened ? '▲' : '▼'}</Box>
        </Box>

        {opened && (
          <Stack gap={0} mt="md">
            {navItems.map((item, index) =>
              item.divider ? (
                <Box key={index} style={{ height: 1, backgroundColor: 'var(--mantine-color-dark-4)', margin: '8px 0' }} />
              ) : (
                <Box
                  key={index}
                  component={Link}
                  to={item.path!}
                  p="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive(item) ? 'var(--mantine-color-blue-6)' : 'inherit',
                    backgroundColor: isActive(item) ? 'var(--mantine-color-blue-1)' : 'transparent',
                  }}
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    // Close only on regular left-click navigation; keep open for new-tab actions
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                      setOpened(false);
                    }
                  }}
                >
                  {item.icon && <item.icon size={18} />}
                  <Text size="sm">{item.label}</Text>
                </Box>
              )
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};
