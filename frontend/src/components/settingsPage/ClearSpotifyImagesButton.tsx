import { Button, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { ConfirmModal } from '../dialogs/ConfirmModal';
import { spotifyImagesDb } from '../../db/spotifyImagesDb';
import { useTranslation } from 'react-i18next';

export function ClearSpotifyImagesButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function handleClear() {
    setLoading(true);
    await spotifyImagesDb.images.clear();
    setLoading(false);
  }

  return (
    <>
      <Tooltip label={t('spotifyImage.clearSpotifyImagesTooltip')}>
        <Button
          color="red"
          size="xs"
          leftSection={<IconTrash size={16} />}
          onClick={() => setModalOpen(true)}
          loading={loading}
          variant="outline"
        >
          {t('spotifyImage.clearSpotifyImagesButton')}
        </Button>
      </Tooltip>
      <ConfirmModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleClear}
        title={t('spotifyImage.clearSpotifyImagesTitle')}
        message={t('spotifyImage.clearSpotifyImagesMessage')}
        confirmLabel={t('common.clear')}
        cancelLabel={t('common.cancel')}
      />
    </>
  );
}
