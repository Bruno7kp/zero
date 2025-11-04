import React from 'react';
import {
  Stack,
  Alert,
  Anchor,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db } from '../../../db/indexedDb';
import { getTimesAtRank, getPerfectAllKills, getPointsAccumulators, getBestDebuts, getHighestPlays } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { fetchSpotifyImagesBatch } from '../../../utils/spotifyImageLoader';
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
  NumberOneHistoryCard,
  PlaysHistoryCard,
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
  'number-one-history',
  'plays-history',
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
const NUMBER_ONE_HISTORY_COUNT = 15;
const TOP_DEBUTS_COUNT = 5;
const TOP_PLAYS_COUNT = 5;

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
    week: string;
  } | null>(null);
  const [topPoints, setTopPoints] = React.useState<Array<{
    name: string;
    totalPoints: number;
    entityId: string;
    rank: number;
  }>>([]);
  const [biggestDebuts, setBiggestDebuts] = React.useState<Array<{
    name: string;
    artistName?: string;
    plays: number;
    entityId: string;
  }>>([]);
  const [debutsChartType, setDebutsChartType] = React.useState<'artist' | 'album' | 'track'>('track');
  const [highestPlays, setHighestPlays] = React.useState<Array<{
    name: string;
    artistName?: string;
    plays: number;
    entityId: string;
  }>>([]);
  const [playsChartType, setPlaysChartType] = React.useState<'artist' | 'album' | 'track'>('track');
  const [numberOneHistory, setNumberOneHistory] = React.useState<Array<{
    week: string;
    artistName: string;
    plays: number;
  }>>([]);

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
        let pakImage: string | undefined;
        if (latestPAK) {
          const pakImages = await fetchSpotifyImagesBatch([
            {
              entityId: latestPAK.artistEntityId,
              name: latestPAK.artistName,
              artistName: latestPAK.artistName,
              type: 'artist',
            },
          ]);
          pakImage = pakImages[latestPAK.artistEntityId];
        }

        // Most Points - get top 10 and select random 3-position range
        const pointsData = await getPointsAccumulators({
          chartId,
          chartType: 'artist',
        });
        const topPointsArtists = pointsData.slice(0, 10);
        const randomRanges = [[0, 2], [3, 5], [6, 8]];
        const randomRange = randomRanges[Math.floor(Math.random() * randomRanges.length)];
        const selectedPoints = topPointsArtists.slice(randomRange[0], randomRange[1] + 1);

        // Biggest Debuts - random type
        const debutTypes: Array<'artist' | 'album' | 'track'> = ['artist', 'album', 'track'];
        const randomDebutType = debutTypes[Math.floor(Math.random() * debutTypes.length)];
        const debuts = await getBestDebuts({
          chartId,
          chartType: randomDebutType,
        });
        const topDebuts = debuts.slice(0, TOP_DEBUTS_COUNT);

        // Highest Plays - random type
        const playsTypes: Array<'artist' | 'album' | 'track'> = ['artist', 'album', 'track'];
        const randomPlaysType = playsTypes[Math.floor(Math.random() * playsTypes.length)];
        const playsData = await getHighestPlays({
          chartId,
          chartType: randomPlaysType,
        });
        const topPlaysData = playsData.slice(0, TOP_PLAYS_COUNT);

        // Number One History - last 15 weeks
        const historyData = rankOne.slice(-NUMBER_ONE_HISTORY_COUNT);

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
                artistImageUrl: pakImage,
                week: latestPAK.week,
              }
            : null
        );

        setTopPoints(
          selectedPoints.map((entity, index) => ({
            name: entity.name,
            totalPoints: entity.totalPoints,
            entityId: entity.entityId,
            rank: randomRange[0] + index + 1,
          }))
        );

        setBiggestDebuts(
          topDebuts.map(item => ({
            name: item.name,
            artistName: item.artistName,
            plays: item.plays,
            entityId: item.entityId,
          }))
        );
        setDebutsChartType(randomDebutType);

        setHighestPlays(
          topPlaysData.map(item => ({
            name: item.name,
            artistName: item.artistName,
            plays: item.plays,
            entityId: item.entityId,
          }))
        );
        setPlaysChartType(randomPlaysType);

        setNumberOneHistory(
          historyData.map(item => ({
            week: item.week,
            artistName: item.artistName || item.name,
            plays: item.plays,
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
          setNumberOneHistory([]);
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
      <LastPerfectAllKillCard
        key="last-pak"
        loading={loading}
        cardBg={cardBg}
        lastPAK={lastPAK}
      />
    ),
    'most-points': (
      <MostPointsCard
        key="most-points"
        loading={loading}
        cardBg={cardBg}
        topArtists={topPoints.map(item => ({
          type: 'artist' as const,
          name: item.name,
          artistName: item.name,
          entityId: item.entityId,
          totalPoints: item.totalPoints,
          rank: item.rank,
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
    'number-one-history': (
      <NumberOneHistoryCard
        key="number-one-history"
        loading={loading}
        cardBg={cardBg}
        history={numberOneHistory}
      />
    ),
    'plays-history': (
      <PlaysHistoryCard
        key="plays-history"
        loading={loading}
        cardBg={cardBg}
        history={numberOneHistory}
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
