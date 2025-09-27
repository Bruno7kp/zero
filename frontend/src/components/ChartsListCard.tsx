// import React from 'react';
import { Card, Group, ThemeIcon, Text, Divider, Table, ActionIcon, Tooltip, ScrollArea } from '@mantine/core';
import { IconListNumbers, IconEdit, IconTrash, IconEraser } from '@tabler/icons-react';
// import { DataTable } from 'mantine-datatable';
import { Link, generatePath } from 'react-router-dom';

import type { TFunction } from 'i18next';

interface ChartsListCardProps {
  charts: any[];
  t: TFunction;
  openDeleteModal: (id: number, name: string) => void;
  isOnline: boolean;
}

const ChartsListCard = ({ charts, t, openDeleteModal, isOnline }: ChartsListCardProps) => {
  const hasCharts = charts && charts.length > 0;
  return (
    <Card shadow="md" p="md">
      <Group>
        <ThemeIcon variant="light" size="md">
          <IconListNumbers style={{ width: 20, height: 20 }} />
        </ThemeIcon>
        <Text fw={600} size="lg">{t('charts.title')}</Text>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <ScrollArea.Autosize mah={300} offsetScrollbars>
        <Table verticalSpacing="xs" highlightOnHover striped withRowBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '40%' }}>{t('charts.title')}</Table.Th>
              <Table.Th style={{ width: '40%' }}>{t('forms.createChart.lastfmUsernameLabel')}</Table.Th>
              <Table.Th style={{ width: '20%', textAlign: 'right' }}>{t('charts.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {hasCharts ? (
              charts.map((chart: any) => (
                <Table.Tr key={chart.id}>
                  <Table.Td>
                    <Text fw={600} size="sm">{chart.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{chart.lastfm_username || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <Tooltip label={t('settings.clearChartData') + ' (' + t('charts.title') + ')'}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="grape"
                          onClick={() => document.dispatchEvent(new CustomEvent('zero:clearChartData', { detail: { chartId: chart.id, chartName: chart.name } }))}
                          aria-label={t('settings.clearChartData')}
                        >
                          <IconEraser size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={isOnline ? t('forms.editChart.title') : t('settings.needOnline')}>
                        <ActionIcon
                          component={Link}
                          size="sm"
                          variant="subtle"
                          color="blue"
                          disabled={!isOnline}
                          to={generatePath('/settings/charts/:id', { id: chart.id.toString() })}
                          aria-label={t('forms.editChart.title')}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={isOnline ? t('forms.deleteChart.title') : t('settings.needOnline')}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => isOnline && openDeleteModal(chart.id, chart.name)}
                          disabled={!isOnline}
                          aria-label={t('forms.deleteChart.title')}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text size="sm" c="dimmed">{t('settings.noCharts')}</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Card>
  );
};

export default ChartsListCard;
