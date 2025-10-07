import React from 'react';
import { Center, rem, SegmentedControl } from '@mantine/core';
import { IconMicrophone, IconDisc, IconMusic } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const TypeSegmented: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <SegmentedControl
      value={value}
      withItemsBorders={false}
      onChange={onChange}
      data={[
        {
          label: (
            <Center style={{ display: 'flex', alignItems: 'center', gap: rem(6) }}>
              <IconMicrophone style={{ width: rem(16), height: rem(16) }} />
              <span>{t('charts.artist')}</span>
            </Center>
          ),
          value: 'artist',
        },
        {
          label: (
            <Center style={{ display: 'flex', alignItems: 'center', gap: rem(6) }}>
              <IconDisc style={{ width: rem(16), height: rem(16) }} />
              <span>{t('charts.album')}</span>
            </Center>
          ),
          value: 'album',
        },
        {
          label: (
            <Center style={{ display: 'flex', alignItems: 'center', gap: rem(6) }}>
              <IconMusic style={{ width: rem(16), height: rem(16) }} />
              <span>{t('charts.track')}</span>
            </Center>
          ),
          value: 'track',
        },
      ]}
      color="blue"
    />
  );
};

export default TypeSegmented;
