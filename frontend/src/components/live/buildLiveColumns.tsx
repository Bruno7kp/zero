import React from 'react';
import { Flex, rem, Text, Anchor } from '@mantine/core';
import { IconArrowsDownUp } from '@tabler/icons-react';
import type { DataTableColumn } from 'mantine-datatable';
import type { LiveRow } from './types';
import { DeltaBadge } from '../DeltaBadge';
import { selectResolvedBadge } from '../../store/badgeStylesSlice';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { Link } from 'react-router-dom';
import { encodeLastFmSlug } from '../../utils/urlEncoding';

export type BuildLiveColumnsArgs = {
  chartType: 'artist' | 'album' | 'track' | string;
  showInlineImage: boolean;
  artistMode: 'under' | 'column';
  showVariation: boolean;
};

export function useLiveColumns({
  chartType,
  showInlineImage,
  artistMode,
  showVariation,
}: BuildLiveColumnsArgs) {
  const { t } = useTranslation();
  const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'table'));
  const themeMode = useSelector((s: any) => s.theme?.value || 'dark');

  const columns = React.useMemo<DataTableColumn<LiveRow>[]>(() => {
    const norm = (s: string) => s.normalize('NFKC').toLowerCase().trim();
    const keyOf = (name?: string, artist?: string) => `${norm(name || '')}|${norm(artist || '')}`;
    const textColor = themeMode === 'light' ? '#000' : '#fff';

    const cols: DataTableColumn<LiveRow>[] = [
      {
        accessor: 'rank',
        title: t('charts.rankLabel'),
        width: 80,
        textAlign: 'center',
        render: ({ rank }) => <Text fw={600}>{rank}</Text>,
      },
      ...(showVariation
        ? ([
            {
              accessor: 'deltaRank',
              title: <IconArrowsDownUp size={18} stroke={2} style={{ verticalAlign: 'middle' }} />,
              width: rem(65),
              textAlign: 'center',
              cellsStyle: () => ({ paddingRight: 0, paddingLeft: 0 }),
              render: ({ deltaRank }) => {
                let cfg: any = badgeStylesRank;
                if (badgeStylesRank.iconPosition === 'split') {
                  cfg = {
                    ...badgeStylesRank,
                    iconPosition: 'split',
                    splitTall: badgeStylesRank.splitTall !== false,
                  };
                } else if (badgeStylesRank.iconPosition === 'hidden') {
                  cfg = { ...badgeStylesRank, iconPosition: 'hidden', splitTall: false };
                } else {
                  cfg = { ...badgeStylesRank, splitTall: false };
                }
                return (
                  <Flex justify="center" align="center" style={{ width: '100%' }}>
                    <DeltaBadge
                      delta={deltaRank ?? '-'}
                      cfg={cfg}
                      kind="rank"
                      textSize="md"
                      columnContext
                      noSidePadding
                      contextView="table"
                    />
                  </Flex>
                );
              },
            },
          ] as DataTableColumn<LiveRow>[])
        : ([] as DataTableColumn<LiveRow>[])),
      {
        accessor: 'name',
        title: t('charts.titleLabel'),
        render: item => {
          const artistSlug = item.artist ? encodeLastFmSlug(item.artist) : '';
          const nameSlug = item.name ? encodeLastFmSlug(item.name) : '';

          let linkPath = '';
          if (chartType === 'artist') {
            linkPath = `/library/music/${nameSlug}`;
          } else if (chartType === 'album') {
            linkPath = `/library/music/${artistSlug}/${nameSlug}`;
          } else if (chartType === 'track') {
            linkPath = `/library/music/${artistSlug}/_/${nameSlug}`;
          }

          const artistLinkPath = `/library/music/${artistSlug}`;

          return (
            <Flex>
              {showInlineImage && (
                <Flex
                  mr="sm"
                  justify="center"
                  align="center"
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <SpotifyImageWithModal
                    entityId={`${chartType}:${keyOf(item.name, item.artist)}`}
                    name={item.name}
                    artistName={item.artist}
                    type={chartType as 'artist' | 'album' | 'track'}
                    clientId={SPOTIFY_TOKEN}
                    clientSecret={SPOTIFY_SECRET}
                    width={40}
                    height={40}
                    style={{ minWidth: 40, maxWidth: 40 }}
                  />
                </Flex>
              )}
              <Flex direction="column" justify="center" align="flex-start">
                <Anchor
                  component={Link}
                  to={linkPath}
                  fw={600}
                  className="entity-name"
                  c={textColor}
                  style={{ textDecoration: 'none' }}
                >
                  {item.name}
                </Anchor>
                {artistMode === 'under' && chartType !== 'artist' && !!item.artist && (
                  <Anchor
                    component={Link}
                    to={artistLinkPath}
                    size="sm"
                    c={textColor}
                    style={{ textDecoration: 'none' }}
                  >
                    {item.artist}
                  </Anchor>
                )}
              </Flex>
            </Flex>
          );
        },
        width: 'auto',
      },
      ...(chartType === 'artist' || artistMode !== 'column'
        ? []
        : ([
            {
              accessor: 'artist',
              title: t('charts.artistLabel'),
              render: (item: LiveRow) => <Text size="md">{item.artist || '-'}</Text>,
              width: 'auto',
            },
          ] as DataTableColumn<LiveRow>[])),
      {
        accessor: 'playcount',
        title: t('charts.playsLabelShort'),
        width: rem(80),
        textAlign: 'center',
      },
    ];
    return cols;
  }, [badgeStylesRank, chartType, t, artistMode, showInlineImage, showVariation, themeMode]);

  return columns;
}
