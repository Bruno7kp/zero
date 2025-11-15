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
  getPointsAccumulators,
  getBestDebuts,
  getHighestPlays,
} from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { fetchSpotifyImagesBatch } from '../../../utils/spotifyImageLoader';
// No sync or top1 summary on this page for now
import {
  LatestNumberOneCard,
  RankDominanceCard,
  MiniMostPointsCard,
  MiniBiggestDebutsCard,
  MiniHighestPlaysInWeekCard,
} from '../../../components/stats/overview';
import Masonry from 'react-masonry-css';
import storage from '../../../utils/storage';
import KEYS from '../../../constants/storageKeys';

const CARD_IDS = [
  'latest-number-one',
  'rank-dominance',
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

const StatsVisualizationsOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const cardBg = getCardBackgroundByMode(theme, themeMode);
  const sensors = useSensors(useSensor(PointerSensor, sensorsOptions));
  // No refresh key needed on this view (
  const breakpointColumns = React.useMemo(
    () => ({
      default: 2,
      1100: 2,
      700: 1,
      500: 1,
    }),
    []
  );
  // Use a separate persistence key so this visualizations page can have its own card order
  const [cardOrder, setCardOrder] = React.useState<CardId[]>(() =>
    normalizeCardOrder(storage.getJson<CardId[]>(KEYS.STATS_VISUALIZATIONS_OVERVIEW_CARD_ORDER))
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
  const [topPoints, setTopPoints] = React.useState<Array<any>>([]);
  const [biggestDebuts, setBiggestDebuts] = React.useState<Array<any>>([]);
  const [highestPlays, setHighestPlays] = React.useState<Array<any>>([]);
  // Only latest number one trend and rank leaders are needed here
  React.useEffect(() => {
    setCardOrder(prev => {
      const normalized = normalizeCardOrder(prev);
      const unchanged =
        normalized.length === prev.length && normalized.every((id, index) => prev[index] === id);
      if (unchanged) {
        return prev;
      }
      storage.setJson(KEYS.STATS_VISUALIZATIONS_OVERVIEW_CARD_ORDER, normalized);
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
      storage.setJson(KEYS.STATS_VISUALIZATIONS_OVERVIEW_CARD_ORDER, next);
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

        // Most Points - fetch the top 8 items for the randomly chosen chartType (current year)
        const pointsAcc = await getPointsAccumulators({
          chartId,
          chartType: randomLeaderType,
          year: String(currentYear),
        });

        const topPointsCandidates: Array<any> = pointsAcc.slice(0, 8).map((p: any) => ({
          type: randomLeaderType,
          name: p.name,
          artistName: p.artistName,
          totalPoints: p.totalPoints,
          entityId: p.entityId,
        }));

        const topPointsImages = await fetchSpotifyImagesBatch(
          topPointsCandidates.map(entity => ({
            entityId: entity.entityId,
            name: entity.name,
            artistName: entity.artistName,
            type: entity.type,
          }))
        );

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

        setTopPoints(
          topPointsCandidates.map(entity => ({
            ...entity,
            imageUrl: topPointsImages[entity.entityId],
          }))
        );

        // Biggest Debuts (one per type) - filtered by current year
        // Biggest Debuts - top 8 for the selected random type (filtered by current year)
        const debuts = await getBestDebuts({
          chartId,
          chartType: randomLeaderType,
          year: String(currentYear),
        });

        const latestDebuts = debuts.slice(0, 8).map((d: any) => ({ type: randomLeaderType, ...d }));

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

        setBiggestDebuts(
          latestDebuts.map(item => ({
            ...item,
            imageUrl: debutsImages[item.entityId],
          }))
        );

        // Highest plays in a week (one per type)
        // Highest plays in a week - top 8 for the selected random type
        const plays = await getHighestPlays({
          chartId,
          chartType: randomLeaderType,
          year: String(currentYear),
        });

        // Reduce to one entry per entity using the highest plays for that entity
        const byEntity = new Map<string, any>();
        for (const p of plays) {
          const existing = byEntity.get(p.entityId);
          if (!existing || p.plays > existing.plays) {
            byEntity.set(p.entityId, p);
          }
        }

        const uniquePlays = Array.from(byEntity.values()).sort((a, b) => b.plays - a.plays);
        const topPlaysData = uniquePlays
          .slice(0, 8)
          .map((p: any) => ({ type: randomLeaderType, ...p }));

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

        setHighestPlays(
          topPlaysData.map(item => ({
            ...item,
            imageUrl: playsImages[item.entityId],
          }))
        );

        // no-op for other visuals in this page
      } catch (error) {
        console.error('[visualizations] Failed to load overview data', error);
        if (mounted) {
          setNumberOneTrend([]);
          setRankLeaders([]);
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
    'most-points': (
      <MiniMostPointsCard
        key="most-points"
        loading={loading}
        cardBg={cardBg}
        items={topPoints}
        chartType={leadersChartType}
        limit={8}
      />
    ),
    'biggest-debuts': (
      <MiniBiggestDebutsCard
        key="biggest-debuts"
        loading={loading}
        cardBg={cardBg}
        items={biggestDebuts}
        chartType={leadersChartType}
        limit={5}
      />
    ),
    'highest-plays': (
      <MiniHighestPlaysInWeekCard
        key="highest-plays"
        loading={loading}
        cardBg={cardBg}
        items={highestPlays}
        chartType={leadersChartType}
        limit={5}
      />
    ),
    // Only keep the two requested overview cards for now
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

export default StatsVisualizationsOverviewPage;
