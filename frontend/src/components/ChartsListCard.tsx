import React from 'react';
import { Card, Group, ThemeIcon, Text, Divider } from '@mantine/core';
import { IconListNumbers, IconEdit, IconTrash } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import { Link, generatePath } from 'react-router-dom';
import { ActionIcon } from '@mantine/core';

const ChartsListCard = ({ charts, t, openDeleteModal }) => (
  <Card shadow="md" p="md">
    <Group>
      <ThemeIcon variant="light" size="md">
        <IconListNumbers style={{ width: 20, height: 20 }} />
      </ThemeIcon>
      <Text fw={600} size="lg">{t('charts.title')}</Text>
    </Group>
    <Divider variant="dashed" size="sm" my="xs" />
    <DataTable
      backgroundColor="transparent"
      columns={[
        { accessor: 'name', title: t('charts.title') },
        { accessor: 'lastfm_username', title: t('forms.createChart.lastfmUsernameLabel') },
        {
          accessor: 'actions',
          title: t('charts.actions'),
          textAlign: 'right',
          render: (chart: any) => (
            <Group gap={4} justify="right" wrap="nowrap">
              <ActionIcon
                component={Link}
                size="sm"
                variant="subtle"
                color="blue"
                to={generatePath('/settings/charts/:id', { id: chart.id.toString() })}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => openDeleteModal(chart.id, chart.name)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          )
        }
      ]}
      records={charts}
    />
  </Card>
);

export default ChartsListCard;
