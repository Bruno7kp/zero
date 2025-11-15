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
  const [leadersChartType, setLeadersChartType] = React.useState<'artist' | 'album' | 'track'>(
    'track'
  );
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
      type: SpotifyEntityType;
      name: string;
      artistName: string;
      plays: number;
      entityId: string;
      week: string;
      imageUrl?: string;
    }>
  >([]);
  const [highestPlays, setHighestPlays] = React.useState<
    Array<{
      type: SpotifyEntityType;
      name: string;
      artistName: string;
      plays: number;
      entityId: string;
      week: string;
      imageUrl?: string;
    }>
  >([]);
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

        // Rank Leaders - random type, filtered by current year
        const randomLeaderType = CHART_TYPES[Math.floor(Math.random() * CHART_TYPES.length)];
        const currentYear = new Date().getFullYear();

        const leaders = await getTimesAtRank({
          chartId,
          chartType: randomLeaderType,
          rank: 1,
          year: String(currentYear),
        });

        const topLeaders = leaders.slice(0, 8);
        const images = await fetchSpotifyImagesBatch(
          topLeaders.map(entity => ({
            entityId: entity.entityId,
            name: entity.name,
            artistName: entity.artistName,
            type: randomLeaderType,
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

        // Most Points - top artist, album, and track (filtered by current year)
        const [artistPoints, albumPoints, trackPoints] = await Promise.all([
          getPointsAccumulators({
            chartId,
            chartType: 'artist',
            year: String(currentYear),
          }),
          getPointsAccumulators({
            chartId,
            chartType: 'album',
            year: String(currentYear),
          }),
          getPointsAccumulators({
            chartId,
            chartType: 'track',
            year: String(currentYear),
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

        // Biggest Debuts of current year - one of each type
        const [artistDebuts, albumDebuts, trackDebuts] = await Promise.all([
          getBestDebuts({
            chartId,
            chartType: 'artist',
            year: String(currentYear),
          }),
          getBestDebuts({
            chartId,
            chartType: 'album',
            year: String(currentYear),
          }),
          getBestDebuts({
            chartId,
            chartType: 'track',
            year: String(currentYear),
          }),
        ]);

        const latestDebuts: Array<{
          type: SpotifyEntityType;
          name: string;
          artistName: string;
          entityId: string;
          plays: number;
          week: string;
        }> = [];

        if (artistDebuts[0]) {
          latestDebuts.push({
            type: 'artist',
            name: artistDebuts[0].name,
            artistName: artistDebuts[0].artistName,
            entityId: artistDebuts[0].entityId,
            plays: artistDebuts[0].plays,
            week: artistDebuts[0].week,
          });
        }

        if (albumDebuts[0]) {
          latestDebuts.push({
            type: 'album',
            name: albumDebuts[0].name,
            artistName: albumDebuts[0].artistName,
            entityId: albumDebuts[0].entityId,
            plays: albumDebuts[0].plays,
            week: albumDebuts[0].week,
          });
        }

        if (trackDebuts[0]) {
          latestDebuts.push({
            type: 'track',
            name: trackDebuts[0].name,
            artistName: trackDebuts[0].artistName,
            entityId: trackDebuts[0].entityId,
            plays: trackDebuts[0].plays,
            week: trackDebuts[0].week,
          });
        }

        // No need to sort - getBestDebuts already returns sorted by plays (highest first)

        const debutsImages = latestDebuts.length
          ? await fetchSpotifyImagesBatch(
              latestDebuts.map(item => ({
                entityId: item.entityId,
                name: item.name,
                artistName: item.artistName,
                type: item.type,
              }))
            )
          : {};

        // Highest Plays in a Week of current year - one of each type
        const [artistPlays, albumPlays, trackPlays] = await Promise.all([
          getHighestPlays({
            chartId,
            chartType: 'artist',
            year: String(currentYear),
          }),
          getHighestPlays({
            chartId,
            chartType: 'album',
            year: String(currentYear),
          }),
          getHighestPlays({
            chartId,
            chartType: 'track',
            year: String(currentYear),
          }),
        ]);

        const topPlaysData: Array<{
          type: SpotifyEntityType;
          name: string;
          artistName: string;
          entityId: string;
          plays: number;
          week: string;
        }> = [];

        if (artistPlays[0]) {
          topPlaysData.push({
            type: 'artist',
            name: artistPlays[0].name,
            artistName: artistPlays[0].artistName,
            entityId: artistPlays[0].entityId,
            plays: artistPlays[0].plays,
            week: artistPlays[0].week,
          });
        }

        if (albumPlays[0]) {
          topPlaysData.push({
            type: 'album',
            name: albumPlays[0].name,
            artistName: albumPlays[0].artistName,
            entityId: albumPlays[0].entityId,
            plays: albumPlays[0].plays,
            week: albumPlays[0].week,
          });
        }

        if (trackPlays[0]) {
          topPlaysData.push({
            type: 'track',
            name: trackPlays[0].name,
            artistName: trackPlays[0].artistName,
            entityId: trackPlays[0].entityId,
            plays: trackPlays[0].plays,
            week: trackPlays[0].week,
          });
        }

        // No need to sort - getHighestPlays already returns sorted by plays (highest first)

        const playsImages = topPlaysData.length
          ? await fetchSpotifyImagesBatch(
              topPlaysData.map(item => ({
                entityId: item.entityId,
                name: item.name,
                artistName: item.artistName,
                type: item.type,
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
        setLeadersChartType(randomLeaderType);

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
          latestDebuts.map(item => ({
            type: item.type,
            name: item.name,
            artistName: item.artistName,
            plays: item.plays,
            entityId: item.entityId,
            week: item.week,
            imageUrl: debutsImages[item.entityId],
          }))
        );

        setHighestPlays(
          topPlaysData.map(item => ({
            type: item.type,
            name: item.name,
            artistName: item.artistName,
            plays: item.plays,
            entityId: item.entityId,
            week: item.week,
            imageUrl: playsImages[item.entityId],
          }))
        );
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
    'latest-number-one': (
      <LatestNumberOneCard
        key="latest-number-one"
        loading={loading}
        cardBg={cardBg}
        numberOneTrend={numberOneTrend}
        chartType={'track'}
      />
    ),
    'rank-dominance': (
      <RankDominanceCard
        key="rank-dominance"
        loading={loading}
        cardBg={cardBg}
        rankLeaders={rankLeaders}
        chartType={leadersChartType}
        year={new Date().getFullYear()}
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
        year={new Date().getFullYear()}
      />
    ),
    'biggest-debuts': (
      <BiggestDebutsCard
        key="biggest-debuts"
        loading={loading}
        cardBg={cardBg}
        debuts={biggestDebuts}
      />
    ),
    'highest-plays': (
      <HighestPlaysInWeekCard
        key="highest-plays"
        loading={loading}
        cardBg={cardBg}
        highestPlays={highestPlays}
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
