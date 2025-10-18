import React, { useState } from 'react';
import { ActionIcon } from '@mantine/core';
import { IconShare } from '@tabler/icons-react';
import ShareImageModal from './ShareImageModal';

interface ShareMenuProps {
  t: (k: any, options?: any) => string;
  chartData: any[];
  chartName: string;
  lastfmUsername?: string;
  week: string | undefined;
  weekNumber: number | null;
  chartType: 'artist' | 'album' | 'track';
  disabled?: boolean;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ t, chartData, chartName, lastfmUsername, week, weekNumber, chartType, disabled }) => {
  const [shareModalOpened, setShareModalOpened] = useState(false);

  return (
    <>
      <ActionIcon
        variant="subtle"
        aria-label={t('charts.share.title', 'Share')}
        ml={0}
        my="xs"
        me={{ base: 'sm', sm: 0 }}
        disabled={disabled}
        onClick={() => setShareModalOpened(true)}
      >
        <IconShare size={18} />
      </ActionIcon>

      <ShareImageModal
        t={t}
        chartData={chartData}
        chartName={chartName}
        lastfmUsername={lastfmUsername}
        week={week}
        weekNumber={weekNumber}
        chartType={chartType}
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
      />
    </>
  );
};

export default ShareMenu;
