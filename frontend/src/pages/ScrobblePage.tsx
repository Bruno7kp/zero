import { useState, useEffect } from 'react';
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
  rem,
  ThemeIcon,
  Loader,
  Badge,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconX,
  IconMusic,
  IconInfoCircle,
  IconUnlink,
  IconPlugConnected,
} from '@tabler/icons-react';
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
}

interface LastFmStatus {
  connected: boolean;
  username: string | null;
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function ScrobblePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [lastfmStatus, setLastfmStatus] = useState<LastFmStatus>({
    connected: false,
    username: null,
  });
  const [disconnecting, setDisconnecting] = useState(false);
  const token = useSelector((state: any) => state.auth.token);

  const form = useForm<ScrobbleFormValues>({
    initialValues: {
      track: '',
      artist: '',
      album: '',
      albumArtist: '',
      duration: '',
      timestamp: new Date(),
    },
    validate: {
      track: value => (!value ? t('scrobble.form.trackRequired') : null),
      artist: value => (!value ? t('scrobble.form.artistRequired') : null),
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

  // Check Last.fm connection status on mount
  useEffect(() => {
    checkLastFmStatus();
  }, []);

  const checkLastFmStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch(apiUrl('/lastfm/status'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLastfmStatus(data);
      }
    } catch (error) {
      console.error('Failed to check Last.fm status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleConnectLastFm = async () => {
    try {
      const response = await fetch(apiUrl('/lastfm/authorize'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Open Last.fm authorization in popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const authWindow = window.open(
          data.auth_url,
          'lastfm_auth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll for callback completion
        const pollInterval = setInterval(async () => {
          if (authWindow?.closed) {
            clearInterval(pollInterval);
            // Check status after window closes
            await checkLastFmStatus();
            if (lastfmStatus.connected) {
              notifications.show({
                title: t('scrobble.success'),
                message: t('scrobble.connectedSuccess'),
                color: 'green',
                icon: <IconCheck />,
              });
            }
          }
        }, 1000);
      }
    } catch (error: any) {
      notifications.show({
        title: t('scrobble.error'),
        message: t('scrobble.errorDetails', { message: error.message }),
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  const handleDisconnectLastFm = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch(apiUrl('/lastfm/disconnect'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setLastfmStatus({ connected: false, username: null });
        notifications.show({
          title: t('scrobble.success'),
          message: t('scrobble.disconnectedSuccess'),
          color: 'green',
          icon: <IconCheck />,
        });
      }
    } catch (error: any) {
      notifications.show({
        title: t('scrobble.error'),
        message: t('scrobble.errorDetails', { message: error.message }),
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSubmit = async (values: ScrobbleFormValues) => {
    if (!lastfmStatus.connected) {
      notifications.show({
        title: t('scrobble.error'),
        message: t('scrobble.notConnected'),
        color: 'red',
        icon: <IconX />,
      });
      return;
    }

    setLoading(true);

    try {
      // Convert timestamp to UTC Unix timestamp
      const timestampUTC = Math.floor(values.timestamp.getTime() / 1000);

      const payload = {
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

  if (statusLoading) {
    return (
      <Container size="sm" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>{t('scrobble.checkingConnection')}</Text>
        </Stack>
      </Container>
    );
  }

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

        {/* Last.fm Connection Status */}
        <Alert
          icon={
            lastfmStatus.connected ? (
              <IconPlugConnected size={16} />
            ) : (
              <IconInfoCircle size={16} />
            )
          }
          title={
            lastfmStatus.connected
              ? t('scrobble.connection.connected')
              : t('scrobble.connection.notConnected')
          }
          color={lastfmStatus.connected ? 'green' : 'blue'}
          variant="light"
        >
          <Stack gap="sm">
            {lastfmStatus.connected ? (
              <>
                <Group gap="xs">
                  <Text size="sm">
                    {t('scrobble.connection.connectedAs')}{' '}
                    <Badge size="sm" variant="light">
                      {lastfmStatus.username}
                    </Badge>
                  </Text>
                </Group>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconUnlink size={16} />}
                  onClick={handleDisconnectLastFm}
                  loading={disconnecting}
                >
                  {t('scrobble.connection.disconnect')}
                </Button>
              </>
            ) : (
              <>
                <Text size="sm">{t('scrobble.connection.connectDescription')}</Text>
                <Button
                  size="sm"
                  leftSection={<IconPlugConnected size={16} />}
                  onClick={handleConnectLastFm}
                >
                  {t('scrobble.connection.connect')}
                </Button>
              </>
            )}
          </Stack>
        </Alert>

        <Paper shadow="sm" p="xl" withBorder>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label={t('scrobble.form.track')}
                placeholder={t('scrobble.form.trackPlaceholder')}
                required
                disabled={!lastfmStatus.connected}
                {...form.getInputProps('track')}
              />

              <TextInput
                label={t('scrobble.form.artist')}
                placeholder={t('scrobble.form.artistPlaceholder')}
                required
                disabled={!lastfmStatus.connected}
                {...form.getInputProps('artist')}
              />

              <TextInput
                label={t('scrobble.form.album')}
                placeholder={t('scrobble.form.albumPlaceholder')}
                disabled={!lastfmStatus.connected}
                {...form.getInputProps('album')}
              />

              <TextInput
                label={t('scrobble.form.albumArtist')}
                placeholder={t('scrobble.form.albumArtistPlaceholder')}
                disabled={!lastfmStatus.connected}
                {...form.getInputProps('albumArtist')}
              />

              <NumberInput
                label={t('scrobble.form.duration')}
                placeholder={t('scrobble.form.durationPlaceholder')}
                min={0}
                disabled={!lastfmStatus.connected}
                {...form.getInputProps('duration')}
              />

              <DateTimePicker
                label={t('scrobble.form.timestamp')}
                description={t('scrobble.form.timestampDescription')}
                placeholder="Pick date and time"
                valueFormat="DD/MM/YYYY HH:mm"
                required
                disabled={!lastfmStatus.connected}
                {...form.getInputProps('timestamp')}
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="md"
                disabled={!lastfmStatus.connected}
              >
                {loading ? t('scrobble.form.submitting') : t('scrobble.form.submit')}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}

export default ScrobblePage;
