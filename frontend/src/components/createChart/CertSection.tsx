import React from 'react';
import { Card, Divider, Grid, Group, NumberInput, Text, ThemeIcon, rem } from '@mantine/core';
import { IconDisc } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type Props = { form: any };

const CertSection: React.FC<Props> = ({ form }) => {
  const { t } = useTranslation();
  return (
    <Card shadow="md" p="md">
      <Group>
        <ThemeIcon variant="light" size="md">
          <IconDisc style={{ width: rem(20), height: rem(20) }} />
        </ThemeIcon>
        <Text fw={600} size="lg">{t('forms.createChart.certificationTitle')}</Text>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.musicGoldLabel')} {...form.getInputProps('music_gold_value')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.musicPlatinumLabel')} {...form.getInputProps('music_platinum_value')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.musicDiamondLabel')} {...form.getInputProps('music_diamond_value')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.albumGoldLabel')} {...form.getInputProps('album_gold_value')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.albumPlatinumLabel')} {...form.getInputProps('album_platinum_value')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput min={0} allowDecimal={false} label={t('forms.createChart.albumDiamondLabel')} {...form.getInputProps('album_diamond_value')} />
        </Grid.Col>
      </Grid>
    </Card>
  );
};

export default CertSection;
