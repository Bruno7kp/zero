import { useMemo, useRef } from 'react';
import { Paper, Box, Flex, Title, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ChartData } from '../../db/indexedDb';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import styles from './SlideCard.module.css';

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

    return (
        <Paper withBorder radius="md" shadow="md" h="100%" style={{ overflow: 'hidden', position: 'relative' }}>
            <Box
                ref={bgRef}
                style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center', filter: imageUrl ? 'none' : 'none', willChange: 'background-position',
                }}
            />
            <Box
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.05) 100%)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
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
                            <Box style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.35)', flex: '0 0 auto' }}>
                                <img src={imageUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </Box>
                        )}
                        <Box style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                            <Title
                                order={2} // Mantém o order 2 para telas grandes
                                c="#fff"
                                className={styles.responsiveTitle} // Adicione esta classe
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                            >
                                {displayName}
                            </Title>
                            <Text
                                size="sm" // Mantém o size sm para telas grandes
                                c="#f0f0f0"
                                className={styles.responsiveText} // Adicione esta classe
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
                            >
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
                    className={styles.slidecardRightResponsive}
                >
                    <Title
                            order={3} // Mantém o order 3 para telas grandes
                            c="#fff"
                            className={styles.responsiveTitleRight} // Adicione esta classe
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                        >
                            {titleRight}
                        </Title>
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
                </Box>
            </Flex>
        </Paper>
    );
}

export default SlideCard;
