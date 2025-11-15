import { useState } from 'react';
import {
  Container,
  Title,
  Paper,
  TextInput,
  Button,
  Stack,
  Group,
  Text,
  Alert,
  NumberInput,
  Accordion,
  Anchor,
  rem,
  ThemeIcon,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconMusic, IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../config';
import { useSelector } from 'react-redux';

interface ScrobbleFormValues {
  track: string;
  artist: string;
  album: string;
  albumArtist: string;
  duration: number | string;
  timestamp: Date;
  apiKey: string;
  apiSecret: string;
  sessionKey: string;
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function ScrobblePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const token = useSelector((state: any) => state.auth.token);

  const form = useForm<ScrobbleFormValues>({
    initialValues: {
      track: '',
      artist: '',
      album: '',
      albumArtist: '',
      duration: '',
      timestamp: new Date(),
      apiKey: '',
      apiSecret: '',
      sessionKey: '',
    },
    validate: {
      track: value => (!value ? t('scrobble.form.trackRequired') : null),
      artist: value => (!value ? t('scrobble.form.artistRequired') : null),
      apiKey: value => (!value ? t('scrobble.form.apiKeyRequired') : null),
      apiSecret: value => (!value ? t('scrobble.form.apiSecretRequired') : null),
      sessionKey: value => (!value ? t('scrobble.form.sessionKeyRequired') : null),
      timestamp: value => {
        if (!value) return 'Date is required';
        const now = Date.now();
        const selected = value.getTime();
        if (selected > now) {
          return 'Cannot scrobble future dates';
        }
        if (now - selected > TWO_WEEKS_MS) {
          return 'Last.fm only allows scrobbles up to 2 weeks in the past';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: ScrobbleFormValues) => {
    setLoading(true);

    try {
      // Convert timestamp to UTC Unix timestamp
      const timestampUTC = Math.floor(values.timestamp.getTime() / 1000);

      const payload = {
        api_key: values.apiKey,
        api_secret: values.apiSecret,
        session_key: values.sessionKey,
        artist: values.artist,
        track: values.track,
        timestamp: timestampUTC,
        ...(values.album && { album: values.album }),
        ...(values.albumArtist && { albumArtist: values.albumArtist }),
        ...(values.duration && { duration: Number(values.duration) }),
      };

      const response = await fetch(apiUrl('/lastfm/scrobble'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to scrobble');
      }

      notifications.show({
        title: t('scrobble.success'),
        message: `${values.track} - ${values.artist}`,
        color: 'green',
        icon: <IconCheck />,
      });

      // Reset form
      form.reset();
      form.setFieldValue('timestamp', new Date());
    } catch (error: any) {
      notifications.show({
        title: t('scrobble.error'),
        message: t('scrobble.errorDetails', {
          message: error.message || 'Unknown error',
        }),
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group justify="center" align="center">
          <ThemeIcon size="xl" variant="light" color="blue">
            <IconMusic style={{ width: rem(24), height: rem(24) }} />
          </ThemeIcon>
          <Title order={2}>{t('scrobble.title')}</Title>
        </Group>

        <Text ta="center" c="dimmed">
          {t('scrobble.description')}
        </Text>

        <Paper shadow="sm" p="xl" withBorder>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label={t('scrobble.form.track')}
                placeholder={t('scrobble.form.trackPlaceholder')}
                required
                {...form.getInputProps('track')}
              />

              <TextInput
                label={t('scrobble.form.artist')}
                placeholder={t('scrobble.form.artistPlaceholder')}
                required
                {...form.getInputProps('artist')}
              />

              <TextInput
                label={t('scrobble.form.album')}
                placeholder={t('scrobble.form.albumPlaceholder')}
                {...form.getInputProps('album')}
              />

              <TextInput
                label={t('scrobble.form.albumArtist')}
                placeholder={t('scrobble.form.albumArtistPlaceholder')}
                {...form.getInputProps('albumArtist')}
              />

              <NumberInput
                label={t('scrobble.form.duration')}
                placeholder={t('scrobble.form.durationPlaceholder')}
                min={0}
                {...form.getInputProps('duration')}
              />

              <DateTimePicker
                label={t('scrobble.form.timestamp')}
                description={t('scrobble.form.timestampDescription')}
                placeholder="Pick date and time"
                valueFormat="DD/MM/YYYY HH:mm"
                required
                {...form.getInputProps('timestamp')}
              />

              <Alert
                icon={<IconInfoCircle size={16} />}
                title="Last.fm API Credentials Required"
                color="blue"
                variant="light"
              >
                <Text size="sm">
                  You need your Last.fm API credentials to scrobble tracks. These are stored
                  locally and only sent to Last.fm.
                </Text>
              </Alert>

              <TextInput
                label={t('scrobble.form.apiKey')}
                placeholder={t('scrobble.form.apiKeyPlaceholder')}
                required
                {...form.getInputProps('apiKey')}
              />

              <TextInput
                label={t('scrobble.form.apiSecret')}
                placeholder={t('scrobble.form.apiSecretPlaceholder')}
                type="password"
                required
                {...form.getInputProps('apiSecret')}
              />

              <TextInput
                label={t('scrobble.form.sessionKey')}
                placeholder={t('scrobble.form.sessionKeyPlaceholder')}
                type="password"
                required
                {...form.getInputProps('sessionKey')}
              />

              <Button type="submit" loading={loading} fullWidth size="md">
                {loading ? t('scrobble.form.submitting') : t('scrobble.form.submit')}
              </Button>
            </Stack>
          </form>
        </Paper>

        <Accordion variant="contained">
          <Accordion.Item value="help">
            <Accordion.Control icon={<IconInfoCircle size={20} />}>
              {t('scrobble.help.title')}
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                <Text size="sm">{t('scrobble.help.apiKey')}</Text>
                <Text size="sm">{t('scrobble.help.sessionKey')}</Text>
                <Anchor
                  href="https://www.last.fm/api/authentication"
                  target="_blank"
                  size="sm"
                >
                  {t('scrobble.help.sessionKeyLink')}
                </Anchor>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Container>
  );
}

export default ScrobblePage;
