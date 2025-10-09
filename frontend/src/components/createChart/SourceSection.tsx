import React from 'react';
import { Card, Divider, Grid, Group, NumberInput, Select, Text, TextInput, ThemeIcon, rem, useMantineTheme } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconUserCog } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';

type Props = {
  form: any;
  dayOfWeekOptions: { value: string; label: string }[];
  allTimezones: string[];
  locale: string;
};

const SourceSection: React.FC<Props> = ({ form, dayOfWeekOptions, allTimezones, locale }) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
  return (
    <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
      <Group>
        <ThemeIcon variant="light" size="md">
          <IconUserCog style={{ width: rem(20), height: rem(20) }} />
        </ThemeIcon>
        <Text fw={600} size="lg">{t('forms.createChart.sourceTitle')}</Text>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label={t('forms.createChart.nameLabel')}
            placeholder={t('forms.createChart.namePlaceholder')}
            {...form.getInputProps('name')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label={t('forms.createChart.sourceLabel')}
            placeholder={t('forms.createChart.sourcePlaceholder')}
            data={[{ value: 'lastfm', label: 'Last.fm' }]}
            {...form.getInputProps('source')}
          />
        </Grid.Col>
        {form.values.source === 'lastfm' && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label={t('forms.createChart.lastfmUsernameLabel')}
              placeholder={t('forms.createChart.lastfmUsernamePlaceholder')}
              {...form.getInputProps('lastfm_username')}
            />
          </Grid.Col>
        )}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label={t('forms.createChart.timezoneLabel')}
            placeholder={t('forms.createChart.timezonePlaceholder')}
            data={allTimezones}
            searchable
            {...form.getInputProps('timezone')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label={t('forms.createChart.dayOfWeekLabel')}
            data={dayOfWeekOptions.map((day) => ({ ...day, label: t(`days.${day.value}`) }))}
            {...form.getInputProps('day_of_week')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <DatePickerInput
            label={t('forms.createChart.startDateLabel')}
            placeholder={t('forms.createChart.startDatePlaceholder')}
            valueFormat="YYYY-MM-DD"
            locale={locale}
            {...form.getInputProps('start_date')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={5} max={100} label={t('forms.createChart.musicCutoffLabel')} {...form.getInputProps('music_cutoff')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={5} max={100} label={t('forms.createChart.albumCutoffLabel')} {...form.getInputProps('album_cutoff')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={5} max={100} label={t('forms.createChart.artistCutoffLabel')} {...form.getInputProps('artist_cutoff')} />
        </Grid.Col>
      </Grid>
    </Card>
  );
};

export default SourceSection;
