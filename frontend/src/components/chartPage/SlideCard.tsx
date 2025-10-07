import { useEffect, useMemo, useRef } from 'react';
import { Paper, Box, Flex, Title, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ChartData } from '../../db/indexedDb';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';

export type SlideKind = 'top1' | 'debut' | 'climb' | 'reentry' | 'weeks';

interface SlideCardProps {
  row: ChartData;
  kind: SlideKind;
  chartType: 'artist' | 'album' | 'track' | string;
  clientId: string;
  clientSecret: string;
}

export function SlideCard({ row, kind, chartType, clientId, clientSecret }: SlideCardProps) {
  const { t } = useTranslation();
  const bgRef = useRef<HTMLDivElement | null>(null);

  const titleRight = useMemo(() => {
    switch (kind) {
      case 'top1': return t('charts.stats.highlights.top1');
      case 'debut': return t('charts.stats.highlights.debut');
      case 'climb': return t('charts.stats.highlights.climb');
      case 'reentry': return t('charts.stats.highlights.reentry');
      case 'weeks': return t('charts.stats.highlights.weeks');
      default: return '';
    }
  }, [kind, t]);

  const displayName = row.name || row.artistName || '';
  const artist = chartType === 'track' || chartType === 'album' ? row.artistName : undefined;
  const spotifyType = (chartType === 'artist' || chartType === 'album' || chartType === 'track') ? chartType : 'artist';
  const { imageUrl } = useSpotifyImage({ entityId: row.entityId, name: row.name, artist, type: spotifyType as any, clientId, clientSecret });

  // Subtle background pan animation (respects reduced-motion)
  useEffect(() => {
    if (!imageUrl) return;
    const prefersReduced = typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const el = bgRef.current;
    if (!el || !('animate' in el)) return;
    const anim = (el as any).animate(
      [
        { backgroundPosition: 'center 10%' },
        { backgroundPosition: 'center 50%' },
      ],
      { duration: 8000, easing: 'ease-in-out', direction: 'alternate', iterations: Infinity }
    );
    return () => { try { anim?.cancel?.(); } catch { /* ignore */ } };
  }, [imageUrl]);

  return (
    <Paper withBorder radius="md" shadow="md" h="100%" style={{ overflow: 'hidden', position: 'relative' }}>
      <Box
        ref={bgRef}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center 10%', filter: imageUrl ? 'none' : 'none', willChange: 'background-position',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.05) 100%)',
          backdropFilter: 'blur(0)',
          WebkitBackdropFilter: 'blur(0)'
        }}
      />
  <Flex align="center" justify="space-between" h="100%" px="xl" style={{ position: 'relative', zIndex: 1, gap: 16 }}>
        <Box
          style={{
            maxWidth: '55%',
            background: 'rgba(0,0,0,0.18)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <Flex align="center" gap={12}>
            {imageUrl && (
              <Box style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.35)', flex: '0 0 auto' }}>
                <img src={imageUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </Box>
            )}
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <Title order={2} c="#fff" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{displayName}</Title>
              <Text c="#f0f0f0" size="sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {chartType !== 'artist' ? row.artistName : ''}
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
        >
          <Title order={3} c="#fff" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{titleRight}</Title>
          {kind === 'climb' && typeof row.deltaRank === 'number' && (
            <Text c="#fff" size="sm">
              {t('charts.stats.highlights.climbDetail', { delta: row.deltaRank, rank: row.rank })}
            </Text>
          )}
          {kind === 'debut' && (
            <Text c="#fff" size="sm">{t('charts.stats.highlights.debutDetail', { rank: row.rank })}</Text>
          )}
          {kind === 'reentry' && (
            <Text c="#fff" size="sm">{t('charts.stats.highlights.reentryDetail', { rank: row.rank })}</Text>
          )}
        </Box>
      </Flex>
    </Paper>
  );
}

export default SlideCard;
