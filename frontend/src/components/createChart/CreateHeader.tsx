import React from 'react';
import { Divider, Flex, rem, ThemeIcon, Title } from '@mantine/core';
import { IconListNumbers, IconSettings } from '@tabler/icons-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Props = { pageTitle: string };

const CreateHeader: React.FC<Props> = ({ pageTitle }) => {
  const { t } = useTranslation();
  return (
    <>
      <Flex justify="center" align="center" gap="sm">
        <NavLink to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
            <ThemeIcon variant="light" size="md">
              <IconSettings style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            {t('settings.title')}
          </Title>
        </NavLink>

        <Divider size="sm" orientation="vertical" />

        <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
          <ThemeIcon variant="light" size="md">
            <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          {pageTitle}
        </Title>
      </Flex>
      <Divider variant="solid" size="sm" my="md" />
    </>
  );
};

export default CreateHeader;
