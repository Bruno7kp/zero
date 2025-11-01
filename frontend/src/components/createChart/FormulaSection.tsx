import React from 'react';
import {
  Card,
  Code,
  Divider,
  Grid,
  Group,
  NumberInput,
  Text,
  ThemeIcon,
  rem,
  useMantineTheme,
} from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import { TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';

type Props = { form: any };

const FormulaSection: React.FC<Props> = ({ form }) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
  return (
    <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
      <Group>
        <ThemeIcon variant="light" size="md">
          <IconCalculator style={{ width: rem(20), height: rem(20) }} />
        </ThemeIcon>
        <Text fw={600} size="lg">
          {t('forms.createChart.formulaTitle')}
        </Text>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Group justify="space-between">
        <Text size="sm">{t('forms.createChart.formulaDescription')}</Text>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label={t('forms.createChart.formulaNameLabel')}
                {...form.getInputProps('formula_name')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Text size="xs">{t('charts.salesExample')}</Text>
            </Grid.Col>
          </Grid>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Grid>
            <Grid.Col span={12}>
              <NumberInput
                min={0}
                max={10000}
                decimalScale={2}
                label={t('forms.createChart.musicPlaysWeightLabel')}
                {...form.getInputProps('music_plays_weight')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <NumberInput
                min={0}
                max={10000}
                decimalScale={2}
                label={t('forms.createChart.musicPointsWeightLabel')}
                {...form.getInputProps('music_points_weight')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Code color="var(--mantine-color-blue-light)">
                ({t('charts.plays')}*{form.values.music_plays_weight}) + ({t('charts.stability')}*
                {form.values.music_points_weight})
              </Code>
            </Grid.Col>
          </Grid>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Grid>
            <Grid.Col span={12}>
              <NumberInput
                min={0}
                max={10000}
                decimalScale={2}
                label={t('forms.createChart.albumPlaysWeightLabel')}
                {...form.getInputProps('album_plays_weight')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <NumberInput
                min={0}
                max={10000}
                decimalScale={2}
                label={t('forms.createChart.albumPointsWeightLabel')}
                {...form.getInputProps('album_points_weight')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Code color="var(--mantine-color-blue-light)">
                ({t('charts.plays')}*{form.values.album_plays_weight}) + ({t('charts.stability')}*
                {form.values.album_points_weight})
              </Code>
            </Grid.Col>
          </Grid>
        </Grid.Col>
      </Grid>
    </Card>
  );
};

export default FormulaSection;
