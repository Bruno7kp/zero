import { useMemo, useRef } from 'react';
import { Paper, Box, Flex, Title, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ChartData } from '../../db/indexedDb';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import styles from './SlideCard.module.css';

export type SlideKind = 'top1' | 'debut' | 'climb' | 'reentry' | 'weeks' | 'total_top1s';

interface SlideCardProps {
  row: ChartData;
  kind: SlideKind;
  chartType: 'artist' | 'album' | 'track' | string;
  clientId: string;
  clientSecret: string;
  stats?: any; // Stats object containing totals and peak data
}

export function SlideCard({ row, kind, chartType, clientId, clientSecret, stats }: SlideCardProps) {
  const { t, i18n } = useTranslation();
  const bgRef = useRef<HTMLDivElement | null>(null);

  const titleRight = useMemo(() => {
    switch (kind) {
      case 'top1':
        return t('charts.stats.highlights.top1');
      case 'debut':
        return t('charts.stats.highlights.debut');
      case 'climb':
        return t('charts.stats.highlights.climb');
      case 'reentry':
        return t('charts.stats.highlights.reentry');
      case 'weeks':
        return t('charts.stats.highlights.weeks');
      case 'total_top1s':
        if (chartType === 'album') return t('charts.stats.highlights.totalTop1Albums');
        if (chartType === 'track') return t('charts.stats.highlights.totalTop1Tracks');
        return t('charts.stats.highlights.totalTop1s');
      default:
        return '';
    }
  }, [kind, chartType, t]);

  const isArtistTotalSlide =
    kind === 'total_top1s' && (chartType === 'album' || chartType === 'track');
  const displayName = isArtistTotalSlide
    ? row.artistName || row.name || ''
    : row.name || row.artistName || '';
  const subLabel = isArtistTotalSlide
    ? row.name || ''
    : chartType !== 'artist'
    ? row.artistName
    : '';
  const artist = chartType === 'track' || chartType === 'album' ? row.artistName : undefined;
  const spotifyType =
    chartType === 'artist' || chartType === 'album' || chartType === 'track' ? chartType : 'artist';
  const { imageUrl } = useSpotifyImage({
    entityId: row.entityId,
    name: row.name,
    artist,
    type: spotifyType as any,
    clientId,
    clientSecret,
  });

  const totalTop1s = stats?.peak?.totalTop1s as number | undefined;
  const weeksAtPeak = stats?.peak?.weeksAtPeak as number | undefined;
  const combinedTop1Title = useMemo(() => {
    if (!weeksAtPeak || weeksAtPeak < 1) return null;
    return t('charts.stats.highlights.atNumberOneNTimes', { count: weeksAtPeak });
  }, [weeksAtPeak, t]);
  const combinedSubtitle = useMemo(() => {
    if (!totalTop1s || totalTop1s < 1) return null;
    const lang = i18n.language || 'en';
    if (lang.startsWith('pt'))
      return t('charts.stats.highlights.artistNthNumber1', { n: totalTop1s });
    const s = (k: number) => {
      const j = k % 10,
        h = k % 100;
      if (j === 1 && h !== 11) return 'st';
      if (j === 2 && h !== 12) return 'nd';
      if (j === 3 && h !== 13) return 'rd';
      return 'th';
    };
    return t('charts.stats.highlights.artistNthNumber1_en', {
      n: totalTop1s,
      suffix: s(totalTop1s),
    });
  }, [totalTop1s, i18n.language, t]);

  return (
    <Paper
      withBorder
      radius="md"
      shadow="md"
      h="100%"
      style={{ overflow: 'hidden', position: 'relative' }}
    >
      <Box
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: imageUrl ? 'none' : 'none',
          willChange: 'background-position',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.05) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      <Flex
        align="center"
        justify="space-between"
        h="100%"
        px="xl"
        style={{
          position: 'relative',
          zIndex: 1,
          gap: 16,
        }}
        className={styles.slidecardFlexResponsive}
      >
        <Box
          style={{
            maxWidth: '55%',
            background: 'rgba(0,0,0,0.18)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
          className={styles.slidecardLeftResponsive}
        >
          <Flex align="center" gap={12}>
            {imageUrl && (
              <Box
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                  flex: '0 0 auto',
                }}
              >
                <img
                  src={imageUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
            )}
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <Title
                order={2} // Mantém o order 2 para telas grandes
                c="#fff"
                fw={700}
                className={styles.responsiveTitle} // Adicione esta classe
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {displayName}
              </Title>
              <Text
                size="sm" // Mantém o size sm para telas grandes
                c="#f0f0f0"
                className={styles.responsiveText} // Adicione esta classe
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {subLabel}
              </Text>
            </Box>
          </Flex>
        </Box>
        <Box
          style={{
            textAlign: 'right',
            background: 'rgba(0,0,0,0.18)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
          className={styles.slidecardRightResponsive}
        >
          {!isArtistTotalSlide &&
            !(
              kind === 'top1' &&
              (chartType === 'album' || chartType === 'track') &&
              (weeksAtPeak || totalTop1s)
            ) && (
              <Title
                order={3} // Mantém o order 3 para telas grandes
                c="#fff"
                fw={700}
                className={styles.responsiveTitleRight} // Adicione esta classe
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
              >
                {titleRight}
              </Title>
            )}
          {kind === 'top1' &&
            (chartType === 'album' || chartType === 'track') &&
            (weeksAtPeak || totalTop1s) && (
              <>
                <Title
                  order={3}
                  c="#fff"
                  className={styles.responsiveTitleRight}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  {combinedTop1Title}
                </Title>
                {combinedSubtitle && (
                  <Text c="#fff" size="sm" className={styles.responsiveTextRight}>
                    {combinedSubtitle}
                  </Text>
                )}
              </>
            )}
          {kind === 'climb' && typeof row.deltaRank === 'number' && (
            <Text c="#fff" size="sm" className={styles.responsiveTextRight}>
              {t('charts.stats.highlights.climbDetail', { delta: row.deltaRank, rank: row.rank })}
            </Text>
          )}
          {kind === 'debut' && (
            <Text c="#fff" size="sm" className={styles.responsiveTextRight}>
              {t('charts.stats.highlights.debutDetail', { rank: row.rank })}
            </Text>
          )}
          {kind === 'reentry' && (
            <Text c="#fff" size="sm" className={styles.responsiveTextRight}>
              {t('charts.stats.highlights.reentryDetail', { rank: row.rank })}
            </Text>
          )}
          {!(chartType === 'album' || chartType === 'track') &&
            kind === 'top1' &&
            stats?.peak?.weeksAtPeak && (
              <Text c="#fff" size="sm" className={styles.responsiveTextRight}>
                {t('charts.stats.highlights.top1Detail', { count: stats.peak.weeksAtPeak })}
              </Text>
            )}
          {/* For total_top1s we already show the highlight as the main title */}
        </Box>
      </Flex>
    </Paper>
  );
}

export default SlideCard;
