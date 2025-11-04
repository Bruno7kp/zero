import React from 'react';
import { Stack, Alert, Anchor, Text, useMantineTheme } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db } from '../../../db/indexedDb';
import {
  getTimesAtRank,
  getPerfectAllKills,
  getPointsAccumulators,
  getBestDebuts,
  getHighestPlays,
} from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { fetchSpotifyImagesBatch, type SpotifyEntityType } from '../../../utils/spotifyImageLoader';
import { ChartSyncProgress } from '../../../components/chartPage/ChartSyncProgress';
import { ChartWeekTop1Summary } from '../../../components/chartPage/ChartWeekTop1Summary';
import { ChartLiveSummary } from '../../../components/chartPage/ChartLiveSummary';
import {
  LatestNumberOneCard,
  RankDominanceCard,
  LastPerfectAllKillCard,
  MostPointsCard,
  BiggestDebutsCard,
  HighestPlaysInWeekCard,
} from '../../../components/stats/overview';
import Masonry from 'react-masonry-css';
import storage from '../../../utils/storage';
import KEYS from '../../../constants/storageKeys';

const CARD_IDS = [
  'sync-progress',
  'top1-summary',
  'live-summary',
  'latest-number-one',
  'rank-dominance',
  'last-pak',
  'most-points',
  'biggest-debuts',
  'highest-plays',
] as const;

type CardId = (typeof CARD_IDS)[number];

const CARD_ID_SET = new Set<string>(CARD_IDS as readonly string[]);

const isCardId = (value: string): value is CardId => CARD_ID_SET.has(value);

const normalizeCardOrder = (order: string[] | null | undefined): CardId[] => {
  const cleaned: CardId[] = [];
  if (Array.isArray(order)) {
    for (const id of order) {
      if (isCardId(id) && !cleaned.includes(id)) {
        cleaned.push(id);
      }
    }
  }
  for (const id of CARD_IDS) {
    if (!cleaned.includes(id)) {
      cleaned.push(id);
    }
  }
  return cleaned;
};

const sensorsOptions = {
  activationConstraint: { distance: 8 },
};

const SortableCard: React.FC<{ id: CardId; children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} style={{ cursor: 'grab' }}>
        {children}
      </div>
    </div>
  );
};

const LATEST_NUMBER_ONE_COUNT = 8;
const TOP_DEBUTS_COUNT = 8;
const TOP_PLAYS_COUNT = 8;
const CHART_TYPES: Array<'artist' | 'album' | 'track'> = ['artist', 'album', 'track'];
interface RankLeaderPreview {
  id: string;
  value: number;
  entityId: string;
  artistName?: string;
  imageUrl?: string;
}

const StatsVisualizationsOverview: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const cardBg = getCardBackgroundByMode(theme, themeMode);
  const sensors = useSensors(useSensor(PointerSensor, sensorsOptions));
  const [refreshKey, setRefreshKey] = React.useState(0);
  const breakpointColumns = React.useMemo(
    () => ({
      default: 2,
      1100: 2,
      700: 1,
      500: 1,
    }),
    []
  );
  const [cardOrder, setCardOrder] = React.useState<CardId[]>(() =>
    normalizeCardOrder(storage.getJson<CardId[]>(KEYS.STATS_OVERVIEW_CARD_ORDER))
  );

  const [loading, setLoading] = React.useState(false);
  const [numberOneTrend, setNumberOneTrend] = React.useState<
    Array<{
      week: string;
      plays: number;
      name: string;
      artistName?: string;
      imageUrl?: string;
    }>
  >([]);
  const [rankLeaders, setRankLeaders] = React.useState<RankLeaderPreview[]>([]);
  const [lastPAK, setLastPAK] = React.useState<{
    artistName: string;
    albumName: string;
    trackName: string;
    artistImageUrl?: string;
    albumImageUrl?: string;
    trackImageUrl?: string;
    week: string;
  } | null>(null);
  const [topPoints, setTopPoints] = React.useState<
    Array<{
      type: SpotifyEntityType;
      name: string;
      artistName: string;
      totalPoints: number;
      entityId: string;
      imageUrl?: string;
    }>
  >([]);
  const [biggestDebuts, setBiggestDebuts] = React.useState<
    Array<{
      name: string;
      artistName?: string;
      plays: number;
      entityId: string;
      imageUrl?: string;
    }>
  >([]);
  const [debutsChartType, setDebutsChartType] = React.useState<'artist' | 'album' | 'track'>(
    'track'
  );
  const [highestPlays, setHighestPlays] = React.useState<
    Array<{
      name: string;
      artistName?: string;
      plays: number;
      entityId: string;
      imageUrl?: string;
    }>
  >([]);
  const [playsChartType, setPlaysChartType] = React.useState<'artist' | 'album' | 'track'>('track');
  React.useEffect(() => {
    setCardOrder(prev => {
      const normalized = normalizeCardOrder(prev);
      const unchanged =
        normalized.length === prev.length && normalized.every((id, index) => prev[index] === id);
      if (unchanged) {
        return prev;
      }
      storage.setJson(KEYS.STATS_OVERVIEW_CARD_ORDER, normalized);
      return normalized;
    });
  }, []);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setCardOrder(prev => {
      const oldIndex = prev.indexOf(active.id as CardId);
      const newIndex = prev.indexOf(over.id as CardId);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      const next = arrayMove(prev, oldIndex, newIndex);
      storage.setJson(KEYS.STATS_OVERVIEW_CARD_ORDER, next);
      return next;
    });
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!chart) return;
      setLoading(true);
      try {
        const chartId = String(chart.id);

        // Latest Number Ones
        const rankOneCollection = db.charts_data
          .where('[chartId+chartType]')
          .equals([chartId, 'track'])
          .and(item => item.rank === 1);

        const rankOne = await rankOneCollection.sortBy('week');
        const lastNumberOnes = rankOne.slice(-LATEST_NUMBER_ONE_COUNT);

        const lastImages = await fetchSpotifyImagesBatch(
          lastNumberOnes.map(item => ({
            entityId: item.entityId,
            name: item.name,
            artistName: item.artistName,
            type: 'track',
          }))
        );

        // Rank Leaders
        const leaders = await getTimesAtRank({
          chartId,
          chartType: 'track',
          rank: 1,
        });

        const topLeaders = leaders.slice(0, 8);
        const images = await fetchSpotifyImagesBatch(
          topLeaders.map(entity => ({
            entityId: entity.entityId,
            name: entity.name,
            artistName: entity.artistName,
            type: 'track',
          }))
        );

        // Last Perfect All Kill
        const paks = await getPerfectAllKills(chartId);
        const latestPAK = paks.length > 0 ? paks[paks.length - 1] : null;
        let pakImages: Record<string, string | undefined> = {};
        if (latestPAK) {
          const imageRequests: Array<{
            entityId: string;
            name: string;
            artistName?: string;
            type: SpotifyEntityType;
          }> = [
            {
              entityId: latestPAK.artistEntityId,
              name: latestPAK.artistName,
              artistName: latestPAK.artistName,
              type: 'artist',
            },
          ];

          if (latestPAK.albumEntityId) {
            imageRequests.push({
              entityId: latestPAK.albumEntityId,
              name: latestPAK.albumName,
              artistName: latestPAK.artistName,
              type: 'album',
            });
          }

          if (latestPAK.trackEntityId) {
            imageRequests.push({
              entityId: latestPAK.trackEntityId,
              name: latestPAK.trackName,
              artistName: latestPAK.artistName,
              type: 'track',
            });
          }

          pakImages = await fetchSpotifyImagesBatch(imageRequests);
        }

        // Most Points - top artist, album, and track
        const [artistPoints, albumPoints, trackPoints] = await Promise.all([
          getPointsAccumulators({
            chartId,
            chartType: 'artist',
          }),
          getPointsAccumulators({
            chartId,
            chartType: 'album',
          }),
          getPointsAccumulators({
            chartId,
            chartType: 'track',
          }),
        ]);

        const topPointsCandidates: Array<{
          type: SpotifyEntityType;
          name: string;
          artistName: string;
          totalPoints: number;
          entityId: string;
        }> = [];

        if (artistPoints[0]) {
          topPointsCandidates.push({
            type: 'artist',
            name: artistPoints[0].name,
            artistName: artistPoints[0].artistName,
            totalPoints: artistPoints[0].totalPoints,
            entityId: artistPoints[0].entityId,
          });
        }

        if (albumPoints[0]) {
          topPointsCandidates.push({
            type: 'album',
            name: albumPoints[0].name,
            artistName: albumPoints[0].artistName,
            totalPoints: albumPoints[0].totalPoints,
            entityId: albumPoints[0].entityId,
          });
        }

        if (trackPoints[0]) {
          topPointsCandidates.push({
            type: 'track',
            name: trackPoints[0].name,
            artistName: trackPoints[0].artistName,
            totalPoints: trackPoints[0].totalPoints,
            entityId: trackPoints[0].entityId,
          });
        }

        const topPointsImages = await fetchSpotifyImagesBatch(
          topPointsCandidates.map(entity => ({
            entityId: entity.entityId,
            name: entity.name,
            artistName: entity.artistName,
            type: entity.type,
          }))
        );

        // Biggest Debuts - random type
        const randomDebutType = CHART_TYPES[Math.floor(Math.random() * CHART_TYPES.length)];
        const debuts = await getBestDebuts({
          chartId,
          chartType: randomDebutType,
        });
        const topDebuts = debuts.slice(0, TOP_DEBUTS_COUNT);
        const debutsImages = topDebuts.length
          ? await fetchSpotifyImagesBatch(
              topDebuts.map(item => ({
                entityId: item.entityId,
                name: item.name,
                artistName: item.artistName,
                type: randomDebutType,
              }))
            )
          : {};

        // Highest Plays - random type
        const randomPlaysType = CHART_TYPES[Math.floor(Math.random() * CHART_TYPES.length)];
        const playsData = await getHighestPlays({
          chartId,
          chartType: randomPlaysType,
        });
        const topPlaysData = playsData.slice(0, TOP_PLAYS_COUNT);
        const playsImages = topPlaysData.length
          ? await fetchSpotifyImagesBatch(
              topPlaysData.map(item => ({
                entityId: item.entityId,
                name: item.name,
                artistName: item.artistName,
                type: randomPlaysType,
              }))
            )
          : {};

        if (!mounted) return;

        setNumberOneTrend(
          lastNumberOnes.map(item => ({
            week: item.week,
            plays: item.plays,
            name: item.name,
            artistName: item.artistName,
            imageUrl: lastImages[item.entityId],
          }))
        );

        setRankLeaders(
          topLeaders.map(entity => ({
            id: entity.name,
            value: entity.count,
            entityId: entity.entityId,
            artistName: entity.artistName,
            imageUrl: images[entity.entityId],
          }))
        );

        setLastPAK(
          latestPAK
            ? {
                artistName: latestPAK.artistName,
                albumName: latestPAK.albumName,
                trackName: latestPAK.trackName,
                artistImageUrl: pakImages[latestPAK.artistEntityId],
                albumImageUrl: latestPAK.albumEntityId
                  ? pakImages[latestPAK.albumEntityId]
                  : undefined,
                trackImageUrl: latestPAK.trackEntityId
                  ? pakImages[latestPAK.trackEntityId]
                  : undefined,
                week: latestPAK.week,
              }
            : null
        );

        setTopPoints(
          topPointsCandidates.map(entity => ({
            ...entity,
            imageUrl: topPointsImages[entity.entityId],
          }))
        );

        setBiggestDebuts(
          topDebuts.map(item => ({
            name: item.name,
            artistName: item.artistName,
            plays: item.plays,
            entityId: item.entityId,
            imageUrl: debutsImages[item.entityId],
          }))
        );
        setDebutsChartType(randomDebutType);

        setHighestPlays(
          topPlaysData.map(item => ({
            name: item.name,
            artistName: item.artistName,
            plays: item.plays,
            entityId: item.entityId,
            imageUrl: playsImages[item.entityId],
          }))
        );
        setPlaysChartType(randomPlaysType);
      } catch (error) {
        console.error('[visualizations] Failed to load overview data', error);
        if (mounted) {
          setNumberOneTrend([]);
          setRankLeaders([]);
          setLastPAK(null);
          setTopPoints([]);
          setBiggestDebuts([]);
          setHighestPlays([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart]);

  if (!chart) {
    return (
      <Stack gap="lg">
        <Alert icon={<IconInfoCircle />} title={t('errors.warning')}>
          <Text>{t('errors.selectActiveChart')}</Text>
          {activeChartId === null && (
            <Text mt="sm">
              <Anchor component={Link} to="/settings">
                {t('errors.noActiveChart')}
              </Anchor>
            </Text>
          )}
        </Alert>
      </Stack>
    );
  }

  const cardsById: Record<CardId, React.ReactNode> = {
    'sync-progress': (
      <ChartSyncProgress
        key="sync-progress"
        chart={chart}
        onSyncComplete={() => setRefreshKey(previous => previous + 1)}
      />
    ),
    'top1-summary': (
      <ChartWeekTop1Summary key="top1-summary" chartId={`${chart.id}`} refreshKey={refreshKey} />
    ),
    'live-summary': <ChartLiveSummary key="live-summary" />,
    'latest-number-one': (
      <LatestNumberOneCard
        key="latest-number-one"
        loading={loading}
        cardBg={cardBg}
        numberOneTrend={numberOneTrend}
      />
    ),
    'rank-dominance': (
      <RankDominanceCard
        key="rank-dominance"
        loading={loading}
        cardBg={cardBg}
        rankLeaders={rankLeaders}
      />
    ),
    'last-pak': (
      <LastPerfectAllKillCard key="last-pak" loading={loading} cardBg={cardBg} lastPAK={lastPAK} />
    ),
    'most-points': (
      <MostPointsCard
        key="most-points"
        loading={loading}
        cardBg={cardBg}
        topArtists={topPoints.map(item => ({
          type: item.type,
          name: item.name,
          artistName: item.artistName,
          entityId: item.entityId,
          totalPoints: item.totalPoints,
          imageUrl: item.imageUrl,
        }))}
      />
    ),
    'biggest-debuts': (
      <BiggestDebutsCard
        key="biggest-debuts"
        loading={loading}
        cardBg={cardBg}
        debuts={biggestDebuts}
        chartType={debutsChartType}
      />
    ),
    'highest-plays': (
      <HighestPlaysInWeekCard
        key="highest-plays"
        loading={loading}
        cardBg={cardBg}
        highestPlays={highestPlays}
        chartType={playsChartType}
      />
    ),
  };

  return (
    <Stack gap="lg">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <Masonry
            breakpointCols={breakpointColumns}
            className="masonry-grid"
            columnClassName="masonry-column"
          >
            {cardOrder.map(id => {
              const content = cardsById[id];
              if (!content) {
                return null;
              }
              return (
                <SortableCard key={id} id={id}>
                  {content}
                </SortableCard>
              );
            })}
          </Masonry>
        </SortableContext>
      </DndContext>
    </Stack>
  );
};

export default StatsVisualizationsOverview;
