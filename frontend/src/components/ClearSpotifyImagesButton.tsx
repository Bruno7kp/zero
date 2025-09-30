import { Button, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { spotifyImagesDb } from '../db/spotifyImagesDb';

export function ClearSpotifyImagesButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClear() {
    setLoading(true);
    await spotifyImagesDb.images.clear();
    setLoading(false);
  }

  return (
    <>
      <Tooltip label="Limpar cache de imagens do Spotify">
        <Button
          color="red"
          size="xs"
          leftSection={<IconTrash size={16} />}
          onClick={() => setModalOpen(true)}
          loading={loading}
          variant="outline"
        >
          Limpar imagens
        </Button>
      </Tooltip>
      <ConfirmModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleClear}
        title="Limpar imagens do Spotify"
        message="Tem certeza que deseja apagar todas as imagens em cache?"
        confirmLabel="Limpar"
        cancelLabel="Cancelar"
      />
    </>
  );
}
