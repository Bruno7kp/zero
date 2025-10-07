import React from 'react';
import { Alert, Button, Grid, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  isOnline: boolean;
  error: string | null;
  isSubmitting: boolean;
  buttonLabel: string;
};

const FormFooter: React.FC<Props> = ({ isOnline, error, isSubmitting, buttonLabel }) => {
  const { t } = useTranslation();
  return (
    <Grid.Col span={12}>
      {(!isOnline) && (
        <Alert color="yellow" title={t('errors.warning')} mb="sm" variant="light">
          {t('errors.offlineAction')}
        </Alert>
      )}
      {error && (
        <Text c="red" size="sm" mb="sm">
          {error}
        </Text>
      )}
      <Button type="submit" loading={isSubmitting} disabled={!isOnline}>
        {buttonLabel}
      </Button>
    </Grid.Col>
  );
};

export default FormFooter;
